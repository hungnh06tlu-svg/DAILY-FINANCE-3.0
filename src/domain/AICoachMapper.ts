/**
 * Daily Finance 2.5 - AICoachMapper
 * Domain Mapper for AI Coach (TASK 3).
 * Converts between Repository, Domain, Presentation DTOs, Room Entities, Backup DTOs, and Sync DTOs.
 * Mapper NEVER validates. Mapper NEVER calculates.
 */

import { CoachProfile, Language } from '../types';

export class AICoachMapper {
  /**
   * Maps raw data source / repository response to Domain CoachProfile model.
   */
  static toDomainProfile(raw: any): CoachProfile {
    return {
      id: raw.id || 'coach_profile_default',
      spaceId: raw.spaceId || 'default_space',
      primaryFocus: raw.primaryFocus || 'savings',
      riskTolerance: raw.riskTolerance || 'moderate',
      monthlyIncomeTarget: raw.monthlyIncomeTarget ? Number(raw.monthlyIncomeTarget) : undefined,
      monthlySavingsTarget: raw.monthlySavingsTarget ? Number(raw.monthlySavingsTarget) : undefined,
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain CoachProfile model to future Room Entity / Persistence schema.
   */
  static toPersistenceProfile(profile: CoachProfile): Record<string, any> {
    return {
      id: profile.id,
      space_id: profile.spaceId || 'default_space',
      primary_focus: profile.primaryFocus || 'savings',
      risk_tolerance: profile.riskTolerance || 'moderate',
      monthly_income_target: profile.monthlyIncomeTarget ?? null,
      monthly_savings_target: profile.monthlySavingsTarget ?? null,
      updated_at: profile.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain CoachProfile model to Presentation DTO.
   */
  static toPresentationProfile(profile: CoachProfile, language: Language = 'vi'): Record<string, any> {
    return {
      profile,
      formattedIncomeTarget: profile.monthlyIncomeTarget ? String(profile.monthlyIncomeTarget) : null,
      formattedSavingsTarget: profile.monthlySavingsTarget ? String(profile.monthlySavingsTarget) : null
    };
  }

  /**
   * Maps Domain CoachProfile to Backup DTO.
   */
  static toBackupDto(profile: CoachProfile): Record<string, any> {
    return {
      id: profile.id,
      spaceId: profile.spaceId,
      primaryFocus: profile.primaryFocus,
      riskTolerance: profile.riskTolerance,
      monthlyIncomeTarget: profile.monthlyIncomeTarget,
      monthlySavingsTarget: profile.monthlySavingsTarget,
      updatedAt: profile.updatedAt
    };
  }

  /**
   * Maps Backup DTO back to Domain CoachProfile.
   */
  static fromBackupDto(dto: Record<string, any>): CoachProfile {
    return this.toDomainProfile(dto);
  }

  /**
   * Maps Domain CoachProfile to Sync DTO.
   */
  static toSyncDto(profile: CoachProfile): Record<string, any> {
    return {
      entity_type: 'coach_profile',
      entity_id: profile.id,
      payload: this.toBackupDto(profile),
      updated_at: profile.updatedAt || new Date().toISOString()
    };
  }
}
