/**
 * Daily Finance 3.0 - GetHabitEngineStateUseCase
 * Clean Architecture UseCase for Habit Engine Domain.
 * Consumed strictly by HabitEngineViewModel and presentation layer.
 * Adheres strictly to S4-004 Habit Engine Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { GetNotificationCenterStateUseCase } from './GetNotificationCenterStateUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { HabitEngineState, HabitCategory } from '../domain/HabitEngineState';
import { HabitEngineBuilder } from '../domain/HabitEngineBuilder';
import { Language } from '../types';

export class GetHabitEngineStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase,
    private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase
  ) {
    if (
      !getSnapshotUseCase ||
      !getCoachSessionUseCase ||
      !getGoalPlannerStateUseCase ||
      !getNotificationCenterStateUseCase ||
      !getPlanUseCase
    ) {
      throw new Error('[GetHabitEngineStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full HabitEngineState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: HabitCategory | 'all' = 'all'
  ): Promise<HabitEngineState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);

    return HabitEngineBuilder.build({
      snapshot,
      plan,
      coachSession,
      goalPlannerState,
      notificationCenterState,
      language,
      filterCategory
    });
  }

  /**
   * Generates HabitEngineState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    plan?: FinancialPlan,
    coachSession?: CoachSession,
    goalPlannerState?: GoalPlannerState,
    notificationCenterState?: NotificationCenterState,
    language: Language = 'vi',
    filterCategory: HabitCategory | 'all' = 'all'
  ): HabitEngineState {
    return HabitEngineBuilder.build({
      snapshot,
      plan,
      coachSession,
      goalPlannerState,
      notificationCenterState,
      language,
      filterCategory
    });
  }
}
