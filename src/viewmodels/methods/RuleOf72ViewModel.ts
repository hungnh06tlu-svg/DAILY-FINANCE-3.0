/**
 * Daily Finance 3.0 — D2-003S5: Rule of 72 ViewModel
 * Pure presentation adapter delegating calculations to RuleOf72Engine.
 */

import { RuleOf72Engine } from '../../domain/methods/RuleOf72Engine';
import {
  RuleOf72Result,
  InflationHalvingResult,
  DoublingMilestone
} from '../../domain/methods/types';

export interface RuleOf72UiState {
  doublingResult: RuleOf72Result | null;
  inflationResult: InflationHalvingResult | null;
  milestones: DoublingMilestone[];
  isLoading: boolean;
  error?: string | null;
}

export class RuleOf72ViewModel {
  /**
   * Calculates doubling time, inflation halving and compounding milestones.
   */
  async calculate(
    annualRate: number,
    inflationRate?: number,
    initialCapital?: number,
    currentYear?: number
  ): Promise<RuleOf72UiState> {
    try {
      const doublingResult = RuleOf72Engine.calculateDoublingTime(annualRate);
      const inflationResult = inflationRate
        ? RuleOf72Engine.calculateInflationHalving(inflationRate)
        : null;
      const milestones = (initialCapital && initialCapital > 0)
        ? RuleOf72Engine.generateDoublingMilestones(initialCapital, annualRate, 5, currentYear)
        : [];

      return {
        doublingResult,
        inflationResult,
        milestones,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        doublingResult: null,
        inflationResult: null,
        milestones: [],
        isLoading: false,
        error: err?.message || 'Failed to calculate Rule of 72'
      };
    }
  }
}
