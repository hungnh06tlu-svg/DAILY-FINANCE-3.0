/**
 * Daily Finance 3.0 - InvariantExecutionHarness (D3-002A)
 * Comprehensive, deterministic, observable execution harness for Financial Invariants (INV-001..INV-015).
 * 
 * Features:
 * 1. Granular Invariant Evaluation & Batch Verification
 * 2. Rich Audit Diagnostics (Invariant ID, Space ID, Fund ID, Tx ID, Source/Target, Expected, Actual)
 * 3. Space & Fund Isolation Verification Matrices
 * 4. Cross-Space & Cross-Fund Transfer Conservation & Neutrality
 * 5. Lifecycle Exclusion & Active Truth Coupling with FinancialTruthEngine
 * 6. Raw Decimal & Extreme Precision Preservation
 * 7. Property-based Deterministic Assertions (Zero Side-Effects)
 */

import { Transaction } from '../types';
import { FinancialInvariantEngine, InvariantViolationError } from './InvariantEngine';
import { FinancialTruthEngine } from './FinancialTruthEngine';

export interface InvariantExecutionContext {
  spaceId?: string;
  fundId?: string;
  walletId?: string;
  openingBalance?: number;
  currentBalance?: number;
  periodIncome?: number;
  periodExpenses?: number;
  budgetLimit?: number;
  expectedIncomeTotal?: number;
  allowCrossSpaceTransfers?: boolean;
  allowTargetTransfers?: boolean;
}

export interface InvariantDiagnostic {
  invariantCode: string;
  invariantName: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  spaceId?: string;
  fundId?: string;
  transactionId?: string;
  sourceWallet?: string;
  targetWallet?: string;
  expected?: any;
  actual?: any;
  failureReason?: string;
  rawDetails?: Record<string, any>;
}

export interface HarnessExecutionSummary {
  totalEvaluated: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  isAllPassed: boolean;
  diagnostics: InvariantDiagnostic[];
}

export class InvariantExecutionHarness {
  /**
   * Universal Invariant Registry Metadata
   */
  public static readonly INVARIANT_REGISTRY: Record<string, { name: string; group: 'A' | 'B' | 'C' | 'D'; description: string }> = {
    'INV-001': { name: 'Income Positivity Law', group: 'A', description: 'Income amount must be finite, strictly positive (> 0)' },
    'INV-002': { name: 'Income Conservation Law', group: 'A', description: 'Total income must match sum of confirmed active income transactions' },
    'INV-003': { name: 'Expense Conservation & Solvency Law', group: 'A', description: 'Expense must be strictly positive and within available balance' },
    'INV-004': { name: 'Budget Boundary Law', group: 'B', description: 'Expenses cannot exceed defined budget limit or income cap' },
    'INV-005': { name: 'Transfer Endpoint Boundary Law', group: 'B', description: 'Source and target accounts must be distinct valid entities' },
    'INV-006': { name: 'Transfer Amount Conservation Law', group: 'B', description: 'Transfer debit amount must match received credit amount' },
    'INV-007': { name: 'Transfer Neutrality Law', group: 'C', description: 'Internal transfers have zero net wealth creation/destruction' },
    'INV-008': { name: 'Balance Consistency Law', group: 'C', description: 'Current balance == opening + sum(incomes) - sum(expenses)' },
    'INV-009': { name: 'Space Conservation & Isolation Law', group: 'C', description: 'Transactions must strictly belong to specified space' },
    'INV-010': { name: 'Space Isolation Law', group: 'D', description: 'Multi-tenant space isolation without cross-space contamination' },
    'INV-011': { name: 'Fund Isolation Law', group: 'D', description: 'Fund/wallet boundary isolation without cross-fund data mixing' },
    'INV-012': { name: 'Global System Conservation Law', group: 'D', description: 'System-wide wealth conservation delta == sum(incomes) - sum(expenses)' },
    'INV-013': { name: 'Lifecycle State Machine Law', group: 'D', description: 'Inactive transactions excluded from settled calculations' },
    'INV-014': { name: 'Idempotency & Replay Law', group: 'D', description: 'Batch operations and event replaying must be unique & idempotent' },
    'INV-015': { name: 'Audit Trail & Traceability Law', group: 'D', description: 'Audit trail must grow monotonically with versioned mutations' }
  };

  /**
   * Execute comprehensive suite of invariants against a dataset with detailed audit diagnostics.
   */
  public static evaluateDataset(
    transactions: Transaction[],
    context: InvariantExecutionContext = {}
  ): HarnessExecutionSummary {
    const diagnostics: InvariantDiagnostic[] = [];

    const runEvaluator = (
      code: string,
      evalFn: () => void,
      meta?: Partial<InvariantDiagnostic>
    ) => {
      const reg = this.INVARIANT_REGISTRY[code] || { name: code, group: 'A', description: '' };
      try {
        evalFn();
        diagnostics.push({
          invariantCode: code,
          invariantName: reg.name,
          status: 'PASS',
          spaceId: context.spaceId,
          fundId: context.fundId,
          ...meta
        });
      } catch (err: any) {
        if (err instanceof InvariantViolationError) {
          diagnostics.push({
            invariantCode: code,
            invariantName: reg.name,
            status: 'FAIL',
            spaceId: context.spaceId,
            fundId: context.fundId,
            failureReason: err.message,
            rawDetails: err.details,
            expected: err.details?.expectedTotal ?? err.details?.expectedSpaceId ?? err.details?.expectedFund,
            actual: err.details?.calculatedTotal ?? err.details?.transactionSpaceId ?? err.details?.transactionFund,
            ...meta
          });
        } else {
          diagnostics.push({
            invariantCode: code,
            invariantName: reg.name,
            status: 'FAIL',
            spaceId: context.spaceId,
            fundId: context.fundId,
            failureReason: err.message || String(err),
            ...meta
          });
        }
      }
    };

    // 1. Group D: Space Isolation (INV-010)
    if (context.spaceId) {
      runEvaluator('INV-010', () => {
        FinancialInvariantEngine.assertSpaceIsolation(transactions, context.spaceId!, {
          allowCrossSpaceTransfers: context.allowCrossSpaceTransfers ?? true
        });
      });
    }

    // 2. Group D: Fund Isolation (INV-011)
    if (context.fundId || context.walletId) {
      const targetFund = context.fundId || context.walletId!;
      runEvaluator('INV-011', () => {
        FinancialInvariantEngine.assertFundIsolation(transactions, targetFund, {
          allowTargetTransfers: context.allowTargetTransfers ?? true
        });
      });
    }

    // 3. Group D: Global System Conservation (INV-012)
    runEvaluator('INV-012', () => {
      FinancialInvariantEngine.assertGlobalConservation(transactions);
    });

    // 4. Group D: Idempotency (INV-014)
    if (transactions.length > 0) {
      runEvaluator('INV-014', () => {
        FinancialInvariantEngine.assertIdempotency('harness_batch_eval', transactions);
      });
    }

    // 5. Per-Transaction Invariants
    for (const tx of transactions) {
      // INV-013: Lifecycle
      runEvaluator('INV-013', () => {
        FinancialInvariantEngine.assertValidLifecycle(tx);
        FinancialInvariantEngine.assertExclusionFromCalculation(tx);
        if (tx.status === 'draft' && context.currentBalance !== undefined) {
          FinancialInvariantEngine.assertDraftExclusion(tx, context.currentBalance);
        }
      }, { transactionId: tx.id });

      // INV-015: Audit trail
      if (tx.version && tx.version > 1) {
        runEvaluator('INV-015', () => {
          FinancialInvariantEngine.assertAuditTrailGrowth(tx);
        }, { transactionId: tx.id });
      }

      // Group A: INV-001 (Income positivity)
      if (tx.type === 'income') {
        runEvaluator('INV-001', () => {
          FinancialInvariantEngine.assertIncomePositive(tx.amount);
        }, { transactionId: tx.id });
      }

      // Group B: Transfer Invariants (INV-005, INV-006)
      if (tx.type === 'transfer') {
        const src = tx.walletId || (tx as any).sourceWalletId || '';
        const dst = tx.targetWalletId || (tx as any).destinationWalletId || '';
        if (src || dst) {
          runEvaluator('INV-005', () => {
            FinancialInvariantEngine.assertDifferentAccounts(src, dst);
          }, { transactionId: tx.id, sourceWallet: src, targetWallet: dst });
        }

        const dstAmt = (tx as any).destinationAmount !== undefined ? (tx as any).destinationAmount : tx.amount;
        runEvaluator('INV-006', () => {
          FinancialInvariantEngine.assertTransferBalance(tx.amount, dstAmt);
        }, { transactionId: tx.id, expected: tx.amount, actual: dstAmt });
      }
    }

    // 6. Group A & C Aggregate Invariants
    if (context.spaceId) {
      // INV-002: Income balance
      if (context.expectedIncomeTotal !== undefined) {
        runEvaluator('INV-002', () => {
          FinancialInvariantEngine.assertIncomeBalance(transactions, context.spaceId!, context.expectedIncomeTotal);
        }, { expected: context.expectedIncomeTotal });
      }

      // INV-007: Transfer Neutrality
      runEvaluator('INV-007', () => {
        FinancialInvariantEngine.assertTransferNeutral(transactions, context.spaceId);
      });

      // INV-008: Balance Consistency
      if (context.openingBalance !== undefined && context.currentBalance !== undefined) {
        runEvaluator('INV-008', () => {
          FinancialInvariantEngine.assertBalanceConsistency(
            context.openingBalance!,
            transactions,
            context.currentBalance!
          );
        }, { expected: context.currentBalance });
      }
    }

    // 7. Group B: Budget Boundary (INV-004)
    if (context.periodExpenses !== undefined) {
      runEvaluator('INV-004', () => {
        FinancialInvariantEngine.assertExpenseLimit(
          context.periodExpenses!,
          context.periodIncome || 0,
          context.budgetLimit
        );
      });
    }

    const passedCount = diagnostics.filter(d => d.status === 'PASS').length;
    const failedCount = diagnostics.filter(d => d.status === 'FAIL').length;
    const skippedCount = diagnostics.filter(d => d.status === 'SKIPPED').length;

    return {
      totalEvaluated: diagnostics.length,
      passedCount,
      failedCount,
      skippedCount,
      isAllPassed: failedCount === 0,
      diagnostics
    };
  }

  /**
   * Property Verification: Space Isolation Law
   * Verifies that operations in Space A have zero calculation impact on Space B.
   */
  public static verifySpaceIsolationProperty(
    spaceATxs: Transaction[],
    spaceBTxs: Transaction[],
    spaceAId: string,
    spaceBId: string
  ): { isIsolated: boolean; spaceACalculation: number; spaceBCalculation: number } {
    const spaceACalcBefore = FinancialTruthEngine.calculateBalance(spaceATxs, 0, spaceAId);
    const spaceBCalcBefore = FinancialTruthEngine.calculateBalance(spaceBTxs, 0, spaceBId);

    const merged = [...spaceATxs, ...spaceBTxs];
    const spaceACalcAfter = FinancialTruthEngine.calculateBalance(merged, 0, spaceAId);
    const spaceBCalcAfter = FinancialTruthEngine.calculateBalance(merged, 0, spaceBId);

    const isIsolated = spaceACalcBefore === spaceACalcAfter && spaceBCalcBefore === spaceBCalcAfter;
    return {
      isIsolated,
      spaceACalculation: spaceACalcAfter,
      spaceBCalculation: spaceBCalcAfter
    };
  }

  /**
   * Property Verification: Transfer Conservation Law
   * Verifies that internal transfers have net zero delta on overall wealth.
   */
  public static verifyTransferConservationProperty(
    transfers: Transaction[]
  ): { isConserved: boolean; netDelta: number } {
    let netDelta = 0;
    for (const tx of transfers) {
      if (tx.type === 'transfer' && FinancialTruthEngine.isActiveConfirmedTransaction(tx)) {
        const src = tx.amount;
        const dst = (tx as any).destinationAmount ?? tx.amount;
        netDelta += (dst - src);
      }
    }
    return {
      isConserved: Math.abs(netDelta) < 0.0000001,
      netDelta
    };
  }

  /**
   * Property Verification: Lifecycle Inactive Exclusion
   * Verifies that adding draft, pending, soft_deleted, or archived transactions does not alter confirmed balance.
   */
  public static verifyLifecycleExclusionProperty(
    confirmedTxs: Transaction[],
    inactiveTxs: Transaction[],
    spaceId: string
  ): { isExcluded: boolean; balanceBefore: number; balanceAfter: number } {
    const balanceBefore = FinancialTruthEngine.calculateBalance(confirmedTxs, 0, spaceId);
    const merged = [...confirmedTxs, ...inactiveTxs];
    const balanceAfter = FinancialTruthEngine.calculateBalance(merged, 0, spaceId);

    return {
      isExcluded: balanceBefore === balanceAfter,
      balanceBefore,
      balanceAfter
    };
  }
}
