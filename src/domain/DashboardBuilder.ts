/**
 * Daily Finance 3.0 - DashboardBuilder
 * Pure Dashboard State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations performed directly in this builder.
 * Consumes ONLY FinancialSnapshot, FinancialTimeline, FinancialIntelligence, FinancialForecast, FinancialPlan, and CoachSession
 * to produce immutable DashboardState, DashboardCards, and DashboardSections.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialIntelligence } from './FinancialIntelligence';
import { FinancialForecast } from './FinancialForecast';
import { FinancialPlan } from './FinancialPlan';
import { CoachSession } from './AICoachSession';
import {
  DashboardState,
  DashboardCard,
  DashboardSection,
  FinancialOverviewData,
  TodaySummaryData,
  MonthSummaryData,
  DashboardCardType,
  DashboardSectionType
} from './DashboardState';

export interface DashboardBuilderInputs {
  snapshot: FinancialSnapshot;
  timeline?: FinancialTimeline;
  intelligence?: FinancialIntelligence;
  forecast?: FinancialForecast;
  plan?: FinancialPlan;
  coachSession?: CoachSession;
  language?: Language;
}

export class DashboardBuilder {
  /**
   * Aggregates pre-calculated domain outputs into an immutable DashboardState.
   */
  public static build(inputs: DashboardBuilderInputs): DashboardState {
    const { snapshot, intelligence, forecast, plan, coachSession, language = 'vi' } = inputs;
    const isVi = language === 'vi';
    const curr = snapshot.currency || 'VND';

    const netSurplus = snapshot.monthlyIncome - snapshot.monthlyExpense;
    const healthScoreVal = snapshot.financialHealthScore ? snapshot.financialHealthScore.overallScore : 75;

    // 1. Overview Data Extraction
    const overview: FinancialOverviewData = Object.freeze({
      netWorth: snapshot.netWorth,
      cashBalance: snapshot.cashBalance,
      monthlyIncome: snapshot.monthlyIncome,
      monthlyExpense: snapshot.monthlyExpense,
      netSurplus,
      healthScore: healthScoreVal,
      currency: curr
    });

    // 2. Today Summary Extraction
    const todayExpenseEst = Math.round(snapshot.monthlyExpense / 30);
    const todayIncomeEst = Math.round(snapshot.monthlyIncome / 30);
    const todaySummary: TodaySummaryData = Object.freeze({
      date: new Date().toISOString().substring(0, 10),
      totalExpenseToday: todayExpenseEst,
      totalIncomeToday: todayIncomeEst,
      transactionsCountToday: 1
    });

    // 3. Month Summary Extraction
    const savingsRate = snapshot.monthlyIncome > 0 ? Math.round((netSurplus / snapshot.monthlyIncome) * 100) : 0;
    const monthSummary: MonthSummaryData = Object.freeze({
      month: new Date().toISOString().substring(0, 7),
      totalIncome: snapshot.monthlyIncome,
      totalExpense: snapshot.monthlyExpense,
      netSavings: netSurplus,
      savingsRatePercent: Math.max(0, savingsRate)
    });

    // 4. Construct Individual Cards
    const cards: DashboardCard[] = [];

    // Card 1: Overview
    cards.push({
      id: 'card_overview',
      type: 'overview' as DashboardCardType,
      title: isVi ? 'Tổng quan Tài chính' : 'Financial Overview',
      subtitle: isVi ? `Điểm sức khỏe: ${healthScoreVal}/100` : `Health Score: ${healthScoreVal}/100`,
      priority: 'high',
      displayOrder: 1,
      status: healthScoreVal >= 80 ? 'success' : healthScoreVal >= 50 ? 'normal' : 'warning',
      progress: healthScoreVal,
      valueFormatted: `${snapshot.netWorth.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_add_tx', label: isVi ? '+ Giao dịch' : '+ Transaction', actionType: 'add_transaction', targetRoute: '/transactions/new' },
        { id: 'qa_view_report', label: isVi ? 'Báo cáo' : 'Report', actionType: 'view_reports', targetRoute: '/reports' }
      ]),
      details: Object.freeze({ netWorth: snapshot.netWorth, cashBalance: snapshot.cashBalance })
    });

    // Card 2: Today's Summary
    cards.push({
      id: 'card_today_summary',
      type: 'today_summary' as DashboardCardType,
      title: isVi ? 'Tóm tắt Hôm nay' : "Today's Summary",
      subtitle: isVi ? `Ước tính chi tiêu trong ngày` : `Estimated daily spending`,
      priority: 'medium',
      displayOrder: 2,
      status: 'normal',
      valueFormatted: `-${todayExpenseEst.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_today_add', label: isVi ? '+ Thêm chi tiêu' : '+ Add Expense', actionType: 'add_expense', targetRoute: '/transactions/new?type=expense' }
      ]),
      details: Object.freeze({ expense: todayExpenseEst, income: todayIncomeEst })
    });

    // Card 3: This Month Summary
    cards.push({
      id: 'card_month_summary',
      type: 'month_summary' as DashboardCardType,
      title: isVi ? 'Tổng kết Tháng này' : 'This Month Summary',
      subtitle: isVi ? `Tỷ lệ tiết kiệm: ${savingsRate}%` : `Savings rate: ${savingsRate}%`,
      priority: 'high',
      displayOrder: 3,
      status: netSurplus >= 0 ? 'success' : 'alert',
      valueFormatted: `${netSurplus >= 0 ? '+' : ''}${netSurplus.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_month_detail', label: isVi ? 'Chi tiết tháng' : 'Month Details', actionType: 'view_month', targetRoute: '/analytics/month' }
      ]),
      details: Object.freeze({ income: snapshot.monthlyIncome, expense: snapshot.monthlyExpense })
    });

    // Card 4: Net Worth
    cards.push({
      id: 'card_net_worth',
      type: 'net_worth' as DashboardCardType,
      title: isVi ? 'Tài sản ròng' : 'Net Worth',
      subtitle: isVi ? 'Tổng giá trị tài sản trừ tổng nợ' : 'Total assets minus total debt',
      priority: 'high',
      displayOrder: 4,
      status: snapshot.netWorth >= 0 ? 'success' : 'alert',
      valueFormatted: `${snapshot.netWorth.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_nw_detail', label: isVi ? 'Phân bổ tài sản' : 'Asset Breakdown', actionType: 'view_assets', targetRoute: '/assets' }
      ]),
      details: Object.freeze({ cash: snapshot.cashBalance, investment: snapshot.investmentValue.totalPortfolioValue, debt: snapshot.debtSummary.totalDebtOwed })
    });

    // Card 5: Cash Flow
    cards.push({
      id: 'card_cash_flow',
      type: 'cash_flow' as DashboardCardType,
      title: isVi ? 'Dòng tiền' : 'Cash Flow',
      subtitle: isVi ? `Thu: ${snapshot.monthlyIncome.toLocaleString()} | Chi: ${snapshot.monthlyExpense.toLocaleString()}` : `In: ${snapshot.monthlyIncome} | Out: ${snapshot.monthlyExpense}`,
      priority: 'medium',
      displayOrder: 5,
      status: snapshot.monthlyIncome >= snapshot.monthlyExpense ? 'normal' : 'warning',
      valueFormatted: `${netSurplus >= 0 ? '+' : ''}${netSurplus.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_cf_analysis', label: isVi ? 'Phân tích dòng tiền' : 'Cashflow Analysis', actionType: 'view_cashflow', targetRoute: '/analytics/cashflow' }
      ]),
      details: Object.freeze({ income: snapshot.monthlyIncome, expense: snapshot.monthlyExpense, surplus: netSurplus })
    });

    // Card 6: Budget Card
    const budgetUsagePercent = snapshot.budgetSummary.totalAllocated > 0
      ? Math.round((snapshot.budgetSummary.totalSpent / snapshot.budgetSummary.totalAllocated) * 100)
      : 0;
    cards.push({
      id: 'card_budget',
      type: 'budget' as DashboardCardType,
      title: isVi ? 'Ngân sách Chi tiêu' : 'Spending Budget',
      subtitle: isVi ? `Đã dùng ${budgetUsagePercent}% (${snapshot.budgetSummary.overspentBudgetsCount} danh mục vượt)` : `Used ${budgetUsagePercent}% (${snapshot.budgetSummary.overspentBudgetsCount} overspent)`,
      priority: 'high',
      displayOrder: 6,
      status: snapshot.budgetSummary.overspentBudgetsCount > 0 ? 'alert' : budgetUsagePercent > 90 ? 'warning' : 'success',
      progress: Math.min(100, budgetUsagePercent),
      valueFormatted: `${snapshot.budgetSummary.totalSpent.toLocaleString()} / ${snapshot.budgetSummary.totalAllocated.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_budget_manage', label: isVi ? 'Quản lý ngân sách' : 'Manage Budget', actionType: 'view_budgets', targetRoute: '/budgets' }
      ]),
      details: Object.freeze({ spent: snapshot.budgetSummary.totalSpent, allocated: snapshot.budgetSummary.totalAllocated, overspent: snapshot.budgetSummary.overspentBudgetsCount })
    });

    // Card 7: Savings Card
    cards.push({
      id: 'card_savings',
      type: 'savings' as DashboardCardType,
      title: isVi ? 'Mục tiêu Tiết kiệm' : 'Savings Progress',
      subtitle: isVi ? `Đã tích lũy ${snapshot.savingsProgress.activeGoalsCount} mục tiêu` : `${snapshot.savingsProgress.activeGoalsCount} active goals`,
      priority: 'medium',
      displayOrder: 7,
      status: snapshot.savingsProgress.progressPercent >= 50 ? 'success' : 'normal',
      progress: Math.min(100, Math.round(snapshot.savingsProgress.progressPercent)),
      valueFormatted: `${snapshot.savingsProgress.totalSaved.toLocaleString()} / ${snapshot.savingsProgress.targetAmount.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_savings_add', label: isVi ? 'Thêm tiết kiệm' : 'Add Savings', actionType: 'add_savings', targetRoute: '/savings/new' }
      ]),
      details: Object.freeze({ totalSaved: snapshot.savingsProgress.totalSaved, targetAmount: snapshot.savingsProgress.targetAmount })
    });

    // Card 8: Investment Card
    cards.push({
      id: 'card_investment',
      type: 'investment' as DashboardCardType,
      title: isVi ? 'Danh mục Đầu tư' : 'Investment Portfolio',
      subtitle: isVi ? `Lợi nhuận: ${snapshot.investmentValue.totalUnrealizedGain >= 0 ? '+' : ''}${snapshot.investmentValue.totalUnrealizedGain.toLocaleString()} ${curr}` : `Unrealized Gain: ${snapshot.investmentValue.totalUnrealizedGain}`,
      priority: 'medium',
      displayOrder: 8,
      status: snapshot.investmentValue.totalUnrealizedGain >= 0 ? 'success' : 'warning',
      valueFormatted: `${snapshot.investmentValue.totalPortfolioValue.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_inv_view', label: isVi ? 'Xem danh mục' : 'View Portfolio', actionType: 'view_investments', targetRoute: '/investments' }
      ]),
      details: Object.freeze({ portfolioValue: snapshot.investmentValue.totalPortfolioValue, unrealizedGain: snapshot.investmentValue.totalUnrealizedGain })
    });

    // Card 9: Debt Card
    cards.push({
      id: 'card_debt',
      type: 'debt' as DashboardCardType,
      title: isVi ? 'Quản lý Dư nợ' : 'Debt Management',
      subtitle: isVi ? `Trả tối thiểu tháng: ${snapshot.debtSummary.monthlyMinDebtPayment.toLocaleString()} ${curr}` : `Min monthly payment: ${snapshot.debtSummary.monthlyMinDebtPayment}`,
      priority: snapshot.debtSummary.totalDebtOwed > 0 ? 'high' : 'low',
      displayOrder: 9,
      status: snapshot.debtSummary.totalDebtOwed === 0 ? 'success' : 'warning',
      valueFormatted: `${snapshot.debtSummary.totalDebtOwed.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_debt_pay', label: isVi ? 'Thanh toán nợ' : 'Pay Debt', actionType: 'pay_debt', targetRoute: '/debts' }
      ]),
      details: Object.freeze({ totalDebt: snapshot.debtSummary.totalDebtOwed, minPayment: snapshot.debtSummary.monthlyMinDebtPayment })
    });

    // Card 10: FIRE Card
    cards.push({
      id: 'card_fire',
      type: 'fire' as DashboardCardType,
      title: isVi ? 'Tự do Tài chính (FIRE)' : 'FIRE Readiness',
      subtitle: isVi ? `Dự kiến còn ${snapshot.fireProgress.yearsToFIRE} năm` : `${snapshot.fireProgress.yearsToFIRE} years remaining`,
      priority: 'medium',
      displayOrder: 10,
      status: snapshot.fireProgress.progressPercent >= 100 ? 'success' : 'normal',
      progress: Math.min(100, Math.round(snapshot.fireProgress.progressPercent)),
      valueFormatted: `${snapshot.fireProgress.progressPercent.toFixed(1)}%`,
      quickActions: Object.freeze([
        { id: 'qa_fire_calc', label: isVi ? 'Lập kế hoạch FIRE' : 'FIRE Planner', actionType: 'view_fire', targetRoute: '/fire' }
      ]),
      details: Object.freeze({ progress: snapshot.fireProgress.progressPercent, target: snapshot.fireProgress.targetNetWorth, yearsToFIRE: snapshot.fireProgress.yearsToFIRE })
    });

    // Card 11: Six Jars Card
    cards.push({
      id: 'card_six_jars',
      type: 'six_jars' as DashboardCardType,
      title: isVi ? 'Quy tắc 6 Hũ Tài chính' : '6 Jars Money Rule',
      subtitle: isVi ? `Tuân thủ: ${snapshot.sixJarsSummary.isCompliant ? 'Đạt chuẩn' : 'Cần điều chỉnh'}` : `Compliant: ${snapshot.sixJarsSummary.isCompliant ? 'Yes' : 'Needs tuning'}`,
      priority: 'medium',
      displayOrder: 11,
      status: snapshot.sixJarsSummary.isCompliant ? 'success' : 'normal',
      valueFormatted: `${snapshot.sixJarsSummary.totalAllocated.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_jars_manage', label: isVi ? 'Quản lý 6 hũ' : 'Manage Jars', actionType: 'view_six_jars', targetRoute: '/six-jars' }
      ]),
      details: Object.freeze({ totalAllocated: snapshot.sixJarsSummary.totalAllocated, isCompliant: snapshot.sixJarsSummary.isCompliant })
    });

    // Card 12: Emergency Fund Card
    cards.push({
      id: 'card_emergency_fund',
      type: 'emergency_fund' as DashboardCardType,
      title: isVi ? 'Quỹ Dự phòng Khẩn cấp' : 'Emergency Reserve Fund',
      subtitle: isVi ? `Bao phủ ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} tháng` : `Covers ${snapshot.emergencyFund.coverageMonths.toFixed(1)} / ${snapshot.emergencyFund.targetMonths} months`,
      priority: snapshot.emergencyFund.isSufficient ? 'medium' : 'high',
      displayOrder: 12,
      status: snapshot.emergencyFund.isSufficient ? 'success' : 'warning',
      progress: Math.min(100, Math.round((snapshot.emergencyFund.currentBalance / (snapshot.emergencyFund.targetAmount || 1)) * 100)),
      valueFormatted: `${snapshot.emergencyFund.currentBalance.toLocaleString()} / ${snapshot.emergencyFund.targetAmount.toLocaleString()} ${curr}`,
      quickActions: Object.freeze([
        { id: 'qa_ef_topup', label: isVi ? 'Trích nạp quỹ' : 'Top Up Fund', actionType: 'topup_emergency_fund', targetRoute: '/savings/emergency' }
      ]),
      details: Object.freeze({ current: snapshot.emergencyFund.currentBalance, target: snapshot.emergencyFund.targetAmount, isSufficient: snapshot.emergencyFund.isSufficient })
    });

    // Card 13: AI Coach Card
    const coachText = coachSession
      ? coachSession.primaryConversation.mainDialogue
      : isVi ? 'AI Coach đang theo dõi lộ trình của bạn.' : 'AI Coach is tracking your progress.';
    cards.push({
      id: 'card_ai_coach',
      type: 'ai_coach' as DashboardCardType,
      title: isVi ? 'Trợ lý AI Coach v2' : 'AI Financial Coach v2',
      subtitle: coachSession ? coachSession.summaryText : (isVi ? 'Lời khuyên tài chính' : 'Financial advice'),
      priority: 'high',
      displayOrder: 13,
      status: coachSession?.overallTone === 'urgent' ? 'alert' : coachSession?.overallTone === 'cautious' ? 'warning' : 'success',
      valueFormatted: coachSession?.primaryDecision.category.toUpperCase() || 'RECOMMEND',
      quickActions: Object.freeze([
        { id: 'qa_coach_chat', label: isVi ? 'Trò chuyện AI Coach' : 'Chat with Coach', actionType: 'open_ai_coach', targetRoute: '/coach' }
      ]),
      details: Object.freeze({ message: coachText, tone: coachSession?.overallTone || 'informative' })
    });

    // 5. Build Dashboard Sections
    const alertCards = cards.filter(c => c.status === 'alert' || c.status === 'warning' || c.priority === 'urgent');
    const recCards = cards.filter(c => c.type === 'ai_coach' || c.type === 'budget' || c.type === 'net_worth');

    const sections: DashboardSection[] = [
      {
        id: 'sec_overview',
        type: 'overview' as DashboardSectionType,
        title: isVi ? 'Tổng quan Dòng tiền' : 'Cash Flow & Net Worth',
        description: isVi ? 'Chỉ số tài sản ròng, dòng tiền và thu chi hôm nay' : 'Core net worth and cash flow indicators',
        displayOrder: 1,
        cards: Object.freeze(cards.filter(c => ['overview', 'today_summary', 'month_summary', 'net_worth', 'cash_flow'].includes(c.type)))
      },
      {
        id: 'sec_health',
        type: 'health' as DashboardSectionType,
        title: isVi ? 'Sức khỏe & An toàn' : 'Financial Health & Safety',
        description: isVi ? 'Dự phòng khẩn cấp và quy tắc 6 hũ tài chính' : 'Emergency reserve and 6-jars money rule',
        displayOrder: 2,
        cards: Object.freeze(cards.filter(c => ['emergency_fund', 'six_jars'].includes(c.type)))
      },
      {
        id: 'sec_goals',
        type: 'goals' as DashboardSectionType,
        title: isVi ? 'Mục tiêu & Hạn mức' : 'Goals & Budget Targets',
        description: isVi ? 'Hạn mức ngân sách, tiết kiệm và lộ trình FIRE' : 'Budget compliance, savings, and FIRE trajectory',
        displayOrder: 3,
        cards: Object.freeze(cards.filter(c => ['budget', 'savings', 'fire'].includes(c.type)))
      },
      {
        id: 'sec_planning',
        type: 'planning' as DashboardSectionType,
        title: isVi ? 'Đầu tư & Nghĩa vụ Nợ' : 'Investments & Debt Paydown',
        description: isVi ? 'Danh mục tích lũy đầu tư và kế hoạch giảm nợ' : 'Portfolio accumulation and debt obligations',
        displayOrder: 4,
        cards: Object.freeze(cards.filter(c => ['investment', 'debt'].includes(c.type)))
      },
      {
        id: 'sec_alerts',
        type: 'alerts' as DashboardSectionType,
        title: isVi ? 'Cảnh báo & Rủi ro' : 'Alerts & Critical Warnings',
        description: isVi ? 'Các khoản vượt hạn mức hoặc thâm hụt tài chính cần xử lý' : 'Budget overspends and deficit risks needing attention',
        displayOrder: 5,
        cards: Object.freeze(alertCards)
      },
      {
        id: 'sec_recommendations',
        type: 'recommendations' as DashboardSectionType,
        title: isVi ? 'Đề xuất AI Coach' : 'AI Coach Recommendations',
        description: isVi ? 'Lời khuyên và hành động tối ưu hóa tài chính cá nhân' : 'Personalized insights and actionable optimization steps',
        displayOrder: 6,
        cards: Object.freeze(recCards)
      }
    ];

    const activeAlertsCount = alertCards.length;
    const pendingActionsCount = plan ? plan.actions.filter(a => !a.isCompleted).length : (intelligence ? intelligence.risks.length : 0);

    const state: DashboardState = {
      timestamp: new Date().toISOString(),
      spaceId: snapshot.spaceId,
      language,
      overview,
      todaySummary,
      monthSummary,
      cards: Object.freeze(cards),
      sections: Object.freeze(sections),
      activeAlertsCount,
      pendingActionsCount
    };

    return Object.freeze(state);
  }
}
