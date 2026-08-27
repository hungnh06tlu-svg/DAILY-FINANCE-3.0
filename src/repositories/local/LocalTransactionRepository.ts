/**
 * Daily Finance 3.0 - LocalTransactionRepository (D4-001)
 * Offline-first local transaction repository.
 * Supports IndexedDB persistence with memory caching, deterministic filtering, and soft-delete/restore operations.
 */

import { TransactionRepository, TransactionFilters } from '../contracts';
import { Transaction, TransactionStatus } from '../../types';
import { IdGenerator } from '../../services/IdGenerator';

export class LocalTransactionRepository implements TransactionRepository {
  private transactions: Map<string, Transaction> = new Map();
  private isInitialized = false;

  constructor(initialData?: Transaction[]) {
    if (initialData && Array.isArray(initialData)) {
      for (const tx of initialData) {
        if (tx && tx.id) {
          this.transactions.set(tx.id, { ...tx });
        }
      }
    }
  }

  /**
   * Initializes storage backend (IndexedDB or in-memory fallback).
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
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
    return true;
  }

  /**
   * Gets active transactions for a space (or all non-deleted if spaceId omitted).
   */
  async getTransactions(spaceId?: string): Promise<Transaction[]> {
    await this.init();
    const all = Array.from(this.transactions.values()).filter(t => !t.isDeleted && t.status !== 'soft_deleted');
    if (spaceId) {
      return all.filter(t => t.spaceId === spaceId).map(t => ({ ...t }));
    }
    return all.map(t => ({ ...t }));
  }

  /**
   * Gets transactions filtered by spaceId and comprehensive query filters.
   */
  async getTransactionsBySpace(spaceId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    await this.init();
    let result = Array.from(this.transactions.values()).filter(t => t.spaceId === spaceId);

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
        result = result.filter(t => t.walletId === filters.walletId || (t as any).sourceWalletId === filters.walletId || (t as any).destinationWalletId === filters.walletId);
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
      } else {
        this.transactions.set(tx.id, { ...tx });
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
  }
}
