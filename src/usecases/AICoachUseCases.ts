/**
 * Daily Finance 2.5 - AICoachUseCases
 * Single-responsibility Use Cases for AI Coach Foundation (TASK 6).
 * Follows Clean Architecture standards with Domain validation and Engine orchestration.
 */

import {
  CoachHealth,
  CoachInsight,
  CoachRecommendation,
  CoachActionPlan,
  CoachRisk,
  CoachOpportunity,
  CoachSummary,
  CoachStatistics,
  Language
} from '../types';
import { AICoachEngine, FinancialSnapshotInput } from '../domain/AICoachEngine';

export class AnalyzeFinancialHealthUseCase {
  async execute(snapshot: FinancialSnapshotInput, language: Language = 'vi'): Promise<CoachHealth> {
    return AICoachEngine.analyzeHealth(snapshot, language);
  }
}

export class GenerateInsightsUseCase {
  async execute(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): Promise<CoachInsight[]> {
    return AICoachEngine.generateInsights(snapshot, health, language);
  }
}

export class GenerateRecommendationsUseCase {
  async execute(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): Promise<CoachRecommendation[]> {
    return AICoachEngine.generateRecommendations(snapshot, health, language);
  }
}

export class GenerateActionPlanUseCase {
  async execute(
    recs: CoachRecommendation[],
    risks: CoachRisk[],
    language: Language = 'vi'
  ): Promise<CoachActionPlan> {
    const priorities = AICoachEngine.prioritize(recs, risks, language);
    return AICoachEngine.generateActionPlan(recs, priorities, language);
  }
}

export class GenerateRiskAssessmentUseCase {
  async execute(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): Promise<CoachRisk[]> {
    return AICoachEngine.generateRisks(snapshot, health, language);
  }
}

export class GenerateOpportunityAnalysisUseCase {
  async execute(
    snapshot: FinancialSnapshotInput,
    health: CoachHealth,
    language: Language = 'vi'
  ): Promise<CoachOpportunity[]> {
    return AICoachEngine.generateOpportunities(snapshot, health, language);
  }
}

export class GetCoachSummaryUseCase {
  async execute(
    health: CoachHealth,
    risks: CoachRisk[],
    opps: CoachOpportunity[],
    recs: CoachRecommendation[],
    language: Language = 'vi'
  ): Promise<CoachSummary> {
    const priorities = AICoachEngine.prioritize(recs, risks, language);
    const plan = AICoachEngine.generateActionPlan(recs, priorities, language);
    return AICoachEngine.calculateSummary(health, priorities, risks, opps, plan, language);
  }
}

export class GetCoachStatisticsUseCase {
  async execute(
    health: CoachHealth,
    risks: CoachRisk[],
    opps: CoachOpportunity[],
    recs: CoachRecommendation[],
    language: Language = 'vi'
  ): Promise<CoachStatistics> {
    const priorities = AICoachEngine.prioritize(recs, risks, language);
    const plan = AICoachEngine.generateActionPlan(recs, priorities, language);
    return AICoachEngine.calculateStatistics(health, plan, risks, opps);
  }
}
