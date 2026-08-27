/**
 * Daily Finance 3.0 - Financial Truth Engine
 * Authoritative Domain Engine - 100% Pure Functions & Financial Invariants
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero external side-effects, zero UI/Android/Room dependencies.
 */

import {
  Transaction,
  Wallet,
  Investment,
  DebtItem,
  CreditCard,
  Budget,
  SavingsGoal,
  SixJar,
  Jar,
  Money
} from '../types';
import {
  MoneyUtils,
  SpaceIsolationGuard,
  DEFAULT_CURRENCY_CODE,
  JarConfigItem,
  DEFAULT_SIX_JARS_CONFIG
} from './CanonicalFinancialModel';

export class FinancialTruthEngine {
  /**
   * Internal canonical predicate: determines if a transaction is active and confirmed.
   * Excludes deleted, soft_deleted, archived, draft, and pending transactions.
   * Inclusion rules:
   * - status === 'confirmed' | 'validated' | 'restored' | 'posted'
   * - legacy test objects without `status` are treated as confirmed if isDeleted !== true and isSoftDeleted !== true.
   * Exclusion rules:
   * - tx is null/undefined
   * - tx.isDeleted === true or tx.isSoftDeleted === true or tx.deletedAt is set
   * - status === 'draft' | 'pending' | 'soft_deleted' | 'archived' | 'deleted'
   */
  public static isActiveConfirmedTransaction(tx: Transaction | Partial<Transaction> | null | undefined): boolean {
    if (!tx) return false;
    if (tx.isDeleted === true || (tx as any).isSoftDeleted === true) return false;
    if (tx.deletedAt && typeof tx.deletedAt === 'string' && tx.deletedAt.trim() !== '') return false;

    const status = (tx as any).status;
    if (status === 'soft_deleted' || status === 'archived' || status === 'draft' || status === 'pending' || status === 'deleted') {
      return false;
    }
    return status === 'confirmed' || status === 'validated' || status === 'restored' || status === 'posted' || status === undefined;
  }

  /**
   * Internal helper: determines if an entity is active and not deleted/archived.
   * Applies across Wallet, Investment, Debt, CreditCard, SavingsGoal, Budget, Jar, Space.
   */
  public static isActiveEntity(entity: any): boolean {
    if (!entity) return false;
    if (entity.isDeleted === true || entity.isSoftDeleted === true) return false;
    if (entity.deletedAt && typeof entity.deletedAt === 'string' && entity.deletedAt.trim() !== '') return false;
    if (entity.status === 'soft_deleted' || entity.status === 'archived' || entity.status === 'deleted' || entity.status === 'draft' || entity.status === 'inactive') {
      return false;
    }
    return true;
  }

  /**
   * Pure function: calculates balance from list of transactions and optional initial balance.
   * Handles canonical transaction types: income, expense, transfer, initial_balance, opening_balance, adjustment.
   * Enforces lifecycle filtering (excluding deleted/draft) and space isolation / transfer semantics.
   * 
   * Transfer Semantics:
   * 1. Space Isolation Mode (spaceId specified):
   *    - Internal transfer within the space: 0 net change.
   *    - Outbound Space Transfer (spaceId -> targetSpaceId): -amount from source space.
   *    - Inbound Space Transfer (sourceSpaceId -> spaceId): +amount to target space.
   * 2. System-wide Mode (no spaceId):
   *    - Internal and cross-space transfers have 0 net effect on system-wide total wealth.
   */
  static calculateBalance(
    transactions: Transaction[],
    initialBalance: number = 0,
    spaceId?: string
  ): number {
    if (!Array.isArray(transactions)) return MoneyUtils.round(initialBalance, 2);

    const validSpaceId = spaceId && spaceId.trim() !== '' ? spaceId.trim() : undefined;

    const net = transactions.reduce((acc, tx) => {
      if (!this.isActiveConfirmedTransaction(tx)) {
        return acc;
      }

      const amount = Math.abs(tx.amount || 0);

      // If space isolation is specified
      if (validSpaceId) {
        const isSourceSpace = tx.spaceId && tx.spaceId.trim() === validSpaceId;
        const isTargetSpace = tx.targetSpaceId && tx.targetSpaceId.trim() === validSpaceId;

        // If transaction does not touch this space, skip
        if (!isSourceSpace && !isTargetSpace) {
          return acc;
        }

        switch (tx.type) {
          case 'income':
          case 'initial_balance':
          case 'opening_balance':
          case 'compensation':
            return isSourceSpace ? acc + amount : acc;
          case 'expense':
          case 'debt_payment':
            return isSourceSpace ? acc - amount : acc;
          case 'adjustment':
            return isSourceSpace ? acc + (tx.amount || 0) : acc;
          case 'transfer':
            if (isSourceSpace && isTargetSpace) {
              // Internal wallet transfer within same space -> 0 net change
              return acc;
            } else if (isSourceSpace && tx.targetSpaceId && tx.targetSpaceId.trim() !== validSpaceId) {
              // Outbound space transfer: money leaves this space
              return acc - amount;
            } else if (isTargetSpace && tx.spaceId && tx.spaceId.trim() !== validSpaceId) {
              // Inbound space transfer: money enters this space
              return acc + amount;
            } else if (isSourceSpace && !tx.targetSpaceId) {
              // Internal wallet transfer (targetSpaceId omitted) -> 0 net change
              return acc;
            }
            return acc;
          default:
            return acc;
        }
      }

      // System-wide calculation (no spaceId filter)
      switch (tx.type) {
        case 'income':
        case 'initial_balance':
        case 'opening_balance':
        case 'compensation':
          return acc + amount;
        case 'expense':
        case 'debt_payment':
          return acc - amount;
        case 'adjustment':
          return acc + (tx.amount || 0);
        case 'transfer':
          // Neutral at system-wide aggregation:
          // Internal transfers net 0
          // Space transfers (Source - amount, Target + amount) net 0
          return acc;
        default:
          return acc;
      }
    }, initialBalance);

    return MoneyUtils.round(net, 2);
  }

  /**
   * Pure function: calculates balance for a specific wallet/fund from transaction history.
   * Enforces:
   * - Lifecycle filtering (active confirmed only).
   * - Inflows: income, initial_balance, opening_balance, compensation (+amount).
   * - Outflows: expense, debt_payment, saving, investment (-amount).
   * - Adjustments: adjustment (+amount / signed amount).
   * - Transfers:
   *   - If wallet is source (walletId / accountId): -amount
   *   - If wallet is target (targetWalletId): +amount
   *   - If wallet is both source and target: 0 net change
   * - Optional spaceId context check (ensures wallet transactions match requested space).
   */
  static calculateWalletBalance(
    transactions: Transaction[],
    walletId: string,
    initialBalance: number = 0,
    spaceId?: string
  ): number {
    if (!Array.isArray(transactions) || !walletId || walletId.trim() === '') {
      return MoneyUtils.round(initialBalance, 2);
    }

    const targetWallet = walletId.trim();
    const validSpaceId = spaceId && spaceId.trim() !== '' ? spaceId.trim() : undefined;

    const net = transactions.reduce((acc, tx) => {
      if (!this.isActiveConfirmedTransaction(tx)) {
        return acc;
      }

      const amount = Math.abs(tx.amount || 0);
      const sourceWallet = (tx.walletId || (tx as any).accountId || '').trim();
      const targetWalletId = (tx.targetWalletId || '').trim();

      const isSource = sourceWallet === targetWallet;
      const isTarget = targetWalletId === targetWallet;

      if (!isSource && !isTarget) {
        return acc;
      }

      // Space context isolation check if specified
      if (validSpaceId) {
        if (isSource && (!tx.spaceId || tx.spaceId.trim() !== validSpaceId)) {
          return acc;
        }
        if (isTarget) {
          const destSpace = (tx.targetSpaceId || tx.spaceId || '').trim();
          if (destSpace !== validSpaceId) {
            return acc;
          }
        }
      }

      switch (tx.type) {
        case 'income':
        case 'initial_balance':
        case 'opening_balance':
        case 'compensation':
        case 'debt':
          return isSource ? acc + amount : acc;
        case 'expense':
        case 'debt_payment':
        case 'saving':
        case 'investment':
          return isSource ? acc - amount : acc;
        case 'adjustment':
          return isSource ? acc + (tx.amount || 0) : acc;
        case 'transfer':
          if (isSource && isTarget) {
            return acc;
          } else if (isSource) {
            return acc - amount;
          } else if (isTarget) {
            return acc + amount;
          }
          return acc;
        default:
          return acc;
      }
    }, initialBalance);

    return MoneyUtils.round(net, 2);
  }

  /**
   * Pure function: calculates net worth = (wallets balance + investments value) - (debts + credit card balances)
   * Enforces canonical entity lifecycle checks (excluding soft-deleted/archived) and optional space isolation.
   */
  static calculateNetWorth(
    wallets: Wallet[] = [],
    investments: Investment[] = [],
    debts: DebtItem[] = [],
    creditCards: CreditCard[] = [],
    spaceId?: string
  ): number {
    let targetWallets = wallets || [];
    let targetInvestments = investments || [];
    let targetDebts = debts || [];
    let targetCreditCards = creditCards || [];

    if (spaceId && spaceId.trim() !== '') {
      targetWallets = SpaceIsolationGuard.filterBySpace(targetWallets, spaceId);
      targetInvestments = SpaceIsolationGuard.filterBySpace(targetInvestments, spaceId);
      targetDebts = SpaceIsolationGuard.filterBySpace(targetDebts, spaceId);
      targetCreditCards = SpaceIsolationGuard.filterBySpace(targetCreditCards, spaceId);
    }

    const totalWalletBalance = targetWallets.reduce(
      (sum, w) => sum + (this.isActiveEntity(w) && (w.status === 'active' || w.status === undefined) ? (w.currentBalance || 0) : 0),
      0
    );

    const totalInvestmentValue = targetInvestments.reduce(
      (sum, inv) => sum + (this.isActiveEntity(inv) ? ((inv.quantity || 0) * (inv.currentPrice || 0)) : 0),
      0
    );

    const totalDebtsOwed = targetDebts.reduce((sum, d) => {
      if (!this.isActiveEntity(d)) return sum;
      // type 'debt' = money you owe, 'loan' = money owed to you
      if (d.type === 'debt') return sum + (d.remainingAmount || 0);
      if (d.type === 'loan') return sum - (d.remainingAmount || 0);
      return sum;
    }, 0);

    const totalCreditCardBalances = targetCreditCards.reduce(
      (sum, card) => sum + (this.isActiveEntity(card) ? (card.currentBalance || 0) : 0),
      0
    );

    const totalAssets = totalWalletBalance + totalInvestmentValue;
    const totalLiabilities = totalDebtsOwed + totalCreditCardBalances;

    return MoneyUtils.round(totalAssets - totalLiabilities, 2);
  }

  /**
   * Pure function: calculates total income within optional date bounds and optional spaceId.
   * Strictly filters `tx.type === 'income'` and active confirmed lifecycle.
   */
  static calculateIncome(
    transactions: Transaction[],
    startDate?: string,
    endDate?: string,
    spaceId?: string
  ): number {
    if (!Array.isArray(transactions)) return 0;

    const validSpaceId = spaceId && spaceId.trim() !== '' ? spaceId.trim() : undefined;

    const total = transactions
      .filter((tx) => {
        if (!this.isActiveConfirmedTransaction(tx)) return false;
        if (tx.type !== 'income') return false;
        if (validSpaceId && (!tx.spaceId || tx.spaceId.trim() !== validSpaceId)) return false;
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
        return true;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    return MoneyUtils.round(total, 2);
  }

  /**
   * Pure function: calculates total expense within optional date bounds and optional spaceId.
   * Strictly filters `tx.type === 'expense'` and active confirmed lifecycle.
   */
  static calculateExpense(
    transactions: Transaction[],
    startDate?: string,
    endDate?: string,
    spaceId?: string
  ): number {
    if (!Array.isArray(transactions)) return 0;

    const validSpaceId = spaceId && spaceId.trim() !== '' ? spaceId.trim() : undefined;

    const total = transactions
      .filter((tx) => {
        if (!this.isActiveConfirmedTransaction(tx)) return false;
        if (tx.type !== 'expense') return false;
        if (validSpaceId && (!tx.spaceId || tx.spaceId.trim() !== validSpaceId)) return false;
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
        return true;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    return MoneyUtils.round(total, 2);
  }

  /**
   * Pure function: calculates net cash flow = income - expense
   */
  static calculateCashFlow(income: number, expense: number): number {
    return MoneyUtils.round((income || 0) - (expense || 0), 2);
  }

  /**
   * Pure function: calculates budget usage metrics
   * Filters transactions by lifecycle (active confirmed) and category.
   */
  static calculateBudgetUsage(
    budget: Budget,
    transactions: Transaction[] = [],
    spaceId?: string
  ): { spent: number; remaining: number; usagePercent: number; isExceeded: boolean; isWarning: boolean } {
    if (!this.isActiveEntity(budget)) {
      return { spent: 0, remaining: 0, usagePercent: 0, isExceeded: false, isWarning: false };
    }

    const allocated = Math.max(0, budget.allocatedAmount || 0);
    const validSpaceId = spaceId && spaceId.trim() !== '' ? spaceId.trim() : (budget.spaceId ? budget.spaceId.trim() : undefined);

    // Filter expenses matching this budget category if transactions provided
    const categoryExpenses = (transactions || [])
      .filter((tx) => {
        if (!this.isActiveConfirmedTransaction(tx)) return false;
        if (tx.type !== 'expense') return false;
        if (validSpaceId && (!tx.spaceId || tx.spaceId.trim() !== validSpaceId)) return false;
        return (tx.category || '').toLowerCase() === (budget.category || '').toLowerCase();
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    const spent = (transactions && transactions.length > 0) ? categoryExpenses : (budget.spentAmount || 0);
    const remaining = Math.max(0, allocated - spent);
    const usagePercent = allocated > 0 ? Math.min(1000, Math.round((spent / allocated) * 100)) : 0;
    const isExceeded = spent > allocated;
    const warningThreshold = budget.warningThreshold || 80;
    const isWarning = usagePercent >= warningThreshold && !isExceeded;

    return {
      spent: MoneyUtils.round(spent, 2),
      remaining: MoneyUtils.round(remaining, 2),
      usagePercent,
      isExceeded,
      isWarning
    };
  }

  /**
   * Pure function: calculates savings goal progress
   */
  static calculateSavingProgress(goal: SavingsGoal): {
    progressPercent: number;
    remainingAmount: number;
    isCompleted: boolean;
  } {
    if (!this.isActiveEntity(goal)) {
      return { progressPercent: 0, remainingAmount: 0, isCompleted: false };
    }

    const target = Math.max(0, goal.targetAmount || 0);
    const current = Math.max(0, goal.currentAmount || 0);
    const remainingAmount = Math.max(0, target - current);
    const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const isCompleted = current >= target && target > 0;

    return {
      progressPercent,
      remainingAmount: MoneyUtils.round(remainingAmount, 2),
      isCompleted
    };
  }

  /**
   * Pure function: calculates investment total return and percentage return
   */
  static calculateInvestmentReturn(investments: Investment[] = [], spaceId?: string): {
    totalInvested: number;
    currentValue: number;
    totalReturn: number;
    returnPercent: number;
  } {
    let targetInvestments = investments || [];
    if (spaceId && spaceId.trim() !== '') {
      targetInvestments = SpaceIsolationGuard.filterBySpace(targetInvestments, spaceId);
    }

    let totalInvested = 0;
    let currentValue = 0;

    targetInvestments.forEach((inv) => {
      if (!this.isActiveEntity(inv)) return;
      const qty = Math.max(0, inv.quantity || 0);
      const buyPrice = Math.max(0, inv.purchasePrice || 0);
      const currPrice = Math.max(0, inv.currentPrice || 0);

      totalInvested += qty * buyPrice;
      currentValue += qty * currPrice;
    });

    const totalReturn = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested: MoneyUtils.round(totalInvested, 2),
      currentValue: MoneyUtils.round(currentValue, 2),
      totalReturn: MoneyUtils.round(totalReturn, 2),
      returnPercent: MoneyUtils.round(returnPercent, 2)
    };
  }

  /**
   * Pure function: calculates debt payoff progress
   */
  static calculateDebtProgress(debts: DebtItem[] = [], spaceId?: string): {
    totalDebt: number;
    remainingDebt: number;
    paidPercent: number;
  } {
    let targetDebts = debts || [];
    if (spaceId && spaceId.trim() !== '') {
      targetDebts = SpaceIsolationGuard.filterBySpace(targetDebts, spaceId);
    }

    let totalDebt = 0;
    let remainingDebt = 0;

    targetDebts.forEach((d) => {
      if (!this.isActiveEntity(d)) return;
      if (d.type === 'debt') {
        totalDebt += Math.max(0, d.originalAmount || 0);
        remainingDebt += Math.max(0, d.remainingAmount || 0);
      }
    });

    const paidAmount = Math.max(0, totalDebt - remainingDebt);
    const paidPercent = totalDebt > 0 ? Math.min(100, Math.round((paidAmount / totalDebt) * 100)) : 100;

    return {
      totalDebt: MoneyUtils.round(totalDebt, 2),
      remainingDebt: MoneyUtils.round(remainingDebt, 2),
      paidPercent
    };
  }

  /**
   * Pure function: calculates credit utilization percentage across cards
   */
  static calculateCreditUtilization(cards: CreditCard[] = [], spaceId?: string): {
    totalLimit: number;
    totalUsed: number;
    utilizationPercent: number;
    isHealthy: boolean;
  } {
    let targetCards = cards || [];
    if (spaceId && spaceId.trim() !== '') {
      targetCards = SpaceIsolationGuard.filterBySpace(targetCards, spaceId);
    }

    let totalLimit = 0;
    let totalUsed = 0;

    targetCards.forEach((card) => {
      if (!this.isActiveEntity(card)) return;
      totalLimit += Math.max(0, card.creditLimit || 0);
      totalUsed += Math.max(0, card.currentBalance || 0);
    });

    const utilizationPercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    const isHealthy = utilizationPercent <= 30;

    return {
      totalLimit: MoneyUtils.round(totalLimit, 2),
      totalUsed: MoneyUtils.round(totalUsed, 2),
      utilizationPercent: MoneyUtils.round(utilizationPercent, 1),
      isHealthy
    };
  }

  /**
   * Pure function: calculates emergency fund status based on liquid wallets & monthly expenses
   */
  static calculateEmergencyFund(
    wallets: Wallet[] = [],
    monthlyExpense: number = 0,
    spaceId?: string
  ): {
    currentFund: number;
    targetFund6Months: number;
    coverageMonths: number;
    isAdequate: boolean;
  } {
    let targetWallets = wallets || [];
    if (spaceId && spaceId.trim() !== '') {
      targetWallets = SpaceIsolationGuard.filterBySpace(targetWallets, spaceId);
    }

    const liquidFund = targetWallets
      .filter((w) => this.isActiveEntity(w) && (w.status === 'active' || w.status === undefined) && (w.type === 'cash' || w.type === 'bank' || w.type === 'e_wallet'))
      .reduce((sum, w) => sum + Math.max(0, w.currentBalance || 0), 0);

    const safeMonthlyExpense = Math.max(1, monthlyExpense);
    const targetFund6Months = safeMonthlyExpense * 6;
    const coverageMonths = liquidFund / safeMonthlyExpense;
    const isAdequate = coverageMonths >= 3;

    return {
      currentFund: MoneyUtils.round(liquidFund, 2),
      targetFund6Months: MoneyUtils.round(targetFund6Months, 2),
      coverageMonths: MoneyUtils.round(coverageMonths, 1),
      isAdequate
    };
  }

  /**
   * Pure function: calculates holistic financial health score (0 to 100)
   */
  static calculateFinancialHealth(
    income: number,
    expense: number,
    netWorth: number,
    totalDebt: number,
    emergencyMonths: number
  ): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'warning' | 'critical';
    breakdown: {
      savingsScore: number;
      debtScore: number;
      emergencyScore: number;
      netWorthScore: number;
    };
  } {
    const safeIncome = Math.max(1, income);
    const savingsRate = Math.max(0, (income - expense) / safeIncome);

    // 1. Savings score (max 30 points)
    const savingsScore = Math.min(30, Math.round(savingsRate * 100 * 1.5));

    // 2. Debt to Income score (max 25 points)
    const debtToIncomeRatio = totalDebt / (safeIncome * 12);
    let debtScore = 25;
    if (debtToIncomeRatio > 1.0) debtScore = 5;
    else if (debtToIncomeRatio > 0.5) debtScore = 15;
    else if (debtToIncomeRatio > 0.2) debtScore = 20;

    // 3. Emergency fund score (max 25 points)
    const emergencyScore = Math.min(25, Math.round((emergencyMonths / 6) * 25));

    // 4. Net worth trajectory score (max 20 points)
    const netWorthScore = netWorth > 0 ? 20 : netWorth === 0 ? 10 : 0;

    const score = Math.min(100, Math.max(0, savingsScore + debtScore + emergencyScore + netWorthScore));

    let status: 'excellent' | 'good' | 'fair' | 'warning' | 'critical' = 'fair';
    if (score >= 85) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'fair';
    else if (score >= 35) status = 'warning';
    else status = 'critical';

    return {
      score,
      status,
      breakdown: {
        savingsScore,
        debtScore,
        emergencyScore,
        netWorthScore
      }
    };
  }

  /**
   * Pure function: calculates Jars allocation for given total income based on canonical or customizable jar config.
   * D2-001B: Jars are fully customizable (custom ratios, custom names, custom jar count, custom keys).
   * Falls back to DEFAULT_SIX_JARS_CONFIG only when currentJars is omitted or empty.
   */
  static calculateSixJars(
    totalIncome: number,
    currentJarsOrConfig?: (SixJar | Jar | JarConfigItem)[]
  ): SixJar[] {
    const safeIncome = Math.max(0, totalIncome);

    // If custom jars or configuration provided, respect user's configuration
    if (currentJarsOrConfig && Array.isArray(currentJarsOrConfig) && currentJarsOrConfig.length > 0) {
      const activeJars = currentJarsOrConfig.filter((j) => {
        if (!this.isActiveEntity(j)) return false;
        if (j.isEnabled === false) return false;
        return true;
      });

      return activeJars.map((item) => {
        const percent = typeof item.percent === 'number' && !isNaN(item.percent) ? item.percent : 0;
        const allocated = Math.round((safeIncome * percent) / 100);
        const existingBalance = item.currentBalance || 0;

        return {
          id: item.id || `jar_${item.key.toLowerCase()}`,
          key: item.key,
          nameVi: item.nameVi || item.key,
          nameEn: item.nameEn || item.key,
          percent,
          currentBalance: existingBalance + allocated,
          color: item.color || '#3B82F6',
          descriptionVi: item.descriptionVi || '',
          descriptionEn: item.descriptionEn || '',
          spaceId: item.spaceId,
          status: item.status as any || 'active',
          isEnabled: item.isEnabled !== false,
          isSoftDeleted: false
        };
      });
    }

    // Default 6 Jars fallback template
    return DEFAULT_SIX_JARS_CONFIG.map((item) => {
      const allocated = Math.round((safeIncome * item.percent) / 100);

      return {
        id: `jar_${item.key.toLowerCase()}`,
        key: item.key,
        nameVi: item.nameVi || item.key,
        nameEn: item.nameEn || item.key,
        percent: item.percent,
        currentBalance: allocated,
        color: item.color || '#3B82F6',
        descriptionVi: item.descriptionVi || '',
        descriptionEn: item.descriptionEn || '',
        status: 'active',
        isEnabled: true,
        isSoftDeleted: false
      };
    });
  }

  /**
   * Pure function: calculates money transfer between accounts including transfer fee
   */
  static calculateTransfer(
    fromAccountBalance: number,
    toAccountBalance: number,
    transferAmount: number,
    fee: number = 0
  ): {
    newFromBalance: number;
    newToBalance: number;
    isSuccess: boolean;
    errorReason?: string;
  } {
    const amount = Math.max(0, transferAmount);
    const safeFee = Math.max(0, fee);
    const totalDeduction = amount + safeFee;

    if (fromAccountBalance < totalDeduction) {
      return {
        newFromBalance: fromAccountBalance,
        newToBalance: toAccountBalance,
        isSuccess: false,
        errorReason: 'INSUFFICIENT_FUNDS'
      };
    }

    return {
      newFromBalance: MoneyUtils.round(fromAccountBalance - totalDeduction, 2),
      newToBalance: MoneyUtils.round(toAccountBalance + amount, 2),
      isSuccess: true
    };
  }

  /**
   * Pure function: compound growth forecast over time
   */
  static calculateForecast(
    currentNetWorth: number,
    monthlySavings: number,
    annualReturnRatePercent: number = 7,
    months: number = 12
  ): { month: number; estimatedNetWorth: number; interestEarned: number }[] {
    const monthlyRate = annualReturnRatePercent / 100 / 12;
    const timeline: { month: number; estimatedNetWorth: number; interestEarned: number }[] = [];

    let balance = currentNetWorth;
    let totalInterest = 0;

    for (let m = 1; m <= months; m++) {
      const monthlyInterest = balance * monthlyRate;
      totalInterest += monthlyInterest;
      balance = balance + monthlySavings + monthlyInterest;

      timeline.push({
        month: m,
        estimatedNetWorth: MoneyUtils.round(balance, 2),
        interestEarned: MoneyUtils.round(totalInterest, 2)
      });
    }

    return timeline;
  }

  /**
   * Value Object helper: Money operations
   */
  static addMoney(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch error: ${a.currency} vs ${b.currency}`);
    }
    const scale = a.scale !== undefined ? a.scale : (a.currency === DEFAULT_CURRENCY_CODE ? 0 : 2);
    return {
      amount: MoneyUtils.round(a.amount + b.amount, scale),
      currency: a.currency,
      scale
    };
  }

  static subtractMoney(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch error: ${a.currency} vs ${b.currency}`);
    }
    const scale = a.scale !== undefined ? a.scale : (a.currency === DEFAULT_CURRENCY_CODE ? 0 : 2);
    return {
      amount: MoneyUtils.round(a.amount - b.amount, scale),
      currency: a.currency,
      scale
    };
  }
}
