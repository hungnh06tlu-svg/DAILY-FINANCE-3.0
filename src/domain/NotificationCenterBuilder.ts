/**
 * Daily Finance 3.0 - NotificationCenterBuilder
 * Pure Notification Center State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations performed directly in this builder.
 * Consumes ONLY FinancialSnapshot, FinancialForecast, FinancialPlan, CoachSession, DashboardState, and GoalPlannerState
 * to produce immutable NotificationCenterState, NotificationGroups, NotificationItems, and NotificationSummary.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialForecast } from './FinancialForecast';
import { FinancialPlan, PlanAction } from './FinancialPlan';
import { CoachSession } from './AICoachSession';
import { DashboardState, DashboardCard } from './DashboardState';
import { GoalPlannerState, GoalCard } from './GoalPlannerState';
import {
  NotificationCenterState,
  NotificationItem,
  NotificationGroup,
  NotificationStatistics,
  NotificationSummary,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
  NotificationStatus
} from './NotificationCenterState';

export interface NotificationCenterBuilderInputs {
  snapshot?: FinancialSnapshot;
  forecast?: FinancialForecast;
  plan?: FinancialPlan;
  coachSession?: CoachSession;
  dashboardState?: DashboardState;
  goalPlannerState?: GoalPlannerState;
  language?: Language;
}

export class NotificationCenterBuilder {
  /**
   * Transforms existing domain outputs into an immutable NotificationCenterState.
   */
  public static build(inputs: NotificationCenterBuilderInputs): NotificationCenterState {
    const { snapshot, forecast, plan, coachSession, dashboardState, goalPlannerState, language = 'vi' } = inputs;
    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || dashboardState?.spaceId || goalPlannerState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    const items: NotificationItem[] = [];

    // 1. Convert Coach Session Outputs to Notifications
    if (coachSession) {
      const priority: NotificationPriority = coachSession.overallTone === 'urgent' ? 'urgent' : coachSession.overallTone === 'cautious' ? 'high' : 'medium';
      items.push(Object.freeze({
        id: `notif_coach_${coachSession.timestamp.substring(0, 10)}`,
        type: 'recommendation' as NotificationType,
        category: 'ai_coach' as NotificationCategory,
        priority,
        title: isVi ? 'Lời khuyên từ Trợ lý AI Coach' : 'AI Coach Recommendation',
        subtitle: coachSession.primaryConversation.headline,
        message: coachSession.primaryConversation.mainDialogue,
        createdTime: coachSession.timestamp || nowIso,
        status: 'unread' as NotificationStatus,
        source: 'AICoachOrchestrator',
        relatedEntityId: coachSession.id,
        quickActions: Object.freeze([
          { id: 'qa_coach_open', label: isVi ? 'Trò chuyện AI' : 'Open Coach', actionType: 'open_ai_coach', targetRoute: '/coach' }
        ])
      }));
    }

    // 2. Convert Dashboard Cards / Alerts to Notifications
    if (dashboardState) {
      dashboardState.cards.forEach((card: DashboardCard) => {
        if (card.status === 'alert' || card.status === 'warning') {
          const isUrgent = card.status === 'alert' || card.priority === 'urgent';
          items.push(Object.freeze({
            id: `notif_dash_${card.id}`,
            type: card.status === 'alert' ? ('alert' as NotificationType) : ('warning' as NotificationType),
            category: NotificationCenterBuilder.mapCardTypeToCategory(card.type),
            priority: isUrgent ? ('urgent' as NotificationPriority) : ('high' as NotificationPriority),
            title: card.title,
            subtitle: card.subtitle,
            message: isVi ? `Giá trị hiện tại: ${card.valueFormatted}. Cần xem xét cập nhật.` : `Current value: ${card.valueFormatted}. Action recommended.`,
            createdTime: nowIso,
            status: isUrgent ? ('pinned' as NotificationStatus) : ('unread' as NotificationStatus),
            source: 'DashboardBuilder',
            relatedEntityId: card.id,
            quickActions: card.quickActions.map(qa => Object.freeze({
              id: qa.id,
              label: qa.label,
              actionType: qa.actionType,
              targetRoute: qa.targetRoute
            }))
          }));
        }
      });
    }

    // 3. Convert Financial Plan Actions to Notifications
    if (plan && plan.actions) {
      plan.actions.forEach((act: PlanAction) => {
        if (!act.isCompleted) {
          items.push(Object.freeze({
            id: `notif_plan_${act.id}`,
            type: 'reminder' as NotificationType,
            category: 'goals' as NotificationCategory,
            priority: act.priority as NotificationPriority,
            title: act.title,
            subtitle: act.description,
            message: act.description,
            createdTime: nowIso,
            scheduledTime: act.estimatedDuration,
            status: 'unread' as NotificationStatus,
            source: 'PlanningEngine',
            relatedEntityId: act.id,
            quickActions: Object.freeze([
              { id: `qa_act_${act.id}`, label: isVi ? 'Thực hiện' : 'Execute', actionType: 'execute_action', targetRoute: '/plan' }
            ])
          }));
        }
      });
    }

    // 4. Convert Goal Planner Outputs to Notifications
    if (goalPlannerState) {
      goalPlannerState.goals.forEach((goal: GoalCard) => {
        if (goal.priority === 'urgent' || goal.priority === 'high' || goal.status === 'overdue') {
          items.push(Object.freeze({
            id: `notif_goal_${goal.id}`,
            type: goal.status === 'overdue' ? ('alert' as NotificationType) : ('reminder' as NotificationType),
            category: goal.category === 'savings' ? 'savings' : goal.category === 'debt_payoff' ? 'debt' : goal.category === 'investment' ? 'investment' : 'goals',
            priority: goal.priority as NotificationPriority,
            title: goal.title,
            subtitle: goal.subtitle,
            message: isVi ? `Tiến độ hiện tại: ${goal.progress}%.` : `Current progress: ${goal.progress}%.`,
            createdTime: nowIso,
            status: 'unread' as NotificationStatus,
            source: 'GoalPlannerBuilder',
            relatedEntityId: goal.goalId,
            quickActions: Object.freeze([
              { id: `qa_g_${goal.goalId}`, label: isVi ? 'Xem mục tiêu' : 'View Goal', actionType: 'view_goal', targetRoute: `/goals/${goal.goalId}` }
            ])
          }));
        }
      });
    }

    // 5. Fallback Notifications if inputs provided directly from Snapshot
    if (items.length === 0 && snapshot) {
      if (snapshot.budgetSummary.overspentBudgetsCount > 0) {
        items.push(Object.freeze({
          id: 'notif_fallback_budget',
          type: 'alert' as NotificationType,
          category: 'budget' as NotificationCategory,
          priority: 'urgent' as NotificationPriority,
          title: isVi ? 'Cảnh báo Ngân sách' : 'Budget Overspent Alert',
          subtitle: isVi ? `Có ${snapshot.budgetSummary.overspentBudgetsCount} danh mục chi tiêu vượt hạn mức` : `${snapshot.budgetSummary.overspentBudgetsCount} budget categories overspent`,
          message: isVi ? 'Vui lòng kiểm tra và cân đối lại hạn mức chi tiêu trong tháng.' : 'Please adjust your spending allocations.',
          createdTime: nowIso,
          status: 'pinned' as NotificationStatus,
          source: 'FinancialSnapshot',
          quickActions: Object.freeze([
            { id: 'qa_b_view', label: isVi ? 'Xem ngân sách' : 'View Budgets', actionType: 'view_budgets', targetRoute: '/budgets' }
          ])
        }));
      }

      if (!snapshot.emergencyFund.isSufficient) {
        items.push(Object.freeze({
          id: 'notif_fallback_emergency',
          type: 'warning' as NotificationType,
          category: 'finance' as NotificationCategory,
          priority: 'high' as NotificationPriority,
          title: isVi ? 'Quỹ Dự phòng Khẩn cấp Thấp' : 'Emergency Reserve Deficit',
          subtitle: isVi ? `Bao phủ ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} tháng` : `Covers ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} months`,
          message: isVi ? 'Nên ưu tiên trích lập thêm quỹ dự phòng cho các rủi ro phát sinh.' : 'Target topping up emergency reserve to guarantee safety.',
          createdTime: nowIso,
          status: 'unread' as NotificationStatus,
          source: 'FinancialSnapshot',
          quickActions: Object.freeze([
            { id: 'qa_ef_topup', label: isVi ? 'Nạp quỹ' : 'Top Up', actionType: 'topup_emergency', targetRoute: '/savings/emergency' }
          ])
        }));
      }
    }

    // Always include a system notification
    items.push(Object.freeze({
      id: 'notif_system_status',
      type: 'info' as NotificationType,
      category: 'system' as NotificationCategory,
      priority: 'low' as NotificationPriority,
      title: isVi ? 'Hệ thống Daily Finance 3.0' : 'Daily Finance 3.0 Engine Status',
      subtitle: isVi ? 'Dữ liệu tài chính hợp nhất và đồng bộ hoàn tất' : 'Financial truth synchronized successfully',
      message: isVi ? 'Toàn bộ mô hình Domain Clean Architecture đang hoạt động chuẩn mực.' : 'Domain clean architecture running smoothly.',
      createdTime: nowIso,
      status: 'read' as NotificationStatus,
      source: 'FinancialTruthEngine',
      quickActions: Object.freeze([])
    }));

    // Categorize items by status
    const unreadNotifications = items.filter(i => i.status === 'unread');
    const readNotifications = items.filter(i => i.status === 'read');
    const pinnedNotifications = items.filter(i => i.status === 'pinned');
    const todayNotifications = items.filter(i => i.createdTime.substring(0, 10) === nowIso.substring(0, 10));
    const upcomingNotifications = items.filter(i => i.scheduledTime && i.scheduledTime > nowIso);
    const archivedNotifications = items.filter(i => i.status === 'archived');

    // Build Notification Groups
    const categoriesList: NotificationCategory[] = ['finance', 'budget', 'savings', 'investment', 'debt', 'fire', 'goals', 'ai_coach', 'system'];
    const groups: NotificationGroup[] = categoriesList.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const unreadCount = catItems.filter(i => i.status === 'unread' || i.status === 'pinned').length;

      return Object.freeze({
        id: `group_${cat}`,
        category: cat,
        title: NotificationCenterBuilder.getCategoryTitle(cat, isVi),
        unreadCount,
        items: Object.freeze(catItems)
      });
    });

    // Statistics
    const statistics: NotificationStatistics = Object.freeze({
      totalNotifications: items.length,
      unreadCount: unreadNotifications.length,
      readCount: readNotifications.length,
      pinnedCount: pinnedNotifications.length,
      todayCount: todayNotifications.length,
      upcomingCount: upcomingNotifications.length,
      archivedCount: archivedNotifications.length,
      urgentCount: items.filter(i => i.priority === 'urgent' || i.priority === 'high').length
    });

    // Summary
    const topNotif = items.find(i => i.priority === 'urgent' || i.priority === 'high') || items[0];
    const summary: NotificationSummary = Object.freeze({
      headline: isVi
        ? `Trung tâm Thông báo với ${unreadNotifications.length + pinnedNotifications.length} thông báo cần chú ý`
        : `Notification Center with ${unreadNotifications.length + pinnedNotifications.length} items needing attention`,
      description: coachSession
        ? coachSession.summaryText
        : (isVi ? 'Theo dõi tổng hợp tất cả cảnh báo, nhắc nhở và đề xuất tài chính.' : 'Aggregated stream of warnings, reminders, and financial advice.'),
      topNotificationTitle: topNotif?.title,
      topNotificationTime: topNotif?.createdTime
    });

    const state: NotificationCenterState = {
      timestamp: nowIso,
      spaceId,
      language,
      unreadNotifications: Object.freeze(unreadNotifications),
      readNotifications: Object.freeze(readNotifications),
      pinnedNotifications: Object.freeze(pinnedNotifications),
      todayNotifications: Object.freeze(todayNotifications),
      upcomingNotifications: Object.freeze(upcomingNotifications),
      archivedNotifications: Object.freeze(archivedNotifications),
      groups: Object.freeze(groups),
      statistics,
      summary,

      // Future Extension Support Flags
      supportsPushNotifications: true,
      supportsReminderScheduling: true,
      supportsBackgroundNotifications: true,
      supportsAndroidChannels: true,
      supportsSilentNotifications: true,
      supportsWidgetNotifications: true,
      supportsWearOS: true
    };

    return Object.freeze(state);
  }

  private static mapCardTypeToCategory(type: string): NotificationCategory {
    switch (type) {
      case 'budget':
        return 'budget';
      case 'savings':
      case 'emergency_fund':
        return 'savings';
      case 'investment':
        return 'investment';
      case 'debt':
        return 'debt';
      case 'fire':
        return 'fire';
      case 'ai_coach':
        return 'ai_coach';
      default:
        return 'finance';
    }
  }

  private static getCategoryTitle(cat: NotificationCategory, isVi: boolean): string {
    switch (cat) {
      case 'finance': return isVi ? 'Tài chính Chung' : 'General Finance';
      case 'budget': return isVi ? 'Ngân sách' : 'Budget';
      case 'savings': return isVi ? 'Tiết kiệm & Quỹ' : 'Savings & Reserve';
      case 'investment': return isVi ? 'Đầu tư' : 'Investment';
      case 'debt': return isVi ? 'Nợ & Trả nợ' : 'Debt & Repayment';
      case 'fire': return isVi ? 'FIRE & Nghỉ hưu' : 'FIRE Roadmap';
      case 'goals': return isVi ? 'Mục tiêu Planning' : 'Goal Planning';
      case 'ai_coach': return isVi ? 'Khuyên dùng AI Coach' : 'AI Coach Advice';
      case 'system': return isVi ? 'Thông báo Hệ thống' : 'System Notifications';
    }
  }
}
