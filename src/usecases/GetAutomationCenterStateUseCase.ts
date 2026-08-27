/**
 * Daily Finance 3.0 - GetAutomationCenterStateUseCase
 * Clean Architecture UseCase for Automation Center Domain.
 * Consumed strictly by AutomationCenterViewModel and presentation layer.
 * Adheres strictly to S4-005 Automation Center Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetNotificationCenterStateUseCase } from './GetNotificationCenterStateUseCase';
import { GetHabitEngineStateUseCase } from './GetHabitEngineStateUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetDashboardStateUseCase } from './GetDashboardStateUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { HabitEngineState } from '../domain/HabitEngineState';
import { AutomationCenterState, AutomationCategory } from '../domain/AutomationCenterState';
import { AutomationCenterBuilder } from '../domain/AutomationCenterBuilder';
import { Language } from '../types';

export class GetAutomationCenterStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase,
    private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase,
    private readonly getDashboardStateUseCase: GetDashboardStateUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase
  ) {
    if (
      !getSnapshotUseCase ||
      !getCoachSessionUseCase ||
      !getNotificationCenterStateUseCase ||
      !getHabitEngineStateUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getDashboardStateUseCase ||
      !getGoalPlannerStateUseCase
    ) {
      throw new Error('[GetAutomationCenterStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full AutomationCenterState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: AutomationCategory | 'all' = 'all'
  ): Promise<AutomationCenterState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const dashboardState = await this.getDashboardStateUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);
    const habitEngineState = await this.getHabitEngineStateUseCase.execute(spaceId, language);

    return AutomationCenterBuilder.build({
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      language,
      filterCategory
    });
  }

  /**
   * Generates AutomationCenterState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    forecast?: FinancialForecast,
    plan?: FinancialPlan,
    coachSession?: CoachSession,
    dashboardState?: DashboardState,
    goalPlannerState?: GoalPlannerState,
    notificationCenterState?: NotificationCenterState,
    habitEngineState?: HabitEngineState,
    language: Language = 'vi',
    filterCategory: AutomationCategory | 'all' = 'all'
  ): AutomationCenterState {
    return AutomationCenterBuilder.build({
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      language,
      filterCategory
    });
  }
}
