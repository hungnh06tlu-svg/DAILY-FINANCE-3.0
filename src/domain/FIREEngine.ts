/**
 * Daily Finance 2.5 - FIREEngine
 * Domain Engine - Pure business orchestration for FIRE Planner (TASK 1).
 * Delegates financial arithmetic exclusively to FinancialTruthEngine.
 * Uses IdGenerator for all generated identifiers.
 * Zero UI, zero rendering, zero direct side-effects, zero repository access.
 */

import {
  FireProfile,
  FireGoal,
  FireType,
  FireScenario,
  FireScenarioType,
  FireProjection,
  FireProjectionPoint,
  FireForecast,
  FireMilestone,
  FireRecommendation,
  FireRisk,
  FireSummary,
  FireStatistics,
  FireAlert,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { IdGenerator } from '../services/IdGenerator';

export class FIREEngine {
  /**
   * TASK 7 & 10: Orchestrates FIRE Target (FIRE Number) calculation based on FIRE Type.
   * FIRE Number = (Annual Expenses * FIRE Multiplier) / (Safe Withdrawal Rate / 100)
   */
  static calculateFireNumber(
    monthlyExpenses: number,
    safeWithdrawalRate: number = 4,
    fireType: FireType = 'regular_fire',
    customTarget?: number
  ): number {
    if (fireType === 'custom_fire' && customTarget && customTarget > 0) {
      return customTarget;
    }

    const annualExpenses = Math.max(0, monthlyExpenses) * 12;
    const swrDecimal = Math.max(0.01, safeWithdrawalRate / 100);
    const baseFireNumber = Math.round(annualExpenses / swrDecimal);

    let multiplier = 1.0;
    switch (fireType) {
      case 'lean_fire':
        multiplier = 0.75;
        break;
      case 'regular_fire':
        multiplier = 1.0;
        break;
      case 'fat_fire':
        multiplier = 1.5;
        break;
      case 'coast_fire':
        multiplier = 0.5;
        break;
      case 'barista_fire':
        multiplier = 0.6;
        break;
      case 'custom_fire':
        multiplier = 1.0;
        break;
    }

    return Math.round(baseFireNumber * multiplier);
  }

  /**
   * TASK 8 & 10: Orchestrates 5 Scenarios (Current, Optimistic, Conservative, Aggressive, Custom).
   * Delegates compounding timeline math to FinancialTruthEngine.calculateForecast.
   */
  static orchestrateScenarios(profile: FireProfile, language: Language = 'vi'): FireScenario[] {
    const fireNumber = this.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    const scenarioConfigs: {
      type: FireScenarioType;
      nameVi: string;
      nameEn: string;
      returnOffset: number;
      savingsMultiplier: number;
      expenseMultiplier: number;
      probability: number;
    }[] = [
      {
        type: 'current',
        nameVi: 'Kịch Bản Hiện Tại',
        nameEn: 'Current Scenario',
        returnOffset: 0,
        savingsMultiplier: 1.0,
        expenseMultiplier: 1.0,
        probability: 70
      },
      {
        type: 'optimistic',
        nameVi: 'Kịch Bản Lạc Quan',
        nameEn: 'Optimistic Scenario',
        returnOffset: 2.0,
        savingsMultiplier: 1.15,
        expenseMultiplier: 0.95,
        probability: 50
      },
      {
        type: 'conservative',
        nameVi: 'Kịch Bản Thận Trọng',
        nameEn: 'Conservative Scenario',
        returnOffset: -2.0,
        savingsMultiplier: 0.9,
        expenseMultiplier: 1.05,
        probability: 85
      },
      {
        type: 'aggressive',
        nameVi: 'Kịch Bản Tăng Tốc',
        nameEn: 'Aggressive Scenario',
        returnOffset: 3.0,
        savingsMultiplier: 1.3,
        expenseMultiplier: 0.9,
        probability: 40
      },
      {
        type: 'custom',
        nameVi: 'Kịch Bản Tùy Chỉnh',
        nameEn: 'Custom Scenario',
        returnOffset: 1.0,
        savingsMultiplier: 1.1,
        expenseMultiplier: 1.0,
        probability: 60
      }
    ];

    const currentYear = new Date().getFullYear();

    return scenarioConfigs.map((cfg) => {
      const returnRate = Math.max(0, profile.expectedAnnualReturn + cfg.returnOffset);
      const monthlySavings = Math.round(profile.monthlySavings * cfg.savingsMultiplier);
      const monthlyExpenses = Math.round(profile.monthlyExpenses * cfg.expenseMultiplier);

      const targetNetWorth = this.calculateFireNumber(
        monthlyExpenses,
        profile.safeWithdrawalRate,
        profile.fireType,
        profile.customTargetNetWorth
      );

      // Delegate forecast calculation to FinancialTruthEngine
      const timeline40Years = FinancialTruthEngine.calculateForecast(
        profile.currentNetWorth,
        monthlySavings,
        returnRate,
        480 // 40 years
      );

      // Find month where targetNetWorth is reached
      const reachedPoint = timeline40Years.find((pt) => pt.estimatedNetWorth >= targetNetWorth);
      const monthsNeeded = reachedPoint ? reachedPoint.month : 480;
      const yearsRemaining = parseFloat((monthsNeeded / 12).toFixed(1));

      const projectedFireAge = Math.min(100, Math.round(profile.currentAge + yearsRemaining));
      const fireYear = currentYear + Math.ceil(yearsRemaining);
      const projectedFireDate = `${fireYear}-01`;

      const netWorthAtRetirement = reachedPoint
        ? reachedPoint.estimatedNetWorth
        : timeline40Years[timeline40Years.length - 1].estimatedNetWorth;

      return {
        id: IdGenerator.generateId('scn'),
        scenarioType: cfg.type,
        name: language === 'vi' ? cfg.nameVi : cfg.nameEn,
        annualReturnRate: returnRate,
        monthlySavings,
        monthlyExpenses,
        projectedFireAge,
        projectedYearsRemaining: yearsRemaining,
        projectedNetWorthAtRetirement: netWorthAtRetirement,
        formattedProjectedNetWorth: '',
        projectedFireDate,
        probabilityOfSuccessPercent: cfg.probability
      };
    });
  }

  /**
   * TASK 9 & 10: Orchestrates Yearly & Monthly Projections.
   * Delegates compounding calculations to FinancialTruthEngine.calculateForecast.
   */
  static orchestrateProjection(
    profile: FireProfile,
    fireNumber: number,
    maxYears: number = 30,
    language: Language = 'vi'
  ): FireProjection {
    const currentYear = new Date().getFullYear();
    const points: FireProjectionPoint[] = [];

    // Calculate 12-month chunks up to maxYears
    const timeline = FinancialTruthEngine.calculateForecast(
      profile.currentNetWorth,
      profile.monthlySavings,
      profile.expectedAnnualReturn,
      maxYears * 12
    );

    for (let yr = 0; yr <= maxYears; yr++) {
      if (yr === 0) {
        points.push({
          year: currentYear,
          age: profile.currentAge,
          projectedNetWorth: profile.currentNetWorth,
          formattedNetWorth: '',
          savingsContributionTotal: 0,
          investmentGrowthTotal: 0,
          passiveIncomeMonthly: Math.round((profile.currentNetWorth * (profile.safeWithdrawalRate / 100)) / 12),
          isFireAchieved: profile.currentNetWorth >= fireNumber
        });
      } else {
        const monthIdx = yr * 12 - 1;
        const pt = timeline[monthIdx] || timeline[timeline.length - 1];
        const projectedNetWorth = pt.estimatedNetWorth;
        const savingsTotal = profile.monthlySavings * 12 * yr;
        const growthTotal = Math.max(0, projectedNetWorth - profile.currentNetWorth - savingsTotal);
        const passiveIncomeMonthly = Math.round((projectedNetWorth * (profile.safeWithdrawalRate / 100)) / 12);

        points.push({
          year: currentYear + yr,
          age: profile.currentAge + yr,
          projectedNetWorth,
          formattedNetWorth: '',
          savingsContributionTotal: savingsTotal,
          investmentGrowthTotal: growthTotal,
          passiveIncomeMonthly,
          isFireAchieved: projectedNetWorth >= fireNumber
        });
      }
    }

    const milestones = this.orchestrateMilestones(profile, fireNumber, points, language);

    return {
      profileId: profile.id,
      points,
      milestones
    };
  }

  /**
   * Orchestrates Milestones (10%, 25%, 50%, 75%, 100% FIRE).
   */
  static orchestrateMilestones(
    profile: FireProfile,
    fireNumber: number,
    projectionPoints: FireProjectionPoint[],
    language: Language = 'vi'
  ): FireMilestone[] {
    const percentages = [
      { pct: 10, keyVi: '10% FIRE - Khởi Đầu', keyEn: '10% FIRE - Initial Spark' },
      { pct: 25, keyVi: '25% FIRE - Quỹ Tương Lai', keyEn: '25% FIRE - Quarter FIRE' },
      { pct: 50, keyVi: '50% FIRE - Nửa Chặng Đường (Coast FIRE)', keyEn: '50% FIRE - Halfway (Coast FIRE)' },
      { pct: 75, keyVi: '75% FIRE - Cận Đích', keyEn: '75% FIRE - Three-Quarter FIRE' },
      { pct: 100, keyVi: '100% FIRE - Tự Do Tài Chính!', keyEn: '100% FIRE - Full Financial Independence!' }
    ];

    return percentages.map((m) => {
      const targetNetWorth = Math.round((fireNumber * m.pct) / 100);
      const hitPoint = projectionPoints.find((pt) => pt.projectedNetWorth >= targetNetWorth);

      const expectedYear = hitPoint ? hitPoint.year : new Date().getFullYear() + 40;
      const expectedAge = hitPoint ? hitPoint.age : profile.currentAge + 40;
      const isAchieved = profile.currentNetWorth >= targetNetWorth;

      return {
        id: IdGenerator.generateId('mls'),
        title: language === 'vi' ? m.keyVi : m.keyEn,
        targetNetWorth,
        formattedTargetNetWorth: '',
        expectedAge,
        expectedYear,
        isAchieved,
        achievedDate: isAchieved ? new Date().toISOString().split('T')[0] : undefined
      };
    });
  }

  /**
   * TASK 12: Orchestrates Forecast summary.
   */
  static orchestrateForecast(
    profile: FireProfile,
    fireNumber: number,
    language: Language = 'vi'
  ): FireForecast {
    // 12-month compound projection timeline up to 50 years
    const timeline = FinancialTruthEngine.calculateForecast(
      profile.currentNetWorth,
      profile.monthlySavings,
      profile.expectedAnnualReturn,
      600
    );

    const hitPoint = timeline.find((pt) => pt.estimatedNetWorth >= fireNumber);
    const monthsNeeded = hitPoint ? hitPoint.month : 600;
    const yearsRemaining = parseFloat((monthsNeeded / 12).toFixed(1));

    const currentYear = new Date().getFullYear();
    const fireYear = currentYear + Math.ceil(yearsRemaining);
    const expectedFireDate = `${fireYear}-01`;

    const requiredPassiveIncome = Math.round((fireNumber * (profile.safeWithdrawalRate / 100)) / 12);
    
    // Required monthly savings to reach FIRE by targetRetirementAge
    const yearsToTargetAge = Math.max(1, profile.targetRetirementAge - profile.currentAge);
    const targetMonths = yearsToTargetAge * 12;
    const neededNetWorthGrowth = Math.max(0, fireNumber - profile.currentNetWorth);
    const requiredMonthlySavings = Math.round(neededNetWorthGrowth / targetMonths);

    const targetAchievementPercent = fireNumber > 0
      ? Math.min(100, Math.round((profile.currentNetWorth / fireNumber) * 100))
      : 100;

    let status: 'on_track' | 'ahead' | 'behind' | 'at_risk' = 'on_track';
    if (targetAchievementPercent >= 100) status = 'ahead';
    else if (yearsRemaining <= yearsToTargetAge) status = 'on_track';
    else if (yearsRemaining <= yearsToTargetAge + 5) status = 'behind';
    else status = 'at_risk';

    return {
      expectedFireDate,
      yearsRemaining,
      requiredMonthlySavings,
      formattedRequiredMonthlySavings: '',
      requiredPassiveIncome,
      formattedRequiredPassiveIncome: '',
      requiredInvestmentGrowthRate: profile.expectedAnnualReturn,
      targetAchievementPercent,
      status
    };
  }

  /**
   * TASK 13: Orchestrates Recommendations.
   */
  static orchestrateRecommendations(
    profile: FireProfile,
    fireNumber: number,
    totalDebt: number = 0,
    language: Language = 'vi'
  ): FireRecommendation[] {
    const recommendations: FireRecommendation[] = [];

    const income = Math.max(1, profile.monthlyIncome);
    const savingsRate = (profile.monthlySavings / income) * 100;
    const expenseRate = (profile.monthlyExpenses / income) * 100;
    const investmentRate = (profile.monthlyInvestment / income) * 100;

    // 1. Increase Savings
    if (savingsRate < 25) {
      recommendations.push({
        id: IdGenerator.generateId('rec_sav'),
        code: 'increase_savings',
        title: language === 'vi' ? 'Tăng Tỷ Lệ Tiết Kiệm' : 'Increase Savings Rate',
        description: language === 'vi'
          ? `Tỷ lệ tiết kiệm hiện tại là ${savingsRate.toFixed(1)}%. Tăng thêm 10% giúp rút ngắn 3-5 năm nghỉ hưu.`
          : `Current savings rate is ${savingsRate.toFixed(1)}%. Increasing by 10% reduces FIRE timeline by 3-5 years.`,
        priority: 'high',
        actionableStep: language === 'vi' ? 'Trích lập tự động 20-30% thu nhập ngay khi nhận lương.' : 'Automate 20-30% savings transfer immediately upon receiving salary.',
        potentialYearsSaved: 4
      });
    }

    // 2. Reduce Expenses
    if (expenseRate > 65) {
      recommendations.push({
        id: IdGenerator.generateId('rec_exp'),
        code: 'reduce_expenses',
        title: language === 'vi' ? 'Tối Ưu Hóa Chi Phí Hàng Tháng' : 'Optimize Monthly Expenses',
        description: language === 'vi'
          ? `Chi phí đang chiếm ${expenseRate.toFixed(1)}% thu nhập. Giảm 10% chi phí giúp hạ mục tiêu FIRE Number đáng kể.`
          : `Expenses consume ${expenseRate.toFixed(1)}% of income. Reducing 10% significantly lowers your FIRE Number target.`,
        priority: 'high',
        actionableStep: language === 'vi' ? 'Rà soát các khoản đăng ký định kỳ và chi phí không thiết yếu.' : 'Audit monthly subscriptions and non-essential lifestyle spending.',
        potentialYearsSaved: 3
      });
    }

    // 3. Increase Investments
    if (investmentRate < 15) {
      recommendations.push({
        id: IdGenerator.generateId('rec_inv'),
        code: 'increase_investments',
        title: language === 'vi' ? 'Đẩy Mạnh Đầu Tư Tăng Trưởng' : 'Increase Investment Allocation',
        description: language === 'vi'
          ? 'Chỉ gửi tiết kiệm sẽ khó vượt lạm phát. Phân bổ thêm vào chứng khoán, quỹ mở để tận dụng lãi kép.'
          : 'Cash savings alone struggle against inflation. Allocate more into index funds to leverage compound return.',
        priority: 'medium',
        actionableStep: language === 'vi' ? 'Chuyển 50% tiền tiết kiệm nhàn rỗi sang Quỹ Tự Do Tài Chính (FFA).' : 'DCA 50% of monthly surplus into index funds or FFA jar.',
        potentialYearsSaved: 5
      });
    }

    // 4. Pay Off Debt
    if (totalDebt > 0) {
      recommendations.push({
        id: IdGenerator.generateId('rec_debt'),
        code: 'pay_off_debt',
        title: language === 'vi' ? 'Thanh Toán Nợ Lãi Suất Cao' : 'Pay Off High-Interest Debt',
        description: language === 'vi'
          ? `Bạn đang có khoản nợ ${totalDebt}. Trả sạch nợ giúp giải phóng dòng tiền.`
          : `You have ${totalDebt} outstanding debt. Clearing debt frees up monthly cash flow.`,
        priority: 'high',
        actionableStep: language === 'vi' ? 'Áp dụng phương pháp Snowball hoặc Avalanche để trả nợ dứt điểm.' : 'Use Debt Snowball or Avalanche method to eliminate debt.',
        potentialYearsSaved: 2
      });
    }

    // 5. Adjust FIRE Goal
    if (profile.expectedAnnualReturn > 10) {
      recommendations.push({
        id: IdGenerator.generateId('rec_risk'),
        code: 'risk_warning',
        title: language === 'vi' ? 'Cảnh Báo Giả Định Lợi Nhuận Khả Thi' : 'Adjust Return Rate Assumption',
        description: language === 'vi'
          ? `Giả định lợi nhuận ${profile.expectedAnnualReturn}% là khá cao. Nên sử dụng mức 7-8% để đảm bảo tính an toàn.`
          : `Annual return assumption of ${profile.expectedAnnualReturn}% is optimistic. Use 7-8% for safe long-term planning.`,
        priority: 'low',
        actionableStep: language === 'vi' ? 'Cập nhật lợi nhuận kỳ vọng về mức 7%.' : 'Adjust expected return rate to conservative 7%.',
        potentialYearsSaved: 0
      });
    }

    return recommendations;
  }

  /**
   * TASK 14: Orchestrates Risk Analysis.
   */
  static orchestrateRisks(
    profile: FireProfile,
    totalDebt: number = 0,
    language: Language = 'vi'
  ): FireRisk[] {
    const risks: FireRisk[] = [];

    const income = Math.max(1, profile.monthlyIncome);
    const savingsRate = (profile.monthlySavings / income) * 100;
    const debtToNetWorth = profile.currentNetWorth > 0 ? (totalDebt / profile.currentNetWorth) * 100 : 100;

    // Low Savings Rate
    if (savingsRate < 15) {
      risks.push({
        id: IdGenerator.generateId('rsk_sav'),
        code: 'low_savings_rate',
        severity: 'high',
        title: language === 'vi' ? 'Tỷ Lệ Tiết Kiệm Thấp' : 'Low Savings Rate Risk',
        description: language === 'vi'
          ? `Tỷ lệ tích lũy hiện tại (${savingsRate.toFixed(1)}%) quá thấp để đạt tự do tài chính đúng hạn.`
          : `Current savings rate (${savingsRate.toFixed(1)}%) is insufficient for timely financial independence.`,
        mitigation: language === 'vi' ? 'Tăng thu nhập từ nguồn thứ hai hoặc cắt giảm 15% chi phí không thiết yếu.' : 'Boost secondary income or cut 15% discretionary spending.'
      });
    }

    // High Debt
    if (totalDebt > 0 && debtToNetWorth > 30) {
      risks.push({
        id: IdGenerator.generateId('rsk_dbt'),
        code: 'high_debt',
        severity: 'high',
        title: language === 'vi' ? 'Gánh Nặng Nợ Cao' : 'High Debt Burden Risk',
        description: language === 'vi'
          ? `Tổng nợ bằng ${debtToNetWorth.toFixed(1)}% tài sản ròng, làm suy giảm tốc độ tăng trưởng tài sản.`
          : `Debt equals ${debtToNetWorth.toFixed(1)}% of net worth, eroding portfolio growth.`,
        mitigation: language === 'vi' ? 'Ưu tiên trả dứt điểm các khoản nợ có lãi suất > 8%.' : 'Prioritize clearing debts with interest rate > 8%.'
      });
    }

    // High Expenses
    if (profile.monthlyExpenses > profile.monthlyIncome * 0.7) {
      risks.push({
        id: IdGenerator.generateId('rsk_exp'),
        code: 'high_expenses',
        severity: 'medium',
        title: language === 'vi' ? 'Chi Phí Sinh Hoạt Lớn' : 'High Monthly Expense Risk',
        description: language === 'vi'
          ? 'Chi phí cao làm tăng mục tiêu FIRE Number, đòi hỏi số vốn khổng lồ để nghỉ hưu.'
          : 'High lifestyle expenses inflate the FIRE target, requiring a much larger portfolio.',
        mitigation: language === 'vi' ? 'Sống tối giản và kiểm soát lạm phát lối sống khi thu nhập tăng.' : 'Practice frugal living and avoid lifestyle inflation.'
      });
    }

    // Market Downturn
    risks.push({
      id: IdGenerator.generateId('rsk_mkt'),
      code: 'market_downturn',
      severity: 'medium',
      title: language === 'vi' ? 'Rủi Ro Thị Trường Mới Nghỉ Hưu (Sequence of Returns)' : 'Sequence of Returns Risk',
      description: language === 'vi'
        ? 'Sự sụt giảm thị trường trong 3 năm đầu nghỉ hưu có thể làm suy giảm nhanh danh mục đầu tư.'
        : 'Market crash early in retirement can significantly impair portfolio longevity.',
      mitigation: language === 'vi' ? 'Duy trì quỹ dự phòng 2-3 năm chi phí bằng tiền mặt/tiền gửi.' : 'Maintain a 2-3 year expense cash buffer in liquid savings.'
    });

    return risks;
  }

  /**
   * Evaluates Alerts.
   */
  static evaluateAlerts(
    profile: FireProfile,
    fireNumber: number,
    yearsRemaining: number,
    language: Language = 'vi'
  ): FireAlert[] {
    const alerts: FireAlert[] = [];

    if (profile.currentNetWorth >= fireNumber) {
      alerts.push({
        id: IdGenerator.generateId('alt_fire_reached'),
        message: language === 'vi'
          ? `Chúc mừng! Bạn đã đạt tự do tài chính với tài sản ${profile.currentNetWorth}!`
          : `Congratulations! You reached Financial Independence with ${profile.currentNetWorth}!`,
        level: 'success',
        code: 'fire_reached'
      });
    } else if (yearsRemaining > 30) {
      alerts.push({
        id: IdGenerator.generateId('alt_long_timeline'),
        message: language === 'vi'
          ? `Thời gian dự kiến nghỉ hưu còn ${yearsRemaining} năm. Hãy cân nhắc tăng mức đầu tư để rút ngắn tiến độ.`
          : `Estimated FIRE timeline is ${yearsRemaining} years. Consider boosting investments to accelerate.`,
        level: 'warning',
        code: 'long_timeline'
      });
    }

    if (profile.expectedAnnualReturn <= profile.inflationRate) {
      alerts.push({
        id: IdGenerator.generateId('alt_inflation'),
        message: language === 'vi'
          ? 'Lợi nhuận kỳ vọng đang thấp hơn hoặc bằng tỷ lệ lạm phát. Tài sản của bạn có nguy cơ mất giá.'
          : 'Expected return is equal to or lower than inflation. Real asset value risks depreciation.',
        level: 'danger',
        code: 'inflation_risk'
      });
    }

    return alerts;
  }

  /**
   * Calculates FireSummary.
   */
  static calculateSummary(
    profile: FireProfile,
    fireNumber: number,
    yearsRemaining: number,
    expectedFireDate: string,
    language: Language = 'vi'
  ): FireSummary {
    const income = Math.max(1, profile.monthlyIncome);
    const savingsRatePercent = parseFloat(((profile.monthlySavings / income) * 100).toFixed(1));
    const investmentRatePercent = parseFloat(((profile.monthlyInvestment / income) * 100).toFixed(1));

    const monthlyPassiveIncomeCurrent = Math.round((profile.currentNetWorth * (profile.safeWithdrawalRate / 100)) / 12);

    return {
      currentNetWorth: profile.currentNetWorth,
      formattedCurrentNetWorth: '',
      targetNetWorth: fireNumber,
      formattedTargetNetWorth: '',
      fireNumber,
      formattedFireNumber: '',
      savingsRatePercent,
      investmentRatePercent,
      monthlyPassiveIncomeCurrent,
      formattedMonthlyPassiveIncomeCurrent: '',
      monthlyExpenses: profile.monthlyExpenses,
      formattedMonthlyExpenses: '',
      yearsRemaining,
      expectedFireDate,
      fireType: profile.fireType
    };
  }

  /**
   * Calculates FireStatistics.
   */
  static calculateStatistics(
    profile: FireProfile,
    fireNumber: number,
    totalDebt: number = 0,
    totalInvestments: number = 0
  ): FireStatistics {
    const progressToFirePercent = fireNumber > 0
      ? Math.min(100, Math.round((profile.currentNetWorth / fireNumber) * 100))
      : 100;

    const monthlyNetSavings = Math.max(0, profile.monthlyIncome - profile.monthlyExpenses);
    const income = Math.max(1, profile.monthlyIncome);
    const savingsToIncomeRatio = parseFloat((monthlyNetSavings / income).toFixed(2));

    const debtToNetWorthRatio = profile.currentNetWorth > 0
      ? parseFloat((totalDebt / profile.currentNetWorth).toFixed(2))
      : totalDebt > 0 ? 1 : 0;

    const investmentToNetWorthRatio = profile.currentNetWorth > 0
      ? parseFloat((totalInvestments / profile.currentNetWorth).toFixed(2))
      : 0;

    // Financial Independence Score (0 to 100)
    const score = Math.min(100, Math.max(0, Math.round(progressToFirePercent * 0.6 + savingsToIncomeRatio * 100 * 0.4)));

    return {
      progressToFirePercent,
      monthlyNetSavings,
      savingsToIncomeRatio,
      debtToNetWorthRatio,
      investmentToNetWorthRatio,
      financialIndependenceScore: score
    };
  }
}
