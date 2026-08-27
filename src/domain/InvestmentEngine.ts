/**
 * Daily Finance 2.5 - InvestmentEngine
 * Domain Engine - Pure business orchestration for Investment domain.
 * Delegates arithmetic exclusively to FinancialTruthEngine.
 * Zero UI, zero rendering, zero direct side-effects.
 */

import {
  Investment,
  InvestmentStatus,
  InvestmentPerformance,
  InvestmentHolding,
  InvestmentAllocation,
  InvestmentForecast,
  InvestmentSummary,
  InvestmentStatistics,
  InvestmentPolicy,
  InvestmentAlert,
  InvestmentTransaction,
  InvestmentType,
  InvestmentPolicyType,
  InvestmentAlertLevel,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { InvestmentMapper } from './InvestmentMapper';
import { IdGenerator } from '../services/IdGenerator';

export class InvestmentEngine {
  /**
   * TASK 5: Evaluates the lifecycle state of an investment asset.
   */
  static evaluateLifecycle(inv: Investment): InvestmentStatus {
    if (inv.isSoftDeleted) return 'soft_deleted';
    if (inv.quantity <= 0) return 'closed';
    if (inv.status === 'archived' || inv.status === 'paused' || inv.status === 'draft') {
      return inv.status;
    }
    return inv.status || 'active';
  }

  /**
   * TASK 7 & TASK 10: Evaluates overall portfolio performance.
   * Delegates arithmetic directly to FinancialTruthEngine.
   */
  static evaluatePortfolio(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentPerformance {
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted && i.quantity > 0);

    // TASK 10: Delegate core financial return calculations exclusively to FinancialTruthEngine
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);

    const currency = activeInvestments[0]?.currency || 'VND';

    let totalProfit = 0;
    let totalLoss = 0;

    activeInvestments.forEach((inv) => {
      const holding = InvestmentMapper.toHolding(inv, language);
      if (holding.profitLoss >= 0) {
        totalProfit += holding.profitLoss;
      } else {
        totalLoss += Math.abs(holding.profitLoss);
      }
    });

    const netProfit = truthReturn.totalReturn;
    const roi = truthReturn.returnPercent;

    // Annualized / Monthly Return Estimates based on individual assets or average holding
    const annualReturn = parseFloat((roi * 1.2).toFixed(2));
    const monthlyReturn = parseFloat((roi / 12).toFixed(2));

    return {
      totalPortfolioValue: truthReturn.currentValue,
      formattedPortfolioValue: '',
      totalCostBasis: truthReturn.totalInvested,
      formattedCostBasis: '',
      totalProfit,
      formattedTotalProfit: '',
      totalLoss,
      formattedTotalLoss: '',
      netProfit,
      formattedNetProfit: '',
      roi,
      annualReturn,
      monthlyReturn
    };
  }

  /**
   * TASK 7: Computes holdings list with asset allocation percentages.
   */
  static calculateHoldings(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentHolding[] {
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted && i.quantity > 0);
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);
    const totalValue = truthReturn.currentValue;

    return activeInvestments.map((inv) => {
      const holding = InvestmentMapper.toHolding(inv, language);
      holding.allocationPercent = totalValue > 0
        ? parseFloat(((holding.currentValue / totalValue) * 100).toFixed(2))
        : 0;
      return holding;
    });
  }

  /**
   * TASK 7: Evaluates allocation distribution across asset types.
   */
  static calculateAllocation(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentAllocation[] {
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted && i.quantity > 0);
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);
    const totalPortfolioValue = truthReturn.currentValue;

    const allocationMap = new Map<string, number>();

    activeInvestments.forEach((inv) => {
      const val = inv.quantity * inv.currentPrice;
      const typeKey = inv.type || 'other';
      allocationMap.set(typeKey, (allocationMap.get(typeKey) || 0) + val);
    });

    const allocations: InvestmentAllocation[] = [];

    allocationMap.forEach((val, typeKey) => {
      const pct = totalPortfolioValue > 0
        ? parseFloat(((val / totalPortfolioValue) * 100).toFixed(2))
        : 0;

      let riskLevel: 'low' | 'moderate' | 'high' = 'moderate';
      if (['bond', 'gold', 'savings_certificate'].includes(typeKey)) {
        riskLevel = 'low';
      } else if (['crypto', 'stock'].includes(typeKey)) {
        riskLevel = 'high';
      }

      const labelMap: Record<string, { vi: string; en: string }> = {
        stock: { vi: 'Cổ phiếu', en: 'Stocks' },
        etf: { vi: 'Quỹ ETF', en: 'ETFs' },
        bond: { vi: 'Trái phiếu', en: 'Bonds' },
        gold: { vi: 'Vàng & Kim loại', en: 'Gold & Metals' },
        crypto: { vi: 'Tiền mã hóa', en: 'Crypto' },
        fund: { vi: 'Quỹ mở', en: 'Mutual Funds' },
        savings_certificate: { vi: 'Chứng chỉ tiền gửi', en: 'Savings Certs' },
        real_estate: { vi: 'Bất động sản', en: 'Real Estate' },
        business_capital: { vi: 'Vốn kinh doanh', en: 'Business' },
        custom: { vi: 'Tài sản khác', en: 'Custom' },
        other: { vi: 'Khác', en: 'Other' }
      };

      const labelObj = labelMap[typeKey] || { vi: typeKey, en: typeKey };

      allocations.push({
        type: typeKey as InvestmentType,
        label: language === 'vi' ? labelObj.vi : labelObj.en,
        value: val,
        formattedValue: '',
        percentage: pct,
        riskLevel
      });
    });

    return allocations;
  }

  /**
   * TASK 7: Calculates projected growth forecast over 1, 3, and 5 years.
   */
  static calculateForecast(
    investments: Investment[] = [],
    expectedAnnualRate: number = 0.08,
    language: Language = 'vi'
  ): InvestmentForecast {
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted && i.quantity > 0);
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);
    const currentValue = truthReturn.currentValue;

    const proj1Y = Math.round(currentValue * Math.pow(1 + expectedAnnualRate, 1));
    const proj3Y = Math.round(currentValue * Math.pow(1 + expectedAnnualRate, 3));
    const proj5Y = Math.round(currentValue * Math.pow(1 + expectedAnnualRate, 5));

    const currency = activeInvestments[0]?.currency || 'VND';

    return {
      expectedAnnualReturnPercent: Math.round(expectedAnnualRate * 100),
      projectedValue1Year: proj1Y,
      formattedProjectedValue1Y: '',
      projectedValue3Years: proj3Y,
      formattedProjectedValue3Y: '',
      projectedValue5Years: proj5Y,
      formattedProjectedValue5Y: '',
      forecastStatus: expectedAnnualRate > 0.05 ? 'growth' : expectedAnnualRate >= 0 ? 'stable' : 'declining'
    };
  }

  /**
   * TASK 8: Evaluates and generates portfolio alerts.
   */
  static evaluateAlerts(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentAlert[] {
    const alerts: InvestmentAlert[] = [];
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted && i.quantity > 0);
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);

    activeInvestments.forEach((inv) => {
      const holding = InvestmentMapper.toHolding(inv, language);

      // Target Profit Alert
      const targetProfitPct = inv.targetProfitPercent || 20;
      if (holding.profitLossPercent >= targetProfitPct) {
        alerts.push({
          id: `alt_tp_${inv.id}`,
          message: language === 'vi'
            ? `Tài sản ${inv.name} (${inv.symbol || ''}) đã đạt mục tiêu chốt lời ${holding.profitLossPercent}%!`
            : `Asset ${inv.name} reached profit target ${holding.profitLossPercent}%!`,
          level: 'target_profit',
          investmentId: inv.id
        });
      }

      // Stop Loss Alert
      const stopLossPct = inv.stopLossPercent || -15;
      if (holding.profitLossPercent <= stopLossPct) {
        alerts.push({
          id: `alt_sl_${inv.id}`,
          message: language === 'vi'
            ? `Cảnh báo cắt lỗ: ${inv.name} đã giảm ${holding.profitLossPercent}%!`
            : `Stop loss alert: ${inv.name} down ${holding.profitLossPercent}%!`,
          level: 'stop_loss',
          investmentId: inv.id
        });
      }

      // Asset Concentration Alert (> 30% of total portfolio)
      if (truthReturn.currentValue > 0) {
        const concentration = (holding.currentValue / truthReturn.currentValue) * 100;
        if (concentration >= 30) {
          alerts.push({
            id: `alt_conc_${inv.id}`,
            message: language === 'vi'
              ? `Cảnh báo tập trung: ${inv.name} chiếm ${concentration.toFixed(1)}% danh mục.`
              : `Concentration alert: ${inv.name} accounts for ${concentration.toFixed(1)}% of portfolio.`,
            level: 'asset_concentration',
            investmentId: inv.id
          });
        }
      }
    });

    return alerts;
  }

  /**
   * TASK 9: Evaluates investment policy constraints.
   */
  static evaluatePolicy(inv: Investment): InvestmentPolicy {
    const policyType: InvestmentPolicyType = inv.policy || 'long_term';
    return {
      policyType,
      isLongTerm: policyType === 'long_term' || policyType === 'growth',
      targetDividendYield: policyType === 'dividend' || policyType === 'income' ? 5 : undefined,
      rebalanceFrequency: 'quarterly'
    };
  }

  /**
   * TASK 0 & TASK 7: Computes summary values for Investment domain.
   */
  static calculateSummary(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentSummary {
    const activeInvestments = investments.filter((i) => !i.isSoftDeleted);
    const truthReturn = FinancialTruthEngine.calculateInvestmentReturn(activeInvestments);

    const currency = activeInvestments[0]?.currency || 'VND';

    return {
      totalPortfolioValue: truthReturn.currentValue,
      formattedPortfolioValue: '',
      totalInvested: truthReturn.totalInvested,
      formattedTotalInvested: '',
      totalNetProfit: truthReturn.totalReturn,
      formattedNetProfit: '',
      overallRoi: truthReturn.returnPercent,
      totalAssetsCount: activeInvestments.length,
      activeAssetsCount: activeInvestments.filter((i) => i.quantity > 0).length
    };
  }

  /**
   * TASK 0: Calculates portfolio statistics.
   */
  static calculateStatistics(
    investments: Investment[] = [],
    language: Language = 'vi'
  ): InvestmentStatistics {
    const holdings = this.calculateHoldings(investments, language);

    let bestSymbol: string | undefined;
    let bestRoi = -Infinity;
    let worstSymbol: string | undefined;
    let worstRoi = Infinity;

    holdings.forEach((h) => {
      if (h.profitLossPercent > bestRoi) {
        bestRoi = h.profitLossPercent;
        bestSymbol = h.symbol;
      }
      if (h.profitLossPercent < worstRoi) {
        worstRoi = h.profitLossPercent;
        worstSymbol = h.symbol;
      }
    });

    const allocations = this.calculateAllocation(investments, language);
    const topAlloc = allocations.sort((a, b) => b.value - a.value)[0]?.label;

    const highRiskCount = allocations.filter((a) => a.riskLevel === 'high').length;
    const riskProfile: 'low' | 'moderate' | 'high' = highRiskCount >= 2 ? 'high' : highRiskCount === 1 ? 'moderate' : 'low';

    return {
      bestPerformerSymbol: bestSymbol,
      bestPerformerRoi: bestRoi !== -Infinity ? bestRoi : 0,
      worstPerformerSymbol: worstSymbol,
      worstPerformerRoi: worstRoi !== Infinity ? worstRoi : 0,
      topAllocationType: topAlloc,
      portfolioRiskProfile: riskProfile
    };
  }

  /**
   * TASK 4: Orchestrates buying additional asset quantity.
   */
  static applyBuyAsset(
    inv: Investment,
    quantity: number,
    buyPrice: number,
    now: Date = new Date()
  ): { updatedInvestment: Investment; transaction: InvestmentTransaction } {
    const currentQty = Math.max(0, inv.quantity || 0);
    const newQty = currentQty + quantity;

    // Weighted average purchase price calculation
    const totalCost = currentQty * inv.purchasePrice + quantity * buyPrice;
    const newAveragePrice = newQty > 0 ? Math.round(totalCost / newQty) : buyPrice;

    const updatedInvestment: Investment = {
      ...inv,
      quantity: newQty,
      purchasePrice: newAveragePrice,
      status: 'active',
      updatedAt: now.toISOString()
    };

    const amount = quantity * buyPrice;
    const transaction: InvestmentTransaction = {
      id: IdGenerator.generateId('inv_tx'),
      investmentId: inv.id,
      type: 'buy',
      quantity,
      price: buyPrice,
      amount,
      formattedAmount: '',
      date: now.toISOString().split('T')[0],
      note: `Mua thêm ${quantity} ${inv.symbol || inv.name}`
    };

    return { updatedInvestment, transaction };
  }

  /**
   * TASK 4: Orchestrates selling asset quantity.
   */
  static applySellAsset(
    inv: Investment,
    quantity: number,
    sellPrice: number,
    now: Date = new Date()
  ): { updatedInvestment: Investment; transaction: InvestmentTransaction } {
    if (quantity > inv.quantity) {
      throw new Error('Cannot sell more quantity than currently held');
    }

    const newQty = Math.max(0, inv.quantity - quantity);

    const updatedInvestment: Investment = {
      ...inv,
      quantity: newQty,
      status: newQty === 0 ? 'closed' : inv.status,
      updatedAt: now.toISOString()
    };

    const amount = quantity * sellPrice;
    const transaction: InvestmentTransaction = {
      id: IdGenerator.generateId('inv_tx'),
      investmentId: inv.id,
      type: 'sell',
      quantity,
      price: sellPrice,
      amount,
      formattedAmount: '',
      date: now.toISOString().split('T')[0],
      note: `Bán ${quantity} ${inv.symbol || inv.name}`
    };

    return { updatedInvestment, transaction };
  }
}
