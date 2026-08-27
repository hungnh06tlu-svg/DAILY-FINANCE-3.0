/**
 * Daily Finance 3.0 - FinancialTimeline Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-004 Timeline Read-Model Architecture.
 */

import { FinancialSnapshot } from './FinancialSnapshot';

export type TimelineGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type TrendDirection =
  | 'improving'
  | 'declining'
  | 'stable'
  | 'volatile'
  | 'recovery'
  | 'acceleration'
  | 'slowdown';

export interface TimelinePoint {
  readonly timestamp: string;
  readonly periodLabel: string;
  readonly snapshot: FinancialSnapshot;
  readonly netWorth: number;
  readonly cash: number;
  readonly income: number;
  readonly expense: number;
  readonly savingsProgress: number;
  readonly investmentValue: number;
  readonly debt: number;
  readonly budgetStatus: 'normal' | 'caution' | 'overspent';
  readonly emergencyFund: number;
  readonly financialHealth: number;
}

export type TrendMetricName =
  | 'income'
  | 'expense'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'budget'
  | 'health'
  | 'net_worth';

export interface FinancialTrend {
  readonly metric: TrendMetricName;
  readonly direction: TrendDirection;
  readonly changeAmount: number;
  readonly changePercent: number;
  readonly description: string;
}

export interface TimelineInsight {
  readonly id: string;
  readonly type: TrendDirection;
  readonly title: string;
  readonly description: string;
  readonly affectedMetric: TrendMetricName;
}

export interface FinancialTimeline {
  readonly spaceId: string;
  readonly granularity: TimelineGranularity;
  readonly points: ReadonlyArray<TimelinePoint>;
  readonly trends: ReadonlyArray<FinancialTrend>;
  readonly insights: ReadonlyArray<TimelineInsight>;
  readonly startDate: string;
  readonly endDate: string;
}

export interface TimelineUiState {
  readonly isLoading: boolean;
  readonly timeline: FinancialTimeline | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}
