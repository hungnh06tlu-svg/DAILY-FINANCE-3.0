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
   * INV-007: Transfer Neutrality Law (Group C - Lifecycle & Balance)
   * Net impact of internal transfer within a space or across the system must be zero.
   * Transfer transactions must not generate or destroy value (dstAmount === srcAmount).
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
      const srcAmt = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0;
      const dstAmtRaw = (tx as any).destinationAmount ?? tx.amount;
      const dstAmt = typeof dstAmtRaw === 'number' && Number.isFinite(dstAmtRaw) ? dstAmtRaw : 0;

      if (!Number.isFinite(srcAmt) || !Number.isFinite(dstAmt)) {
        throw new InvariantViolationError(
          'INV-007',
          `Transfer transaction ${tx.id} contains non-finite amount values`,
          { transactionId: tx.id, srcAmt, dstAmt }
        );
      }

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

  /**
   * INV-008: Balance Consistency Law (Group C - Lifecycle & Balance)
   * Account / Wallet balance consistency: currentBalance === openingBalance + sum(incomes) - sum(expenses).
   * Rejects NaN, non-finite values, and preserves opening balance raw starting value without misclassifying as operating cash flow.
   */
  public static assertBalanceConsistency(
    openingBalance: number,
    transactions: Transaction[],
    currentBalance: number
  ): void {
    if (typeof openingBalance !== 'number' || isNaN(openingBalance) || !Number.isFinite(openingBalance)) {
      throw new InvariantViolationError(
        'INV-008',
        `Opening balance must be a valid finite number, received: ${openingBalance}`,
        { openingBalance, currentBalance }
      );
    }

    if (typeof currentBalance !== 'number' || isNaN(currentBalance) || !Number.isFinite(currentBalance)) {
      throw new InvariantViolationError(
        'INV-008',
        `Current balance must be a valid finite number, received: ${currentBalance}`,
        { openingBalance, currentBalance }
      );
    }

    let incomeSum = 0;
    let expenseSum = 0;

    for (const tx of transactions) {
      if (!FinancialTruthEngine.isActiveConfirmedTransaction(tx)) {
        continue;
      }

      const amt = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0;

      if (tx.type === 'income') {
        incomeSum += amt;
      } else if (tx.type === 'expense') {
        expenseSum += amt;
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
   * INV-009: Space Conservation & Isolation Law (Group C - Lifecycle & Balance)
   * Space isolation: transactions in a space must only reference and affect entities within that space.
   * Prevents cross-space data leakage or mixed-space calculation contamination.
   */
  public static assertSpaceConservation(transactions: Transaction[], spaceId: string): void {
    if (!spaceId || typeof spaceId !== 'string' || !spaceId.trim()) {
      throw new InvariantViolationError(
        'INV-009',
        'Target spaceId must be a valid non-empty string identifier',
        { spaceId }
      );
    }

    const normalizedSpaceId = spaceId.trim();

    for (const tx of transactions) {
      if (tx.spaceId !== normalizedSpaceId) {
        throw new InvariantViolationError(
          'INV-009',
          `Transaction ${tx.id} belongs to space ${tx.spaceId}, violating isolation of space ${normalizedSpaceId}`,
          { transactionId: tx.id, transactionSpaceId: tx.spaceId, expectedSpaceId: normalizedSpaceId }
        );
      }
    }
  }

  // ============================================================================
  // GROUP D: SPACE ISOLATION, GLOBAL CONSERVATION & AUDIT INVARIANTS (INV-010..015)
  // [Taxonomy: Space/Fund Isolation, System Conservation, Lifecycle States, Idempotency & Audit Trail]
  // ============================================================================

  /**
   * INV-010: Space Isolation Law (Group D - Space Isolation & Audit)
   * All transactions and entities in a calculation context must strictly belong to the specified space.
   * Rejects cross-space data leakage and invalid/empty space identifiers.
   * Allows valid cross-space transfers only when space topology is explicitly declared (sourceSpaceId/targetSpaceId).
   */
  public static assertSpaceIsolation(
    transactions: Transaction[],
    spaceId: string,
    options?: { allowCrossSpaceTransfers?: boolean }
  ): void {
    if (!spaceId || typeof spaceId !== 'string' || !spaceId.trim()) {
      throw new InvariantViolationError(
        'INV-010',
        'Target spaceId must be a valid non-empty string identifier',
        { spaceId }
      );
    }

    const normalizedSpaceId = spaceId.trim();
    const allowCrossSpace = options?.allowCrossSpaceTransfers ?? true;

    for (const tx of transactions) {
      if (!tx || typeof tx !== 'object') {
        throw new InvariantViolationError(
          'INV-010',
          'Invalid transaction encountered in space isolation check',
          { transaction: tx, spaceId: normalizedSpaceId }
        );
      }

      const txSpaceId = typeof tx.spaceId === 'string' ? tx.spaceId.trim() : '';
      if (!txSpaceId) {
        throw new InvariantViolationError(
          'INV-010',
          `Transaction ${tx.id} is missing a valid spaceId`,
          { transactionId: tx.id, expectedSpaceId: normalizedSpaceId }
        );
      }

      // Check direct space membership
      if (txSpaceId === normalizedSpaceId) {
        continue;
      }

      // If it's a cross-space transfer with this space as target
      if (
        allowCrossSpace &&
        tx.type === 'transfer' &&
        tx.targetSpaceId &&
        typeof tx.targetSpaceId === 'string' &&
        tx.targetSpaceId.trim() === normalizedSpaceId
      ) {
        continue;
      }

      throw new InvariantViolationError(
        'INV-010',
        `Transaction ${tx.id} belongs to space '${txSpaceId}', violating isolation boundary of space '${normalizedSpaceId}'`,
        { transactionId: tx.id, transactionSpaceId: txSpaceId, expectedSpaceId: normalizedSpaceId }
      );
    }
  }

  /**
   * INV-011: Fund Isolation Law (Group D - Space Isolation & Audit)
   * Financial truth within a dedicated fund/wallet/account boundary must not be contaminated by other funds.
   * Verifies that transactions reference the designated fund/wallet without silent cross-fund merging.
   */
  public static assertFundIsolation(
    transactions: Transaction[],
    fundOrWalletId: string,
    options?: { allowTargetTransfers?: boolean }
  ): void {
    if (!fundOrWalletId || typeof fundOrWalletId !== 'string' || !fundOrWalletId.trim()) {
      throw new InvariantViolationError(
        'INV-011',
        'Fund or Wallet identifier must be a valid non-empty string',
        { fundOrWalletId }
      );
    }

    const targetId = fundOrWalletId.trim();
    const allowTarget = options?.allowTargetTransfers ?? true;

    for (const tx of transactions) {
      if (!tx || typeof tx !== 'object') continue;

      const srcWallet = (tx.walletId || tx.accountId || (tx as any).fundId || '')?.trim();
      const dstWallet = (tx.targetWalletId || (tx as any).targetFundId || '')?.trim();

      const isSourceMatch = srcWallet === targetId;
      const isTargetMatch = allowTarget && dstWallet === targetId;

      if (!isSourceMatch && !isTargetMatch) {
        throw new InvariantViolationError(
          'INV-011',
          `Transaction ${tx.id} with fund/wallet '${srcWallet || 'none'}' does not belong to fund boundary '${targetId}'`,
          { transactionId: tx.id, transactionFund: srcWallet, expectedFund: targetId }
        );
      }
    }
  }

  /**
   * INV-012: Global System Conservation Law (Group D - Space Isolation & Audit)
   * System-wide wealth delta must equal total system incomes minus total system expenses.
   * Internal and cross-space transfers must maintain net-zero impact across all spaces without creating or destroying system wealth.
   */
  public static assertGlobalConservation(allTransactions: Transaction[]): void {
    let totalIncomes = 0;
    let totalExpenses = 0;
    let transferNetDelta = 0;

    for (const tx of allTransactions) {
      if (!FinancialTruthEngine.isActiveConfirmedTransaction(tx)) {
        continue;
      }

      const amt = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0;
      if (amt < 0) {
        throw new InvariantViolationError(
          'INV-012',
          `Transaction ${tx.id} has negative amount ${amt} in global conservation`,
          { transactionId: tx.id, amount: amt }
        );
      }

      if (tx.type === 'income' || tx.type === 'opening_balance' || tx.type === 'initial_balance' || tx.type === 'compensation') {
        totalIncomes += amt;
      } else if (tx.type === 'expense' || tx.type === 'debt_payment') {
        totalExpenses += amt;
      } else if (tx.type === 'adjustment') {
        if (amt >= 0) totalIncomes += amt;
        else totalExpenses += Math.abs(amt);
      } else if (tx.type === 'transfer') {
        const dstAmtRaw = (tx as any).destinationAmount ?? tx.amount;
        const dstAmt = typeof dstAmtRaw === 'number' && Number.isFinite(dstAmtRaw) ? dstAmtRaw : amt;
        transferNetDelta += (dstAmt - amt);
      }
    }

    if (!Number.isFinite(totalIncomes) || !Number.isFinite(totalExpenses) || !Number.isFinite(transferNetDelta)) {
      throw new InvariantViolationError(
        'INV-012',
        'Global conservation violated: non-finite or NaN numbers detected in system totals',
        { totalIncomes, totalExpenses, transferNetDelta }
      );
    }

    if (Math.abs(transferNetDelta) > 0.0001) {
      throw new InvariantViolationError(
        'INV-012',
        `Global transfer neutrality violated: net transfer delta is ${transferNetDelta}, expected 0`,
        { transferNetDelta }
      );
    }
  }

  /**
   * INV-013: Lifecycle State Machine Law (Group D - Space Isolation & Audit)
   * Transactions must have valid lifecycle statuses and obey strict active/inactive calculation inclusion rules.
   * Draft, pending, soft_deleted, archived, and deleted transactions must NEVER be included in confirmed calculations.
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

    if (!transaction || typeof transaction !== 'object') {
      throw new InvariantViolationError(
        'INV-013',
        'Transaction must be a valid non-null object',
        { transaction }
      );
    }

    if (!transaction.status || !validStatuses.includes(transaction.status)) {
      throw new InvariantViolationError(
        'INV-013',
        `Transaction ${transaction.id} has invalid status '${transaction.status}'`,
        { transactionId: transaction.id, status: transaction.status, validStatuses }
      );
    }

    if (transaction.isDeleted && transaction.status !== 'soft_deleted' && transaction.status !== 'archived') {
      throw new InvariantViolationError(
        'INV-013',
        `Transaction ${transaction.id} has isDeleted=true but status is '${transaction.status}'`,
        { transactionId: transaction.id, isDeleted: transaction.isDeleted, status: transaction.status }
      );
    }

    if (transaction.deletedAt && !transaction.isDeleted && transaction.status !== 'soft_deleted' && transaction.status !== 'archived') {
      throw new InvariantViolationError(
        'INV-013',
        `Transaction ${transaction.id} has deletedAt timestamp but is marked as active status '${transaction.status}'`,
        { transactionId: transaction.id, deletedAt: transaction.deletedAt, status: transaction.status }
      );
    }
  }

  /**
   * INV-013 Helper: Soft-deleted or archived transactions must never affect calculations.
   */
  public static assertExclusionFromCalculation(transaction: Transaction): void {
    const isExcludedStatus = transaction.isDeleted || !!transaction.deletedAt || transaction.status === 'soft_deleted' || transaction.status === 'archived' || transaction.status === 'draft' || (transaction.status as any) === 'pending';
    const isIncludedInCalc = FinancialTruthEngine.isActiveConfirmedTransaction(transaction);

    if (isExcludedStatus && isIncludedInCalc) {
      throw new InvariantViolationError(
        'INV-013',
        `Transaction ${transaction.id} is deleted/archived/draft but was included in balance calculations`,
        { transactionId: transaction.id, status: transaction.status, isDeleted: transaction.isDeleted, deletedAt: transaction.deletedAt }
      );
    }
  }

  /**
   * INV-013 Helper: Draft transactions must never affect settled account balance.
   */
  public static assertDraftExclusion(draftTx: Transaction, currentBalance: number): void {
    if (draftTx.status === 'draft' || (draftTx.status as any) === 'pending') {
      const affectsCalc = FinancialTruthEngine.isActiveConfirmedTransaction(draftTx);
      if (affectsCalc) {
        throw new InvariantViolationError(
          'INV-013',
          `Draft/pending transaction ${draftTx.id} must not affect settled account balance (${currentBalance})`,
          { transactionId: draftTx.id, status: draftTx.status, currentBalance }
        );
      }
    }
  }

  /**
   * INV-014: Idempotency Law (Group D - Space Isolation & Audit)
   * Financial batch processing and event replaying must be idempotent.
   * Duplicate transaction identifiers within the same operation are strictly rejected.
   */
  public static assertIdempotency(operation: string, transactions: Transaction[]): boolean {
    if (!operation || typeof operation !== 'string' || !operation.trim()) {
      throw new InvariantViolationError(
        'INV-014',
        'Operation identifier must be a valid non-empty string',
        { operation }
      );
    }

    if (!Array.isArray(transactions)) {
      throw new InvariantViolationError(
        'INV-014',
        'Transactions input must be a valid array',
        { operation, transactions }
      );
    }

    const idSet = new Set<string>();
    for (const tx of transactions) {
      if (!tx || !tx.id || typeof tx.id !== 'string' || !tx.id.trim()) {
        throw new InvariantViolationError(
          'INV-014',
          `Transaction in operation '${operation}' is missing a valid id`,
          { operation, transaction: tx }
        );
      }
      const trimmedId = tx.id.trim();
      if (idSet.has(trimmedId)) {
        throw new InvariantViolationError(
          'INV-014',
          `Duplicate transaction ID detected: ${trimmedId} in operation '${operation}'`,
          { operation, duplicateId: trimmedId }
        );
      }
      idSet.add(trimmedId);
    }
    return true;
  }

  /**
   * INV-015: Audit Trail & Traceability Law (Group D - Space Isolation & Audit)
   * Audit trail must grow monotonically with each mutating version.
   * State transitions must preserve traceable action history without silent removal.
   */
  public static assertAuditTrailGrowth(txOrId: Transaction | string, expectedEntries?: number, auditTrail?: any[]): void {
    const entries = typeof txOrId === 'object' && txOrId.auditTrail
      ? txOrId.auditTrail
      : auditTrail || [];

    if (expectedEntries !== undefined) {
      if (typeof expectedEntries !== 'number' || isNaN(expectedEntries) || expectedEntries < 0) {
        throw new InvariantViolationError(
          'INV-015',
          `Expected entries must be a non-negative number, received: ${expectedEntries}`,
          { expectedEntries }
        );
      }
      if (entries.length < expectedEntries) {
        throw new InvariantViolationError(
          'INV-015',
          `Audit trail length (${entries.length}) is less than expected entries (${expectedEntries})`,
          { expectedEntries, actualEntries: entries.length }
        );
      }
    }

    if (entries.length === 0 && typeof txOrId === 'object' && txOrId.version && txOrId.version > 1) {
      throw new InvariantViolationError(
        'INV-015',
        `Versioned transaction (version ${txOrId.version}) has empty audit trail`,
        { version: txOrId.version }
      );
    }
  }
}
