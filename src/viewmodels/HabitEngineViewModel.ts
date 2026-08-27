/**
 * Daily Finance 3.0 - HabitEngineViewModel
 * ViewModel for Habit Engine Domain (S4-004).
 * Communicates EXCLUSIVELY through GetHabitEngineStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable HabitEngineUiState.
 */

import { Language } from '../types';
import { GetHabitEngineStateUseCase } from '../usecases/GetHabitEngineStateUseCase';
import { HabitEngineUiState, HabitCategory } from '../domain/HabitEngineState';
import { toSafeUserError } from '../utils/safeError';

export class HabitEngineViewModel {
  constructor(private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase) {
    if (!getHabitEngineStateUseCase) {
      throw new Error('[HabitEngineViewModel] Fail-Fast: GetHabitEngineStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable HabitEngineUiState via GetHabitEngineStateUseCase.
   */
  async getHabitEngineUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: HabitCategory | 'all' = 'all'
  ): Promise<HabitEngineUiState> {
    try {
      const state = await this.getHabitEngineStateUseCase.execute(spaceId, language, filterCategory);

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
          'Không thể tải dữ liệu Thói Quen. Vui lòng thử lại.',
          'Unable to load Habit Engine UI State. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    }
  }
}
