/**
 * Daily Finance 2.5 - SavingsViewModel
 * Pure presentation state provider for Savings Engine.
 * Retrieves savings data via Savings Use Cases, producing precomputed,
 * presentation-ready SavingsUiState without UI calculations.
 */

import {
  SavingsGoal,
  SavingsContribution,
  SavingsUiState,
  SavingsUiGoalItem,
  SavingsAlertLevel,
  SavingsWidgetState,
  Language
} from '../types';
import {
  GetSavingsGoalUseCase,
  CreateSavingsGoalUseCase,
  UpdateSavingsGoalUseCase,
  ArchiveSavingsGoalUseCase,
  DeleteSavingsGoalUseCase,
  RecordContributionUseCase
} from '../usecases/SavingsUseCases';
import { SavingsEngine } from '../domain/SavingsEngine';
import { LocalSavingRepository } from '../repositories/implementations';
import { SavingRepository } from '../repositories/contracts';

export class SavingsViewModel {
  private getSavingsGoalUseCase: GetSavingsGoalUseCase;
  private createSavingsGoalUseCase: CreateSavingsGoalUseCase;
  private updateSavingsGoalUseCase: UpdateSavingsGoalUseCase;
  private archiveSavingsGoalUseCase: ArchiveSavingsGoalUseCase;
  private deleteSavingsGoalUseCase: DeleteSavingsGoalUseCase;
  private recordContributionUseCase: RecordContributionUseCase;

  constructor(
    getSavingsGoalUseCase: GetSavingsGoalUseCase,
    createSavingsGoalUseCase: CreateSavingsGoalUseCase,
    updateSavingsGoalUseCase: UpdateSavingsGoalUseCase,
    archiveSavingsGoalUseCase: ArchiveSavingsGoalUseCase,
    deleteSavingsGoalUseCase: DeleteSavingsGoalUseCase,
    recordContributionUseCase: RecordContributionUseCase
  ) {
    if (
      !getSavingsGoalUseCase ||
      !createSavingsGoalUseCase ||
      !updateSavingsGoalUseCase ||
      !archiveSavingsGoalUseCase ||
      !deleteSavingsGoalUseCase ||
      !recordContributionUseCase
    ) {
      throw new Error('[SavingsViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.getSavingsGoalUseCase = getSavingsGoalUseCase;
    this.createSavingsGoalUseCase = createSavingsGoalUseCase;
    this.updateSavingsGoalUseCase = updateSavingsGoalUseCase;
    this.archiveSavingsGoalUseCase = archiveSavingsGoalUseCase;
    this.deleteSavingsGoalUseCase = deleteSavingsGoalUseCase;
    this.recordContributionUseCase = recordContributionUseCase;
  }

  /**
   * Produces complete, precomputed SavingsUiState.
   */
  async getSavingsUiState(
    spaceId?: string,
    contributions: SavingsContribution[] = [],
    language: Language = 'vi'
  ): Promise<SavingsUiState> {
    const rawGoals = await this.getSavingsGoalUseCase.execute(spaceId);

    const allAlerts: { id: string; message: string; level: SavingsAlertLevel; goalId?: string }[] = [];

    const uiGoals: SavingsUiGoalItem[] = rawGoals.map((goal) => {
      const progress = SavingsEngine.evaluateProgress(goal, contributions, language);
      const forecast = SavingsEngine.calculateForecast(goal, contributions, language);
      const milestones = SavingsEngine.evaluateMilestones(goal);
      const goalAlerts = SavingsEngine.evaluateAlerts(goal, progress, forecast, language);
      const policy = SavingsEngine.evaluatePolicy(goal);

      goalAlerts.forEach((alt) => {
        allAlerts.push({ ...alt, goalId: goal.id });
      });

      return {
        goal,
        progress,
        forecast,
        milestones,
        alerts: goalAlerts,
        policy
      };
    });

    const summary = SavingsEngine.calculateSummary(rawGoals, language);
    const statistics = SavingsEngine.calculateStatistics(rawGoals, contributions, language);

    // Insights generation
    const insights: string[] = [];
    if (summary.completedGoalsCount > 0) {
      insights.push(
        language === 'vi'
          ? `Bạn đã hoàn thành ${summary.completedGoalsCount} mục tiêu tiết kiệm!`
          : `You have completed ${summary.completedGoalsCount} savings goals!`
      );
    }
    if (summary.overallPercentage >= 50) {
      insights.push(
        language === 'vi'
          ? `Tổng tiến độ tích lũy đạt ${summary.overallPercentage}% mục tiêu.`
          : `Total accumulated progress reached ${summary.overallPercentage}% of goal.`
      );
    }

    // Extensible Widget States (TASK 11 & TASK 3)
    const widgets: SavingsWidgetState[] = [
      {
        widgetId: 'round_up_savings',
        title: language === 'vi' ? 'Tiết Kiệm Lẻ Tiền (Round-up)' : 'Round-up Savings',
        isEnabled: true,
        precomputedData: { activeGoalsWithRoundUp: rawGoals.filter((g) => g.type === 'round_up').length }
      },
      {
        widgetId: 'auto_save_rules',
        title: language === 'vi' ? 'Tự Động Trích Trả' : 'Auto-Save Rules',
        isEnabled: true,
        precomputedData: { activeAutoSaveGoals: rawGoals.filter((g) => g.type === 'automatic' || g.type === 'recurring').length }
      },
      {
        widgetId: 'emergency_fund_health',
        title: language === 'vi' ? 'Sức Khỏe Quỹ Khẩn Cấp' : 'Emergency Fund Health',
        isEnabled: true,
        precomputedData: { emergencyGoal: rawGoals.find((g) => g.category === 'emergency' || g.type === 'emergency_fund') }
      }
    ];

    // Chart dataset preparation
    const chartData = rawGoals.slice(0, 6).map((g) => ({
      label: g.title,
      value: g.currentAmount,
      date: g.deadline || new Date().toISOString().split('T')[0]
    }));

    return {
      summary,
      statistics,
      goals: uiGoals,
      recentContributions: contributions.slice(0, 10),
      alerts: allAlerts,
      insights,
      widgets,
      chartData,
      isLoading: false,
      error: null
    };
  }

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    return this.createSavingsGoalUseCase.execute(goal);
  }

  async updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal> {
    return this.updateSavingsGoalUseCase.execute(goal);
  }

  async archiveSavingsGoal(goalId: string): Promise<SavingsGoal | null> {
    return this.archiveSavingsGoalUseCase.execute(goalId);
  }

  async deleteSavingsGoal(goalId: string): Promise<boolean> {
    return this.deleteSavingsGoalUseCase.execute(goalId);
  }

  async recordContribution(
    goalId: string,
    amount: number,
    note?: string
  ): Promise<{ updatedGoal: SavingsGoal; contribution: SavingsContribution } | null> {
    const result = await this.recordContributionUseCase.execute(goalId, amount, note);
    return result;
  }
}
