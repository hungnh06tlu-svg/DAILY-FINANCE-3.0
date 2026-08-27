/**
 * Daily Finance 3.0 — D2-003: DCAEngine
 * Safe domain extension for Dollar-Cost Averaging (DCA) and DCA vs Lump-Sum Investing (LSI) comparisons.
 */

import {
  DCAPeriodEntry,
  DCASimulationResult,
  DCAvsLumpSumComparison
} from './types';

export class DCAEngine {
  /**
   * Simulates Dollar-Cost Averaging across a sequence of asset prices.
   * Purchases fractional units: units = periodicInvestment / assetPrice.
   */
  static simulateDCA(
    periodicInvestment: number,
    assetPrices: number[]
  ): DCASimulationResult {
    const validAmount = Math.max(0, periodicInvestment);
    if (assetPrices.length === 0 || validAmount === 0) {
      return {
        totalCapitalInvested: 0,
        totalUnitsAccumulated: 0,
        averageCostBasis: 0,
        currentAssetPrice: 0,
        finalPortfolioValue: 0,
        totalReturnAmount: 0,
        totalReturnPercent: 0,
        periods: []
      };
    }

    const periods: DCAPeriodEntry[] = [];
    let cumulativeUnits = 0;
    let cumulativeInvested = 0;

    for (let i = 0; i < assetPrices.length; i++) {
      const price = Math.max(0.0001, assetPrices[i]);
      const unitsPurchased = validAmount / price;
      cumulativeUnits += unitsPurchased;
      cumulativeInvested += validAmount;

      const portfolioValue = cumulativeUnits * price;

      periods.push({
        period: i + 1,
        assetPrice: price,
        amountInvested: validAmount,
        unitsPurchased: Number(unitsPurchased.toFixed(6)),
        cumulativeUnits: Number(cumulativeUnits.toFixed(6)),
        cumulativeInvested,
        portfolioValue: Math.round(portfolioValue)
      });
    }

    const lastPrice = assetPrices[assetPrices.length - 1];
    const finalPortfolioValue = Math.round(cumulativeUnits * lastPrice);
    const totalReturnAmount = finalPortfolioValue - cumulativeInvested;
    const totalReturnPercent = cumulativeInvested > 0
      ? Number(((totalReturnAmount / cumulativeInvested) * 100).toFixed(2))
      : 0;
    const averageCostBasis = cumulativeUnits > 0
      ? Number((cumulativeInvested / cumulativeUnits).toFixed(2))
      : 0;

    return {
      totalCapitalInvested: cumulativeInvested,
      totalUnitsAccumulated: Number(cumulativeUnits.toFixed(6)),
      averageCostBasis,
      currentAssetPrice: lastPrice,
      finalPortfolioValue,
      totalReturnAmount,
      totalReturnPercent,
      periods
    };
  }

  /**
   * Compares Dollar-Cost Averaging with Lump-Sum Investing (LSI) using the same total capital.
   */
  static compareDCAvsLumpSum(
    totalCapital: number,
    assetPrices: number[]
  ): DCAvsLumpSumComparison {
    const validTotalCapital = Math.max(0, totalCapital);
    const periodsCount = Math.max(1, assetPrices.length);
    const periodicInvestment = validTotalCapital / periodsCount;

    const dca = this.simulateDCA(periodicInvestment, assetPrices);

    const initialPrice = assetPrices.length > 0 ? Math.max(0.0001, assetPrices[0]) : 1;
    const lastPrice = assetPrices.length > 0 ? assetPrices[assetPrices.length - 1] : initialPrice;

    const lumpSumUnits = validTotalCapital / initialPrice;
    const lumpSumFinalValue = Math.round(lumpSumUnits * lastPrice);
    const lumpSumReturnAmount = lumpSumFinalValue - validTotalCapital;
    const lumpSumReturnPercent = validTotalCapital > 0
      ? Number(((lumpSumReturnAmount / validTotalCapital) * 100).toFixed(2))
      : 0;

    let winner: 'dca' | 'lump_sum' | 'tie' = 'tie';
    if (dca.finalPortfolioValue > lumpSumFinalValue) {
      winner = 'dca';
    } else if (lumpSumFinalValue > dca.finalPortfolioValue) {
      winner = 'lump_sum';
    }

    const outperformanceAmount = Math.abs(dca.finalPortfolioValue - lumpSumFinalValue);
    const outperformancePercent = Number(Math.abs(dca.totalReturnPercent - lumpSumReturnPercent).toFixed(2));

    // Volatility buffer indicates if DCA achieved lower average cost than initial price
    const volatilityBufferPercent = initialPrice > 0
      ? Number((((initialPrice - dca.averageCostBasis) / initialPrice) * 100).toFixed(2))
      : 0;

    return {
      dca,
      lumpSum: {
        initialPrice,
        totalCapitalInvested: validTotalCapital,
        unitsPurchased: Number(lumpSumUnits.toFixed(6)),
        finalPortfolioValue: lumpSumFinalValue,
        totalReturnAmount: lumpSumReturnAmount,
        totalReturnPercent: lumpSumReturnPercent
      },
      winner,
      outperformanceAmount,
      outperformancePercent,
      dcaAverageCost: dca.averageCostBasis,
      lumpSumCost: initialPrice,
      volatilityBufferPercent
    };
  }
}
