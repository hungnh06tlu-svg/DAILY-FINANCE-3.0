/**
 * Daily Finance 3.0 - GetAnalyticsStateUseCase
 * Clean Architecture UseCase for Advanced Analytics Domain.
 * Consumed strictly by AnalyticsViewModel and presentation layer.
 * Adheres strictly to S4-007 Advanced Analytics Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetDashboardStateUseCase } from './GetDashboardStateUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { GetNotificationCenterStateUseCase } from './GetNotificationCenterStateUseCase';
import { GetHabitEngineStateUseCase } from './GetHabitEngineStateUseCase';
import { GetAutomationCenterStateUseCase } from './GetAutomationCenterStateUseCase';
import { GetAIChatStateUseCase } from './GetAIChatStateUseCase';

import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { HabitEngineState } from '../domain/HabitEngineState';
import { AutomationCenterState } from '../domain/AutomationCenterState';
import { AIChatState } from '../domain/AIChatState';
import { AnalyticsState } from '../domain/AnalyticsState';
import { AnalyticsBuilder } from '../domain/AnalyticsBuilder';
import { Language } from '../types';

import { AnalyticsCategory } from '../domain/AnalyticsState';

export class GetAnalyticsStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase,
    private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase,
    private readonly getAutomationCenterStateUseCase: GetAutomationCenterStateUseCase,
    private readonly getAIChatStateUseCase: GetAIChatStateUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
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
      !getAIChatStateUseCase ||
      !getTimelineUseCase ||
      !getIntelligenceUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getDashboardStateUseCase ||
      !getNotificationCenterStateUseCase
    ) {
      throw new Error('[GetAnalyticsStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full AnalyticsState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterCategory: AnalyticsCategory | 'all' = 'all'
  ): Promise<AnalyticsState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const timeline = await this.getTimelineUseCase.execute(spaceId, 'monthly', language);
    const intelligence = await this.getIntelligenceUseCase.execute(spaceId, language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const dashboardState = await this.getDashboardStateUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);
    const habitEngineState = await this.getHabitEngineStateUseCase.execute(spaceId, language);
    const automationCenterState = await this.getAutomationCenterStateUseCase.execute(spaceId, language);
    const aiChatState = await this.getAIChatStateUseCase.execute(spaceId, language);

    return AnalyticsBuilder.build({
      snapshot,
      timeline,
      forecast,
      intelligence,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      aiChatState,
      language,
      filterCategory
    });
  }

  /**
   * Generates AnalyticsState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    timeline?: FinancialTimeline,
    forecast?: FinancialForecast,
    intelligence?: FinancialIntelligence,
    plan?: FinancialPlan,
    coachSession?: CoachSession,
    dashboardState?: DashboardState,
    goalPlannerState?: GoalPlannerState,
    notificationCenterState?: NotificationCenterState,
    habitEngineState?: HabitEngineState,
    automationCenterState?: AutomationCenterState,
    aiChatState?: AIChatState,
    language: Language = 'vi',
    filterCategory: AnalyticsCategory | 'all' = 'all'
  ): AnalyticsState {
    return AnalyticsBuilder.build({
      snapshot,
      timeline,
      forecast,
      intelligence,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      aiChatState,
      language,
      filterCategory
    });
  }
}
