/**
 * Daily Finance 3.0 - Comprehensive Invariant Execution Suite (D3-002A)
 * Complete Test Matrix for Invariant Execution Harness & Invariant Rules (INV-001..INV-015).
 * 
 * Matrix Coverage:
 * 1. Multi-space Isolation Tests
 * 2. Multi-fund & Multi-wallet Boundary Tests
 * 3. Cross-Space & Cross-Fund Transfer Conservation & Neutrality
 * 4. Lifecycle Filtering (draft, pending, soft_deleted, archived, deletedAt)
 * 5. Extreme Precision & Raw Float Math Preservation
 * 6. Batch Idempotency & Replay Attack Protection
 * 7. Property-based Invariant Verification (Zero Drift)
 * 8. Diagnostic Traceability & Error Reporting Quality
 */

import { describe, it, expect } from 'vitest';
import { InvariantExecutionHarness } from '../domain/InvariantExecutionHarness';
import { FinancialInvariantEngine, InvariantViolationError } from '../domain/InvariantEngine';
import { Transaction } from '../types';

describe('D3-002A — Comprehensive Invariant Execution Harness Suite', () => {
  // ============================================================================
  // 1. MULTI-SPACE ISOLATION MATRIX (INV-009, INV-010)
  // ============================================================================
  describe('Multi-Space Isolation Matrix', () => {
    it('should cleanly isolate transactions between Personal and Business spaces', () => {
      const personalTxs: Transaction[] = [
        {
          id: 'tx_pers_1',
          type: 'income',
          amount: 50000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_pers_2',
          type: 'expense',
          amount: 15000000,
          currency: 'VND',
          category: 'Rent',
          spaceId: 'sp_personal',
          date: '2026-08-02',
          status: 'confirmed'
        }
      ];

      const businessTxs: Transaction[] = [
        {
          id: 'tx_biz_1',
          type: 'income',
          amount: 120000000,
          currency: 'VND',
          category: 'Client Retainer',
          spaceId: 'sp_business',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_biz_2',
          type: 'expense',
          amount: 40000000,
          currency: 'VND',
          category: 'Cloud Infrastructure',
          spaceId: 'sp_business',
          date: '2026-08-03',
          status: 'confirmed'
        }
      ];

      // Harness evaluation for Personal Space
      const personalSummary = InvariantExecutionHarness.evaluateDataset(personalTxs, {
        spaceId: 'sp_personal',
        expectedIncomeTotal: 50000000,
        openingBalance: 0,
        currentBalance: 35000000
      });
      expect(personalSummary.isAllPassed).toBe(true);
      expect(personalSummary.failedCount).toBe(0);

      // Harness evaluation for Business Space
      const bizSummary = InvariantExecutionHarness.evaluateDataset(businessTxs, {
        spaceId: 'sp_business',
        expectedIncomeTotal: 120000000,
        openingBalance: 0,
        currentBalance: 80000000
      });
      expect(bizSummary.isAllPassed).toBe(true);
      expect(bizSummary.failedCount).toBe(0);

      // Property Verification: Merged dataset does not leak calculations across spaces
      const isolationResult = InvariantExecutionHarness.verifySpaceIsolationProperty(
        personalTxs,
        businessTxs,
        'sp_personal',
        'sp_business'
      );
      expect(isolationResult.isIsolated).toBe(true);
      expect(isolationResult.spaceACalculation).toBe(35000000);
      expect(isolationResult.spaceBCalculation).toBe(80000000);
    });

    it('should generate fail diagnostic when cross-space contamination occurs', () => {
      const contaminatedDataset: Transaction[] = [
        {
          id: 'tx_p1',
          type: 'income',
          amount: 1000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_b1_leaked',
          type: 'expense',
          amount: 500000,
          currency: 'VND',
          category: 'Office Snack',
          spaceId: 'sp_business', // FOREIGN SPACE IN PERSONAL EVALUATION CONTEXT
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      const summary = InvariantExecutionHarness.evaluateDataset(contaminatedDataset, {
        spaceId: 'sp_personal'
      });

      expect(summary.isAllPassed).toBe(false);
      expect(summary.failedCount).toBeGreaterThan(0);
      const inv010Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-010');
      expect(inv010Diag).toBeDefined();
      expect(inv010Diag?.status).toBe('FAIL');
      expect(inv010Diag?.failureReason).toContain("violating isolation boundary of space 'sp_personal'");
    });
  });

  // ============================================================================
  // 2. MULTI-FUND & MULTI-WALLET BOUNDARY MATRIX (INV-011)
  // ============================================================================
  describe('Multi-Fund & Multi-Wallet Isolation Matrix', () => {
    it('should strictly enforce fund isolation boundaries across emergency and investment funds', () => {
      const emergencyFundTxs: Transaction[] = [
        {
          id: 'tx_emg_1',
          type: 'income',
          amount: 10000000,
          currency: 'VND',
          category: 'Savings Transfer',
          spaceId: 'sp_personal',
          walletId: 'fund_emergency',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      const summary = InvariantExecutionHarness.evaluateDataset(emergencyFundTxs, {
        spaceId: 'sp_personal',
        fundId: 'fund_emergency'
      });
      expect(summary.isAllPassed).toBe(true);

      // Introduce foreign fund transaction
      const mixedFundTxs: Transaction[] = [
        ...emergencyFundTxs,
        {
          id: 'tx_inv_1',
          type: 'expense',
          amount: 5000000,
          currency: 'VND',
          category: 'Stock Buy',
          spaceId: 'sp_personal',
          walletId: 'fund_growth_stocks',
          date: '2026-08-02',
          status: 'confirmed'
        }
      ];

      const failedSummary = InvariantExecutionHarness.evaluateDataset(mixedFundTxs, {
        spaceId: 'sp_personal',
        fundId: 'fund_emergency'
      });
      expect(failedSummary.isAllPassed).toBe(false);
      const inv011Diag = failedSummary.diagnostics.find(d => d.invariantCode === 'INV-011');
      expect(inv011Diag?.status).toBe('FAIL');
      expect(inv011Diag?.failureReason).toContain("does not belong to fund boundary 'fund_emergency'");
    });
  });

  // ============================================================================
  // 3. CROSS-SPACE & CROSS-FUND TRANSFER CONSERVATION (INV-005, INV-006, INV-007, INV-012)
  // ============================================================================
  describe('Transfer Boundary & Conservation Matrix', () => {
    it('should pass for legitimate cross-space transfer with identical debit and credit amounts', () => {
      const crossSpaceTransfer: Transaction = {
        id: 'tx_cross_transfer_1',
        type: 'transfer',
        amount: 5000000,
        currency: 'VND',
        category: 'Capital Injection',
        spaceId: 'sp_personal',
        targetSpaceId: 'sp_business',
        walletId: 'wal_personal_saving',
        targetWalletId: 'wal_biz_operating',
        date: '2026-08-10',
        status: 'confirmed'
      };

      const summary = InvariantExecutionHarness.evaluateDataset([crossSpaceTransfer], {
        spaceId: 'sp_personal',
        allowCrossSpaceTransfers: true
      });
      expect(summary.isAllPassed).toBe(true);

      const conservationResult = InvariantExecutionHarness.verifyTransferConservationProperty([crossSpaceTransfer]);
      expect(conservationResult.isConserved).toBe(true);
      expect(conservationResult.netDelta).toBe(0);
    });

    it('should detect and fail on transfer value leak (mismatched destination amount)', () => {
      const leakedTransfer: Transaction = {
        id: 'tx_leaked_tf',
        type: 'transfer',
        amount: 5000000,
        currency: 'VND',
        category: 'Transfer with Fee Distortion',
        spaceId: 'sp_personal',
        walletId: 'wal_src',
        targetWalletId: 'wal_dst',
        date: '2026-08-10',
        status: 'confirmed',
        ...({ destinationAmount: 4900000 } as any) // 100k disappeared
      };

      const summary = InvariantExecutionHarness.evaluateDataset([leakedTransfer], {
        spaceId: 'sp_personal'
      });

      expect(summary.isAllPassed).toBe(false);
      const inv006Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-006');
      const inv007Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-007');
      expect(inv006Diag?.status).toBe('FAIL');
      expect(inv007Diag?.status).toBe('FAIL');
    });

    it('should reject self-transfer (identical source and destination)', () => {
      const selfTransfer: Transaction = {
        id: 'tx_self_tf',
        type: 'transfer',
        amount: 1000000,
        currency: 'VND',
        category: 'Transfer',
        spaceId: 'sp_personal',
        walletId: 'wal_same',
        targetWalletId: 'wal_same',
        date: '2026-08-10',
        status: 'confirmed'
      };

      const summary = InvariantExecutionHarness.evaluateDataset([selfTransfer], {
        spaceId: 'sp_personal'
      });
      expect(summary.isAllPassed).toBe(false);
      const inv005Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-005');
      expect(inv005Diag?.status).toBe('FAIL');
      expect(inv005Diag?.failureReason).toContain('must be different');
    });
  });

  // ============================================================================
  // 4. LIFECYCLE & INACTIVE EXCLUSION MATRIX (INV-008, INV-013)
  // ============================================================================
  describe('Lifecycle State Machine & Inactive Exclusion Matrix', () => {
    it('should guarantee inactive transactions (draft, pending, soft_deleted, archived) never alter confirmed calculations', () => {
      const confirmedTxs: Transaction[] = [
        {
          id: 'tx_active_1',
          type: 'income',
          amount: 20000000,
          currency: 'VND',
          category: 'Salary',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_active_2',
          type: 'expense',
          amount: 5000000,
          currency: 'VND',
          category: 'Rent',
          spaceId: 'sp_personal',
          date: '2026-08-02',
          status: 'confirmed'
        }
      ];

      const inactiveTxs: Transaction[] = [
        {
          id: 'tx_inact_draft',
          type: 'income',
          amount: 99999999,
          currency: 'VND',
          category: 'Unconfirmed Mega Bonus',
          spaceId: 'sp_personal',
          date: '2026-08-03',
          status: 'draft'
        },
        {
          id: 'tx_inact_pending',
          type: 'expense',
          amount: 88888888,
          currency: 'VND',
          category: 'Pending Expensive Purchase',
          spaceId: 'sp_personal',
          date: '2026-08-03',
          status: 'draft'
        },
        {
          id: 'tx_inact_soft_del',
          type: 'income',
          amount: 77777777,
          currency: 'VND',
          category: 'Old Cancelled Income',
          spaceId: 'sp_personal',
          date: '2026-08-04',
          status: 'soft_deleted',
          isDeleted: true
        },
        {
          id: 'tx_inact_archived',
          type: 'expense',
          amount: 66666666,
          currency: 'VND',
          category: 'Archived Expense',
          spaceId: 'sp_personal',
          date: '2026-08-05',
          status: 'archived'
        },
        {
          id: 'tx_inact_deleted_at',
          type: 'income',
          amount: 55555555,
          currency: 'VND',
          category: 'Deleted Timestamped',
          spaceId: 'sp_personal',
          date: '2026-08-06',
          status: 'soft_deleted',
          deletedAt: '2026-08-06T12:00:00Z',
          isDeleted: true
        }
      ];

      const propertyResult = InvariantExecutionHarness.verifyLifecycleExclusionProperty(
        confirmedTxs,
        inactiveTxs,
        'sp_personal'
      );
      expect(propertyResult.isExcluded).toBe(true);
      expect(propertyResult.balanceBefore).toBe(15000000);
      expect(propertyResult.balanceAfter).toBe(15000000);

      // Verify all pass harness diagnostics
      const summary = InvariantExecutionHarness.evaluateDataset([...confirmedTxs, ...inactiveTxs], {
        spaceId: 'sp_personal',
        openingBalance: 0,
        currentBalance: 15000000,
        expectedIncomeTotal: 20000000
      });
      expect(summary.isAllPassed).toBe(true);
    });

    it('should catch corrupt transaction states (isDeleted=true with confirmed status)', () => {
      const corruptTx: Transaction = {
        id: 'tx_corrupt',
        type: 'expense',
        amount: 100000,
        currency: 'VND',
        category: 'Food',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'confirmed',
        isDeleted: true // INVALID COMBINATION
      };

      const summary = InvariantExecutionHarness.evaluateDataset([corruptTx], {
        spaceId: 'sp_personal'
      });
      expect(summary.isAllPassed).toBe(false);
      const inv013Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-013');
      expect(inv013Diag?.status).toBe('FAIL');
      expect(inv013Diag?.failureReason).toContain("isDeleted=true but status is 'confirmed'");
    });
  });

  // ============================================================================
  // 5. EXTREME PRECISION & RAW DECIMAL PRESERVATION (INV-001, INV-008, INV-012)
  // ============================================================================
  describe('Precision & Decimal Mathematics Matrix', () => {
    it('should preserve raw decimal precision without artificial rounding across micro-transactions', () => {
      const microTxs: Transaction[] = [
        {
          id: 'tx_prec_inc',
          type: 'income',
          amount: 0.0000000001,
          currency: 'ETH',
          category: 'Staking Reward',
          spaceId: 'sp_crypto',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_prec_exp',
          type: 'expense',
          amount: 0.00000000005,
          currency: 'ETH',
          category: 'Gas Fee',
          spaceId: 'sp_crypto',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      const expectedEnding = 1.0 + 0.0000000001 - 0.00000000005;
      const summary = InvariantExecutionHarness.evaluateDataset(microTxs, {
        spaceId: 'sp_crypto',
        openingBalance: 1.0,
        currentBalance: expectedEnding,
        expectedIncomeTotal: 0.0000000001
      });
      expect(summary.isAllPassed).toBe(true);
    });

    it('should reject NaN and infinite amounts in income and conservation', () => {
      const nanTx: any = {
        id: 'tx_nan',
        type: 'income',
        amount: NaN,
        currency: 'VND',
        category: 'Salary',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'confirmed'
      };

      const summary = InvariantExecutionHarness.evaluateDataset([nanTx], {
        spaceId: 'sp_personal'
      });
      expect(summary.isAllPassed).toBe(false);
      const inv001Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-001');
      expect(inv001Diag?.status).toBe('FAIL');
    });
  });

  // ============================================================================
  // 6. BATCH IDEMPOTENCY & REPLAY ATTACK DEFENSE (INV-014)
  // ============================================================================
  describe('Batch Idempotency & Replay Defense Matrix', () => {
    it('should detect duplicate transaction IDs in batch submissions', () => {
      const duplicateBatch: Transaction[] = [
        {
          id: 'tx_unique_1',
          type: 'expense',
          amount: 10000,
          currency: 'VND',
          category: 'Snack',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        },
        {
          id: 'tx_unique_1', // DUPLICATE REPLAY
          type: 'expense',
          amount: 10000,
          currency: 'VND',
          category: 'Snack',
          spaceId: 'sp_personal',
          date: '2026-08-01',
          status: 'confirmed'
        }
      ];

      const summary = InvariantExecutionHarness.evaluateDataset(duplicateBatch, {
        spaceId: 'sp_personal'
      });
      expect(summary.isAllPassed).toBe(false);
      const inv014Diag = summary.diagnostics.find(d => d.invariantCode === 'INV-014');
      expect(inv014Diag?.status).toBe('FAIL');
      expect(inv014Diag?.failureReason).toContain('Duplicate transaction ID detected: tx_unique_1');
    });
  });

  // ============================================================================
  // 7. AUDIT TRAIL GROWTH & VERSIONING (INV-015)
  // ============================================================================
  describe('Audit Trail Growth Matrix', () => {
    it('should verify monotonic audit trail growth on versioned transactions', () => {
      const validVersionedTx: Transaction = {
        id: 'tx_v2',
        type: 'expense',
        amount: 250000,
        currency: 'VND',
        category: 'Utilities',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'confirmed',
        version: 2,
        auditTrail: [
          { action: 'create', timestamp: '2026-08-01T00:00:00Z', actor: 'user', details: 'Created' },
          { action: 'update', timestamp: '2026-08-01T01:00:00Z', actor: 'user', details: 'Amount updated' }
        ]
      };

      const summary = InvariantExecutionHarness.evaluateDataset([validVersionedTx], {
        spaceId: 'sp_personal'
      });
      expect(summary.isAllPassed).toBe(true);

      const unrecordedVersionedTx: Transaction = {
        id: 'tx_v2_empty_audit',
        type: 'expense',
        amount: 250000,
        currency: 'VND',
        category: 'Utilities',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        status: 'confirmed',
        version: 3,
        auditTrail: [] // Version 3 with no audit entries
      };

      const failedSummary = InvariantExecutionHarness.evaluateDataset([unrecordedVersionedTx], {
        spaceId: 'sp_personal'
      });
      expect(failedSummary.isAllPassed).toBe(false);
      const inv015Diag = failedSummary.diagnostics.find(d => d.invariantCode === 'INV-015');
      expect(inv015Diag?.status).toBe('FAIL');
      expect(inv015Diag?.failureReason).toContain('has empty audit trail');
    });
  });

  // ============================================================================
  // 8. DIRECT INVARIANT ENGINE REGRESSION CHECKS
  // ============================================================================
  describe('Direct InvariantEngine Group Assertion Checks', () => {
    it('[INV-001] Income Positivity rejects non-positive numbers', () => {
      expect(() => FinancialInvariantEngine.assertIncomePositive(100)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertIncomePositive(0)).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertIncomePositive(-50)).toThrow(InvariantViolationError);
    });

    it('[INV-003] Expense Solvency checks available balance', () => {
      expect(() => FinancialInvariantEngine.assertExpenseWithinBalance(50, 100)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertExpenseWithinBalance(150, 100)).toThrow(InvariantViolationError);
    });

    it('[INV-004] Budget Limit enforcement rejects overspend', () => {
      expect(() => FinancialInvariantEngine.assertExpenseLimit(500, 1000, 800)).not.toThrow();
      expect(() => FinancialInvariantEngine.assertExpenseLimit(900, 1000, 800)).toThrow(InvariantViolationError);
      expect(() => FinancialInvariantEngine.assertExpenseLimit(1200, 1000)).toThrow(InvariantViolationError);
    });
  });
});
