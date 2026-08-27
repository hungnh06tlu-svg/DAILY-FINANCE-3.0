/**
 * Daily Finance 3.0 - WidgetState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-008 Widgets & Voice Assistant Architecture.
 */

export type WidgetType =
  | 'overview'
  | 'today_summary'
  | 'cash_flow'
  | 'net_worth'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'fire'
  | 'six_jars'
  | 'emergency_fund'
  | 'goals'
  | 'notifications'
  | 'habits'
  | 'ai_coach'
  | 'analytics'
  | 'quick_actions';

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra_large';
export type WidgetPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WidgetRefreshPolicy =
  | 'on_data_change'
  | 'periodic_15m'
  | 'periodic_1h'
  | 'periodic_daily'
  | 'manual';

export type WidgetDataSource =
  | 'financial_snapshot'
  | 'financial_timeline'
  | 'financial_forecast'
  | 'financial_intelligence'
  | 'financial_plan'
  | 'dashboard'
  | 'goal_planner'
  | 'notification_center'
  | 'habit_engine'
  | 'automation_center'
  | 'ai_coach'
  | 'ai_chat'
  | 'analytics';

export type QuickActionType =
  | 'add_income'
  | 'add_expense'
  | 'transfer'
  | 'add_saving'
  | 'add_investment'
  | 'record_debt'
  | 'repay_debt'
  | 'open_budget'
  | 'open_goals'
  | 'open_ai_coach'
  | 'open_analytics';

export interface WidgetMetric {
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly changePercent?: number;
}

export interface WidgetAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: QuickActionType;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface WidgetItem {
  readonly id: string;
  readonly type: WidgetType;
  readonly title: string;
  readonly subtitle: string;
  readonly size: WidgetSize;
  readonly priority: WidgetPriority;
  readonly metrics: ReadonlyArray<WidgetMetric>;
  readonly summary: string;
  readonly trend: 'upward' | 'downward' | 'stable' | 'volatile';
  readonly actions: ReadonlyArray<WidgetAction>;
  readonly lastUpdatedAt: string;
  readonly isEnabled: boolean;
  readonly isPinned: boolean;
  readonly refreshPolicy: WidgetRefreshPolicy;
  readonly dataSource: WidgetDataSource;
}

export interface WidgetSummary {
  readonly totalWidgetsCount: number;
  readonly activeWidgetsCount: number;
  readonly pinnedWidgetsCount: number;
  readonly headline: string;
  readonly description: string;
}

export interface WidgetStatistics {
  readonly totalWidgets: number;
  readonly enabledWidgetsCount: number;
  readonly pinnedWidgetsCount: number;
  readonly widgetsBySize: Record<WidgetSize, number>;
}

export interface WidgetFutureSupportFlags {
  readonly supportsHomeScreen: boolean;
  readonly supportsAndroid14: boolean;
  readonly supportsWearOS: boolean;
  readonly supportsAndroidAuto: boolean;
  readonly supportsTablet: boolean;
  readonly supportsDesktopPWA: boolean;
  readonly supportsLockScreen: boolean;
  readonly supportsNotificationWidget: boolean;
  readonly supportsDynamicWidget: boolean;
}

export interface WidgetState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly items: ReadonlyArray<WidgetItem>;
  readonly summary: WidgetSummary;
  readonly statistics: WidgetStatistics;

  // Global Future Extension Support Flags
  readonly futureSupportFlags: WidgetFutureSupportFlags;
}

export interface WidgetUiState {
  readonly isLoading: boolean;
  readonly state: WidgetState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterType?: WidgetType | 'all';
}
