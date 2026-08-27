/**
 * Daily Finance 2.5 - FIREUseCases
 * Single-responsibility Use Cases for FIRE Planner (TASK 6).
 * Follows Clean Architecture standards with Domain validation and Engine orchestration.
 */

import {
  FireProfile,
  FireGoal,
  FireProjection,
  FireForecast,
  FireScenario,
  FireRisk,
  FireRecommendation,
  FireSummary,
  FireStatistics,
  Language
} from '../types';
import { FIREEngine } from '../domain/FIREEngine';
import { FIREValidator } from '../domain/FIREValidator';
import { IdGenerator } from '../services/IdGenerator';

export class CreateFireProfileUseCase {
  async execute(data: Omit<FireProfile, 'id'>): Promise<FireProfile> {
    const validation = FIREValidator.validateProfile(data);
    if (!validation.isValid) {
      throw new Error(`Invalid FIRE Profile: ${validation.errors.join(', ')}`);
    }

    const profile: FireProfile = {
      ...data,
      id: IdGenerator.generateId('fire_prof'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return profile;
  }
}

export class UpdateFireProfileUseCase {
  async execute(existing: FireProfile, updates: Partial<FireProfile>): Promise<FireProfile> {
    const merged = { ...existing, ...updates };

    const validation = FIREValidator.validateProfile(merged);
    if (!validation.isValid) {
      throw new Error(`Invalid FIRE Profile update: ${validation.errors.join(', ')}`);
    }

    return {
      ...merged,
      updatedAt: new Date().toISOString()
    };
  }
}

export class CalculateFireGoalUseCase {
  async execute(profile: FireProfile, language: Language = 'vi'): Promise<FireGoal> {
    const targetNetWorth = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    const requiredPassiveIncomeMonthly = Math.round((targetNetWorth * (profile.safeWithdrawalRate / 100)) / 12);
    const progressPercent = targetNetWorth > 0
      ? Math.min(100, Math.round((profile.currentNetWorth / targetNetWorth) * 100))
      : 100;
    const isReached = profile.currentNetWorth >= targetNetWorth;

    return {
      id: IdGenerator.generateId('fire_goal'),
      profileId: profile.id,
      fireType: profile.fireType,
      targetNetWorth,
      formattedTargetNetWorth: '',
      requiredPassiveIncomeMonthly,
      formattedRequiredPassiveIncomeMonthly: '',
      safeWithdrawalRate: profile.safeWithdrawalRate,
      monthlyExpenses: profile.monthlyExpenses,
      formattedMonthlyExpenses: '',
      isReached,
      progressPercent
    };
  }
}

export class GenerateFireProjectionUseCase {
  async execute(
    profile: FireProfile,
    maxYears: number = 30,
    language: Language = 'vi'
  ): Promise<FireProjection> {
    const fireNumber = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    return FIREEngine.orchestrateProjection(profile, fireNumber, maxYears, language);
  }
}

export class GenerateFireForecastUseCase {
  async execute(profile: FireProfile, language: Language = 'vi'): Promise<FireForecast> {
    const fireNumber = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    return FIREEngine.orchestrateForecast(profile, fireNumber, language);
  }
}

export class GenerateFireScenarioUseCase {
  async execute(profile: FireProfile, language: Language = 'vi'): Promise<FireScenario[]> {
    return FIREEngine.orchestrateScenarios(profile, language);
  }
}

export class EvaluateFireRiskUseCase {
  async execute(
    profile: FireProfile,
    totalDebt: number = 0,
    language: Language = 'vi'
  ): Promise<FireRisk[]> {
    return FIREEngine.orchestrateRisks(profile, totalDebt, language);
  }
}

export class GenerateFireRecommendationUseCase {
  async execute(
    profile: FireProfile,
    totalDebt: number = 0,
    language: Language = 'vi'
  ): Promise<FireRecommendation[]> {
    const fireNumber = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    return FIREEngine.orchestrateRecommendations(profile, fireNumber, totalDebt, language);
  }
}

export class GetFireSummaryUseCase {
  async execute(profile: FireProfile, language: Language = 'vi'): Promise<FireSummary> {
    const fireNumber = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    const forecast = FIREEngine.orchestrateForecast(profile, fireNumber, language);

    return FIREEngine.calculateSummary(
      profile,
      fireNumber,
      forecast.yearsRemaining,
      forecast.expectedFireDate,
      language
    );
  }
}

export class GetFireStatisticsUseCase {
  async execute(
    profile: FireProfile,
    totalDebt: number = 0,
    totalInvestments: number = 0
  ): Promise<FireStatistics> {
    const fireNumber = FIREEngine.calculateFireNumber(
      profile.monthlyExpenses,
      profile.safeWithdrawalRate,
      profile.fireType,
      profile.customTargetNetWorth
    );

    return FIREEngine.calculateStatistics(profile, fireNumber, totalDebt, totalInvestments);
  }
}
