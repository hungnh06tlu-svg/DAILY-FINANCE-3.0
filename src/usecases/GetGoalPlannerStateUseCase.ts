/**
 * Daily Finance 3.0 - GetGoalPlannerStateUseCase
 * Clean Architecture UseCase for Goal Planner Domain.
 * Consumed strictly by GoalPlannerViewModel and presentation layer.
 * Adheres strictly to S4-002 Goal Planner Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { GoalPlannerBuilder } from '../domain/GoalPlannerBuilder';
import { Language } from '../types';

export class GetGoalPlannerStateUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase
  ) {
    if (
      !getSnapshotUseCase ||
      !getIntelligenceUseCase ||
      !getTimelineUseCase ||
      !getForecastUseCase ||
      !getPlanUseCase ||
      !getCoachSessionUseCase
    ) {
      throw new Error('[GetGoalPlannerStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and retrieves full GoalPlannerState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<GoalPlannerState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);

    return GoalPlannerBuilder.build({
      plan,
      forecast,
      snapshot,
      coachSession,
      language
    });
  }

  /**
   * Generates GoalPlannerState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    plan?: FinancialPlan,
    forecast?: FinancialForecast,
    snapshot?: FinancialSnapshot,
    coachSession?: CoachSession,
    language: Language = 'vi'
  ): GoalPlannerState {
    return GoalPlannerBuilder.build({
      plan,
      forecast,
      snapshot,
      coachSession,
      language
    });
  }
}
