/**
 * Daily Finance 3.0 - NotificationCenterViewModel
 * ViewModel for Notification Center Domain (S4-003).
 * Communicates EXCLUSIVELY through GetNotificationCenterStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable NotificationCenterUiState.
 */

import { Language } from '../types';
import { GetNotificationCenterStateUseCase } from '../usecases/GetNotificationCenterStateUseCase';
import { NotificationCenterUiState, NotificationCategory } from '../domain/NotificationCenterState';
import { toSafeUserError } from '../utils/safeError';

export class NotificationCenterViewModel {
  constructor(private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase) {
    if (!getNotificationCenterStateUseCase) {
      throw new Error('[NotificationCenterViewModel] Fail-Fast: GetNotificationCenterStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable NotificationCenterUiState via GetNotificationCenterStateUseCase.
   */
  async getNotificationCenterUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: NotificationCategory | 'all' = 'all'
  ): Promise<NotificationCenterUiState> {
    try {
      const state = await this.getNotificationCenterStateUseCase.execute(spaceId, language);

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
          'Không thể tải Trung Tâm Thông Báo. Vui lòng thử lại.',
          'Unable to load Notification Center. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    }
  }
}
