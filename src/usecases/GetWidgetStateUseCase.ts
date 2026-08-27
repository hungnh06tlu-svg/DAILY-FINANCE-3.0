/**
 * Daily Finance 3.0 - GetWidgetStateUseCase
 * Clean Architecture UseCase for Widgets Domain.
 * Consumed strictly by WidgetViewModel and presentation layer.
 * Adheres strictly to S4-008 Widgets & Voice Assistant Architecture.
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
import { GetAnalyticsStateUseCase } from './GetAnalyticsStateUseCase';
import { TransactionRepository } from '../repositories/contracts';

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
import { WidgetState, WidgetType } from '../domain/WidgetState';
import { WidgetBuilder } from '../domain/WidgetBuilder';
import { Language, Transaction } from '../types';

export class GetWidgetStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase,
    private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase,
    private readonly getAutomationCenterStateUseCase: GetAutomationCenterStateUseCase,
    private readonly getAIChatStateUseCase: GetAIChatStateUseCase,
    private readonly getAnalyticsStateUseCase: GetAnalyticsStateUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase,
    private readonly getDashboardStateUseCase: GetDashboardStateUseCase,
    private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase,
    private readonly txRepo: TransactionRepository
  ) {
    if (
      !getSnapshotUseCase ||
      !getCoachSessionUseCase ||
      !getGoalPlannerStateUseCase ||
      !getHabitEngineStateUseCase ||
      !getAutomationCenterStateUseCase ||
      !getAIChatStateUseCase ||
      !getAnalyticsStateUseCase ||
      !getTimelineUseCase ||
      !getIntelligenceUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getDashboardStateUseCase ||
      !getNotificationCenterStateUseCase ||
      !txRepo
    ) {
      throw new Error('[GetWidgetStateUseCase] Fail-Fast: All dependent UseCases and repositories are required');
    }
  }

  /**
   * Builds and retrieves full WidgetState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi',
    filterType: WidgetType | 'all' = 'all'
  ): Promise<WidgetState> {
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
    const analyticsState = await this.getAnalyticsStateUseCase.execute(spaceId, language);
    const transactions = await this.txRepo.getTransactions(spaceId);

    return WidgetBuilder.build({
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
      analyticsState,
      transactions,
      language,
      filterType
    });
  }

  /**
   * Generates WidgetState directly from pre-built domain outputs.
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
    analyticsState?: AnalyticsState,
    language: Language = 'vi',
    filterType: WidgetType | 'all' = 'all'
  ): WidgetState {
    return WidgetBuilder.build({
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
      analyticsState,
      language,
      filterType
    });
  }
}
