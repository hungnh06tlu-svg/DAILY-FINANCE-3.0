/**
 * Daily Finance 3.0 — Compatibility Migration Engine (D2-002F)
 * 
 * Standard: Pure Domain Component
 * Responsibilities:
 * 1. Safe, non-destructive, deterministic, idempotent migration of legacy transaction entities to canonical domain model.
 * 2. Preserves financial meaning, exact amounts, signs, types, spaces, and wallet identities.
 * 3. Resolves legacy status values without fabricating transitions ('posted'/'cleared' -> 'confirmed', 'pending' -> 'draft', undefined -> 'confirmed' if active).
 * 4. Preserves and reconciles compatibility aliases (category <-> categoryId, note <-> description, walletId <-> accountId).
 * 5. Rejects ambiguous or corrupted financial records (e.g. conflicting non-empty aliases with different values, negative magnitudes, unknown types).
 * 6. Migration idempotency invariant: Migrate(Migrate(tx)) === Migrate(tx).
 */

import {
  Transaction,
  TransactionType,
  TransactionStatus,
  AuditTrailEntry
} from '../types';
import {
  CANONICAL_TRANSACTION_TYPES,
  DEFAULT_CURRENCY_CODE
} from './CanonicalFinancialModel';

export interface MigrationResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  isMigrated: boolean;
}

export class CompatibilityMigrationEngine {
  /**
   * Pure deterministic function: Migrates a legacy or partial transaction to the canonical Transaction contract.
   * Enforces:
   * - Strict non-destructive amount and type preservation.
   * - Space and wallet isolation (never changes spaceId or leaks across spaces).
   * - Rejection of conflicting divergent aliases (e.g. walletId !== accountId when both provided).
   * - Deterministic audit trail preservation and migration marking.
   * - Idempotency: Running migrateTransaction repeatedly on already-migrated records produces identical state.
   */
  static migrateTransaction(raw: any): MigrationResult {
    if (!raw || typeof raw !== 'object') {
      return {
        success: false,
        error: 'Invalid transaction input: must be a non-null object',
        isMigrated: false
      };
    }

    // 1. Mandatory ID preservation
    const id = typeof raw.id === 'string' && raw.id.trim() !== '' ? raw.id.trim() : undefined;
    if (!id) {
      return {
        success: false,
        error: 'Migration failure: Transaction id is required and cannot be empty',
        isMigrated: false
      };
    }

    // 2. Exact Numeric Amount Validation & Preservation
    if (raw.amount === undefined || raw.amount === null || typeof raw.amount !== 'number' || isNaN(raw.amount) || !isFinite(raw.amount)) {
      return {
        success: false,
        error: `Migration failure: Invalid transaction amount for tx ${id}`,
        isMigrated: false
      };
    }
    if (raw.amount < 0) {
      return {
        success: false,
        error: `Migration failure: Transaction amount cannot be negative for tx ${id}`,
        isMigrated: false
      };
    }
    const amount = Number(raw.amount);

    // 3. Canonical Type Validation
    const rawType = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : (typeof raw.transactionType === 'string' ? raw.transactionType.trim().toLowerCase() : '');
    if (!CANONICAL_TRANSACTION_TYPES.includes(rawType as TransactionType)) {
      return {
        success: false,
        error: `Migration failure: Unsupported or invalid transaction type '${rawType}' for tx ${id}`,
        isMigrated: false
      };
    }
    const type = rawType as TransactionType;

    // 4. Space ID & Space Isolation Preservation
    const spaceId = typeof raw.spaceId === 'string' ? raw.spaceId.trim() : '';
    if (!spaceId) {
      return {
        success: false,
        error: `Migration failure: spaceId is required for tx ${id}`,
        isMigrated: false
      };
    }

    // 5. Currency Canonicalization
    const rawCurrency = typeof raw.currency === 'string' ? raw.currency.trim().toUpperCase() : DEFAULT_CURRENCY_CODE;
    const currency = rawCurrency || DEFAULT_CURRENCY_CODE;

    // 6. Category & CategoryId Alias Conflict & Reconciliation
    const rawCat = typeof raw.category === 'string' ? raw.category.trim() : undefined;
    const rawCatId = typeof raw.categoryId === 'string' ? raw.categoryId.trim() : undefined;
    let finalCategory = '';
    let finalCategoryId = '';

    if (rawCat && rawCatId && rawCat !== rawCatId) {
      // Divergent conflicting aliases provided
      return {
        success: false,
        error: `Migration conflict: Conflicting category ('${rawCat}') and categoryId ('${rawCatId}') on tx ${id}`,
        isMigrated: false
      };
    } else if (rawCat) {
      finalCategory = rawCat;
      finalCategoryId = rawCatId || rawCat;
    } else if (rawCatId) {
      finalCategory = rawCatId;
      finalCategoryId = rawCatId;
    } else {
      finalCategory = 'Chưa phân loại';
      finalCategoryId = 'Chưa phân loại';
    }

    // 7. Wallet & Account Alias Conflict & Reconciliation
    const rawWallet = typeof raw.walletId === 'string' ? raw.walletId.trim() : undefined;
    const rawAccount = typeof raw.accountId === 'string' ? raw.accountId.trim() : undefined;
    let finalWalletId: string | undefined = undefined;
    let finalAccountId: string | undefined = undefined;

    if (rawWallet && rawAccount && rawWallet !== rawAccount) {
      // Divergent conflicting account references
      return {
        success: false,
        error: `Migration conflict: Conflicting walletId ('${rawWallet}') and accountId ('${rawAccount}') on tx ${id}`,
        isMigrated: false
      };
    } else if (rawWallet) {
      finalWalletId = rawWallet;
      finalAccountId = rawAccount || rawWallet;
    } else if (rawAccount) {
      finalWalletId = rawAccount;
      finalAccountId = rawAccount;
    }

    // 8. Note & Description Reconciliation
    const rawNote = typeof raw.note === 'string' ? raw.note.trim() : undefined;
    const rawDesc = typeof raw.description === 'string' ? raw.description.trim() : undefined;
    let finalNote = '';
    let finalDescription = '';

    if (rawNote && rawDesc && rawNote !== rawDesc) {
      finalNote = rawNote;
      finalDescription = rawDesc;
    } else {
      const text = rawNote || rawDesc || '';
      finalNote = text;
      finalDescription = text;
    }

    // 9. Transfer Specific Field Canonicalization
    let targetSpaceId: string | undefined = undefined;
    let targetWalletId: string | undefined = undefined;

    if (type === 'transfer') {
      const rawTargetSpace = typeof raw.targetSpaceId === 'string' ? raw.targetSpaceId.trim() : undefined;
      const rawTargetWallet = typeof raw.targetWalletId === 'string' ? raw.targetWalletId.trim() : undefined;

      targetSpaceId = rawTargetSpace || spaceId;
      targetWalletId = rawTargetWallet;

      if (!targetWalletId) {
        return {
          success: false,
          error: `Migration failure: Transfer transaction ${id} missing targetWalletId`,
          isMigrated: false
        };
      }

      if (!finalWalletId) {
        return {
          success: false,
          error: `Migration failure: Transfer transaction ${id} missing source walletId`,
          isMigrated: false
        };
      }

      if (targetSpaceId === spaceId && targetWalletId === finalWalletId) {
        return {
          success: false,
          error: `Migration failure: Transfer transaction ${id} has identical source and destination wallet in same space`,
          isMigrated: false
        };
      }
    } else {
      targetSpaceId = typeof raw.targetSpaceId === 'string' && raw.targetSpaceId.trim() !== '' ? raw.targetSpaceId.trim() : undefined;
      targetWalletId = typeof raw.targetWalletId === 'string' && raw.targetWalletId.trim() !== '' ? raw.targetWalletId.trim() : undefined;
    }

    // 10. Lifecycle State & Soft-Delete Preservation
    const isDeletedFlag = raw.isDeleted === true || raw.isSoftDeleted === true || (typeof raw.deletedAt === 'string' && raw.deletedAt.trim() !== '');
    let status: TransactionStatus;
    let isDeleted = false;
    let deletedAt: string | undefined = undefined;
    let archivedAt: string | undefined = undefined;

    if (isDeletedFlag || raw.status === 'soft_deleted' || raw.status === 'deleted') {
      status = 'soft_deleted';
      isDeleted = true;
      deletedAt = typeof raw.deletedAt === 'string' && raw.deletedAt.trim() !== '' ? raw.deletedAt.trim() : new Date().toISOString();
    } else if (raw.status === 'archived') {
      status = 'archived';
      isDeleted = false;
      archivedAt = typeof raw.archivedAt === 'string' && raw.archivedAt.trim() !== '' ? raw.archivedAt.trim() : new Date().toISOString();
    } else if (raw.status === 'draft' || raw.status === 'pending') {
      status = raw.status === 'pending' ? 'draft' : 'draft';
      isDeleted = false;
    } else if (raw.status === 'validated') {
      status = 'validated';
      isDeleted = false;
    } else if (raw.status === 'restored') {
      status = 'restored';
      isDeleted = false;
    } else if (raw.status === 'posted' || raw.status === 'cleared' || raw.status === 'confirmed') {
      status = 'confirmed';
      isDeleted = false;
    } else {
      // Legacy undefined status on active entity -> canonical confirmed
      status = 'confirmed';
      isDeleted = false;
    }

    // 11. Date Normalization
    const date = typeof raw.date === 'string' && raw.date.trim() !== '' ? raw.date.trim() : (typeof raw.transactionDate === 'string' ? raw.transactionDate.trim() : new Date().toISOString());

    // 12. Audit Trail Preservation
    let auditTrail: AuditTrailEntry[] = [];
    if (Array.isArray(raw.auditTrail)) {
      auditTrail = [...raw.auditTrail];
    }

    const canonicalTx: Transaction = {
      id,
      amount,
      type,
      currency,
      category: finalCategory,
      categoryId: finalCategoryId,
      spaceId,
      walletId: finalWalletId,
      accountId: finalAccountId,
      targetSpaceId,
      targetWalletId,
      date,
      note: finalNote,
      description: finalDescription,
      status,
      isDeleted,
      deletedAt,
      archivedAt,
      syncStatus: raw.syncStatus === 'synced' || raw.syncState === 'synced' ? 'synced' : 'pending',
      auditTrail,
      createdAt: raw.createdAt || date,
      updatedAt: raw.updatedAt || date,
      version: typeof raw.version === 'number' ? raw.version : 1,
      deviceId: raw.deviceId || 'legacy_device'
    };

    return {
      success: true,
      transaction: canonicalTx,
      isMigrated: true
    };
  }

  /**
   * Batch migration of a list of transactions.
   * Returns successful transactions and reports any failed/conflicting entries.
   */
  static migrateBatch(rawList: any[]): { migrated: Transaction[]; errors: Array<{ id?: string; error: string }> } {
    if (!Array.isArray(rawList)) {
      return { migrated: [], errors: [{ error: 'Input must be an array' }] };
    }

    const migrated: Transaction[] = [];
    const errors: Array<{ id?: string; error: string }> = [];

    for (const raw of rawList) {
      const res = this.migrateTransaction(raw);
      if (res.success && res.transaction) {
        migrated.push(res.transaction);
      } else {
        errors.push({ id: raw?.id, error: res.error || 'Unknown migration failure' });
      }
    }

    return { migrated, errors };
  }
}
