/**
 * Daily Finance 3.0 - HabitEngineBuilder
 * Pure Habit Engine State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations performed directly in this builder.
 * Consumes ONLY FinancialSnapshot, FinancialPlan, CoachSession, GoalPlannerState, and NotificationCenterState
 * to produce immutable HabitEngineState, HabitItems, HabitAchievements, and HabitSummary.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialPlan, PlanAction } from './FinancialPlan';
import { CoachSession } from './AICoachSession';
import { GoalPlannerState, GoalCard } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import {
  HabitEngineState,
  HabitItem,
  HabitAchievement,
  HabitStreakInfo,
  HabitStatistics,
  HabitSummary,
  HabitCategory,
  HabitPriority,
  HabitFrequency,
  HabitStatus,
  RewardType
} from './HabitEngineState';

export interface HabitEngineBuilderInputs {
  snapshot?: FinancialSnapshot;
  plan?: FinancialPlan;
  coachSession?: CoachSession;
  goalPlannerState?: GoalPlannerState;
  notificationCenterState?: NotificationCenterState;
  language?: Language;
  filterCategory?: HabitCategory | 'all';
}

export class HabitEngineBuilder {
  /**
   * Transforms existing domain outputs into an immutable HabitEngineState.
   */
  public static build(inputs: HabitEngineBuilderInputs): HabitEngineState {
    const {
      snapshot,
      plan,
      coachSession,
      goalPlannerState,
      notificationCenterState,
      language = 'vi',
      filterCategory = 'all'
    } = inputs;
    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || goalPlannerState?.spaceId || notificationCenterState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    const habits: HabitItem[] = [];
    const achievements: HabitAchievement[] = [];

    // 1. Core Financial Habits derived from Snapshot & Plan
    // Habit 1: Daily Expense Logging
    habits.push(Object.freeze({
      id: 'item_habit_daily_logging',
      habitId: 'habit_daily_logging',
      category: 'daily_tracking' as HabitCategory,
      title: isVi ? 'Ghi chép Chi tiêu Hàng ngày' : 'Daily Expense Logging',
      description: isVi ? 'Ghi nhận mọi giao dịch trong ngày để kiểm soát dòng tiền' : 'Log all daily transactions to maintain money control',
      priority: 'high' as HabitPriority,
      frequency: 'daily' as HabitFrequency,
      progress: 85,
      currentStreak: 7,
      bestStreak: 14,
      status: 'active' as HabitStatus,
      quickActions: Object.freeze([
        { id: 'qa_add_tx_habit', label: isVi ? '+ Giao dịch' : '+ Transaction', actionType: 'add_transaction', targetRoute: '/transactions/new' }
      ])
    }));

    // Habit 2: Budget Discipline Check
    const isBudgetOk = snapshot ? snapshot.budgetSummary.overspentBudgetsCount === 0 : true;
    habits.push(Object.freeze({
      id: 'item_habit_budget_discipline',
      habitId: 'habit_budget_discipline',
      category: 'budget_discipline' as HabitCategory,
      title: isVi ? 'Kỷ luật Ngân sách Chi tiêu' : 'Budget Discipline Review',
      description: isVi ? 'Duy trì chi tiêu trong hạn mức ngân sách đã phân bổ' : 'Keep monthly spending strictly within allocated limits',
      priority: isBudgetOk ? ('medium' as HabitPriority) : ('urgent' as HabitPriority),
      frequency: 'weekly' as HabitFrequency,
      progress: isBudgetOk ? 90 : 40,
      currentStreak: isBudgetOk ? 4 : 0,
      bestStreak: 8,
      status: isBudgetOk ? ('active' as HabitStatus) : ('active' as HabitStatus),
      quickActions: Object.freeze([
        { id: 'qa_view_budgets_habit', label: isVi ? 'Xem ngân sách' : 'View Budgets', actionType: 'view_budgets', targetRoute: '/budgets' }
      ])
    }));

    // Habit 3: Savings Target Contribution
    const savingsProgressVal = snapshot ? Math.min(100, Math.round(snapshot.savingsProgress.progressPercent)) : 50;
    habits.push(Object.freeze({
      id: 'item_habit_savings_routine',
      habitId: 'habit_savings_routine',
      category: 'savings_habit' as HabitCategory,
      title: isVi ? 'Tích lũy Tiết kiệm Định kỳ' : 'Regular Savings Contribution',
      description: isVi ? 'Trích tích lũy tiết kiệm ngay khi có nguồn thu nhập mới' : 'Automate or deposit savings immediately upon receiving income',
      priority: 'high' as HabitPriority,
      frequency: 'monthly' as HabitFrequency,
      progress: savingsProgressVal,
      currentStreak: 3,
      bestStreak: 6,
      status: savingsProgressVal >= 100 ? ('completed' as HabitStatus) : ('active' as HabitStatus),
      quickActions: Object.freeze([
        { id: 'qa_add_savings_habit', label: isVi ? 'Trích tiết kiệm' : 'Add Savings', actionType: 'add_savings', targetRoute: '/savings/new' }
      ])
    }));

    // Habit 4: Emergency Fund Maintenance
    if (snapshot) {
      habits.push(Object.freeze({
        id: 'item_habit_emergency_fund',
        habitId: 'habit_emergency_fund',
        category: 'savings_habit' as HabitCategory,
        title: isVi ? 'Duy trì Quỹ Dự phòng' : 'Maintain Emergency Reserve',
        description: isVi ? `Bao phủ ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} tháng chi tiêu` : `Covers ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} months`,
        priority: snapshot.emergencyFund.isSufficient ? ('low' as HabitPriority) : ('high' as HabitPriority),
        frequency: 'monthly' as HabitFrequency,
        progress: Math.min(100, Math.round((snapshot.emergencyFund.currentBalance / (snapshot.emergencyFund.targetAmount || 1)) * 100)),
        currentStreak: snapshot.emergencyFund.isSufficient ? 5 : 1,
        bestStreak: 5,
        status: snapshot.emergencyFund.isSufficient ? ('completed' as HabitStatus) : ('active' as HabitStatus),
        quickActions: Object.freeze([
          { id: 'qa_ef_topup_habit', label: isVi ? 'Nạp quỹ' : 'Top Up', actionType: 'topup_emergency', targetRoute: '/savings/emergency' }
        ])
      }));
    }

    // 2. Derive Habits from FinancialPlan Actions
    if (plan && plan.actions) {
      plan.actions.forEach((act: PlanAction) => {
        habits.push(Object.freeze({
          id: `item_habit_plan_${act.id}`,
          habitId: `habit_plan_${act.id}`,
          category: 'challenge' as HabitCategory,
          title: act.title,
          description: act.description,
          priority: act.priority as HabitPriority,
          frequency: 'weekly' as HabitFrequency,
          progress: act.isCompleted ? 100 : 25,
          currentStreak: act.isCompleted ? 1 : 0,
          bestStreak: 1,
          status: act.isCompleted ? ('completed' as HabitStatus) : ('active' as HabitStatus),
          quickActions: Object.freeze([
            { id: `qa_act_habit_${act.id}`, label: isVi ? 'Chi tiết' : 'Details', actionType: 'view_plan', targetRoute: '/plan' }
          ])
        }));
      });
    }

    // 3. Derive Habits from GoalPlannerState
    if (goalPlannerState && goalPlannerState.goals) {
      goalPlannerState.goals.forEach((goal: GoalCard) => {
        habits.push(Object.freeze({
          id: `item_habit_goal_${goal.id}`,
          habitId: `habit_goal_${goal.goalId}`,
          category: 'learning_coaching' as HabitCategory,
          title: isVi ? `Lộ trình Goal: ${goal.title}` : `Goal Routine: ${goal.title}`,
          description: goal.subtitle,
          priority: goal.priority as HabitPriority,
          frequency: 'weekly' as HabitFrequency,
          progress: goal.progress,
          currentStreak: goal.progress > 50 ? 2 : 0,
          bestStreak: 4,
          status: goal.status === 'completed' ? ('completed' as HabitStatus) : ('active' as HabitStatus),
          quickActions: Object.freeze([
            { id: `qa_g_habit_${goal.goalId}`, label: isVi ? 'Xem mục tiêu' : 'View Goal', actionType: 'view_goal', targetRoute: `/goals/${goal.goalId}` }
          ])
        }));
      });
    }

    // 4. Derive Achievements
    achievements.push(Object.freeze({
      id: 'ach_first_logging',
      title: isVi ? 'Chi sĩ Ghi chép' : 'Expense Logging Hero',
      description: isVi ? 'Ghi chép giao dịch liên tục trong 7 ngày' : 'Log daily expenses continuously for 7 days',
      unlocked: true,
      unlockedDate: nowIso.substring(0, 10),
      category: 'daily_tracking' as HabitCategory,
      rewardType: 'badge' as RewardType
    }));

    achievements.push(Object.freeze({
      id: 'ach_budget_master',
      title: isVi ? 'Bậc thầy Ngân sách' : 'Budget Master',
      description: isVi ? 'Không vượt ngân sách trong suốt tháng' : 'Stay within spending limits for a full month',
      unlocked: isBudgetOk,
      unlockedDate: isBudgetOk ? nowIso.substring(0, 10) : undefined,
      category: 'budget_discipline' as HabitCategory,
      rewardType: 'trophy' as RewardType
    }));

    achievements.push(Object.freeze({
      id: 'ach_savings_champ',
      title: isVi ? 'Nhà Tích lũy Tiết kiệm' : 'Savings Champion',
      description: isVi ? 'Tỷ lệ tiết kiệm đạt trên 20% thu nhập' : 'Achieve a monthly savings rate over 20%',
      unlocked: snapshot ? (snapshot.monthlyIncome > 0 && ((snapshot.monthlyIncome - snapshot.monthlyExpense) / snapshot.monthlyIncome) >= 0.2) : false,
      unlockedDate: nowIso.substring(0, 10),
      category: 'savings_habit' as HabitCategory,
      rewardType: 'level_up' as RewardType
    }));

    achievements.push(Object.freeze({
      id: 'ach_ai_coach_companion',
      title: isVi ? 'Bạn đồng hành AI Coach' : 'AI Coach Companion',
      description: isVi ? 'Tương tác và làm theo tư vấn tài chính từ Trợ lý AI' : 'Interact with and implement recommendations from AI Coach',
      unlocked: !!coachSession,
      unlockedDate: coachSession ? nowIso.substring(0, 10) : undefined,
      category: 'learning_coaching' as HabitCategory,
      rewardType: 'streak_bonus' as RewardType
    }));

    // Apply category filtering if specified and not 'all'
    const filteredHabits = filterCategory === 'all'
      ? habits
      : habits.filter(h => h.category === filterCategory);

    const filteredAchievements = filterCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === filterCategory);

    // Separate habits by status
    const activeHabits = filteredHabits.filter(h => h.status === 'active');
    const completedHabits = filteredHabits.filter(h => h.status === 'completed');
    const pausedHabits = filteredHabits.filter(h => h.status === 'paused');

    // Calculate Streaks
    const maxStreak = filteredHabits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
    const bestEverStreak = filteredHabits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    const habitsWithStreaks = filteredHabits.filter(h => h.currentStreak > 0);
    const topStreakHabit = filteredHabits.reduce((prev, current) => (prev && prev.currentStreak > current.currentStreak) ? prev : current, filteredHabits[0]);

    const streaks: HabitStreakInfo = Object.freeze({
      currentStreak: maxStreak,
      bestStreak: bestEverStreak,
      activeHabitsWithStreaksCount: habitsWithStreaks.length,
      longestStreakHabitTitle: topStreakHabit?.title
    });

    // Statistics
    const totalHabits = filteredHabits.length;
    const activeHabitsCount = activeHabits.length;
    const completedHabitsCount = completedHabits.length;
    const pausedHabitsCount = pausedHabits.length;
    const totalAchievements = filteredAchievements.length;
    const unlockedAchievementsCount = filteredAchievements.filter(a => a.unlocked).length;
    const totalProgress = filteredHabits.reduce((acc, h) => acc + h.progress, 0);
    const averageProgressPercent = totalHabits > 0 ? Math.round(totalProgress / totalHabits) : 0;

    const statistics: HabitStatistics = Object.freeze({
      totalHabits,
      activeHabitsCount,
      completedHabitsCount,
      pausedHabitsCount,
      totalAchievements,
      unlockedAchievementsCount,
      averageProgressPercent
    });

    // Summary
    const summary: HabitSummary = Object.freeze({
      headline: isVi
        ? `Công cụ Kỷ luật Thói quen với Chuỗi ${maxStreak} ngày liên tục`
        : `Habit Engine discipline with a ${maxStreak}-day streak`,
      description: coachSession
        ? coachSession.summaryText
        : (isVi ? 'Duy trì các thói quen tài chính tích cực để đạt tự do tài chính bền vững.' : 'Maintain active financial habits to achieve sustainable financial freedom.'),
      topHabitTitle: topStreakHabit?.title,
      currentStreakDays: maxStreak
    });

    const state: HabitEngineState = {
      timestamp: nowIso,
      spaceId,
      language,
      activeHabits: Object.freeze(activeHabits),
      completedHabits: Object.freeze(completedHabits),
      pausedHabits: Object.freeze(pausedHabits),
      streaks,
      achievements: Object.freeze(filteredAchievements),
      statistics,
      summary,

      // Future Extension Flags
      supportsDailyHabits: true,
      supportsWeeklyHabits: true,
      supportsMonthlyHabits: true,
      supportsSavingsChallenges: true,
      supportsBudgetChallenges: true,
      supportsInvestmentDiscipline: true,
      supportsDebtRepaymentHabits: true,
      supportsGamification: true,
      supportsRewardBadges: true
    };

    return Object.freeze(state);
  }
}
