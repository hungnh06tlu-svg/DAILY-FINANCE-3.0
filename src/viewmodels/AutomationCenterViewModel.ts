/**
 * Daily Finance 3.0 - AutomationCenterViewModel
 * ViewModel for Automation Center Domain (S4-005).
 * Communicates EXCLUSIVELY through GetAutomationCenterStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable AutomationCenterUiState.
 */

import { Language } from '../types';
import { GetAutomationCenterStateUseCase } from '../usecases/GetAutomationCenterStateUseCase';
import { AutomationCenterUiState, AutomationCategory } from '../domain/AutomationCenterState';
import { toSafeUserError } from '../utils/safeError';

export class AutomationCenterViewModel {
  constructor(private readonly getAutomationCenterStateUseCase: GetAutomationCenterStateUseCase) {
    if (!getAutomationCenterStateUseCase) {
      throw new Error('[AutomationCenterViewModel] Fail-Fast: GetAutomationCenterStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable AutomationCenterUiState via GetAutomationCenterStateUseCase.
   */
  async getAutomationCenterUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: AutomationCategory | 'all' = 'all'
  ): Promise<AutomationCenterUiState> {
    try {
      const state = await this.getAutomationCenterStateUseCase.execute(spaceId, language, filterCategory);

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
          'Không thể tải dữ liệu Trung Tâm Tự Động Hóa. Vui lòng thử lại.',
          'Unable to load Automation Center UI State. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    }
  }
}
