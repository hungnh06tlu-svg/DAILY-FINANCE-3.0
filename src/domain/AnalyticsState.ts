/**
 * Daily Finance 3.0 - AnalyticsState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-007 Advanced Analytics Architecture.
 */

import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialForecast } from './FinancialForecast';
import { FinancialIntelligence } from './FinancialIntelligence';
import { FinancialPlan } from './FinancialPlan';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import { AutomationCenterState } from './AutomationCenterState';
import { CoachSession } from './AICoachSession';
import { AIChatState } from './AIChatState';

export type AnalyticsCategory =
  | 'cash_flow'
  | 'net_worth'
  | 'category'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'fire'
  | 'goals'
  | 'habits'
  | 'forecast'
  | 'overall';

export type AnalyticsPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AnalyticsChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'area' | 'heatmap' | 'kpi';
export type InsightType = 'trend' | 'anomaly' | 'achievement' | 'risk' | 'opportunity' | 'benchmark';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface AnalyticsCardMetric {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly changePercent?: number;
}

export interface AnalyticsCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly category: AnalyticsCategory;
  readonly priority: AnalyticsPriority;
  readonly chartType: AnalyticsChartType;
  readonly metrics: ReadonlyArray<AnalyticsCardMetric>;
  readonly summary: string;
  readonly trend: 'upward' | 'downward' | 'stable' | 'volatile';
  readonly colorHint?: string;
}

export interface AnalyticsInsight {
  readonly id: string;
  readonly type: InsightType;
  readonly severity: InsightSeverity;
  readonly category?: AnalyticsCategory;
  readonly title: string;
  readonly description: string;
  readonly evidence: ReadonlyArray<string>;
  readonly recommendation: string;
  readonly confidence: number; // 0..100
}

export interface AnalyticsStatistics {
  readonly totals: Record<string, number>;
  readonly averages: Record<string, number>;
  readonly growth: Record<string, number>;
  readonly ratios: Record<string, number>;
  readonly percentages: Record<string, number>;
  readonly completion: Record<string, number>;
  readonly consistency: Record<string, number>;
}

export interface CashFlowAnalysis {
  readonly monthlyIncome: number;
  readonly monthlyExpense: number;
  readonly netCashFlow: number;
  readonly savingsRatePercent: number;
  readonly status: 'surplus' | 'deficit' | 'balanced';
}

export interface NetWorthAnalysis {
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly netWorth: number;
  readonly debtToAssetRatio: number;
  readonly status: 'solvent' | 'leveraged' | 'distressed';
}

export interface CategoryAnalysis {
  readonly topExpenseCategory: string;
  readonly topExpenseAmount: number;
  readonly topCategoryPercent: number;
  readonly categoryBreakdown: ReadonlyArray<{ readonly category: string; readonly amount: number; readonly percent: number }>;
}

export interface BudgetAnalysis {
  readonly totalBudgeted: number;
  readonly totalSpent: number;
  readonly overspentCategoriesCount: number;
  readonly budgetHealthPercent: number;
}

export interface SavingsAnalysis {
  readonly totalSavings: number;
  readonly emergencyFundBalance: number;
  readonly emergencyFundCoverageMonths: number;
  readonly isEmergencyFundSufficient: boolean;
}

export interface InvestmentAnalysis {
  readonly totalInvested: number;
  readonly estimatedROIPercent: number;
  readonly portfolioDiversificationScore: number;
}

export interface DebtAnalysis {
  readonly totalDebt: number;
  readonly monthlyDebtPayment: number;
  readonly debtFreeEstimatedMonths: number;
}

export interface FIREAnalysis {
  readonly fireTargetAmount: number;
  readonly currentFireProgressPercent: number;
  readonly estimatedYearsToFIRE: number;
}

export interface GoalAnalysis {
  readonly totalGoals: number;
  readonly activeGoalsCount: number;
  readonly completedGoalsCount: number;
  readonly averageGoalProgressPercent: number;
}

export interface HabitAnalysis {
  readonly activeHabitsCount: number;
  readonly currentMaxStreak: number;
  readonly habitConsistencyScorePercent: number;
}

export interface ForecastAnalysis {
  readonly projected30DaysNet: number;
  readonly projected90DaysNet: number;
  readonly forecastTrend: 'growth' | 'decline' | 'flat';
}

export interface AnalyticsDashboard {
  readonly headline: string;
  readonly summaryText: string;
  readonly totalCardsCount: number;
  readonly totalInsightsCount: number;
}

export interface AnalyticsFutureSupportFlags {
  readonly supportsInteractiveCharts: boolean;
  readonly supportsComparisonMode: boolean;
  readonly supportsCustomReports: boolean;
  readonly supportsExportPDF: boolean;
  readonly supportsExportExcel: boolean;
  readonly supportsCSVExport: boolean;
  readonly supportsKPIDashboard: boolean;
  readonly supportsHeatmaps: boolean;
  readonly supportsTrendDetection: boolean;
  readonly supportsAnomalyDetection: boolean;
  readonly supportsPredictiveAnalytics: boolean;
  readonly supportsBenchmarkComparison: boolean;
}

export interface AnalyticsState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly dashboard: AnalyticsDashboard;
  readonly trendCards: ReadonlyArray<AnalyticsCard>;
  readonly performanceCards: ReadonlyArray<AnalyticsCard>;
  readonly categoryAnalysis: CategoryAnalysis;
  readonly cashFlowAnalysis: CashFlowAnalysis;
  readonly netWorthAnalysis: NetWorthAnalysis;
  readonly budgetAnalysis: BudgetAnalysis;
  readonly savingsAnalysis: SavingsAnalysis;
  readonly investmentAnalysis: InvestmentAnalysis;
  readonly debtAnalysis: DebtAnalysis;
  readonly fireAnalysis: FIREAnalysis;
  readonly goalAnalysis: GoalAnalysis;
  readonly habitAnalysis: HabitAnalysis;
  readonly forecastAnalysis: ForecastAnalysis;
  readonly statistics: AnalyticsStatistics;
  readonly insights: ReadonlyArray<AnalyticsInsight>;
  readonly recommendations: ReadonlyArray<string>;

  // Global Future Extension Support Flags
  readonly futureSupportFlags: AnalyticsFutureSupportFlags;
}

export interface AnalyticsUiState {
  readonly isLoading: boolean;
  readonly state: AnalyticsState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: AnalyticsCategory | 'all';
}
