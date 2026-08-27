/**
 * Daily Finance 3.0 - FinancialForecastUseCase
 * Clean Architecture UseCase for retrieving/computing FinancialForecast projections.
 * Dashboard, Planning Center, AI Coach, & Analytics consume ONLY this UseCase for forecasts.
 * Adheres strictly to DF3-005 Forecast Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import {
  FinancialForecast,
  ForecastPeriodDays,
  ForecastScenarioType,
  ForecastScenarioConfig
} from '../domain/FinancialForecast';
import { ForecastEngine } from '../domain/ForecastEngine';
import { Language } from '../types';

export class GetFinancialForecastUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase
  ) {
    if (!getSnapshotUseCase || !getIntelligenceUseCase || !getTimelineUseCase) {
      throw new Error('[GetFinancialForecastUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Retrieves/Projects FinancialForecast given spaceId and configuration.
   */
  async execute(
    spaceId: string = 'sp_personal',
    horizonDays: ForecastPeriodDays = 90,
    scenario: ForecastScenarioType = 'current_trend',
    customConfig?: Partial<ForecastScenarioConfig>,
    language: Language = 'vi'
  ): Promise<FinancialForecast> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const intelligence = await this.getIntelligenceUseCase.execute(spaceId, language);
    const timeline = await this.getTimelineUseCase.execute(spaceId, 'monthly', language);

    return ForecastEngine.project({
      snapshot,
      timeline,
      intelligence,
      horizonDays,
      scenario,
      customConfig,
      language
    });
  }

  /**
   * Projects FinancialForecast directly from existing domain read-models.
   */
  executeFromDomainOutputs(
    snapshot: FinancialSnapshot,
    timeline?: FinancialTimeline,
    intelligence?: FinancialIntelligence,
    horizonDays: ForecastPeriodDays = 90,
    scenario: ForecastScenarioType = 'current_trend',
    customConfig?: Partial<ForecastScenarioConfig>,
    language: Language = 'vi'
  ): FinancialForecast {
    return ForecastEngine.project({
      snapshot,
      timeline,
      intelligence,
      horizonDays,
      scenario,
      customConfig,
      language
    });
  }
}
