/**
 * Daily Finance 3.0 - GetCoachSessionUseCase
 * Clean Architecture UseCase for AI Coach v2 Orchestration.
 * Consumed by Dashboard, Notification Center, Home Screen, and Widgets.
 * Adheres strictly to DF3-007 AI Coach Orchestration Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { AICoachOrchestrator } from '../domain/AICoachOrchestrator';
import { Language } from '../types';

export class GetCoachSessionUseCase {
  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getIntelligenceUseCase: GetFinancialIntelligenceUseCase,
    private readonly getTimelineUseCase: GetFinancialTimelineUseCase,
    private readonly getForecastUseCase: GetFinancialForecastUseCase,
    private readonly getPlanUseCase: GetFinancialPlanUseCase
  ) {
    if (!getSnapshotUseCase || !getIntelligenceUseCase || !getTimelineUseCase || !getForecastUseCase || !getPlanUseCase) {
      throw new Error('[GetCoachSessionUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Orchestrates and retrieves full CoachSession for a given space.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<CoachSession> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const intelligence = await this.getIntelligenceUseCase.execute(spaceId, language);
    const timeline = await this.getTimelineUseCase.execute(spaceId, 'monthly', language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);

    return AICoachOrchestrator.orchestrate({
      snapshot,
      intelligence,
      timeline,
      forecast,
      plan,
      language
    });
  }

  /**
   * Orchestrates CoachSession directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot: FinancialSnapshot,
    timeline?: FinancialTimeline,
    intelligence?: FinancialIntelligence,
    forecast?: FinancialForecast,
    plan?: FinancialPlan,
    language: Language = 'vi'
  ): CoachSession {
    return AICoachOrchestrator.orchestrate({
      snapshot,
      timeline,
      intelligence,
      forecast,
      plan,
      language
    });
  }
}
