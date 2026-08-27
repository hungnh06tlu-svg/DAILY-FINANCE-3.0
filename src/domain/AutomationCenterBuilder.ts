/**
 * Daily Finance 3.0 - AutomationCenterBuilder
 * Pure Automation Center State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations, zero background execution, zero repository access.
 * Consumes ONLY FinancialSnapshot, FinancialForecast, FinancialPlan, CoachSession,
 * DashboardState, GoalPlannerState, NotificationCenterState, and HabitEngineState
 * to produce immutable AutomationCenterState, AutomationRules, AutomationSuggestions, and AutomationSummary.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialForecast } from './FinancialForecast';
import { FinancialPlan } from './FinancialPlan';
import { CoachSession } from './AICoachSession';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import {
  AutomationCenterState,
  AutomationRule,
  AutomationSuggestion,
  AutomationHistoryItem,
  AutomationStatistics,
  AutomationSummary,
  AutomationFutureSupportFlags,
  AutomationCategory,
  AutomationPriority,
  AutomationStatus
} from './AutomationCenterState';

export interface AutomationCenterBuilderInputs {
  snapshot?: FinancialSnapshot;
  forecast?: FinancialForecast;
  plan?: FinancialPlan;
  coachSession?: CoachSession;
  dashboardState?: DashboardState;
  goalPlannerState?: GoalPlannerState;
  notificationCenterState?: NotificationCenterState;
  habitEngineState?: HabitEngineState;
  language?: Language;
  filterCategory?: AutomationCategory | 'all';
}

export class AutomationCenterBuilder {
  /**
   * Transforms existing domain outputs into an immutable AutomationCenterState.
   */
  public static build(inputs: AutomationCenterBuilderInputs): AutomationCenterState {
    const {
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      language = 'vi',
      filterCategory = 'all'
    } = inputs;

    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || habitEngineState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    const globalSupportFlags: AutomationFutureSupportFlags = Object.freeze({
      supportsAutoCategorization: true,
      supportsAutoBudgetCreation: true,
      supportsAutoSavingsTransfer: true,
      supportsRecurringTransactions: true,
      supportsInvestmentRebalancing: true,
      supportsDebtRepaymentAutomation: true,
      supportsSmartNotifications: true,
      supportsGoalAutomation: true,
      supportsAISuggestedRules: true,
      supportsIFTTT: true,
      supportsGoogleCalendar: true,
      supportsAndroidWorkManager: true
    });

    const rules: AutomationRule[] = [];
    const suggestions: AutomationSuggestion[] = [];
    const history: AutomationHistoryItem[] = [];

    // Rule 1: Auto Categorization Rule
    rules.push(Object.freeze({
      id: 'rule_auto_cat_salary',
      name: isVi ? 'Tự động Phân loại Lương & Mua sắm' : 'Auto-Categorize Salary & Shopping',
      description: isVi ? 'Tự động gán danh mục Lương và Mua sắm dựa trên từ khóa giao dịch' : 'Automatically assign Salary and Shopping categories based on keywords',
      category: 'auto_categorization' as AutomationCategory,
      trigger: 'OnNewTransactionCreated',
      condition: 'title.contains("Luong") || title.contains("Shopee")',
      action: 'AssignCategory(matchingCategory)',
      priority: 'high' as AutomationPriority,
      status: 'active' as AutomationStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
      quickActions: Object.freeze([
        { id: 'qa_edit_rule_cat', label: isVi ? 'Chỉnh sửa quy tắc' : 'Edit Rule', actionType: 'edit_rule', targetRoute: '/automation/rules/rule_auto_cat_salary' }
      ]),
      futureSupportFlags: globalSupportFlags
    }));

    // Rule 2: Recurring Transaction Prompt
    rules.push(Object.freeze({
      id: 'rule_recurring_bills',
      name: isVi ? 'Nhắc nhở Thanh toán Hóa đơn Định kỳ' : 'Recurring Bill Payment Reminder',
      description: isVi ? 'Tạo nhắc nhở tự động cho các hóa đơn sinh hoạt định kỳ hàng tháng' : 'Create automatic reminders for monthly utility bills',
      category: 'recurring_transactions' as AutomationCategory,
      trigger: 'MonthlySchedule(day=1)',
      condition: 'hasUnpaidRecurringBills == true',
      action: 'SendNotification("Nhắc nhở hóa đơn")',
      priority: 'medium' as AutomationPriority,
      status: 'active' as AutomationStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
      quickActions: Object.freeze([
        { id: 'qa_view_recurring', label: isVi ? 'Xem hóa đơn' : 'View Bills', actionType: 'view_recurring', targetRoute: '/recurring' }
      ]),
      futureSupportFlags: globalSupportFlags
    }));

    // Rule 3: Auto Savings Deposit (Paused Example)
    rules.push(Object.freeze({
      id: 'rule_auto_savings_sweep',
      name: isVi ? 'Tự động Trích Tiết kiệm Ngày nhận Lương' : 'Auto Savings Sweep on Salary Day',
      description: isVi ? 'Trích 10% số dư sang quỹ tiết kiệm tự động mỗi khi có thu nhập lương' : 'Sweep 10% of balance to savings goal when salary income arrives',
      category: 'auto_savings' as AutomationCategory,
      trigger: 'OnIncomeTransactionReceived',
      condition: 'amount >= 10000000',
      action: 'TransferToSavings(percent=10)',
      priority: 'high' as AutomationPriority,
      status: 'paused' as AutomationStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
      quickActions: Object.freeze([
        { id: 'qa_resume_savings_rule', label: isVi ? 'Kích hoạt lại' : 'Resume Rule', actionType: 'resume_rule', targetRoute: '/automation' }
      ]),
      futureSupportFlags: globalSupportFlags
    }));

    // Derive Suggestions from AI Coach or Plan or HabitEngineState
    if (coachSession) {
      suggestions.push(Object.freeze({
        id: 'sugg_ai_coach_auto_budget',
        reason: isVi ? 'AI Coach phát hiện chi tiêu nhà hàng tăng cao' : 'AI Coach detected elevated dining out expenses',
        recommendation: isVi ? 'Thiết lập Tự động Cảnh báo Ngân sách Ăn uống khi chạm mốc 80%' : 'Set up Auto Budget Warning for Dining at 80% threshold',
        confidence: 92,
        source: 'AICoachOrchestrator',
        priority: 'high' as AutomationPriority,
        category: 'auto_budget' as AutomationCategory,
        suggestedRule: Object.freeze({
          id: 'rule_sugg_dining_budget',
          name: isVi ? 'Cảnh báo Tự động Ngân sách Ăn uống' : 'Dining Budget Auto Warning',
          description: isVi ? 'Cảnh báo khi chi tiêu ăn uống vượt 80% ngân sách' : 'Warn when dining expenses exceed 80% of allocated budget',
          category: 'auto_budget' as AutomationCategory,
          trigger: 'OnExpenseLogged(category="Dining")',
          condition: 'spentPercent >= 80',
          action: 'NotifyUser("Ngân sách ăn uống sắp vượt ngưỡng")',
          priority: 'high' as AutomationPriority,
          status: 'suggested' as AutomationStatus,
          createdAt: nowIso,
          updatedAt: nowIso,
          quickActions: Object.freeze([
            { id: 'qa_apply_sugg_1', label: isVi ? 'Áp dụng Quy tắc' : 'Apply Rule', actionType: 'apply_rule', targetRoute: '/automation' }
          ]),
          futureSupportFlags: globalSupportFlags
        })
      }));
    }

    if (snapshot && snapshot.emergencyFund && !snapshot.emergencyFund.isSufficient) {
      suggestions.push(Object.freeze({
        id: 'sugg_emergency_fund_auto_transfer',
        reason: isVi ? 'Quỹ dự phòng hiện chưa đủ hạn mức an toàn 6 tháng' : 'Emergency fund is below the recommended 6-month buffer',
        recommendation: isVi ? 'Bật Quy tắc Tự động Tích lũy Quỹ Dự phòng 500,000 VND hàng tuần' : 'Enable Auto-Transfer of 500,000 VND weekly to Emergency Fund',
        confidence: 88,
        source: 'FinancialSnapshot',
        priority: 'medium' as AutomationPriority,
        category: 'auto_savings' as AutomationCategory,
        suggestedRule: Object.freeze({
          id: 'rule_sugg_ef_weekly',
          name: isVi ? 'Tự động Nạp Quỹ Dự phòng Hàng tuần' : 'Weekly Auto Emergency Fund Top-up',
          description: isVi ? 'Chuyển 500,000 VND vào Quỹ dự phòng mỗi thứ Hai' : 'Transfer 500,000 VND to Emergency reserve every Monday',
          category: 'auto_savings' as AutomationCategory,
          trigger: 'WeeklySchedule(day="Monday")',
          condition: 'walletBalance >= 1000000',
          action: 'TransferToEmergencyReserve(amount=500000)',
          priority: 'medium' as AutomationPriority,
          status: 'suggested' as AutomationStatus,
          createdAt: nowIso,
          updatedAt: nowIso,
          quickActions: Object.freeze([
            { id: 'qa_apply_sugg_2', label: isVi ? 'Kích hoạt Quy tắc' : 'Enable Rule', actionType: 'apply_rule', targetRoute: '/automation' }
          ]),
          futureSupportFlags: globalSupportFlags
        })
      }));
    }

    // History Preparation (Simulated execution definitions)
    history.push(Object.freeze({
      id: 'hist_1',
      ruleId: 'rule_auto_cat_salary',
      ruleName: isVi ? 'Tự động Phân loại Lương & Mua sắm' : 'Auto-Categorize Salary & Shopping',
      result: 'simulated' as const,
      timestamp: nowIso,
      reason: isVi ? 'Chuẩn bị sẵn sàng cho Engine thực thi tự động trong tương lai' : 'Ready definition prepared for future execution engine'
    }));

    // Apply category filtering if filterCategory is specified and not 'all'
    const filteredRules = filterCategory === 'all'
      ? rules
      : rules.filter(r => r.category === filterCategory);

    const filteredSuggestions = filterCategory === 'all'
      ? suggestions
      : suggestions.filter(s => s.category === filterCategory);

    // Filter Active and Paused rules
    const activeAutomations = filteredRules.filter(r => r.status === 'active');
    const pausedAutomations = filteredRules.filter(r => r.status === 'paused');

    // Statistics
    const totalRules = filteredRules.length;
    const activeRulesCount = activeAutomations.length;
    const pausedRulesCount = pausedAutomations.length;
    const suggestionsCount = filteredSuggestions.length;
    const historyItemsCount = history.length;
    const executionSuccessRatePercent = 100;

    const statistics: AutomationStatistics = Object.freeze({
      totalRules,
      activeRulesCount,
      pausedRulesCount,
      suggestionsCount,
      historyItemsCount,
      executionSuccessRatePercent
    });

    // Summary
    const summary: AutomationSummary = Object.freeze({
      headline: isVi
        ? `Trung tâm Tự động hóa với ${activeRulesCount} quy tắc đang hoạt động`
        : `Automation Center with ${activeRulesCount} active rules`,
      description: isVi
        ? 'Sẵn sàng kết hợp AI Coach và WorkManager để tự động hóa quản lý tài chính cá nhân.'
        : 'Ready definitions integrated with AI Coach and WorkManager for financial automation.',
      topSuggestedRuleName: filteredSuggestions[0]?.suggestedRule?.name,
      lastExecutedRuleName: history[0]?.ruleName,
      lastExecutedTimestamp: history[0]?.timestamp
    });

    const state: AutomationCenterState = {
      timestamp: nowIso,
      spaceId,
      language,
      automationRules: Object.freeze(filteredRules),
      suggestedAutomations: Object.freeze(filteredSuggestions),
      activeAutomations: Object.freeze(activeAutomations),
      pausedAutomations: Object.freeze(pausedAutomations),
      automationHistory: Object.freeze(history),
      statistics,
      summary,
      futureSupportFlags: globalSupportFlags
    };

    return Object.freeze(state);
  }
}
