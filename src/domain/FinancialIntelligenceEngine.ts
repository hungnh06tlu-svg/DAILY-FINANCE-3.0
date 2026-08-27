/**
 * Daily Finance 3.0 - FinancialIntelligenceEngine
 * Pure Intelligence & Analysis Engine
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial calculations performed directly in this engine.
 * Consumes ONLY FinancialSnapshot and evaluates rules, classifications, correlations, and insights.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import {
  FinancialIntelligence,
  FinancialInsight,
  FinancialOpportunity,
  FinancialRisk,
  IntelligenceAnalysisSummary
} from './FinancialIntelligence';

export class FinancialIntelligenceEngine {
  /**
   * Analyzes a FinancialSnapshot and yields structured, prioritized intelligence.
   */
  public static analyze(snapshot: FinancialSnapshot, language: Language = 'vi'): FinancialIntelligence {
    const isVi = language === 'vi';

    const insights: FinancialInsight[] = [];
    const opportunities: FinancialOpportunity[] = [];
    const risks: FinancialRisk[] = [];

    // --- 1. Cash Flow Analysis ---
    const netCashflow = snapshot.monthlyIncome - snapshot.monthlyExpense;
    let cashFlowQuality: 'strong' | 'stable' | 'vulnerable' | 'critical' = 'stable';

    if (snapshot.monthlyIncome <= 0) {
      cashFlowQuality = 'vulnerable';
    } else if (snapshot.monthlyExpense > snapshot.monthlyIncome) {
      cashFlowQuality = 'critical';
      risks.push({
        id: 'risk_negative_cashflow',
        type: 'negative_cash_flow',
        title: isVi ? 'Dòng tiền âm trong tháng' : 'Negative Monthly Cash Flow',
        description: isVi
          ? `Chi tiêu tháng này (${snapshot.monthlyExpense.toLocaleString()} ${snapshot.currency}) vượt quá thu nhập (${snapshot.monthlyIncome.toLocaleString()} ${snapshot.currency}).`
          : `Monthly expenses (${snapshot.monthlyExpense}) exceed income (${snapshot.monthlyIncome}).`,
        severity: 'high',
        mitigationPlan: isVi
          ? ['Rà soát các khoản chi không thiết yếu', 'Thắt chặt ngân sách chi tiêu', 'Bổ sung nguồn thu nhập']
          : ['Review non-essential expenses', 'Tighten category budgets', 'Seek additional income sources']
      });
    } else if (netCashflow > snapshot.monthlyIncome * 0.3) {
      cashFlowQuality = 'strong';
      opportunities.push({
        id: 'opp_cashflow_surplus',
        type: 'improve_cash_flow',
        title: isVi ? 'Thặng dư dòng tiền dồi dào' : 'Healthy Cash Flow Surplus',
        description: isVi
          ? `Bạn đang tiết kiệm được hơn 30% thu nhập hàng tháng.`
          : `You are saving more than 30% of your monthly income.`,
        impactAmount: netCashflow,
        actionPlan: isVi
          ? ['Chuyển thặng dư vào quỹ tích lũy đầu tư', 'Tăng hạn mức tiết kiệm dài hạn']
          : ['Allocate surplus to investment funds', 'Increase long-term savings targets'],
        priority: 'high'
      });
    }

    // Cash reserve risk
    if (snapshot.cashBalance < snapshot.monthlyExpense) {
      risks.push({
        id: 'risk_low_cash',
        type: 'low_cash',
        title: isVi ? 'Số dư tiền mặt thấp' : 'Low Cash Balance',
        description: isVi
          ? `Tổng tiền mặt (${snapshot.cashBalance.toLocaleString()} ${snapshot.currency}) nhỏ hơn 1 tháng chi tiêu.`
          : `Cash balance is below 1 month of expenses.`,
        severity: 'critical',
        mitigationPlan: isVi
          ? ['Duy trì thanh khoản cho sinh hoạt phí', 'Hạn chế mua sắm tài sản cố định']
          : ['Maintain liquidity for essentials', 'Defer discretionary asset purchases']
      });
    }

    // --- 2. Budget Discipline Analysis ---
    let budgetDiscipline: 'excellent' | 'adequate' | 'needs_improvement' = 'adequate';

    if (snapshot.budgetSummary.overspentBudgetsCount > 0) {
      budgetDiscipline = 'needs_improvement';
      risks.push({
        id: 'risk_overspending',
        type: 'overspending',
        title: isVi ? 'Vượt hạn mức ngân sách' : 'Budget Overspending Detected',
        description: isVi
          ? `Có ${snapshot.budgetSummary.overspentBudgetsCount} danh mục chi tiêu đã vượt hạn mức.`
          : `${snapshot.budgetSummary.overspentBudgetsCount} budget categories have exceeded limits.`,
        severity: 'high',
        mitigationPlan: isVi
          ? ['Tạm dừng chi tiêu ở các danh mục đã báo động', 'Điều chỉnh phân bổ ngân sách cho tháng sau']
          : ['Pause spending in alerted categories', 'Reallocate budget targets for next month']
      });
    } else if (snapshot.budgetSummary.activeBudgetsCount > 0 && snapshot.budgetSummary.overspentBudgetsCount === 0) {
      budgetDiscipline = 'excellent';
      insights.push({
        id: 'insight_budget_discipline',
        category: 'budget',
        severity: 'info',
        priority: 'medium',
        title: isVi ? 'Kỷ luật ngân sách xuất sắc' : 'Excellent Budget Discipline',
        description: isVi ? 'Tất cả danh mục ngân sách đều nằm trong kiểm soát.' : 'All budget categories are within set limits.',
        evidence: `Active budgets: ${snapshot.budgetSummary.activeBudgetsCount}, Overspent: 0`,
        recommendation: isVi ? 'Tiếp tục duy trì thói quen ghi chép và kiểm soát này.' : 'Maintain current spending habits.',
        confidence: 0.95
      });
    }

    // --- 3. Emergency Fund Analysis ---
    let emergencyFundStatus: 'sufficient' | 'partial' | 'critical_shortage' = 'partial';

    if (snapshot.emergencyFund.isSufficient) {
      emergencyFundStatus = 'sufficient';
      insights.push({
        id: 'insight_emergency_sufficient',
        category: 'emergency_fund',
        severity: 'info',
        priority: 'low',
        title: isVi ? 'Quỹ khẩn cấp an toàn' : 'Sufficient Emergency Fund',
        description: isVi
          ? `Quỹ khẩn cấp đảm bảo ${snapshot.emergencyFund.coverageMonths} tháng chi tiêu.`
          : `Emergency fund covers ${snapshot.emergencyFund.coverageMonths} months of expenses.`,
        evidence: `Coverage: ${snapshot.emergencyFund.coverageMonths} months (Target: ${snapshot.emergencyFund.targetMonths})`,
        recommendation: isVi ? 'Có thể bắt đầu chuyển hướng dòng tiền sang quỹ đầu tư sinh lời.' : 'Consider directing excess cash flow to investments.',
        confidence: 0.9
      });
    } else {
      if (snapshot.emergencyFund.coverageMonths < 2) {
        emergencyFundStatus = 'critical_shortage';
        risks.push({
          id: 'risk_emergency_shortage',
          type: 'emergency_fund_risk',
          title: isVi ? 'Thiếu hụt quỹ dự phòng khẩn cấp' : 'Critical Emergency Fund Shortage',
          description: isVi
            ? `Quỹ dự phòng hiện chỉ đủ bao phủ ${snapshot.emergencyFund.coverageMonths} tháng chi tiêu (mục tiêu 6 tháng).`
            : `Emergency fund only covers ${snapshot.emergencyFund.coverageMonths} months (Target: 6 months).`,
          severity: 'high',
          mitigationPlan: isVi
            ? ['Ưu tiên tích lũy quỹ khẩn cấp trước khi đầu tư rủi ro', 'Trích tối thiểu 10-20% thu nhập hàng tháng']
            : ['Prioritize emergency savings over risky investments', 'Allocate 10-20% of monthly income to emergency fund']
        });
      }
      opportunities.push({
        id: 'opp_increase_emergency',
        type: 'increase_emergency_fund',
        title: isVi ? 'Củng cố quỹ dự phòng' : 'Strengthen Emergency Reserve',
        description: isVi ? 'Xây dựng quỹ khẩn cấp đạt mức 6 tháng chi tiêu an toàn.' : 'Build emergency reserves to 6 months of expenses.',
        impactAmount: Math.max(0, snapshot.emergencyFund.targetAmount - snapshot.emergencyFund.currentBalance),
        actionPlan: isVi
          ? ['Đặt mục tiêu tiết kiệm cố định hàng tháng', 'Tự động trích lập vào ví tích lũy']
          : ['Set a recurring monthly savings goal', 'Automate deposits into dedicated reserve account'],
        priority: 'high'
      });
    }

    // --- 4. Debt Risk Analysis ---
    let debtRiskLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';

    if (snapshot.debtSummary.totalDebtOwed > 0) {
      const debtToIncomeRatio = snapshot.monthlyIncome > 0 ? (snapshot.debtSummary.monthlyMinDebtPayment / snapshot.monthlyIncome) : 0;
      if (debtToIncomeRatio > 0.4 || snapshot.debtSummary.totalDebtOwed > snapshot.netWorth * 0.5) {
        debtRiskLevel = 'severe';
        risks.push({
          id: 'risk_debt_growth',
          type: 'debt_growth',
          title: isVi ? 'Rủi ro nợ cao' : 'High Debt Burden Risk',
          description: isVi
            ? `Nghĩa vụ trả nợ hàng tháng chiếm tỷ trọng lớn trong thu nhập.`
            : `Monthly debt obligations represent a large portion of monthly income.`,
          severity: 'critical',
          mitigationPlan: isVi
            ? ['Áp dụng chiến lược trả nợ Snowball hoặc Avalanche', 'Không phát sinh nợ tín dụng mới']
            : ['Apply Debt Snowball or Avalanche strategy', 'Avoid incurring new debt']
        });
      } else if (debtToIncomeRatio > 0.2) {
        debtRiskLevel = 'moderate';
      }

      opportunities.push({
        id: 'opp_reduce_debt',
        type: 'reduce_debt',
        title: isVi ? 'Tối ưu hoá & Giảm nợ' : 'Debt Paydown Optimization',
        description: isVi ? 'Thanh toán các khoản nợ có lãi suất cao để giảm chi phí tài chính.' : 'Pay down high-interest debt to lower interest expense.',
        impactAmount: snapshot.debtSummary.totalDebtOwed,
        actionPlan: isVi
          ? ['Tập trung trả dứt điểm khoản nợ nhỏ nhất hoặc lãi cao nhất', 'Trích thặng dư hàng tháng để trả gốc']
          : ['Pay off smallest debt or highest interest rate first', 'Apply monthly surplus to principal'],
        priority: 'medium'
      });
    }

    // --- 5. Investment Trend & Opportunities ---
    let investmentTrend: 'expanding' | 'moderate' | 'inactive' = 'inactive';

    if (snapshot.investmentValue.activeAssetCount > 0) {
      investmentTrend = snapshot.investmentValue.roiPercent >= 0 ? 'expanding' : 'moderate';
      insights.push({
        id: 'insight_investment_performance',
        category: 'investment',
        severity: 'info',
        priority: 'low',
        title: isVi ? 'Tổng quan danh mục đầu tư' : 'Investment Portfolio Summary',
        description: isVi
          ? `Danh mục có ${snapshot.investmentValue.activeAssetCount} tài sản với ROI: ${snapshot.investmentValue.roiPercent.toFixed(1)}%.`
          : `Portfolio contains ${snapshot.investmentValue.activeAssetCount} assets with ROI: ${snapshot.investmentValue.roiPercent.toFixed(1)}%.`,
        evidence: `Portfolio Value: ${snapshot.investmentValue.totalPortfolioValue}, ROI: ${snapshot.investmentValue.roiPercent}%`,
        recommendation: isVi ? 'Tái cân bằng danh mục định kỳ theo khẩu vị rủi ro.' : 'Rebalance portfolio periodically based on risk tolerance.',
        confidence: 0.88
      });
    } else if (snapshot.emergencyFund.isSufficient && snapshot.cashBalance > snapshot.monthlyExpense * 2) {
      opportunities.push({
        id: 'opp_optimize_investment',
        type: 'optimize_investment',
        title: isVi ? 'Bắt đầu danh mục đầu tư' : 'Start Investing',
        description: isVi
          ? 'Tài chính cá nhân ổn định và có lượng tiền mặt dư dả để bắt đầu đầu tư.'
          : 'Stable financial foundation with surplus cash available for investing.',
        actionPlan: isVi
          ? ['Tìm hiểu các kênh đầu tư an toàn (Quỹ mở, ETF, Vàng)', 'Đầu tư định kỳ hàng tháng (DCA)']
          : ['Explore low-cost index funds or ETFs', 'Set up Dollar-Cost Averaging (DCA)'],
        priority: 'medium'
      });
    }

    // --- 6. FIRE Progress Analysis ---
    let fireProgressStatus: 'on_track' | 'lagging' | 'not_started' = 'not_started';

    if (snapshot.fireProgress.progressPercent > 0) {
      if (snapshot.fireProgress.progressPercent >= 50 || snapshot.fireProgress.yearsToFIRE <= 10) {
        fireProgressStatus = 'on_track';
      } else {
        fireProgressStatus = 'lagging';
        if (snapshot.fireProgress.yearsToFIRE > 25) {
          risks.push({
            id: 'risk_fire_delay',
            type: 'fire_delay',
            title: isVi ? 'Lộ trình FIRE kéo dài' : 'FIRE Goal Delayed',
            description: isVi
              ? `Thời gian dự kiến đạt tự do tài chính còn khá dài (${snapshot.fireProgress.yearsToFIRE} năm).`
              : `Estimated time to FIRE remains long (${snapshot.fireProgress.yearsToFIRE} years).`,
            severity: 'low',
            mitigationPlan: isVi
              ? ['Gia tăng tỷ lệ tiết kiệm hàng tháng', 'Tăng tốc độ tăng trưởng danh mục đầu tư']
              : ['Increase monthly savings rate', 'Accelerate investment portfolio growth']
          });
        }
      }
    }

    // --- Summary Synthesis ---
    const summary: IntelligenceAnalysisSummary = {
      financialHealthRating: snapshot.financialHealthScore.status,
      cashFlowQuality,
      incomeStability: snapshot.monthlyIncome > 0 ? 'stable' : 'unknown',
      expenseStability: snapshot.budgetSummary.overspentBudgetsCount > 0 ? 'volatile' : 'controlled',
      savingsTrend: snapshot.savingsProgress.progressPercent >= 50 ? 'growing' : 'stagnant',
      investmentTrend,
      debtRiskLevel,
      budgetDiscipline,
      emergencyFundStatus,
      sixJarsCompliance: snapshot.sixJarsSummary.isCompliant,
      fireProgressStatus
    };

    const intelligence: FinancialIntelligence = {
      timestamp: new Date().toISOString(),
      spaceId: snapshot.spaceId,
      snapshotTimestamp: snapshot.timestamp,
      summary,
      insights: Object.freeze(insights),
      opportunities: Object.freeze(opportunities),
      risks: Object.freeze(risks)
    };

    return Object.freeze(intelligence);
  }
}
