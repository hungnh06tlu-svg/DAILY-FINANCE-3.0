/**
 * Daily Finance 3.0 — D2-003S5: Advanced Debt Strategy ViewModel
 * Pure presentation adapter delegating Snowball vs Avalanche payoff calculations to AdvancedDebtStrategyEngine.
 */

import { AdvancedDebtStrategyEngine } from '../../domain/methods/AdvancedDebtStrategyEngine';
import {
  DebtStrategySimulationResult,
  DebtStrategyComparisonResult
} from '../../domain/methods/types';
import { DebtItem } from '../../types';

export interface AdvancedDebtUiState {
  comparison: DebtStrategyComparisonResult | null;
  snowball: DebtStrategySimulationResult | null;
  avalanche: DebtStrategySimulationResult | null;
  isLoading: boolean;
  error?: string | null;
}

export class AdvancedDebtViewModel {
  /**
   * Compares Snowball and Avalanche payoff strategies.
   */
  async compareStrategies(
    debts: DebtItem[],
    extraMonthlyBudget: number = 0
  ): Promise<AdvancedDebtUiState> {
    try {
      const comparison = AdvancedDebtStrategyEngine.compareStrategies(debts, extraMonthlyBudget);
      return {
        comparison,
        snowball: comparison.snowball,
        avalanche: comparison.avalanche,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        comparison: null,
        snowball: null,
        avalanche: null,
        isLoading: false,
        error: err?.message || 'Failed to compare debt payoff strategies'
      };
    }
  }
}
