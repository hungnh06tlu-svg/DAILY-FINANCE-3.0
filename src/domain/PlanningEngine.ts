/**
 * Daily Finance 3.0 - PlanningEngine
 * Pure Financial Planning & Action Engine
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial truth calculations performed directly in this engine.
 * Consumes FinancialSnapshot, FinancialTimeline, FinancialIntelligence, and FinancialForecast
 * to transform projections into actionable goals, milestones, and actions.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialIntelligence } from './FinancialIntelligence';
import { FinancialForecast } from './FinancialForecast';
import {
  FinancialPlan,
  PlanGoal,
  PlanAction,
  PlanMilestone,
  PlanningScenarioType,
  PlanGoalType
} from './FinancialPlan';

export interface PlanningEngineInputs {
  snapshot: FinancialSnapshot;
  timeline?: FinancialTimeline;
  intelligence?: FinancialIntelligence;
  forecast?: FinancialForecast;
  scenario?: PlanningScenarioType;
  language?: Language;
}

export class PlanningEngine {
  /**
   * Transforms existing domain outputs into an actionable FinancialPlan.
   */
  public static generatePlan(inputs: PlanningEngineInputs): FinancialPlan {
    const { snapshot, intelligence, forecast, scenario = 'current_strategy', language = 'vi' } = inputs;
    const isVi = language === 'vi';

    const goals: PlanGoal[] = [];
    const actions: PlanAction[] = [];

    // Helper to build standard milestones (25%, 50%, 75%, 100%)
    const createStandardMilestones = (goalId: string, targetValue: number, currentValue: number): PlanMilestone[] => {
      const percentages = [25, 50, 75, 100];
      const progressPercent = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;

      return percentages.map(pct => {
        const valAtPct = (targetValue * pct) / 100;
        const isCompleted = progressPercent >= pct;
        return {
          id: `${goalId}_ms_${pct}`,
          goalId,
          title: isVi ? `Cột mốc ${pct}%` : `${pct}% Milestone`,
          targetPercentage: pct,
          targetValue: valAtPct,
          currentProgressPercent: progressPercent,
          isCompleted
        };
      });
    };

    // 1. Goal: Emergency Fund Target
    const efCurrent = snapshot.emergencyFund.currentBalance;
    const efTarget = snapshot.emergencyFund.targetAmount;
    const efProgress = snapshot.emergencyFund.targetAmount > 0
      ? Math.min(100, Math.round((efCurrent / efTarget) * 100))
      : 100;

    const efActions: PlanAction[] = [
      {
        id: 'act_ef_1',
        title: isVi ? 'Trích lập quỹ dự phòng tự động' : 'Automate Emergency Fund Contributions',
        description: isVi
          ? 'Tự động trích 10% thu nhập hàng tháng vào ví tiết kiệm khẩn cấp.'
          : 'Set up automated 10% monthly income transfer to emergency reserve.',
        priority: 'high',
        estimatedImpact: Math.max(0, efTarget - efCurrent),
        estimatedDuration: '3-6 months',
        difficulty: 'easy',
        dependencies: [],
        isCompleted: snapshot.emergencyFund.isSufficient
      }
    ];

    const efGoal: PlanGoal = {
      id: 'goal_emergency_fund',
      type: 'emergency_fund_target',
      title: isVi ? 'Đạt mốc Quỹ dự phòng khẩn cấp' : 'Reach Emergency Reserve Target',
      description: isVi
        ? `Xây dựng quỹ khẩn cấp đủ phủ ${snapshot.emergencyFund.targetMonths} tháng chi tiêu.`
        : `Build emergency fund covering ${snapshot.emergencyFund.targetMonths} months of expenses.`,
      targetAmount: efTarget,
      currentAmount: efCurrent,
      progressPercent: efProgress,
      isCompleted: snapshot.emergencyFund.isSufficient,
      milestones: createStandardMilestones('goal_emergency_fund', efTarget, efCurrent),
      actions: efActions
    };
    goals.push(efGoal);
    actions.push(...efActions);

    // 2. Goal: Reduce Debt (if debt exists)
    if (snapshot.debtSummary.totalDebtOwed > 0) {
      const debtTotal = snapshot.debtSummary.totalDebtOwed;
      const debtPaid = Math.max(0, snapshot.debtSummary.totalDebtOwed - snapshot.debtSummary.netDebt);
      const debtProgress = Math.min(100, Math.round((debtPaid / debtTotal) * 100));

      const debtActions: PlanAction[] = [
        {
          id: 'act_debt_1',
          title: isVi ? 'Thanh toán nợ lãi suất cao' : 'Prioritize High-Interest Debt Payoff',
          description: isVi
            ? 'Tập trung thặng dư để giải quyết khoản nợ có lãi suất cao nhất.'
            : 'Allocate monthly surplus to clear highest-interest debt first.',
          priority: 'urgent',
          estimatedImpact: debtTotal,
          estimatedDuration: '6-12 months',
          difficulty: 'medium',
          dependencies: ['act_ef_1'],
          isCompleted: false
        }
      ];

      const debtGoal: PlanGoal = {
        id: 'goal_reduce_debt',
        type: 'reduce_debt',
        title: isVi ? 'Tối ưu hoá & Trả sạch nợ' : 'Eliminate Outstanding Debt',
        description: isVi
          ? 'Xóa tất cả dư nợ tài chính hiện tại để giải phóng dòng tiền.'
          : 'Clear all active debt obligations to free up cash flow.',
        targetAmount: debtTotal,
        currentAmount: debtPaid,
        progressPercent: debtProgress,
        isCompleted: false,
        milestones: createStandardMilestones('goal_reduce_debt', debtTotal, debtPaid),
        actions: debtActions
      };
      goals.push(debtGoal);
      actions.push(...debtActions);
    }

    // 3. Goal: Reach FIRE Target
    const fireTarget = snapshot.fireProgress.targetNetWorth;
    const fireCurrent = snapshot.fireProgress.currentNetWorth;
    const fireProgress = snapshot.fireProgress.progressPercent;

    const fireActions: PlanAction[] = [
      {
        id: 'act_fire_1',
        title: isVi ? 'Bơm thặng dư vào danh mục tích lũy' : 'Direct Surplus to Investment Portfolio',
        description: isVi
          ? 'Đầu tư định kỳ hàng tháng (DCA) để gia tăng tài sản ròng đạt mục tiêu FIRE.'
          : 'Maintain monthly DCA into wealth-building investments to reach FIRE target.',
        priority: 'medium',
        estimatedImpact: fireTarget,
        estimatedDuration: `${snapshot.fireProgress.yearsToFIRE} years`,
        difficulty: 'hard',
        dependencies: ['act_ef_1'],
        isCompleted: fireProgress >= 100
      }
    ];

    const fireGoal: PlanGoal = {
      id: 'goal_reach_fire',
      type: 'reach_fire',
      title: isVi ? 'Đạt mục tiêu Tự do Tài chính (FIRE)' : 'Achieve Financial Independence (FIRE)',
      description: isVi
        ? `Tích lũy tài sản ròng đạt mốc ${fireTarget.toLocaleString()} ${snapshot.currency}.`
        : `Accumulate net worth target of ${fireTarget} ${snapshot.currency}.`,
      targetAmount: fireTarget,
      currentAmount: fireCurrent,
      progressPercent: fireProgress,
      isCompleted: fireProgress >= 100,
      milestones: createStandardMilestones('goal_reach_fire', fireTarget, fireCurrent),
      actions: fireActions
    };
    goals.push(fireGoal);
    actions.push(...fireActions);

    // 4. Goal: Budget Improvement
    const budgetAllocated = snapshot.budgetSummary.totalAllocated;
    const budgetSpent = snapshot.budgetSummary.totalSpent;
    const budgetProgress = budgetAllocated > 0 ? Math.min(100, Math.round((budgetSpent / budgetAllocated) * 100)) : 100;
    const isBudgetCompliant = snapshot.budgetSummary.overspentBudgetsCount === 0;

    const budgetActions: PlanAction[] = [
      {
        id: 'act_budget_1',
        title: isVi ? 'Kiểm soát các danh mục chi tiêu chính' : 'Control Key Spending Categories',
        description: isVi
          ? 'Giữ chi tiêu các danh mục luôn nằm trong hạn mức đã thiết lập.'
          : 'Keep category spending strictly within allocated limits.',
        priority: 'high',
        estimatedImpact: Math.max(0, budgetSpent - budgetAllocated),
        estimatedDuration: '1 month',
        difficulty: 'easy',
        dependencies: [],
        isCompleted: isBudgetCompliant
      }
    ];

    const budgetGoal: PlanGoal = {
      id: 'goal_budget_improvement',
      type: 'budget_improvement',
      title: isVi ? 'Duy trì kỷ luật ngân sách' : 'Maintain Budget Discipline',
      description: isVi
        ? 'Đảm bảo 100% danh mục không bị chi vượt hạn mức.'
        : 'Ensure 100% of category budgets stay within allocated targets.',
      targetAmount: budgetAllocated,
      currentAmount: Math.min(budgetSpent, budgetAllocated),
      progressPercent: isBudgetCompliant ? 100 : Math.max(0, 100 - (snapshot.budgetSummary.overspentBudgetsCount * 20)),
      isCompleted: isBudgetCompliant,
      milestones: createStandardMilestones('goal_budget_improvement', budgetAllocated, Math.min(budgetSpent, budgetAllocated)),
      actions: budgetActions
    };
    goals.push(budgetGoal);
    actions.push(...budgetActions);

    // Compute Overall Progress Percent
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const activeGoals = goals.length - completedGoals;
    const overallProgressPercent = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progressPercent, 0) / goals.length)
      : 0;

    const plan: FinancialPlan = {
      id: `plan_${snapshot.spaceId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      spaceId: snapshot.spaceId,
      scenario,
      startingSnapshotTimestamp: snapshot.timestamp,
      goals: Object.freeze(goals),
      actions: Object.freeze(actions),
      overallProgressPercent,
      activeGoalsCount: activeGoals,
      completedGoalsCount: completedGoals
    };

    return Object.freeze(plan);
  }
}
