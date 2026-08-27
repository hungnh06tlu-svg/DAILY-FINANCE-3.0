/**
 * Daily Finance 3.0 - AnalyticsViewModel
 * ViewModel for Advanced Analytics Domain (S4-007).
 * Communicates EXCLUSIVELY through GetAnalyticsStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable AnalyticsUiState.
 */

import { Language } from '../types';
import { GetAnalyticsStateUseCase } from '../usecases/GetAnalyticsStateUseCase';
import { AnalyticsUiState, AnalyticsCategory } from '../domain/AnalyticsState';
import { toSafeUserError } from '../utils/safeError';

export class AnalyticsViewModel {
  constructor(private readonly getAnalyticsStateUseCase: GetAnalyticsStateUseCase) {
    if (!getAnalyticsStateUseCase) {
      throw new Error('[AnalyticsViewModel] Fail-Fast: GetAnalyticsStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable AnalyticsUiState via GetAnalyticsStateUseCase.
   */
  async getAnalyticsUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: AnalyticsCategory | 'all' = 'all'
  ): Promise<AnalyticsUiState> {
    try {
      const state = await this.getAnalyticsStateUseCase.execute(spaceId, language, filterCategory);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu phân tích. Vui lòng thử lại.',
          'Unable to load Analytics UI State. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    }
  }
}
