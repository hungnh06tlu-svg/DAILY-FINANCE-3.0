/**
 * Daily Finance 2.5 - FIREMapper
 * Domain Mapper for FIRE Planner (TASK 3).
 * Converts between Repository, Domain, Presentation DTOs, future Room Entities, Backup DTOs, and Sync DTOs.
 * Mapper NEVER validates. Mapper NEVER calculates.
 */

import { FireProfile, FireType, Language } from '../types';

export class FIREMapper {
  /**
   * Maps raw repository/data source response to Domain FireProfile model.
   */
  static toDomain(raw: any): FireProfile {
    return {
      id: raw.id || 'fire_profile_default',
      spaceId: raw.spaceId || 'default_space',
      currentAge: Number(raw.currentAge) || 30,
      targetRetirementAge: Number(raw.targetRetirementAge) || 55,
      currentNetWorth: Number(raw.currentNetWorth) || 0,
      monthlyExpenses: Number(raw.monthlyExpenses) || 15000000,
      monthlyIncome: Number(raw.monthlyIncome) || 25000000,
      monthlySavings: Number(raw.monthlySavings) || 7000000,
      monthlyInvestment: Number(raw.monthlyInvestment) || 3000000,
      expectedAnnualReturn: Number(raw.expectedAnnualReturn) || 7,
      safeWithdrawalRate: Number(raw.safeWithdrawalRate) || 4,
      inflationRate: Number(raw.inflationRate) || 3,
      fireType: (raw.fireType as FireType) || 'regular_fire',
      customTargetNetWorth: raw.customTargetNetWorth ? Number(raw.customTargetNetWorth) : undefined,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain FireProfile model to future Room Entity / Persistence schema.
   */
  static toPersistence(profile: FireProfile): Record<string, any> {
    return {
      id: profile.id,
      space_id: profile.spaceId,
      current_age: profile.currentAge,
      target_retirement_age: profile.targetRetirementAge,
      current_net_worth: profile.currentNetWorth,
      monthly_expenses: profile.monthlyExpenses,
      monthly_income: profile.monthlyIncome,
      monthly_savings: profile.monthlySavings,
      monthly_investment: profile.monthlyInvestment,
      expected_annual_return: profile.expectedAnnualReturn,
      safe_withdrawal_rate: profile.safeWithdrawalRate,
      inflation_rate: profile.inflationRate,
      fire_type: profile.fireType,
      custom_target_net_worth: profile.customTargetNetWorth || null,
      created_at: profile.createdAt || new Date().toISOString(),
      updated_at: profile.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain FireProfile model to a Presentation DTO.
   */
  static toPresentation(profile: FireProfile, language: Language = 'vi'): Record<string, any> {
    return {
      profile,
      formattedNetWorth: '',
      formattedMonthlyExpenses: '',
      formattedMonthlyIncome: '',
      formattedMonthlySavings: '',
      formattedMonthlyInvestment: ''
    };
  }

  /**
   * Maps Domain FireProfile model to Backup DTO.
   */
  static toBackupDto(profile: FireProfile): Record<string, any> {
    return {
      id: profile.id,
      spaceId: profile.spaceId,
      currentAge: profile.currentAge,
      targetRetirementAge: profile.targetRetirementAge,
      currentNetWorth: profile.currentNetWorth,
      monthlyExpenses: profile.monthlyExpenses,
      monthlyIncome: profile.monthlyIncome,
      monthlySavings: profile.monthlySavings,
      monthlyInvestment: profile.monthlyInvestment,
      expectedAnnualReturn: profile.expectedAnnualReturn,
      safeWithdrawalRate: profile.safeWithdrawalRate,
      inflationRate: profile.inflationRate,
      fireType: profile.fireType,
      customTargetNetWorth: profile.customTargetNetWorth,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  /**
   * Maps Backup DTO back to Domain FireProfile model.
   */
  static fromBackupDto(dto: Record<string, any>): FireProfile {
    return this.toDomain(dto);
  }

  /**
   * Maps Domain FireProfile to Sync DTO.
   */
  static toSyncDto(profile: FireProfile): Record<string, any> {
    return {
      entity_type: 'fire_profile',
      entity_id: profile.id,
      payload: this.toBackupDto(profile),
      updated_at: profile.updatedAt || new Date().toISOString()
    };
  }
}
