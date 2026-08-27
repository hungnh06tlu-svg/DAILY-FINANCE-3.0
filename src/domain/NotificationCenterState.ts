/**
 * Daily Finance 3.0 - NotificationCenterState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-003 Notification Center Architecture.
 */

export type NotificationType =
  | 'alert'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'reminder'
  | 'recommendation';

export type NotificationCategory =
  | 'finance'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'fire'
  | 'goals'
  | 'ai_coach'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'pinned' | 'archived';

export interface NotificationQuickAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: string;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface NotificationItem {
  readonly id: string;
  readonly type: NotificationType;
  readonly category: NotificationCategory;
  readonly priority: NotificationPriority;
  readonly title: string;
  readonly subtitle: string;
  readonly message: string;
  readonly createdTime: string;
  readonly scheduledTime?: string;
  readonly status: NotificationStatus;
  readonly source: string; // e.g., 'AICoach', 'BudgetEngine', 'ForecastEngine', 'GoalPlanner'
  readonly relatedEntityId?: string;
  readonly quickActions: ReadonlyArray<NotificationQuickAction>;
}

export interface NotificationGroup {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly title: string;
  readonly unreadCount: number;
  readonly items: ReadonlyArray<NotificationItem>;
}

export interface NotificationStatistics {
  readonly totalNotifications: number;
  readonly unreadCount: number;
  readonly readCount: number;
  readonly pinnedCount: number;
  readonly todayCount: number;
  readonly upcomingCount: number;
  readonly archivedCount: number;
  readonly urgentCount: number;
}

export interface NotificationSummary {
  readonly headline: string;
  readonly description: string;
  readonly topNotificationTitle?: string;
  readonly topNotificationTime?: string;
}

export interface NotificationCenterState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly unreadNotifications: ReadonlyArray<NotificationItem>;
  readonly readNotifications: ReadonlyArray<NotificationItem>;
  readonly pinnedNotifications: ReadonlyArray<NotificationItem>;
  readonly todayNotifications: ReadonlyArray<NotificationItem>;
  readonly upcomingNotifications: ReadonlyArray<NotificationItem>;
  readonly archivedNotifications: ReadonlyArray<NotificationItem>;
  readonly groups: ReadonlyArray<NotificationGroup>;
  readonly statistics: NotificationStatistics;
  readonly summary: NotificationSummary;

  // Future Extensibility Support Flags
  readonly supportsPushNotifications: boolean;
  readonly supportsReminderScheduling: boolean;
  readonly supportsBackgroundNotifications: boolean;
  readonly supportsAndroidChannels: boolean;
  readonly supportsSilentNotifications: boolean;
  readonly supportsWidgetNotifications: boolean;
  readonly supportsWearOS: boolean;
}

export interface NotificationCenterUiState {
  readonly isLoading: boolean;
  readonly state: NotificationCenterState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: NotificationCategory | 'all';
}
