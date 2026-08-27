/**
 * Daily Finance 3.0 — D2-003S5: Advanced FIRE ViewModel
 * Pure presentation adapter delegating all FIRE calculations to AdvancedFireEngine.
 */

import { AdvancedFireEngine } from '../../domain/methods/AdvancedFireEngine';
import {
  AdvancedFireProfileInput,
  AdvancedFireComprehensiveReport,
  FireVariantResult,
  CoastFireResult,
  BaristaFireResult
} from '../../domain/methods/types';

export interface AdvancedFireUiState {
  report: AdvancedFireComprehensiveReport | null;
  leanFire: FireVariantResult | null;
  regularFire: FireVariantResult | null;
  fatFire: FireVariantResult | null;
  coastFire: CoastFireResult | null;
  baristaFire: BaristaFireResult | null;
  isLoading: boolean;
  error?: string | null;
}

export class AdvancedFireViewModel {
  /**
   * Generates a complete comprehensive FIRE report across 5 variants.
   */
  async getComprehensiveFireReport(
    input: AdvancedFireProfileInput
  ): Promise<AdvancedFireUiState> {
    try {
      const report = AdvancedFireEngine.generateComprehensiveFireReport(input);
      return {
        report,
        leanFire: report.leanFire,
        regularFire: report.regularFire,
        fatFire: report.fatFire,
        coastFire: report.coastFire,
        baristaFire: report.baristaFire,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        report: null,
        leanFire: null,
        regularFire: null,
        fatFire: null,
        coastFire: null,
        baristaFire: null,
        isLoading: false,
        error: err?.message || 'Failed to compute FIRE variants'
      };
    }
  }
}
