/**
 * Daily Finance 3.0 - HabitEngineState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-004 Habit Engine Architecture.
 */

export type HabitCategory =
  | 'daily_tracking'
  | 'budget_discipline'
  | 'savings_habit'
  | 'debt_repayment'
  | 'investment_routine'
  | 'learning_coaching'
  | 'challenge'
  | 'other';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type HabitPriority = 'low' | 'medium' | 'high' | 'urgent';
export type HabitStatus = 'active' | 'completed' | 'paused';
export type RewardType = 'badge' | 'points' | 'streak_bonus' | 'trophy' | 'level_up';

export interface HabitQuickAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: string;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface HabitItem {
  readonly id: string;
  readonly habitId: string;
  readonly category: HabitCategory;
  readonly title: string;
  readonly description: string;
  readonly priority: HabitPriority;
  readonly frequency: HabitFrequency;
  readonly progress: number; // 0..100
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly status: HabitStatus;
  readonly quickActions: ReadonlyArray<HabitQuickAction>;
}

export interface HabitAchievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly unlockedDate?: string;
  readonly category: HabitCategory;
  readonly rewardType: RewardType;
}

export interface HabitStreakInfo {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly activeHabitsWithStreaksCount: number;
  readonly longestStreakHabitTitle?: string;
}

export interface HabitStatistics {
  readonly totalHabits: number;
  readonly activeHabitsCount: number;
  readonly completedHabitsCount: number;
  readonly pausedHabitsCount: number;
  readonly totalAchievements: number;
  readonly unlockedAchievementsCount: number;
  readonly averageProgressPercent: number;
}

export interface HabitSummary {
  readonly headline: string;
  readonly description: string;
  readonly topHabitTitle?: string;
  readonly currentStreakDays: number;
}

export interface HabitEngineState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly activeHabits: ReadonlyArray<HabitItem>;
  readonly completedHabits: ReadonlyArray<HabitItem>;
  readonly pausedHabits: ReadonlyArray<HabitItem>;
  readonly streaks: HabitStreakInfo;
  readonly achievements: ReadonlyArray<HabitAchievement>;
  readonly statistics: HabitStatistics;
  readonly summary: HabitSummary;

  // Future Extensibility Support Flags
  readonly supportsDailyHabits: boolean;
  readonly supportsWeeklyHabits: boolean;
  readonly supportsMonthlyHabits: boolean;
  readonly supportsSavingsChallenges: boolean;
  readonly supportsBudgetChallenges: boolean;
  readonly supportsInvestmentDiscipline: boolean;
  readonly supportsDebtRepaymentHabits: boolean;
  readonly supportsGamification: boolean;
  readonly supportsRewardBadges: boolean;
}

export interface HabitEngineUiState {
  readonly isLoading: boolean;
  readonly state: HabitEngineState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: HabitCategory | 'all';
}
