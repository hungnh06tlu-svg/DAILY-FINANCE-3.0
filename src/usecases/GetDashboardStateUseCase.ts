/**
 * Daily Finance 3.0 - GetDashboardStateUseCase
 * Clean Architecture UseCase for building Smart Dashboard State.
 * Consumed strictly by DashboardViewModel and presentation components.
 * Adheres strictly to S4-001 Smart Dashboard Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from './FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from './FinancialTimelineUseCase';
import { GetFinancialForecastUseCase } from './FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from './FinancialPlanUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { FinancialTimeline } from '../domain/FinancialTimeline';
import { FinancialIntelligence } from '../domain/FinancialIntelligence';
import { FinancialForecast } from '../domain/FinancialForecast';
import { FinancialPlan } from '../domain/FinancialPlan';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { DashboardBuilder } from '../domain/DashboardBuilder';
import { Language } from '../types';

export class GetDashboardStateUseCase {
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
      throw new Error('[GetDashboardStateUseCase] Fail-Fast: All dependent UseCases are required');
    }
  }

  /**
   * Builds and returns immutable DashboardState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<DashboardState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const intelligence = await this.getIntelligenceUseCase.execute(spaceId, language);
    const timeline = await this.getTimelineUseCase.execute(spaceId, 'monthly', language);
    const forecast = await this.getForecastUseCase.execute(spaceId, 90, 'current_trend', undefined, language);
    const plan = await this.getPlanUseCase.execute(spaceId, 'current_strategy', language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);

    return DashboardBuilder.build({
      snapshot,
      timeline,
      intelligence,
      forecast,
      plan,
      coachSession,
      language
    });
  }

  /**
   * Generates DashboardState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot: FinancialSnapshot,
    timeline?: FinancialTimeline,
    intelligence?: FinancialIntelligence,
    forecast?: FinancialForecast,
    plan?: FinancialPlan,
    coachSession?: CoachSession,
    language: Language = 'vi'
  ): DashboardState {
    return DashboardBuilder.build({
      snapshot,
      timeline,
      intelligence,
      forecast,
      plan,
      coachSession,
      language
    });
  }
}
