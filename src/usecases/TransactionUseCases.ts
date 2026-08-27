/**
 * Daily Finance 2.5 - Transaction UseCases
 * Single-responsibility Use Cases for Transaction operations with business validation and lifecycle handling.
 */

import { Transaction, TransactionType, AuditTrailEntry } from '../types';
import { TransactionRepository, WalletRepository } from '../repositories/contracts';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { TransactionNormalizer } from '../domain/TransactionNormalizer';
import { TransactionLifecycleGuard, SpaceIsolationGuard } from '../domain/CanonicalFinancialModel';

export const VALID_TRANSACTION_TYPES: TransactionType[] = [
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidateTransactionUseCase {
  execute(rawTx: Partial<Transaction>, spaceContext?: string): ValidationResult {
    return TransactionLifecycleGuard.validateTransaction(rawTx, spaceContext);
  }
}

export class AddTransactionUseCase {
  private validator = new ValidateTransactionUseCase();

  constructor(private txRepo: TransactionRepository) {}

  async execute(rawTx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const tx = TransactionNormalizer.normalize(rawTx as Partial<Transaction>) as Omit<Transaction, 'id'>;
    const validation = this.validator.execute(tx);
    if (!validation.isValid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join('; ')}`);
    }

    const auditEntry: AuditTrailEntry = {
      action: 'create',
      timestamp: new Date().toISOString(),
      actor: 'user',
      details: `Created transaction of type ${tx.type}`
    };

    const newTx: Omit<Transaction, 'id'> = {
      ...tx,
      status: tx.status || 'draft',
      isDeleted: false,
      syncStatus: tx.syncStatus || 'pending',
      auditTrail: [...(tx.auditTrail || []), auditEntry]
    };

    return this.txRepo.addTransaction(newTx);
  }
}

export class UpdateTransactionUseCase {
  private validator = new ValidateTransactionUseCase();

  constructor(private txRepo: TransactionRepository) {}

  async execute(rawTx: Transaction): Promise<Transaction> {
    if (!rawTx.id || rawTx.id.trim() === '') {
      throw new Error('Transaction ID is required for update');
    }

    // Retrieve current transaction from repository
    const currentTx = await this.txRepo.getTransactionById(rawTx.id);
    if (!currentTx) {
      throw new Error(`Transaction ${rawTx.id} not found`);
    }

    // Reject if deleted or archived
    if (currentTx.isDeleted || currentTx.status === 'soft_deleted' || currentTx.status === 'archived') {
      throw new Error(`Cannot update ${currentTx.status || 'deleted'} transaction`);
    }

    // Enforce lifecycle guard if status has changed
    if (rawTx.status && rawTx.status !== currentTx.status) {
      TransactionLifecycleGuard.assertTransitionAllowed(
        currentTx.status,
        rawTx.status,
        rawTx.id
      );
    }

    const tx = TransactionNormalizer.normalize(rawTx);
    const validation = this.validator.execute(tx);
    if (!validation.isValid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join('; ')}`);
    }

    const auditEntry: AuditTrailEntry = {
      action: 'update',
      timestamp: new Date().toISOString(),
      actor: 'user',
      details: 'Updated transaction fields'
    };

    const updatedTx: Transaction = {
      ...tx,
      syncStatus: 'pending',
      auditTrail: [...(tx.auditTrail || []), auditEntry]
    };

    return this.txRepo.updateTransaction(updatedTx);
  }
}

export class SoftDeleteTransactionUseCase {
  constructor(private txRepo: TransactionRepository) {}

  async execute(id: string, spaceId?: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Transaction ID is required for soft delete');
    }

    const tx = await this.txRepo.getTransactionById(id);
    if (!tx) {
      return false;
    }

    if (spaceId && !SpaceIsolationGuard.verifyEntitySpaceMatch(tx, spaceId)) {
      throw new Error(`[SoftDeleteTransactionUseCase] Cross-space deletion prohibited: Transaction belongs to space '${tx.spaceId}', attempted from space '${spaceId}'`);
    }

    const softDeletedTx = TransactionLifecycleGuard.transitionState(
      tx,
      'soft_deleted',
      'user',
      'Soft deleted transaction (preserved for audit)'
    );

    await this.txRepo.updateTransaction(softDeletedTx);
    return true;
  }
}

export class RestoreTransactionUseCase {
  constructor(private txRepo: TransactionRepository) {}

  async execute(id: string, spaceId?: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Transaction ID is required for restore');
    }

    const tx = await this.txRepo.getTransactionById(id);
    if (!tx) {
      return false;
    }

    if (spaceId && !SpaceIsolationGuard.verifyEntitySpaceMatch(tx, spaceId)) {
      throw new Error(`[RestoreTransactionUseCase] Cross-space restore prohibited: Transaction belongs to space '${tx.spaceId}', attempted from space '${spaceId}'`);
    }

    // Idempotency check: Already active, no action needed
    if (tx.status === 'confirmed' || tx.status === 'restored') {
      return true;
    }

    const restoredTx = TransactionLifecycleGuard.transitionState(
      tx,
      'confirmed',
      'user',
      'Restored soft-deleted transaction'
    );

    await this.txRepo.updateTransaction(restoredTx);
    return true;
  }
}

export class ArchiveTransactionUseCase {
  constructor(private txRepo: TransactionRepository) {}

  async execute(id: string, spaceId?: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new Error('Transaction ID is required for archive');
    }

    const tx = await this.txRepo.getTransactionById(id);
    if (!tx) {
      return false;
    }

    if (spaceId && !SpaceIsolationGuard.verifyEntitySpaceMatch(tx, spaceId)) {
      throw new Error(`[ArchiveTransactionUseCase] Cross-space archive prohibited: Transaction belongs to space '${tx.spaceId}', attempted from space '${spaceId}'`);
    }

    const archivedTx = TransactionLifecycleGuard.transitionState(
      tx,
      'archived',
      'user',
      'Archived transaction'
    );

    await this.txRepo.updateTransaction(archivedTx);
    return true;
  }
}

export class DeleteTransactionUseCase {
  private softDeleteUseCase: SoftDeleteTransactionUseCase;

  constructor(private txRepo: TransactionRepository) {
    this.softDeleteUseCase = new SoftDeleteTransactionUseCase(txRepo);
  }

  // Soft deletes to comply with "Do NOT physically delete transactions" rule
  async execute(id: string, spaceId?: string): Promise<boolean> {
    return this.softDeleteUseCase.execute(id, spaceId);
  }
}

export class TransferMoneyUseCase {
  constructor(
    private walletRepo: WalletRepository,
    private txRepo: TransactionRepository
  ) {}

  async execute(params: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    fee?: number;
    spaceId: string;
    note?: string;
  }): Promise<{ success: boolean; transferTransactionId?: string; error?: string }> {
    if (!params.fromWalletId || !params.toWalletId) {
      return { success: false, error: 'Source and target wallet IDs are required' };
    }
    if (params.fromWalletId === params.toWalletId) {
      return { success: false, error: 'Cannot transfer money to the same wallet' };
    }
    if (!params.amount || params.amount <= 0) {
      return { success: false, error: 'Transfer amount must be positive' };
    }
    if (!params.spaceId) {
      return { success: false, error: 'SpaceId is required for transfer' };
    }

    const fromWallet = await this.walletRepo.getWalletById(params.fromWalletId);
    const toWallet = await this.walletRepo.getWalletById(params.toWalletId);

    if (!fromWallet || !toWallet) {
      return { success: false, error: 'Source or destination wallet not found' };
    }

    const calculation = FinancialTruthEngine.calculateTransfer(
      fromWallet.currentBalance,
      toWallet.currentBalance,
      params.amount,
      params.fee || 0
    );

    if (!calculation.isSuccess) {
      return { success: false, error: calculation.errorReason || 'Transfer calculation failed' };
    }

    const originalFromBalance = fromWallet.currentBalance;
    const originalToBalance = toWallet.currentBalance;

    try {
      // 1. Update source wallet
      await this.walletRepo.updateWallet({
        ...fromWallet,
        currentBalance: calculation.newFromBalance
      });

      // 2. Update destination wallet
      await this.walletRepo.updateWallet({
        ...toWallet,
        currentBalance: calculation.newToBalance
      });

      const auditEntry: AuditTrailEntry = {
        action: 'create',
        timestamp: new Date().toISOString(),
        actor: 'user',
        details: `Created transfer of ${params.amount} ${fromWallet.currency} from ${fromWallet.name} to ${toWallet.name}`
      };

      // 3. Record transfer transaction via single canonical entity
      const tx = await this.txRepo.addTransaction({
        type: 'transfer',
        amount: params.amount,
        currency: fromWallet.currency,
        category: 'Chuyển tiền (Transfer)',
        spaceId: params.spaceId,
        walletId: params.fromWalletId,
        targetSpaceId: toWallet.spaceId || params.spaceId,
        targetWalletId: params.toWalletId,
        date: new Date().toISOString(),
        note: params.note || `Chuyển sang ${toWallet.name}`,
        status: 'confirmed',
        isDeleted: false,
        syncStatus: 'pending',
        auditTrail: [auditEntry]
      });

      return { success: true, transferTransactionId: tx.id };
    } catch (err: any) {
      // Atomic rollback of wallet balances on failure
      try {
        await this.walletRepo.updateWallet({
          ...fromWallet,
          currentBalance: originalFromBalance
        });
        await this.walletRepo.updateWallet({
          ...toWallet,
          currentBalance: originalToBalance
        });
      } catch {
        // Rollback completed
      }
      return { success: false, error: err?.message || 'Transfer execution failed' };
    }
  }
}

export class GetTransactionsUseCase {
  constructor(private txRepo: TransactionRepository) {}

  async execute(spaceId?: string): Promise<Transaction[]> {
    return this.txRepo.getTransactions(spaceId);
  }
}
