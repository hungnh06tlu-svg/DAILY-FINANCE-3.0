/**
 * Daily Finance 3.0 - D4-002 Local Storage Adapters & Persistence Behavior Suite
 * Validates round-trip integrity, exact amount/currency preservation, multi-space/fund isolation,
 * transfer identity preservation, soft-delete/restore lifecycle, audit trail, versioning,
 * and offline persistence adapters.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalTransactionRepository } from '../repositories/local/LocalTransactionRepository';
import { Transaction, TransactionStatus } from '../types';

describe('D4-002: Local Storage Adapters & Persistence Behavior Suite', () => {
  let repo: LocalTransactionRepository;

  beforeEach(() => {
    repo = new LocalTransactionRepository();
  });

  it('P01 — Basic write and read round-trip', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 150000,
      currency: 'VND',
      type: 'expense',
      category: 'Food',
      date: '2026-08-28',
      note: 'Lunch'
    });

    expect(tx.id).toBeDefined();
    expect(tx.id).toMatch(/^tx_/);

    const fetched = await repo.getTransactionById(tx.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(tx.id);
    expect(fetched?.amount).toBe(150000);
    expect(fetched?.currency).toBe('VND');
    expect(fetched?.spaceId).toBe('sp_personal');
  });

  it('P02 — Exact amount preservation (no rounding or stringification)', async () => {
    const amounts = [100.456, 0.01, 999999999.999, 0, -500.1234];

    for (const amt of amounts) {
      const created = await repo.addTransaction({
        spaceId: 'sp_personal',
        amount: amt,
        currency: 'USD',
        type: 'expense',
        category: 'General',
        date: '2026-08-28'
      });

      const readBack = await repo.getTransactionById(created.id);
      expect(readBack?.amount).toBe(amt);
      expect(typeof readBack?.amount).toBe('number');
    }
  });

  it('P03 — Currency preservation (no implicit conversion)', async () => {
    const currencies = ['VND', 'USD', 'EUR', 'JPY'];

    for (const curr of currencies) {
      const created = await repo.addTransaction({
        spaceId: 'sp_personal',
        amount: 1000,
        currency: curr,
        type: 'income',
        category: 'Salary',
        date: '2026-08-28'
      });

      const readBack = await repo.getTransactionById(created.id);
      expect(readBack?.currency).toBe(curr);
      expect(readBack?.amount).toBe(1000);
    }
  });

  it('P04 — Multi-Space isolation', async () => {
    const txA = await repo.addTransaction({ spaceId: 'space_A', amount: 100, currency: 'VND', type: 'expense', category: 'General', date: '2026-08-28' });
    const txB = await repo.addTransaction({ spaceId: 'space_B', amount: 200, currency: 'VND', type: 'expense', category: 'General', date: '2026-08-28' });
    const txC = await repo.addTransaction({ spaceId: 'space_C', amount: 300, currency: 'VND', type: 'expense', category: 'General', date: '2026-08-28' });

    expect(txC.id).toBeDefined();

    const listA = await repo.getTransactionsBySpace('space_A');
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(txA.id);

    const listB = await repo.getTransactionsBySpace('space_B');
    expect(listB.length).toBe(1);
    expect(listB[0].id).toBe(txB.id);

    // Mutate Space A
    await repo.updateTransaction({ ...txA, amount: 150 });
    const readB = await repo.getTransactionById(txB.id);
    expect(readB?.amount).toBe(200); // Space B untouched
  });

  it('P05 — Multi-Fund isolation', async () => {
    const txFund1 = await repo.addTransaction({ spaceId: 'space_A', fundId: 'fund_A1', amount: 500, currency: 'VND', type: 'expense', category: 'General', date: '2026-08-28' } as any);
    const txFund2 = await repo.addTransaction({ spaceId: 'space_A', fundId: 'fund_A2', amount: 700, currency: 'VND', type: 'expense', category: 'General', date: '2026-08-28' } as any);

    const readFund1 = await repo.getTransactionById(txFund1.id);
    const readFund2 = await repo.getTransactionById(txFund2.id);

    expect((readFund1 as any)?.fundId).toBe('fund_A1');
    expect((readFund2 as any)?.fundId).toBe('fund_A2');

    // Mutate Fund 1
    await repo.updateTransaction({ ...txFund1, amount: 600 });
    const reReadFund2 = await repo.getTransactionById(txFund2.id);
    expect(reReadFund2?.amount).toBe(700);
  });

  it('P06 — Transfer identity round-trip preservation', async () => {
    const transferTx = await repo.addTransaction({
      spaceId: 'space_source',
      fundId: 'fund_source',
      walletId: 'wallet_source',
      targetSpaceId: 'space_target',
      targetFundId: 'fund_target',
      targetWalletId: 'wallet_target',
      amount: 1000000,
      currency: 'VND',
      type: 'transfer',
      category: 'Transfer',
      date: '2026-08-28',
      description: 'Cross-space cross-fund transfer'
    } as any);

    const fetched = await repo.getTransactionById(transferTx.id);
    expect(fetched?.spaceId).toBe('space_source');
    expect((fetched as any)?.fundId).toBe('fund_source');
    expect(fetched?.walletId).toBe('wallet_source');
    expect((fetched as any)?.targetSpaceId).toBe('space_target');
    expect((fetched as any)?.targetFundId).toBe('fund_target');
    expect((fetched as any)?.targetWalletId).toBe('wallet_target');
  });

  it('P07 — Lifecycle persistence (status transitions)', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 50000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28',
      status: 'draft'
    });

    expect(tx.status).toBe('draft');

    const pending = await repo.updateTransaction({ ...tx, status: 'pending' as TransactionStatus });
    expect(pending.status).toBe('pending');

    const confirmed = await repo.updateTransaction({ ...pending, status: 'confirmed' as TransactionStatus });
    expect(confirmed.status).toBe('confirmed');

    const fetched = await repo.getTransactionById(tx.id);
    expect(fetched?.status).toBe('confirmed');
  });

  it('P08 — Soft delete persistence', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 80000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    const deletedSuccess = await repo.deleteTransaction(tx.id);
    expect(deletedSuccess).toBe(true);

    const activeList = await repo.getTransactionsBySpace('sp_personal');
    expect(activeList.some(t => t.id === tx.id)).toBe(false);

    const deletedList = await repo.findDeletedTransactions();
    expect(deletedList.some(t => t.id === tx.id)).toBe(true);

    const rawTx = await repo.getTransactionById(tx.id);
    expect(rawTx?.isDeleted).toBe(true);
    expect(rawTx?.status).toBe('soft_deleted');
    expect(rawTx?.deletedAt).not.toBeNull();
  });

  it('P09 — Restore soft-deleted transaction persistence', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 90000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    await repo.deleteTransaction(tx.id);
    const restoreSuccess = await repo.restoreTransaction(tx.id);
    expect(restoreSuccess).toBe(true);

    const activeList = await repo.getTransactionsBySpace('sp_personal');
    expect(activeList.some(t => t.id === tx.id)).toBe(true);

    const restoredTx = await repo.getTransactionById(tx.id);
    expect(restoredTx?.isDeleted).toBe(false);
    expect(restoredTx?.deletedAt).toBeNull();
    expect(restoredTx?.status).toBe('confirmed');
  });

  it('P10 — Archive persistence', async () => {
    const nowIso = new Date().toISOString();
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 120000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28',
      status: 'archived' as TransactionStatus,
      archivedAt: nowIso
    });

    const readBack = await repo.getTransactionById(tx.id);
    expect(readBack?.status).toBe('archived');
    expect(readBack?.archivedAt).toBe(nowIso);
  });

  it('P11 — Audit trail preservation & expansion', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 30000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    expect(tx.auditTrail).toBeDefined();
    expect(tx.auditTrail?.length).toBe(1);
    expect(tx.auditTrail![0].action).toBe('create');

    await repo.deleteTransaction(tx.id);
    const deletedTx = await repo.getTransactionById(tx.id);
    expect(deletedTx?.auditTrail?.length).toBe(2);
    expect(deletedTx?.auditTrail![1].action).toBe('soft_delete');

    await repo.restoreTransaction(tx.id);
    const restoredTx = await repo.getTransactionById(tx.id);
    expect(restoredTx?.auditTrail?.length).toBe(3);
    expect(restoredTx?.auditTrail![2].action).toBe('restore');
  });

  it('P12 — Version incrementing on update', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 40000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    expect(tx.version).toBe(1);

    const v2 = await repo.updateTransaction({ ...tx, amount: 45000 });
    expect(v2.version).toBe(2);

    const v3 = await repo.updateTransaction({ ...v2, note: 'Updated note' });
    expect(v3.version).toBe(3);
  });

  it('P13 — Optional field preservation', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 50000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28',
      note: undefined,
      description: '',
      merchant: 'Coffee Shop',
      categoryId: null as any
    });

    const readBack = await repo.getTransactionById(tx.id);
    expect(readBack?.merchant).toBe('Coffee Shop');
    expect(readBack?.description).toBe('');
  });

  it('P14 — Duplicate identity & idempotent update behavior', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 60000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    // Update with same ID
    await repo.updateTransaction({ ...tx, amount: 65000 });
    const all = await repo.getAllTransactions();
    const matching = all.filter(t => t.id === tx.id);
    expect(matching.length).toBe(1);
    expect(matching[0].amount).toBe(65000);
  });

  it('P15 — Bulk persistence operation', async () => {
    const bulkData: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
      id: `tx_bulk_${i}`,
      spaceId: i % 2 === 0 ? 'space_even' : 'space_odd',
      amount: (i + 1) * 1000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28',
      status: 'confirmed' as TransactionStatus,
      version: 1
    }));

    await repo.bulkUpsert(bulkData);

    const spaceEven = await repo.getTransactionsBySpace('space_even');
    expect(spaceEven.length).toBe(8);

    const spaceOdd = await repo.getTransactionsBySpace('space_odd');
    expect(spaceOdd.length).toBe(7);
  });

  it('P16 — Serialization / deserialization round-trip simulation', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 75000,
      currency: 'VND',
      type: 'income',
      category: 'Freelance',
      date: '2026-08-28',
      note: 'Freelance'
    });

    const serialized = JSON.stringify(tx);
    const deserialized = JSON.parse(serialized) as Transaction;

    expect(deserialized.id).toBe(tx.id);
    expect(deserialized.amount).toBe(75000);
    expect(deserialized.currency).toBe('VND');
    expect(deserialized.note).toBe('Freelance');
  });

  it('P17 — Error contract behavior on missing transaction ID', async () => {
    await expect(repo.updateTransaction({} as any)).rejects.toThrow('Transaction ID is required for update');
    
    const nonExistent = await repo.getTransactionById('non_existent_id');
    expect(nonExistent).toBeNull();

    const deleteNonExistent = await repo.deleteTransaction('non_existent_id');
    expect(deleteNonExistent).toBe(false);
  });

  it('P18 — Offline standalone operation', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_offline',
      amount: 200000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    });

    const found = await repo.getTransactionById(tx.id);
    expect(found).not.toBeNull();
    expect(found?.spaceId).toBe('sp_offline');
  });

  it('P19 — Rehydration with initial data', async () => {
    const initial: Transaction[] = [
      {
        id: 'tx_init_1',
        spaceId: 'sp_personal',
        amount: 10000,
        currency: 'VND',
        type: 'expense',
        category: 'General',
        date: '2026-08-28',
        status: 'confirmed' as TransactionStatus,
        version: 1
      }
    ];

    const seededRepo = new LocalTransactionRepository(initial);
    const tx = await seededRepo.getTransactionById('tx_init_1');
    expect(tx).not.toBeNull();
    expect(tx?.amount).toBe(10000);
  });

  it('P20 — Resilience against malformed/missing optional fields', async () => {
    const tx = await repo.addTransaction({
      spaceId: 'sp_personal',
      amount: 5000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28'
    } as any);

    expect(tx.isDeleted).toBe(false);
    expect(tx.deletedAt).toBeNull();
    expect(tx.syncStatus).toBe('pending');
    expect(tx.version).toBe(1);
  });

  it('P21 — Stale version comparison during bulk upsert', async () => {
    await repo.addTransaction({
      id: 'tx_version_test',
      spaceId: 'sp_personal',
      amount: 10000,
      currency: 'VND',
      type: 'expense',
      category: 'General',
      date: '2026-08-28',
      version: 5
    });

    // Bulk upsert with version 3 (older)
    await repo.bulkUpsert([
      {
        id: 'tx_version_test',
        spaceId: 'sp_personal',
        amount: 10000,
        currency: 'VND',
        type: 'expense',
        category: 'General',
        date: '2026-08-28',
        version: 3
      }
    ]);

    const readBack = await repo.getTransactionById('tx_version_test');
    expect(readBack?.version).toBe(5); // Retains highest version
  });
});
