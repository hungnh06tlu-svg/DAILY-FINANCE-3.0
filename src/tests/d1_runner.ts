/**
 * Daily Finance 3.0 — D1 Core Financial Model Standardization Test Suite Runner
 */

import {
  MoneyUtils,
  SpaceIsolationGuard,
  TransactionLifecycleGuard,
  CanonicalMetadata,
  DomainAdapters,
  DEFAULT_CURRENCY_CODE
} from '../domain/CanonicalFinancialModel';
import { Transaction, Wallet } from '../types';

export interface D1TestResult {
  name: string;
  category: 'Money' | 'Space' | 'Transaction' | 'Metadata' | 'Adapters';
  passed: boolean;
  message: string;
}

export class D1TestSuite {
  static runAllTests(): D1TestResult[] {
    const results: D1TestResult[] = [];

    const assert = (name: string, category: D1TestResult['category'], condition: boolean, failureMsg: string) => {
      results.push({
        name,
        category,
        passed: condition,
        message: condition ? 'PASSED' : failureMsg
      });
    };

    // 1. D1-001: Money & Currency
    try {
      const m = MoneyUtils.create(100000);
      assert('Money defaults to VND', 'Money', m.amount === 100000 && m.currency === DEFAULT_CURRENCY_CODE && m.scale === 0, `Got ${JSON.stringify(m)}`);

      const usd = MoneyUtils.create(49.99, 'USD');
      assert('Money supports USD with decimal scale', 'Money', usd.amount === 49.99 && usd.currency === 'USD' && usd.scale === 2, `Got ${JSON.stringify(usd)}`);

      const zero = MoneyUtils.zero('VND');
      const pos = MoneyUtils.create(5000, 'VND');
      assert('Money identifies zero and positive values', 'Money', MoneyUtils.isZero(zero) && MoneyUtils.isPositive(pos), 'Zero/positive check failed');

      const formatted = MoneyUtils.format(500000, 'VND', 'vi');
      assert('Money formats currency output safely', 'Money', formatted.includes('500'), `Got ${formatted}`);

      const rounded = MoneyUtils.round(10.12345, 2);
      assert('Money rounds decimal noise accurately', 'Money', rounded === 10.12, `Got ${rounded}`);
    } catch (err: any) {
      results.push({ name: 'Money Suite', category: 'Money', passed: false, message: err?.message || 'Error' });
    }

    // 2. D1-002: FinancialSpace Isolation
    try {
      const validSpace = SpaceIsolationGuard.validateSpaceId('sp_personal');
      assert('SpaceIsolationGuard validates non-empty spaceId', 'Space', validSpace === 'sp_personal', 'Valid space failed');

      let thrown = false;
      try {
        SpaceIsolationGuard.validateSpaceId('');
      } catch {
        thrown = true;
      }
      assert('SpaceIsolationGuard throws on empty spaceId', 'Space', thrown, 'Failed to throw on empty spaceId');

      const wallet: Wallet = {
        id: 'w_1',
        spaceId: 'sp_personal',
        name: 'Ví chính',
        type: 'cash',
        currency: 'VND',
        initialBalance: 0,
        currentBalance: 100000,
        status: 'active'
      };

      assert('SpaceIsolationGuard verifies space match', 'Space', SpaceIsolationGuard.verifyEntitySpaceMatch(wallet, 'sp_personal'), 'Space match failed');

      const items = [
        { id: '1', spaceId: 'sp_personal' },
        { id: '2', spaceId: 'sp_business' }
      ];
      const filtered = SpaceIsolationGuard.filterBySpace(items, 'sp_personal');
      assert('SpaceIsolationGuard filters items strictly by spaceId', 'Space', filtered.length === 1 && filtered[0].id === '1', 'Filter failed');
    } catch (err: any) {
      results.push({ name: 'Space Suite', category: 'Space', passed: false, message: err?.message || 'Error' });
    }

    // 3. D1-003: Transaction & Transfer Rules
    try {
      const tx: Partial<Transaction> = {
        amount: 500000,
        currency: 'VND',
        category: 'Lương',
        spaceId: 'sp_personal',
        type: 'income',
        date: new Date().toISOString()
      };

      const val = TransactionLifecycleGuard.validateTransaction(tx);
      assert('TransactionLifecycleGuard validates income tx', 'Transaction', val.isValid, `Errors: ${val.errors.join(', ')}`);

      const sameWalletTx: Partial<Transaction> = {
        amount: 100000,
        currency: 'VND',
        category: 'Chuyển tiền',
        spaceId: 'sp_personal',
        type: 'transfer',
        walletId: 'w_cash',
        targetWalletId: 'w_cash',
        date: new Date().toISOString()
      };

      const sameVal = TransactionLifecycleGuard.validateTransaction(sameWalletTx);
      assert('TransactionLifecycleGuard rejects transfer to same wallet', 'Transaction', !sameVal.isValid, 'Failed to reject same-wallet transfer');

      const initialTx: Transaction = {
        id: 'tx_100',
        type: 'expense',
        amount: 50000,
        currency: 'VND',
        category: 'Ăn uống',
        spaceId: 'sp_personal',
        date: new Date().toISOString(),
        status: 'confirmed',
        isDeleted: false
      };

      const softDeleted = TransactionLifecycleGuard.transitionState(initialTx, 'soft_deleted', 'user');
      assert('TransactionLifecycleGuard transitions lifecycle state to soft_deleted', 'Transaction', softDeleted.status === 'soft_deleted' && softDeleted.isDeleted === true, 'Transition failed');
    } catch (err: any) {
      results.push({ name: 'Transaction Suite', category: 'Transaction', passed: false, message: err?.message || 'Error' });
    }

    // 4. D1-006: Metadata & Versioning
    try {
      const base = CanonicalMetadata.createBaseEntity('sp_personal', 'ent_1');
      assert('CanonicalMetadata creates base entity metadata', 'Metadata', base.id === 'ent_1' && base.version === 1 && base.syncState === 'pending', 'Base creation failed');

      const bumped = CanonicalMetadata.bumpVersion(base);
      assert('CanonicalMetadata increments version', 'Metadata', bumped.version === 2, `Expected 2, got ${bumped.version}`);

      const softDel = CanonicalMetadata.softDelete(bumped);
      assert('CanonicalMetadata sets soft delete metadata', 'Metadata', softDel.isDeleted === true && softDel.version === 3, 'Soft delete failed');
    } catch (err: any) {
      results.push({ name: 'Metadata Suite', category: 'Metadata', passed: false, message: err?.message || 'Error' });
    }

    // 5. D1-007: Domain Adapters
    try {
      const tx: Transaction = {
        id: 'tx_55',
        type: 'expense',
        amount: 250000,
        currency: 'VND',
        category: 'Cà phê',
        spaceId: 'sp_personal',
        date: '2026-08-13T10:00:00.000Z',
        status: 'confirmed',
        isDeleted: false,
        syncStatus: 'synced',
        version: 1
      };

      const entity = DomainAdapters.toTransactionEntity(tx);
      assert('DomainAdapters converts Transaction to TransactionEntity', 'Adapters', entity.id === 'tx_55' && entity.amount === 250000, 'Conversion to entity failed');

      const restored = DomainAdapters.fromTransactionEntity(entity);
      assert('DomainAdapters converts TransactionEntity back to Transaction', 'Adapters', restored.id === 'tx_55' && restored.amount === 250000, 'Conversion from entity failed');
    } catch (err: any) {
      results.push({ name: 'Adapters Suite', category: 'Adapters', passed: false, message: err?.message || 'Error' });
    }

    return results;
  }
}
