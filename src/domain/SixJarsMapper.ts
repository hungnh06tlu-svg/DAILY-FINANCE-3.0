/**
 * Daily Finance 2.5 - SixJarsMapper
 * Domain Mapper for Six Jars Domain (TASK 3).
 * Converts between Repository, Domain, Presentation DTOs, future Room Entities, Backup DTOs, and Sync DTOs.
 * Mapper NEVER validates. Mapper NEVER calculates.
 */

import { Jar, JarUiItem, Language } from '../types';

export class SixJarsMapper {
  /**
   * Maps raw repository/data source response to Domain Jar model.
   */
  static toDomain(raw: any): Jar {
    return {
      id: raw.id || 'jar_default',
      key: raw.key || 'CUSTOM',
      nameVi: raw.nameVi || raw.name || 'Hũ Tài Chính',
      nameEn: raw.nameEn || raw.name || 'Financial Jar',
      percent: raw.percent !== undefined ? Number(raw.percent) : 0,
      currentBalance: Number(raw.currentBalance) || Number(raw.balance) || 0,
      color: raw.color || '#3B82F6',
      descriptionVi: raw.descriptionVi || '',
      descriptionEn: raw.descriptionEn || '',
      spaceId: raw.spaceId || 'default_space',
      targetAmount: raw.targetAmount !== undefined ? Number(raw.targetAmount) : 0,
      status: raw.status || 'active',
      ruleType: raw.ruleType || 'percentage',
      fixedAllocationAmount: raw.fixedAllocationAmount ? Number(raw.fixedAllocationAmount) : 0,
      isEnabled: raw.isEnabled !== false,
      isCustom: Boolean(raw.isCustom),
      isSoftDeleted: Boolean(raw.isSoftDeleted),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain Jar model to future Room Entity / Persistence schema.
   */
  static toPersistence(jar: Jar): Record<string, any> {
    return {
      id: jar.id,
      jar_key: jar.key,
      name_vi: jar.nameVi,
      name_en: jar.nameEn,
      percent: jar.percent,
      current_balance: jar.currentBalance,
      color: jar.color,
      description_vi: jar.descriptionVi || null,
      description_en: jar.descriptionEn || null,
      space_id: jar.spaceId,
      target_amount: jar.targetAmount || 0,
      status: jar.status || 'active',
      rule_type: jar.ruleType || 'percentage',
      fixed_allocation_amount: jar.fixedAllocationAmount || 0,
      is_enabled: jar.isEnabled !== false ? 1 : 0,
      is_custom: jar.isCustom ? 1 : 0,
      is_soft_deleted: jar.isSoftDeleted ? 1 : 0,
      created_at: jar.createdAt || new Date().toISOString(),
      updated_at: jar.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain Jar model to a Presentation JarUiItem DTO.
   */
  static toPresentationItem(
    jar: Jar,
    language: Language = 'vi'
  ): JarUiItem {
    const bal = Math.max(0, jar.currentBalance || 0);
    const target = Math.max(0, jar.targetAmount || 0);
    const progress = target > 0 ? Math.min(100, Math.round((bal / target) * 100)) : 100;
    const remaining = Math.max(0, target - bal);

    return {
      jar,
      formattedBalance: '',
      formattedTarget: '',
      progressPercent: progress,
      remainingToTarget: remaining,
      formattedRemainingToTarget: '',
      monthlyContribution: 0,
      formattedMonthlyContribution: '',
      forecastBalance3Months: bal,
      formattedForecastBalance3Months: '',
      alerts: []
    };
  }

  /**
   * Maps Domain Jar model to Backup DTO.
   */
  static toBackupDto(jar: Jar): Record<string, any> {
    return {
      id: jar.id,
      key: jar.key,
      nameVi: jar.nameVi,
      nameEn: jar.nameEn,
      percent: jar.percent,
      currentBalance: jar.currentBalance,
      color: jar.color,
      descriptionVi: jar.descriptionVi,
      descriptionEn: jar.descriptionEn,
      spaceId: jar.spaceId,
      targetAmount: jar.targetAmount,
      status: jar.status,
      ruleType: jar.ruleType,
      fixedAllocationAmount: jar.fixedAllocationAmount,
      isEnabled: jar.isEnabled,
      isCustom: jar.isCustom,
      isSoftDeleted: jar.isSoftDeleted,
      createdAt: jar.createdAt,
      updatedAt: jar.updatedAt
    };
  }

  /**
   * Maps Backup DTO back to Domain Jar model.
   */
  static fromBackupDto(dto: Record<string, any>): Jar {
    return this.toDomain(dto);
  }

  /**
   * Maps Domain Jar to Sync DTO.
   */
  static toSyncDto(jar: Jar): Record<string, any> {
    return {
      entity_type: 'jar',
      entity_id: jar.id,
      payload: this.toBackupDto(jar),
      updated_at: jar.updatedAt || new Date().toISOString()
    };
  }
}
