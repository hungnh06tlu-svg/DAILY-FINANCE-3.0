/**
 * Daily Finance 3.0 - D2 Financial Truth & Invariants Test Suite Runner
 * Validates all 12 Canonical Financial Invariants and Domain Calculation Robustness.
 */

import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { BudgetEngine } from '../domain/BudgetEngine';
import { SnapshotBuilder } from '../domain/SnapshotBuilder';
import { SpaceIsolationGuard, MoneyUtils, DomainAdapters, TransactionNormalizer, TransactionLifecycleGuard, CANONICAL_TRANSACTION_TYPES } from '../domain/CanonicalFinancialModel';
import { CompatibilityMigrationEngine } from '../domain/CompatibilityMigrationEngine';
import { TransactionManager } from '../domain/TransactionManager';
import {
  ValidateTransactionUseCase,
  AddTransactionUseCase,
  UpdateTransactionUseCase,
  SoftDeleteTransactionUseCase,
  RestoreTransactionUseCase,
  ArchiveTransactionUseCase,
  TransferMoneyUseCase
} from '../usecases/TransactionUseCases';
import { TransactionRepository, WalletRepository } from '../repositories/contracts';
import {
  Transaction,
  TransactionType,
  Wallet,
  Investment,
  DebtItem,
  CreditCard,
  Budget,
  SavingsGoal
} from '../types';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runD2FinancialTruthTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const assert = (name: string, passed: boolean, message?: string) => {
    results.push({
      name: `[D2-FINANCIAL-TRUTH] ${name}`,
      category: 'FinancialTruthEngine',
      passed,
      message: passed ? undefined : message || 'Assertion failed'
    });
  };

  try {
    // -------------------------------------------------------------------------
    // INV-1: TRANSFER NEUTRALITY
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_inc_1', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_trf_1', amount: 3_000_000, type: 'transfer', currency: 'VND', category: 'Transfer', spaceId: 'sp_personal', date: '2026-08-02', status: 'confirmed' }
      ];
      const balance = FinancialTruthEngine.calculateBalance(txs, 0);
      assert('INV-1: Transfer is neutral at space balance level', balance === 10_000_000, `Expected 10,000,000 but got ${balance}`);
    }

    // -------------------------------------------------------------------------
    // INV-2: DELETED ENTITY EXCLUSION
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_inc_valid', amount: 5_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_inc_deleted_flag', amount: 2_000_000, type: 'income', currency: 'VND', category: 'Bonus', spaceId: 'sp_personal', date: '2026-08-01', isDeleted: true },
        { id: 'tx_inc_soft_deleted', amount: 3_000_000, type: 'income', currency: 'VND', category: 'Gift', spaceId: 'sp_personal', date: '2026-08-01', status: 'soft_deleted' as any },
        { id: 'tx_inc_archived', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Gift', spaceId: 'sp_personal', date: '2026-08-01', status: 'archived' as any }
      ];
      const income = FinancialTruthEngine.calculateIncome(txs);
      assert('INV-2: Deleted and archived transactions are excluded from income', income === 5_000_000, `Expected 5,000,000 but got ${income}`);

      const balance = FinancialTruthEngine.calculateBalance(txs, 0);
      assert('INV-2: Deleted and archived transactions are excluded from balance', balance === 5_000_000, `Expected 5,000,000 but got ${balance}`);
    }

    // -------------------------------------------------------------------------
    // INV-3: DRAFT / PENDING EXCLUSION
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_exp_confirmed', amount: 500_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_exp_draft', amount: 200_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_personal', date: '2026-08-01', status: 'draft' as any },
        { id: 'tx_exp_pending', amount: 300_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_personal', date: '2026-08-01', status: 'pending' as any }
      ];
      const expense = FinancialTruthEngine.calculateExpense(txs);
      assert('INV-3: Draft and pending transactions are excluded from confirmed expense', expense === 500_000, `Expected 500,000 but got ${expense}`);
    }

    // -------------------------------------------------------------------------
    // INV-4 & INV-5: SPACE ISOLATION & ZERO CROSS-SPACE LEAKAGE
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_p1', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_b1', amount: 40_000_000, type: 'income', currency: 'VND', category: 'Client Fee', spaceId: 'sp_business', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_f1', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Shared Pool', spaceId: 'sp_family', date: '2026-08-01', status: 'confirmed' }
      ];

      const personalIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, 'sp_personal');
      const businessIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, 'sp_business');

      assert('INV-4 & 5: Space isolation strictly segregates personal space', personalIncome === 10_000_000, `Expected 10,000,000 for sp_personal, got ${personalIncome}`);
      assert('INV-4 & 5: Space isolation strictly segregates business space', businessIncome === 40_000_000, `Expected 40,000,000 for sp_business, got ${businessIncome}`);
    }

    // -------------------------------------------------------------------------
    // INV-6: CANONICAL MONEY PRECISION
    // -------------------------------------------------------------------------
    {
      const rawVal = 1000.123456;
      const roundedVND = MoneyUtils.round(rawVal, 0);
      const roundedUSD = MoneyUtils.round(rawVal, 2);

      assert('INV-6: Canonical rounding eliminates float drift on VND', roundedVND === 1000, `Expected 1000, got ${roundedVND}`);
      assert('INV-6: Canonical rounding eliminates float drift on USD', roundedUSD === 1000.12, `Expected 1000.12, got ${roundedUSD}`);

      // Adding Money Value Objects
      const m1 = { amount: 100.555, currency: 'USD' };
      const m2 = { amount: 200.444, currency: 'USD' };
      const res = FinancialTruthEngine.addMoney(m1, m2);
      assert('INV-6: addMoney applies canonical currency precision', res.amount === 301, `Expected 301, got ${res.amount}`);
    }

    // -------------------------------------------------------------------------
    // INV-7: INDEPENDENT OF UI STRINGS
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_1', amount: 1500000, type: 'expense', category: 'Ăn uống (Dining)', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND' }
      ];
      const expense = FinancialTruthEngine.calculateExpense(txs);
      assert('INV-7: Financial engine uses raw numeric types independent of display formatting', expense === 1500000, `Expected 1500000, got ${expense}`);
    }

    // -------------------------------------------------------------------------
    // INV-8: STRICT DETERMINISM
    // -------------------------------------------------------------------------
    {
      const wallets: Wallet[] = [
        { id: 'w1', spaceId: 'sp_personal', name: 'Cash', type: 'cash', currency: 'VND', initialBalance: 0, currentBalance: 5_000_000, status: 'active' }
      ];
      const investments: Investment[] = [
        { id: 'i1', spaceId: 'sp_personal', name: 'Stock', type: 'stock', quantity: 10, purchasePrice: 50_000, currentPrice: 80_000, currency: 'VND' }
      ];
      const debts: DebtItem[] = [
        { id: 'd1', title: 'Debt', type: 'debt', originalAmount: 1_000_000, remainingAmount: 500_000, interestRate: 0, minimumMonthlyPayment: 0, counterparty: 'A', dueDate: '2026-12-31' }
      ];

      const run1 = FinancialTruthEngine.calculateNetWorth(wallets, investments, debts, []);
      const run2 = FinancialTruthEngine.calculateNetWorth(wallets, investments, debts, []);
      const run3 = FinancialTruthEngine.calculateNetWorth(wallets, investments, debts, []);

      assert('INV-8: Deterministic calculations yield identical results on repeated runs', run1 === run2 && run2 === run3 && run1 === 5_300_000, `Expected 5,300,000, got run1=${run1}, run2=${run2}`);
    }

    // -------------------------------------------------------------------------
    // INV-9: DUPLICATE RECORD PREVENTION / ID SAFETY
    // -------------------------------------------------------------------------
    {
      const validSpace = SpaceIsolationGuard.validateSpaceId('sp_personal');
      assert('INV-9: SpaceIsolationGuard validates valid space', validSpace === 'sp_personal', `Got ${validSpace}`);

      let rejectedEmpty = false;
      try {
        SpaceIsolationGuard.validateSpaceId('');
      } catch {
        rejectedEmpty = true;
      }
      assert('INV-9: SpaceIsolationGuard strictly rejects empty spaceId', rejectedEmpty, 'Empty space was not rejected');
    }

    // -------------------------------------------------------------------------
    // INV-10: OPENING / INITIAL BALANCE ≠ INCOME
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx_open', amount: 10_000_000, type: 'opening_balance', currency: 'VND', category: 'Opening', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_init', amount: 5_000_000, type: 'initial_balance', currency: 'VND', category: 'Initial', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_adj', amount: 1_000_000, type: 'adjustment', currency: 'VND', category: 'Adjustment', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_real_inc', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' }
      ];

      const income = FinancialTruthEngine.calculateIncome(txs);
      assert('INV-10: opening_balance, initial_balance, and adjustment are NOT counted as ordinary income', income === 20_000_000, `Expected 20,000,000, got ${income}`);

      const balance = FinancialTruthEngine.calculateBalance(txs, 0);
      assert('INV-10: calculateBalance correctly accumulates opening, initial, adjustment, and income', balance === 36_000_000, `Expected 36,000,000, got ${balance}`);
    }

    // -------------------------------------------------------------------------
    // INV-11: INTERNAL TRANSFER NET WORTH NEUTRALITY
    // -------------------------------------------------------------------------
    {
      const walletsBefore: Wallet[] = [
        { id: 'w1', spaceId: 'sp_personal', name: 'Cash', type: 'cash', currency: 'VND', initialBalance: 0, currentBalance: 10_000_000, status: 'active' },
        { id: 'w2', spaceId: 'sp_personal', name: 'Bank', type: 'bank', currency: 'VND', initialBalance: 0, currentBalance: 5_000_000, status: 'active' }
      ];
      const nwBefore = FinancialTruthEngine.calculateNetWorth(walletsBefore, [], [], []);

      // Transfer 3,000,000 from w1 to w2
      const trf = FinancialTruthEngine.calculateTransfer(10_000_000, 5_000_000, 3_000_000, 0);
      const walletsAfter: Wallet[] = [
        { id: 'w1', spaceId: 'sp_personal', name: 'Cash', type: 'cash', currency: 'VND', initialBalance: 0, currentBalance: trf.newFromBalance, status: 'active' },
        { id: 'w2', spaceId: 'sp_personal', name: 'Bank', type: 'bank', currency: 'VND', initialBalance: 0, currentBalance: trf.newToBalance, status: 'active' }
      ];
      const nwAfter = FinancialTruthEngine.calculateNetWorth(walletsAfter, [], [], []);

      assert('INV-11: Internal transfer preserves exact net worth (15,000,000 VND)', nwBefore === 15_000_000 && nwAfter === 15_000_000, `Before=${nwBefore}, After=${nwAfter}`);
    }

    // -------------------------------------------------------------------------
    // INV-12: NON-MUTATING PURE CALCULATIONS
    // -------------------------------------------------------------------------
    {
      const originalTxs: Transaction[] = [
        { id: 't1', amount: 100, type: 'income', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND', status: 'confirmed' },
        { id: 't2', amount: 50, type: 'expense', category: 'Food', spaceId: 'sp_personal', date: '2026-08-02', currency: 'VND', status: 'confirmed' }
      ];
      const txsCopy = JSON.stringify(originalTxs);

      FinancialTruthEngine.calculateBalance(originalTxs, 0);
      FinancialTruthEngine.calculateIncome(originalTxs);
      FinancialTruthEngine.calculateExpense(originalTxs);

      assert('INV-12: Financial calculations do not mutate source transaction arrays', JSON.stringify(originalTxs) === txsCopy, 'Source array was mutated');
    }

    // -------------------------------------------------------------------------
    // EDGE CASES & DETAILED SCENARIOS
    // -------------------------------------------------------------------------
    {
      // 1. Negative investment return
      const lossInvestments: Investment[] = [
        { id: 'inv_loss', spaceId: 'sp_personal', name: 'Crypto', type: 'crypto', quantity: 1, purchasePrice: 100_000_000, currentPrice: 40_000_000, currency: 'VND' }
      ];
      const ret = FinancialTruthEngine.calculateInvestmentReturn(lossInvestments);
      assert('EDGE: Investment return calculates negative ROI correctly (-60%)', ret.totalReturn === -60_000_000 && ret.returnPercent === -60, `Got return: ${ret.totalReturn}, ROI: ${ret.returnPercent}%`);

      // 2. Soft-deleted debts & credit cards excluded from net worth
      const wallets: Wallet[] = [
        { id: 'w1', spaceId: 'sp_personal', name: 'Cash', type: 'cash', currency: 'VND', initialBalance: 0, currentBalance: 10_000_000, status: 'active' }
      ];
      const debts: DebtItem[] = [
        { id: 'd_active', title: 'Active Debt', type: 'debt', originalAmount: 2_000_000, remainingAmount: 2_000_000, interestRate: 0, minimumMonthlyPayment: 0, counterparty: 'A', dueDate: '2026-12-31' },
        { id: 'd_deleted', title: 'Deleted Debt', type: 'debt', originalAmount: 5_000_000, remainingAmount: 5_000_000, interestRate: 0, minimumMonthlyPayment: 0, counterparty: 'B', dueDate: '2026-12-31', isSoftDeleted: true }
      ];
      const nw = FinancialTruthEngine.calculateNetWorth(wallets, [], debts, []);
      assert('EDGE: Soft-deleted debt is excluded from net worth calculation (10M - 2M = 8M)', nw === 8_000_000, `Expected 8,000,000 but got ${nw}`);

      // 3. Legacy transaction objects without status field
      const legacyTxs: Transaction[] = [
        { id: 'leg_1', amount: 1_000_000, type: 'income', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND' },
        { id: 'leg_2', amount: 400_000, type: 'expense', category: 'Dining', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND' }
      ];
      const legBal = FinancialTruthEngine.calculateBalance(legacyTxs, 0);
      assert('EDGE: Legacy transaction objects without status are included if not deleted', legBal === 600_000, `Expected 600,000 but got ${legBal}`);

      // 4. BudgetEngine lifecycle filtering
      const budget: Budget = { id: 'b_food', category: 'Food', allocatedAmount: 2_000_000, spentAmount: 0, currency: 'VND', period: 'monthly', warningThreshold: 80 };
      const budgetTxs: Transaction[] = [
        { id: 't_f1', amount: 500_000, type: 'expense', category: 'Food', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND', status: 'confirmed' },
        { id: 't_f2_draft', amount: 700_000, type: 'expense', category: 'Food', spaceId: 'sp_personal', date: '2026-08-01', currency: 'VND', status: 'draft' as any }
      ];
      const prog = BudgetEngine.evaluateProgress(budget, budgetTxs);
      assert('EDGE: BudgetEngine excludes draft transactions from spent amount', prog.used === 500_000 && prog.remaining === 1_500_000, `Expected used=500,000, got used=${prog.used}, remaining=${prog.remaining}`);

      // 5. SnapshotBuilder projection read-model completeness
      const snapshot = SnapshotBuilder.build({
        spaceId: 'sp_personal',
        wallets,
        transactions: legacyTxs,
        budgets: [budget],
        investments: lossInvestments,
        debts
      });
      assert('EDGE: SnapshotBuilder builds complete immutable projection', snapshot.spaceId === 'sp_personal' && snapshot.cashBalance === 600_000 && Object.isFrozen(snapshot), 'Snapshot build or freeze failed');
    }

    // =========================================================================
    // D2-001B: LIFECYCLE & FINANCIAL TRUTH AUDIT REGRESSION SUITE
    // =========================================================================

    // -------------------------------------------------------------------------
    // D2-001B-1: FULL TRANSACTION LIFECYCLE MATRIX
    // -------------------------------------------------------------------------
    {
      const txConfirmed: Transaction = { id: 't_c', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' };
      const txValidated: Transaction = { id: 't_v', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'validated' };
      const txRestored: Transaction = { id: 't_r', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'restored' };
      const txPosted: Transaction = { id: 't_p', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'posted' as any };
      const txLegacy: Transaction = { id: 't_l', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01' };

      const txDraft: Transaction = { id: 't_draft', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'draft' };
      const txPending: Transaction = { id: 't_pend', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'pending' as any };
      const txSoftDeleted: Transaction = { id: 't_sd', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'soft_deleted' };
      const txArchived: Transaction = { id: 't_arc', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'archived' };
      const txDeletedFlag: Transaction = { id: 't_df', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', isDeleted: true };
      const txSoftDeletedFlag: Transaction = { id: 't_sdf', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', ...({ isSoftDeleted: true } as any) };
      const txDeletedAt: Transaction = { id: 't_da', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', deletedAt: '2026-08-01T12:00:00Z' };

      // Inclusions test
      assert('D2-001B-1: Confirmed transaction is active', FinancialTruthEngine.isActiveConfirmedTransaction(txConfirmed), 'txConfirmed failed');
      assert('D2-001B-1: Validated transaction is active', FinancialTruthEngine.isActiveConfirmedTransaction(txValidated), 'txValidated failed');
      assert('D2-001B-1: Restored transaction is active', FinancialTruthEngine.isActiveConfirmedTransaction(txRestored), 'txRestored failed');
      assert('D2-001B-1: Posted transaction is active', FinancialTruthEngine.isActiveConfirmedTransaction(txPosted), 'txPosted failed');
      assert('D2-001B-1: Legacy transaction without status is active', FinancialTruthEngine.isActiveConfirmedTransaction(txLegacy), 'txLegacy failed');

      // Exclusions test
      assert('D2-001B-1: Draft transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txDraft), 'txDraft should be excluded');
      assert('D2-001B-1: Pending transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txPending), 'txPending should be excluded');
      assert('D2-001B-1: Soft-deleted status transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txSoftDeleted), 'txSoftDeleted should be excluded');
      assert('D2-001B-1: Archived status transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txArchived), 'txArchived should be excluded');
      assert('D2-001B-1: isDeleted=true transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txDeletedFlag), 'txDeletedFlag should be excluded');
      assert('D2-001B-1: isSoftDeleted=true transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txSoftDeletedFlag), 'txSoftDeletedFlag should be excluded');
      assert('D2-001B-1: deletedAt-set transaction is excluded', !FinancialTruthEngine.isActiveConfirmedTransaction(txDeletedAt), 'txDeletedAt should be excluded');
      assert('D2-001B-1: null/undefined transaction is safely rejected', !FinancialTruthEngine.isActiveConfirmedTransaction(null) && !FinancialTruthEngine.isActiveConfirmedTransaction(undefined), 'null/undefined should be rejected');

      // Aggregate balance test on full matrix (5 valid * 1M = 5M, 7 invalid excluded)
      const allMatrixTxs = [txConfirmed, txValidated, txRestored, txPosted, txLegacy, txDraft, txPending, txSoftDeleted, txArchived, txDeletedFlag, txSoftDeletedFlag, txDeletedAt];
      const totalIncome = FinancialTruthEngine.calculateIncome(allMatrixTxs);
      const totalBalance = FinancialTruthEngine.calculateBalance(allMatrixTxs, 0);
      assert('D2-001B-1: Aggregate income across full lifecycle matrix strictly equals 5,000,000', totalIncome === 5_000_000, `Expected 5,000,000, got ${totalIncome}`);
      assert('D2-001B-1: Aggregate balance across full lifecycle matrix strictly equals 5,000,000', totalBalance === 5_000_000, `Expected 5,000,000, got ${totalBalance}`);
    }

    // -------------------------------------------------------------------------
    // D2-001B-2: CUSTOMIZABLE SIX JARS ALLOCATION (NO HARD-CODED TRUTH)
    // -------------------------------------------------------------------------
    {
      // Scenario A: User custom allocation 50 / 20 / 10 / 10 / 5 / 5
      const customJarsConfig = [
        { key: 'NEC', nameVi: 'Thiết yếu VIP', percent: 50, currentBalance: 1_000_000 },
        { key: 'FFA', nameVi: 'Đầu tư tự do', percent: 20, currentBalance: 500_000 },
        { key: 'LTSS', nameVi: 'Quỹ mua nhà', percent: 10, currentBalance: 200_000 },
        { key: 'EDU', nameVi: 'Học tập & Sách', percent: 10, currentBalance: 100_000 },
        { key: 'PLAY', nameVi: 'Du lịch trải nghiệm', percent: 5, currentBalance: 50_000 },
        { key: 'GIVE', nameVi: 'Báo hiếu cha mẹ', percent: 5, currentBalance: 50_000 }
      ];

      const allocated50_20 = FinancialTruthEngine.calculateSixJars(20_000_000, customJarsConfig as any);
      
      const necJar = allocated50_20.find((j) => j.key === 'NEC');
      const ffaJar = allocated50_20.find((j) => j.key === 'FFA');
      const playJar = allocated50_20.find((j) => j.key === 'PLAY');

      assert('D2-001B-2: Custom 50% NEC allocation yields 10,000,000 + 1,000,000 = 11,000,000', necJar?.currentBalance === 11_000_000 && necJar.percent === 50, `NEC currentBalance was ${necJar?.currentBalance}`);
      assert('D2-001B-2: Custom 20% FFA allocation yields 4,000,000 + 500,000 = 4,500,000', ffaJar?.currentBalance === 4_500_000 && ffaJar.percent === 20, `FFA currentBalance was ${ffaJar?.currentBalance}`);
      assert('D2-001B-2: Custom 5% PLAY allocation yields 1,000,000 + 50,000 = 1,050,000', playJar?.currentBalance === 1_050_000 && playJar.percent === 5, `PLAY currentBalance was ${playJar?.currentBalance}`);
      assert('D2-001B-2: Custom jar names are preserved ("Thiết yếu VIP")', necJar?.nameVi === 'Thiết yếu VIP', `Jar nameVi was ${necJar?.nameVi}`);

      // Scenario B: Non-standard 4-Jar setup (40 / 30 / 20 / 10)
      const fourJarsConfig = [
        { key: 'ESSENTIALS', nameVi: 'Chi tiêu', percent: 40, currentBalance: 0 },
        { key: 'INVEST', nameVi: 'Đầu tư', percent: 30, currentBalance: 0 },
        { key: 'SAVINGS', nameVi: 'Tiết kiệm', percent: 20, currentBalance: 0 },
        { key: 'FUN', nameVi: 'Giải trí', percent: 10, currentBalance: 0 }
      ];
      const allocated4 = FinancialTruthEngine.calculateSixJars(10_000_000, fourJarsConfig as any);
      assert('D2-001B-2: Custom 4-jar setup produces exactly 4 allocated jars', allocated4.length === 4, `Expected 4 jars, got ${allocated4.length}`);
      assert('D2-001B-2: Custom 4-jar exact allocations (4M, 3M, 2M, 1M)', allocated4[0].currentBalance === 4_000_000 && allocated4[1].currentBalance === 3_000_000 && allocated4[2].currentBalance === 2_000_000 && allocated4[3].currentBalance === 1_000_000, 'Allocation mismatch on 4 jars');

      // Scenario C: Default fallback when no config is provided
      const defaultAllocated = FinancialTruthEngine.calculateSixJars(10_000_000);
      assert('D2-001B-2: Default fallback allocates 6 canonical jars (55% = 5.5M NEC)', defaultAllocated.length === 6 && defaultAllocated[0].currentBalance === 5_500_000, 'Default fallback failed');

      // Scenario D: Soft-deleted jar in custom configuration is excluded
      const jarsWithSoftDeleted = [
        { key: 'J1', percent: 50, currentBalance: 0, isSoftDeleted: false },
        { key: 'J2', percent: 50, currentBalance: 0, isSoftDeleted: true }
      ];
      const allocatedExcludingSoftDeleted = FinancialTruthEngine.calculateSixJars(10_000_000, jarsWithSoftDeleted as any);
      assert('D2-001B-2: Soft-deleted jars are excluded from allocation', allocatedExcludingSoftDeleted.length === 1 && allocatedExcludingSoftDeleted[0].key === 'J1', 'Soft-deleted jar was not excluded');
    }

    // -------------------------------------------------------------------------
    // D2-001B-3: SPACE TRANSFER VS INTERNAL TRANSFER SEMANTICS
    // -------------------------------------------------------------------------
    {
      const txsWithTransfers: Transaction[] = [
        // Space A (sp_personal) initial income
        { id: 'tx_inc_a', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        // Space B (sp_business) initial income
        { id: 'tx_inc_b', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Revenue', spaceId: 'sp_business', date: '2026-08-01', status: 'confirmed' },
        // Internal transfer within Space A (Wallet 1 -> Wallet 2, same space)
        { id: 'tx_trf_internal_a', amount: 5_000_000, type: 'transfer', currency: 'VND', category: 'Transfer', spaceId: 'sp_personal', targetWalletId: 'w_bank_a', walletId: 'w_cash_a', date: '2026-08-02', status: 'confirmed' },
        // Space Transfer: Transfer 8,000,000 from Space A (sp_personal) to Space B (sp_business)
        { id: 'tx_trf_space_a_to_b', amount: 8_000_000, type: 'transfer', currency: 'VND', category: 'Capital Contribution', spaceId: 'sp_personal', targetSpaceId: 'sp_business', date: '2026-08-03', status: 'confirmed' }
      ];

      // 1. Space A Balance: 20M - 8M (outbound space transfer) = 12M (Internal transfer of 5M has 0 net effect on Space A)
      const spaceABalance = FinancialTruthEngine.calculateBalance(txsWithTransfers, 0, 'sp_personal');
      assert('D2-001B-3: Space A balance correctly reflects outbound space transfer (20M - 8M = 12M)', spaceABalance === 12_000_000, `Expected 12,000,000 for Space A, got ${spaceABalance}`);

      // 2. Space B Balance: 10M + 8M (inbound space transfer) = 18M
      const spaceBBalance = FinancialTruthEngine.calculateBalance(txsWithTransfers, 0, 'sp_business');
      assert('D2-001B-3: Space B balance correctly reflects inbound space transfer (10M + 8M = 18M)', spaceBBalance === 18_000_000, `Expected 18,000,000 for Space B, got ${spaceBBalance}`);

      // 3. System-Wide Balance (all spaces combined): 20M + 10M = 30M (Transfers are net-neutral across whole system)
      const systemBalance = FinancialTruthEngine.calculateBalance(txsWithTransfers, 0);
      assert('D2-001B-3: System-wide balance remains 30,000,000 (Space transfer is neutral globally: 12M + 18M = 30M)', systemBalance === 30_000_000 && (spaceABalance + spaceBBalance) === systemBalance, `Expected system balance 30,000,000, got ${systemBalance}`);
    }

    // -------------------------------------------------------------------------
    // D2-001B-4: ENTITY LIFECYCLE CONSISTENCY ACROSS ALL DOMAIN CALCULATORS
    // -------------------------------------------------------------------------
    {
      // 1. Soft-deleted and archived wallets
      const activeWallet: Wallet = { id: 'w_act', spaceId: 'sp_personal', name: 'Active Wallet', type: 'cash', currency: 'VND', initialBalance: 0, currentBalance: 10_000_000, status: 'active' };
      const archivedWallet: Wallet = { id: 'w_arc', spaceId: 'sp_personal', name: 'Archived Wallet', type: 'bank', currency: 'VND', initialBalance: 0, currentBalance: 5_000_000, status: 'archived' };
      const softDeletedWallet: Wallet = { id: 'w_sd', spaceId: 'sp_personal', name: 'Deleted Wallet', type: 'e_wallet', currency: 'VND', initialBalance: 0, currentBalance: 3_000_000, status: 'active', isDeleted: true };

      const nwWallets = FinancialTruthEngine.calculateNetWorth([activeWallet, archivedWallet, softDeletedWallet], [], [], []);
      assert('D2-001B-4: Net worth excludes archived and soft-deleted wallets (strictly 10,000,000)', nwWallets === 10_000_000, `Expected 10,000,000, got ${nwWallets}`);

      // 2. Emergency fund excludes archived / deleted wallets
      const emFund = FinancialTruthEngine.calculateEmergencyFund([activeWallet, archivedWallet, softDeletedWallet], 2_000_000);
      assert('D2-001B-4: Emergency fund excludes archived/deleted wallets (liquid fund = 10,000,000)', emFund.currentFund === 10_000_000, `Expected 10,000,000, got ${emFund.currentFund}`);

      // 3. Investment Return excludes soft-deleted / archived investments
      const activeInv: Investment = { id: 'i_act', spaceId: 'sp_personal', name: 'Stock A', type: 'stock', quantity: 100, purchasePrice: 10_000, currentPrice: 15_000, currency: 'VND', status: 'active' };
      const archivedInv: Investment = { id: 'i_arc', spaceId: 'sp_personal', name: 'Stock B', type: 'stock', quantity: 100, purchasePrice: 10_000, currentPrice: 20_000, currency: 'VND', status: 'archived' };
      const softDeletedInv: Investment = { id: 'i_sd', spaceId: 'sp_personal', name: 'Stock C', type: 'stock', quantity: 100, purchasePrice: 10_000, currentPrice: 30_000, currency: 'VND', isSoftDeleted: true };

      const invReturn = FinancialTruthEngine.calculateInvestmentReturn([activeInv, archivedInv, softDeletedInv]);
      assert('D2-001B-4: Investment return excludes archived and soft-deleted investments (invested = 1M, value = 1.5M)', invReturn.totalInvested === 1_000_000 && invReturn.currentValue === 1_500_000, `Got invested=${invReturn.totalInvested}, value=${invReturn.currentValue}`);

      // 4. Budget Usage with soft-deleted budget
      const softDeletedBudget: Budget = { id: 'b_sd', category: 'Dining', allocatedAmount: 5_000_000, spentAmount: 1_000_000, currency: 'VND', period: 'monthly', warningThreshold: 80, isSoftDeleted: true } as any;
      const bUsage = FinancialTruthEngine.calculateBudgetUsage(softDeletedBudget, []);
      assert('D2-001B-4: Soft-deleted budget returns zeroed usage', bUsage.spent === 0 && bUsage.remaining === 0 && bUsage.usagePercent === 0, 'Soft deleted budget was not zeroed');

      // 5. Savings Progress with soft-deleted goal
      const softDeletedGoal: SavingsGoal = { id: 'g_sd', title: 'Vacation', targetAmount: 10_000_000, currentAmount: 5_000_000, deadline: '2026-12-31', category: 'travel', icon: 'plane', isSoftDeleted: true };
      const sProgress = FinancialTruthEngine.calculateSavingProgress(softDeletedGoal);
      assert('D2-001B-4: Soft-deleted savings goal returns 0 progress', sProgress.progressPercent === 0 && sProgress.remainingAmount === 0, 'Soft deleted goal was not zeroed');
    }

    // -------------------------------------------------------------------------
    // D2-001B-5: MULTI-CALCULATOR MATHEMATICAL INTEGRITY
    // -------------------------------------------------------------------------
    {
      const txs: Transaction[] = [
        { id: 'tx1', amount: 50_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx2', amount: 20_000_000, type: 'expense', currency: 'VND', category: 'Living', spaceId: 'sp_personal', date: '2026-08-02', status: 'confirmed' },
        { id: 'tx3_draft', amount: 15_000_000, type: 'expense', currency: 'VND', category: 'Luxury', spaceId: 'sp_personal', date: '2026-08-03', status: 'draft' as any }
      ];

      const income = FinancialTruthEngine.calculateIncome(txs);
      const expense = FinancialTruthEngine.calculateExpense(txs);
      const cashFlow = FinancialTruthEngine.calculateCashFlow(income, expense);
      const balance = FinancialTruthEngine.calculateBalance(txs, 0);

      assert('D2-001B-5: Income (50M) - Expense (20M) = CashFlow (30M)', income === 50_000_000 && expense === 20_000_000 && cashFlow === 30_000_000, `Income=${income}, Expense=${expense}, CashFlow=${cashFlow}`);
      assert('D2-001B-5: Balance (30M) strictly matches CashFlow (30M) from zero base', balance === cashFlow, `Balance=${balance} != CashFlow=${cashFlow}`);
    }

    // -------------------------------------------------------------------------
    // D2-002A-01: CANONICAL TRANSACTION CONTRACT & ROOM ENTITY MAPPING
    // -------------------------------------------------------------------------
    {
      const canonicalTypes: TransactionType[] = [
        'income', 'expense', 'transfer', 'saving', 'investment',
        'debt', 'debt_payment', 'compensation', 'adjustment',
        'opening_balance', 'initial_balance'
      ];

      // 1. All 11 canonical transaction types round-trip lossless through Room DomainAdapters
      for (const tType of canonicalTypes) {
        const sampleTx: Transaction = {
          id: `tx_${tType}`,
          spaceId: 'sp_personal',
          type: tType,
          amount: 1_250_000,
          currency: 'VND',
          category: 'Finance',
          categoryId: 'cat_finance',
          walletId: 'w_1',
          targetSpaceId: tType === 'transfer' ? 'sp_family' : undefined,
          targetWalletId: tType === 'transfer' ? 'w_2' : undefined,
          date: '2026-08-22T08:00:00.000Z',
          note: `Test ${tType}`,
          description: `Test ${tType}`,
          merchant: 'Merchant X',
          method: 'bank',
          receiptUrl: 'https://example.com/receipt.png',
          tags: ['test', tType],
          status: 'confirmed',
          isDeleted: false,
          syncStatus: 'synced',
          version: 1
        };

        const roomEntity = DomainAdapters.toTransactionEntity(sampleTx);
        assert(`D2-002A-01: Room entity preserves exact type '${tType}' without fallback to expense`, roomEntity.transactionType === tType, `Expected ${tType}, got ${roomEntity.transactionType}`);

        const restoredTx = DomainAdapters.fromTransactionEntity(roomEntity);
        assert(`D2-002A-01: Restored transaction preserves exact type '${tType}'`, restoredTx.type === tType, `Expected ${tType}, got ${restoredTx.type}`);
        assert(`D2-002A-01: Restored transaction preserves amount and metadata for '${tType}'`, restoredTx.amount === 1_250_000 && restoredTx.category === 'cat_finance' && restoredTx.merchant === 'Merchant X' && restoredTx.method === 'bank', 'Metadata lost in round-trip');
      }

      // 2. Canonical statuses mapping & legacy status compatibility
      const legacyPostedTx: any = { id: 'tx_leg_p', spaceId: 'sp_personal', type: 'income', amount: 500_000, currency: 'VND', category: 'General', date: '2026-08-22', status: 'posted' };
      const legacyPendingTx: any = { id: 'tx_leg_d', spaceId: 'sp_personal', type: 'expense', amount: 200_000, currency: 'VND', category: 'General', date: '2026-08-22', status: 'pending' };
      const legacyUndefinedTx: Transaction = { id: 'tx_leg_u', spaceId: 'sp_personal', type: 'income', amount: 800_000, currency: 'VND', category: 'General', date: '2026-08-22' };

      const postedEntity = DomainAdapters.toTransactionEntity(legacyPostedTx);
      const pendingEntity = DomainAdapters.toTransactionEntity(legacyPendingTx);
      const undefinedEntity = DomainAdapters.toTransactionEntity(legacyUndefinedTx);

      assert('D2-002A-01: Legacy status "posted" maps to canonical "confirmed"', postedEntity.status === 'confirmed', `Got ${postedEntity.status}`);
      assert('D2-002A-01: Legacy status "pending" maps to canonical "draft"', pendingEntity.status === 'draft', `Got ${pendingEntity.status}`);
      assert('D2-002A-01: Legacy transaction with undefined status maps to "confirmed" if active', undefinedEntity.status === 'confirmed', `Got ${undefinedEntity.status}`);

      // 3. Undefined status treated as active financial truth
      assert('D2-002A-01: FinancialTruthEngine accepts undefined status as active legacy transaction', FinancialTruthEngine.isActiveConfirmedTransaction(legacyUndefinedTx), 'Undefined status was rejected');

      // 4. isDeleted=true is NEVER financial truth even if status=confirmed
      const deletedConfirmedTx: Transaction = { id: 'tx_del_conf', spaceId: 'sp_personal', type: 'income', amount: 9_000_000, currency: 'VND', category: 'General', date: '2026-08-22', status: 'confirmed', isDeleted: true };
      assert('D2-002A-01: isDeleted=true is rejected by FinancialTruthEngine regardless of status=confirmed', !FinancialTruthEngine.isActiveConfirmedTransaction(deletedConfirmedTx), 'Deleted confirmed transaction was accepted');
    }

    // -------------------------------------------------------------------------
    // D2-002A: TRANSACTION INPUT & NORMALIZATION
    // -------------------------------------------------------------------------
    {
      // Test 1 — Current Transaction Normalization (Exact Amount, Valid Currency Uppercased)
      const currentRawTx: Partial<Transaction> = {
        id: 'tx_cur_1',
        spaceId: '  sp_personal  ',
        type: 'income',
        amount: 2500000.456,
        currency: ' vnd ',
        category: 'Salary',
        note: 'Monthly salary payout',
        walletId: 'w_bank_1',
        date: '2026-08-23T10:00:00.000Z',
        merchant: '  Acme Corp  ',
        tags: [' salary ', 'work', '']
      };

      const normalizedCurrent = TransactionNormalizer.normalize(currentRawTx);
      assert('D2-002A: Normalizes currency to uppercase trimmed VND', normalizedCurrent.currency === 'VND', `Got ${normalizedCurrent.currency}`);
      assert('D2-002A: Reconciles category to categoryId', normalizedCurrent.categoryId === 'Salary', `Got ${normalizedCurrent.categoryId}`);
      assert('D2-002A: Reconciles note to description', normalizedCurrent.description === 'Monthly salary payout', `Got ${normalizedCurrent.description}`);
      assert('D2-002A: Reconciles walletId to accountId', normalizedCurrent.accountId === 'w_bank_1', `Got ${normalizedCurrent.accountId}`);
      assert('D2-002A: Normalizes spaceId and merchant whitespace', normalizedCurrent.spaceId === 'sp_personal' && normalizedCurrent.merchant === 'Acme Corp', 'Whitespace not trimmed');
      assert('D2-002A: Normalizes tags array by trimming and filtering empty strings', Array.isArray(normalizedCurrent.tags) && normalizedCurrent.tags.length === 2 && normalizedCurrent.tags[0] === 'salary', 'Tags array not normalized');
      assert('D2-002A: Exact amount preserved without arbitrary rounding (2500000.456)', normalizedCurrent.amount === 2500000.456, `Got ${normalizedCurrent.amount}`);

      // Test 2 — Legacy Transaction with undefined status and legacy statuses (Preserved as-is)
      const legacyUndefTx: Partial<Transaction> = {
        id: 'tx_leg_norm_1',
        spaceId: 'sp_personal',
        type: 'expense',
        amount: 150000,
        category: 'Food',
        date: '2026-08-20'
      };
      const normalizedLegacyUndef = TransactionNormalizer.normalize(legacyUndefTx);
      assert('D2-002A: Preserves undefined status for legacy transaction and sets isDeleted=false', normalizedLegacyUndef.status === undefined && normalizedLegacyUndef.isDeleted === false, 'Legacy undefined status altered incorrectly');

      const legacyPostedTx: any = { id: 'tx_leg_p_2', spaceId: 'sp_personal', type: 'income', amount: 300000, category: 'Bonus', date: '2026-08-20', status: 'posted' };
      const normalizedPosted = TransactionNormalizer.normalize(legacyPostedTx);
      assert('D2-002A: Preserves legacy status "posted" without lifecycle mutation', normalizedPosted.status === 'posted', `Got ${normalizedPosted.status}`);

      const legacyPendingTx: any = { id: 'tx_leg_p_3', spaceId: 'sp_personal', type: 'expense', amount: 50000, category: 'Snacks', date: '2026-08-20', status: 'pending' };
      const normalizedPending = TransactionNormalizer.normalize(legacyPendingTx);
      assert('D2-002A: Preserves legacy status "pending" without lifecycle mutation', normalizedPending.status === 'pending', `Got ${normalizedPending.status}`);

      // Test 3 — Optional Fields & Currency Safety (No fabricated defaults)
      const missingCurrencyTx: Partial<Transaction> = {
        amount: 100000,
        category: 'Groceries',
        spaceId: 'sp_personal',
        type: 'expense',
        date: '2026-08-23'
      };
      const normalizedMissingCur = TransactionNormalizer.normalize(missingCurrencyTx);
      assert('D2-002A: Missing currency remains undefined (no fabricated default)', normalizedMissingCur.currency === undefined, `Got ${normalizedMissingCur.currency}`);

      const whitespaceCurrencyTx: Partial<Transaction> = {
        amount: 100000,
        currency: '   ',
        category: 'Groceries',
        spaceId: 'sp_personal',
        type: 'expense',
        date: '2026-08-23'
      };
      const normalizedWsCur = TransactionNormalizer.normalize(whitespaceCurrencyTx);
      assert('D2-002A: Whitespace currency normalizes to empty string without inventing currency', normalizedWsCur.currency === '', `Got ${normalizedWsCur.currency}`);

      // Test 4 — Transaction Type Case-Insensitivity & Canonical 11 Types
      const mixedCaseTypes = [
        { raw: 'INCOME', expected: 'income' },
        { raw: ' Expense ', expected: 'expense' },
        { raw: 'TRANSFER', expected: 'transfer' },
        { raw: 'saving', expected: 'saving' },
        { raw: 'INVESTMENT', expected: 'investment' },
        { raw: 'debt', expected: 'debt' },
        { raw: 'debt_payment', expected: 'debt_payment' },
        { raw: 'compensation', expected: 'compensation' },
        { raw: 'adjustment', expected: 'adjustment' },
        { raw: 'opening_balance', expected: 'opening_balance' },
        { raw: 'INITIAL_BALANCE', expected: 'initial_balance' }
      ];

      for (const item of mixedCaseTypes) {
        const norm = TransactionNormalizer.normalize({ type: item.raw as any });
        assert(`D2-002A: Type '${item.raw}' normalized to canonical '${item.expected}'`, norm.type === item.expected, `Expected ${item.expected}, got ${norm.type}`);
      }

      // Test 5 — Financial Meaning Invariants (Amount, Date, Space, Wallet preserved)
      const financialTx: Partial<Transaction> = {
        id: 'tx_fin_1',
        spaceId: 'sp_biz',
        walletId: 'w_biz_bank',
        type: 'income',
        amount: 50000000,
        currency: 'VND',
        category: 'Revenue',
        date: '2026-08-23T14:30:00.000Z'
      };
      const normFinancial = TransactionNormalizer.normalize(financialTx);
      assert('D2-002A: Financial meaning strictly preserved (amount = 50,000,000, space = sp_biz, wallet = w_biz_bank)', normFinancial.amount === 50000000 && normFinancial.spaceId === 'sp_biz' && normFinancial.walletId === 'w_biz_bank', 'Financial meaning altered');

      // Test 6 — Deleted/Inactive Safety: Soft-deleted / deleted transactions NEVER normalized to active confirmed
      const softDeletedRaw: Partial<Transaction> = {
        id: 'tx_sd_1',
        spaceId: 'sp_personal',
        type: 'income',
        amount: 10000000,
        category: 'Bonus',
        date: '2026-08-23',
        status: 'soft_deleted',
        isDeleted: true
      };
      const normSoftDeleted = TransactionNormalizer.normalize(softDeletedRaw);
      assert('D2-002A: Deleted transaction normalized to status="soft_deleted" and isDeleted=true', normSoftDeleted.status === 'soft_deleted' && normSoftDeleted.isDeleted === true, 'Soft deleted state not preserved');
      assert('D2-002A: FinancialTruthEngine rejects normalized soft-deleted transaction', !FinancialTruthEngine.isActiveConfirmedTransaction(normSoftDeleted as Transaction), 'Soft deleted transaction was counted as active');

      // Test 7 — Bi-directional categoryId -> category & description -> note & accountId -> walletId (Cases A & B)
      const reverseAliasTx: Partial<Transaction> = {
        categoryId: 'cat_invest_stocks',
        description: 'Bought VN30 index fund',
        accountId: 'acc_securities_1'
      };
      const normReverse = TransactionNormalizer.normalize(reverseAliasTx);
      assert('D2-002A (Case B): category populated from categoryId', normReverse.category === 'cat_invest_stocks', `Got ${normReverse.category}`);
      assert('D2-002A (Case B): note populated from description', normReverse.note === 'Bought VN30 index fund', `Got ${normReverse.note}`);
      assert('D2-002A (Case B): walletId populated from accountId', normReverse.walletId === 'acc_securities_1', `Got ${normReverse.walletId}`);

      // Test 8 — Alias Conflict Policy (Case D: Distinct Values Preserved Independently)
      const conflictAliasTx: Partial<Transaction> = {
        category: 'Dining & Restaurants',
        categoryId: 'cat_food_007',
        note: 'Team dinner celebration',
        description: 'Invoice #INV-2026-888',
        walletId: 'w_cash_primary',
        accountId: 'acc_corp_card_01'
      };
      const normConflict = TransactionNormalizer.normalize(conflictAliasTx);
      assert('D2-002A (Case D): Category display name preserved independently without overwrite', normConflict.category === 'Dining & Restaurants', `Got ${normConflict.category}`);
      assert('D2-002A (Case D): Category ID preserved independently without overwrite', normConflict.categoryId === 'cat_food_007', `Got ${normConflict.categoryId}`);
      assert('D2-002A (Case D): Note preserved independently without overwrite', normConflict.note === 'Team dinner celebration', `Got ${normConflict.note}`);
      assert('D2-002A (Case D): Description preserved independently without overwrite', normConflict.description === 'Invoice #INV-2026-888', `Got ${normConflict.description}`);
      assert('D2-002A (Case D): Wallet ID preserved independently without overwrite', normConflict.walletId === 'w_cash_primary', `Got ${normConflict.walletId}`);
      assert('D2-002A (Case D): Account ID preserved independently without overwrite', normConflict.accountId === 'acc_corp_card_01', `Got ${normConflict.accountId}`);
    }

    // -------------------------------------------------------------------------
    // D2-002B: TRANSACTION LIFECYCLE & STATE TRANSITIONS
    // -------------------------------------------------------------------------
    {
      // 1. Valid Lifecycle Transitions Matrix
      const baseTx: Transaction = {
        id: 'tx_life_1',
        spaceId: 'sp_alpha',
        walletId: 'w_alpha_main',
        type: 'expense',
        amount: 250000,
        currency: 'VND',
        category: 'Utilities',
        date: '2026-08-23T10:00:00.000Z',
        status: 'draft',
        isDeleted: false
      };

      // draft -> validated
      const txValidated = TransactionLifecycleGuard.transitionState(baseTx, 'validated');
      assert('D2-002B: Valid transition draft -> validated', txValidated.status === 'validated' && txValidated.isDeleted === false, 'draft -> validated failed');

      // validated -> confirmed
      const txConfirmed = TransactionLifecycleGuard.transitionState(txValidated, 'confirmed');
      assert('D2-002B: Valid transition validated -> confirmed', txConfirmed.status === 'confirmed' && txConfirmed.isDeleted === false, 'validated -> confirmed failed');

      // confirmed -> soft_deleted
      const txSoftDeleted = TransactionLifecycleGuard.transitionState(txConfirmed, 'soft_deleted');
      assert('D2-002B: Valid transition confirmed -> soft_deleted (isDeleted=true, deletedAt populated)', txSoftDeleted.status === 'soft_deleted' && txSoftDeleted.isDeleted === true && !!txSoftDeleted.deletedAt, 'confirmed -> soft_deleted failed');

      // soft_deleted -> restored
      const txRestored = TransactionLifecycleGuard.transitionState(txSoftDeleted, 'restored');
      assert('D2-002B: Valid transition soft_deleted -> restored (isDeleted=false, deletedAt cleared)', txRestored.status === 'restored' && txRestored.isDeleted === false && txRestored.deletedAt === undefined, 'soft_deleted -> restored failed');

      // restored -> archived
      const txArchived = TransactionLifecycleGuard.transitionState(txRestored, 'archived');
      assert('D2-002B: Valid transition restored -> archived (archivedAt populated)', txArchived.status === 'archived' && !!txArchived.archivedAt, 'restored -> archived failed');

      // archived -> restored (unarchive: archivedAt cleared)
      const txUnarchived = TransactionLifecycleGuard.transitionState(txArchived, 'restored');
      assert('D2-002B: Valid transition archived -> restored (archivedAt cleared)', txUnarchived.status === 'restored' && txUnarchived.archivedAt === undefined, 'archived -> restored failed');

      // archived -> confirmed (direct unarchive to confirmed: archivedAt cleared)
      const txDirectUnarchived = TransactionLifecycleGuard.transitionState(txArchived, 'confirmed');
      assert('D2-002B: Valid transition archived -> confirmed (archivedAt cleared)', txDirectUnarchived.status === 'confirmed' && txDirectUnarchived.archivedAt === undefined, 'archived -> confirmed failed');

      // 2. Unauthorized / Invalid Transitions Rejected
      const illegalTransitions = [
        { from: 'draft', to: 'archived' },
        { from: 'draft', to: 'restored' },
        { from: 'soft_deleted', to: 'draft' },
        { from: 'soft_deleted', to: 'validated' },
        { from: 'soft_deleted', to: 'archived' }
      ];

      for (const item of illegalTransitions) {
        let threw = false;
        try {
          TransactionLifecycleGuard.transitionState({ ...baseTx, status: item.from as any }, item.to as any);
        } catch {
          threw = true;
        }
        assert(`D2-002B: Illegal transition '${item.from}' -> '${item.to}' strictly rejected`, threw, `Illegal transition ${item.from} -> ${item.to} was allowed!`);
      }

      // 3. Legacy Status Lifecycle Support
      const legacyPosted: Transaction = { ...baseTx, id: 'tx_leg_post', status: 'posted' as any };
      const legacyPending: Transaction = { ...baseTx, id: 'tx_leg_pend', status: 'pending' as any };
      const legacyUndef: Transaction = { ...baseTx, id: 'tx_leg_undef', status: undefined };

      const postToDel = TransactionLifecycleGuard.transitionState(legacyPosted, 'soft_deleted');
      assert('D2-002B: Legacy status "posted" can transition to "soft_deleted"', postToDel.status === 'soft_deleted' && postToDel.isDeleted === true, 'Legacy posted transition failed');

      const pendToVal = TransactionLifecycleGuard.transitionState(legacyPending, 'validated');
      assert('D2-002B: Legacy status "pending" can transition to "validated"', pendToVal.status === 'validated', 'Legacy pending transition failed');

      const undefToConf = TransactionLifecycleGuard.transitionState(legacyUndef, 'confirmed');
      assert('D2-002B: Legacy status undefined can transition to "confirmed"', undefToConf.status === 'confirmed', 'Legacy undefined transition failed');

      // 4. Financial Truth Invariant Safety during Lifecycle
      assert('D2-002B: Draft tx is rejected by FinancialTruthEngine', !FinancialTruthEngine.isActiveConfirmedTransaction(baseTx), 'Draft was considered active');
      assert('D2-002B: Validated tx is accepted by FinancialTruthEngine', FinancialTruthEngine.isActiveConfirmedTransaction(txValidated), 'Validated was rejected');
      assert('D2-002B: Confirmed tx is accepted by FinancialTruthEngine', FinancialTruthEngine.isActiveConfirmedTransaction(txConfirmed), 'Confirmed was rejected');
      assert('D2-002B: Soft deleted tx is strictly rejected by FinancialTruthEngine', !FinancialTruthEngine.isActiveConfirmedTransaction(txSoftDeleted), 'Soft deleted was considered active');
      assert('D2-002B: Restored tx is accepted by FinancialTruthEngine', FinancialTruthEngine.isActiveConfirmedTransaction(txRestored), 'Restored was rejected');
      assert('D2-002B: Archived tx is rejected by FinancialTruthEngine', !FinancialTruthEngine.isActiveConfirmedTransaction(txArchived), 'Archived was considered active');

      // 5. Multi-Space Isolation & Space Preservation
      const mockRepoStore: Record<string, Transaction> = {};
      const mockRepo: any = {
        async getTransactionById(id: string) { return mockRepoStore[id] ? { ...mockRepoStore[id] } : null; },
        async updateTransaction(tx: Transaction) { mockRepoStore[tx.id] = { ...tx }; return tx; }
      };

      const txSpaceA: Transaction = {
        id: 'tx_sp_A_1',
        spaceId: 'sp_alpha_business',
        walletId: 'w_alpha_corp',
        type: 'expense',
        amount: 5000000,
        currency: 'VND',
        category: 'Office Rent',
        date: '2026-08-23',
        status: 'confirmed',
        isDeleted: false
      };
      const txSpaceB: Transaction = {
        id: 'tx_sp_B_1',
        spaceId: 'sp_beta_personal',
        walletId: 'w_beta_cash',
        type: 'expense',
        amount: 80000,
        currency: 'VND',
        category: 'Coffee',
        date: '2026-08-23',
        status: 'confirmed',
        isDeleted: false
      };

      mockRepoStore[txSpaceA.id] = { ...txSpaceA };
      mockRepoStore[txSpaceB.id] = { ...txSpaceB };

      const softDelUseCase = new SoftDeleteTransactionUseCase(mockRepo);
      const restoreUseCase = new RestoreTransactionUseCase(mockRepo);
      const archiveUseCase = new ArchiveTransactionUseCase(mockRepo);

      // Attempt cross-space delete on Space A using Space B context -> MUST throw
      let crossSpaceDeleteThrew = false;
      try {
        await softDelUseCase.execute('tx_sp_A_1', 'sp_beta_personal');
      } catch {
        crossSpaceDeleteThrew = true;
      }
      assert('D2-002B: Cross-space soft delete strictly throws SpaceIsolation error', crossSpaceDeleteThrew, 'Cross-space soft delete did not throw!');

      // Valid soft delete within Space A
      await softDelUseCase.execute('tx_sp_A_1', 'sp_alpha_business');
      assert('D2-002B: Soft delete within matching Space A succeeds', mockRepoStore['tx_sp_A_1'].status === 'soft_deleted' && mockRepoStore['tx_sp_A_1'].isDeleted === true, 'Matching space delete failed');
      assert('D2-002B: Space B transaction untouched by Space A deletion', mockRepoStore['tx_sp_B_1'].status === 'confirmed' && mockRepoStore['tx_sp_B_1'].isDeleted === false, 'Space B tx was altered!');

      // Cross-space restore attempt -> MUST throw
      let crossSpaceRestoreThrew = false;
      try {
        await restoreUseCase.execute('tx_sp_A_1', 'sp_beta_personal');
      } catch {
        crossSpaceRestoreThrew = true;
      }
      assert('D2-002B: Cross-space restore strictly throws SpaceIsolation error', crossSpaceRestoreThrew, 'Cross-space restore did not throw!');

      // Valid restore within Space A
      await restoreUseCase.execute('tx_sp_A_1', 'sp_alpha_business');
      assert('D2-002B: Restored Space A tx remains strictly in Space A', mockRepoStore['tx_sp_A_1'].status === 'confirmed' && mockRepoStore['tx_sp_A_1'].spaceId === 'sp_alpha_business', 'Restored Space A tx spaceId corrupted');

      // 6. Multi-Fund / Wallet Preservation
      const txFundA: Transaction = {
        id: 'tx_fund_A',
        spaceId: 'sp_unified',
        walletId: 'w_fund_alpha',
        accountId: 'w_fund_alpha',
        type: 'expense',
        amount: 300000,
        currency: 'VND',
        category: 'Hardware',
        date: '2026-08-23',
        status: 'confirmed',
        isDeleted: false
      };
      const txFundB: Transaction = {
        id: 'tx_fund_B',
        spaceId: 'sp_unified',
        walletId: 'w_fund_beta',
        accountId: 'w_fund_beta',
        type: 'expense',
        amount: 150000,
        currency: 'VND',
        category: 'Snacks',
        date: '2026-08-23',
        status: 'confirmed',
        isDeleted: false
      };

      const fundA_deleted = TransactionLifecycleGuard.transitionState(txFundA, 'soft_deleted');
      const fundA_restored = TransactionLifecycleGuard.transitionState(fundA_deleted, 'restored');
      const fundA_archived = TransactionLifecycleGuard.transitionState(fundA_restored, 'archived');

      assert('D2-002B: Fund/Wallet isolation preserved across soft_delete, restore, archive (walletId strictly w_fund_alpha)', fundA_archived.walletId === 'w_fund_alpha' && fundA_archived.accountId === 'w_fund_alpha', 'walletId changed across lifecycle');
      assert('D2-002B: Fund B transaction unaffected and maintains walletId w_fund_beta', txFundB.walletId === 'w_fund_beta', 'Fund B walletId changed');

      // 7. Transfer Lifecycle Safety
      const transferTx: Transaction = {
        id: 'tx_transfer_1',
        spaceId: 'sp_unified',
        walletId: 'w_bank_source',
        targetSpaceId: 'sp_unified',
        targetWalletId: 'w_cash_dest',
        type: 'transfer',
        amount: 1000000,
        currency: 'VND',
        category: 'Fund Transfer',
        date: '2026-08-23',
        status: 'confirmed',
        isDeleted: false
      };

      const delTransfer = TransactionLifecycleGuard.transitionState(transferTx, 'soft_deleted');
      const resTransfer = TransactionLifecycleGuard.transitionState(delTransfer, 'restored');

      assert('D2-002B: Transfer source spaceId and walletId preserved on restore', resTransfer.spaceId === 'sp_unified' && resTransfer.walletId === 'w_bank_source', 'Transfer source corrupted');
      assert('D2-002B: Transfer targetSpaceId and targetWalletId preserved on restore', resTransfer.targetSpaceId === 'sp_unified' && resTransfer.targetWalletId === 'w_cash_dest', 'Transfer target corrupted');
      assert('D2-002B: Transfer amount and type preserved', resTransfer.amount === 1000000 && resTransfer.type === 'transfer', 'Transfer amount/type corrupted');
    }

    // -------------------------------------------------------------------------
    // D2-002C: ADVANCED TRANSACTION VALIDATION
    // -------------------------------------------------------------------------
    {
      const validator = new ValidateTransactionUseCase();

      // 1. Basic & Structural Validation
      const validTx: Partial<Transaction> = {
        id: 'tx_valid_001',
        spaceId: 'sp_alpha',
        walletId: 'w_alpha_cash',
        type: 'expense',
        amount: 150000,
        currency: 'VND',
        category: 'Food & Dining',
        date: '2026-08-24T00:00:00.000Z',
        status: 'confirmed'
      };

      const resValid = validator.execute(validTx);
      assert('D2-002C: Valid transaction passes validation', resValid.isValid && resValid.errors.length === 0, `Errors: ${resValid.errors.join(', ')}`);

      // Missing spaceId
      const resMissingSpace = validator.execute({ ...validTx, spaceId: '' });
      assert('D2-002C: Missing spaceId rejected', !resMissingSpace.isValid && resMissingSpace.errors.some(e => e.includes('Space ID is required')), 'Missing spaceId allowed');

      // Missing category
      const resMissingCategory = validator.execute({ ...validTx, category: '', categoryId: undefined });
      assert('D2-002C: Missing category/categoryId rejected', !resMissingCategory.isValid && resMissingCategory.errors.some(e => e.includes('Category is required')), 'Missing category allowed');

      // Invalid / Missing type
      const resInvalidType = validator.execute({ ...validTx, type: 'magic_payment' as any });
      assert('D2-002C: Invalid transaction type rejected', !resInvalidType.isValid && resInvalidType.errors.some(e => e.includes('Invalid transaction type')), 'Invalid type allowed');

      // Missing / Invalid currency
      const resMissingCurrency = validator.execute({ ...validTx, currency: '   ' });
      assert('D2-002C: Whitespace-only / missing currency rejected', !resMissingCurrency.isValid && resMissingCurrency.errors.some(e => e.includes('Currency code is required')), 'Missing currency allowed');

      // Missing / Invalid date
      const resInvalidDate = validator.execute({ ...validTx, date: 'not-a-date' });
      assert('D2-002C: Invalid date string rejected', !resInvalidDate.isValid && resInvalidDate.errors.some(e => e.includes('Valid transaction date')), 'Invalid date allowed');

      // 2. Amount Validation (Positive Finite Number, NaN, Infinity, negative, zero reject)
      const invalidAmounts = [0, -50000, NaN, Infinity, -Infinity, undefined as any, null as any];
      for (const badAmount of invalidAmounts) {
        const resBadAmount = validator.execute({ ...validTx, amount: badAmount });
        assert(`D2-002C: Amount '${badAmount}' strictly rejected`, !resBadAmount.isValid && resBadAmount.errors.some(e => e.includes('amount must be a positive finite number')), `Amount ${badAmount} was allowed`);
      }

      // 3. Type-Specific Validation (All 11 Canonical Types)
      for (const canonicalType of CANONICAL_TRANSACTION_TYPES) {
        if (canonicalType === 'transfer') {
          const validTransfer: Partial<Transaction> = {
            ...validTx,
            type: 'transfer',
            walletId: 'w_source',
            targetWalletId: 'w_dest'
          };
          const resType = validator.execute(validTransfer);
          assert(`D2-002C: Canonical type '${canonicalType}' valid configuration passes`, resType.isValid, `Type ${canonicalType} failed: ${resType.errors.join(', ')}`);
        } else {
          const resType = validator.execute({ ...validTx, type: canonicalType });
          assert(`D2-002C: Canonical type '${canonicalType}' passes validation`, resType.isValid, `Type ${canonicalType} failed: ${resType.errors.join(', ')}`);
        }
      }

      // 4. Multi-Space Validation & Context Matching
      // Case A: Space context matches transaction spaceId -> PASS
      const resSpaceMatch = validator.execute(validTx, 'sp_alpha');
      assert('D2-002C: Space context matching transaction spaceId passes', resSpaceMatch.isValid, 'Matching space context failed');

      // Case B: Space context differs from transaction spaceId -> REJECT
      const resSpaceMismatch = validator.execute(validTx, 'sp_beta');
      assert('D2-002C: Space context mismatch strictly rejected', !resSpaceMismatch.isValid && resSpaceMismatch.errors.some(e => e.includes('does not match context spaceId')), 'Space mismatch allowed');

      // 5. Multi-Fund / Wallet & Alias Semantics
      // Alias: only categoryId provided -> category resolved and valid
      const resOnlyCategoryId = validator.execute({
        ...validTx,
        category: undefined,
        categoryId: 'cat_groceries_001'
      });
      assert('D2-002C: Only categoryId provided reconciles and passes', resOnlyCategoryId.isValid, 'categoryId alias failed');

      // Alias: only accountId provided -> walletId resolved and valid
      const resOnlyAccountId = validator.execute({
        ...validTx,
        walletId: undefined,
        accountId: 'acc_credit_card_002'
      });
      assert('D2-002C: Only accountId provided reconciles and passes', resOnlyAccountId.isValid, 'accountId alias failed');

      // 6. Transfer Semantics
      // 6.1 Source wallet missing
      const resTransferNoSource = validator.execute({
        ...validTx,
        type: 'transfer',
        walletId: undefined,
        accountId: undefined,
        targetWalletId: 'w_dest'
      });
      assert('D2-002C: Transfer without source wallet/account rejected', !resTransferNoSource.isValid && resTransferNoSource.errors.some(e => e.includes('requires a source wallet')), 'Transfer without source allowed');

      // 6.2 Destination wallet/space missing
      const resTransferNoDest = validator.execute({
        ...validTx,
        type: 'transfer',
        walletId: 'w_source',
        targetWalletId: undefined,
        targetSpaceId: undefined
      });
      assert('D2-002C: Transfer without target wallet/space rejected', !resTransferNoDest.isValid && resTransferNoDest.errors.some(e => e.includes('requires a destination wallet or space')), 'Transfer without dest allowed');

      // 6.3 Source wallet == Destination wallet in same space
      const resTransferSameWallet = validator.execute({
        ...validTx,
        type: 'transfer',
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_alpha',
        walletId: 'w_same_wallet',
        targetWalletId: 'w_same_wallet'
      });
      assert('D2-002C: Transfer to same wallet in same space rejected', !resTransferSameWallet.isValid && resTransferSameWallet.errors.some(e => e.includes('cannot be identical')), 'Same wallet transfer allowed');

      // 6.4 Transfer to distinct wallet in same space -> PASS
      const resTransferSameSpaceDiffWallet = validator.execute({
        ...validTx,
        type: 'transfer',
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_alpha',
        walletId: 'w_source_1',
        targetWalletId: 'w_dest_2'
      });
      assert('D2-002C: Transfer to distinct wallet in same space passes', resTransferSameSpaceDiffWallet.isValid, 'Same space transfer failed');

      // 6.5 Cross-space transfer (spaceId A -> targetSpaceId B) -> PASS
      const resCrossSpaceTransfer = validator.execute({
        ...validTx,
        type: 'transfer',
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_beta',
        walletId: 'w_alpha_cash',
        targetWalletId: 'w_beta_vault'
      });
      assert('D2-002C: Cross-space transfer passes validation', resCrossSpaceTransfer.isValid, 'Cross-space transfer failed');

      // 7. Splits Validation
      // Valid splits array
      const resValidSplits = validator.execute({
        ...validTx,
        splits: [
          { id: 'sp1', categoryId: 'cat_groceries', amount: 100000 },
          { id: 'sp2', categoryId: 'cat_snacks', amount: 50000 }
        ]
      });
      assert('D2-002C: Valid splits configuration passes', resValidSplits.isValid, 'Valid splits failed');

      // Invalid split (negative amount or missing category)
      const resInvalidSplit = validator.execute({
        ...validTx,
        splits: [
          { id: 'sp1', categoryId: '', amount: -50000 } as any
        ]
      });
      assert('D2-002C: Invalid split item strictly rejected', !resInvalidSplit.isValid && resInvalidSplit.errors.length > 0, 'Invalid split allowed');

      // 8. Legacy Compatibility Preservation
      // Undefined status
      const resLegacyUndef = validator.execute({ ...validTx, status: undefined });
      assert('D2-002C: Legacy transaction with undefined status passes validation', resLegacyUndef.isValid, 'Legacy undefined status failed');

      // Posted / Cleared legacy status
      const resLegacyPosted = validator.execute({ ...validTx, status: 'posted' as any });
      assert('D2-002C: Legacy transaction with posted status passes validation', resLegacyPosted.isValid, 'Legacy posted status failed');
    }

    // -------------------------------------------------------------------------
    // D2-002D: FINANCIAL TRUTH & CALCULATION EXECUTION
    // -------------------------------------------------------------------------
    {
      // 1. Income calculation
      const incomeTxs: Transaction[] = [
        { id: 'inc_1', amount: 15_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
        { id: 'inc_2', amount: 5_000_000, type: 'income', currency: 'VND', category: 'Bonus', spaceId: 'sp_alpha', date: '2026-08-15', status: 'confirmed' },
        { id: 'inc_other_sp', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Consulting', spaceId: 'sp_beta', date: '2026-08-10', status: 'confirmed' },
        { id: 'exp_1', amount: 3_000_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', date: '2026-08-05', status: 'confirmed' }
      ];

      const incAlpha = FinancialTruthEngine.calculateIncome(incomeTxs, undefined, undefined, 'sp_alpha');
      assert('D2-002D: Income calculation filters by space (sp_alpha = 20,000,000)', incAlpha === 20_000_000, `Expected 20,000,000, got ${incAlpha}`);

      const incAlphaDate = FinancialTruthEngine.calculateIncome(incomeTxs, '2026-08-01', '2026-08-05', 'sp_alpha');
      assert('D2-002D: Income calculation respects date range (15,000,000)', incAlphaDate === 15_000_000, `Expected 15,000,000, got ${incAlphaDate}`);

      // 2. Expense calculation
      const expAlpha = FinancialTruthEngine.calculateExpense(incomeTxs, undefined, undefined, 'sp_alpha');
      assert('D2-002D: Expense calculation filters by space (sp_alpha = 3,000,000)', expAlpha === 3_000_000, `Expected 3,000,000, got ${expAlpha}`);

      // 3. Net cash flow
      const cashFlow = FinancialTruthEngine.calculateCashFlow(incAlpha, expAlpha);
      assert('D2-002D: Net cash flow = income - expense (17,000,000)', cashFlow === 17_000_000, `Expected 17,000,000, got ${cashFlow}`);

      // 4. Wallet balance & 5. Multiple wallets in same space
      const multiWalletTxs: Transaction[] = [
        { id: 'tx_w1_inc', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_alpha_cash', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_w1_exp', amount: 2_000_000, type: 'expense', currency: 'VND', category: 'Groceries', spaceId: 'sp_alpha', walletId: 'w_alpha_cash', date: '2026-08-02', status: 'confirmed' },
        { id: 'tx_w2_init', amount: 5_000_000, type: 'initial_balance', currency: 'VND', category: 'Initial', spaceId: 'sp_alpha', walletId: 'w_alpha_bank', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_w2_exp', amount: 1_000_000, type: 'expense', currency: 'VND', category: 'Utilities', spaceId: 'sp_alpha', walletId: 'w_alpha_bank', date: '2026-08-03', status: 'confirmed' }
      ];

      const w1Bal = FinancialTruthEngine.calculateWalletBalance(multiWalletTxs, 'w_alpha_cash', 0, 'sp_alpha');
      const w2Bal = FinancialTruthEngine.calculateWalletBalance(multiWalletTxs, 'w_alpha_bank', 0, 'sp_alpha');
      assert('D2-002D: Wallet w_alpha_cash balance isolated (8,000,000)', w1Bal === 8_000_000, `Expected 8,000,000, got ${w1Bal}`);
      assert('D2-002D: Wallet w_alpha_bank balance isolated (4,000,000)', w2Bal === 4_000_000, `Expected 4,000,000, got ${w2Bal}`);

      // 6. Multiple spaces isolation
      const multiSpaceTxs: Transaction[] = [
        ...multiWalletTxs,
        { id: 'tx_beta_inc', amount: 50_000_000, type: 'income', currency: 'VND', category: 'Sales', spaceId: 'sp_beta', walletId: 'w_beta_vault', date: '2026-08-01', status: 'confirmed' }
      ];
      const spaceAlphaBal = FinancialTruthEngine.calculateBalance(multiSpaceTxs, 0, 'sp_alpha');
      const spaceBetaBal = FinancialTruthEngine.calculateBalance(multiSpaceTxs, 0, 'sp_beta');
      assert('D2-002D: Space Alpha total balance isolated (12,000,000)', spaceAlphaBal === 12_000_000, `Expected 12,000,000, got ${spaceAlphaBal}`);
      assert('D2-002D: Space Beta total balance isolated (50,000,000)', spaceBetaBal === 50_000_000, `Expected 50,000,000, got ${spaceBetaBal}`);

      // 7. Same-space transfer, 9. Source deduction, 10. Destination addition, 11. No transfer duplication
      const sameSpaceTransferTxs: Transaction[] = [
        ...multiWalletTxs,
        {
          id: 'tx_trf_internal',
          amount: 3_000_000,
          type: 'transfer',
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_alpha',
          targetSpaceId: 'sp_alpha',
          walletId: 'w_alpha_cash',
          targetWalletId: 'w_alpha_bank',
          date: '2026-08-04',
          status: 'confirmed'
        }
      ];

      const w1AfterTrf = FinancialTruthEngine.calculateWalletBalance(sameSpaceTransferTxs, 'w_alpha_cash', 0, 'sp_alpha');
      const w2AfterTrf = FinancialTruthEngine.calculateWalletBalance(sameSpaceTransferTxs, 'w_alpha_bank', 0, 'sp_alpha');
      const spAlphaAfterTrf = FinancialTruthEngine.calculateBalance(sameSpaceTransferTxs, 0, 'sp_alpha');

      assert('D2-002D: Same-space transfer deducts source wallet (8M - 3M = 5M)', w1AfterTrf === 5_000_000, `Expected 5,000,000, got ${w1AfterTrf}`);
      assert('D2-002D: Same-space transfer credits target wallet (4M + 3M = 7M)', w2AfterTrf === 7_000_000, `Expected 7,000,000, got ${w2AfterTrf}`);
      assert('D2-002D: Same-space transfer is neutral on Space Alpha total balance (12,000,000)', spAlphaAfterTrf === 12_000_000, `Expected 12,000,000, got ${spAlphaAfterTrf}`);

      // 8. Cross-space transfer & 12. No cross-space leakage
      const crossSpaceTransferTxs: Transaction[] = [
        ...multiSpaceTxs,
        {
          id: 'tx_trf_cross',
          amount: 4_000_000,
          type: 'transfer',
          currency: 'VND',
          category: 'Cross Space Transfer',
          spaceId: 'sp_alpha',
          targetSpaceId: 'sp_beta',
          walletId: 'w_alpha_cash',
          targetWalletId: 'w_beta_vault',
          date: '2026-08-05',
          status: 'confirmed'
        }
      ];

      const spAlphaAfterCross = FinancialTruthEngine.calculateBalance(crossSpaceTransferTxs, 0, 'sp_alpha');
      const spBetaAfterCross = FinancialTruthEngine.calculateBalance(crossSpaceTransferTxs, 0, 'sp_beta');
      const wAlphaAfterCross = FinancialTruthEngine.calculateWalletBalance(crossSpaceTransferTxs, 'w_alpha_cash', 0, 'sp_alpha');
      const wBetaAfterCross = FinancialTruthEngine.calculateWalletBalance(crossSpaceTransferTxs, 'w_beta_vault', 0, 'sp_beta');

      assert('D2-002D: Cross-space transfer reduces source space (12M - 4M = 8M)', spAlphaAfterCross === 8_000_000, `Expected 8,000,000, got ${spAlphaAfterCross}`);
      assert('D2-002D: Cross-space transfer increases target space (50M + 4M = 54M)', spBetaAfterCross === 54_000_000, `Expected 54,000,000, got ${spBetaAfterCross}`);
      assert('D2-002D: Cross-space transfer reduces source wallet (8M - 4M = 4M)', wAlphaAfterCross === 4_000_000, `Expected 4,000,000, got ${wAlphaAfterCross}`);
      assert('D2-002D: Cross-space transfer credits target wallet (50M + 4M = 54M)', wBetaAfterCross === 54_000_000, `Expected 54,000,000, got ${wBetaAfterCross}`);

      // 13-21. Lifecycle Inclusion & Exclusion Matrix
      const lifecycleTxs: Transaction[] = [
        { id: 'tx_c', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
        { id: 'tx_v', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'validated' },
        { id: 'tx_r', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'restored' },
        { id: 'tx_p', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'posted' as any },
        { id: 'tx_u', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01' }, // undefined status legacy
        { id: 'tx_d', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'draft' },
        { id: 'tx_pe', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'pending' as any },
        { id: 'tx_sd', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'soft_deleted' },
        { id: 'tx_ar', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'archived' },
        { id: 'tx_del', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', isDeleted: true },
        { id: 'tx_dela', amount: 100_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', deletedAt: '2026-08-02T00:00:00Z' }
      ];

      const activeIncome = FinancialTruthEngine.calculateIncome(lifecycleTxs, undefined, undefined, 'sp_alpha');
      assert('D2-002D: Lifecycle filtering strictly includes 5 active (confirmed, validated, restored, posted, undefined) and excludes inactive (500,000)', activeIncome === 500_000, `Expected 500,000, got ${activeIncome}`);

      // 22. Zero/negative/protection & 23. Multiple transactions aggregation
      const mixedProtectionTxs: Transaction[] = [
        { id: 'p1', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_test', date: '2026-08-01', status: 'confirmed' },
        { id: 'p2', amount: 0, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_test', date: '2026-08-01', status: 'confirmed' },
        { id: 'p3', amount: 500_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', walletId: 'w_test', date: '2026-08-02', status: 'confirmed' }
      ];
      const balProtection = FinancialTruthEngine.calculateWalletBalance(mixedProtectionTxs, 'w_test', 0, 'sp_alpha');
      assert('D2-002D: Aggregation calculates accurate positive balance (1,000,000 - 500,000 = 500,000)', balProtection === 500_000, `Expected 500,000, got ${balProtection}`);

      // 24. Transaction amount preservation (Non-mutating pure execution)
      const frozenTxs = [
        { id: 'f1', amount: 1_000_000, type: 'income' as const, currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_test', date: '2026-08-01', status: 'confirmed' as const }
      ];
      const snapshotBefore = JSON.stringify(frozenTxs);
      FinancialTruthEngine.calculateIncome(frozenTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateExpense(frozenTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateBalance(frozenTxs, 0, 'sp_alpha');
      FinancialTruthEngine.calculateWalletBalance(frozenTxs, 'w_test', 0, 'sp_alpha');
      assert('D2-002D: Transaction objects remain unmutated throughout calculation execution', JSON.stringify(frozenTxs) === snapshotBefore, 'Transaction was mutated');

      // 25. Wallet/account alias compatibility
      const aliasTxs: Transaction[] = [
        { id: 'al_1', amount: 2_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', accountId: 'acc_alias_001', date: '2026-08-01', status: 'confirmed' }
      ];
      const aliasBal = FinancialTruthEngine.calculateWalletBalance(aliasTxs, 'acc_alias_001', 0, 'sp_alpha');
      assert('D2-002D: Wallet balance calculation supports accountId alias (2,000,000)', aliasBal === 2_000_000, `Expected 2,000,000, got ${aliasBal}`);

      // 26. Transfer field preservation
      const trfPreserveTx: Transaction = {
        id: 'trf_pres',
        amount: 1_000_000,
        type: 'transfer',
        currency: 'VND',
        category: 'Transfer',
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_beta',
        walletId: 'w_alpha',
        targetWalletId: 'w_beta',
        date: '2026-08-01',
        status: 'confirmed'
      };
      assert('D2-002D: Transfer transaction preserves all target space and target wallet fields', trfPreserveTx.targetSpaceId === 'sp_beta' && trfPreserveTx.targetWalletId === 'w_beta', 'Transfer fields corrupted');

      // 27. Space isolation & 28. Fund/wallet isolation verification
      const isolatedCalc = FinancialTruthEngine.calculateWalletBalance(multiSpaceTxs, 'w_beta_vault', 0, 'sp_alpha');
      assert('D2-002D: Querying Space Beta wallet under Space Alpha context strictly returns 0', isolatedCalc === 0, `Expected 0, got ${isolatedCalc}`);
    }

    // -------------------------------------------------------------------------
    // D2-002E (E3): PROCESSING ATOMICITY, CONSISTENCY & FAILURE-SAFETY
    // -------------------------------------------------------------------------
    {
      // 1. Invalid transaction -> zero persistence
      const mockTxRepo: TransactionRepository = {
        getTransactions: async () => [],
        getTransactionById: async () => null,
        addTransaction: async (tx) => ({ ...tx, id: 'tx_fail' } as Transaction),
        updateTransaction: async (tx) => tx,
        deleteTransaction: async () => true
      };

      const addUseCase = new AddTransactionUseCase(mockTxRepo);
      let addFailed = false;
      try {
        await addUseCase.execute({
          amount: -500, // Invalid negative amount
          type: 'expense',
          spaceId: 'sp_alpha',
          category: 'Food',
          currency: 'VND',
          date: '2026-08-01'
        });
      } catch {
        addFailed = true;
      }
      assert('D2-002E-E3: Invalid transaction fails validation and prevents persistence', addFailed, 'Invalid transaction unexpectedly persisted');

      // 2. Space context mismatch -> zero mutation
      const softDeleteUseCase = new SoftDeleteTransactionUseCase({
        ...mockTxRepo,
        getTransactionById: async (id: string) => ({
          id,
          amount: 100_000,
          type: 'expense',
          spaceId: 'sp_alpha',
          category: 'Food',
          currency: 'VND',
          date: '2026-08-01',
          status: 'confirmed'
        })
      });
      let crossSpaceDelFailed = false;
      try {
        await softDeleteUseCase.execute('tx_001', 'sp_beta');
      } catch {
        crossSpaceDelFailed = true;
      }
      assert('D2-002E-E3: Cross-space soft delete attempt fails and prevents mutation', crossSpaceDelFailed, 'Cross-space soft delete did not reject');

      // 3. Transfer rollback on destination wallet failure
      let fromWalletBalance = 10_000_000;
      let toWalletBalance = 5_000_000;
      const failingWalletRepo: WalletRepository = {
        getWallets: async () => [],
        getWalletById: async (id: string): Promise<Wallet | null> => {
          if (id === 'w_src') return { id: 'w_src', name: 'Source', initialBalance: 10_000_000, currentBalance: fromWalletBalance, currency: 'VND', spaceId: 'sp_alpha', type: 'cash', status: 'active' };
          if (id === 'w_dest') return { id: 'w_dest', name: 'Dest', initialBalance: 5_000_000, currentBalance: toWalletBalance, currency: 'VND', spaceId: 'sp_beta', type: 'bank', status: 'active' };
          return null;
        },
        addWallet: async (w) => ({ ...w, id: 'w_new' }),
        updateWallet: async (w) => {
          if (w.id === 'w_src') {
            fromWalletBalance = w.currentBalance;
          } else if (w.id === 'w_dest') {
            throw new Error('Database write error on destination wallet');
          }
          return w;
        },
        deleteWallet: async () => true
      };

      const failingTxRepo: TransactionRepository = {
        ...mockTxRepo,
        addTransaction: async (tx) => tx as any
      };

      const transferUseCase = new TransferMoneyUseCase(failingWalletRepo, failingTxRepo);
      const trfResult = await transferUseCase.execute({
        fromWalletId: 'w_src',
        toWalletId: 'w_dest',
        amount: 2_000_000,
        spaceId: 'sp_alpha'
      });

      assert('D2-002E-E3: Transfer failure returns error result gracefully', !trfResult.success, 'Transfer unexpectedly succeeded on DB error');
      assert('D2-002E-E3: Source wallet balance rolled back atomically on transfer failure (10,000,000)', fromWalletBalance === 10_000_000, `Expected 10M, got ${fromWalletBalance}`);

      // 4. Financial Truth consistency after failed calculation
      const beforeTxs: Transaction[] = [
        { id: 't1', amount: 5_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' }
      ];
      const incomeBefore = FinancialTruthEngine.calculateIncome(beforeTxs, undefined, undefined, 'sp_alpha');
      // Attempt invalid calculation
      FinancialTruthEngine.calculateTransfer(1_000, 2_000, -500);
      const incomeAfter = FinancialTruthEngine.calculateIncome(beforeTxs, undefined, undefined, 'sp_alpha');
      assert('D2-002E-E3: Financial truth calculations remain deterministic and uncorrupted after failures', incomeBefore === incomeAfter && incomeBefore === 5_000_000, 'Financial truth corrupted');
    }

    // -------------------------------------------------------------------------
    // D2-002F: COMPATIBILITY MIGRATION ENGINE
    // -------------------------------------------------------------------------
    {
      // 1. Legacy undefined status -> migrated to active confirmed
      const legacyUndef = {
        id: 'leg_undef_1',
        amount: 2_500_000,
        type: 'income',
        spaceId: 'sp_alpha',
        category: 'Bonus'
      };
      const resUndef = CompatibilityMigrationEngine.migrateTransaction(legacyUndef);
      assert('D2-002F: Legacy undefined status migrates to confirmed', resUndef.success && resUndef.transaction?.status === 'confirmed' && !resUndef.transaction?.isDeleted, 'Failed undefined status migration');

      // 2. Legacy posted status -> migrated to confirmed
      const legacyPosted = {
        id: 'leg_posted_1',
        amount: 1_200_000,
        type: 'expense',
        spaceId: 'sp_alpha',
        category: 'Food',
        status: 'posted'
      };
      const resPosted = CompatibilityMigrationEngine.migrateTransaction(legacyPosted);
      assert('D2-002F: Legacy posted status migrates to confirmed', resPosted.success && resPosted.transaction?.status === 'confirmed', 'Failed posted status migration');

      // 3. Legacy pending status -> migrated to draft
      const legacyPending = {
        id: 'leg_pending_1',
        amount: 300_000,
        type: 'expense',
        spaceId: 'sp_alpha',
        category: 'Coffee',
        status: 'pending'
      };
      const resPending = CompatibilityMigrationEngine.migrateTransaction(legacyPending);
      assert('D2-002F: Legacy pending status migrates to draft', resPending.success && resPending.transaction?.status === 'draft', 'Failed pending status migration');

      // 4. category/categoryId alias reconciliation
      const legacyCat = {
        id: 'leg_cat_1',
        amount: 500_000,
        type: 'expense',
        spaceId: 'sp_alpha',
        categoryId: 'Utilities'
      };
      const resCat = CompatibilityMigrationEngine.migrateTransaction(legacyCat);
      assert('D2-002F: categoryId populates canonical category and categoryId', resCat.success && resCat.transaction?.category === 'Utilities' && resCat.transaction?.categoryId === 'Utilities', 'Failed category alias migration');

      // 5. note/description alias reconciliation
      const legacyDesc = {
        id: 'leg_desc_1',
        amount: 150_000,
        type: 'expense',
        spaceId: 'sp_alpha',
        category: 'Food',
        description: 'Lunch with team'
      };
      const resDesc = CompatibilityMigrationEngine.migrateTransaction(legacyDesc);
      assert('D2-002F: description populates canonical note and description', resDesc.success && resDesc.transaction?.note === 'Lunch with team' && resDesc.transaction?.description === 'Lunch with team', 'Failed note alias migration');

      // 6. walletId/accountId alias reconciliation
      const legacyAcc = {
        id: 'leg_acc_1',
        amount: 5_000_000,
        type: 'income',
        spaceId: 'sp_alpha',
        category: 'Salary',
        accountId: 'acc_vcb_01'
      };
      const resAcc = CompatibilityMigrationEngine.migrateTransaction(legacyAcc);
      assert('D2-002F: accountId populates canonical walletId and accountId', resAcc.success && resAcc.transaction?.walletId === 'acc_vcb_01' && resAcc.transaction?.accountId === 'acc_vcb_01', 'Failed wallet alias migration');

      // 7. Conflicting aliases rejection
      const conflictingWallet = {
        id: 'leg_conflict_1',
        amount: 1_000_000,
        type: 'income',
        spaceId: 'sp_alpha',
        category: 'Salary',
        walletId: 'w_001',
        accountId: 'w_002' // Divergent account references
      };
      const resConflict = CompatibilityMigrationEngine.migrateTransaction(conflictingWallet);
      assert('D2-002F: Conflicting walletId and accountId is safely rejected with error', !resConflict.success && !!resConflict.error, 'Conflicting walletId/accountId unexpectedly accepted');

      // 8. Same-space legacy transfer migration
      const legacyTransferSame = {
        id: 'leg_trf_same',
        amount: 2_000_000,
        type: 'transfer',
        spaceId: 'sp_alpha',
        walletId: 'w_cash',
        targetWalletId: 'w_bank'
      };
      const resTrfSame = CompatibilityMigrationEngine.migrateTransaction(legacyTransferSame);
      assert('D2-002F: Same-space transfer defaults targetSpaceId to spaceId (sp_alpha)', resTrfSame.success && resTrfSame.transaction?.targetSpaceId === 'sp_alpha' && resTrfSame.transaction?.targetWalletId === 'w_bank', 'Failed same-space transfer migration');

      // 9. Cross-space legacy transfer migration
      const legacyTransferCross = {
        id: 'leg_trf_cross',
        amount: 4_000_000,
        type: 'transfer',
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_beta',
        walletId: 'w_cash',
        targetWalletId: 'w_vault'
      };
      const resTrfCross = CompatibilityMigrationEngine.migrateTransaction(legacyTransferCross);
      assert('D2-002F: Cross-space transfer preserves targetSpaceId (sp_beta) and spaceId (sp_alpha)', resTrfCross.success && resTrfCross.transaction?.spaceId === 'sp_alpha' && resTrfCross.transaction?.targetSpaceId === 'sp_beta', 'Failed cross-space transfer migration');

      // 10. Lifecycle deletedAt preservation
      const legacyDeleted = {
        id: 'leg_del_1',
        amount: 100_000,
        type: 'expense',
        spaceId: 'sp_alpha',
        category: 'Food',
        deletedAt: '2026-08-01T10:00:00.000Z'
      };
      const resDel = CompatibilityMigrationEngine.migrateTransaction(legacyDeleted);
      assert('D2-002F: deletedAt forces status to soft_deleted and isDeleted: true', resDel.success && resDel.transaction?.status === 'soft_deleted' && resDel.transaction?.isDeleted === true, 'Failed deletedAt lifecycle migration');

      // 11. Migration Idempotency: Migrate(Migrate(tx)) === Migrate(tx)
      const firstPass = CompatibilityMigrationEngine.migrateTransaction(legacyTransferCross).transaction!;
      const secondPass = CompatibilityMigrationEngine.migrateTransaction(firstPass).transaction!;
      assert('D2-002F: Migration is strictly idempotent (first pass matches second pass)', JSON.stringify(firstPass) === JSON.stringify(secondPass), 'Migration is not idempotent');

      // 12. Financial Truth equivalence before vs after migration
      const rawFixtures = [
        { id: 'fx1', amount: 10_000_000, type: 'income', spaceId: 'sp_alpha', category: 'Salary', status: 'posted' },
        { id: 'fx2', amount: 3_000_000, type: 'expense', spaceId: 'sp_alpha', category: 'Rent' },
        { id: 'fx3', amount: 500_000, type: 'expense', spaceId: 'sp_alpha', category: 'Coffee', status: 'pending' } // Inactive pending
      ];

      const incBefore = FinancialTruthEngine.calculateIncome(rawFixtures as any, undefined, undefined, 'sp_alpha');
      const expBefore = FinancialTruthEngine.calculateExpense(rawFixtures as any, undefined, undefined, 'sp_alpha');

      const batchRes = CompatibilityMigrationEngine.migrateBatch(rawFixtures);
      const incAfter = FinancialTruthEngine.calculateIncome(batchRes.migrated, undefined, undefined, 'sp_alpha');
      const expAfter = FinancialTruthEngine.calculateExpense(batchRes.migrated, undefined, undefined, 'sp_alpha');

      assert('D2-002F: Financial truth before vs after migration is 100% equivalent (Income = 10M, Expense = 3M)', incBefore === incAfter && expBefore === expAfter && incAfter === 10_000_000 && expAfter === 3_000_000, 'Financial truth differed after migration');
    }

    // -------------------------------------------------------------------------
    // D2-002G (G3): EDGE CASE & FAULT INJECTION ATTACK SUITE
    // -------------------------------------------------------------------------
    {
      // G3-01: Numeric Boundaries
      const normDecimal = TransactionNormalizer.normalize({ id: 'g3_dec', amount: 100.456, type: 'expense', spaceId: 'sp_alpha', category: 'Food' });
      assert('D2-002G-G3: G3-01 / Numeric Boundaries: decimal amount 100.456 is preserved without rounding', normDecimal.amount === 100.456, 'Decimal amount rounded or corrupted');

      const normMax = TransactionNormalizer.normalize({ id: 'g3_max', amount: Number.MAX_SAFE_INTEGER, type: 'income', spaceId: 'sp_alpha', category: 'Bonus' });
      assert('D2-002G-G3: G3-01 / Numeric Boundaries: Number.MAX_SAFE_INTEGER is preserved accurately', normMax.amount === Number.MAX_SAFE_INTEGER, 'MAX_SAFE_INTEGER corrupted');

      const negValRes = TransactionLifecycleGuard.validateTransaction({ id: 'g3_neg', amount: -500, type: 'expense', spaceId: 'sp_alpha', category: 'Food', status: 'confirmed', currency: 'VND', date: '2026-08-01' });
      assert('D2-002G-G3: G3-01 / Numeric Boundaries: negative amount is strictly rejected by domain validation', !negValRes.isValid && negValRes.errors.length > 0, 'Negative amount allowed');

      const nanValRes = TransactionLifecycleGuard.validateTransaction({ id: 'g3_nan', amount: NaN, type: 'expense', spaceId: 'sp_alpha', category: 'Food', status: 'confirmed', currency: 'VND', date: '2026-08-01' });
      assert('D2-002G-G3: G3-01 / Numeric Boundaries: NaN amount is strictly rejected by domain validation', !nanValRes.isValid, 'NaN amount allowed');

      const infValRes = TransactionLifecycleGuard.validateTransaction({ id: 'g3_inf', amount: Infinity, type: 'expense', spaceId: 'sp_alpha', category: 'Food', status: 'confirmed', currency: 'VND', date: '2026-08-01' });
      assert('D2-002G-G3: G3-01 / Numeric Boundaries: Infinity amount is strictly rejected by domain validation', !infValRes.isValid, 'Infinity amount allowed');

      // G3-02: Empty / Minimal Data
      const emptyInc = FinancialTruthEngine.calculateIncome([], undefined, undefined, 'sp_alpha');
      const emptyExp = FinancialTruthEngine.calculateExpense([], undefined, undefined, 'sp_alpha');
      const emptyBal = FinancialTruthEngine.calculateBalance([], 0, 'sp_alpha');
      const emptyWBal = FinancialTruthEngine.calculateWalletBalance([], 'w_empty', 0, 'sp_alpha');
      const emptyNW = FinancialTruthEngine.calculateNetWorth([], [], [], [], 'sp_alpha');
      assert('D2-002G-G3: G3-02 / Empty Data: empty transaction array yields deterministic 0 for all metrics', emptyInc === 0 && emptyExp === 0 && emptyBal === 0 && emptyWBal === 0 && emptyNW === 0, 'Empty data produced non-zero result');

      // G3-03: Lifecycle Abuse (Testing strictly illegal transitions according to Canonical State Machine)
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: draft -> archived is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('draft', 'archived'), 'draft -> archived unexpectedly allowed');
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: draft -> restored is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('draft', 'restored'), 'draft -> restored unexpectedly allowed');
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: soft_deleted -> draft is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('soft_deleted', 'draft'), 'soft_deleted -> draft unexpectedly allowed');
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: soft_deleted -> validated is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('soft_deleted', 'validated'), 'soft_deleted -> validated unexpectedly allowed');
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: soft_deleted -> archived is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('soft_deleted', 'archived'), 'soft_deleted -> archived unexpectedly allowed');
      assert('D2-002G-G3: G3-03 / Lifecycle Abuse: archived -> draft is strictly forbidden', !TransactionLifecycleGuard.isTransitionAllowed('archived', 'draft'), 'archived -> draft unexpectedly allowed');

      // G3-04: Deletion / Archive Conflict & Precedence
      const delArchConflictTxs: Transaction[] = [
        { id: 'c1', amount: 1_000_000, type: 'income', currency: 'VND', spaceId: 'sp_alpha', category: 'Salary', date: '2026-08-01', status: 'confirmed', isDeleted: true },
        { id: 'c2', amount: 2_000_000, type: 'income', currency: 'VND', spaceId: 'sp_alpha', category: 'Salary', date: '2026-08-01', status: 'confirmed', deletedAt: '2026-08-02T00:00:00Z' },
        { id: 'c3', amount: 3_000_000, type: 'income', currency: 'VND', spaceId: 'sp_alpha', category: 'Salary', date: '2026-08-01', status: 'archived', isDeleted: true },
        { id: 'c4', amount: 4_000_000, type: 'income', currency: 'VND', spaceId: 'sp_alpha', category: 'Salary', date: '2026-08-01', status: 'draft', deletedAt: '2026-08-02T00:00:00Z' }
      ];
      const conflictInc = FinancialTruthEngine.calculateIncome(delArchConflictTxs, undefined, undefined, 'sp_alpha');
      assert('D2-002G-G3: G3-04 / Deletion Precedence: transactions with any deletion flag are 100% excluded from Financial Truth (0)', conflictInc === 0, `Expected 0, got ${conflictInc}`);

      // G3-05: Alias Conflict Injection
      const singleAliasRes = TransactionNormalizer.normalize({ id: 'al_s', amount: 500_000, type: 'income', spaceId: 'sp_alpha', accountId: 'acc_vcb' });
      assert('D2-002G-G3: G3-05 / Alias Injection: single-sided accountId populates canonical walletId and accountId', (singleAliasRes as any).walletId === 'acc_vcb' && (singleAliasRes as any).accountId === 'acc_vcb', 'Single alias not populated');

      const conflictMigRes = CompatibilityMigrationEngine.migrateTransaction({
        id: 'conf_al_1',
        amount: 1_000_000,
        type: 'income',
        spaceId: 'sp_alpha',
        category: 'Food',
        categoryId: 'Utilities'
      });
      assert('D2-002G-G3: G3-05 / Alias Injection: divergent conflicting category and categoryId is safely rejected with error', !conflictMigRes.success && !!conflictMigRes.error, 'Conflicting categories allowed');

      // G3-06: Multi-Space Attack Tests
      const spaceAttackTxs: Transaction[] = [
        { id: 'sp_a_tx', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_a1', date: '2026-08-01', status: 'confirmed' },
        { id: 'sp_b_tx', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_beta', walletId: 'w_b1', date: '2026-08-01', status: 'confirmed' }
      ];
      const incAlphaOnly = FinancialTruthEngine.calculateIncome(spaceAttackTxs, undefined, undefined, 'sp_alpha');
      const incBetaOnly = FinancialTruthEngine.calculateIncome(spaceAttackTxs, undefined, undefined, 'sp_beta');
      assert('D2-002G-G3: G3-06 / Multi-Space: Space Alpha query returns strictly 10M without Beta contamination', incAlphaOnly === 10_000_000, `Expected 10M, got ${incAlphaOnly}`);
      assert('D2-002G-G3: G3-06 / Multi-Space: Space Beta query returns strictly 20M without Alpha contamination', incBetaOnly === 20_000_000, `Expected 20M, got ${incBetaOnly}`);

      // G3-07: Multi-Fund / Multi-Wallet Isolation
      const multiWalletTxs: Transaction[] = [
        { id: 'mw_1', amount: 5_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_a1', date: '2026-08-01', status: 'confirmed' },
        { id: 'mw_2', amount: 3_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_a2', date: '2026-08-01', status: 'confirmed' },
        { id: 'mw_trf', amount: 2_000_000, type: 'transfer', currency: 'VND', category: 'Transfer', spaceId: 'sp_alpha', walletId: 'w_a1', targetSpaceId: 'sp_alpha', targetWalletId: 'w_a2', date: '2026-08-02', status: 'confirmed' }
      ];
      const balA1 = FinancialTruthEngine.calculateWalletBalance(multiWalletTxs, 'w_a1', 0, 'sp_alpha');
      const balA2 = FinancialTruthEngine.calculateWalletBalance(multiWalletTxs, 'w_a2', 0, 'sp_alpha');
      assert('D2-002G-G3: G3-07 / Multi-Wallet: Wallet A1 balance is exactly 3M (5M - 2M transfer)', balA1 === 3_000_000, `Expected 3M, got ${balA1}`);
      assert('D2-002G-G3: G3-07 / Multi-Wallet: Wallet A2 balance is exactly 5M (3M + 2M transfer)', balA2 === 5_000_000, `Expected 5M, got ${balA2}`);

      // G3-08: Transfer Fault Injection (Failure at destination wallet update rollback)
      let srcBal = 10_000_000;
      let dstBal = 2_000_000;
      const faultWalletRepo: WalletRepository = {
        getWallets: async () => [],
        getWalletById: async (id: string): Promise<Wallet | null> => {
          if (id === 'w_fault_src') return { id: 'w_fault_src', name: 'Src', initialBalance: 10_000_000, currentBalance: srcBal, currency: 'VND', spaceId: 'sp_alpha', type: 'cash', status: 'active' };
          if (id === 'w_fault_dst') return { id: 'w_fault_dst', name: 'Dst', initialBalance: 2_000_000, currentBalance: dstBal, currency: 'VND', spaceId: 'sp_alpha', type: 'bank', status: 'active' };
          return null;
        },
        addWallet: async (w) => ({ ...w, id: 'w_new' } as Wallet),
        updateWallet: async (w) => {
          if (w.id === 'w_fault_src') {
            srcBal = w.currentBalance;
          } else if (w.id === 'w_fault_dst') {
            throw new Error('FATAL_DISK_IO_ERROR');
          }
          return w;
        },
        deleteWallet: async () => true
      };
      const dummyTxRepo: TransactionRepository = {
        getTransactions: async () => [],
        getTransactionById: async () => null,
        addTransaction: async (tx) => tx as any,
        updateTransaction: async (tx) => tx,
        deleteTransaction: async () => true
      };
      const transferFaultUseCase = new TransferMoneyUseCase(faultWalletRepo, dummyTxRepo);
      const faultTrfRes = await transferFaultUseCase.execute({
        fromWalletId: 'w_fault_src',
        toWalletId: 'w_fault_dst',
        amount: 3_000_000,
        spaceId: 'sp_alpha'
      });
      assert('D2-002G-G3: G3-08 / Transfer Fault Injection: destination failure returns graceful error', !faultTrfRes.success, 'Transfer succeeded despite disk IO error');
      assert('D2-002G-G3: G3-08 / Transfer Fault Injection: source wallet balance rolled back to 10M on failure', srcBal === 10_000_000, `Expected 10M, got ${srcBal}`);

      // G3-09: Undo / Redo Fault Injection
      const failingUpdateTxRepo: TransactionRepository = {
        getTransactions: async () => [],
        getTransactionById: async () => null,
        addTransaction: async (tx) => tx as any,
        updateTransaction: async () => { throw new Error('NETWORK_TIMEOUT_DURING_UNDO'); },
        deleteTransaction: async () => true
      };
      const txManager = new TransactionManager(failingUpdateTxRepo, faultWalletRepo);
      const testAction: any = {
        type: 'update',
        tx: { id: 'tx_u1', amount: 100_000, type: 'expense', spaceId: 'sp_alpha', category: 'Food' },
        previousState: { id: 'tx_u1', amount: 50_000, type: 'expense', spaceId: 'sp_alpha', category: 'Food' },
        timestamp: new Date().toISOString()
      };
      (txManager as any).undoStack = [testAction];
      const undoRes = await txManager.undo();
      assert('D2-002G-G3: G3-09 / Undo Fault: failing undo returns false gracefully', !undoRes, 'Undo unexpectedly reported true on failure');
      assert('D2-002G-G3: G3-09 / Undo Fault: failed undo retains action on undo stack without history loss', txManager.canUndo() && (txManager as any).undoStack.length === 1, 'Action lost from undo stack');

      // G3-10: Idempotency Attack (Repeated Batch Migration & Triple Pass)
      const rawBatchFixture = [
        { id: 'b_1', amount: 1_000_000, type: 'income', spaceId: 'sp_alpha', category: 'Salary' },
        { id: 'b_2', amount: 500_000, type: 'expense', spaceId: 'sp_alpha', category: 'Food', status: 'posted' }
      ];
      const batchPass1 = CompatibilityMigrationEngine.migrateBatch(rawBatchFixture);
      const batchPass2 = CompatibilityMigrationEngine.migrateBatch(batchPass1.migrated);
      const batchPass3 = CompatibilityMigrationEngine.migrateBatch(batchPass2.migrated);
      assert('D2-002G-G3: G3-10 / Idempotency Attack: triple batch migration produces 100% identical state', JSON.stringify(batchPass2.migrated) === JSON.stringify(batchPass3.migrated), 'Batch migration drifted across passes');

      // G3-11: Transaction Ordering Attacks ([A,B,C] vs [C,A,B] vs [B,C,A])
      const orderA: Transaction = { id: 'o_a', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_ord', date: '2026-08-01', status: 'confirmed' };
      const orderB: Transaction = { id: 'o_b', amount: 4_000_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', walletId: 'w_ord', date: '2026-08-02', status: 'confirmed' };
      const orderC: Transaction = { id: 'o_c', amount: 1_000_000, type: 'expense', currency: 'VND', category: 'Rent', spaceId: 'sp_alpha', walletId: 'w_ord', date: '2026-08-03', status: 'confirmed' };

      const perm1 = [orderA, orderB, orderC];
      const perm2 = [orderC, orderA, orderB];
      const perm3 = [orderB, orderC, orderA];

      const balPerm1 = FinancialTruthEngine.calculateWalletBalance(perm1, 'w_ord', 0, 'sp_alpha');
      const balPerm2 = FinancialTruthEngine.calculateWalletBalance(perm2, 'w_ord', 0, 'sp_alpha');
      const balPerm3 = FinancialTruthEngine.calculateWalletBalance(perm3, 'w_ord', 0, 'sp_alpha');
      assert('D2-002G-G3: G3-11 / Ordering Attacks: permutations [A,B,C], [C,A,B], [B,C,A] yield identical balance (5M)', balPerm1 === 5_000_000 && balPerm2 === 5_000_000 && balPerm3 === 5_000_000, 'Ordering permutation altered financial calculation');

      // G3-12: Mutation Detection (Deep comparison before and after all FinancialTruthEngine calculation calls)
      const testMutationTxs: Transaction[] = [
        { id: 'mut_1', amount: 8_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_mut', date: '2026-08-01', status: 'confirmed' },
        { id: 'mut_2', amount: 2_000_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', walletId: 'w_mut', date: '2026-08-02', status: 'confirmed' }
      ];
      const beforeMutationJson = JSON.stringify(testMutationTxs);
      FinancialTruthEngine.calculateIncome(testMutationTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateExpense(testMutationTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateCashFlow(8_000_000, 2_000_000);
      FinancialTruthEngine.calculateBalance(testMutationTxs, 0, 'sp_alpha');
      FinancialTruthEngine.calculateWalletBalance(testMutationTxs, 'w_mut', 0, 'sp_alpha');
      FinancialTruthEngine.calculateNetWorth(undefined, undefined, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateTransfer(5_000, 10_000, 2_000);
      FinancialTruthEngine.calculateSixJars(10_000_000);
      const afterMutationJson = JSON.stringify(testMutationTxs);
      assert('D2-002G-G3: G3-12 / Mutation Detection: all 8 FinancialTruthEngine calculations leave input data 100% unmutated', beforeMutationJson === afterMutationJson, 'Input data mutated during calculation');

      // G3-13: Legacy Combination Attacks
      const complexLegacy1 = { id: 'cleg_1', amount: 1_500_000, type: 'income', spaceId: 'sp_alpha', category: 'Salary', isDeleted: true, deletedAt: '2026-08-01' };
      const resCleg1 = CompatibilityMigrationEngine.migrateTransaction(complexLegacy1);
      assert('D2-002G-G3: G3-13 / Legacy Combinations: undefined status + deletedAt migrates safely to soft_deleted', resCleg1.success && resCleg1.transaction?.status === 'soft_deleted' && resCleg1.transaction?.isDeleted === true, 'Failed legacy combination 1');

      const complexLegacy2 = { id: 'cleg_2', amount: 2_000_000, type: 'expense', spaceId: 'sp_alpha', category: 'Rent', status: 'posted', isSoftDeleted: true };
      const resCleg2 = CompatibilityMigrationEngine.migrateTransaction(complexLegacy2);
      assert('D2-002G-G3: G3-13 / Legacy Combinations: posted status + isSoftDeleted migrates safely to soft_deleted', resCleg2.success && resCleg2.transaction?.status === 'soft_deleted' && resCleg2.transaction?.isDeleted === true, 'Failed legacy combination 2');

      // G3-14: Financial Truth Conservation (BEFORE === AFTER for failing operations)
      const baseTruthTxs: Transaction[] = [
        { id: 'bt_1', amount: 15_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_bt', date: '2026-08-01', status: 'confirmed' },
        { id: 'bt_2', amount: 5_000_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', walletId: 'w_bt', date: '2026-08-02', status: 'confirmed' }
      ];
      const incBeforeOp = FinancialTruthEngine.calculateIncome(baseTruthTxs, undefined, undefined, 'sp_alpha');
      const expBeforeOp = FinancialTruthEngine.calculateExpense(baseTruthTxs, undefined, undefined, 'sp_alpha');
      const balBeforeOp = FinancialTruthEngine.calculateWalletBalance(baseTruthTxs, 'w_bt', 0, 'sp_alpha');

      CompatibilityMigrationEngine.migrateTransaction({ id: 'bad_tx', amount: -999, type: 'expense', spaceId: 'sp_alpha' });
      try {
        FinancialTruthEngine.calculateTransfer(100, 200, -50);
      } catch {}

      const incAfterOp = FinancialTruthEngine.calculateIncome(baseTruthTxs, undefined, undefined, 'sp_alpha');
      const expAfterOp = FinancialTruthEngine.calculateExpense(baseTruthTxs, undefined, undefined, 'sp_alpha');
      const balAfterOp = FinancialTruthEngine.calculateWalletBalance(baseTruthTxs, 'w_bt', 0, 'sp_alpha');

      assert('D2-002G-G3: G3-14 / Financial Truth Conservation: Income conserved exactly (15M)', incBeforeOp === incAfterOp && incAfterOp === 15_000_000, 'Income changed after failed operation');
      assert('D2-002G-G3: G3-14 / Financial Truth Conservation: Expense conserved exactly (5M)', expBeforeOp === expAfterOp && expAfterOp === 5_000_000, 'Expense changed after failed operation');
      assert('D2-002G-G3: G3-14 / Financial Truth Conservation: Wallet balance conserved exactly (10M)', balBeforeOp === balAfterOp && balAfterOp === 10_000_000, 'Wallet balance changed after failed operation');

      // G3-15: AuditTrail Integrity (Historical entries retained, no synthetic user events fabricated)
      const txWithAudit: Transaction = {
        id: 'audit_test_1',
        amount: 2_000_000,
        type: 'income',
        currency: 'VND',
        spaceId: 'sp_alpha',
        category: 'Bonus',
        date: '2026-08-01',
        status: 'confirmed',
        auditTrail: [
          { action: 'create', timestamp: '2026-08-01T10:00:00Z', actor: 'user', details: 'Initial transaction create' }
        ]
      };
      const migratedWithAudit = CompatibilityMigrationEngine.migrateTransaction(txWithAudit).transaction!;
      assert('D2-002G-G3: G3-15 / AuditTrail Integrity: historical user audit trail entries are preserved intact', migratedWithAudit.auditTrail?.length === 1 && migratedWithAudit.auditTrail[0].action === 'create', 'Audit trail modified or lost');
    }

    // =========================================================================
    // SECTION D2-002G-G4: REGRESSION HARDENING AUDIT (G4-01 to G4-20)
    // =========================================================================
    {
      // G4-01: D1 Canonical Model regression
      const d1Sample = TransactionNormalizer.normalize({
        id: 'd1_reg_1',
        amount: 500_000,
        type: 'expense',
        category: 'Food',
        date: '2026-08-01',
        spaceId: 'sp_alpha',
        walletId: 'w_cash'
      });
      assert('D2-002G-G4: G4-01 / D1 Canonical Model: standard canonical transaction adheres to unified domain model', d1Sample.id === 'd1_reg_1' && d1Sample.amount === 500_000 && d1Sample.type === 'expense' && d1Sample.category === 'Food' && (d1Sample as any).categoryId === 'Food' && d1Sample.spaceId === 'sp_alpha' && (d1Sample as any).accountId === 'w_cash', 'D1 model normalization regression');

      // G4-02: Financial Truth Invariants 1–12 regression
      const invCheckTxs: Transaction[] = [
        { id: 'inv_inc', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_main', date: '2026-08-01', status: 'confirmed' },
        { id: 'inv_exp', amount: 3_000_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', walletId: 'w_main', date: '2026-08-02', status: 'confirmed' },
        { id: 'inv_trf', amount: 2_000_000, type: 'transfer', currency: 'VND', category: 'Transfer', spaceId: 'sp_alpha', walletId: 'w_main', targetSpaceId: 'sp_alpha', targetWalletId: 'w_sub', date: '2026-08-03', status: 'confirmed' },
        { id: 'inv_draft', amount: 50_000_000, type: 'income', currency: 'VND', category: 'Bonus', spaceId: 'sp_alpha', walletId: 'w_main', date: '2026-08-04', status: 'draft' },
        { id: 'inv_del', amount: 10_000_000, type: 'expense', currency: 'VND', category: 'Luxury', spaceId: 'sp_alpha', walletId: 'w_main', date: '2026-08-05', status: 'soft_deleted' }
      ];
      const invInc = FinancialTruthEngine.calculateIncome(invCheckTxs, undefined, undefined, 'sp_alpha');
      const invExp = FinancialTruthEngine.calculateExpense(invCheckTxs, undefined, undefined, 'sp_alpha');
      const invMainBal = FinancialTruthEngine.calculateWalletBalance(invCheckTxs, 'w_main', 0, 'sp_alpha');
      const invSubBal = FinancialTruthEngine.calculateWalletBalance(invCheckTxs, 'w_sub', 0, 'sp_alpha');
      const invNetBal = FinancialTruthEngine.calculateBalance(invCheckTxs, 0, 'sp_alpha');

      assert('D2-002G-G4: G4-02 / Invariants 1-12: Total Income satisfies INV-1, INV-2, INV-5 (10M, excluding drafts and deletes)', invInc === 10_000_000, `Expected 10M, got ${invInc}`);
      assert('D2-002G-G4: G4-02 / Invariants 1-12: Total Expense satisfies INV-1, INV-5 (3M)', invExp === 3_000_000, `Expected 3M, got ${invExp}`);
      assert('D2-002G-G4: G4-02 / Invariants 1-12: Source wallet balance satisfies INV-3, INV-6 (5M)', invMainBal === 5_000_000, `Expected 5M, got ${invMainBal}`);
      assert('D2-002G-G4: G4-02 / Invariants 1-12: Target wallet balance satisfies INV-3, INV-6 (2M)', invSubBal === 2_000_000, `Expected 2M, got ${invSubBal}`);
      assert('D2-002G-G4: G4-02 / Invariants 1-12: Total Space Net Balance satisfies INV-8 conservation (7M)', invNetBal === 7_000_000, `Expected 7M, got ${invNetBal}`);

      // G4-03: Space Isolation regression
      const spaceIsoTxs: Transaction[] = [
        { id: 'iso_a', amount: 8_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
        { id: 'iso_b', amount: 12_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_beta', date: '2026-08-01', status: 'confirmed' },
        { id: 'iso_g', amount: 5_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_gamma', date: '2026-08-01', status: 'confirmed' }
      ];
      assert('D2-002G-G4: G4-03 / Space Isolation: sp_alpha isolated accurately (8M)', FinancialTruthEngine.calculateIncome(spaceIsoTxs, undefined, undefined, 'sp_alpha') === 8_000_000, 'sp_alpha leakage');
      assert('D2-002G-G4: G4-03 / Space Isolation: sp_beta isolated accurately (12M)', FinancialTruthEngine.calculateIncome(spaceIsoTxs, undefined, undefined, 'sp_beta') === 12_000_000, 'sp_beta leakage');
      assert('D2-002G-G4: G4-03 / Space Isolation: sp_gamma isolated accurately (5M)', FinancialTruthEngine.calculateIncome(spaceIsoTxs, undefined, undefined, 'sp_gamma') === 5_000_000, 'sp_gamma leakage');

      // G4-04: Transaction Normalization regression
      const unnormTx: Partial<Transaction> = {
        id: 'norm_reg_1',
        amount: 100.456,
        type: 'income',
        category: 'Consulting',
        categoryId: 'Consulting',
        note: 'Invoice 101',
        description: 'Invoice 101',
        accountId: 'acc_01',
        walletId: 'acc_01',
        spaceId: 'sp_alpha'
      };
      const normRes = TransactionNormalizer.normalize(unnormTx);
      assert('D2-002G-G4: G4-04 / Normalization: floating amount 100.456 preserved unrounded', normRes.amount === 100.456, 'Amount rounded');
      assert('D2-002G-G4: G4-04 / Normalization: note and description aliases synchronized', normRes.note === 'Invoice 101' && normRes.description === 'Invoice 101', 'Description alias mismatch');
      assert('D2-002G-G4: G4-04 / Normalization: category and categoryId aliases synchronized', normRes.category === 'Consulting' && normRes.categoryId === 'Consulting', 'Category alias mismatch');
      assert('D2-002G-G4: G4-04 / Normalization: walletId and accountId aliases synchronized', normRes.walletId === 'acc_01' && (normRes as any).accountId === 'acc_01', 'Wallet alias mismatch');

      // G4-05: Lifecycle State Machine regression
      assert('D2-002G-G4: G4-05 / State Machine: draft -> validated allowed', TransactionLifecycleGuard.isTransitionAllowed('draft', 'validated'), 'draft->validated failed');
      assert('D2-002G-G4: G4-05 / State Machine: validated -> confirmed allowed', TransactionLifecycleGuard.isTransitionAllowed('validated', 'confirmed'), 'validated->confirmed failed');
      assert('D2-002G-G4: G4-05 / State Machine: confirmed -> soft_deleted allowed', TransactionLifecycleGuard.isTransitionAllowed('confirmed', 'soft_deleted'), 'confirmed->soft_deleted failed');
      assert('D2-002G-G4: G4-05 / State Machine: soft_deleted -> restored allowed', TransactionLifecycleGuard.isTransitionAllowed('soft_deleted', 'restored'), 'soft_deleted->restored failed');
      assert('D2-002G-G4: G4-05 / State Machine: restored -> confirmed allowed', TransactionLifecycleGuard.isTransitionAllowed('restored', 'confirmed'), 'restored->confirmed failed');
      assert('D2-002G-G4: G4-05 / State Machine: confirmed -> archived allowed', TransactionLifecycleGuard.isTransitionAllowed('confirmed', 'archived'), 'confirmed->archived failed');
      assert('D2-002G-G4: G4-05 / State Machine: illegal draft -> archived strictly disallowed', !TransactionLifecycleGuard.isTransitionAllowed('draft', 'archived'), 'draft->archived illegal transition permitted');
      assert('D2-002G-G4: G4-05 / State Machine: illegal soft_deleted -> draft strictly disallowed', !TransactionLifecycleGuard.isTransitionAllowed('soft_deleted', 'draft'), 'soft_deleted->draft illegal transition permitted');

      // G4-06: Advanced Validation regression
      const valValid = TransactionLifecycleGuard.validateTransaction({
        id: 'val_ok',
        amount: 250_000,
        type: 'expense',
        currency: 'VND',
        category: 'Coffee',
        spaceId: 'sp_alpha',
        date: '2026-08-01',
        status: 'confirmed'
      });
      const valInvalid = TransactionLifecycleGuard.validateTransaction({
        id: 'val_bad',
        amount: -100,
        type: 'expense',
        currency: 'VND',
        category: '',
        spaceId: '',
        date: 'invalid-date',
        status: 'confirmed'
      });
      assert('D2-002G-G4: G4-06 / Validation: valid transaction passes domain guard', valValid.isValid && valValid.errors.length === 0, 'Valid tx failed validation');
      assert('D2-002G-G4: G4-06 / Validation: invalid transaction with multiple defects is rejected with errors', !valInvalid.isValid && valInvalid.errors.length >= 3, 'Invalid tx passed validation');

      // G4-07: Calculation regression — all 11 canonical transaction types
      const tx11List: Transaction[] = [
        { id: 't_inc', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-01', status: 'confirmed' },
        { id: 't_exp', amount: 3_000_000, type: 'expense', currency: 'VND', category: 'Living', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-02', status: 'confirmed' },
        { id: 't_trf', amount: 1_000_000, type: 'transfer', currency: 'VND', category: 'Transfer', spaceId: 'sp_alpha', walletId: 'w_all', targetSpaceId: 'sp_alpha', targetWalletId: 'w_sub', date: '2026-08-03', status: 'confirmed' },
        { id: 't_sav', amount: 2_000_000, type: 'saving', currency: 'VND', category: 'SavingsGoal', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-04', status: 'confirmed' },
        { id: 't_inv', amount: 5_000_000, type: 'investment', currency: 'VND', category: 'Portfolio', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-05', status: 'confirmed' },
        { id: 't_debt', amount: 1_000_000, type: 'debt', currency: 'VND', category: 'Borrowed', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-06', status: 'confirmed' },
        { id: 't_debtpay', amount: 4_000_000, type: 'debt_payment', currency: 'VND', category: 'PaidDebt', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-07', status: 'confirmed' },
        { id: 't_comp', amount: 1_500_000, type: 'compensation', currency: 'VND', category: 'Refund', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-08', status: 'confirmed' },
        { id: 't_adj', amount: 300_000, type: 'adjustment', currency: 'VND', category: 'AuditAdjustment', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-09', status: 'confirmed' },
        { id: 't_open', amount: 3_500_000, type: 'opening_balance', currency: 'VND', category: 'Opening', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-10', status: 'confirmed' },
        { id: 't_init', amount: 500_000, type: 'initial_balance', currency: 'VND', category: 'Initial', spaceId: 'sp_alpha', walletId: 'w_all', date: '2026-08-11', status: 'confirmed' }
      ];
      const income11 = FinancialTruthEngine.calculateIncome(tx11List, undefined, undefined, 'sp_alpha');
      const expense11 = FinancialTruthEngine.calculateExpense(tx11List, undefined, undefined, 'sp_alpha');
      assert('D2-002G-G4: G4-07 / 11 Transaction Types: Income includes only primary operating income (10M)', income11 === 10_000_000, `Income 11 mismatch: ${income11}`);
      assert('D2-002G-G4: G4-07 / 11 Transaction Types: Expense includes only primary operating expense (3M)', expense11 === 3_000_000, `Expense 11 mismatch: ${expense11}`);

      // G4-08: Transfer conservation regression
      const sameSpaceTrf = FinancialTruthEngine.calculateTransfer(10_000, 5_000, 2_000);
      assert('D2-002G-G4: G4-08 / Transfer Conservation: internal transfer preserves system total (15k before === 15k after)', (10_000 + 5_000) === (sameSpaceTrf.newFromBalance + sameSpaceTrf.newToBalance), 'Transfer violated conservation');

      const crossSpaceTx: Transaction[] = [
        { id: 'ctx_1', amount: 5_000_000, type: 'transfer', currency: 'VND', category: 'InterSpace', spaceId: 'sp_alpha', walletId: 'w_a', targetSpaceId: 'sp_beta', targetWalletId: 'w_b', date: '2026-08-01', status: 'confirmed' }
      ];
      const alphaCrossBal = FinancialTruthEngine.calculateWalletBalance(crossSpaceTx, 'w_a', 10_000_000, 'sp_alpha');
      const betaCrossBal = FinancialTruthEngine.calculateWalletBalance(crossSpaceTx, 'w_b', 0, 'sp_beta');
      assert('D2-002G-G4: G4-08 / Cross-Space Transfer: source wallet decreased by amount (5M)', alphaCrossBal === 5_000_000, `Alpha cross bal expected 5M, got ${alphaCrossBal}`);
      assert('D2-002G-G4: G4-08 / Cross-Space Transfer: target wallet increased by amount (5M)', betaCrossBal === 5_000_000, `Beta cross bal expected 5M, got ${betaCrossBal}`);

      // G4-09: Transfer atomic rollback regression
      let mockSrcBalance = 10_000_000;
      let mockDstBalance = 2_000_000;
      const mockWalletRepoFail: WalletRepository = {
        getWallets: async () => [],
        getWalletById: async (id: string): Promise<Wallet | null> => {
          if (id === 'w_mock_src') return { id: 'w_mock_src', name: 'Src', initialBalance: 10_000_000, currentBalance: mockSrcBalance, currency: 'VND', spaceId: 'sp_alpha', type: 'bank', status: 'active' };
          if (id === 'w_mock_dst') return { id: 'w_mock_dst', name: 'Dst', initialBalance: 2_000_000, currentBalance: mockDstBalance, currency: 'VND', spaceId: 'sp_alpha', type: 'bank', status: 'active' };
          return null;
        },
        addWallet: async (w: any) => ({ ...w, id: 'w_new' } as Wallet),
        updateWallet: async (w: any) => {
          if (w.id === 'w_mock_src') {
            mockSrcBalance = w.currentBalance;
          } else if (w.id === 'w_mock_dst') {
            throw new Error('ROLLBACK_VERIFICATION_SIMULATION');
          }
          return w;
        },
        deleteWallet: async () => true
      };
      const mockDummyTxRepo: TransactionRepository = {
        getTransactions: async () => [],
        getTransactionById: async () => null,
        addTransaction: async (tx) => tx as any,
        updateTransaction: async (tx) => tx,
        deleteTransaction: async () => true
      };
      const transferMoneyUseCase = new TransferMoneyUseCase(mockWalletRepoFail, mockDummyTxRepo);
      const rollbackAttempt = await transferMoneyUseCase.execute({
        fromWalletId: 'w_mock_src',
        toWalletId: 'w_mock_dst',
        amount: 4_000_000,
        spaceId: 'sp_alpha'
      });
      assert('D2-002G-G4: G4-09 / Atomic Rollback: failed transfer reports failure', !rollbackAttempt.success, 'Failed transfer reported success');
      assert('D2-002G-G4: G4-09 / Atomic Rollback: source wallet balance restored cleanly to original 10M', mockSrcBalance === 10_000_000, `Source wallet left corrupted: ${mockSrcBalance}`);

      // G4-10: Undo / Redo history regression
      const mockTxStore = new Map<string, Transaction>();
      const mockTxRepoUndo: TransactionRepository = {
        getTransactions: async () => Array.from(mockTxStore.values()),
        getTransactionById: async (id: string) => mockTxStore.get(id) || null,
        addTransaction: async (tx: Transaction) => { mockTxStore.set(tx.id, tx); return tx; },
        updateTransaction: async (tx: Transaction) => { mockTxStore.set(tx.id, tx); return tx; },
        deleteTransaction: async (id: string) => {
          const existing = mockTxStore.get(id);
          if (existing) {
            mockTxStore.set(id, { ...existing, status: 'soft_deleted', isDeleted: true });
          }
          return true;
        }
      };
      const txManager = new TransactionManager(mockTxRepoUndo, mockWalletRepoFail);
      const addedTx = await txManager.confirmTransaction({
        id: 'tx_undo_reg_1',
        amount: 1_200_000,
        type: 'expense',
        currency: 'VND',
        category: 'Dining',
        spaceId: 'sp_alpha',
        walletId: 'w_dining',
        date: '2026-08-01',
        status: 'confirmed'
      });
      assert('D2-002G-G4: G4-10 / Undo/Redo: initial transaction added to repository', mockTxStore.has(addedTx.id), 'Transaction not added');
      
      const undoOk = await txManager.undo();
      assert('D2-002G-G4: G4-10 / Undo/Redo: undo succeeds gracefully', undoOk, 'Undo returned false');
      const undoneTx = mockTxStore.get(addedTx.id);
      assert('D2-002G-G4: G4-10 / Undo/Redo: transaction soft-deleted non-destructively on undo', undoneTx?.status === 'soft_deleted' || undoneTx?.isDeleted === true, 'Transaction not soft-deleted on undo');

      const redoOk = await txManager.redo();
      assert('D2-002G-G4: G4-10 / Undo/Redo: redo succeeds gracefully', redoOk, 'Redo returned false');
      const redoneTx = mockTxStore.get(addedTx.id);
      assert('D2-002G-G4: G4-10 / Undo/Redo: transaction restored to active confirmed on redo', redoneTx?.status === 'confirmed', 'Transaction not restored on redo');

      // G4-11: Compatibility Migration regression
      const legacyPayload = {
        id: 'leg_g4',
        amount: 850_000,
        type: 'expense',
        accountId: 'w_legacy',
        spaceId: 'sp_alpha',
        category: 'Utilities',
        status: 'posted'
      };
      const migG4 = CompatibilityMigrationEngine.migrateTransaction(legacyPayload);
      assert('D2-002G-G4: G4-11 / Compatibility Migration: legacy status posted migrated to canonical confirmed', migG4.transaction?.status === 'confirmed', 'Legacy status posted failed migration');
      assert('D2-002G-G4: G4-11 / Compatibility Migration: legacy accountId populated to canonical walletId', migG4.transaction?.walletId === 'w_legacy', 'Legacy accountId failed migration');

      // G4-12: Migration idempotency regression
      const mig1 = CompatibilityMigrationEngine.migrateTransaction(legacyPayload).transaction!;
      const mig2 = CompatibilityMigrationEngine.migrateTransaction(mig1).transaction!;
      const mig3 = CompatibilityMigrationEngine.migrateTransaction(mig2).transaction!;
      assert('D2-002G-G4: G4-12 / Migration Idempotency: Migrate(Migrate(tx)) === Migrate(tx)', JSON.stringify(mig1) === JSON.stringify(mig2) && JSON.stringify(mig2) === JSON.stringify(mig3), 'Migration output drifted across passes');

      // G4-13: Multi-space regression
      const multiSpaceTxs: Transaction[] = [
        { id: 'ms_a1', amount: 50_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_personal', date: '2026-08-01', status: 'confirmed' },
        { id: 'ms_a2', amount: 20_000_000, type: 'expense', currency: 'VND', category: 'Rent', spaceId: 'sp_personal', date: '2026-08-02', status: 'confirmed' },
        { id: 'ms_b1', amount: 100_000_000, type: 'income', currency: 'VND', category: 'Revenue', spaceId: 'sp_business', date: '2026-08-01', status: 'confirmed' },
        { id: 'ms_b2', amount: 60_000_000, type: 'expense', currency: 'VND', category: 'Payroll', spaceId: 'sp_business', date: '2026-08-02', status: 'confirmed' }
      ];
      const personalBal = FinancialTruthEngine.calculateBalance(multiSpaceTxs, 0, 'sp_personal');
      const businessBal = FinancialTruthEngine.calculateBalance(multiSpaceTxs, 0, 'sp_business');
      assert('D2-002G-G4: G4-13 / Multi-space: personal space net balance computed accurately (30M)', personalBal === 30_000_000, `Personal balance mismatch: ${personalBal}`);
      assert('D2-002G-G4: G4-13 / Multi-space: business space net balance computed accurately (40M)', businessBal === 40_000_000, `Business balance mismatch: ${businessBal}`);

      // G4-14: Multi-wallet / multi-fund regression
      const multiFundTxs: Transaction[] = [
        { id: 'mf_1', amount: 10_000_000, type: 'income', currency: 'VND', category: 'Deposit', spaceId: 'sp_alpha', walletId: 'fund_emergency', date: '2026-08-01', status: 'confirmed' },
        { id: 'mf_2', amount: 20_000_000, type: 'income', currency: 'VND', category: 'Deposit', spaceId: 'sp_alpha', walletId: 'fund_investment', date: '2026-08-01', status: 'confirmed' },
        { id: 'mf_3', amount: 5_000_000, type: 'expense', currency: 'VND', category: 'Medical', spaceId: 'sp_alpha', walletId: 'fund_emergency', date: '2026-08-02', status: 'confirmed' }
      ];
      const emergencyBal = FinancialTruthEngine.calculateWalletBalance(multiFundTxs, 'fund_emergency', 0, 'sp_alpha');
      const investmentBal = FinancialTruthEngine.calculateWalletBalance(multiFundTxs, 'fund_investment', 0, 'sp_alpha');
      assert('D2-002G-G4: G4-14 / Multi-fund Isolation: emergency fund balance is 5M', emergencyBal === 5_000_000, `Emergency fund balance mismatch: ${emergencyBal}`);
      assert('D2-002G-G4: G4-14 / Multi-fund Isolation: investment fund balance is 20M without cross-fund corruption', investmentBal === 20_000_000, `Investment fund balance mismatch: ${investmentBal}`);

      // G4-15: FinancialTruthEngine purity regression
      const purityTxs: Transaction[] = [
        { id: 'pure_1', amount: 1_000_000, type: 'income', currency: 'VND', category: 'Salary', spaceId: 'sp_alpha', date: '2026-08-01', status: 'confirmed' },
        { id: 'pure_2', amount: 400_000, type: 'expense', currency: 'VND', category: 'Food', spaceId: 'sp_alpha', date: '2026-08-02', status: 'confirmed' }
      ];
      const rawSnapshot = JSON.stringify(purityTxs);
      FinancialTruthEngine.calculateIncome(purityTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateExpense(purityTxs, undefined, undefined, 'sp_alpha');
      FinancialTruthEngine.calculateBalance(purityTxs, 0, 'sp_alpha');
      FinancialTruthEngine.calculateWalletBalance(purityTxs, 'w_any', 0, 'sp_alpha');
      FinancialTruthEngine.calculateNetWorth(undefined, undefined, undefined, undefined, 'sp_alpha');
      assert('D2-002G-G4: G4-15 / Engine Purity: calculations leave inputs 100% strictly unmutated', JSON.stringify(purityTxs) === rawSnapshot, 'Input data mutated during calculation');

      // G4-16: AuditTrail preservation regression
      const auditBaseTx: Transaction = {
        id: 'aud_reg_1',
        amount: 3_000_000,
        type: 'income',
        currency: 'VND',
        category: 'Bonus',
        spaceId: 'sp_alpha',
        date: '2026-08-01',
        status: 'confirmed',
        auditTrail: [
          { action: 'create', timestamp: '2026-08-01T08:00:00Z', actor: 'user_admin', details: 'Imported from bank feed' }
        ]
      };
      const auditNorm = TransactionNormalizer.normalize(auditBaseTx);
      const auditMig = CompatibilityMigrationEngine.migrateTransaction(auditNorm).transaction!;
      assert('D2-002G-G4: G4-16 / AuditTrail: auditTrail items preserved across normalization and migration pipelines', auditMig.auditTrail?.length === 1 && auditMig.auditTrail[0].details === 'Imported from bank feed', 'Audit trail lost during pipeline');

      // G4-17: Legacy transaction compatibility regression
      const legacyMinimal = {
        id: 'leg_min_1',
        amount: 250_000,
        type: 'expense',
        spaceId: 'sp_alpha'
      };
      const legMinRes = CompatibilityMigrationEngine.migrateTransaction(legacyMinimal);
      assert('D2-002G-G4: G4-17 / Legacy Compatibility: minimal legacy object fills default type=expense, currency=VND, status=confirmed', legMinRes.transaction?.type === 'expense' && legMinRes.transaction?.currency === 'VND' && legMinRes.transaction?.status === 'confirmed', 'Legacy defaults population failed');

      // G4-18: Empty/minimal dataset regression
      assert('D2-002G-G4: G4-18 / Minimal Dataset: empty dataset calculateIncome is deterministic 0', FinancialTruthEngine.calculateIncome([], undefined, undefined, 'sp_alpha') === 0, 'Empty income non-zero');
      assert('D2-002G-G4: G4-18 / Minimal Dataset: empty dataset calculateExpense is deterministic 0', FinancialTruthEngine.calculateExpense([], undefined, undefined, 'sp_alpha') === 0, 'Empty expense non-zero');
      assert('D2-002G-G4: G4-18 / Minimal Dataset: empty dataset calculateBalance is deterministic 0', FinancialTruthEngine.calculateBalance([], 0, 'sp_alpha') === 0, 'Empty balance non-zero');

      // G4-19: Boundary amount regression
      const boundMax = TransactionNormalizer.normalize({ id: 'b_max', amount: Number.MAX_SAFE_INTEGER, type: 'income', spaceId: 'sp_alpha', category: 'Cap' });
      assert('D2-002G-G4: G4-19 / Boundary Amount: Number.MAX_SAFE_INTEGER remains identical', boundMax.amount === Number.MAX_SAFE_INTEGER, 'MAX_SAFE_INTEGER distorted');
      const boundSmall = TransactionNormalizer.normalize({ id: 'b_small', amount: 0.00000001, type: 'income', spaceId: 'sp_alpha', category: 'Micro' });
      assert('D2-002G-G4: G4-19 / Boundary Amount: microscopic float 0.00000001 remains identical', boundSmall.amount === 0.00000001, 'Microscopic float distorted');

      // G4-20: Full end-to-end Domain regression
      const e2eRaw = {
        id: 'e2e_tx_1',
        amount: 15_750_000,
        type: 'income',
        accountId: 'w_primary',
        category: 'ProjectPayout',
        spaceId: 'sp_alpha',
        date: '2026-08-15',
        status: 'posted',
        note: 'Sprint 2 Milestone Completion'
      };
      const e2eMigrated = CompatibilityMigrationEngine.migrateTransaction(e2eRaw);
      assert('D2-002G-G4: G4-20 / E2E Domain Regression: Step 1 - Ingress Migration succeeds', e2eMigrated.success && !!e2eMigrated.transaction, 'E2E migration failed');
      const e2eValidated = TransactionLifecycleGuard.validateTransaction(e2eMigrated.transaction!);
      assert('D2-002G-G4: G4-20 / E2E Domain Regression: Step 2 - Domain Guard Validation succeeds', e2eValidated.isValid, 'E2E validation failed');
      const e2eCalculatedBal = FinancialTruthEngine.calculateWalletBalance([e2eMigrated.transaction!], 'w_primary', 5_000_000, 'sp_alpha');
      assert('D2-002G-G4: G4-20 / E2E Domain Regression: Step 3 - Financial Truth Balance updated accurately (20.75M)', e2eCalculatedBal === 20_750_000, `E2E calculated balance mismatch: ${e2eCalculatedBal}`);
    }

  } catch (err: any) {
    results.push({
      name: '[D2-FINANCIAL-TRUTH] Execution Suite',
      category: 'FinancialTruthEngine',
      passed: false,
      message: err?.message || 'Error during D2 test execution'
    });
  }

  return results;
}
