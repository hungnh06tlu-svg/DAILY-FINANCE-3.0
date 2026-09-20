/**
 * Daily Finance 3.0 - AIPayloadValidator
 * Domain Service for AI Endpoint Hardening, Payload Validation, Space/Fund Isolation & Financial Grounding.
 * Strictly adheres to AI-001D and Canonical Financial Model rules.
 * 
 * ZERO direct database writes.
 * ZERO independent calculation authority (relies on canonical formulas & strict isolation).
 * Pure deterministic validation, sanitization, and grounding.
 */

export interface RawAITransaction {
  id?: string;
  type?: string;
  amount?: number | string;
  currency?: string;
  category?: string;
  spaceId?: string;
  fundId?: string;
  walletId?: string;
  status?: string;
  isDeleted?: boolean;
  isSoftDeleted?: boolean;
  deletedAt?: string | null;
  date?: string;
  note?: string;
  merchant?: string;
  method?: string;
}

export interface ValidatedAITransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  spaceId: string;
  fundId?: string;
  walletId?: string;
  status: string;
  date: string;
  note?: string;
  merchant?: string;
}

export interface RawAIBudget {
  id?: string;
  category?: string;
  amount?: number | string;
  limit?: number | string;
  spaceId?: string;
  fundId?: string;
  status?: string;
  isDeleted?: boolean;
  isSoftDeleted?: boolean;
  period?: string;
}

export interface ValidatedAIBudget {
  id: string;
  category: string;
  amount: number;
  spaceId: string;
  fundId?: string;
  period?: string;
}

export interface AIFinancialGrounding {
  spaceId: string;
  fundId?: string;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  activeTransactionCount: number;
  activeBudgetCount: number;
  totalBudgetLimit: number;
  currency: string;
  excludedAudit: {
    mismatchedSpaceCount: number;
    mismatchedFundCount: number;
    inactiveLifecycleCount: number;
    invalidAmountCount: number;
    totalExcluded: number;
  };
}

export interface PrepareInsightsResult {
  targetSpaceId: string;
  targetFundId?: string;
  sanitizedTransactions: ValidatedAITransaction[];
  sanitizedBudgets: ValidatedAIBudget[];
  grounding: AIFinancialGrounding;
  groundedPromptSnippet: string;
}

export class AIPayloadValidator {
  /**
   * Inactive transaction lifecycle states that MUST be excluded from financial calculations & insights.
   */
  public static readonly EXCLUDED_STATUSES = new Set([
    'draft',
    'pending',
    'soft_deleted',
    'deleted',
    'archived'
  ]);

  /**
   * Validates and normalizes spaceId. Fails safe if invalid or empty.
   */
  public static validateSpaceId(spaceId?: any): string {
    if (typeof spaceId !== 'string' || !spaceId.trim()) {
      return 'sp_personal';
    }
    const clean = spaceId.trim();
    // Prevent malicious path or injection strings
    if (clean.length > 64 || /[^a-zA-Z0-9_\-]/.test(clean)) {
      return 'sp_personal';
    }
    return clean;
  }

  /**
   * Validates and normalizes fundId if present.
   */
  public static validateFundId(fundId?: any): string | undefined {
    if (typeof fundId !== 'string' || !fundId.trim()) {
      return undefined;
    }
    const clean = fundId.trim();
    if (clean.length > 64 || /[^a-zA-Z0-9_\-]/.test(clean)) {
      return undefined;
    }
    return clean;
  }

  /**
   * Checks if a raw transaction represents an active, confirmed financial event.
   */
  public static isTransactionActive(tx: RawAITransaction): boolean {
    if (!tx || typeof tx !== 'object') return false;

    // Explicit deletion flags
    if (tx.isDeleted === true || tx.isSoftDeleted === true) return false;
    if (tx.deletedAt !== null && tx.deletedAt !== undefined) return false;

    // Status lifecycle check
    if (tx.status) {
      const normalizedStatus = String(tx.status).trim().toLowerCase();
      if (this.EXCLUDED_STATUSES.has(normalizedStatus)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates and sanitizes transactions for AI context with Space & Fund isolation.
   */
  public static sanitizeTransactions(
    rawTransactions: any[],
    targetSpaceId: string,
    targetFundId?: string
  ): {
    sanitized: ValidatedAITransaction[];
    excluded: {
      mismatchedSpaceCount: number;
      mismatchedFundCount: number;
      inactiveLifecycleCount: number;
      invalidAmountCount: number;
      totalExcluded: number;
    };
  } {
    const sanitized: ValidatedAITransaction[] = [];
    const excluded = {
      mismatchedSpaceCount: 0,
      mismatchedFundCount: 0,
      inactiveLifecycleCount: 0,
      invalidAmountCount: 0,
      totalExcluded: 0
    };

    if (!Array.isArray(rawTransactions)) {
      return { sanitized, excluded };
    }

    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      if (!raw || typeof raw !== 'object') {
        excluded.invalidAmountCount++;
        excluded.totalExcluded++;
        continue;
      }

      // 1. Space Isolation Guard
      const txSpace = raw.spaceId ? String(raw.spaceId).trim() : undefined;
      if (txSpace && txSpace !== targetSpaceId) {
        excluded.mismatchedSpaceCount++;
        excluded.totalExcluded++;
        continue;
      }
      // If transaction has no spaceId specified, reject to prevent cross-space contamination
      if (!txSpace) {
        excluded.mismatchedSpaceCount++;
        excluded.totalExcluded++;
        continue;
      }

      // 2. Fund Isolation Guard
      if (targetFundId) {
        const txFund = raw.fundId ? String(raw.fundId).trim() : undefined;
        if (!txFund || txFund !== targetFundId) {
          excluded.mismatchedFundCount++;
          excluded.totalExcluded++;
          continue;
        }
      }

      // 3. Lifecycle Filter Guard
      if (!this.isTransactionActive(raw)) {
        excluded.inactiveLifecycleCount++;
        excluded.totalExcluded++;
        continue;
      }

      // 4. Amount Validation & Precision Preservation
      const numAmount = typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount || '0'));
      if (isNaN(numAmount) || !isFinite(numAmount) || numAmount < 0) {
        excluded.invalidAmountCount++;
        excluded.totalExcluded++;
        continue;
      }

      // 5. Canonical Type Normalization
      let canonicalType: 'income' | 'expense' | 'transfer' = 'expense';
      const rawType = String(raw.type || '').toLowerCase().trim();
      if (rawType === 'income') canonicalType = 'income';
      else if (rawType === 'transfer') canonicalType = 'transfer';
      else canonicalType = 'expense';

      sanitized.push({
        id: String(raw.id || `ai_tx_${i}`),
        type: canonicalType,
        amount: numAmount,
        currency: String(raw.currency || 'VND').toUpperCase(),
        category: String(raw.category || 'General').trim(),
        spaceId: targetSpaceId,
        fundId: raw.fundId ? String(raw.fundId).trim() : undefined,
        walletId: raw.walletId ? String(raw.walletId).trim() : undefined,
        status: raw.status ? String(raw.status).toLowerCase().trim() : 'confirmed',
        date: raw.date ? String(raw.date) : new Date().toISOString(),
        note: raw.note ? String(raw.note).slice(0, 200) : undefined,
        merchant: raw.merchant ? String(raw.merchant).slice(0, 100) : undefined
      });
    }

    return { sanitized, excluded };
  }

  /**
   * Validates and sanitizes budgets for AI context with Space & Fund isolation.
   */
  public static sanitizeBudgets(
    rawBudgets: any[],
    targetSpaceId: string,
    targetFundId?: string
  ): ValidatedAIBudget[] {
    const sanitized: ValidatedAIBudget[] = [];
    if (!Array.isArray(rawBudgets)) {
      return sanitized;
    }

    for (let i = 0; i < rawBudgets.length; i++) {
      const raw = rawBudgets[i];
      if (!raw || typeof raw !== 'object') continue;

      // Inactive budget check
      if (raw.isDeleted === true || raw.isSoftDeleted === true || raw.status === 'archived') {
        continue;
      }

      // Space check
      const bSpace = raw.spaceId ? String(raw.spaceId).trim() : undefined;
      if (bSpace && bSpace !== targetSpaceId) continue;

      // Fund check
      if (targetFundId && raw.fundId && String(raw.fundId).trim() !== targetFundId) {
        continue;
      }

      const limitVal = typeof raw.limit === 'number' ? raw.limit : (typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount || raw.limit || '0')));
      if (isNaN(limitVal) || limitVal <= 0) continue;

      sanitized.push({
        id: String(raw.id || `ai_b_${i}`),
        category: String(raw.category || 'General').trim(),
        amount: limitVal,
        spaceId: targetSpaceId,
        fundId: raw.fundId ? String(raw.fundId).trim() : undefined,
        period: raw.period ? String(raw.period) : 'monthly'
      });
    }

    return sanitized;
  }

  /**
   * Computes authoritative financial grounding metrics for grounding LLM prompts.
   */
  public static computeGrounding(
    sanitizedTxs: ValidatedAITransaction[],
    sanitizedBudgets: ValidatedAIBudget[],
    spaceId: string,
    fundId?: string,
    excludedAudit?: {
      mismatchedSpaceCount: number;
      mismatchedFundCount: number;
      inactiveLifecycleCount: number;
      invalidAmountCount: number;
      totalExcluded: number;
    }
  ): AIFinancialGrounding {
    let totalIncome = 0;
    let totalExpense = 0;
    let preferredCurrency = 'VND';

    for (const tx of sanitizedTxs) {
      if (tx.currency) preferredCurrency = tx.currency;
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
      // Note: Transfers within space do not contribute to income/expense
    }

    let totalBudgetLimit = 0;
    for (const b of sanitizedBudgets) {
      totalBudgetLimit += b.amount;
    }

    const netCashFlow = totalIncome - totalExpense;

    return {
      spaceId,
      fundId,
      totalIncome: Math.round(totalIncome * 1000) / 1000,
      totalExpense: Math.round(totalExpense * 1000) / 1000,
      netCashFlow: Math.round(netCashFlow * 1000) / 1000,
      activeTransactionCount: sanitizedTxs.length,
      activeBudgetCount: sanitizedBudgets.length,
      totalBudgetLimit: Math.round(totalBudgetLimit * 1000) / 1000,
      currency: preferredCurrency,
      excludedAudit: excludedAudit || {
        mismatchedSpaceCount: 0,
        mismatchedFundCount: 0,
        inactiveLifecycleCount: 0,
        invalidAmountCount: 0,
        totalExcluded: 0
      }
    };
  }

  /**
   * Prepares full insights payload, grounding, and prompt snippet.
   */
  public static prepareInsightsPayload(inputs: {
    transactions?: any[];
    budgets?: any[];
    spaceId?: any;
    fundId?: any;
  }): PrepareInsightsResult {
    const targetSpaceId = this.validateSpaceId(inputs.spaceId);
    const targetFundId = this.validateFundId(inputs.fundId);

    const { sanitized: sanitizedTransactions, excluded } = this.sanitizeTransactions(
      inputs.transactions || [],
      targetSpaceId,
      targetFundId
    );

    const sanitizedBudgets = this.sanitizeBudgets(
      inputs.budgets || [],
      targetSpaceId,
      targetFundId
    );

    const grounding = this.computeGrounding(
      sanitizedTransactions,
      sanitizedBudgets,
      targetSpaceId,
      targetFundId,
      excluded
    );

    const groundedPromptSnippet = `
=== AUTHORITATIVE FINANCIAL TRUTH (IMMUTABLE GROUNDING — DO NOT RECALCULATE OR INVENT DIFFERENT NUMBERS) ===
- Active Space ID: ${grounding.spaceId}${grounding.fundId ? ` | Active Fund ID: ${grounding.fundId}` : ''}
- Verified Total Income: ${grounding.totalIncome} ${grounding.currency}
- Verified Total Expense: ${grounding.totalExpense} ${grounding.currency}
- Verified Net Cash Flow: ${grounding.netCashFlow} ${grounding.currency}
- Verified Active Transactions: ${grounding.activeTransactionCount}
- Verified Active Budgets Total: ${grounding.totalBudgetLimit} ${grounding.currency} (${grounding.activeBudgetCount} budgets)
- System Audit: Excluded ${grounding.excludedAudit.totalExcluded} inactive/mismatched transactions to preserve Space/Fund Isolation.

MANDATORY RULES:
1. You are an advisory AI, NOT an authoritative financial engine.
2. All quantitative statements MUST strictly match the Verified numbers above.
3. NEVER fabricate transactions, balances, debts, or assets not present in the verified grounding.
4. If transaction count is 0, acknowledge the clean slate without inventing dummy transactions.
==============================================================================================================
`;

    return {
      targetSpaceId,
      targetFundId,
      sanitizedTransactions,
      sanitizedBudgets,
      grounding,
      groundedPromptSnippet
    };
  }

  /**
   * Generates a safe, deterministic, non-mutating fallback response grounded in verified metrics.
   */
  public static generateSafeFallback(
    grounding: AIFinancialGrounding,
    language: string = 'vi'
  ): {
    summary: string;
    insights: Array<{ type: 'positive' | 'warning' | 'tip'; title: string; description: string }>;
    fireProgressNote: string;
    grounding: AIFinancialGrounding;
  } {
    const isVi = language === 'vi';
    const hasActivity = grounding.activeTransactionCount > 0;

    let summary = isVi
      ? `Báo Cáo Tài Chính Không Gian [${grounding.spaceId}]`
      : `Financial Report for Space [${grounding.spaceId}]`;

    const insights: Array<{ type: 'positive' | 'warning' | 'tip'; title: string; description: string }> = [];

    if (!hasActivity) {
      insights.push({
        type: 'tip',
        title: isVi ? 'Không Gian Chưa Có Giao Dịch' : 'No Transactions Recorded',
        description: isVi
          ? `Không gian ${grounding.spaceId} hiện chưa có giao dịch hoạt động nào. Hãy thêm giao dịch đầu tiên để AI phân tích.`
          : `Space ${grounding.spaceId} currently has no active transactions. Add your first transaction to receive insights.`
      });
    } else {
      if (grounding.netCashFlow >= 0) {
        insights.push({
          type: 'positive',
          title: isVi ? 'Dòng Tiền Dương' : 'Positive Cash Flow',
          description: isVi
            ? `Tổng thu nhập (${grounding.totalIncome} ${grounding.currency}) vượt chi tiêu (${grounding.totalExpense} ${grounding.currency}) với thặng dư ${grounding.netCashFlow} ${grounding.currency}.`
            : `Total income (${grounding.totalIncome} ${grounding.currency}) exceeds expense (${grounding.totalExpense} ${grounding.currency}) with a surplus of ${grounding.netCashFlow} ${grounding.currency}.`
        });
      } else {
        insights.push({
          type: 'warning',
          title: isVi ? 'Cảnh Báo Thâm Hụt Dòng Tiền' : 'Deficit Cash Flow Warning',
          description: isVi
            ? `Chi tiêu (${grounding.totalExpense} ${grounding.currency}) đang vượt quá thu nhập (${grounding.totalIncome} ${grounding.currency}) ${Math.abs(grounding.netCashFlow)} ${grounding.currency}.`
            : `Expense (${grounding.totalExpense} ${grounding.currency}) exceeds income (${grounding.totalIncome} ${grounding.currency}) by ${Math.abs(grounding.netCashFlow)} ${grounding.currency}.`
        });
      }

      if (grounding.totalBudgetLimit > 0) {
        const percentSpent = Math.round((grounding.totalExpense / grounding.totalBudgetLimit) * 100);
        insights.push({
          type: percentSpent > 100 ? 'warning' : 'tip',
          title: isVi ? 'Tỷ Lệ Tiêu Dùng Ngân Sách' : 'Budget Utilization',
          description: isVi
            ? `Bạn đã chi ${grounding.totalExpense} / ${grounding.totalBudgetLimit} ${grounding.currency} (${percentSpent}% tổng hạn mức ngân sách).`
            : `You have spent ${grounding.totalExpense} / ${grounding.totalBudgetLimit} ${grounding.currency} (${percentSpent}% of total budget limit).`
        });
      }
    }

    const fireNote = isVi
      ? `Định hướng tài chính cho không gian ${grounding.spaceId}: Duy trì tỷ lệ tiết kiệm để tối ưu hóa lộ trình FIRE.`
      : `Financial guidance for space ${grounding.spaceId}: Maintain high savings rate to optimize FIRE trajectory.`;

    return {
      summary,
      insights,
      fireProgressNote: fireNote,
      grounding
    };
  }
}
