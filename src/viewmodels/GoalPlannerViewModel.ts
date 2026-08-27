/**
 * Daily Finance 3.0 - GoalPlannerViewModel
 * ViewModel for Goal Planner Domain (S4-002).
 * Communicates EXCLUSIVELY through GetGoalPlannerStateUseCase.
 * Performs zero business calculations, zero direct repository queries.
 * Exposes immutable GoalPlannerUiState.
 */

import { Language } from '../types';
import { GetGoalPlannerStateUseCase } from '../usecases/GetGoalPlannerStateUseCase';
import { GoalPlannerUiState, GoalCategory } from '../domain/GoalPlannerState';
import { toSafeUserError } from '../utils/safeError';

export class GoalPlannerViewModel {
  constructor(private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase) {
    if (!getGoalPlannerStateUseCase) {
      throw new Error('[GoalPlannerViewModel] Fail-Fast: GetGoalPlannerStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable GoalPlannerUiState via GetGoalPlannerStateUseCase.
   */
  async getGoalPlannerUiState(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: GoalCategory | 'all' = 'all'
  ): Promise<GoalPlannerUiState> {
    try {
      const state = await this.getGoalPlannerStateUseCase.execute(spaceId, language);

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
          'Không thể tải Kế Hoạch Mục Tiêu. Vui lòng thử lại.',
          'Unable to load Goal Planner. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString(),
        filterCategory
      });
    }
  }
}
