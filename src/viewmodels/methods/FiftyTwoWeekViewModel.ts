/**
 * Daily Finance 3.0 — D2-003S5: 52-Week Money Challenge ViewModel
 * Pure presentation adapter delegating 52-week challenge logic to FiftyTwoWeekChallengeEngine.
 */

import { FiftyTwoWeekChallengeEngine } from '../../domain/methods/FiftyTwoWeekChallengeEngine';
import {
  FiftyTwoWeekMode,
  FiftyTwoWeekSchedule,
  FiftyTwoWeekProgress
} from '../../domain/methods/types';

export interface FiftyTwoWeekUiState {
  schedule: FiftyTwoWeekSchedule | null;
  progress: FiftyTwoWeekProgress | null;
  isLoading: boolean;
  error?: string | null;
}

export class FiftyTwoWeekViewModel {
  /**
   * Generates a 52-week schedule and evaluates progress.
   */
  async getScheduleAndProgress(
    baseIncrement: number = 10000,
    mode: FiftyTwoWeekMode = 'standard',
    completedWeekNumbers: number[] = [],
    startDate?: string
  ): Promise<FiftyTwoWeekUiState> {
    try {
      const schedule = FiftyTwoWeekChallengeEngine.generateSchedule(baseIncrement, mode, startDate);
      const progress = FiftyTwoWeekChallengeEngine.evaluateProgress(schedule, completedWeekNumbers);

      return {
        schedule,
        progress,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        schedule: null,
        progress: null,
        isLoading: false,
        error: err?.message || 'Failed to generate 52-week challenge schedule'
      };
    }
  }
}
