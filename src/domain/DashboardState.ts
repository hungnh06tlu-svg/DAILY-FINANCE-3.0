/**
 * Daily Finance 3.0 - DashboardState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-001 Smart Dashboard Architecture.
 */

export type DashboardCardType =
  | 'overview'
  | 'today_summary'
  | 'month_summary'
  | 'net_worth'
  | 'cash_flow'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'fire'
  | 'six_jars'
  | 'emergency_fund'
  | 'ai_coach';

export type DashboardCardStatus = 'normal' | 'warning' | 'alert' | 'success';
export type DashboardCardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DashboardQuickAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: string;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface DashboardCard {
  readonly id: string;
  readonly type: DashboardCardType;
  readonly title: string;
  readonly subtitle: string;
  readonly priority: DashboardCardPriority;
  readonly displayOrder: number;
  readonly status: DashboardCardStatus;
  readonly progress?: number; // 0..100
  readonly quickActions: ReadonlyArray<DashboardQuickAction>;
  readonly valueFormatted?: string;
  readonly details?: Record<string, any>;
}

export type DashboardSectionType =
  | 'overview'
  | 'planning'
  | 'health'
  | 'goals'
  | 'alerts'
  | 'recommendations';

export interface DashboardSection {
  readonly id: string;
  readonly type: DashboardSectionType;
  readonly title: string;
  readonly description: string;
  readonly displayOrder: number;
  readonly cards: ReadonlyArray<DashboardCard>;
}

export interface FinancialOverviewData {
  readonly netWorth: number;
  readonly cashBalance: number;
  readonly monthlyIncome: number;
  readonly monthlyExpense: number;
  readonly netSurplus: number;
  readonly healthScore: number;
  readonly currency: string;
}

export interface TodaySummaryData {
  readonly date: string;
  readonly totalExpenseToday: number;
  readonly totalIncomeToday: number;
  readonly transactionsCountToday: number;
}

export interface MonthSummaryData {
  readonly month: string;
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly netSavings: number;
  readonly savingsRatePercent: number;
}

export interface DashboardState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly overview: FinancialOverviewData;
  readonly todaySummary: TodaySummaryData;
  readonly monthSummary: MonthSummaryData;
  readonly cards: ReadonlyArray<DashboardCard>;
  readonly sections: ReadonlyArray<DashboardSection>;
  readonly activeAlertsCount: number;
  readonly pendingActionsCount: number;
}

export interface DashboardUiState {
  readonly isLoading: boolean;
  readonly dashboardState: DashboardState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly selectedSection?: DashboardSectionType;
}
