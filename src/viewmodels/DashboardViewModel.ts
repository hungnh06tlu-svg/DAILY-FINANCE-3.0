/**
 * Daily Finance 3.0 - DashboardViewModel
 * ViewModel for Smart Dashboard Domain (S4-001).
 * Communicates EXCLUSIVELY through GetDashboardStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable DashboardUiState.
 */

import { Language } from '../types';
import { GetDashboardStateUseCase } from '../usecases/GetDashboardStateUseCase';
import { DashboardUiState, DashboardSectionType } from '../domain/DashboardState';
import { toSafeUserError } from '../utils/safeError';

export class DashboardViewModel {
  constructor(private readonly getDashboardStateUseCase: GetDashboardStateUseCase) {
    if (!getDashboardStateUseCase) {
      throw new Error('[DashboardViewModel] Fail-Fast: GetDashboardStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable DashboardUiState via GetDashboardStateUseCase.
   */
  async getDashboardUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    selectedSection: DashboardSectionType = 'overview'
  ): Promise<DashboardUiState> {
    try {
      const state = await this.getDashboardStateUseCase.execute(spaceId, language);

      return Object.freeze({
        isLoading: false,
        dashboardState: state,
        error: null,
        lastUpdated: new Date().toISOString(),
        selectedSection
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        dashboardState: null,
        error: toSafeUserError(
          err,
          'Không thể tải Bảng Điều Khiển. Vui lòng thử lại.',
          'Unable to load Dashboard. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        selectedSection
      });
    }
  }
}
