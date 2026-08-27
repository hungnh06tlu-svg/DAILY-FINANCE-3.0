/**
 * Daily Finance 3.0 - TimelineBuilder
 * Builder for FinancialTimeline Read Model
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial arithmetic calculations performed directly in this builder.
 * Assemblies historical timeline entries, trend vectors, and timeline insights from FinancialSnapshots.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { SnapshotBuilder, SnapshotBuilderInputs } from './SnapshotBuilder';
import {
  FinancialTimeline,
  TimelinePoint,
  TimelineGranularity,
  FinancialTrend,
  TimelineInsight,
  TrendDirection,
  TrendMetricName
} from './FinancialTimeline';

export interface TimelineBuilderInputs {
  spaceId?: string;
  granularity?: TimelineGranularity;
  language?: Language;
  snapshots?: FinancialSnapshot[];
  rawInputsList?: SnapshotBuilderInputs[];
}

export class TimelineBuilder {
  /**
   * Assembles a FinancialTimeline from a series of FinancialSnapshots or raw inputs.
   */
  public static build(inputs: TimelineBuilderInputs): FinancialTimeline {
    const spaceId = inputs.spaceId || 'sp_personal';
    const granularity: TimelineGranularity = inputs.granularity || 'monthly';
    const language: Language = inputs.language || 'vi';
    const isVi = language === 'vi';

    // 1. Resolve snapshots
    let snapshots: FinancialSnapshot[] = inputs.snapshots ? [...inputs.snapshots] : [];

    if (snapshots.length === 0 && inputs.rawInputsList && inputs.rawInputsList.length > 0) {
      snapshots = inputs.rawInputsList.map(rawInput => SnapshotBuilder.build({ ...rawInput, spaceId, language }));
    }

    if (snapshots.length === 0) {
      // Fallback single current snapshot
      snapshots.push(SnapshotBuilder.build({ spaceId, language }));
    }

    // Sort snapshots chronologically
    snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 2. Map snapshots to TimelinePoints
    const points: TimelinePoint[] = snapshots.map((snap, idx) => {
      const budgetStatus: 'normal' | 'caution' | 'overspent' =
        snap.budgetSummary.overspentBudgetsCount > 0
          ? 'overspent'
          : snap.budgetSummary.totalRemaining < snap.budgetSummary.totalAllocated * 0.15
          ? 'caution'
          : 'normal';

      const dateObj = new Date(snap.timestamp);
      let periodLabel = snap.timestamp.substring(0, 7);

      if (granularity === 'daily') {
        periodLabel = snap.timestamp.substring(0, 10);
      } else if (granularity === 'weekly') {
        periodLabel = `${dateObj.getFullYear()}-W${Math.ceil(dateObj.getDate() / 7)}`;
      } else if (granularity === 'quarterly') {
        const q = Math.floor(dateObj.getMonth() / 3) + 1;
        periodLabel = `${dateObj.getFullYear()}-Q${q}`;
      } else if (granularity === 'yearly') {
        periodLabel = `${dateObj.getFullYear()}`;
      }

      return {
        timestamp: snap.timestamp,
        periodLabel,
        snapshot: snap,
        netWorth: snap.netWorth,
        cash: snap.cashBalance,
        income: snap.monthlyIncome,
        expense: snap.monthlyExpense,
        savingsProgress: snap.savingsProgress.totalSaved,
        investmentValue: snap.investmentValue.totalPortfolioValue,
        debt: snap.debtSummary.totalDebtOwed,
        budgetStatus,
        emergencyFund: snap.emergencyFund.currentBalance,
        financialHealth: snap.financialHealthScore.overallScore
      };
    });

    // 3. Derive Trends across points
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    const evaluateMetricTrend = (
      metric: TrendMetricName,
      startVal: number,
      endVal: number,
      higherIsBetter: boolean
    ): FinancialTrend => {
      const changeAmount = endVal - startVal;
      const changePercent = startVal !== 0 ? (changeAmount / Math.abs(startVal)) * 100 : 0;

      let direction: TrendDirection = 'stable';
      if (Math.abs(changePercent) < 2 && Math.abs(changeAmount) < 1000) {
        direction = 'stable';
      } else if (changeAmount > 0) {
        direction = higherIsBetter ? 'improving' : 'declining';
        if (changePercent > 20) direction = higherIsBetter ? 'acceleration' : 'volatile';
      } else {
        direction = higherIsBetter ? 'declining' : 'improving';
        if (changePercent < -20) direction = higherIsBetter ? 'slowdown' : 'recovery';
      }

      const formattedChange = Math.abs(changeAmount).toLocaleString();
      let description = '';

      if (isVi) {
        description = `${metric.toUpperCase()} ${changeAmount >= 0 ? 'tăng' : 'giảm'} ${formattedChange} (${changePercent.toFixed(1)}%)`;
      } else {
        description = `${metric.toUpperCase()} ${changeAmount >= 0 ? 'increased' : 'decreased'} by ${formattedChange} (${changePercent.toFixed(1)}%)`;
      }

      return {
        metric,
        direction,
        changeAmount,
        changePercent,
        description
      };
    };

    const trends: FinancialTrend[] = [
      evaluateMetricTrend('net_worth', firstPoint.netWorth, lastPoint.netWorth, true),
      evaluateMetricTrend('income', firstPoint.income, lastPoint.income, true),
      evaluateMetricTrend('expense', firstPoint.expense, lastPoint.expense, false),
      evaluateMetricTrend('savings', firstPoint.savingsProgress, lastPoint.savingsProgress, true),
      evaluateMetricTrend('investment', firstPoint.investmentValue, lastPoint.investmentValue, true),
      evaluateMetricTrend('debt', firstPoint.debt, lastPoint.debt, false),
      evaluateMetricTrend('health', firstPoint.financialHealth, lastPoint.financialHealth, true)
    ];

    // 4. Generate Timeline Insights
    const insights: TimelineInsight[] = [];

    const netWorthTrend = trends.find(t => t.metric === 'net_worth');
    if (netWorthTrend) {
      if (netWorthTrend.direction === 'improving' || netWorthTrend.direction === 'acceleration') {
        insights.push({
          id: 'tl_insight_nw_growth',
          type: netWorthTrend.direction,
          title: isVi ? 'Tài sản ròng tăng trưởng' : 'Net Worth Growth',
          description: isVi
            ? `Tài sản ròng của bạn tăng ${netWorthTrend.changePercent.toFixed(1)}% so với đầu kỳ.`
            : `Your net worth increased by ${netWorthTrend.changePercent.toFixed(1)}% compared to period start.`,
          affectedMetric: 'net_worth'
        });
      } else if (netWorthTrend.direction === 'declining' || netWorthTrend.direction === 'slowdown') {
        insights.push({
          id: 'tl_insight_nw_decline',
          type: netWorthTrend.direction,
          title: isVi ? 'Tài sản ròng suy giảm' : 'Net Worth Decline',
          description: isVi
            ? `Tài sản ròng suy giảm ${Math.abs(netWorthTrend.changePercent).toFixed(1)}%.`
            : `Net worth declined by ${Math.abs(netWorthTrend.changePercent).toFixed(1)}%.`,
          affectedMetric: 'net_worth'
        });
      }
    }

    const debtTrend = trends.find(t => t.metric === 'debt');
    if (debtTrend && debtTrend.changeAmount < 0) {
      insights.push({
        id: 'tl_insight_debt_recovery',
        type: 'recovery',
        title: isVi ? 'Tiến trình giảm nợ tích cực' : 'Positive Debt Reduction',
        description: isVi ? 'Dư nợ giảm đều đặn theo mốc thời gian.' : 'Total debt reduced steadily over time.',
        affectedMetric: 'debt'
      });
    }

    const healthTrend = trends.find(t => t.metric === 'health');
    if (healthTrend && healthTrend.changeAmount > 0) {
      insights.push({
        id: 'tl_insight_health_improving',
        type: 'improving',
        title: isVi ? 'Điểm sức khỏe tài chính nâng cao' : 'Financial Health Score Improved',
        description: isVi ? 'Chỉ số sức khỏe tổng thể cải thiện qua các mốc thời gian.' : 'Overall financial health score improved across time points.',
        affectedMetric: 'health'
      });
    }

    const timeline: FinancialTimeline = {
      spaceId,
      granularity,
      points: Object.freeze(points),
      trends: Object.freeze(trends),
      insights: Object.freeze(insights),
      startDate: firstPoint.timestamp,
      endDate: lastPoint.timestamp
    };

    return Object.freeze(timeline);
  }
}
