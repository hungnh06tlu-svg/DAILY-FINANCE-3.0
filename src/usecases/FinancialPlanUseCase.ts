/**
 * Daily Finance 3.0 - FinancialPlanUseCase
 * Clean Architecture UseCase for building/retrieving FinancialPlan domain models.
 * Dashboard, AI Coach, Notification Center, & Analytics consume ONLY this UseCase for actionable financial plans.
 * Adheres strictly to DF3-006 Planning Center Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan, PlanningScenarioType } from '../domain/FinancialPlan';
import { PlanningEngine } from '../domain/PlanningEngine';
import { Language } from '../types';

export class GetFinancialPlanUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase
  ) {
    if (!getSnapshotUseCase || !getIntelligenceUseCase || !getTimelineUseCase || !getForecastUseCase) {
      throw new Error('[GetFinancialPlanUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Retrieves or builds actionable FinancialPlan for a given space and scenario.
   */
  async execute(
    spaceId: string = 'sp_personal',
    scenario: PlanningScenarioType = 'current_strategy',
    language: Language = 'vi'
  ): Promise<FinancialPlan> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const intelligence = await this.getIntelligenceUseCase.execute(spaceId, language);
    const timeline = await this.getTimelineUseCase.execute(spaceId, 'monthly', language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);

    return PlanningEngine.generatePlan({
      snapshot,
      intelligence,
      timeline,
      forecast,
      scenario,
      language
    });
  }

  /**
   * Generates FinancialPlan directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot: FinancialSnapshot,
    timeline?: FinancialTimeline,
    intelligence?: FinancialIntelligence,
    forecast?: FinancialForecast,
    scenario: PlanningScenarioType = 'current_strategy',
    language: Language = 'vi'
  ): FinancialPlan {
    return PlanningEngine.generatePlan({
      snapshot,
      timeline,
      intelligence,
      forecast,
      scenario,
      language
    });
  }
}
