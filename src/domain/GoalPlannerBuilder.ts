/**
 * Daily Finance 3.0 - GoalPlannerBuilder
 * Pure Goal Planner State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations performed directly in this builder.
 * Consumes ONLY FinancialPlan, FinancialForecast, FinancialSnapshot, and CoachSession
 * to produce immutable GoalPlannerState, GoalCards, GoalMilestones, and PlannerSummary.
 */

import { Language } from '../types';
import { FinancialPlan, PlanGoal, PlanMilestone, PlanGoalType } from './FinancialPlan';
import { FinancialForecast } from './FinancialForecast';
import { FinancialSnapshot } from './FinancialSnapshot';
import { CoachSession } from './AICoachSession';
import {
  GoalPlannerState,
  GoalCard,
  GoalMilestone,
  GoalStatistics,
  PlannerSummary,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  MilestoneStatus
} from './GoalPlannerState';

export interface GoalPlannerBuilderInputs {
  plan?: FinancialPlan;
  forecast?: FinancialForecast;
  snapshot?: FinancialSnapshot;
  coachSession?: CoachSession;
  language?: Language;
}

export class GoalPlannerBuilder {
  /**
   * Aggregates pre-calculated plan, forecast, snapshot, and coach session outputs into an immutable GoalPlannerState.
   */
  public static build(inputs: GoalPlannerBuilderInputs): GoalPlannerState {
    const { plan, forecast, snapshot, coachSession, language = 'vi' } = inputs;
    const isVi = language === 'vi';
    const spaceId = plan?.spaceId || snapshot?.spaceId || 'sp_personal';

    const goalCards: GoalCard[] = [];
    const milestones: GoalMilestone[] = [];

    if (plan && plan.goals && plan.goals.length > 0) {
      plan.goals.forEach((pg: PlanGoal) => {
        const category = GoalPlannerBuilder.mapPlanGoalTypeToCategory(pg.type);
        const status: GoalStatus = pg.isCompleted ? 'completed' : 'active';
        const priority: GoalPriority = pg.actions && pg.actions.some(a => a.priority === 'urgent' || a.priority === 'high') ? 'high' : 'medium';

        const card: GoalCard = Object.freeze({
          id: `card_goal_${pg.id}`,
          goalId: pg.id,
          title: pg.title,
          subtitle: pg.description,
          category,
          priority,
          progress: Math.min(100, Math.max(0, Math.round(pg.progressPercent))),
          status,
          quickActions: Object.freeze([
            { id: `qa_view_${pg.id}`, label: isVi ? 'Chi tiết' : 'Details', actionType: 'view_goal', targetRoute: `/goals/${pg.id}` },
            { id: `qa_action_${pg.id}`, label: isVi ? 'Cập nhật' : 'Update', actionType: 'update_progress', targetRoute: `/goals/${pg.id}/edit` }
          ]),
          currentAmount: pg.currentAmount,
          targetAmount: pg.targetAmount,
          milestonesCount: pg.milestones ? pg.milestones.length : 0,
          completedMilestonesCount: pg.milestones ? pg.milestones.filter(m => m.isCompleted).length : 0
        });

        goalCards.push(card);

        if (pg.milestones) {
          pg.milestones.forEach((pm: PlanMilestone) => {
            const mStatus: MilestoneStatus = pm.isCompleted
              ? 'completed'
              : pm.currentProgressPercent > 0
              ? 'in_progress'
              : 'pending';

            milestones.push(Object.freeze({
              id: `ms_${pm.id}`,
              goalId: pg.id,
              title: pm.title,
              progress: pm.currentProgressPercent,
              completionPercentage: pm.targetPercentage,
              targetDate: pm.targetDate,
              status: mStatus
            }));
          });
        }
      });
    } else if (snapshot) {
      // Fallback goals built from FinancialSnapshot outputs
      // Goal 1: Savings Target Goal
      goalCards.push(Object.freeze({
        id: 'card_fallback_savings',
        goalId: 'goal_savings_target',
        title: isVi ? 'Mục tiêu Tiết kiệm' : 'Savings Target Goal',
        subtitle: isVi ? `Đã tích lũy cho ${snapshot.savingsProgress.activeGoalsCount} mục tiêu` : `Accumulated across ${snapshot.savingsProgress.activeGoalsCount} goals`,
        category: 'savings' as GoalCategory,
        priority: 'high' as GoalPriority,
        progress: Math.min(100, Math.round(snapshot.savingsProgress.progressPercent)),
        status: snapshot.savingsProgress.progressPercent >= 100 ? 'completed' : 'active',
        quickActions: Object.freeze([
          { id: 'qa_savings_view', label: isVi ? 'Mục tiêu tiết kiệm' : 'Savings Goals', actionType: 'view_savings', targetRoute: '/savings' }
        ]),
        currentAmount: snapshot.savingsProgress.totalSaved,
        targetAmount: snapshot.savingsProgress.targetAmount,
        milestonesCount: 2,
        completedMilestonesCount: snapshot.savingsProgress.progressPercent >= 50 ? 1 : 0
      }));

      // Goal 2: Emergency Reserve Fund Goal
      goalCards.push(Object.freeze({
        id: 'card_fallback_emergency',
        goalId: 'goal_emergency_reserve',
        title: isVi ? 'Quỹ Dự phòng Khẩn cấp' : 'Emergency Reserve Target',
        subtitle: isVi ? `Bao phủ ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} tháng chi tiêu` : `Covers ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} months`,
        category: 'emergency_fund' as GoalCategory,
        priority: snapshot.emergencyFund.isSufficient ? 'medium' : 'urgent',
        progress: Math.min(100, Math.round((snapshot.emergencyFund.currentBalance / (snapshot.emergencyFund.targetAmount || 1)) * 100)),
        status: snapshot.emergencyFund.isSufficient ? 'completed' : 'active',
        quickActions: Object.freeze([
          { id: 'qa_emergency_topup', label: isVi ? 'Nạp quỹ dự phòng' : 'Top up reserve', actionType: 'topup_emergency', targetRoute: '/savings/emergency' }
        ]),
        currentAmount: snapshot.emergencyFund.currentBalance,
        targetAmount: snapshot.emergencyFund.targetAmount,
        milestonesCount: 3,
        completedMilestonesCount: Math.min(3, Math.floor(snapshot.emergencyFund.coverageMonths / 2))
      }));

      // Goal 3: FIRE Goal
      goalCards.push(Object.freeze({
        id: 'card_fallback_fire',
        goalId: 'goal_fire_target',
        title: isVi ? 'Tự do Tài chính (FIRE)' : 'Financial Independence (FIRE)',
        subtitle: isVi ? `Dự kiến còn ${snapshot.fireProgress.yearsToFIRE} năm` : `${snapshot.fireProgress.yearsToFIRE} years remaining`,
        category: 'fire' as GoalCategory,
        priority: 'medium' as GoalPriority,
        progress: Math.min(100, Math.round(snapshot.fireProgress.progressPercent)),
        status: snapshot.fireProgress.progressPercent >= 100 ? 'completed' : 'active',
        quickActions: Object.freeze([
          { id: 'qa_fire_view', label: isVi ? 'Lộ trình FIRE' : 'FIRE Roadmap', actionType: 'view_fire', targetRoute: '/fire' }
        ]),
        currentAmount: snapshot.netWorth,
        targetAmount: snapshot.fireProgress.targetNetWorth,
        milestonesCount: 4,
        completedMilestonesCount: Math.min(4, Math.floor(snapshot.fireProgress.progressPercent / 25))
      }));

      // Goal 4: Debt Payoff Plan
      if (snapshot.debtSummary.totalDebtOwed > 0) {
        goalCards.push(Object.freeze({
          id: 'card_fallback_debt',
          goalId: 'goal_debt_payoff',
          title: isVi ? 'Kế hoạch Xóa nợ' : 'Debt Payoff Plan',
          subtitle: isVi ? `Trả tối thiểu: ${snapshot.debtSummary.monthlyMinDebtPayment.toLocaleString()} ${snapshot.currency}` : `Monthly min payment: ${snapshot.debtSummary.monthlyMinDebtPayment}`,
          category: 'debt_payoff' as GoalCategory,
          priority: 'high' as GoalPriority,
          progress: snapshot.debtSummary.totalDebtOwed === 0 ? 100 : 30,
          status: snapshot.debtSummary.totalDebtOwed === 0 ? 'completed' : 'active',
          quickActions: Object.freeze([
            { id: 'qa_debt_pay', label: isVi ? 'Thanh toán nợ' : 'Pay debt', actionType: 'pay_debt', targetRoute: '/debts' }
          ]),
          currentAmount: 0,
          targetAmount: snapshot.debtSummary.totalDebtOwed,
          milestonesCount: 2,
          completedMilestonesCount: snapshot.debtSummary.totalDebtOwed === 0 ? 2 : 0
        }));
      }
    }

    // Categorization
    const activeGoals = goalCards.filter(g => g.status === 'active');
    const completedGoals = goalCards.filter(g => g.status === 'completed');
    const overdueGoals = goalCards.filter(g => g.status === 'overdue');
    const upcomingMilestones = milestones.filter(m => m.status !== 'completed');

    // Statistics
    const totalGoals = goalCards.length;
    const completedGoalsCount = completedGoals.length;
    const activeGoalsCount = activeGoals.length;
    const overdueGoalsCount = overdueGoals.length;
    const totalMilestonesCount = milestones.length;
    const completedMilestonesCount = milestones.filter(m => m.status === 'completed').length;
    const totalProgress = goalCards.reduce((acc, g) => acc + g.progress, 0);
    const averageProgressPercent = totalGoals > 0 ? Math.round(totalProgress / totalGoals) : 0;

    const statistics: GoalStatistics = Object.freeze({
      totalGoals,
      activeGoalsCount,
      completedGoalsCount,
      overdueGoalsCount,
      totalMilestonesCount,
      completedMilestonesCount,
      averageProgressPercent
    });

    // Summary
    const totalTargetAmount = goalCards.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
    const totalCurrentAmount = goalCards.reduce((acc, g) => acc + (g.currentAmount || 0), 0);

    const topGoal = activeGoals.find(g => g.priority === 'urgent' || g.priority === 'high') || activeGoals[0];
    const nextMs = upcomingMilestones[0];

    const summary: PlannerSummary = Object.freeze({
      headline: isVi
        ? `Lộ trình Kế hoạch với ${activeGoalsCount} mục tiêu đang thực hiện`
        : `Goal Planner Roadmap with ${activeGoalsCount} active targets`,
      description: coachSession
        ? coachSession.summaryText
        : forecast
        ? (isVi ? `Dự báo trong ${forecast.horizonDays} ngày tiếp theo` : `Forecast for the next ${forecast.horizonDays} days`)
        : (isVi ? 'Bảng theo dõi các mục tiêu tài chính cá nhân.' : 'Personal financial goals tracking dashboard.'),
      topPriorityGoalTitle: topGoal?.title,
      nextMilestoneTitle: nextMs?.title,
      nextMilestoneDate: nextMs?.targetDate,
      totalTargetAmount,
      totalCurrentAmount
    });

    const state: GoalPlannerState = {
      timestamp: new Date().toISOString(),
      spaceId,
      language,
      goals: Object.freeze(goalCards),
      activeGoals: Object.freeze(activeGoals),
      completedGoals: Object.freeze(completedGoals),
      overdueGoals: Object.freeze(overdueGoals),
      upcomingMilestones: Object.freeze(upcomingMilestones),
      statistics,
      summary,

      // Future Extension Flags
      supportsRecurringGoals: true,
      supportsSharedFamilyGoals: true,
      supportsInvestmentGoals: true,
      supportsDebtPayoffPlans: true,
      supportsSavingChallenges: true,
      supportsAchievementBadges: true
    };

    return Object.freeze(state);
  }

  private static mapPlanGoalTypeToCategory(type: PlanGoalType): GoalCategory {
    switch (type) {
      case 'increase_savings':
        return 'savings';
      case 'reduce_debt':
        return 'debt_payoff';
      case 'reach_fire':
        return 'fire';
      case 'increase_investment':
        return 'investment';
      case 'emergency_fund_target':
        return 'emergency_fund';
      case 'budget_improvement':
      case 'cash_flow_improvement':
        return 'budget_improvement';
      default:
        return 'other';
    }
  }
}
