/**
 * Daily Finance 3.0 - Transaction Input & Normalization Engine (D2-002A)
 * 
 * Standard: Pure Domain Component
 * Responsibilities:
 * 1. Normalize raw/legacy/partial transaction inputs before Domain processing.
 * 2. Bi-directionally reconcile alias fields: category <-> categoryId, note <-> description, walletId <-> accountId.
 * 3. Normalize currency codes, numeric amounts, whitespace, and transaction types.
 * 4. Reconcile legacy statuses ('posted'/'cleared' -> 'confirmed', 'pending' -> 'draft') without breaking active legacy transactions (undefined status).
 * 5. Preserve 100% of user metadata, audit trails, and custom properties.
 * 6. Enforce financial truth invariant: deleted/soft_deleted transactions can NEVER be normalized into active confirmed transactions.
 */

import {
  Transaction,
  TransactionType,
  TransactionStatus
} from '../types';
import {
  CANONICAL_TRANSACTION_TYPES
} from './CanonicalFinancialModel';

export class TransactionNormalizer {
  /**
   * Normalizes a single transaction input deterministically.
   * Pure function: returns a new normalized object without mutating the input.
   * 
   * Safety Rules (D2-002A Correction):
   * 1. No Amount Rounding: Preserves exact numeric amount & sign without altering financial values.
   * 2. No Unsafe Currency Defaults: Only trims and uppercases provided currency; does not fabricate defaults.
   * 3. Lifecycle Preservation: Does not alter lifecycle statuses (preserves raw 'posted', 'pending', undefined).
   * 4. Non-Destructive Alias Conflict Policy: If both canonical and compatibility fields are provided, both are preserved independently.
   */
  static normalize<T extends Partial<Transaction>>(rawTx: T): T {
    if (!rawTx || typeof rawTx !== 'object') {
      return rawTx;
    }

    const tx: any = { ...rawTx };

    // 1. Transaction Type Normalization (trim & lowercase)
    if (typeof tx.type === 'string') {
      const trimmedType = tx.type.trim().toLowerCase() as TransactionType;
      if (CANONICAL_TRANSACTION_TYPES.includes(trimmedType)) {
        tx.type = trimmedType;
      } else {
        tx.type = trimmedType;
      }
    }

    // 2. Category & CategoryId Reconciliation (Non-destructive Alias Policy)
    const rawCategory = typeof tx.category === 'string' ? tx.category.trim() : undefined;
    const rawCategoryId = typeof tx.categoryId === 'string' ? tx.categoryId.trim() : undefined;

    if (rawCategory !== undefined && rawCategoryId === undefined) {
      // Case A: Only canonical category is provided -> populate compatibility alias categoryId
      tx.category = rawCategory;
      tx.categoryId = rawCategory;
    } else if (rawCategoryId !== undefined && rawCategory === undefined) {
      // Case B: Only compatibility categoryId is provided -> populate canonical category
      tx.category = rawCategoryId;
      tx.categoryId = rawCategoryId;
    } else if (rawCategory !== undefined && rawCategoryId !== undefined) {
      // Case C & D: Both are provided -> preserve both trimmed values independently without silent overwrite
      tx.category = rawCategory;
      tx.categoryId = rawCategoryId;
    }

    // 3. Note & Description Reconciliation (Non-destructive Alias Policy)
    const rawNote = typeof tx.note === 'string' ? tx.note.trim() : undefined;
    const rawDesc = typeof tx.description === 'string' ? tx.description.trim() : undefined;

    if (rawNote !== undefined && rawDesc === undefined) {
      // Case A: Only note provided -> populate description
      tx.note = rawNote;
      tx.description = rawNote;
    } else if (rawDesc !== undefined && rawNote === undefined) {
      // Case B: Only description provided -> populate note
      tx.note = rawDesc;
      tx.description = rawDesc;
    } else if (rawNote !== undefined && rawDesc !== undefined) {
      // Case C & D: Both provided -> preserve both trimmed values independently
      tx.note = rawNote;
      tx.description = rawDesc;
    }

    // 4. Wallet & Account Reference Reconciliation (Non-destructive Alias Policy)
    const rawWalletId = typeof tx.walletId === 'string' ? tx.walletId.trim() : undefined;
    const rawAccountId = typeof tx.accountId === 'string' ? tx.accountId.trim() : undefined;

    if (rawWalletId !== undefined && rawAccountId === undefined) {
      // Case A: Only walletId provided -> populate accountId
      tx.walletId = rawWalletId;
      tx.accountId = rawWalletId;
    } else if (rawAccountId !== undefined && rawWalletId === undefined) {
      // Case B: Only accountId provided -> populate walletId
      tx.walletId = rawAccountId;
      tx.accountId = rawAccountId;
    } else if (rawWalletId !== undefined && rawAccountId !== undefined) {
      // Case C & D: Both provided -> preserve both trimmed values independently
      tx.walletId = rawWalletId;
      tx.accountId = rawAccountId;
    }

    // 5. Space References Normalization (Trimming whitespace)
    if (typeof tx.spaceId === 'string') {
      tx.spaceId = tx.spaceId.trim();
    }
    if (typeof tx.targetSpaceId === 'string') {
      tx.targetSpaceId = tx.targetSpaceId.trim();
    }
    if (typeof tx.targetWalletId === 'string') {
      tx.targetWalletId = tx.targetWalletId.trim();
    }

    // 6. Currency Normalization (Strictly trim & canonicalize case; NO fabricated defaults)
    if (typeof tx.currency === 'string') {
      const trimmedCurrency = tx.currency.trim();
      tx.currency = trimmedCurrency !== '' ? trimmedCurrency.toUpperCase() : '';
    }

    // 7. Amount Normalization (Preserve exact numeric value and sign; NO arbitrary rounding)
    if (tx.amount !== undefined && tx.amount !== null) {
      const numAmount = Number(tx.amount);
      if (!isNaN(numAmount)) {
        tx.amount = numAmount;
      }
    }

    // 8. Date Normalization (Trimming whitespace)
    if (typeof tx.date === 'string') {
      tx.date = tx.date.trim();
    }

    // 9. Lifecycle Status & Soft-Delete Invariant Normalization
    const isDeletedFlag = tx.isDeleted === true || tx.isSoftDeleted === true || (tx.deletedAt && typeof tx.deletedAt === 'string' && tx.deletedAt.trim() !== '');

    if (isDeletedFlag || tx.status === 'soft_deleted') {
      tx.isDeleted = true;
      tx.status = 'soft_deleted';
    } else if (tx.status !== undefined && tx.status !== null) {
      if (typeof tx.status === 'string') {
        tx.status = tx.status.trim() as TransactionStatus;
      }
      tx.isDeleted = false;
    } else {
      // Legacy transactions without status field: status remains undefined, isDeleted: false
      tx.isDeleted = false;
    }

    // 10. Tags Normalization
    if (Array.isArray(tx.tags)) {
      tx.tags = tx.tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim() !== '')
        .map((tag: string) => tag.trim());
    }

    // 11. String metadata fields trimming
    if (typeof tx.merchant === 'string') {
      tx.merchant = tx.merchant.trim();
    }
    if (typeof tx.receiptUrl === 'string') {
      tx.receiptUrl = tx.receiptUrl.trim();
    }

    return tx as T;
  }

  /**
   * Normalizes an array of transactions safely.
   */
  static normalizeList(transactions: Transaction[]): Transaction[] {
    if (!Array.isArray(transactions)) return [];
    return transactions.map((tx) => TransactionNormalizer.normalize(tx));
  }
}
