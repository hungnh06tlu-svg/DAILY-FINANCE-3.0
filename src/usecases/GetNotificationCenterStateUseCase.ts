/**
 * Daily Finance 3.0 - GetNotificationCenterStateUseCase
 * Clean Architecture UseCase for Notification Center Domain.
 * Consumed strictly by NotificationCenterViewModel and presentation layer.
 * Adheres strictly to S4-003 Notification Center Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetDashboardStateUseCase } from './GetDashboardStateUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { NotificationCenterBuilder } from '../domain/NotificationCenterBuilder';
import { Language } from '../types';

export class GetNotificationCenterStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getDashboardStateUseCase: GetDashboardStateUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase
  ) {
    if (
      !getSnapshotUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getCoachSessionUseCase ||
      !getDashboardStateUseCase ||
      !getGoalPlannerStateUseCase
    ) {
      throw new Error('[GetNotificationCenterStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full NotificationCenterState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<NotificationCenterState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const dashboardState = await this.getDashboardStateUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);

    return NotificationCenterBuilder.build({
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      language
    });
  }

  /**
   * Generates NotificationCenterState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    forecast?: FinancialForecast,
    plan?: FinancialPlan,
    coachSession?: CoachSession,
    dashboardState?: DashboardState,
    goalPlannerState?: GoalPlannerState,
    language: Language = 'vi'
  ): NotificationCenterState {
    return NotificationCenterBuilder.build({
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      language
    });
  }
}
