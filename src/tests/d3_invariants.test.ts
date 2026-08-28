/**
 * Daily Finance 3.0 - D3 Financial Invariants Test Suite (INV-001 -> INV-015)
 * Comprehensive verification of business rules, single source of truth, and conservation laws.
 */

import { describe, it, expect } from 'vitest';
import { FinancialInvariantEngine, InvariantViolationError } from '../domain/InvariantEngine';
import { TransactionValidationUseCase } from '../usecases/TransactionValidationUseCase';
import { Transaction } from '../types';

describe('D3 — Financial Invariants Engine (INV-001 to INV-015)', () => {
  // ==========================================
  // Income Invariants (INV-001, INV-002)
  // ==========================================
  describe('Income Invariants (INV-001, INV-002)', () => {
    it('[INV-001] should pass for strictly positive income amount', () => {
      expect(() => FinancialInvariantEngine.assertIncomePositive(50000)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertIncomePositive(0.01)).not.toThrow();
    });

    it('[INV-001] should throw InvariantViolationError for zero or negative income', () => {
      expect(() => FinancialInvariantEngine.assertIncomePositive(0)).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertIncomePositive(-100000)).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertIncomePositive(NaN)).toThrow(InvariantViolationError);
    });

    it('[INV-002] should verify sum of income transactions matches expected total', () => {
      const txs: Transaction[] = [
        {
          id: 'tx_inc_1',
          type: 'income',
          amount: 10000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_inc_2',
          type: 'income',
          amount: 5000000,
          currency: 'VND',
          category: 'Bonus',
          spaceId: 'sp_personal',
          date: '2026-08-05',
          status: 'confirmed'
        },
        {
          id: 'tx_inc_draft',
          type: 'income',
          amount: 2000000,
          currency: 'VND',
          category: 'Freelance',
          spaceId: 'sp_personal',
          date: '2026-08-06',
          status: 'draft' // should be excluded from confirmed total
        },
        {
          id: 'tx_inc_del',
          type: 'income',
          amount: 3000000,
          currency: 'VND',
          category: 'Investments',
          spaceId: 'sp_personal',
          date: '2026-08-07',
          status: 'soft_deleted',
          isDeleted: true // should be excluded
        }
      ];

      expect(() => FinancialInvariantEngine.assertIncomeBalance(txs, 'sp_personal', 15000000)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertIncomeBalance(txs, 'sp_personal', 20000000)).toThrow(
        InvariantViolationError
      );
    });
  });

  // ==========================================
  // Expense Invariants (INV-003, INV-004)
  // ==========================================
  describe('Expense Invariants (INV-003, INV-004)', () => {
    it('[INV-003] should allow expense within available account balance', () => {
      expect(() => FinancialInvariantEngine.assertExpenseWithinBalance(50000, 100000)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertExpenseWithinBalance(100000, 100000)).not.toThrow();
    });

    it('[INV-003] should throw when expense exceeds account balance', () => {
      expect(() => FinancialInvariantEngine.assertExpenseWithinBalance(150000, 100000)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-004] should pass when period expenses are within budget limit', () => {
      expect(() => FinancialInvariantEngine.assertExpenseLimit(8000000, 10000000, 9000000)).not.toThrow();
    });

    it('[INV-004] should throw when period expenses exceed budget limit', () => {
      expect(() => FinancialInvariantEngine.assertExpenseLimit(9500000, 10000000, 9000000)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-004] should throw when period expenses exceed income if no budget is specified', () => {
      expect(() => FinancialInvariantEngine.assertExpenseLimit(12000000, 10000000)).toThrow(
        InvariantViolationError
      );
    });
  });

  // ==========================================
  // Transfer Invariants (INV-005, INV-006, INV-007)
  // ==========================================
  describe('Transfer Invariants (INV-005, INV-006, INV-007)', () => {
    it('[INV-005] should pass when transfer source and target accounts are distinct', () => {
      expect(() => FinancialInvariantEngine.assertDifferentAccounts('wal_cash', 'wal_bank')).not.toThrow();
    });

    it('[INV-005] should throw when transfer source and target accounts are identical or empty', () => {
      expect(() => FinancialInvariantEngine.assertDifferentAccounts('wal_cash', 'wal_cash')).toThrow(
        InvariantViolationError
      );
      expect(() => FinancialInvariantEngine.assertDifferentAccounts('', 'wal_bank')).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-006] should pass when source amount equals target amount', () => {
      expect(() => FinancialInvariantEngine.assertTransferBalance(500000, 500000)).not.toThrow();
    });

    it('[INV-006] should throw when transfer amounts mismatch or are negative', () => {
      expect(() => FinancialInvariantEngine.assertTransferBalance(500000, 450000)).toThrow(
        InvariantViolationError
      );
      expect(() => FinancialInvariantEngine.assertTransferBalance(-100, -100)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-007] should verify transfers maintain net-zero impact across space', () => {
      const txs: Transaction[] = [
        {
          id: 'tx_tf_1',
          type: 'transfer',
          amount: 1000000,
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_personal',
          walletId: 'wal_src',
          targetWalletId: 'wal_dst',
          date: '2026-08-10',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertTransferNeutral(txs, 'sp_personal')).not.toThrow();

      const invalidTxs: Transaction[] = [
        {
          id: 'tx_tf_bad',
          type: 'transfer',
          amount: 1000000,
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_personal',
          walletId: 'wal_src',
          targetWalletId: 'wal_dst',
          date: '2026-08-10',
          status: 'confirmed',
          ...({ destinationAmount: 900000 } as any)
        }
      ];

      expect(() => FinancialInvariantEngine.assertTransferNeutral(invalidTxs, 'sp_personal')).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-007] should ignore non-active transfers in neutrality assertion', () => {
      const txs: Transaction[] = [
        {
          id: 'tx_tf_draft',
          type: 'transfer',
          amount: 1000000,
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_personal',
          walletId: 'wal_src',
          targetWalletId: 'wal_dst',
          date: '2026-08-10',
          status: 'draft',
          ...({ destinationAmount: 500000 } as any) // mismatched amount in draft should not trigger invariant
        }
      ];

      expect(() => FinancialInvariantEngine.assertTransferNeutral(txs, 'sp_personal')).not.toThrow();
    });
  });

  // ==========================================
  // Group C: Lifecycle & Balance Invariants (INV-008, INV-009)
  // ==========================================
  describe('Group C: Lifecycle & Balance Invariants (INV-008, INV-009)', () => {
    it('[INV-008] should verify balance consistency: opening + incomes - expenses === current', () => {
      const txs: Transaction[] = [
        {
          id: 'tx_1',
          type: 'income',
          amount: 5000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_2',
          type: 'expense',
          amount: 2000000,
          currency: 'VND',
          category: 'Food',
          spaceId: 'sp_personal',
          date: '2026-08-02',
          status: 'confirmed'
        }
      ];

      // Opening 1M + Income 5M - Expense 2M = 4M
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(1000000, txs, 4000000)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(1000000, txs, 5000000)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-008] should exclude draft, pending, soft_deleted, archived, and deleted transactions from balance calculation', () => {
      const txs: Transaction[] = [
        {
          id: 'tx_valid_inc',
          type: 'income',
          amount: 1000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_draft',
          type: 'income',
          amount: 999999,
          currency: 'VND',
          category: 'Bonus',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'draft'
        },
        {
          id: 'tx_pending',
          type: 'expense',
          amount: 888888,
          currency: 'VND',
          category: 'Shopping',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'pending' as any
        },
        {
          id: 'tx_soft_deleted',
          type: 'expense',
          amount: 777777,
          currency: 'VND',
          category: 'Shopping',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'soft_deleted'
        },
        {
          id: 'tx_archived',
          type: 'income',
          amount: 666666,
          currency: 'VND',
          category: 'Old Income',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'archived'
        },
        {
          id: 'tx_deleted_flag',
          type: 'income',
          amount: 555555,
          currency: 'VND',
          category: 'Bonus',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed',
          isDeleted: true
        },
        {
          id: 'tx_deleted_at',
          type: 'expense',
          amount: 444444,
          currency: 'VND',
          category: 'Bills',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed',
          deletedAt: '2026-08-02T10:00:00Z'
        }
      ];

      // Only valid income (1,000,000) counts: Opening (500,000) + 1,000,000 = 1,500,000
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(500000, txs, 1500000)).not.toThrow();
    });

    it('[INV-008] should reject non-finite opening or current balances', () => {
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(NaN, [], 100)).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(100, [], Infinity)).toThrow(InvariantViolationError);
    });

    it('[INV-008] should maintain raw precision without artificial rounding', () => {
      const precisionTxs: Transaction[] = [
        {
          id: 'tx_prec_1',
          type: 'income',
          amount: 100.456789,
          currency: 'USD',
          category: 'Crypto',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_prec_2',
          type: 'expense',
          amount: 0.000001,
          currency: 'USD',
          category: 'Fee',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      const expected = 50.0 + 100.456789 - 0.000001;
      expect(() => FinancialInvariantEngine.assertBalanceConsistency(50.0, precisionTxs, expected)).not.toThrow();
    });

    it('[INV-009] should assert space conservation and prevent cross-space leaks', () => {
      const validTxs: Transaction[] = [
        {
          id: 'tx_sp_1',
          type: 'expense',
          amount: 10000,
          currency: 'VND',
          category: 'Coffee',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertSpaceConservation(validTxs, 'sp_personal')).not.toThrow();

      const leakedTxs: Transaction[] = [
        {
          id: 'tx_sp_leaked',
          type: 'expense',
          amount: 10000,
          currency: 'VND',
          category: 'Coffee',
          spaceId: 'sp_family',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertSpaceConservation(leakedTxs, 'sp_personal')).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-009] should reject invalid or empty spaceId', () => {
      expect(() => FinancialInvariantEngine.assertSpaceConservation([], '')).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertSpaceConservation([], '   ')).toThrow(InvariantViolationError);
    });

    it('[INV-010] should verify space isolation and reject cross-space leaks', () => {
      const validSpaceTxs: Transaction[] = [
        {
          id: 'tx_sp1',
          type: 'income',
          amount: 1000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_sp2',
          type: 'expense',
          amount: 200000,
          currency: 'VND',
          category: 'Supplies',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertSpaceIsolation(validSpaceTxs, 'sp_personal')).not.toThrow();

      const mixedTxs: Transaction[] = [
        ...validSpaceTxs,
        {
          id: 'tx_sp_foreign',
          type: 'expense',
          amount: 50000,
          currency: 'VND',
          category: 'Office',
          spaceId: 'sp_work',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertSpaceIsolation(mixedTxs, 'sp_personal')).toThrow(
        InvariantViolationError
      );

      // Valid cross-space transfer allowed when target matches
      const crossSpaceTx: Transaction[] = [
        {
          id: 'tx_cross_sp',
          type: 'transfer',
          amount: 500000,
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_work',
          targetSpaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertSpaceIsolation(crossSpaceTx, 'sp_personal')).not.toThrow();
    });

    it('[INV-010] should reject empty or invalid spaceId', () => {
      expect(() => FinancialInvariantEngine.assertSpaceIsolation([], '')).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertSpaceIsolation([], '   ')).toThrow(InvariantViolationError);
    });
  });

  // ==========================================
  // Group D: Space, Fund & Audit Invariants (INV-011, INV-012, INV-013, INV-014, INV-015)
  // ==========================================
  describe('Group D: Space, Fund & Audit Invariants (INV-011 to INV-015)', () => {
    it('[INV-011] should enforce fund isolation and prevent cross-fund contamination', () => {
      const fundTxs: Transaction[] = [
        {
          id: 'tx_fund_1',
          type: 'income',
          amount: 1000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          walletId: 'wal_emergency',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertFundIsolation(fundTxs, 'wal_emergency')).not.toThrow();

      const contaminatedTxs: Transaction[] = [
        ...fundTxs,
        {
          id: 'tx_fund_2',
          type: 'expense',
          amount: 200000,
          currency: 'VND',
          category: 'Stock',
          spaceId: 'sp_personal',
          walletId: 'wal_investment',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertFundIsolation(contaminatedTxs, 'wal_emergency')).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-012] should verify global money conservation without NaN or corrupt values', () => {
      const allTxs: Transaction[] = [
        {
          id: 'tx_g1',
          type: 'income',
          amount: 1000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_g2',
          type: 'expense',
          amount: 200000,
          currency: 'VND',
          category: 'Supplies',
          spaceId: 'sp_work',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_g3_tf',
          type: 'transfer',
          amount: 300000,
          currency: 'VND',
          category: 'Transfer',
          spaceId: 'sp_personal',
          targetSpaceId: 'sp_work',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertGlobalConservation(allTxs)).not.toThrow();
    });

    it('[INV-012] should maintain raw precision in global conservation', () => {
      const precisionTxs: Transaction[] = [
        {
          id: 'tx_g_p1',
          type: 'income',
          amount: 123456.789123,
          currency: 'USD',
          category: 'Crypto',
          spaceId: 'sp_crypto',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_g_p2',
          type: 'expense',
          amount: 0.00000001,
          currency: 'USD',
          category: 'Gas',
          spaceId: 'sp_crypto',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      expect(() => FinancialInvariantEngine.assertGlobalConservation(precisionTxs)).not.toThrow();
    });

    it('[INV-013] should accept valid transaction lifecycle statuses and reject invalid states', () => {
      const validTx: Transaction = {
        id: 'tx_valid_life',
        type: 'expense',
        amount: 50000,
        currency: 'VND',
        category: 'Food',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'confirmed'
      };

      expect(() => FinancialInvariantEngine.assertValidLifecycle(validTx)).not.toThrow();

      const invalidStatusTx: any = {
        ...validTx,
        status: 'unknown_status'
      };

      expect(() => FinancialInvariantEngine.assertValidLifecycle(invalidStatusTx)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-013] should verify soft-deleted or archived transactions are excluded from calculation', () => {
      const softDeletedTx: Transaction = {
        id: 'tx_del',
        type: 'expense',
        amount: 50000,
        currency: 'VND',
        category: 'Food',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'soft_deleted',
        isDeleted: true
      };

      expect(() => FinancialInvariantEngine.assertExclusionFromCalculation(softDeletedTx)).not.toThrow();
    });

    it('[INV-013] should verify draft transactions do not affect settled balances', () => {
      const draftTx: Transaction = {
        id: 'tx_draft',
        type: 'expense',
        amount: 200000,
        currency: 'VND',
        category: 'Shopping',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'draft'
      };

      expect(() => FinancialInvariantEngine.assertDraftExclusion(draftTx, 1000000)).not.toThrow();
    });

    it('[INV-014] should pass when all transactions have unique IDs', () => {
      const uniqueTxs: Transaction[] = [
        { id: 'tx_1', type: 'expense', amount: 10, currency: 'VND', category: 'A', spaceId: 'sp_1', date: '2026-08-01' },
        { id: 'tx_2', type: 'expense', amount: 20, currency: 'VND', category: 'B', spaceId: 'sp_1', date: '2026-08-01' }
      ];

      expect(FinancialInvariantEngine.assertIdempotency('bulk_insert', uniqueTxs)).toBe(true);
    });

    it('[INV-014] should throw when duplicate transaction IDs are detected in batch operation (replay protection)', () => {
      const duplicatedTxs: Transaction[] = [
        { id: 'tx_dup', type: 'expense', amount: 10, currency: 'VND', category: 'A', spaceId: 'sp_1', date: '2026-08-01' },
        { id: 'tx_dup', type: 'expense', amount: 20, currency: 'VND', category: 'B', spaceId: 'sp_1', date: '2026-08-01' }
      ];

      expect(() => FinancialInvariantEngine.assertIdempotency('bulk_insert', duplicatedTxs)).toThrow(
        InvariantViolationError
      );
    });

    it('[INV-015] should verify audit trail growth and presence', () => {
      const versionedTx: Transaction = {
        id: 'tx_audited',
        type: 'expense',
        amount: 100000,
        currency: 'VND',
        category: 'Bills',
        spaceId: 'sp_1',
        date: '2026-08-01',
        version: 2,
        auditTrail: [
          { action: 'create', timestamp: '2026-08-01T00:00:00Z', actor: 'user', details: 'Created' },
          { action: 'update', timestamp: '2026-08-01T01:00:00Z', actor: 'user', details: 'Updated' }
        ]
      };

      expect(() => FinancialInvariantEngine.assertAuditTrailGrowth(versionedTx, 2)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertAuditTrailGrowth(versionedTx, 3)).toThrow(
        InvariantViolationError
      );
    });
  });

  // ==========================================
  // TransactionValidationUseCase Validation Pipeline
  // ==========================================
  describe('TransactionValidationUseCase Pipeline', () => {
    const useCase = new TransactionValidationUseCase();

    it('should validate an income transaction successfully', () => {
      const tx: Transaction = {
        id: 'tx_pipe_inc',
        type: 'income',
        amount: 25000000,
        currency: 'VND',
        category: 'Salary',
        spaceId: 'sp_personal',
        date: '2026-08-20',
        status: 'confirmed'
      };

      const result = useCase.execute(tx, { spaceId: 'sp_personal' });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.invariantsPassed).toContain('INV-001');
      expect(result.invariantsPassed).toContain('INV-011');
    });

    it('should fail validation when expense exceeds wallet balance', () => {
      const tx: Transaction = {
        id: 'tx_pipe_exp_fail',
        type: 'expense',
        amount: 500000,
        currency: 'VND',
        category: 'Shopping',
        spaceId: 'sp_personal',
        date: '2026-08-20',
        status: 'confirmed'
      };

      const result = useCase.execute(tx, { walletBalance: 100000 });
      expect(result.isValid).toBe(false);
      expect(result.invariantsFailed).toContain('INV-003');
      expect(result.errors[0]).toContain('exceeds available balance');
    });

    it('should fail validation when transfer has identical source and destination accounts', () => {
      const tx: Transaction = {
        id: 'tx_pipe_tf_fail',
        type: 'transfer',
        amount: 200000,
        currency: 'VND',
        category: 'Transfer',
        spaceId: 'sp_personal',
        walletId: 'wal_same',
        targetWalletId: 'wal_same',
        date: '2026-08-20',
        status: 'confirmed'
      };

      const result = useCase.execute(tx);
      expect(result.isValid).toBe(false);
      expect(result.invariantsFailed).toContain('INV-005');
    });

    it('should validate complete transfer transaction successfully', () => {
      const tx: Transaction = {
        id: 'tx_pipe_tf_ok',
        type: 'transfer',
        amount: 200000,
        currency: 'VND',
        category: 'Transfer',
        spaceId: 'sp_personal',
        walletId: 'wal_src',
        targetWalletId: 'wal_dst',
        date: '2026-08-20',
        status: 'confirmed'
      };

      const result = useCase.execute(tx);
      expect(result.isValid).toBe(true);
      expect(result.invariantsPassed).toContain('INV-005');
      expect(result.invariantsPassed).toContain('INV-006');
    });
  });
});
