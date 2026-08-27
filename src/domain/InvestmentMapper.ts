/**
 * Daily Finance 2.5 - InvestmentMapper
 * Domain Mapper for Investment Domain (TASK 15).
 * Converts between Repository, Domain, UI DTOs, future Room Entities, and Backup DTOs.
 */

import { Investment, InvestmentHolding, InvestmentUiItem, Language } from '../types';
import { IdGenerator } from '../services/IdGenerator';

export class InvestmentMapper {
  /**
   * Maps raw data or Room entity to Domain Investment model.
   */
  static toDomain(raw: any): Investment {
    return {
      id: raw.id || IdGenerator.generateId('inv'),
      spaceId: raw.spaceId || 'default_space',
      name: raw.name || 'Unnamed Asset',
      type: raw.type || 'stock',
      quantity: Number(raw.quantity) || 0,
      purchasePrice: Number(raw.purchasePrice) || 0,
      currentPrice: Number(raw.currentPrice) || Number(raw.purchasePrice) || 0,
      currency: raw.currency || 'VND',
      symbol: raw.symbol || '',
      status: raw.status || 'active',
      policy: raw.policy || 'long_term',
      isSoftDeleted: Boolean(raw.isSoftDeleted),
      targetProfitPercent: raw.targetProfitPercent !== undefined ? Number(raw.targetProfitPercent) : undefined,
      stopLossPercent: raw.stopLossPercent !== undefined ? Number(raw.stopLossPercent) : undefined,
      annualReturn: raw.annualReturn !== undefined ? Number(raw.annualReturn) : undefined,
      monthlyReturn: raw.monthlyReturn !== undefined ? Number(raw.monthlyReturn) : undefined,
      notes: raw.notes || '',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain Investment model to future Room Entity / Persistence schema.
   */
  static toPersistence(inv: Investment): Record<string, any> {
    return {
      id: inv.id,
      space_id: inv.spaceId,
      name: inv.name,
      type: inv.type,
      quantity: inv.quantity,
      purchase_price: inv.purchasePrice,
      current_price: inv.currentPrice,
      currency: inv.currency,
      symbol: inv.symbol || null,
      status: inv.status || 'active',
      policy: inv.policy || 'long_term',
      is_soft_deleted: inv.isSoftDeleted ? 1 : 0,
      target_profit_percent: inv.targetProfitPercent ?? null,
      stop_loss_percent: inv.stopLossPercent ?? null,
      notes: inv.notes || null,
      created_at: inv.createdAt || new Date().toISOString(),
      updated_at: inv.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Maps Domain Investment model to an InvestmentHolding DTO for UI presentation.
   */
  static toHolding(inv: Investment, language: Language = 'vi'): InvestmentHolding {
    const qty = Math.max(0, inv.quantity || 0);
    const costBasisPrice = Math.max(0, inv.purchasePrice || 0);
    const currentPrice = Math.max(0, inv.currentPrice || 0);

    const totalCostBasis = qty * costBasisPrice;
    const currentValue = qty * currentPrice;
    const profitLoss = currentValue - totalCostBasis;
    const profitLossPercent = totalCostBasis > 0 ? (profitLoss / totalCostBasis) * 100 : 0;

    const currency = inv.currency || 'VND';

    return {
      symbol: inv.symbol || inv.name,
      name: inv.name,
      type: inv.type,
      totalQuantity: qty,
      averageCostBasis: costBasisPrice,
      totalCostBasis,
      formattedCostBasis: '',
      currentPrice,
      currentValue,
      formattedCurrentValue: '',
      profitLoss,
      formattedProfitLoss: '',
      profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
      allocationPercent: 0 // Will be calculated relative to total portfolio in Engine
    };
  }

  /**
   * Maps Domain Investment model to Backup DTO.
   */
  static toBackupDto(inv: Investment): Record<string, any> {
    return {
      id: inv.id,
      spaceId: inv.spaceId,
      name: inv.name,
      type: inv.type,
      quantity: inv.quantity,
      purchasePrice: inv.purchasePrice,
      currentPrice: inv.currentPrice,
      currency: inv.currency,
      symbol: inv.symbol,
      status: inv.status,
      policy: inv.policy,
      isSoftDeleted: inv.isSoftDeleted,
      targetProfitPercent: inv.targetProfitPercent,
      stopLossPercent: inv.stopLossPercent,
      notes: inv.notes,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt
    };
  }

  /**
   * Maps Backup DTO back to Domain Investment model.
   */
  static fromBackupDto(dto: Record<string, any>): Investment {
    return this.toDomain(dto);
  }
}
