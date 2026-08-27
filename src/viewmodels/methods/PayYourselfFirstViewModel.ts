/**
 * Daily Finance 3.0 — D2-003S5: Pay Yourself First ViewModel
 * Pure presentation adapter delegating savings allocation to PayYourselfFirstEngine.
 */

import { PayYourselfFirstEngine } from '../../domain/methods/PayYourselfFirstEngine';
import {
  PayYourselfFirstBucketConfig,
  PayYourselfFirstResult,
  PayYourselfFirstFeasibility
} from '../../domain/methods/types';

export interface PayYourselfFirstUiState {
  allocation: PayYourselfFirstResult | null;
  feasibility: PayYourselfFirstFeasibility | null;
  isLoading: boolean;
  error?: string | null;
}

export class PayYourselfFirstViewModel {
  /**
   * Calculates Pay Yourself First allocation buckets and checks feasibility against fixed living expenses.
   */
  async calculateAllocation(
    totalIncome: number,
    savingsRatePercent: number,
    customBuckets?: PayYourselfFirstBucketConfig[],
    fixedExpenses?: number
  ): Promise<PayYourselfFirstUiState> {
    try {
      const allocation = PayYourselfFirstEngine.calculateAllocation(
        totalIncome,
        savingsRatePercent,
        customBuckets
      );
      const feasibility = (fixedExpenses !== undefined)
        ? PayYourselfFirstEngine.assessFeasibility(totalIncome, fixedExpenses, savingsRatePercent)
        : null;

      return {
        allocation,
        feasibility,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        allocation: null,
        feasibility: null,
        isLoading: false,
        error: err?.message || 'Failed to calculate Pay Yourself First allocation'
      };
    }
  }
}
