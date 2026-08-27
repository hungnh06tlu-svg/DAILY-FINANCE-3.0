/**
 * Daily Finance 3.0 - BudgetEngine
 * Pure domain logic engine for Budgeting operations.
 * Delegating financial arithmetic exclusively to FinancialTruthEngine.
 */

import {
  Budget,
  Transaction,
  BudgetPeriod,
  BudgetScopeType,
  BudgetStatus,
  BudgetStrategy,
  BudgetAlertLevel,
  BudgetProgressResult,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { MoneyUtils } from './CanonicalFinancialModel';

export class BudgetEngine {
  /**
   * Evaluates if a transaction matches the budget's specified scope and is an active confirmed expense.
   */
  static matchesScope(budget: Budget, tx: Transaction): boolean {
    if (!tx || tx.type !== 'expense') return false;
    if (!FinancialTruthEngine.isActiveConfirmedTransaction(tx)) return false;

    const scopeType: BudgetScopeType = budget.scopeType || 'category';

    switch (scopeType) {
      case 'category':
        return (tx.category || '').toLowerCase() === (budget.category || '').toLowerCase();

      case 'multiple_categories':
        if (budget.targetCategories && budget.targetCategories.length > 0) {
          return budget.targetCategories.some(
            (cat) => (cat || '').toLowerCase() === (tx.category || '').toLowerCase()
          );
        }
        return (tx.category || '').toLowerCase() === (budget.category || '').toLowerCase();

      case 'financial_space':
        return budget.spaceId ? tx.spaceId === budget.spaceId : true;

      case 'merchant':
        if (!budget.merchant) return true;
        return (tx.note || '').toLowerCase().includes(budget.merchant.toLowerCase());

      case 'tag':
        if (!budget.tag) return true;
        return (tx.note || '').toLowerCase().includes(budget.tag.toLowerCase());

      case 'payment_method':
        if (!budget.paymentMethod) return true;
        return (tx.walletId || '').toLowerCase().includes(budget.paymentMethod.toLowerCase());

      case 'space_group':
        return true;

      default:
        return (tx.category || '').toLowerCase() === (budget.category || '').toLowerCase();
    }
  }

  /**
   * Calculates remaining days and projected allowance based on period.
   */
  static calculatePeriodMetrics(
    period: BudgetPeriod = 'monthly',
    now: Date = new Date()
  ): { remainingDays: number; totalDaysInPeriod: number; elapsedRatio: number } {
    let remainingDays = 1;
    let totalDaysInPeriod = 30;

    switch (period) {
      case 'daily':
        totalDaysInPeriod = 1;
        remainingDays = 1;
        break;

      case 'weekly':
        totalDaysInPeriod = 7;
        const currentDayOfWeek = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
        remainingDays = Math.max(1, 7 - currentDayOfWeek + 1);
        break;

      case 'monthly':
      default:
        const year = now.getFullYear();
        const month = now.getMonth();
        totalDaysInPeriod = new Date(year, month + 1, 0).getDate();
        remainingDays = Math.max(1, totalDaysInPeriod - now.getDate() + 1);
        break;

      case 'yearly':
        totalDaysInPeriod = 365;
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        remainingDays = Math.max(1, 365 - dayOfYear);
        break;

      case 'custom':
        totalDaysInPeriod = 30;
        remainingDays = 15;
        break;
    }

    const elapsedDays = Math.max(1, totalDaysInPeriod - remainingDays);
    const elapsedRatio = elapsedDays / totalDaysInPeriod;

    return { remainingDays, totalDaysInPeriod, elapsedRatio };
  }

  /**
   * Evaluates complete budget progress using FinancialTruthEngine arithmetic.
   */
  static evaluateProgress(
    budget: Budget,
    transactions: Transaction[] = [],
    language: Language = 'vi',
    now: Date = new Date()
  ): BudgetProgressResult {
    // Delegate financial calculation exclusively to FinancialTruthEngine
    const scopeFilteredTxs = transactions.filter((tx) => this.matchesScope(budget, tx));
    const usage = FinancialTruthEngine.calculateBudgetUsage(budget, scopeFilteredTxs);

    const periodMetrics = this.calculatePeriodMetrics(budget.period, now);
    const used = usage.spent;
    const remaining = Math.max(0, (budget.allocatedAmount || 0) - used);
    const percentage = usage.usagePercent;

    // Forecast: projected spending by end of period based on current run rate
    const forecast = periodMetrics.elapsedRatio > 0
      ? Math.round(used / periodMetrics.elapsedRatio)
      : used;

    // Daily allowance: available remaining funds divided by remaining days in period
    const dailyAllowance = Math.max(0, Math.round(remaining / periodMetrics.remainingDays));

    return {
      used: MoneyUtils.round(used, 0),
      formattedUsed: '',
      remaining: MoneyUtils.round(remaining, 0),
      formattedRemaining: '',
      percentage,
      forecast: MoneyUtils.round(forecast, 0),
      formattedForecast: '',
      remainingDays: periodMetrics.remainingDays,
      dailyAllowance: MoneyUtils.round(dailyAllowance, 0),
      formattedDailyAllowance: ''
    };
  }

  /**
   * Evaluates alert level based on percentage used.
   */
  static evaluateAlertLevel(usagePercent: number, isExceeded: boolean): BudgetAlertLevel {
    if (isExceeded || usagePercent >= 100) return 'exceeded';
    if (usagePercent >= 90) return '90%';
    if (usagePercent >= 75) return '75%';
    if (usagePercent >= 50) return '50%';
    return 'normal';
  }

  /**
   * Determines operational status of budget.
   */
  static determineStatus(
    budget: Budget,
    usagePercent: number,
    isExceeded: boolean
  ): BudgetStatus {
    if (budget.status) return budget.status;
    if (isExceeded) return 'exceeded';
    if (usagePercent >= 100) return 'completed';
    return 'active';
  }

  /**
   * Evaluates budget rules based on strategy.
   */
  static applyStrategy(
    budget: Budget,
    transactions: Transaction[] = []
  ): { allowedAmount: number; carryOver: number; isHardCapExceeded: boolean } {
    const strategy: BudgetStrategy = budget.strategy || 'soft_budget';
    const scopeFilteredTxs = transactions.filter((tx) => this.matchesScope(budget, tx));
    const usage = FinancialTruthEngine.calculateBudgetUsage(budget, scopeFilteredTxs);

    let allowedAmount = budget.allocatedAmount;
    let carryOver = budget.carryOverAmount || 0;
    let isHardCapExceeded = false;

    switch (strategy) {
      case 'hard_budget':
        if (usage.spent > budget.allocatedAmount) {
          isHardCapExceeded = true;
        }
        break;

      case 'rolling_budget':
      case 'carry_over':
        if (usage.spent < budget.allocatedAmount) {
          carryOver = budget.allocatedAmount - usage.spent;
        } else {
          carryOver = 0;
        }
        allowedAmount = budget.allocatedAmount + carryOver;
        break;

      case 'soft_budget':
      default:
        break;
    }

    return { allowedAmount, carryOver, isHardCapExceeded };
  }
}
