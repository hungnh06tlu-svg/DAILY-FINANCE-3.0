/**
 * Daily Finance 2.5 - DebtMapper
 * Domain Mapper for Debt & Loan Domain (TASK 3).
 * Converts between Repository, Domain, Presentation DTOs, future Room Entities, Backup DTOs, and Sync DTOs.
 * Mapper NEVER validates. Mapper NEVER calculates.
 */

import { DebtItem, DebtUiItem, Language } from '../types';

export class DebtMapper {
  /**
   * Maps raw repository/data source response to Domain DebtItem model.
   */
  static toDomain(raw: any): DebtItem {
    const originalAmount = Number(raw.originalAmount) || Number(raw.amount) || 0;
    const remainingAmount = raw.remainingAmount !== undefined ? Number(raw.remainingAmount) : originalAmount;

    return {
      id: raw.id || 'd_default',
      title: raw.title || 'Untitled Debt/Loan',
      type: raw.type === 'loan' ? 'loan' : 'debt',
      originalAmount,
      remainingAmount,
      interestRate: Number(raw.interestRate) || 0,
      minimumMonthlyPayment: Number(raw.minimumMonthlyPayment) || Math.round(originalAmount / 12),
      counterparty: raw.counterparty || raw.lenderName || raw.borrowerName || 'Unknown',
      dueDate: raw.dueDate || new Date().toISOString().split('T')[0],
      spaceId: raw.spaceId || 'default_space',
      debtType: raw.debtType || (raw.type === 'loan' ? 'money_lent' : 'borrowed_money'),
      status: raw.status || (remainingAmount <= 0 ? 'completed' : 'active'),
      interestPolicy: raw.interestPolicy || 'fixed_interest',
      frequency: raw.frequency || 'monthly',
      isSoftDeleted: Boolean(raw.isSoftDeleted),
      startDate: raw.startDate || new Date().toISOString().split('T')[0],
      notes: raw.notes || '',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      paidAmount: raw.paidAmount !== undefined ? Number(raw.paidAmount) : Math.max(0, originalAmount - remainingAmount)
    };
  }

  /**
   * Maps Domain DebtItem model to future Room Entity / Persistence schema.
   */
  static toPersistence(item: DebtItem): Record<string, any> {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      original_amount: item.originalAmount,
      remaining_amount: item.remainingAmount,
      interest_rate: item.interestRate,
      minimum_monthly_payment: item.minimumMonthlyPayment,
      counterparty: item.counterparty,
      due_date: item.dueDate,
      space_id: item.spaceId,
      debt_type: item.debtType || 'borrowed_money',
      status: item.status || 'active',
      interest_policy: item.interestPolicy || 'fixed_interest',
      frequency: item.frequency || 'monthly',
      is_soft_deleted: item.isSoftDeleted ? 1 : 0,
      start_date: item.startDate || null,
      notes: item.notes || null,
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain DebtItem model to a Presentation DebtUiItem DTO.
   */
  static toPresentationItem(
    item: DebtItem,
    language: Language = 'vi'
  ): DebtUiItem {
    const orig = Math.max(0, item.originalAmount || 0);
    const rem = Math.max(0, item.remainingAmount || 0);
    const paid = Math.max(0, item.paidAmount !== undefined ? item.paidAmount : orig - rem);
    const progress = orig > 0 ? Math.min(100, Math.round((paid / orig) * 100)) : 100;

    return {
      debtItem: item,
      status: item.status || (rem <= 0 ? 'completed' : 'active'),
      outstandingBalance: rem,
      formattedOutstanding: '',
      paidAmount: paid,
      formattedPaidAmount: '',
      remainingAmount: rem,
      formattedRemaining: '',
      interestPaid: 0,
      interestRemaining: 0,
      progressPercent: progress,
      nextPaymentDate: item.dueDate,
      schedule: [],
      alerts: []
    };
  }

  /**
   * Maps Domain DebtItem model to Backup DTO.
   */
  static toBackupDto(item: DebtItem): Record<string, any> {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      originalAmount: item.originalAmount,
      remainingAmount: item.remainingAmount,
      interestRate: item.interestRate,
      minimumMonthlyPayment: item.minimumMonthlyPayment,
      counterparty: item.counterparty,
      dueDate: item.dueDate,
      spaceId: item.spaceId,
      debtType: item.debtType,
      status: item.status,
      interestPolicy: item.interestPolicy,
      frequency: item.frequency,
      isSoftDeleted: item.isSoftDeleted,
      startDate: item.startDate,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  /**
   * Maps Backup DTO back to Domain DebtItem model.
   */
  static fromBackupDto(dto: Record<string, any>): DebtItem {
    return this.toDomain(dto);
  }

  /**
   * Maps Domain DebtItem to Sync DTO.
   */
  static toSyncDto(item: DebtItem): Record<string, any> {
    return {
      entity_type: 'debt_item',
      entity_id: item.id,
      payload: this.toBackupDto(item),
      updated_at: item.updatedAt || new Date().toISOString()
    };
  }
}
