/**
 * Daily Finance 3.0 — D2-003S5: Sinking Fund ViewModel
 * Pure presentation adapter delegating calculations to SinkingFundEngine.
 */

import { SinkingFundEngine } from '../../domain/methods/SinkingFundEngine';
import {
  SinkingFund,
  SinkingFundContributionResult,
  SinkingFundMonthSchedule
} from '../../domain/methods/types';

export interface SinkingFundUiState {
  contribution: SinkingFundContributionResult | null;
  schedule: SinkingFundMonthSchedule[];
  allContributions: SinkingFundContributionResult[];
  isLoading: boolean;
  error?: string | null;
}

export class SinkingFundViewModel {
  /**
   * Calculates monthly target contributions for a single sinking fund.
   */
  async calculateFund(
    targetAmount: number,
    currentAmount: number,
    targetDate: string,
    currentDate?: Date
  ): Promise<SinkingFundUiState> {
    try {
      const contribution = SinkingFundEngine.calculateMonthlyContribution(
        targetAmount,
        currentAmount,
        targetDate,
        currentDate
      );
      const schedule = SinkingFundEngine.simulateFundSchedule(
        {
          id: 'temp_fund',
          name: 'Sinking Fund',
          targetAmount,
          currentAmount,
          targetDate,
          startDate: (currentDate ?? new Date()).toISOString()
        },
        currentDate
      );

      return {
        contribution,
        schedule,
        allContributions: [contribution],
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        contribution: null,
        schedule: [],
        allContributions: [],
        isLoading: false,
        error: err?.message || 'Failed to calculate sinking fund'
      };
    }
  }

  /**
   * Evaluates a collection of active sinking funds.
   */
  async evaluateFunds(
    funds: SinkingFund[],
    currentDate?: Date
  ): Promise<SinkingFundUiState> {
    try {
      const allContributions = funds.map((f) =>
        SinkingFundEngine.calculateMonthlyContribution(
          f.targetAmount,
          f.currentAmount,
          f.targetDate,
          currentDate
        )
      );

      return {
        contribution: allContributions[0] || null,
        schedule: [],
        allContributions,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        contribution: null,
        schedule: [],
        allContributions: [],
        isLoading: false,
        error: err?.message || 'Failed to evaluate sinking funds'
      };
    }
  }
}
