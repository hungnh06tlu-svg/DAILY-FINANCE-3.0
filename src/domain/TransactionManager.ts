/**
 * Daily Finance 2.5 - TransactionManager Production Orchestrator
 * Single production transaction orchestration module.
 * Executes all transaction operations strictly through UseCases.
 */

import { Transaction, TransactionType, TransactionStatus, AuditTrailEntry } from '../types';
import { TransactionRepository, WalletRepository } from '../repositories/contracts';
import { LocalTransactionRepository, LocalWalletRepository } from '../repositories/implementations';
import {
  AddTransactionUseCase,
  UpdateTransactionUseCase,
  SoftDeleteTransactionUseCase,
  RestoreTransactionUseCase,
  ArchiveTransactionUseCase,
  ValidateTransactionUseCase,
  TransferMoneyUseCase,
  ValidationResult
} from '../usecases/TransactionUseCases';
import { IdGenerator } from '../services/IdGenerator';

export interface ActionRecord {
  type: 'add' | 'update' | 'soft_delete' | 'restore' | 'archive';
  tx: Transaction;
  previousState?: Transaction;
  timestamp: string;
}

export class TransactionManager {
  private static instance: TransactionManager;

  // UseCases
  private addUseCase: AddTransactionUseCase;
  private updateUseCase: UpdateTransactionUseCase;
  private softDeleteUseCase: SoftDeleteTransactionUseCase;
  private restoreUseCase: RestoreTransactionUseCase;
  private archiveUseCase: ArchiveTransactionUseCase;
  private validateUseCase: ValidateTransactionUseCase;
  private transferUseCase: TransferMoneyUseCase;

  // Task 6: Undo/Redo Stacks & Sync Queue
  private undoStack: ActionRecord[] = [];
  private redoStack: ActionRecord[] = [];

  constructor(
    private txRepo: TransactionRepository = new LocalTransactionRepository(),
    private walletRepo: WalletRepository = new LocalWalletRepository()
  ) {
    this.addUseCase = new AddTransactionUseCase(txRepo);
    this.updateUseCase = new UpdateTransactionUseCase(txRepo);
    this.softDeleteUseCase = new SoftDeleteTransactionUseCase(txRepo);
    this.restoreUseCase = new RestoreTransactionUseCase(txRepo);
    this.archiveUseCase = new ArchiveTransactionUseCase(txRepo);
    this.validateUseCase = new ValidateTransactionUseCase();
    this.transferUseCase = new TransferMoneyUseCase(walletRepo, txRepo);
  }

  public static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  // TASK 2: Lifecycle - Draft
  createDraft(txData: Partial<Transaction>): Transaction {
    const now = new Date().toISOString();
    const draft: Transaction = {
      id: txData.id || IdGenerator.generateTransactionId(),
      type: txData.type || 'expense',
      amount: txData.amount || 0,
      currency: txData.currency || 'VND',
      category: txData.category || '',
      spaceId: txData.spaceId || '',
      walletId: txData.walletId,
      targetSpaceId: txData.targetSpaceId,
      targetWalletId: txData.targetWalletId,
      date: txData.date || now,
      note: txData.note,
      merchant: txData.merchant,
      method: txData.method,
      receiptUrl: txData.receiptUrl,
      tags: txData.tags,
      splits: txData.splits,

      status: 'draft',
      isDeleted: false,
      syncStatus: 'pending',
      auditTrail: [
        {
          action: 'create',
          timestamp: now,
          actor: 'user',
          details: 'Created draft transaction'
        }
      ]
    };
    return draft;
  }

  // TASK 3 & TASK 4: Validate
  validate(tx: Partial<Transaction>, spaceContext?: string): ValidationResult {
    return this.validateUseCase.execute(tx, spaceContext);
  }

  // TASK 2: Confirmed (Add / Update via UseCases)
  async confirmTransaction(txData: Omit<Transaction, 'id'> | Transaction): Promise<Transaction> {
    let resultTx: Transaction;

    if ('id' in txData && txData.id) {
      const existing = await this.txRepo.getTransactionById(txData.id);
      if (existing) {
        resultTx = await this.updateUseCase.execute({
          ...existing,
          ...txData,
          status: 'confirmed'
        });
        this.undoStack.push({
          type: 'update',
          tx: resultTx,
          previousState: existing,
          timestamp: new Date().toISOString()
        });
      } else {
        resultTx = await this.addUseCase.execute({
          ...txData,
          status: 'confirmed'
        });
        this.undoStack.push({
          type: 'add',
          tx: resultTx,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      resultTx = await this.addUseCase.execute({
        ...txData,
        status: 'confirmed'
      });
      this.undoStack.push({
        type: 'add',
        tx: resultTx,
        timestamp: new Date().toISOString()
      });
    }

    this.redoStack = []; // Clear redo stack on new action
    return resultTx;
  }

  // TASK 2: Soft Delete via UseCase (No physical deletion)
  async softDeleteTransaction(id: string, spaceId?: string): Promise<boolean> {
    const existing = await this.txRepo.getTransactionById(id);
    if (!existing) return false;

    const success = await this.softDeleteUseCase.execute(id, spaceId);
    if (success) {
      this.undoStack.push({
        type: 'soft_delete',
        tx: { ...existing, status: 'soft_deleted', isDeleted: true },
        previousState: existing,
        timestamp: new Date().toISOString()
      });
      this.redoStack = [];
    }
    return success;
  }

  // TASK 2: Restore via UseCase
  async restoreTransaction(id: string, spaceId?: string): Promise<boolean> {
    const existing = await this.txRepo.getTransactionById(id);
    if (!existing) return false;

    const success = await this.restoreUseCase.execute(id, spaceId);
    if (success) {
      this.undoStack.push({
        type: 'restore',
        tx: { ...existing, status: 'confirmed', isDeleted: false },
        previousState: existing,
        timestamp: new Date().toISOString()
      });
      this.redoStack = [];
    }
    return success;
  }

  // TASK 2: Archive via UseCase
  async archiveTransaction(id: string, spaceId?: string): Promise<boolean> {
    const existing = await this.txRepo.getTransactionById(id);
    if (!existing) return false;

    const success = await this.archiveUseCase.execute(id, spaceId);
    if (success) {
      this.undoStack.push({
        type: 'archive',
        tx: { ...existing, status: 'archived' },
        previousState: existing,
        timestamp: new Date().toISOString()
      });
      this.redoStack = [];
    }
    return success;
  }

  // Transfer Money via UseCase
  async transferMoney(params: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    fee?: number;
    spaceId: string;
    note?: string;
  }) {
    return this.transferUseCase.execute(params);
  }

  // TASK 6: Undo
  async undo(): Promise<boolean> {
    const lastAction = this.undoStack.pop();
    if (!lastAction) return false;

    try {
      if (lastAction.type === 'add') {
        await this.softDeleteUseCase.execute(lastAction.tx.id);
      } else if (lastAction.type === 'soft_delete' && lastAction.previousState) {
        await this.restoreUseCase.execute(lastAction.tx.id);
      } else if (lastAction.type === 'update' && lastAction.previousState) {
        await this.updateUseCase.execute(lastAction.previousState);
      }

      this.redoStack.push(lastAction);
      return true;
    } catch (err) {
      // Revert pop on failure to preserve history consistency
      this.undoStack.push(lastAction);
      return false;
    }
  }

  // TASK 6: Redo
  async redo(): Promise<boolean> {
    const nextAction = this.redoStack.pop();
    if (!nextAction) return false;

    try {
      if (nextAction.type === 'add') {
        await this.restoreUseCase.execute(nextAction.tx.id);
      } else if (nextAction.type === 'soft_delete') {
        await this.softDeleteUseCase.execute(nextAction.tx.id);
      } else if (nextAction.type === 'update') {
        await this.updateUseCase.execute(nextAction.tx);
      }

      this.undoStack.push(nextAction);
      return true;
    } catch (err) {
      // Revert pop on failure to preserve history consistency
      this.redoStack.push(nextAction);
      return false;
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // TASK 6: Offline-first & Sync
  async syncPendingTransactions(): Promise<{ syncedCount: number; failedCount: number }> {
    const allTxs = await this.txRepo.getTransactions();
    const pendingTxs = allTxs.filter((tx) => tx.syncStatus === 'pending');

    let syncedCount = 0;
    let failedCount = 0;

    for (const tx of pendingTxs) {
      try {
        const syncedTx: Transaction = {
          ...tx,
          syncStatus: 'synced',
          auditTrail: [
            ...(tx.auditTrail || []),
            {
              action: 'update',
              timestamp: new Date().toISOString(),
              actor: 'sync_engine',
              details: 'Synchronized with remote ledger'
            }
          ]
        };
        await this.txRepo.updateTransaction(syncedTx);
        syncedCount++;
      } catch (err) {
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  }

  async getPendingSyncCount(): Promise<number> {
    const allTxs = await this.txRepo.getTransactions();
    return allTxs.filter((tx) => tx.syncStatus === 'pending').length;
  }
}
