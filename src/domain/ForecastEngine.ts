/**
 * Daily Finance 3.0 - ForecastEngine
 * Pure Financial Forecast & Projection Engine
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial truth calculations performed directly in this engine.
 * Consumes FinancialSnapshot, FinancialTimeline, and FinancialIntelligence to project future financial state.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialIntelligence } from './FinancialIntelligence';
import {
  FinancialForecast,
  ForecastPeriodDays,
  ForecastScenarioType,
  ForecastScenarioConfig,
  ProjectedPoint,
  ForecastInsight
} from './FinancialForecast';

export interface ForecastEngineInputs {
  snapshot: FinancialSnapshot;
  timeline?: FinancialTimeline;
  intelligence?: FinancialIntelligence;
  horizonDays?: ForecastPeriodDays;
  scenario?: ForecastScenarioType;
  customConfig?: Partial<ForecastScenarioConfig>;
  language?: Language;
}

export class ForecastEngine {
  /**
   * Resolves Scenario Configurations for projection orchestration.
   */
  public static getScenarioConfig(
    scenario: ForecastScenarioType = 'current_trend',
    customConfig?: Partial<ForecastScenarioConfig>
  ): ForecastScenarioConfig {
    const baseConfigs: Record<Exclude<ForecastScenarioType, 'custom'>, ForecastScenarioConfig> = {
      current_trend: {
        type: 'current_trend',
        incomeMultiplier: 1.0,
        expenseMultiplier: 1.0,
        annualInvestmentReturnRate: 0.07,
        debtPaydownMultiplier: 1.0
      },
      optimistic: {
        type: 'optimistic',
        incomeMultiplier: 1.1,
        expenseMultiplier: 0.9,
        annualInvestmentReturnRate: 0.1,
        debtPaydownMultiplier: 1.25
      },
      conservative: {
        type: 'conservative',
        incomeMultiplier: 0.95,
        expenseMultiplier: 1.05,
        annualInvestmentReturnRate: 0.04,
        debtPaydownMultiplier: 0.85
      },
      aggressive: {
        type: 'aggressive',
        incomeMultiplier: 1.2,
        expenseMultiplier: 0.85,
        annualInvestmentReturnRate: 0.12,
        debtPaydownMultiplier: 1.5
      }
    };

    if (scenario === 'custom') {
      return {
        type: 'custom',
        incomeMultiplier: customConfig?.incomeMultiplier ?? 1.0,
        expenseMultiplier: customConfig?.expenseMultiplier ?? 1.0,
        annualInvestmentReturnRate: customConfig?.annualInvestmentReturnRate ?? 0.07,
        debtPaydownMultiplier: customConfig?.debtPaydownMultiplier ?? 1.0
      };
    }

    return baseConfigs[scenario] || baseConfigs.current_trend;
  }

  /**
   * Projects future financial states given domain outputs.
   */
  public static project(inputs: ForecastEngineInputs): FinancialForecast {
    const { snapshot, horizonDays = 90, scenario = 'current_trend', customConfig, language = 'vi' } = inputs;
    const isVi = language === 'vi';
    const config = ForecastEngine.getScenarioConfig(scenario, customConfig) || {
      type: 'current_trend',
      incomeMultiplier: 1.0,
      expenseMultiplier: 1.0,
      annualInvestmentReturnRate: 0.07,
      debtPaydownMultiplier: 1.0
    };

    const horizon = typeof horizonDays === 'number' && horizonDays > 0 ? horizonDays : 90;
    const monthsFraction = horizon / 30;
    const yearsFraction = horizon / 365;

    // 1. Projected Income & Expenses
    const projectedMonthlyIncome = snapshot.monthlyIncome * config.incomeMultiplier;
    const projectedMonthlyExpense = snapshot.monthlyExpense * config.expenseMultiplier;
    const monthlyNetSurplus = projectedMonthlyIncome - projectedMonthlyExpense;

    // 2. Projected Cash Balance
    const projectedCashBalance = snapshot.cashBalance + monthlyNetSurplus * monthsFraction;

    // 3. Projected Investment Growth & Total Value
    const currentInvestment = snapshot.investmentValue.totalPortfolioValue;
    const projectedInvestmentGrowth = currentInvestment * (config.annualInvestmentReturnRate * yearsFraction);
    const projectedInvestmentValue = currentInvestment + projectedInvestmentGrowth;

    // 4. Projected Debt Balance
    const currentDebt = snapshot.debtSummary.totalDebtOwed;
    const monthlyDebtPayment = snapshot.debtSummary.monthlyMinDebtPayment * config.debtPaydownMultiplier;
    const projectedDebtBalance = Math.max(0, currentDebt - monthlyDebtPayment * monthsFraction);

    // 5. Projected Savings & Emergency Fund
    const projectedSavingsProgress = snapshot.savingsProgress.totalSaved + Math.max(0, monthlyNetSurplus * 0.3 * monthsFraction);
    const projectedEmergencyFundMonths =
      projectedMonthlyExpense > 0 ? snapshot.emergencyFund.currentBalance / projectedMonthlyExpense : 0;

    // 6. Projected Net Worth
    const projectedNetWorth = projectedCashBalance + projectedInvestmentValue + projectedSavingsProgress - projectedDebtBalance;

    // 7. Projected Budget Consumption & FIRE Progress
    const projectedBudgetConsumptionPercent =
      projectedMonthlyExpense > 0 && snapshot.budgetSummary.totalAllocated > 0
        ? (projectedMonthlyExpense / snapshot.budgetSummary.totalAllocated) * 100
        : 0;

    const projectedFireProgressPercent =
      snapshot.fireProgress.targetNetWorth > 0
        ? Math.min(100, Math.round((projectedNetWorth / snapshot.fireProgress.targetNetWorth) * 100))
        : 0;

    // 8. Generate Projected Timeline Points (e.g. 4 evenly spaced points)
    const pointsCount = 4;
    const timelinePoints: ProjectedPoint[] = [];
    const nowMs = new Date(snapshot.timestamp || Date.now()).getTime();

    for (let i = 1; i <= pointsCount; i++) {
      const stepDays = Math.round((horizon / pointsCount) * i);
      const stepMonths = stepDays / 30;
      const stepYears = stepDays / 365;

      const stepDate = new Date(nowMs + stepDays * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      const stepCash = snapshot.cashBalance + monthlyNetSurplus * stepMonths;
      const stepInvVal = currentInvestment + currentInvestment * (config.annualInvestmentReturnRate * stepYears);
      const stepDebt = Math.max(0, currentDebt - monthlyDebtPayment * stepMonths);
      const stepSavings = snapshot.savingsProgress.totalSaved + Math.max(0, monthlyNetSurplus * 0.3 * stepMonths);
      const stepNetWorth = stepCash + stepInvVal + stepSavings - stepDebt;

      timelinePoints.push({
        date: stepDate,
        daysFromNow: stepDays,
        projectedCashBalance: stepCash,
        projectedNetWorth: stepNetWorth,
        projectedMonthlyIncome,
        projectedMonthlyExpense,
        projectedSavings: stepSavings,
        projectedInvestmentValue: stepInvVal,
        projectedDebtBalance: stepDebt,
        projectedEmergencyFundMonths,
        projectedFireProgressPercent:
          snapshot.fireProgress.targetNetWorth > 0
            ? Math.min(100, Math.round((stepNetWorth / snapshot.fireProgress.targetNetWorth) * 100))
            : 0
      });
    }

    // 9. Generate Forecast Insights
    const insights: ForecastInsight[] = [];

    if (projectedNetWorth > snapshot.netWorth && monthlyNetSurplus >= 0) {
      insights.push({
        id: 'fc_insight_on_track',
        type: 'on_track',
        title: isVi ? 'Lộ trình tài chính đúng hướng' : 'Financial Trajectory On Track',
        description: isVi
          ? `Tài sản ròng dự kiến đạt ${projectedNetWorth.toLocaleString()} ${snapshot.currency} sau ${horizon} ngày.`
          : `Projected net worth reaches ${projectedNetWorth} after ${horizon} days.`,
        confidence: 0.92,
        targetMetric: 'net_worth'
      });
    }

    if (monthlyNetSurplus < 0 || projectedCashBalance < 0) {
      insights.push({
        id: 'fc_insight_high_risk',
        type: 'high_risk',
        title: isVi ? 'Cảnh báo rủi ro thâm hụt tiền mặt' : 'High Deficit Risk Warning',
        description: isVi
          ? `Chi tiêu dự kiến lớn hơn thu nhập, tiền mặt có nguy cơ thâm hụt sau ${horizon} ngày.`
          : `Projected expenses exceed income, risking liquidity deficit in ${horizon} days.`,
        confidence: 0.88,
        targetMetric: 'cash_balance'
      });
    }

    if (projectedFireProgressPercent >= 100) {
      insights.push({
        id: 'fc_insight_fire_reachable',
        type: 'target_reachable',
        title: isVi ? 'Mục tiêu Tự do Tài chính khả thi' : 'FIRE Goal Within Reach',
        description: isVi
          ? `Theo kịch bản ${scenario}, bạn có khả năng đạt mục tiêu FIRE trong kỳ dự báo.`
          : `Under scenario ${scenario}, FIRE target is reachable within forecast horizon.`,
        confidence: 0.85,
        targetMetric: 'fire_progress'
      });
    } else if (snapshot.fireProgress.yearsToFIRE > 20 && config.type === 'conservative') {
      insights.push({
        id: 'fc_insight_fire_delayed',
        type: 'delayed',
        title: isVi ? 'Tiến độ FIRE bị chậm' : 'FIRE Progress Delayed',
        description: isVi
          ? `Kịch bản thận trọng cho thấy lộ trình FIRE bị kéo dài.`
          : `Conservative scenario indicates extended timeline to FIRE.`,
        confidence: 0.8,
        targetMetric: 'fire_progress'
      });
    }

    if (projectedDebtBalance === 0 && currentDebt > 0) {
      insights.push({
        id: 'fc_insight_recovery',
        type: 'recovery_expected',
        title: isVi ? 'Dự kiến hoàn tất trả nợ' : 'Debt Payoff Projected',
        description: isVi
          ? `Dự báo hoàn tất dư nợ trong khoảng thời gian ${horizon} ngày.`
          : `Expected to completely eliminate remaining debt balance within ${horizon} days.`,
        confidence: 0.9,
        targetMetric: 'debt_balance'
      });
    }

    const forecast: FinancialForecast = {
      timestamp: new Date().toISOString(),
      spaceId: snapshot.spaceId,
      horizonDays: horizon,
      scenario,
      startingSnapshotTimestamp: snapshot.timestamp,
      projectedCashBalance,
      projectedNetWorth,
      projectedMonthlyExpense,
      projectedMonthlyIncome,
      projectedSavingsProgress,
      projectedInvestmentGrowth,
      projectedDebtBalance,
      projectedBudgetConsumptionPercent,
      projectedEmergencyFundMonths,
      projectedFireProgressPercent,
      timelinePoints: Object.freeze(timelinePoints),
      insights: Object.freeze(insights)
    };

    return Object.freeze(forecast);
  }
}
