/**
 * Daily Finance 3.0 - GetAIChatStateUseCase
 * Clean Architecture UseCase for AI Chat Domain.
 * Consumed strictly by AIChatViewModel and presentation layer.
 * Adheres strictly to S4-006 AI Chat Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { GetHabitEngineStateUseCase } from './GetHabitEngineStateUseCase';
import { GetAutomationCenterStateUseCase } from './GetAutomationCenterStateUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetDashboardStateUseCase } from './GetDashboardStateUseCase';
import { GetNotificationCenterStateUseCase } from './GetNotificationCenterStateUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { HabitEngineState } from '../domain/HabitEngineState';
import { AutomationCenterState } from '../domain/AutomationCenterState';
import { AIChatState, ChatCategory } from '../domain/AIChatState';
import { AIChatBuilder } from '../domain/AIChatBuilder';
import { Language } from '../types';

export class GetAIChatStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase,
    private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase,
    private readonly getAutomationCenterStateUseCase: GetAutomationCenterStateUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase,
    private readonly getDashboardStateUseCase: GetDashboardStateUseCase,
    private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase
  ) {
    if (
      !getSnapshotUseCase ||
      !getCoachSessionUseCase ||
      !getGoalPlannerStateUseCase ||
      !getHabitEngineStateUseCase ||
      !getAutomationCenterStateUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getDashboardStateUseCase ||
      !getNotificationCenterStateUseCase
    ) {
      throw new Error('[GetAIChatStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full AIChatState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: ChatCategory | 'all' = 'all'
  ): Promise<AIChatState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const dashboardState = await this.getDashboardStateUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);
    const habitEngineState = await this.getHabitEngineStateUseCase.execute(spaceId, language);
    const automationCenterState = await this.getAutomationCenterStateUseCase.execute(spaceId, language);

    return AIChatBuilder.build({
      snapshot,
      forecast,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      language,
      filterCategory
    });
  }

  /**
   * Generates AIChatState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    plan?: FinancialPlan,
    forecast?: FinancialForecast,
    timeline?: FinancialTimeline,
    intelligence?: FinancialIntelligence,
    coachSession?: CoachSession,
    dashboardState?: DashboardState,
    goalPlannerState?: GoalPlannerState,
    notificationCenterState?: NotificationCenterState,
    habitEngineState?: HabitEngineState,
    automationCenterState?: AutomationCenterState,
    language: Language = 'vi',
    filterCategory: ChatCategory | 'all' = 'all'
  ): AIChatState {
    return AIChatBuilder.build({
      snapshot,
      plan,
      forecast,
      timeline,
      intelligence,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      language,
      filterCategory
    });
  }
}
