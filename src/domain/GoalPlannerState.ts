/**
 * Daily Finance 3.0 - GoalPlannerState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-002 Goal Planner Architecture.
 */

export type GoalCategory =
  | 'savings'
  | 'debt_payoff'
  | 'investment'
  | 'fire'
  | 'emergency_fund'
  | 'budget_improvement'
  | 'recurring'
  | 'family'
  | 'challenge'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'active' | 'completed' | 'overdue' | 'paused' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface GoalQuickAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: string;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface GoalCard {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly category: GoalCategory;
  readonly priority: GoalPriority;
  readonly progress: number; // 0..100
  readonly targetDate?: string;
  readonly status: GoalStatus;
  readonly quickActions: ReadonlyArray<GoalQuickAction>;
  readonly currentAmount?: number;
  readonly targetAmount?: number;
  readonly milestonesCount?: number;
  readonly completedMilestonesCount?: number;
}

export interface GoalMilestone {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly progress: number;
  readonly completionPercentage: number; // 0..100
  readonly targetDate?: string;
  readonly status: MilestoneStatus;
}

export interface GoalStatistics {
  readonly totalGoals: number;
  readonly activeGoalsCount: number;
  readonly completedGoalsCount: number;
  readonly overdueGoalsCount: number;
  readonly totalMilestonesCount: number;
  readonly completedMilestonesCount: number;
  readonly averageProgressPercent: number;
}

export interface PlannerSummary {
  readonly headline: string;
  readonly description: string;
  readonly topPriorityGoalTitle?: string;
  readonly nextMilestoneTitle?: string;
  readonly nextMilestoneDate?: string;
  readonly totalTargetAmount: number;
  readonly totalCurrentAmount: number;
}

export interface GoalPlannerState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly goals: ReadonlyArray<GoalCard>;
  readonly activeGoals: ReadonlyArray<GoalCard>;
  readonly completedGoals: ReadonlyArray<GoalCard>;
  readonly overdueGoals: ReadonlyArray<GoalCard>;
  readonly upcomingMilestones: ReadonlyArray<GoalMilestone>;
  readonly statistics: GoalStatistics;
  readonly summary: PlannerSummary;

  // Future Extensibility Support Flags
  readonly supportsRecurringGoals: boolean;
  readonly supportsSharedFamilyGoals: boolean;
  readonly supportsInvestmentGoals: boolean;
  readonly supportsDebtPayoffPlans: boolean;
  readonly supportsSavingChallenges: boolean;
  readonly supportsAchievementBadges: boolean;
}

export interface GoalPlannerUiState {
  readonly isLoading: boolean;
  readonly state: GoalPlannerState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: GoalCategory | 'all';
}
