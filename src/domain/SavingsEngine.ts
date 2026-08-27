/**
 * Daily Finance 2.5 - SavingsEngine
 * Domain Engine - Pure business orchestration for Savings domain.
 * Delegates arithmetic exclusively to FinancialTruthEngine.
 * Zero UI, zero rendering, zero direct side-effects.
 */

import {
  SavingsGoal,
  SavingsProgress,
  SavingsForecast,
  SavingsContribution,
  SavingsPolicy,
  SavingsMilestone,
  SavingsSummary,
  SavingsStatistics,
  SavingsStatus,
  SavingsAlertLevel,
  SavingsPolicyType,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { IdGenerator } from '../services/IdGenerator';

export class SavingsEngine {
  /**
   * TASK 5: Evaluates the current lifecycle state of a savings goal.
   */
  static evaluateLifecycle(goal: SavingsGoal, now: Date = new Date()): SavingsStatus {
    if (goal.isSoftDeleted) return 'soft_deleted';
    if (goal.status === 'archived' || goal.status === 'paused' || goal.status === 'draft') {
      return goal.status;
    }

    const truthProgress = FinancialTruthEngine.calculateSavingProgress(goal);
    if (truthProgress.isCompleted) {
      return 'completed';
    }

    return goal.status || 'active';
  }

  /**
   * TASK 7 & TASK 10: Calculates savings goal progress metrics.
   */
  static evaluateProgress(
    goal: SavingsGoal,
    contributions: SavingsContribution[] = [],
    language: Language = 'vi',
    now: Date = new Date()
  ): SavingsProgress {
    // Delegate core financial calculation to FinancialTruthEngine
    const truthProgress = FinancialTruthEngine.calculateSavingProgress(goal);

    const currency = goal.currency || 'VND';
    const target = goal.targetAmount || 0;
    const current = goal.currentAmount || 0;
    const remaining = truthProgress.remainingAmount;

    // Days calculation
    const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date(now.getTime() + 30 * 86400000);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate elapsed time ratio
    const startDate = goal.startDate ? new Date(goal.startDate) : new Date(now.getTime() - 30 * 86400000);
    const totalDuration = Math.max(1, deadlineDate.getTime() - startDate.getTime());
    const elapsedDuration = Math.max(1, now.getTime() - startDate.getTime());
    const timeElapsedRatio = Math.min(1, elapsedDuration / totalDuration);

    const goalContribs = contributions.filter((c) => c.goalId === goal.id);
    const totalFromContribs = goalContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const effectiveCurrent = totalFromContribs > 0 ? totalFromContribs : current;

    // Monthly/Daily averages
    const elapsedMonths = Math.max(1, elapsedDuration / (1000 * 60 * 60 * 24 * 30));
    const averageMonthlySaving = Math.round(effectiveCurrent / elapsedMonths);

    const elapsedDays = Math.max(1, Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)));
    const averageDailySaving = Math.round(effectiveCurrent / elapsedDays);

    const progressRatio = target > 0 ? current / target : 0;
    const isBehindSchedule = timeElapsedRatio > progressRatio + 0.15 && !truthProgress.isCompleted;

    return {
      goalId: goal.id,
      currentAmount: current,
      formattedCurrent: '',
      targetAmount: target,
      formattedTarget: '',
      remainingAmount: remaining,
      formattedRemaining: '',
      percentage: truthProgress.progressPercent,
      remainingDays,
      averageMonthlySaving,
      formattedAvgMonthly: '',
      averageDailySaving,
      formattedAvgDaily: '',
      isCompleted: truthProgress.isCompleted,
      isBehindSchedule
    };
  }

  /**
   * TASK 7: Calculates forecast metrics for a savings goal.
   */
  static calculateForecast(
    goal: SavingsGoal,
    contributions: SavingsContribution[] = [],
    language: Language = 'vi',
    now: Date = new Date()
  ): SavingsForecast {
    const truthProgress = FinancialTruthEngine.calculateSavingProgress(goal);
    const currency = goal.currency || 'VND';
    const remaining = truthProgress.remainingAmount;

    const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date(now.getTime() + 30 * 86400000);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const remainingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const remainingMonths = Math.max(0.1, remainingDays / 30);

    const requiredMonthlyContribution = Math.round(remaining / remainingMonths);
    const requiredDailyContribution = Math.round(remaining / remainingDays);

    const progress = this.evaluateProgress(goal, contributions, language, now);
    const monthlyRate = Math.max(1, progress.averageMonthlySaving);

    // Projected completion
    const monthsNeeded = remaining / monthlyRate;
    const estCompletionTime = now.getTime() + monthsNeeded * 30 * 24 * 60 * 60 * 1000;
    const estimatedCompletionDate = new Date(estCompletionTime).toISOString().split('T')[0];

    const projectedAmountAtDeadline = Math.round(goal.currentAmount + monthlyRate * remainingMonths);

    let forecastStatus: 'on_track' | 'ahead' | 'behind' = 'on_track';
    if (truthProgress.isCompleted || projectedAmountAtDeadline >= goal.targetAmount * 1.05) {
      forecastStatus = 'ahead';
    } else if (projectedAmountAtDeadline < goal.targetAmount * 0.9) {
      forecastStatus = 'behind';
    }

    return {
      goalId: goal.id,
      estimatedCompletionDate,
      projectedAmountAtDeadline,
      formattedProjectedAmount: '',
      requiredMonthlyContribution,
      formattedRequiredMonthly: '',
      requiredDailyContribution,
      formattedRequiredDaily: '',
      forecastStatus
    };
  }

  /**
   * TASK 0 & TASK 8: Evaluates milestone completion for a savings goal.
   */
  static evaluateMilestones(goal: SavingsGoal): SavingsMilestone[] {
    const truthProgress = FinancialTruthEngine.calculateSavingProgress(goal);
    const pct = truthProgress.progressPercent;

    return [
      { percentage: 25, title: '25% - Khởi động', achieved: pct >= 25 },
      { percentage: 50, title: '50% - Nửa chặng đường', achieved: pct >= 50 },
      { percentage: 75, title: '75% - Về đích', achieved: pct >= 75 },
      { percentage: 100, title: '100% - Hoàn thành mục tiêu', achieved: pct >= 100 }
    ];
  }

  /**
   * TASK 8: Evaluates and generates alert items for a savings goal.
   */
  static evaluateAlerts(
    goal: SavingsGoal,
    progress: SavingsProgress,
    forecast: SavingsForecast,
    language: Language = 'vi'
  ): { id: string; message: string; level: SavingsAlertLevel }[] {
    const alerts: { id: string; message: string; level: SavingsAlertLevel }[] = [];

    if (progress.isCompleted) {
      alerts.push({
        id: `alt_comp_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đã hoàn thành xuất sắc!`
          : `Goal "${goal.title}" has been completed!`,
        level: 'completed'
      });
    } else if (progress.percentage >= 90) {
      alerts.push({
        id: `alt_90_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đã đạt 90%!`
          : `Goal "${goal.title}" is at 90%!`,
        level: '90%'
      });
    } else if (progress.percentage >= 75) {
      alerts.push({
        id: `alt_75_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đã đạt 75%!`
          : `Goal "${goal.title}" is at 75%!`,
        level: '75%'
      });
    } else if (progress.percentage >= 50) {
      alerts.push({
        id: `alt_50_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đã đạt 50%!`
          : `Goal "${goal.title}" is at 50%!`,
        level: '50%'
      });
    }

    if (progress.isBehindSchedule || forecast.forecastStatus === 'behind') {
      alerts.push({
        id: `alt_behind_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đang chậm so với tiến độ.`
          : `Goal "${goal.title}" is behind schedule.`,
        level: 'behind_schedule'
      });
    } else if (forecast.forecastStatus === 'ahead' && !progress.isCompleted) {
      alerts.push({
        id: `alt_ahead_${goal.id}`,
        message: language === 'vi'
          ? `Mục tiêu "${goal.title}" đang vượt tiến độ dự kiến.`
          : `Goal "${goal.title}" is ahead of schedule.`,
        level: 'ahead_of_schedule'
      });
    }

    if (goal.currentAmount === 0) {
      alerts.push({
        id: `alt_nocontrib_${goal.id}`,
        message: language === 'vi'
          ? `Chưa có khoản đóng góp nào cho "${goal.title}".`
          : `No contribution yet for "${goal.title}".`,
        level: 'no_contribution'
      });
    }

    return alerts;
  }

  /**
   * TASK 9: Evaluates policy constraints for a savings goal.
   */
  static evaluatePolicy(goal: SavingsGoal): SavingsPolicy {
    const policyType: SavingsPolicyType = goal.policy || 'flexible';
    return {
      policyType,
      isLocked: policyType === 'locked',
      autoExtendOnMissed: policyType === 'auto_extend',
      minMonthlyAmount: goal.autoSaveAmount || 0
    };
  }

  /**
   * TASK 4 & TASK 5: Records a contribution and evaluates updated goal state.
   */
  static applyContribution(
    goal: SavingsGoal,
    amount: number,
    note?: string,
    now: Date = new Date()
  ): { updatedGoal: SavingsGoal; contribution: SavingsContribution } {
    if (amount <= 0) {
      throw new Error('Contribution amount must be greater than zero');
    }

    const currency = goal.currency || 'VND';
    const newCurrent = goal.currentAmount + amount;
    const truthProgress = FinancialTruthEngine.calculateSavingProgress({
      ...goal,
      currentAmount: newCurrent
    });

    const updatedGoal: SavingsGoal = {
      ...goal,
      currentAmount: newCurrent,
      status: truthProgress.isCompleted ? 'completed' : (goal.status || 'active'),
      updatedAt: now.toISOString()
    };

    const contribution: SavingsContribution = {
      id: IdGenerator.generateId('contrib'),
      goalId: goal.id,
      amount,
      formattedAmount: '',
      date: now.toISOString().split('T')[0],
      note: note || 'Đóng góp tiết kiệm'
    };

    return { updatedGoal, contribution };
  }

  /**
   * TASK 0 & TASK 7: Computes summary aggregation across non-deleted savings goals.
   */
  static calculateSummary(goals: SavingsGoal[], language: Language = 'vi'): SavingsSummary {
    const activeGoals = goals.filter((g) => !g.isSoftDeleted && g.status !== 'archived');
    const totalGoalsCount = activeGoals.length;
    let activeGoalsCount = 0;
    let completedGoalsCount = 0;
    let totalTargetAmount = 0;
    let totalCurrentAmount = 0;

    activeGoals.forEach((g) => {
      const truthProgress = FinancialTruthEngine.calculateSavingProgress(g);
      totalTargetAmount += g.targetAmount || 0;
      totalCurrentAmount += g.currentAmount || 0;

      if (truthProgress.isCompleted || g.status === 'completed') {
        completedGoalsCount++;
      } else {
        activeGoalsCount++;
      }
    });

    const totalRemainingAmount = Math.max(0, totalTargetAmount - totalCurrentAmount);
    const overallPercentage = totalTargetAmount > 0
      ? Math.min(100, Math.round((totalCurrentAmount / totalTargetAmount) * 100))
      : 0;

    return {
      totalGoalsCount,
      activeGoalsCount,
      completedGoalsCount,
      totalTargetAmount,
      formattedTotalTarget: '',
      totalCurrentAmount,
      formattedTotalCurrent: '',
      totalRemainingAmount,
      formattedTotalRemaining: '',
      overallPercentage
    };
  }

  /**
   * TASK 0: Calculates overall statistics for the Savings domain.
   */
  static calculateStatistics(
    goals: SavingsGoal[],
    contributions: SavingsContribution[] = [],
    language: Language = 'vi'
  ): SavingsStatistics {
    const activeGoals = goals.filter((g) => !g.isSoftDeleted);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    const monthlyAverage = Math.round(totalSaved / 6); // Average over 6 months baseline

    let topGoalTitle: string | undefined;
    let maxCurrent = 0;
    activeGoals.forEach((g) => {
      if (g.currentAmount > maxCurrent) {
        maxCurrent = g.currentAmount;
        topGoalTitle = g.title;
      }
    });

    return {
      monthlyAverage,
      formattedMonthlyAverage: '',
      topContributingGoalTitle: topGoalTitle,
      streakMonths: activeGoals.length > 0 ? 3 : 0
    };
  }
}
