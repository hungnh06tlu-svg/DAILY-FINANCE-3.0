/**
 * Daily Finance 3.0 - TransactionValidationUseCase (D3)
 * Comprehensive transaction validation pipeline powered by FinancialInvariantEngine.
 */

import { Transaction } from '../types';
import { FinancialInvariantEngine, InvariantViolationError } from '../domain/InvariantEngine';

export interface ValidationContext {
  walletBalance?: number;
  periodIncome?: number;
  periodExpenses?: number;
  budgetLimit?: number;
  existingTransactions?: Transaction[];
  spaceId?: string;
}

export interface InvariantValidationReport {
  isValid: boolean;
  errors: string[];
  invariantsPassed: string[];
  invariantsFailed: string[];
  transactionId?: string;
}

export class TransactionValidationUseCase {
  /**
   * Validates a transaction through the Financial Invariants pipeline.
   */
  public execute(
    transaction: Transaction,
    context: ValidationContext = {}
  ): InvariantValidationReport {
    const errors: string[] = [];
    const invariantsPassed: string[] = [];
    const invariantsFailed: string[] = [];

    const runCheck = (invariantCode: string, checkFn: () => void) => {
      try {
        checkFn();
        invariantsPassed.push(invariantCode);
      } catch (err: any) {
        invariantsFailed.push(invariantCode);
        errors.push(err.message || `Invariant ${invariantCode} violation`);
      }
    };

    // INV-011: Lifecycle validity
    runCheck('INV-011', () => {
      FinancialInvariantEngine.assertValidLifecycle(transaction);
    });

    // INV-012: Exclusion from calculation for deleted/archived
    runCheck('INV-012', () => {
      FinancialInvariantEngine.assertExclusionFromCalculation(transaction);
    });

    // INV-013: Draft exclusion check
    if (transaction.status === 'draft' && context.walletBalance !== undefined) {
      runCheck('INV-013', () => {
        FinancialInvariantEngine.assertDraftExclusion(transaction, context.walletBalance!);
      });
    }

    // Type-specific invariants
    if (transaction.type === 'income') {
      // INV-001: Positive income
      runCheck('INV-001', () => {
        FinancialInvariantEngine.assertIncomePositive(transaction.amount);
      });

      // INV-002: Income balance check if existing transactions supplied
      if (context.existingTransactions && transaction.spaceId) {
        runCheck('INV-002', () => {
          FinancialInvariantEngine.assertIncomeBalance(
            [...context.existingTransactions!, transaction],
            transaction.spaceId
          );
        });
      }
    } else if (transaction.type === 'expense') {
      // INV-003: Expense within balance (if wallet balance provided)
      if (context.walletBalance !== undefined) {
        runCheck('INV-003', () => {
          FinancialInvariantEngine.assertExpenseWithinBalance(transaction.amount, context.walletBalance!);
        });
      }

      // INV-004: Expense limit / budget check
      if (context.periodExpenses !== undefined || context.budgetLimit !== undefined) {
        const totalExpenses = (context.periodExpenses || 0) + transaction.amount;
        runCheck('INV-004', () => {
          FinancialInvariantEngine.assertExpenseLimit(
            totalExpenses,
            context.periodIncome || 0,
            context.budgetLimit
          );
        });
      }
    } else if (transaction.type === 'transfer') {
      // INV-005: Different source and destination accounts
      const srcId = transaction.walletId || (transaction as any).sourceWalletId;
      const dstId = (transaction as any).destinationWalletId || (transaction as any).targetWalletId;
      if (srcId || dstId) {
        runCheck('INV-005', () => {
          FinancialInvariantEngine.assertDifferentAccounts(srcId || '', dstId || '');
        });
      }

      // INV-006: Transfer balance check
      const dstAmt = (transaction as any).destinationAmount !== undefined ? (transaction as any).destinationAmount : transaction.amount;
      runCheck('INV-006', () => {
        FinancialInvariantEngine.assertTransferBalance(transaction.amount, dstAmt);
      });
    }

    // INV-009: Space conservation (if spaceId context given)
    if (context.spaceId && transaction.spaceId) {
      runCheck('INV-009', () => {
        FinancialInvariantEngine.assertSpaceConservation([transaction], context.spaceId!);
      });
    }

    // INV-014: Idempotency check with existing transactions
    if (context.existingTransactions && context.existingTransactions.length > 0) {
      runCheck('INV-014', () => {
        FinancialInvariantEngine.assertIdempotency('validate', context.existingTransactions!);
      });
    }

    // INV-015: Audit trail growth
    if (transaction.auditTrail) {
      runCheck('INV-015', () => {
        FinancialInvariantEngine.assertAuditTrailGrowth(transaction);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      invariantsPassed,
      invariantsFailed,
      transactionId: transaction.id
    };
  }
}
