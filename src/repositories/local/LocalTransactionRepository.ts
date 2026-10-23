/**
 * Daily Finance 3.0 - LocalTransactionRepository (D4-001)
 * Offline-first local transaction repository.
 * Supports IndexedDB persistence with memory caching, deterministic filtering, and soft-delete/restore operations.
 */

import { TransactionRepository, TransactionFilters } from '../contracts';
import { Transaction, TransactionStatus } from '../../types';
import { IdGenerator } from '../../services/IdGenerator';
import { INITIAL_TRANSACTIONS } from '../../data/initialData';
import { SQLitePersistenceAdapter } from '../../data/database/SQLitePersistenceAdapter';

export class LocalTransactionRepository implements TransactionRepository {
  private transactions: Map<string, Transaction> = new Map();
  private isInitialized = false;
  private db: SQLitePersistenceAdapter | null = null;

  constructor(initialData?: Transaction[], db?: SQLitePersistenceAdapter) {
    this.db = db || null;
    const seed = initialData !== undefined ? initialData : INITIAL_TRANSACTIONS;
    if (seed && Array.isArray(seed)) {
      for (const tx of seed) {
        if (tx && tx.id) {
          this.transactions.set(tx.id, { ...tx });
        }
      }
    }
  }

  /**
   * Initializes storage backend (SQLite durable persistence).
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (!this.db) {
      try {
        this.db = SQLitePersistenceAdapter.getInstance();
        await this.db.open();
      } catch {
        // Fallback gracefully
      }
    }
  }

  public getDatabaseAdapter(): SQLitePersistenceAdapter | null {
    return this.db;
  }

  private async persistTx(tx: Transaction): Promise<void> {
    if (this.db) {
      if (!this.db.isOpen()) {
        await this.db.open();
      }
      await this.db.execute(`
        INSERT OR REPLACE INTO transactions (
          id, spaceId, walletId, accountId, targetSpaceId, targetWalletId,
          categoryId, category, transactionType, amount, currency, exchangeRate,
          note, description, transactionDate, date, status, merchant, method,
          fundId, targetFundId, tags, auditTrail, createdAt, updatedAt, deletedAt,
          version, isDeleted, syncStatus, deviceId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        tx.id,
        tx.spaceId,
        tx.walletId || null,
        (tx as any).accountId || null,
        tx.targetSpaceId || null,
        (tx as any).targetWalletId || null,
        tx.categoryId || tx.category || 'general',
        tx.category || tx.categoryId || 'General',
        tx.type,
        tx.amount,
        tx.currency || 'VND',
        (tx as any).exchangeRate || 1,
        tx.note || null,
        tx.description || tx.note || null,
        (tx as any).transactionDate || tx.date || new Date().toISOString(),
        tx.date || new Date().toISOString().split('T')[0],
        tx.status || 'draft',
        tx.merchant || null,
        (tx as any).method || null,
        (tx as any).fundId || null,
        (tx as any).targetFundId || null,
        JSON.stringify(tx.tags || []),
        JSON.stringify(tx.auditTrail || []),
        tx.createdAt || new Date().toISOString(),
        tx.updatedAt || new Date().toISOString(),
        tx.deletedAt || null,
        tx.version || 1,
        tx.isDeleted ? 1 : 0,
        tx.syncStatus || 'pending',
        'local_device'
      ]);
    }
  }

  /**
   * Adds a new transaction or persists an existing one with an assigned ID.
   */
  async addTransaction(tx: Transaction | Omit<Transaction, 'id'>): Promise<Transaction> {
    await this.init();
    const id = ('id' in tx && tx.id && tx.id.trim() !== '') ? tx.id : IdGenerator.generateId('tx');
    const now = new Date().toISOString();
    
    const newTx: Transaction = {
      ...(tx as any),
      id,
      status: tx.status || ('draft' as TransactionStatus),
      isDeleted: tx.isDeleted || false,
      deletedAt: tx.deletedAt || null,
      syncStatus: tx.syncStatus || 'pending',
      version: (tx.version !== undefined && tx.version !== null) ? tx.version : 1,
      createdAt: tx.createdAt || now,
      updatedAt: tx.updatedAt || now,
      date: tx.date || now.split('T')[0],
      auditTrail: tx.auditTrail ? [...tx.auditTrail] : [
        {
          action: 'create',
          timestamp: now,
          actor: 'local_user',
          details: 'Transaction created locally'
        }
      ]
    };

    this.transactions.set(id, newTx);
    await this.persistTx(newTx);
    return { ...newTx };
  }

  /**
   * Retrieves a single transaction by its unique identifier.
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.init();
    const found = this.transactions.get(id);
    if (!found) return null;
    return { ...found };
  }

  /**
   * Updates an existing transaction.
   */
  async updateTransaction(tx: Transaction): Promise<Transaction> {
    await this.init();
    if (!tx || !tx.id) {
      throw new Error('Transaction ID is required for update');
    }

    const existing = this.transactions.get(tx.id);
    const now = new Date().toISOString();
    const nextVersion = existing ? (existing.version || 1) + 1 : (tx.version || 1);

    const updatedTx: Transaction = {
      ...(existing || {}),
      ...tx,
      version: nextVersion,
      updatedAt: now,
      syncStatus: 'pending'
    };

    this.transactions.set(tx.id, updatedTx);
    await this.persistTx(updatedTx);
    return { ...updatedTx };
  }

  /**
   * Soft-deletes a transaction by ID.
   */
  async deleteTransaction(id: string): Promise<boolean> {
    await this.init();
    const existing = this.transactions.get(id);
    if (!existing) return false;

    const now = new Date().toISOString();
    const updatedTx: Transaction = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      status: 'soft_deleted' as TransactionStatus,
      updatedAt: now,
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          action: 'soft_delete',
          timestamp: now,
          actor: 'local_user',
          details: 'Transaction soft-deleted'
        }
      ]
    };

    this.transactions.set(id, updatedTx);
    await this.persistTx(updatedTx);
    return true;
  }

  /**
   * Restores a soft-deleted transaction.
   */
  async restoreTransaction(id: string): Promise<boolean> {
    await this.init();
    const existing = this.transactions.get(id);
    if (!existing) return false;

    // Idempotent restore
    if (!existing.isDeleted && existing.status !== 'soft_deleted') {
      return true;
    }

    const now = new Date().toISOString();
    const updatedTx: Transaction = {
      ...existing,
      isDeleted: false,
      deletedAt: null,
      status: 'confirmed' as TransactionStatus,
      updatedAt: now,
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          action: 'restore',
          timestamp: now,
          actor: 'local_user',
          details: 'Transaction restored from trash'
        }
      ]
    };

    this.transactions.set(id, updatedTx);
    await this.persistTx(updatedTx);
    return true;
  }

  /**
   * Gets active transactions for a space (or all non-deleted if spaceId omitted).
   * Includes transactions where spaceId === spaceId or targetSpaceId === spaceId.
   */
  async getTransactions(spaceId?: string): Promise<Transaction[]> {
    await this.init();
    const all = Array.from(this.transactions.values()).filter(t => !t.isDeleted && t.status !== 'soft_deleted');
    if (spaceId) {
      return all.filter(t => t.spaceId === spaceId || t.targetSpaceId === spaceId).map(t => ({ ...t }));
    }
    return all.map(t => ({ ...t }));
  }

  /**
   * Gets transactions filtered by spaceId and comprehensive query filters.
   * Includes transactions where spaceId === spaceId or targetSpaceId === spaceId.
   */
  async getTransactionsBySpace(spaceId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    await this.init();
    let result = Array.from(this.transactions.values()).filter(t => t.spaceId === spaceId || t.targetSpaceId === spaceId);

    if (filters) {
      if (filters.status) {
        result = result.filter(t => t.status === filters.status);
      } else {
        // By default exclude soft-deleted unless explicitly requested in status filter
        result = result.filter(t => !t.isDeleted && t.status !== 'soft_deleted');
      }

      if (filters.type) {
        result = result.filter(t => t.type === filters.type);
      }

      if (filters.categoryId) {
        result = result.filter(t => (t.categoryId === filters.categoryId || t.category === filters.categoryId));
      }

      if (filters.walletId) {
        result = result.filter(t => t.walletId === filters.walletId || (t as any).sourceWalletId === filters.walletId || (t as any).destinationWalletId === filters.walletId || (t as any).targetWalletId === filters.walletId);
      }

      if (filters.minAmount !== undefined) {
        result = result.filter(t => t.amount >= filters.minAmount!);
      }

      if (filters.maxAmount !== undefined) {
        result = result.filter(t => t.amount <= filters.maxAmount!);
      }

      if (filters.startDate) {
        const startIso = typeof filters.startDate === 'string' ? filters.startDate : filters.startDate.toISOString();
        result = result.filter(t => t.date >= startIso.split('T')[0]);
      }

      if (filters.endDate) {
        const endIso = typeof filters.endDate === 'string' ? filters.endDate : filters.endDate.toISOString();
        result = result.filter(t => t.date <= endIso.split('T')[0]);
      }

      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase().trim();
        result = result.filter(t => 
          (t.note && t.note.toLowerCase().includes(term)) ||
          (t.category && t.category.toLowerCase().includes(term)) ||
          (t.merchant && t.merchant.toLowerCase().includes(term)) ||
          (t.description && t.description.toLowerCase().includes(term))
        );
      }

      if (filters.offset && filters.offset > 0) {
        result = result.slice(filters.offset);
      }

      if (filters.limit && filters.limit > 0) {
        result = result.slice(0, filters.limit);
      }
    } else {
      result = result.filter(t => !t.isDeleted && t.status !== 'soft_deleted');
    }

    return result.map(t => ({ ...t }));
  }

  /**
   * Retrieves all transactions in local storage regardless of status.
   */
  async getAllTransactions(): Promise<Transaction[]> {
    await this.init();
    return Array.from(this.transactions.values()).map(t => ({ ...t }));
  }

  /**
   * Bulk upserts transactions into storage. Idempotent by transaction ID.
   */
  async bulkUpsert(transactions: Transaction[]): Promise<void> {
    await this.init();
    if (!Array.isArray(transactions)) return;

    for (const tx of transactions) {
      if (!tx || !tx.id) continue;
      const existing = this.transactions.get(tx.id);
      if (existing) {
        // Merge with existing
        const merged: Transaction = {
          ...existing,
          ...tx,
          version: Math.max(existing.version || 1, tx.version || 1),
          auditTrail: [
            ...(existing.auditTrail || []),
            ...(tx.auditTrail || []).filter(a => !(existing.auditTrail || []).some(ea => ea.timestamp === a.timestamp && ea.action === a.action))
          ]
        };
        this.transactions.set(tx.id, merged);
        await this.persistTx(merged);
      } else {
        this.transactions.set(tx.id, { ...tx });
        await this.persistTx(tx);
      }
    }
  }

  /**
   * Finds soft-deleted transactions, optionally since a given Date.
   */
  async findDeletedTransactions(since?: Date): Promise<Transaction[]> {
    await this.init();
    let result = Array.from(this.transactions.values()).filter(t => t.isDeleted || t.status === 'soft_deleted');
    if (since) {
      const sinceTime = since.getTime();
      result = result.filter(t => {
        const deletedTime = t.deletedAt ? new Date(t.deletedAt).getTime() : 0;
        const updatedTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
        return deletedTime >= sinceTime || updatedTime >= sinceTime;
      });
    }
    return result.map(t => ({ ...t }));
  }

  /**
   * Finds transactions that need synchronization with remote cloud.
   */
  async findSyncableTransactions(since?: Date): Promise<Transaction[]> {
    await this.init();
    let result = Array.from(this.transactions.values()).filter(t => t.syncStatus !== 'synced');
    if (since) {
      const sinceTime = since.getTime();
      result = result.filter(t => {
        const updatedTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
        return updatedTime >= sinceTime;
      });
    }
    return result.map(t => ({ ...t }));
  }

  /**
   * Clears all transactions (for testing/diagnostics).
   */
  clear(): void {
    this.transactions.clear();
    if (this.db && this.db.isOpen()) {
      try {
        this.db.execute('DELETE FROM transactions;');
      } catch {
        // Non-blocking fallback
      }
    }
  }
}
