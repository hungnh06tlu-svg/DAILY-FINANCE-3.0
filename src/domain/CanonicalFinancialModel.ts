/**
 * Daily Finance 3.0 — D1 Core Financial Model Standardization
 * Canonical, type-safe financial contracts, space isolation guards,
 * money/currency contracts, lifecycle rules, and compatibility adapters.
 */

import {
  Money,
  Currency,
  FinancialSpace,
  Wallet,
  Account,
  Transaction,
  TransactionType,
  TransactionStatus,
  Category,
  CategoryType,
  Budget,
  SavingsGoal,
  Investment,
  DebtItem,
  Jar,
  AuditTrailEntry
} from '../types';

import {
  BaseRoomEntity,
  FinancialSpaceEntity,
  WalletEntity,
  AccountEntity,
  TransactionEntity,
  CategoryEntity,
  BudgetEntity,
  SavingGoalEntity,
  InvestmentEntity,
  LoanEntity,
  SyncMetadataEntity
} from './RoomEntities';
import { TransactionNormalizer } from './TransactionNormalizer';
export { TransactionNormalizer };

// ============================================================================
// D1-001: CANONICAL MONEY & CURRENCY
// ============================================================================

export const DEFAULT_CURRENCY_CODE = 'VND';

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  VND: { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng', decimalDigits: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalDigits: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalDigits: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalDigits: 0 }
};

export interface JarConfigItem {
  id?: string;
  key: string;
  nameVi?: string;
  nameEn?: string;
  percent: number;
  color?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  currentBalance?: number;
  spaceId?: string;
  isEnabled?: boolean;
  isSoftDeleted?: boolean;
  isDeleted?: boolean;
  status?: string;
}

export const DEFAULT_SIX_JARS_CONFIG: readonly JarConfigItem[] = [
  { key: 'NEC', nameVi: 'Thiết yếu', nameEn: 'Necessities', percent: 55, color: '#3B82F6', descriptionVi: 'Ăn uống, hóa đơn, nhà ở, đi lại', descriptionEn: 'Food, rent, utilities, transport' },
  { key: 'FFA', nameVi: 'Tự do tài chính', nameEn: 'Financial Freedom', percent: 10, color: '#10B981', descriptionVi: 'Đầu tư sinh lời, thu nhập thụ động', descriptionEn: 'Investments, passive income' },
  { key: 'LTSS', nameVi: 'Tiết kiệm dài hạn', nameEn: 'Long-term Savings', percent: 10, color: '#8B5CF6', descriptionVi: 'Mua nhà, xe, quỹ dự phòng', descriptionEn: 'Big purchases, emergency fund' },
  { key: 'EDU', nameVi: 'Giáo dục', nameEn: 'Education', percent: 10, color: '#F59E0B', descriptionVi: 'Sách, khóa học, phát triển bản thân', descriptionEn: 'Books, courses, self-growth' },
  { key: 'PLAY', nameVi: 'Hưởng thụ', nameEn: 'Play & Enjoyment', percent: 10, color: '#EC4899', descriptionVi: 'Du lịch, mua sắm, giải trí', descriptionEn: 'Travel, shopping, leisure' },
  { key: 'GIVE', nameVi: 'Cho đi', nameEn: 'Give / Charity', percent: 5, color: '#14B8A6', descriptionVi: 'Báo hiếu, từ thiện, giúp đỡ', descriptionEn: 'Charity, family support, gifts' }
];

export class MoneyUtils {
  /**
   * Creates a canonical Money object.
   */
  static create(amount: number, currency: string = DEFAULT_CURRENCY_CODE, scale?: number): Money {
    const validAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
    const validCurrency = (currency || DEFAULT_CURRENCY_CODE).trim().toUpperCase();
    return {
      amount: validAmount,
      currency: validCurrency,
      scale: scale ?? (SUPPORTED_CURRENCIES[validCurrency]?.decimalDigits || 0)
    };
  }

  /**
   * Returns a zero Money instance for a currency.
   */
  static zero(currency: string = DEFAULT_CURRENCY_CODE): Money {
    return MoneyUtils.create(0, currency);
  }

  /**
   * Validates if a Money input is finite and valid.
   */
  static isValid(money: Partial<Money> | null | undefined): boolean {
    if (!money) return false;
    if (typeof money.amount !== 'number' || isNaN(money.amount) || !isFinite(money.amount)) return false;
    if (typeof money.currency !== 'string' || money.currency.trim().length === 0) return false;
    return true;
  }

  /**
   * Checks if money amount is strictly positive (> 0).
   */
  static isPositive(money: Money): boolean {
    return MoneyUtils.isValid(money) && money.amount > 0;
  }

  /**
   * Checks if money amount is zero.
   */
  static isZero(money: Money): boolean {
    return MoneyUtils.isValid(money) && money.amount === 0;
  }

  /**
   * Formats numeric currency amounts safely without guessing from string patterns.
   */
  static format(amount: number, currency: string = DEFAULT_CURRENCY_CODE, language: 'vi' | 'en' = 'vi'): string {
    const code = (currency || DEFAULT_CURRENCY_CODE).trim().toUpperCase();
    const curr = SUPPORTED_CURRENCIES[code] || { code, symbol: code, name: code, decimalDigits: 0 };
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr.code,
        maximumFractionDigits: curr.decimalDigits
      }).format(amount);
    } catch {
      return `${amount.toLocaleString(locale)} ${curr.symbol}`;
    }
  }

  /**
   * Safely rounds amounts based on currency scale to prevent floating point noise.
   */
  static round(amount: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round((amount + Number.EPSILON) * factor) / factor;
  }
}

// ============================================================================
// D1-002: FINANCIAL SPACE & SPACE OWNERSHIP
// ============================================================================

export class SpaceIsolationGuard {
  /**
   * Validates and returns a non-empty spaceId. Throws error if missing to prevent silent fallback.
   */
  static validateSpaceId(spaceId?: string | null, contextMessage: string = 'Financial Space Isolation'): string {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error(`[SpaceIsolationGuard] ${contextMessage}: Valid spaceId is strictly required. Fallback space usage is prohibited.`);
    }
    return spaceId.trim();
  }

  /**
   * Verifies if an entity belongs to a specific spaceId.
   */
  static verifyEntitySpaceMatch(entity: { spaceId?: string }, targetSpaceId: string): boolean {
    if (!entity || !entity.spaceId) return false;
    return entity.spaceId.trim() === targetSpaceId.trim();
  }

  /**
   * Filters an array of entities strictly by target spaceId.
   */
  static filterBySpace<T extends { spaceId?: string }>(entities: T[], targetSpaceId: string): T[] {
    const validSpace = SpaceIsolationGuard.validateSpaceId(targetSpaceId, 'filterBySpace');
    return entities.filter((e) => e.spaceId && e.spaceId.trim() === validSpace);
  }

  /**
   * Asserts that two space IDs are identical, throwing if cross-space operation is attempted.
   */
  static assertSameSpace(spaceIdA: string, spaceIdB: string, contextMessage: string = 'Cross-space operation'): void {
    const a = SpaceIsolationGuard.validateSpaceId(spaceIdA, `${contextMessage} Source`);
    const b = SpaceIsolationGuard.validateSpaceId(spaceIdB, `${contextMessage} Target`);
    if (a !== b) {
      throw new Error(`[SpaceIsolationGuard] ${contextMessage} prohibited: Source space '${a}' does not match Target space '${b}'.`);
    }
  }
}

// ============================================================================
// D1-003: TRANSACTION & TRANSFER MODEL
// ============================================================================

export const CANONICAL_TRANSACTION_TYPES: TransactionType[] = [
  'income',
  'expense',
  'transfer',
  'saving',
  'investment',
  'debt',
  'debt_payment',
  'compensation',
  'adjustment',
  'opening_balance',
  'initial_balance'
];

export class TransactionLifecycleGuard {
  /**
   * Validates a transaction against canonical business constraints and optional space context.
   */
  static validateTransaction(
    rawTx: Partial<Transaction>,
    spaceContext?: string
  ): { isValid: boolean; errors: string[] } {
    const tx = TransactionNormalizer.normalize(rawTx);
    const errors: string[] = [];

    // 1. Amount validation (Finite positive number, NaN / Infinity / string reject)
    if (
      tx.amount === undefined ||
      tx.amount === null ||
      typeof tx.amount !== 'number' ||
      !Number.isFinite(tx.amount) ||
      isNaN(tx.amount) ||
      tx.amount <= 0
    ) {
      errors.push('Transaction amount must be a positive finite number greater than 0');
    }

    // 2. Space ID validation
    if (!tx.spaceId || typeof tx.spaceId !== 'string' || tx.spaceId.trim() === '') {
      errors.push('Financial Space ID is required');
    } else if (spaceContext && spaceContext.trim() !== '') {
      // Space Context Isolation check
      if (tx.spaceId.trim() !== spaceContext.trim()) {
        errors.push(`Transaction spaceId '${tx.spaceId}' does not match context spaceId '${spaceContext}'`);
      }
    }

    // 3. Category validation (Required for income, expense, saving, investment, debt, debt_payment, compensation, adjustment)
    // For transfer, opening_balance, initial_balance, category is normalized if empty
    if (!tx.category || typeof tx.category !== 'string' || tx.category.trim() === '') {
      errors.push('Category is required');
    }

    // 4. Transaction Type validation (Strict canonical 11 types)
    if (!tx.type || !CANONICAL_TRANSACTION_TYPES.includes(tx.type)) {
      errors.push(`Invalid transaction type: ${tx.type || 'undefined'}`);
    }

    // 5. Transfer Semantics
    if (tx.type === 'transfer') {
      const transferValidation = TransactionLifecycleGuard.validateTransferSemantics(tx);
      if (!transferValidation.isValid) {
        errors.push(...transferValidation.errors);
      }
    }

    // 6. Timestamp / Date validation
    if (!tx.date || typeof tx.date !== 'string' || tx.date.trim() === '' || isNaN(Date.parse(tx.date))) {
      errors.push('Valid transaction date (ISO string) is required');
    }

    // 7. Currency validation (Required, non-empty, whitespace-only reject)
    if (!tx.currency || typeof tx.currency !== 'string' || tx.currency.trim() === '') {
      errors.push('Currency code is required');
    }

    // 8. Splits Structural & Integrity Validation (if present)
    if (tx.splits !== undefined && tx.splits !== null) {
      if (!Array.isArray(tx.splits)) {
        errors.push('Transaction splits must be an array');
      } else if (tx.splits.length > 0) {
        for (let i = 0; i < tx.splits.length; i++) {
          const split = tx.splits[i];
          if (!split || typeof split !== 'object') {
            errors.push(`Split at index ${i} is invalid`);
            continue;
          }
          if (
            split.amount === undefined ||
            split.amount === null ||
            typeof split.amount !== 'number' ||
            !Number.isFinite(split.amount) ||
            split.amount <= 0
          ) {
            errors.push(`Split at index ${i} must have a positive finite amount`);
          }
          if (!split.categoryId || typeof split.categoryId !== 'string' || split.categoryId.trim() === '') {
            errors.push(`Split at index ${i} requires a valid categoryId`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates transfer-specific semantics (source != destination, source wallet present, positive amount).
   */
  static validateTransferSemantics(tx: Partial<Transaction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const sourceWallet = tx.walletId || tx.accountId;
    if (!sourceWallet || sourceWallet.trim() === '') {
      errors.push('Transfer requires a source wallet or account');
    }

    const hasTargetWallet = !!(tx.targetWalletId && tx.targetWalletId.trim() !== '');
    const hasTargetSpace = !!(tx.targetSpaceId && tx.targetSpaceId.trim() !== '');

    if (!hasTargetWallet && !hasTargetSpace) {
      errors.push('Transfer requires a destination wallet or space');
    }

    // Same space, same wallet check
    if (tx.walletId && tx.targetWalletId && tx.walletId.trim() === tx.targetWalletId.trim()) {
      const sourceSpace = tx.spaceId ? tx.spaceId.trim() : '';
      const targetSpace = tx.targetSpaceId ? tx.targetSpaceId.trim() : sourceSpace;
      if (!targetSpace || targetSpace === sourceSpace) {
        errors.push('Source wallet and target wallet cannot be identical within the same space');
      }
    }

    // Same space transfer without target wallet
    if (
      tx.spaceId &&
      tx.targetSpaceId &&
      tx.spaceId.trim() === tx.targetSpaceId.trim() &&
      !hasTargetWallet
    ) {
      errors.push('Transfer to same space requires a distinct target wallet');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Defines and validates allowed lifecycle transitions.
   */
  static isTransitionAllowed(
    currentStatus: TransactionStatus | 'posted' | 'pending' | undefined,
    nextStatus: TransactionStatus
  ): boolean {
    const from = currentStatus || 'undefined_legacy';

    const ALLOWED_TRANSITIONS: Record<string, TransactionStatus[]> = {
      draft: ['draft', 'validated', 'confirmed', 'soft_deleted'],
      pending: ['draft', 'validated', 'confirmed', 'soft_deleted'], // Legacy pending
      validated: ['validated', 'confirmed', 'draft', 'soft_deleted'],
      confirmed: ['confirmed', 'soft_deleted', 'archived', 'validated', 'restored'],
      posted: ['confirmed', 'soft_deleted', 'archived', 'validated'], // Legacy posted
      undefined_legacy: ['confirmed', 'soft_deleted', 'archived', 'validated'], // Legacy undefined
      soft_deleted: ['restored', 'confirmed'],
      restored: ['confirmed', 'soft_deleted', 'archived', 'validated', 'restored'],
      archived: ['archived', 'restored', 'confirmed', 'soft_deleted']
    };

    const allowed = ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(nextStatus) : false;
  }

  /**
   * Asserts that a state transition is allowed, throwing an error if illegal.
   */
  static assertTransitionAllowed(
    currentStatus: TransactionStatus | 'posted' | 'pending' | undefined,
    nextStatus: TransactionStatus,
    txId: string = 'unknown'
  ): void {
    if (!TransactionLifecycleGuard.isTransitionAllowed(currentStatus, nextStatus)) {
      throw new Error(`[TransactionLifecycleGuard] Invalid lifecycle transition from '${currentStatus || 'undefined'}' to '${nextStatus}' for transaction '${txId}'.`);
    }
  }

  /**
   * Transition transaction lifecycle state deterministically with strict Space & Fund preservation.
   */
  static transitionState(
    tx: Transaction,
    nextStatus: TransactionStatus,
    actor: string = 'user',
    details?: string
  ): Transaction {
    TransactionLifecycleGuard.assertTransitionAllowed(tx.status, nextStatus, tx.id);
    SpaceIsolationGuard.validateSpaceId(tx.spaceId, 'transitionState');

    const now = new Date().toISOString();
    const isSoftDelete = nextStatus === 'soft_deleted';
    const isRestore = nextStatus === 'restored' || (nextStatus === 'confirmed' && (tx.isDeleted || tx.status === 'archived'));
    const isArchive = nextStatus === 'archived';
    const isUnarchive = (nextStatus === 'confirmed' || nextStatus === 'restored') && tx.status === 'archived';

    const auditEntry: AuditTrailEntry = {
      action: isSoftDelete ? 'soft_delete' : isRestore ? 'restore' : isArchive ? 'archive' : 'update',
      timestamp: now,
      actor,
      previousState: { status: tx.status, isDeleted: tx.isDeleted },
      newState: { status: nextStatus, isDeleted: isSoftDelete },
      details: details || `Transitioned status from '${tx.status || 'undefined'}' to '${nextStatus}'`
    };

    return {
      ...tx,
      status: nextStatus,
      isDeleted: isSoftDelete,
      deletedAt: isSoftDelete ? (tx.deletedAt || now) : (isRestore ? undefined : tx.deletedAt),
      archivedAt: isArchive ? (tx.archivedAt || now) : (isUnarchive ? undefined : tx.archivedAt),
      syncStatus: 'pending',
      auditTrail: [...(tx.auditTrail || []), auditEntry]
    };
  }
}

// ============================================================================
// D1-004 & D1-006: CANONICAL LIFECYCLE, METADATA & VERSIONING
// ============================================================================

export class CanonicalMetadata {
  /**
   * Creates base Room Entity metadata fields for new persisted records.
   */
  static createBaseEntity(spaceId: string, id: string, deviceId: string = 'device_local'): BaseRoomEntity {
    const now = new Date().toISOString();
    return {
      id,
      spaceId: SpaceIsolationGuard.validateSpaceId(spaceId, 'createBaseEntity'),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      isDeleted: false,
      syncState: 'pending',
      deviceId
    };
  }

  /**
   * Increments version and updates timestamp for modified records.
   */
  static bumpVersion<T extends BaseRoomEntity>(entity: T): T {
    return {
      ...entity,
      version: (entity.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      syncState: 'pending'
    };
  }

  /**
   * Soft-deletes an entity.
   */
  static softDelete<T extends BaseRoomEntity>(entity: T): T {
    const now = new Date().toISOString();
    return {
      ...entity,
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
      version: (entity.version || 1) + 1,
      syncState: 'pending'
    };
  }
}

// ============================================================================
// D1-007: BIDIRECTIONAL COMPATIBILITY ADAPTERS
// ============================================================================

export class DomainAdapters {
  // Transaction: src/types Transaction <-> src/domain/RoomEntities TransactionEntity
  static toTransactionEntity(tx: Transaction, deviceId: string = 'device_local'): TransactionEntity {
    const now = new Date().toISOString();
    
    // Explicit Canonical Status Mapping with Legacy Support
    let entityStatus: TransactionStatus;
    if (tx.isDeleted || tx.status === 'soft_deleted') {
      entityStatus = 'soft_deleted';
    } else if ((tx.status as any) === 'posted' || (tx.status as any) === 'cleared') {
      // Legacy compatibility: 'posted'/'cleared' mapped to canonical 'confirmed'
      entityStatus = 'confirmed';
    } else if ((tx.status as any) === 'pending') {
      // Legacy compatibility: 'pending' mapped to canonical 'draft'
      entityStatus = 'draft';
    } else if (tx.status) {
      entityStatus = tx.status;
    } else {
      // Legacy transaction with undefined status: active transaction defaults to confirmed
      entityStatus = 'confirmed';
    }

    return {
      id: tx.id,
      spaceId: tx.spaceId,
      walletId: tx.walletId,
      accountId: tx.accountId,
      targetSpaceId: tx.targetSpaceId,
      targetWalletId: tx.targetWalletId,
      categoryId: tx.categoryId || tx.category || 'General',
      transactionType: tx.type, // Direct canonical 1:1 mapping (all 11 canonical types supported)
      amount: tx.amount,
      currency: tx.currency || DEFAULT_CURRENCY_CODE,
      exchangeRate: 1.0,
      note: tx.note || tx.description,
      description: tx.description || tx.note,
      transactionDate: tx.date,
      merchant: tx.merchant,
      method: tx.method,
      receiptUrl: tx.receiptUrl,
      attachmentCount: tx.receiptUrl ? 1 : 0,
      tags: tx.tags,
      status: entityStatus,
      createdAt: tx.createdAt || now,
      updatedAt: tx.updatedAt || now,
      deletedAt: tx.deletedAt || (tx.isDeleted ? now : null),
      version: tx.version || 1,
      isDeleted: !!tx.isDeleted || entityStatus === 'soft_deleted',
      syncState: tx.syncStatus === 'synced' ? 'synced' : 'pending',
      deviceId: tx.deviceId || deviceId
    };
  }

  static fromTransactionEntity(entity: TransactionEntity): Transaction {
    // Explicit Canonical Status Mapping with Legacy Support
    let canonicalStatus: TransactionStatus;
    if (entity.isDeleted || entity.status === 'soft_deleted') {
      canonicalStatus = 'soft_deleted';
    } else if ((entity.status as any) === 'posted' || (entity.status as any) === 'cleared') {
      // Legacy compatibility: 'posted'/'cleared' entity mapped to canonical 'confirmed'
      canonicalStatus = 'confirmed';
    } else if ((entity.status as any) === 'pending') {
      // Legacy compatibility: 'pending' entity mapped to canonical 'draft'
      canonicalStatus = 'draft';
    } else if (entity.status) {
      canonicalStatus = entity.status;
    } else {
      // Legacy entity with undefined status defaults to confirmed if active
      canonicalStatus = 'confirmed';
    }

    return {
      id: entity.id,
      type: entity.transactionType,
      amount: entity.amount,
      currency: entity.currency || DEFAULT_CURRENCY_CODE,
      category: entity.categoryId,
      categoryId: entity.categoryId,
      spaceId: entity.spaceId,
      walletId: entity.walletId,
      accountId: entity.accountId,
      targetSpaceId: entity.targetSpaceId,
      targetWalletId: entity.targetWalletId,
      date: entity.transactionDate,
      note: entity.note || entity.description,
      description: entity.description || entity.note,
      merchant: entity.merchant,
      method: entity.method,
      receiptUrl: entity.receiptUrl,
      tags: entity.tags,
      status: canonicalStatus,
      isDeleted: entity.isDeleted || canonicalStatus === 'soft_deleted',
      deletedAt: entity.deletedAt || undefined,
      syncStatus: entity.syncState === 'synced' ? 'synced' : 'pending',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
      deviceId: entity.deviceId
    };
  }

  // Wallet: Wallet <-> WalletEntity
  static toWalletEntity(wallet: Wallet, deviceId: string = 'device_local'): WalletEntity {
    const now = new Date().toISOString();
    return {
      id: wallet.id,
      spaceId: wallet.spaceId,
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency || DEFAULT_CURRENCY_CODE,
      initialBalance: wallet.initialBalance,
      currentBalance: wallet.currentBalance,
      status: wallet.status,
      cardColor: wallet.cardColor,
      iconName: wallet.iconName,
      isDefault: wallet.isDefault,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      isDeleted: false,
      syncState: 'pending',
      deviceId
    };
  }

  static fromWalletEntity(entity: WalletEntity): Wallet {
    return {
      id: entity.id,
      spaceId: entity.spaceId,
      name: entity.name,
      type: entity.type,
      currency: entity.currency,
      initialBalance: entity.initialBalance,
      currentBalance: entity.currentBalance,
      status: entity.status,
      cardColor: entity.cardColor,
      iconName: entity.iconName,
      isDefault: entity.isDefault
    };
  }
}
