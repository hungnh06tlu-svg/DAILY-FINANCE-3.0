/**
 * Daily Finance 2.5 - AICoachEngine
 * Domain Engine - Pure decision orchestration for AI Coach (TASK 1).
 * Analyzes health, ranks priorities, generates insights, recommendations, risks, opportunities, action plans.
 * ZERO repository access. ZERO formatting. ZERO financial calculations.
 * All financial calculations remain in FinancialTruthEngine.
 * Uses IdGenerator for all generated identifiers.
 */

import {
  CoachHealth,
  CoachHealthCategory,
  CoachCategoryHealthDetail,
  CoachInsight,
  CoachRecommendation,
  CoachRecommendationType,
  CoachPriority,
  CoachPriorityLevel,
  CoachRisk,
  CoachRiskSeverity,
  CoachOpportunity,
  CoachAction,
  CoachActionPlan,
  CoachAchievement,
  CoachNotification,
  CoachSummary,
  CoachStatistics,
  CoachHistory,
  CoachWidget,
  Language
} from '../types';
import { IdGenerator } from '../services/IdGenerator';

export interface FinancialSnapshotInput {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  monthlyInvestment: number;
  totalDebt: number;
  totalAssets: number;
  totalSavingsBalance: number;
  activeBudgetsCount: number;
  overspentBudgetsCount: number;
  fireProgressPercent: number;
  fireYearsRemaining: number;
  sixJarsCompliant: boolean;
  recentTransactionCount: number;
}

export class AICoachEngine {
  /**
   * TASK 8: Analyzes Financial Health across 8 Categories.
   */
  static analyzeHealth(snapshot: FinancialSnapshotInput, language: Language = 'vi'): CoachHealth {
    const income = Math.max(1, snapshot.monthlyIncome);
    const expense = snapshot.monthlyExpense;
    const netCashFlow = snapshot.monthlyIncome - snapshot.monthlyExpense;

    // 1. Cash Flow Score
    const cashFlowRatio = netCashFlow / income;
    let cashFlowScore = 50;
    if (cashFlowRatio >= 0.3) cashFlowScore = 100;
    else if (cashFlowRatio >= 0.15) cashFlowScore = 80;
    else if (cashFlowRatio >= 0) cashFlowScore = 60;
    else cashFlowScore = 20;

    // 2. Emergency Fund Score (Months of expenses covered by liquid savings)
    const expenseBase = Math.max(1, expense);
    const emergencyMonths = snapshot.totalSavingsBalance / expenseBase;
    let emergencyScore = 30;
    if (emergencyMonths >= 6) emergencyScore = 100;
    else if (emergencyMonths >= 3) emergencyScore = 80;
    else if (emergencyMonths >= 1) emergencyScore = 50;
    else emergencyScore = 20;

    // 3. Savings Score
    const savingsRate = snapshot.monthlySavings / income;
    let savingsScore = 40;
    if (savingsRate >= 0.3) savingsScore = 100;
    else if (savingsRate >= 0.2) savingsScore = 80;
    else if (savingsRate >= 0.1) savingsScore = 60;
    else savingsScore = 30;

    // 4. Investment Score
    const investmentRate = snapshot.monthlyInvestment / income;
    let investmentScore = 30;
    if (investmentRate >= 0.2) investmentScore = 100;
    else if (investmentRate >= 0.1) investmentScore = 75;
    else if (investmentRate > 0) investmentScore = 50;
    else investmentScore = 20;

    // 5. Debt Score
    const debtRatio = snapshot.netWorth > 0 ? snapshot.totalDebt / snapshot.netWorth : snapshot.totalDebt > 0 ? 1 : 0;
    let debtScore = 100;
    if (debtRatio > 0.5) debtScore = 30;
    else if (debtRatio > 0.2) debtScore = 60;
    else if (debtRatio > 0) debtScore = 80;

    // 6. Budget Score
    let budgetScore = 90;
    if (snapshot.activeBudgetsCount > 0) {
      const overspentRatio = snapshot.overspentBudgetsCount / snapshot.activeBudgetsCount;
      if (overspentRatio === 0) budgetScore = 100;
      else if (overspentRatio <= 0.3) budgetScore = 70;
      else budgetScore = 40;
    }

    // 7. Financial Discipline Score
    let disciplineScore = 70;
    if (snapshot.sixJarsCompliant) disciplineScore += 15;
    if (snapshot.recentTransactionCount >= 10) disciplineScore += 15;
    disciplineScore = Math.min(100, disciplineScore);

    // 8. FIRE Progress Score
    const fireScore = Math.min(100, Math.max(10, Math.round(snapshot.fireProgressPercent)));

    const categories: Record<CoachHealthCategory, CoachCategoryHealthDetail> = {
      cash_flow: {
        category: 'cash_flow',
        score: cashFlowScore,
        status: cashFlowScore >= 80 ? 'excellent' : cashFlowScore >= 60 ? 'good' : cashFlowScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Dòng tiền ròng: ${netCashFlow >= 0 ? 'Thặng dư' : 'Thâm hụt'}` : `Net Cash Flow: ${netCashFlow >= 0 ? 'Surplus' : 'Deficit'}`
      },
      emergency_fund: {
        category: 'emergency_fund',
        score: emergencyScore,
        status: emergencyScore >= 80 ? 'excellent' : emergencyScore >= 60 ? 'good' : emergencyScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Dự phòng được ${emergencyMonths.toFixed(1)} tháng chi phí` : `Emergency fund covers ${emergencyMonths.toFixed(1)} months`
      },
      savings: {
        category: 'savings',
        score: savingsScore,
        status: savingsScore >= 80 ? 'excellent' : savingsScore >= 60 ? 'good' : savingsScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Tỷ lệ tích lũy ${(savingsRate * 100).toFixed(1)}%` : `Savings rate ${(savingsRate * 100).toFixed(1)}%`
      },
      investment: {
        category: 'investment',
        score: investmentScore,
        status: investmentScore >= 80 ? 'excellent' : investmentScore >= 60 ? 'good' : investmentScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Tỷ lệ đầu tư ${(investmentRate * 100).toFixed(1)}%` : `Investment rate ${(investmentRate * 100).toFixed(1)}%`
      },
      debt: {
        category: 'debt',
        score: debtScore,
        status: debtScore >= 80 ? 'excellent' : debtScore >= 60 ? 'good' : debtScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Chỉ số nợ/tài sản ${(debtRatio * 100).toFixed(1)}%` : `Debt ratio ${(debtRatio * 100).toFixed(1)}%`
      },
      budget: {
        category: 'budget',
        score: budgetScore,
        status: budgetScore >= 80 ? 'excellent' : budgetScore >= 60 ? 'good' : budgetScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Ngân sách vượt: ${snapshot.overspentBudgetsCount}/${snapshot.activeBudgetsCount}` : `Overspent budgets: ${snapshot.overspentBudgetsCount}/${snapshot.activeBudgetsCount}`
      },
      financial_discipline: {
        category: 'financial_discipline',
        score: disciplineScore,
        status: disciplineScore >= 80 ? 'excellent' : disciplineScore >= 60 ? 'good' : disciplineScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? 'Kỷ luật ghi chép & phân bổ 6 hũ' : 'Discipline in logging & Six Jars'
      },
      fire_progress: {
        category: 'fire_progress',
        score: fireScore,
        status: fireScore >= 80 ? 'excellent' : fireScore >= 60 ? 'good' : fireScore >= 40 ? 'warning' : 'critical',
        summary: language === 'vi' ? `Tiến độ FIRE đạt ${snapshot.fireProgressPercent}%` : `FIRE progress at ${snapshot.fireProgressPercent}%`
      }
    };

    const overallScore = Math.round(
      (cashFlowScore * 0.15 +
        emergencyScore * 0.15 +
        savingsScore * 0.15 +
        investmentScore * 0.15 +
        debtScore * 0.15 +
        budgetScore * 0.1 +
        disciplineScore * 0.05 +
        fireScore * 0.1)
    );

    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    let grade = 'B';
    if (overallScore >= 85) { status = 'excellent'; grade = 'A+'; }
    else if (overallScore >= 70) { status = 'good'; grade = 'A'; }
    else if (overallScore >= 55) { status = 'good'; grade = 'B'; }
    else if (overallScore >= 40) { status = 'warning'; grade = 'C'; }
    else { status = 'critical'; grade = 'D'; }

    return {
      overallScore,
      status,
      grade,
      categories
    };
  }

  /**
   * Generates AI Coach Insights based on health & snapshot.
   */
  static generateInsights(snapshot: FinancialSnapshotInput, health: CoachHealth, language: Language = 'vi'): CoachInsight[] {
    const insights: CoachInsight[] = [];

    if (health.categories.emergency_fund.score < 60) {
      insights.push({
        id: IdGenerator.generateId('ins_ef'),
        category: 'emergency_fund',
        title: language === 'vi' ? 'Quỹ Dự Phòng Chưa Đạt Chuẩn' : 'Emergency Fund Below Benchmark',
        description: language === 'vi'
          ? 'Quỹ dự phòng hiện chưa đủ 3-6 tháng chi phí sinh hoạt. Đây là rào chắn an toàn tài chính quan trọng nhất.'
          : 'Emergency fund is below 3-6 months of expenses. Building this is your top priority safety net.',
        impactScore: 85,
        code: 'low_emergency_fund',
        actionLinkDomain: 'savings',
        createdAt: new Date().toISOString()
      });
    }

    if (snapshot.monthlyExpense > snapshot.monthlyIncome) {
      insights.push({
        id: IdGenerator.generateId('ins_deficit'),
        category: 'cash_flow',
        title: language === 'vi' ? 'Cảnh Báo Thâm Hụt Dòng Tiền' : 'Cash Flow Deficit Warning',
        description: language === 'vi'
          ? 'Chi tiêu hàng tháng đang vượt quá thu nhập. Cần rà soát và cắt giảm ngân sách khẩn cấp.'
          : 'Monthly expenses exceed monthly income. Urgent budget audit recommended.',
        impactScore: 95,
        code: 'cash_flow_deficit',
        actionLinkDomain: 'budget',
        createdAt: new Date().toISOString()
      });
    }

    if (snapshot.totalDebt > 0 && health.categories.debt.score < 70) {
      insights.push({
        id: IdGenerator.generateId('ins_debt'),
        category: 'debt',
        title: language === 'vi' ? 'Áp Lực Nợ Tác Động Tới Lợi Nhuận' : 'Debt Burden Affecting Growth',
        description: language === 'vi'
          ? 'Các khoản nợ đang làm giảm tốc độ tích lũy tài sản. Áp dụng trả nợ Snowball/Avalanche.'
          : 'Debt load slows net worth growth. Apply Snowball/Avalanche repayment strategy.',
        impactScore: 80,
        code: 'high_debt_burden',
        actionLinkDomain: 'loansDebts',
        createdAt: new Date().toISOString()
      });
    }

    if (snapshot.fireProgressPercent >= 25) {
      insights.push({
        id: IdGenerator.generateId('ins_fire'),
        category: 'fire_progress',
        title: language === 'vi' ? 'Cột Mốc FIRE Đáng Ghi Nhận' : 'Notable FIRE Progress',
        description: language === 'vi'
          ? `Bạn đã hoàn thành ${snapshot.fireProgressPercent}% chặng đường tự do tài chính. Tiếp tục duy trì kỷ luật!`
          : `You have completed ${snapshot.fireProgressPercent}% of your Financial Independence milestone.`,
        impactScore: 70,
        code: 'fire_milestone_progress',
        actionLinkDomain: 'fireTracking',
        createdAt: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * TASK 9: Generates Recommendations across 9 Types.
   */
  static generateRecommendations(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): CoachRecommendation[] {
    const recs: CoachRecommendation[] = [];

    // 1. Emergency Fund
    if (health.categories.emergency_fund.score < 60) {
      recs.push({
        id: IdGenerator.generateId('rec_ef'),
        type: 'emergency_fund',
        category: 'emergency_fund',
        title: language === 'vi' ? 'Xây Dựng Quỹ Dự Phòng Khẩn Cấp' : 'Build Emergency Fund',
        description: language === 'vi' ? 'Trích lập tối thiểu 10% thu nhập hàng tháng vào hũ/ví dự phòng riêng biệt.' : 'Allocate at least 10% monthly income into a dedicated emergency fund.',
        rationale: language === 'vi' ? 'Bảo vệ tài chính trước các sự cố bất ngờ mà không phải vay nợ.' : 'Protects against unforeseen events without resorting to debt.',
        actionableStep: language === 'vi' ? 'Tạo Mục Tiêu Tiết Kiệm "Quỹ Dự Phòng" với target 3 tháng chi phí.' : 'Create a "Emergency Fund" Savings Goal targeted for 3 months expenses.',
        priority: 'critical'
      });
    }

    // 2. Reduce Spending
    if (snapshot.monthlyExpense > snapshot.monthlyIncome * 0.7) {
      recs.push({
        id: IdGenerator.generateId('rec_red'),
        type: 'reduce_spending',
        category: 'budget',
        title: language === 'vi' ? 'Cắt Giảm Chi Tiêu Không Thiết Yếu' : 'Reduce Non-Essential Spending',
        description: language === 'vi' ? 'Chi tiêu đang chiếm tỉ trọng lớn. Cần rà soát danh mục NEC trong 6 hũ.' : 'Expenses consume a large income portion. Audit NEC jar spending.',
        rationale: language === 'vi' ? 'Giải phóng dòng tiền thặng dư để chuyển sang tiết kiệm và đầu tư.' : 'Frees up cash flow to allocate towards savings and investments.',
        actionableStep: language === 'vi' ? 'Cắt giảm 10% ngân sách giải trí (PLAY) và mua sắm trong tháng này.' : 'Trim 10% PLAY and shopping budget this month.',
        priority: 'high'
      });
    }

    // 3. Pay Debt
    if (snapshot.totalDebt > 0) {
      recs.push({
        id: IdGenerator.generateId('rec_debt'),
        type: 'pay_debt',
        category: 'debt',
        title: language === 'vi' ? 'Tăng Tốc Trả Nợ Lãi Cao' : 'Accelerate High-Interest Debt Repayment',
        description: language === 'vi' ? 'Ưu tiên trả khoản nợ có lãi suất cao nhất trước.' : 'Prioritize clearing debts with highest interest rates.',
        rationale: language === 'vi' ? 'Giảm chi phí lãi vay hàng tháng, cải thiện điểm sức khỏe tài chính.' : 'Reduces monthly interest drag, boosting overall health score.',
        actionableStep: language === 'vi' ? 'Trích thêm 1,000,000 ₫/tháng vào khoản nợ ưu tiên.' : 'Add 1,000,000 ₫ monthly surplus into priority debt item.',
        priority: 'high'
      });
    }

    // 4. Increase Investment
    if (health.categories.investment.score < 60 && snapshot.totalSavingsBalance > snapshot.monthlyExpense * 3) {
      recs.push({
        id: IdGenerator.generateId('rec_inv'),
        type: 'increase_investment',
        category: 'investment',
        title: language === 'vi' ? 'Chuyển Tiền Nhàn Rỗi Sang Đầu Tư' : 'Shift Surplus Savings to Investments',
        description: language === 'vi' ? 'Gửi tiết kiệm đơn thuần không đủ vượt lạm phát long-term.' : 'Cash savings alone will not beat long-term inflation.',
        rationale: language === 'vi' ? 'Gia tăng tốc độ tăng trưởng tài sản qua lãi kép.' : 'Accelerates net worth accumulation through compound growth.',
        actionableStep: language === 'vi' ? 'Trích 20% tiền thặng dư hàng tháng vào danh mục đầu tư FFA.' : 'Allocate 20% monthly surplus into FFA investment portfolio.',
        priority: 'medium'
      });
    }

    // 5. Optimize Six Jars
    if (!snapshot.sixJarsCompliant) {
      recs.push({
        id: IdGenerator.generateId('rec_jars'),
        type: 'optimize_six_jars',
        category: 'financial_discipline',
        title: language === 'vi' ? 'Tối Ưu Hóa Phân Bổ 6 Hũ' : 'Optimize Six Jars Allocation',
        description: language === 'vi' ? 'Điều chỉnh tỷ lệ phân bổ 6 hũ phù hợp với thu nhập thực tế.' : 'Adjust 6 Jars allocation ratios to match actual income.',
        rationale: language === 'vi' ? 'Duy trì sự cân bằng giữa sinh hoạt, tự do tài chính và hưởng thụ.' : 'Maintains balance between necessity, FFA, and enjoyment.',
        actionableStep: language === 'vi' ? 'Đánh dấu quy tắc phân bổ tự động 6 hũ khi nhập giao dịch thu nhập.' : 'Enable auto-allocation rule when entering income transactions.',
        priority: 'medium'
      });
    }

    // 6. Accelerate FIRE
    if (snapshot.fireYearsRemaining > 15) {
      recs.push({
        id: IdGenerator.generateId('rec_fire'),
        type: 'accelerate_fire',
        category: 'fire_progress',
        title: language === 'vi' ? 'Rút Ngắn Tiến Độ Nghỉ Hưu FIRE' : 'Accelerate FIRE Retirement Timeline',
        description: language === 'vi' ? 'Tăng 5% tỷ lệ tiết kiệm để rút ngắn 2-4 năm đến mục tiêu FIRE.' : 'Increase savings rate by 5% to shave 2-4 years off FIRE age.',
        rationale: language === 'vi' ? 'Tận dụng sức mạnh lãi kép theo thời gian.' : 'Leverages compounding interest over time.',
        actionableStep: language === 'vi' ? 'Tăng khoản đầu tư hàng tháng thêm 5% thu nhập.' : 'Boost monthly investment amount by 5% income.',
        priority: 'low'
      });
    }

    return recs;
  }

  /**
   * TASK 10 & 11: Generates Risks & Priorities.
   */
  static generateRisks(snapshot: FinancialSnapshotInput, health: CoachHealth, language: Language = 'vi'): CoachRisk[] {
    const risks: CoachRisk[] = [];

    if (snapshot.monthlyExpense > snapshot.monthlyIncome) {
      risks.push({
        id: IdGenerator.generateId('rsk_deficit'),
        severity: 'critical',
        domain: 'cash_flow',
        title: language === 'vi' ? 'Rủi Ro Thâm Hụt Tài Chính Chi Cực Lớn' : 'Critical Cash Deficit Risk',
        description: language === 'vi' ? 'Chi tiêu lớn hơn thu nhập kéo dài dẫn tới cạn kiệt tài sản.' : 'Sustained expense exceeding income leads to asset erosion.',
        mitigationStrategy: language === 'vi' ? 'Cắt giảm khẩn cấp chi tiêu ăn uống & giải trí.' : 'Urgent cut on dining & entertainment expenses.',
        riskScore: 90
      });
    }

    if (snapshot.totalDebt > snapshot.netWorth * 0.5 && snapshot.totalDebt > 0) {
      risks.push({
        id: IdGenerator.generateId('rsk_debt'),
        severity: 'high',
        domain: 'debt',
        title: language === 'vi' ? 'Rủi Ro Tỷ Lệ Nợ/Tài Sản Cao' : 'High Debt-to-Asset Ratio Risk',
        description: language === 'vi' ? 'Dễ rơi vào mất khả năng thanh toán nếu biến cố thu nhập xảy ra.' : 'Vulnerable to insolvency during sudden income loss.',
        mitigationStrategy: language === 'vi' ? 'Áp dụng kế hoạch trả nợ dứt điểm.' : 'Apply focused debt paydown strategy.',
        riskScore: 75
      });
    }

    if (snapshot.overspentBudgetsCount > 0) {
      risks.push({
        id: IdGenerator.generateId('rsk_budget'),
        severity: 'medium',
        domain: 'budget',
        title: language === 'vi' ? 'Rủi Ro Vỡ Ngân Sách Hàng Tháng' : 'Monthly Budget Overrun Risk',
        description: language === 'vi' ? `${snapshot.overspentBudgetsCount} danh mục đã chi tiêu vượt định mức.` : `${snapshot.overspentBudgetsCount} budget categories overspent.`,
        mitigationStrategy: language === 'vi' ? 'Đặt cảnh báo khi chạm mốc 80% hạn mức.' : 'Set warning alerts at 80% limit threshold.',
        riskScore: 55
      });
    }

    return risks;
  }

  /**
   * Generates Opportunities.
   */
  static generateOpportunities(snapshot: FinancialSnapshotInput, health: CoachHealth, language: Language = 'vi'): CoachOpportunity[] {
    const opps: CoachOpportunity[] = [];

    const surplus = Math.max(0, snapshot.monthlyIncome - snapshot.monthlyExpense);
    if (surplus > 0) {
      opps.push({
        id: IdGenerator.generateId('opp_surplus'),
        domain: 'savings',
        title: language === 'vi' ? 'Cơ Hội Tăng Tốc Tích Lũy Từ Thặng Dư' : 'Accelerate Accumulation From Monthly Surplus',
        description: language === 'vi' ? 'Thặng dư dòng tiền hàng tháng có thể tối ưu cho khoản đầu tư.' : 'Monthly cash flow surplus can be optimized into investments.',
        potentialGain: surplus * 12,
        formattedPotentialGain: `+${Math.round(surplus * 12 / 1000000)}Tr/năm`,
        difficulty: 'easy'
      });
    }

    if (health.categories.investment.score < 50 && snapshot.totalSavingsBalance > 100000000) {
      opps.push({
        id: IdGenerator.generateId('opp_inv'),
        domain: 'investment',
        title: language === 'vi' ? 'Tận Dụng Lãi Kép Quỹ Tự Do Tài Chính' : 'Leverage Financial Freedom Compound Growth',
        description: language === 'vi' ? 'Tối ưu nguồn tiền nhàn rỗi sang chứng khoán/quỹ mở.' : 'Optimize idle cash into index funds.',
        potentialGain: Math.round(snapshot.totalSavingsBalance * 0.08),
        formattedPotentialGain: `+8%/năm`,
        difficulty: 'medium'
      });
    }

    return opps;
  }

  /**
   * Prioritizes recommendations, risks, opportunities.
   */
  static prioritize(
    recs: CoachRecommendation[],
    risks: CoachRisk[],
    language: Language = 'vi'
  ): CoachPriority[] {
    const priorities: CoachPriority[] = [];

    risks.forEach((r) => {
      let level: CoachPriorityLevel = 'medium';
      if (r.severity === 'critical') level = 'critical';
      else if (r.severity === 'high') level = 'high';

      priorities.push({
        id: IdGenerator.generateId('prio_rsk'),
        level,
        domain: r.domain,
        title: r.title,
        description: r.description,
        impact: language === 'vi' ? 'Ngăn ngừa rủi ro mất an toàn tài chính' : 'Prevents financial safety breach',
        actionRequired: r.mitigationStrategy
      });
    });

    recs.forEach((rec) => {
      priorities.push({
        id: IdGenerator.generateId('prio_rec'),
        level: rec.priority,
        domain: rec.category,
        title: rec.title,
        description: rec.description,
        impact: rec.rationale,
        actionRequired: rec.actionableStep
      });
    });

    return priorities.sort((a, b) => {
      const rankMap: Record<CoachPriorityLevel, number> = {
        critical: 1,
        high: 2,
        medium: 3,
        low: 4,
        future: 5
      };
      return rankMap[a.level] - rankMap[b.level];
    });
  }

  /**
   * TASK 12: Generates Action Plan across 5 timeframes.
   */
  static generateActionPlan(
    recs: CoachRecommendation[],
    priorities: CoachPriority[],
    language: Language = 'vi'
  ): CoachActionPlan {
    const today: CoachAction[] = [];
    const thisWeek: CoachAction[] = [];
    const thisMonth: CoachAction[] = [];
    const nextMonth: CoachAction[] = [];
    const longTerm: CoachAction[] = [];

    priorities.forEach((p) => {
      const act: CoachAction = {
        id: IdGenerator.generateId('act'),
        timeframe: 'today',
        title: p.title,
        description: p.actionRequired,
        category: p.domain,
        isCompleted: false,
        priority: p.level,
        relatedDomain: p.domain
      };

      if (p.level === 'critical') {
        act.timeframe = 'today';
        today.push(act);
      } else if (p.level === 'high') {
        act.timeframe = 'this_week';
        thisWeek.push(act);
      } else if (p.level === 'medium') {
        act.timeframe = 'this_month';
        thisMonth.push(act);
      } else if (p.level === 'low') {
        act.timeframe = 'next_month';
        nextMonth.push(act);
      } else {
        act.timeframe = 'long_term';
        longTerm.push(act);
      }
    });

    // Default fallbacks if any list empty
    if (today.length === 0) {
      today.push({
        id: IdGenerator.generateId('act_def_today'),
        timeframe: 'today',
        title: language === 'vi' ? 'Ghi Chép Tất Cả Giao Dịch Trong Ngày' : 'Log All Daily Transactions',
        description: language === 'vi' ? 'Nhập chính xác thu/chi phát sinh để đảm bảo dữ liệu cập nhật.' : 'Enter accurate income/expense to maintain data health.',
        category: 'financial_discipline',
        isCompleted: true,
        priority: 'low'
      });
    }

    if (thisWeek.length === 0) {
      thisWeek.push({
        id: IdGenerator.generateId('act_def_week'),
        timeframe: 'this_week',
        title: language === 'vi' ? 'Rà Soát Tiến Độ 6 Hũ' : 'Review Six Jars Progress',
        description: language === 'vi' ? 'Kiểm tra tỷ lệ số dư 6 hũ để đảm bảo chi tiêu cân bằng.' : 'Check Six Jars balance distribution.',
        category: 'financial_discipline',
        isCompleted: false,
        priority: 'medium'
      });
    }

    return {
      today,
      thisWeek,
      thisMonth,
      nextMonth,
      longTerm
    };
  }

  /**
   * TASK 13: Generates Achievements across 6 Categories.
   */
  static generateAchievements(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): CoachAchievement[] {
    return [
      {
        id: IdGenerator.generateId('ach_sav'),
        title: language === 'vi' ? 'Chuyên Gia Tích Lũy' : 'Savings Master',
        description: language === 'vi' ? 'Duy trì tỷ lệ tiết kiệm trên 20% thu nhập' : 'Maintain savings rate above 20%',
        category: 'savings_goal',
        iconName: 'PiggyBank',
        progressPercent: Math.min(100, Math.round((snapshot.monthlySavings / (snapshot.monthlyIncome || 1)) * 500)),
        isUnlocked: snapshot.monthlySavings >= snapshot.monthlyIncome * 0.2
      },
      {
        id: IdGenerator.generateId('ach_debt'),
        title: language === 'vi' ? 'Tự Do Không Nợ' : 'Debt Free Hero',
        description: language === 'vi' ? 'Không có khoản nợ đọng xấu' : 'Clear all bad debts',
        category: 'debt_free',
        iconName: 'ShieldCheck',
        progressPercent: snapshot.totalDebt === 0 ? 100 : 50,
        isUnlocked: snapshot.totalDebt === 0
      },
      {
        id: IdGenerator.generateId('ach_inv'),
        title: language === 'vi' ? 'Nhà Đầu Tư Bản Lĩnh' : 'Smart Investor',
        description: language === 'vi' ? 'Trích lập hũ FFA & danh mục đầu tư đều đặn' : 'Consistently fund FFA investment portfolio',
        category: 'investment_milestone',
        iconName: 'TrendingUp',
        progressPercent: health.categories.investment.score,
        isUnlocked: health.categories.investment.score >= 70
      },
      {
        id: IdGenerator.generateId('ach_bud'),
        title: language === 'vi' ? 'Kỷ Luật Ngân Sách' : 'Budget Discipline',
        description: language === 'vi' ? 'Không vượt ngân sách trong 30 ngày' : 'Zero budget overruns for 30 days',
        category: 'budget_success',
        iconName: 'CheckCircle2',
        progressPercent: health.categories.budget.score,
        isUnlocked: health.categories.budget.score >= 80
      },
      {
        id: IdGenerator.generateId('ach_fire'),
        title: language === 'vi' ? 'Cột Mốc FIRE' : 'FIRE Vanguard',
        description: language === 'vi' ? 'Đạt mốc 25% FIRE Target' : 'Reached 25% FIRE Target',
        category: 'fire_milestone',
        iconName: 'Flame',
        progressPercent: Math.min(100, Math.round((snapshot.fireProgressPercent / 25) * 100)),
        isUnlocked: snapshot.fireProgressPercent >= 25
      }
    ];
  }

  /**
   * Generates Notifications.
   */
  static generateNotifications(health: CoachHealth, risks: CoachRisk[], language: Language = 'vi'): CoachNotification[] {
    const notifs: CoachNotification[] = [];

    if (health.overallScore >= 80) {
      notifs.push({
        id: IdGenerator.generateId('ntf_health_good'),
        title: language === 'vi' ? 'Sức Khỏe Tài Chính Xuất Sắc!' : 'Excellent Financial Health!',
        message: language === 'vi' ? `Điểm sức khỏe tài chính đạt ${health.overallScore}/100. Hãy tiếp tục phong độ!` : `Financial health score reached ${health.overallScore}/100. Keep it up!`,
        level: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    risks.forEach((r) => {
      if (r.severity === 'critical' || r.severity === 'high') {
        notifs.push({
          id: IdGenerator.generateId('ntf_rsk'),
          title: r.title,
          message: r.mitigationStrategy,
          level: r.severity === 'critical' ? 'critical' : 'warning',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkDomain: r.domain
        });
      }
    });

    return notifs;
  }

  /**
   * Calculates CoachSummary.
   */
  static calculateSummary(
    health: CoachHealth,
    priorities: CoachPriority[],
    risks: CoachRisk[],
    opps: CoachOpportunity[],
    plan: CoachActionPlan,
    language: Language = 'vi'
  ): CoachSummary {
    const allActions = [
      ...plan.today,
      ...plan.thisWeek,
      ...plan.thisMonth,
      ...plan.nextMonth,
      ...plan.longTerm
    ];
    const completed = allActions.filter((a) => a.isCompleted).length;
    const pending = allActions.length - completed;

    let primaryAdvice = language === 'vi'
      ? 'Duy trì kỷ luật thu chi, trích lập tự động hũ dự phòng và quỹ tự do tài chính.'
      : 'Maintain cash flow discipline, automate emergency fund and FFA contributions.';

    if (risks.length > 0) {
      primaryAdvice = risks[0].mitigationStrategy;
    } else if (priorities.length > 0) {
      primaryAdvice = priorities[0].actionRequired;
    }

    return {
      healthScore: health.overallScore,
      formattedHealthScore: `${health.overallScore}/100`,
      topPriorityCount: priorities.length,
      activeRisksCount: risks.length,
      activeOpportunitiesCount: opps.length,
      pendingActionsCount: pending,
      completedActionsCount: completed,
      primaryAdvice,
      healthGrade: health.grade
    };
  }

  /**
   * Calculates CoachStatistics.
   */
  static calculateStatistics(
    health: CoachHealth,
    plan: CoachActionPlan,
    risks: CoachRisk[],
    opps: CoachOpportunity[]
  ): CoachStatistics {
    const allActions = [
      ...plan.today,
      ...plan.thisWeek,
      ...plan.thisMonth,
      ...plan.nextMonth,
      ...plan.longTerm
    ];
    const total = allActions.length;
    const completed = allActions.filter((a) => a.isCompleted).length;
    const completionRatePercent = total > 0 ? Math.round((completed / total) * 100) : 100;

    const riskIndex = Math.min(100, risks.reduce((sum, r) => sum + r.riskScore, 0));
    const opportunityIndex = Math.min(100, opps.length * 35);
    const disciplineScore = health.categories.financial_discipline.score;

    return {
      totalActionsCount: total,
      completionRatePercent,
      healthScoreTrend: health.overallScore >= 70 ? 'upward' : health.overallScore >= 50 ? 'stable' : 'downward',
      riskIndex,
      opportunityIndex,
      financialDisciplineScore: disciplineScore
    };
  }
}
