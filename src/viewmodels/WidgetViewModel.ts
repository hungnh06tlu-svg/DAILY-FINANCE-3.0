/**
 * Daily Finance 3.0 - WidgetViewModel
 * ViewModel for Widgets & Quick Actions Domain (S4-008).
 * Communicates EXCLUSIVELY through GetWidgetStateUseCase.
 * Performs zero business calculations, zero repository queries, zero platform API calls.
 * Exposes immutable WidgetUiState.
 */

import { Language } from '../types';
import { GetWidgetStateUseCase } from '../usecases/GetWidgetStateUseCase';
import { WidgetUiState, WidgetType } from '../domain/WidgetState';
import { toSafeUserError } from '../utils/safeError';

export class WidgetViewModel {
  constructor(private readonly getWidgetStateUseCase: GetWidgetStateUseCase) {
    if (!getWidgetStateUseCase) {
      throw new Error('[WidgetViewModel] Fail-Fast: GetWidgetStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable WidgetUiState via GetWidgetStateUseCase.
   */
  async getWidgetUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterType: WidgetType | 'all' = 'all'
  ): Promise<WidgetUiState> {
    try {
      const state = await this.getWidgetStateUseCase.execute(spaceId, language, filterType);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString(),
        filterType
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu Tiện Ích. Vui lòng thử lại.',
          'Unable to load Widget UI State. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterType
      });
    }
  }
}
