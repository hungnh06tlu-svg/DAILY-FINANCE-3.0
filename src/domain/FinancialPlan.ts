/**
 * Daily Finance 3.0 - FinancialPlan Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-006 Planning Center Architecture.
 */

export type PlanGoalType =
  | 'increase_savings'
  | 'reduce_debt'
  | 'reach_fire'
  | 'increase_investment'
  | 'emergency_fund_target'
  | 'budget_improvement'
  | 'cash_flow_improvement';

export type PlanActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PlanActionDifficulty = 'easy' | 'medium' | 'hard';

export interface PlanAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: PlanActionPriority;
  readonly estimatedImpact: number;
  readonly estimatedDuration: string;
  readonly difficulty: PlanActionDifficulty;
  readonly dependencies: ReadonlyArray<string>;
  readonly isCompleted: boolean;
}

export interface PlanMilestone {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly targetPercentage: number;
  readonly targetValue: number;
  readonly currentProgressPercent: number;
  readonly isCompleted: boolean;
  readonly targetDate?: string;
}

export interface PlanGoal {
  readonly id: string;
  readonly type: PlanGoalType;
  readonly title: string;
  readonly description: string;
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly progressPercent: number;
  readonly isCompleted: boolean;
  readonly milestones: ReadonlyArray<PlanMilestone>;
  readonly actions: ReadonlyArray<PlanAction>;
}

export type PlanningScenarioType =
  | 'current_strategy'
  | 'optimistic'
  | 'conservative'
  | 'aggressive'
  | 'custom';

export interface FinancialPlan {
  readonly id: string;
  readonly timestamp: string;
  readonly spaceId: string;
  readonly scenario: PlanningScenarioType;
  readonly startingSnapshotTimestamp: string;
  readonly goals: ReadonlyArray<PlanGoal>;
  readonly actions: ReadonlyArray<PlanAction>;
  readonly overallProgressPercent: number;
  readonly activeGoalsCount: number;
  readonly completedGoalsCount: number;
}

export interface PlanningUiState {
  readonly isLoading: boolean;
  readonly plan: FinancialPlan | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}
