/**
 * Daily Finance 3.0 — D2-003S5: DCA (Dollar-Cost Averaging) ViewModel
 * Pure presentation adapter delegating DCA calculations & comparison to DCAEngine.
 */

import { DCAEngine } from '../../domain/methods/DCAEngine';
import {
  DCASimulationResult,
  DCAvsLumpSumComparison
} from '../../domain/methods/types';

export interface DCAUiState {
  simulation: DCASimulationResult | null;
  comparison: DCAvsLumpSumComparison | null;
  isLoading: boolean;
  error?: string | null;
}

export class DCAViewModel {
  /**
   * Simulates a Dollar-Cost Averaging schedule across price points.
   */
  async simulateDCA(
    periodicInvestment: number,
    priceHistory: number[]
  ): Promise<DCAUiState> {
    try {
      const simulation = DCAEngine.simulateDCA(periodicInvestment, priceHistory);
      return {
        simulation,
        comparison: null,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        simulation: null,
        comparison: null,
        isLoading: false,
        error: err?.message || 'Failed to simulate DCA strategy'
      };
    }
  }

  /**
   * Compares DCA against Lump-Sum Investing (LSI).
   */
  async compareDCAvsLumpSum(
    periodicInvestment: number,
    priceHistory: number[]
  ): Promise<DCAUiState> {
    try {
      const comparison = DCAEngine.compareDCAvsLumpSum(periodicInvestment, priceHistory);
      return {
        simulation: comparison.dca,
        comparison,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        simulation: null,
        comparison: null,
        isLoading: false,
        error: err?.message || 'Failed to compare DCA vs Lump Sum'
      };
    }
  }
}
