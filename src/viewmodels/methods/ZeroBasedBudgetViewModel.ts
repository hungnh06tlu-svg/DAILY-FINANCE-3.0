/**
 * Daily Finance 3.0 — D2-003S5: Zero-Based Budget ViewModel
 * Pure presentation adapter delegating envelope budgeting & reconciliation to ZeroBasedBudgetEngine.
 */

import { ZeroBasedBudgetEngine } from '../../domain/methods/ZeroBasedBudgetEngine';
import {
  ZeroBasedEnvelope,
  ZeroBasedPlanResult,
  ZeroBasedReconciliationResult
} from '../../domain/methods/types';
import { Transaction } from '../../types';

export interface ZeroBasedBudgetUiState {
  plan: ZeroBasedPlanResult | null;
  reconciliation: ZeroBasedReconciliationResult | null;
  isLoading: boolean;
  error?: string | null;
}

export class ZeroBasedBudgetViewModel {
  /**
   * Creates a Zero-Based Budget plan where Income - Allocated = 0.
   */
  async createPlan(
    totalIncome: number,
    envelopes: ZeroBasedEnvelope[]
  ): Promise<ZeroBasedBudgetUiState> {
    try {
      const plan = ZeroBasedBudgetEngine.createPlan(totalIncome, envelopes);
      return {
        plan,
        reconciliation: null,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        plan: null,
        reconciliation: null,
        isLoading: false,
        error: err?.message || 'Failed to create Zero-Based budget plan'
      };
    }
  }

  /**
   * Reconciles budget envelopes against actual transaction records.
   */
  async reconcileActual(
    plan: ZeroBasedPlanResult,
    transactions: Transaction[]
  ): Promise<ZeroBasedBudgetUiState> {
    try {
      const reconciliation = ZeroBasedBudgetEngine.reconcileActual(plan, transactions);
      return {
        plan,
        reconciliation,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        plan,
        reconciliation: null,
        isLoading: false,
        error: err?.message || 'Failed to reconcile Zero-Based budget'
      };
    }
  }
}
