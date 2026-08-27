/**
 * Daily Finance 3.0 - WidgetBuilder
 * Pure Widget State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial truth calculations, zero repository access, zero persistence, zero Android platform calls.
 * Consumes ONLY existing immutable read models to construct presentation-ready widget states.
 */

import { Language, Transaction } from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
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
import { AnalyticsState } from './AnalyticsState';
import {
  WidgetState,
  WidgetItem,
  WidgetType,
  WidgetSize,
  WidgetPriority,
  WidgetSummary,
  WidgetStatistics,
  WidgetFutureSupportFlags,
  WidgetAction,
  QuickActionType,
  WidgetRefreshPolicy,
  WidgetDataSource
} from './WidgetState';

export interface WidgetBuilderInputs {
  snapshot?: FinancialSnapshot;
  timeline?: FinancialTimeline;
  forecast?: FinancialForecast;
  intelligence?: FinancialIntelligence;
  plan?: FinancialPlan;
  dashboardState?: DashboardState;
  goalPlannerState?: GoalPlannerState;
  notificationCenterState?: NotificationCenterState;
  habitEngineState?: HabitEngineState;
  automationCenterState?: AutomationCenterState;
  coachSession?: CoachSession;
  aiChatState?: AIChatState;
  analyticsState?: AnalyticsState;
  transactions?: Transaction[];
  language?: Language;
  filterType?: WidgetType | 'all';
}

export class WidgetBuilder {
  /**
   * Transforms existing domain read models into an immutable WidgetState.
   */
  public static build(inputs: WidgetBuilderInputs): WidgetState {
    const {
      snapshot,
      forecast,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      coachSession,
      analyticsState,
      transactions,
      language = 'vi',
      filterType = 'all'
    } = inputs;

    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || dashboardState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    // Authoritative "Spent Today" calculation via FinancialTruthEngine
    const todayStr = new Date().toISOString().substring(0, 10);
    const spaceFilteredTxs = (transactions || []).filter(
      (tx) => tx.spaceId === spaceId && !tx.isDeleted
    );
    const spentToday = FinancialTruthEngine.calculateExpense(spaceFilteredTxs, todayStr, todayStr);

    const futureSupportFlags: WidgetFutureSupportFlags = Object.freeze({
      supportsHomeScreen: true,
      supportsAndroid14: true,
      supportsWearOS: true,
      supportsAndroidAuto: true,
      supportsTablet: true,
      supportsDesktopPWA: true,
      supportsLockScreen: true,
      supportsNotificationWidget: true,
      supportsDynamicWidget: true
    });

    const items: WidgetItem[] = [];

    // 1. Overview Widget
    items.push(Object.freeze({
      id: 'widget_overview',
      type: 'overview' as WidgetType,
      title: isVi ? 'Tổng quan Tài chính' : 'Financial Overview',
      subtitle: isVi ? 'Số dư & Tài sản ròng' : 'Balance & Net Worth',
      size: 'medium' as WidgetSize,
      priority: 'urgent' as WidgetPriority,
      metrics: Object.freeze([
        { label: isVi ? 'Số dư' : 'Balance', value: snapshot?.cashBalance || 0 },
        { label: isVi ? 'Tài sản Ròng' : 'Net Worth', value: snapshot?.netWorth || 0 }
      ]),
      summary: isVi ? 'Cập nhật tổng quan tài chính' : 'Financial overview update',
      trend: 'upward',
      actions: Object.freeze([
        { id: 'act_add_exp', label: isVi ? '+ Chi tiêu' : '+ Expense', actionType: 'add_expense' as QuickActionType, targetRoute: '/transactions/new?type=expense' }
      ]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: true,
      refreshPolicy: 'on_data_change' as WidgetRefreshPolicy,
      dataSource: 'financial_snapshot' as WidgetDataSource
    }));

    // 2. Today Summary Widget
    items.push(Object.freeze({
      id: 'widget_today_summary',
      type: 'today_summary' as WidgetType,
      title: isVi ? 'Tóm tắt Hôm nay' : 'Today Summary',
      subtitle: isVi ? 'Thu nhập & Chi tiêu ngày' : 'Daily Income & Expense',
      size: 'small' as WidgetSize,
      priority: 'high' as WidgetPriority,
      metrics: Object.freeze([
        { label: isVi ? 'Chi hôm nay' : 'Spent Today', value: spentToday }
      ]),
      summary: isVi ? 'Tình hình chi tiêu trong ngày' : 'Daily spending summary',
      trend: 'stable',
      actions: Object.freeze([
        { id: 'act_add_inc', label: isVi ? '+ Thu nhập' : '+ Income', actionType: 'add_income' as QuickActionType, targetRoute: '/transactions/new?type=income' }
      ]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: true,
      refreshPolicy: 'periodic_15m' as WidgetRefreshPolicy,
      dataSource: 'financial_snapshot' as WidgetDataSource
    }));

    // 3. Cash Flow Widget
    items.push(Object.freeze({
      id: 'widget_cash_flow',
      type: 'cash_flow' as WidgetType,
      title: isVi ? 'Dòng tiền Tháng' : 'Monthly Cash Flow',
      subtitle: isVi ? 'Thặng dư dòng tiền' : 'Cash flow surplus',
      size: 'medium' as WidgetSize,
      priority: 'high' as WidgetPriority,
      metrics: Object.freeze([
        { label: isVi ? 'Thu nhập' : 'Income', value: snapshot?.monthlyIncome || 0 },
        { label: isVi ? 'Chi tiêu' : 'Expense', value: snapshot?.monthlyExpense || 0 }
      ]),
      summary: isVi ? `Thặng dư: ${((snapshot?.monthlyIncome || 0) - (snapshot?.monthlyExpense || 0)).toLocaleString()} VND` : `Surplus: ${((snapshot?.monthlyIncome || 0) - (snapshot?.monthlyExpense || 0))}`,
      trend: (snapshot?.monthlyIncome || 0) >= (snapshot?.monthlyExpense || 0) ? 'upward' : 'downward',
      actions: Object.freeze([]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: false,
      refreshPolicy: 'periodic_1h' as WidgetRefreshPolicy,
      dataSource: 'analytics' as WidgetDataSource
    }));

    // 4. Budget Widget
    items.push(Object.freeze({
      id: 'widget_budget',
      type: 'budget' as WidgetType,
      title: isVi ? 'Ngân sách Hàng tháng' : 'Monthly Budget',
      subtitle: isVi ? 'Tiến độ phân bổ ngân sách' : 'Budget allocation progress',
      size: 'medium' as WidgetSize,
      priority: 'medium' as WidgetPriority,
      metrics: Object.freeze([
        { label: isVi ? 'Đã chi' : 'Spent', value: snapshot?.budgetSummary?.totalSpent || 0 },
        { label: isVi ? 'Hạn mức' : 'Limit', value: snapshot?.budgetSummary?.totalAllocated || 0 }
      ]),
      summary: isVi ? 'Theo dõi hạn mức chi tiêu' : 'Track spending limits',
      trend: 'stable',
      actions: Object.freeze([
        { id: 'act_open_budget', label: isVi ? 'Ngân sách' : 'Budget', actionType: 'open_budget' as QuickActionType, targetRoute: '/budgets' }
      ]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: false,
      refreshPolicy: 'on_data_change' as WidgetRefreshPolicy,
      dataSource: 'financial_snapshot' as WidgetDataSource
    }));

    // 5. Goals Widget
    items.push(Object.freeze({
      id: 'widget_goals',
      type: 'goals' as WidgetType,
      title: isVi ? 'Mục tiêu Tài chính' : 'Financial Goals',
      subtitle: isVi ? 'Tiến độ hoàn thành mục tiêu' : 'Goal completion progress',
      size: 'large' as WidgetSize,
      priority: 'medium' as WidgetPriority,
      metrics: Object.freeze([
        { label: isVi ? 'Mục tiêu' : 'Goals', value: goalPlannerState?.goals?.length || 0 },
        { label: isVi ? 'Hoàn thành' : 'Completed', value: goalPlannerState?.statistics?.completedGoalsCount || 0 }
      ]),
      summary: isVi ? 'Kế hoạch tiết kiệm & tích lũy' : 'Savings & accumulation plan',
      trend: 'upward',
      actions: Object.freeze([
        { id: 'act_open_goals', label: isVi ? 'Mục tiêu' : 'Goals', actionType: 'open_goals' as QuickActionType, targetRoute: '/goals' }
      ]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: false,
      refreshPolicy: 'periodic_daily' as WidgetRefreshPolicy,
      dataSource: 'goal_planner' as WidgetDataSource
    }));

    // 6. Quick Actions Widget
    items.push(Object.freeze({
      id: 'widget_quick_actions',
      type: 'quick_actions' as WidgetType,
      title: isVi ? 'Thao tác Nhanh' : 'Quick Actions',
      subtitle: isVi ? 'Phím tắt ghi chép tài chính' : 'Financial entry shortcuts',
      size: 'small' as WidgetSize,
      priority: 'urgent' as WidgetPriority,
      metrics: Object.freeze([]),
      summary: isVi ? 'Ghi chép giao dịch trong 3 giây' : 'Log transactions in 3 seconds',
      trend: 'stable',
      actions: Object.freeze([
        { id: 'qa_expense', label: isVi ? '+ Chi' : '+ Exp', actionType: 'add_expense' as QuickActionType, targetRoute: '/transactions/new?type=expense' },
        { id: 'qa_income', label: isVi ? '+ Thu' : '+ Inc', actionType: 'add_income' as QuickActionType, targetRoute: '/transactions/new?type=income' },
        { id: 'qa_transfer', label: isVi ? 'Chuyển' : 'Transfer', actionType: 'transfer' as QuickActionType, targetRoute: '/transactions/new?type=transfer' }
      ]),
      lastUpdatedAt: nowIso,
      isEnabled: true,
      isPinned: true,
      refreshPolicy: 'manual' as WidgetRefreshPolicy,
      dataSource: 'dashboard' as WidgetDataSource
    }));

    // Filter items by type if filterType !== 'all'
    const filteredItems = (filterType && filterType !== 'all')
      ? items.filter(i => i.type === filterType)
      : items;

    // Statistics
    const widgetsBySize = Object.freeze({
      small: filteredItems.filter(i => i.size === 'small').length,
      medium: filteredItems.filter(i => i.size === 'medium').length,
      large: filteredItems.filter(i => i.size === 'large').length,
      extra_large: filteredItems.filter(i => i.size === 'extra_large').length
    });

    const statistics: WidgetStatistics = Object.freeze({
      totalWidgets: filteredItems.length,
      enabledWidgetsCount: filteredItems.filter(i => i.isEnabled).length,
      pinnedWidgetsCount: filteredItems.filter(i => i.isPinned).length,
      widgetsBySize
    });

    // Summary
    const summary: WidgetSummary = Object.freeze({
      totalWidgetsCount: filteredItems.length,
      activeWidgetsCount: filteredItems.filter(i => i.isEnabled).length,
      pinnedWidgetsCount: filteredItems.filter(i => i.isPinned).length,
      headline: isVi ? `Hệ thống ${filteredItems.length} Widget & Quick Action` : `System of ${filteredItems.length} Widgets & Quick Actions`,
      description: isVi
        ? 'Cung cấp dữ liệu tài chính thời gian thực trực tiếp trên màn hình chính Android & tiện ích nhanh.'
        : 'Delivers real-time financial data directly to Android Home Screen & quick actions.'
    });

    const state: WidgetState = {
      timestamp: nowIso,
      spaceId,
      language,
      items: Object.freeze(filteredItems),
      summary,
      statistics,
      futureSupportFlags
    };

    return Object.freeze(state);
  }
}
