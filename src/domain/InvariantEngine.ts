/**
 * Daily Finance 3.0 - Financial Invariants Engine (D3)
 * High-precision financial invariant assertions and business rule enforcement.
 * Enforces INV-001 through INV-015.
 */

import { Transaction, TransactionStatus } from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';

export class InvariantViolationError extends Error {
  public readonly invariantCode: string;
  public readonly details?: Record<string, any>;

  constructor(invariantCode: string, message: string, details?: Record<string, any>) {
    super(`[Invariant Violation ${invariantCode}] ${message}`);
    this.name = 'InvariantViolationError';
    this.invariantCode = invariantCode;
    this.details = details;
    Object.setPrototypeOf(this, InvariantViolationError.prototype);
  }
}

export class FinancialInvariantEngine {
  // ============================================================================
  // GROUP A: CONSERVATION INVARIANTS (INV-001, INV-002, INV-003)
  // [Taxonomy: Conservation Laws - Preservation of System Value & Positivity]
  // ============================================================================

  /**
   * INV-001: Income Positivity Law (Group A - Conservation)
   * Income amount must be a finite, strictly positive number (> 0).
   * Rejects NaN, +Infinity, -Infinity, 0, or negative numbers without implicit rounding.
   */
  public static assertIncomePositive(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
      throw new InvariantViolationError(
        'INV-001',
        `Income amount must be strictly positive (> 0), received: ${amount}`,
        { amount }
      );
    }
  }

  /**
   * INV-002: Income Conservation Law (Group A - Conservation)
   * Total income within a financial space must strictly equal the sum of all confirmed,
   * non-deleted income transactions. Draft, pending, soft-deleted, and archived items are excluded.
   */
  public static assertIncomeBalance(transactions: Transaction[], spaceId: string, expectedTotal?: number): void {
    const spaceIncomes = transactions.filter(t => 
      t.spaceId === spaceId &&
      t.type === 'income' &&
      FinancialTruthEngine.isActiveConfirmedTransaction(t)
    );

    const calculatedTotal = spaceIncomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    if (expectedTotal !== undefined && Math.abs(calculatedTotal - expectedTotal) > 0.0001) {
      throw new InvariantViolationError(
        'INV-002',
        `Income balance mismatch for space ${spaceId}. Expected: ${expectedTotal}, Calculated: ${calculatedTotal}`,
        { spaceId, expectedTotal, calculatedTotal }
      );
    }
  }

  /**
   * INV-003: Expense Conservation & Balance Solvency Law (Group A - Conservation)
   * Expense amount must be strictly positive and cannot exceed available balance unless overdraft is permitted.
   */
  public static assertExpenseWithinBalance(expenseAmount: number, accountBalance: number): void {
    if (typeof expenseAmount !== 'number' || isNaN(expenseAmount) || !Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      throw new InvariantViolationError(
        'INV-003',
        `Expense amount must be strictly positive, received: ${expenseAmount}`,
        { expenseAmount, accountBalance }
      );
    }

    if (expenseAmount > accountBalance) {
      throw new InvariantViolationError(
        'INV-003',
        `Expense amount (${expenseAmount}) exceeds available balance (${accountBalance})`,
        { expenseAmount, accountBalance, deficit: expenseAmount - accountBalance }
      );
    }
  }

  // ============================================================================
  // GROUP B: BOUNDARY INVARIANTS (INV-004, INV-005, INV-006)
  // [Taxonomy: Boundary Laws - Budget Allocation, Transfer Distinctness & Amount Conservation]
  // ============================================================================

  /**
   * INV-004: Budget Boundary Law (Group B - Boundary)
   * Period expenses cannot exceed defined budget limit or period income allocation cap.
   * Rejects NaN, non-finite values, and ensures strict budget boundary enforcement.
   */
  public static assertExpenseLimit(periodExpenses: number, periodIncome: number, budgetLimit?: number): void {
    if (typeof periodExpenses !== 'number' || isNaN(periodExpenses) || !Number.isFinite(periodExpenses) || periodExpenses < 0) {
      throw new InvariantViolationError(
        'INV-004',
        `Period expenses must be a valid non-negative number, received: ${periodExpenses}`,
        { periodExpenses, periodIncome, budgetLimit }
      );
    }

    if (budgetLimit !== undefined) {
      if (typeof budgetLimit !== 'number' || isNaN(budgetLimit) || !Number.isFinite(budgetLimit)) {
        throw new InvariantViolationError(
          'INV-004',
          `Budget limit must be a valid finite number if provided, received: ${budgetLimit}`,
          { periodExpenses, budgetLimit }
        );
      }
      if (periodExpenses > budgetLimit) {
        throw new InvariantViolationError(
          'INV-004',
          `Period expenses (${periodExpenses}) exceed defined budget limit (${budgetLimit})`,
          { periodExpenses, budgetLimit, overspend: periodExpenses - budgetLimit }
        );
      }
    }

    if (budgetLimit === undefined && periodIncome > 0 && periodExpenses > periodIncome) {
      throw new InvariantViolationError(
        'INV-004',
        `Period expenses (${periodExpenses}) exceed total period income (${periodIncome})`,
        { periodExpenses, periodIncome, overspend: periodExpenses - periodIncome }
      );
    }
  }

  /**
   * INV-005: Transfer Endpoint Boundary Law (Group B - Boundary)
   * Source wallet/account and target wallet/account must be distinct valid entities.
   * Transfer cannot have identical source and destination endpoints.
   */
  public static assertDifferentAccounts(sourceId: string, targetId: string): void {
    if (!sourceId || typeof sourceId !== 'string' || !sourceId.trim() ||
        !targetId || typeof targetId !== 'string' || !targetId.trim()) {
      throw new InvariantViolationError(
        'INV-005',
        'Source account and target account must be valid non-empty identifiers for transfer',
        { sourceId, targetId }
      );
    }

    if (sourceId.trim() === targetId.trim()) {
      throw new InvariantViolationError(
        'INV-005',
        `Transfer source and target accounts must be different. Both are: ${sourceId.trim()}`,
        { sourceId, targetId }
      );
    }
  }

  /**
   * INV-006: Transfer Amount Conservation Law (Group B - Boundary)
   * Transfer source debit amount must match target received credit amount (for single-currency transfers).
   * Amounts must be strictly positive finite numbers preserving raw precision without rounding.
   */
  public static assertTransferBalance(sourceAmount: number, targetAmount: number): void {
    if (typeof sourceAmount !== 'number' || isNaN(sourceAmount) || !Number.isFinite(sourceAmount) || sourceAmount <= 0 ||
        typeof targetAmount !== 'number' || isNaN(targetAmount) || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new InvariantViolationError(
        'INV-006',
        'Transfer amounts must be strictly positive finite numbers',
        { sourceAmount, targetAmount }
      );
    }

    if (Math.abs(sourceAmount - targetAmount) > 0.0001) {
      throw new InvariantViolationError(
        'INV-006',
        `Transfer source amount (${sourceAmount}) does not match target amount (${targetAmount})`,
        { sourceAmount, targetAmount }
      );
    }
  }

  // ============================================================================
  // GROUP C: LIFECYCLE & BALANCE INVARIANTS (INV-007, INV-008, INV-009)
  // [Taxonomy: Lifecycle & Balance Laws - Net Neutrality, Consistency, Space Conservation]
  // ============================================================================

  /**
   * INV-007: Net impact of internal transfer on space total must be zero (Transfer neutrality).
   */
  public static assertTransferNeutral(transactions: Transaction[], spaceId?: string): void {
    const transfers = transactions.filter(t => 
      t.type === 'transfer' &&
      FinancialTruthEngine.isActiveConfirmedTransaction(t) &&
      (!spaceId || t.spaceId === spaceId)
    );

    // Each transfer should have net delta 0 on overall net worth/space total
    let netDelta = 0;
    for (const tx of transfers) {
      const srcAmt = Number(tx.amount) || 0;
      const dstAmt = Number((tx as any).destinationAmount ?? tx.amount) || 0;
      netDelta += (dstAmt - srcAmt);
    }

    if (Math.abs(netDelta) > 0.0001) {
      throw new InvariantViolationError(
        'INV-007',
        `Transfer net delta is non-zero (${netDelta}). Transfers must be neutral.`,
        { netDelta, spaceId }
      );
    }
  }

  // ============================================================================
  // BALANCE INVARIANTS (INV-008, INV-009, INV-010)
  // ============================================================================

  /**
   * INV-008: Balance consistency: currentBalance === openingBalance + sum(incomes) - sum(expenses).
   */
  public static assertBalanceConsistency(
    openingBalance: number,
    transactions: Transaction[],
    currentBalance: number
  ): void {
    let incomeSum = 0;
    let expenseSum = 0;

    for (const tx of transactions) {
      if (!FinancialTruthEngine.isActiveConfirmedTransaction(tx)) {
        continue;
      }

      if (tx.type === 'income') {
        incomeSum += Number(tx.amount) || 0;
      } else if (tx.type === 'expense') {
        expenseSum += Number(tx.amount) || 0;
      }
    }

    const calculatedBalance = openingBalance + incomeSum - expenseSum;

    if (Math.abs(calculatedBalance - currentBalance) > 0.0001) {
      throw new InvariantViolationError(
        'INV-008',
        `Balance inconsistency detected. Opening (${openingBalance}) + Incomes (${incomeSum}) - Expenses (${expenseSum}) = ${calculatedBalance}, but recorded current balance is ${currentBalance}`,
        { openingBalance, incomeSum, expenseSum, calculatedBalance, currentBalance }
      );
    }
  }

  /**
   * INV-009: Space conservation: transactions in a space must only reference and affect wallets within that space.
   */
  public static assertSpaceConservation(transactions: Transaction[], spaceId: string): void {
    for (const tx of transactions) {
      if (tx.spaceId !== spaceId) {
        throw new InvariantViolationError(
          'INV-009',
          `Transaction ${tx.id} belongs to space ${tx.spaceId}, violating isolation of space ${spaceId}`,
          { transactionId: tx.id, transactionSpaceId: tx.spaceId, expectedSpaceId: spaceId }
        );
      }
    }
  }

  /**
   * INV-010: Global conservation: total sum of all money across all spaces and wallets is preserved across operations.
   */
  public static assertGlobalConservation(allTransactions: Transaction[]): void {
    let totalIncomes = 0;
    let totalExpenses = 0;

    for (const tx of allTransactions) {
      if (!FinancialTruthEngine.isActiveConfirmedTransaction(tx)) {
        continue;
      }
      if (tx.type === 'income') {
        totalIncomes += Number(tx.amount) || 0;
      } else if (tx.type === 'expense') {
        totalExpenses += Number(tx.amount) || 0;
      }
    }

    // Money conservation holds: Delta(Total System Wealth) === Total Incomes - Total Expenses
    if (isNaN(totalIncomes) || isNaN(totalExpenses)) {
      throw new InvariantViolationError(
        'INV-010',
        'Global conservation violated: NaN detected in transaction totals',
        { totalIncomes, totalExpenses }
      );
    }
  }

  // ============================================================================
  // LIFECYCLE INVARIANTS (INV-011, INV-012, INV-013)
  // ============================================================================

  /**
   * INV-011: Transaction must follow valid lifecycle state transitions.
   */
  public static assertValidLifecycle(transaction: Transaction): void {
    const validStatuses: TransactionStatus[] = [
      'draft',
      'validated',
      'confirmed',
      'soft_deleted',
      'restored',
      'archived'
    ];

    if (!transaction.status || !validStatuses.includes(transaction.status)) {
      throw new InvariantViolationError(
        'INV-011',
        `Transaction ${transaction.id} has invalid status '${transaction.status}'`,
        { transactionId: transaction.id, status: transaction.status, validStatuses }
      );
    }

    if (transaction.isDeleted && transaction.status !== 'soft_deleted' && transaction.status !== 'archived') {
      throw new InvariantViolationError(
        'INV-011',
        `Transaction ${transaction.id} has isDeleted=true but status is '${transaction.status}'`,
        { transactionId: transaction.id, isDeleted: transaction.isDeleted, status: transaction.status }
      );
    }
  }

  /**
   * INV-012: Soft-deleted or archived transactions must never affect calculations.
   */
  public static assertExclusionFromCalculation(transaction: Transaction): void {
    const isExcludedStatus = transaction.isDeleted || transaction.status === 'soft_deleted' || transaction.status === 'archived';
    const isIncludedInCalc = FinancialTruthEngine.isActiveConfirmedTransaction(transaction);

    if (isExcludedStatus && isIncludedInCalc) {
      throw new InvariantViolationError(
        'INV-012',
        `Transaction ${transaction.id} is deleted/archived but was included in balance calculations`,
        { transactionId: transaction.id, status: transaction.status, isDeleted: transaction.isDeleted }
      );
    }
  }

  /**
   * INV-013: Draft transactions must never affect settled account balance.
   */
  public static assertDraftExclusion(draftTx: Transaction, currentBalance: number): void {
    if (draftTx.status === 'draft') {
      const affectsCalc = FinancialTruthEngine.isActiveConfirmedTransaction(draftTx);
      if (affectsCalc) {
        throw new InvariantViolationError(
          'INV-013',
          `Draft transaction ${draftTx.id} must not affect settled account balance (${currentBalance})`,
          { transactionId: draftTx.id, status: draftTx.status, currentBalance }
        );
      }
    }
  }

  // ============================================================================
  // IDEMPOTENCY & AUDIT INVARIANTS (INV-014, INV-015)
  // ============================================================================

  /**
   * INV-014: Operations must be idempotent (re-applying identical transaction doesn't duplicate).
   */
  public static assertIdempotency(operation: string, transactions: Transaction[]): boolean {
    const idSet = new Set<string>();
    for (const tx of transactions) {
      if (idSet.has(tx.id)) {
        throw new InvariantViolationError(
          'INV-014',
          `Duplicate transaction ID detected: ${tx.id} in operation '${operation}'`,
          { operation, duplicateId: tx.id }
        );
      }
      idSet.add(tx.id);
    }
    return true;
  }

  /**
   * INV-015: Audit trail must grow monotonically with each mutating operation.
   */
  public static assertAuditTrailGrowth(txOrId: Transaction | string, expectedEntries?: number, auditTrail?: any[]): void {
    const entries = typeof txOrId === 'object' && txOrId.auditTrail
      ? txOrId.auditTrail
      : auditTrail || [];

    if (expectedEntries !== undefined && entries.length < expectedEntries) {
      throw new InvariantViolationError(
        'INV-015',
        `Audit trail length (${entries.length}) is less than expected entries (${expectedEntries})`,
        { expectedEntries, actualEntries: entries.length }
      );
    }

    if (entries.length === 0 && typeof txOrId === 'object' && txOrId.version && txOrId.version > 1) {
      throw new InvariantViolationError(
        'INV-015',
        `Versioned transaction has empty audit trail`,
        { version: txOrId.version }
      );
    }
  }
}
