/**
 * Daily Finance 3.0 — D2-003S5: 50/30/20 Budget ViewModel
 * Pure presentation adapter delegating 50/30/20 calculations to FiftyThirtyTwentyEngine.
 */

import { FiftyThirtyTwentyEngine } from '../../domain/methods/FiftyThirtyTwentyEngine';
import {
  FiftyThirtyTwentyRatio,
  FiftyThirtyTwentyResult,
  FiftyThirtyTwentyEvaluation
} from '../../domain/methods/types';
import { Transaction } from '../../types';

export interface FiftyThirtyTwentyUiState {
  budget: FiftyThirtyTwentyResult | null;
  evaluation: FiftyThirtyTwentyEvaluation | null;
  isLoading: boolean;
  error?: string | null;
}

export class FiftyThirtyTwentyViewModel {
  /**
   * Calculates 50/30/20 budget envelope targets for a given income.
   */
  async calculateBudget(
    income: number,
    customRatio?: FiftyThirtyTwentyRatio
  ): Promise<FiftyThirtyTwentyUiState> {
    try {
      const budget = FiftyThirtyTwentyEngine.calculateBudget(income, customRatio);
      return {
        budget,
        evaluation: null,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        budget: null,
        evaluation: null,
        isLoading: false,
        error: err?.message || 'Failed to calculate 50/30/20 budget'
      };
    }
  }

  /**
   * Evaluates actual spending against 50/30/20 budget.
   */
  async evaluateSpending(
    income: number,
    transactions: Transaction[],
    customRatio?: FiftyThirtyTwentyRatio
  ): Promise<FiftyThirtyTwentyUiState> {
    try {
      const evaluation = FiftyThirtyTwentyEngine.evaluateSpending(transactions, income, customRatio);
      return {
        budget: evaluation.budget,
        evaluation,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        budget: null,
        evaluation: null,
        isLoading: false,
        error: err?.message || 'Failed to evaluate 50/30/20 spending'
      };
    }
  }
}
