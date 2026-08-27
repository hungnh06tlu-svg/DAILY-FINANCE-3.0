/**
 * Daily Finance 2.5 - BudgetViewModel
 * Pure presentation state provider for Budget Engine.
 * Retrieves budget data via CreateBudgetUseCase/CloseBudgetUseCase and LocalBudgetRepository,
 * producing precomputed, presentation-ready BudgetUiState without UI calculations.
 */

import {
  Budget,
  Transaction,
  Language,
  BudgetPeriod,
  BudgetUiState,
  BudgetUiItem,
  BudgetAlertLevel,
  BudgetWidgetState
} from '../types';
import { CreateBudgetUseCase, CloseBudgetUseCase, GetBudgetsUseCase } from '../usecases/BudgetUseCases';
import { BudgetEngine } from '../domain/BudgetEngine';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { MoneyFormatter } from '../formatters';
import { LocalBudgetRepository } from '../repositories/implementations';
import { BudgetRepository } from '../repositories/contracts';

export class BudgetViewModel {
  private getBudgetsUseCase: GetBudgetsUseCase;
  private createBudgetUseCase: CreateBudgetUseCase;
  private closeBudgetUseCase: CloseBudgetUseCase;

  constructor(
    getBudgetsUseCase: GetBudgetsUseCase,
    createBudgetUseCase: CreateBudgetUseCase,
    closeBudgetUseCase: CloseBudgetUseCase
  ) {
    if (!getBudgetsUseCase || !createBudgetUseCase || !closeBudgetUseCase) {
      throw new Error('[BudgetViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.getBudgetsUseCase = getBudgetsUseCase;
    this.createBudgetUseCase = createBudgetUseCase;
    this.closeBudgetUseCase = closeBudgetUseCase;
  }

  async getBudgetUiState(
    spaceId?: string,
    transactions: Transaction[] = [],
    selectedPeriod: BudgetPeriod = 'monthly',
    language: Language = 'vi'
  ): Promise<BudgetUiState> {
    const rawBudgets = await this.getBudgetsUseCase.execute(spaceId);

    let totalAllocated = 0;
    let totalSpent = 0;
    let activeCount = 0;
    let exceededCount = 0;

    const alerts: { id: string; message: string; level: BudgetAlertLevel }[] = [];

    const uiBudgets: BudgetUiItem[] = rawBudgets.map((b) => {
      // TASK 9: Financial calculations strictly via FinancialTruthEngine & BudgetEngine
      const scopeTxs = transactions.filter((tx) => BudgetEngine.matchesScope(b, tx));
      const usage = FinancialTruthEngine.calculateBudgetUsage(b, scopeTxs);
      const progress = BudgetEngine.evaluateProgress(b, scopeTxs, language);
      const alertLevel = BudgetEngine.evaluateAlertLevel(usage.usagePercent, usage.isExceeded);
      const status = BudgetEngine.determineStatus(b, usage.usagePercent, usage.isExceeded);

      totalAllocated += b.allocatedAmount;
      totalSpent += usage.spent;

      if (status === 'active') activeCount++;
      if (usage.isExceeded || status === 'exceeded') {
        exceededCount++;
        alerts.push({
          id: `alert_${b.id}`,
          message: language === 'vi'
            ? `Ngân sách ${b.category} đã vượt quá giới hạn!`
            : `Budget for ${b.category} has exceeded limit!`,
          level: 'exceeded'
        });
      } else if (usage.isWarning) {
        alerts.push({
          id: `warn_${b.id}`,
          message: language === 'vi'
            ? `Ngân sách ${b.category} sắp đạt ngưỡng cảnh báo (${usage.usagePercent}%).`
            : `Budget for ${b.category} is near warning threshold (${usage.usagePercent}%).`,
          level: alertLevel
        });
      }

      return {
        id: b.id,
        category: b.category,
        allocatedAmount: b.allocatedAmount,
        formattedAllocated: MoneyFormatter.format(b.allocatedAmount, b.currency || 'VND', language),
        spentAmount: usage.spent,
        formattedSpent: MoneyFormatter.format(usage.spent, b.currency || 'VND', language),
        remainingAmount: progress.remaining,
        formattedRemaining: progress.formattedRemaining,
        usagePercent: usage.usagePercent,
        currency: b.currency || 'VND',
        period: b.period || 'monthly',
        status,
        strategy: b.strategy || 'soft_budget',
        scopeType: b.scopeType || 'category',
        alertLevel,
        isWarning: usage.isWarning,
        isExceeded: usage.isExceeded,
        progress
      };
    });

    const totalRemaining = Math.max(0, totalAllocated - totalSpent);
    const overallUsagePercent = totalAllocated > 0
      ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100))
      : 0;

    // TASK 7: Extensible Widget Precomputations
    const widgets: BudgetWidgetState[] = [
      {
        widgetId: 'envelope_system',
        title: language === 'vi' ? 'Ngân Sách Phong Bì' : 'Envelope System',
        isEnabled: true,
        precomputedData: { totalEnvelopes: uiBudgets.length, exceededEnvelopes: exceededCount }
      },
      {
        widgetId: 'hard_cap_rules',
        title: language === 'vi' ? 'Quy Tắc Giới Hạn Cứng' : 'Hard Cap Enforcement',
        isEnabled: true,
        precomputedData: { activeHardCaps: uiBudgets.filter((b) => b.strategy === 'hard_budget').length }
      },
      {
        widgetId: 'rolling_carryover',
        title: language === 'vi' ? 'Chuyển Ngân Sách Sang Tháng Sau' : 'Rolling Carry Over',
        isEnabled: true,
        precomputedData: { totalCarryOver: totalRemaining }
      }
    ];

    return {
      budgets: uiBudgets,
      activeBudgetsCount: activeCount,
      exceededBudgetsCount: exceededCount,
      totalAllocated,
      formattedTotalAllocated: MoneyFormatter.format(totalAllocated, 'VND', language),
      totalSpent,
      formattedTotalSpent: MoneyFormatter.format(totalSpent, 'VND', language),
      totalRemaining,
      formattedTotalRemaining: MoneyFormatter.format(totalRemaining, 'VND', language),
      overallUsagePercent,
      alerts,
      selectedPeriod,
      widgets,
      isLoading: false,
      error: null
    };
  }

  async createBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    return this.createBudgetUseCase.execute(budget);
  }

  async closeBudget(budgetId: string): Promise<boolean> {
    return this.closeBudgetUseCase.execute(budgetId);
  }
}
