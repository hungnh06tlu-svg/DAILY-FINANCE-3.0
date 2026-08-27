/**
 * Daily Finance 3.0 - FinancialForecast Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-005 Forecast Read-Model Architecture.
 */

export type ForecastPeriodDays = 30 | 90 | 180 | 365 | number;

export type ForecastScenarioType =
  | 'current_trend'
  | 'optimistic'
  | 'conservative'
  | 'aggressive'
  | 'custom';

export interface ForecastScenarioConfig {
  readonly type: ForecastScenarioType;
  readonly incomeMultiplier: number;
  readonly expenseMultiplier: number;
  readonly annualInvestmentReturnRate: number;
  readonly debtPaydownMultiplier: number;
}

export interface ProjectedPoint {
  readonly date: string;
  readonly daysFromNow: number;
  readonly projectedCashBalance: number;
  readonly projectedNetWorth: number;
  readonly projectedMonthlyIncome: number;
  readonly projectedMonthlyExpense: number;
  readonly projectedSavings: number;
  readonly projectedInvestmentValue: number;
  readonly projectedDebtBalance: number;
  readonly projectedEmergencyFundMonths: number;
  readonly projectedFireProgressPercent: number;
}

export type ForecastInsightType =
  | 'on_track'
  | 'delayed'
  | 'high_risk'
  | 'recovery_expected'
  | 'target_reachable'
  | 'target_unreachable';

export interface ForecastInsight {
  readonly id: string;
  readonly type: ForecastInsightType;
  readonly title: string;
  readonly description: string;
  readonly confidence: number;
  readonly targetMetric?: string;
}

export interface FinancialForecast {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly horizonDays: ForecastPeriodDays;
  readonly scenario: ForecastScenarioType;
  readonly startingSnapshotTimestamp: string;

  readonly projectedCashBalance: number;
  readonly projectedNetWorth: number;
  readonly projectedMonthlyExpense: number;
  readonly projectedMonthlyIncome: number;
  readonly projectedSavingsProgress: number;
  readonly projectedInvestmentGrowth: number;
  readonly projectedDebtBalance: number;
  readonly projectedBudgetConsumptionPercent: number;
  readonly projectedEmergencyFundMonths: number;
  readonly projectedFireProgressPercent: number;

  readonly timelinePoints: ReadonlyArray<ProjectedPoint>;
  readonly insights: ReadonlyArray<ForecastInsight>;
}

export interface ForecastUiState {
  readonly isLoading: boolean;
  readonly forecast: FinancialForecast | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}
