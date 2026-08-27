/**
 * Daily Finance 3.0 - D4 Database & Sync Layer Tests (D4-001 -> D4-004)
 * Comprehensive verification of offline-first storage, sync engine, conflict resolver, and idempotency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalTransactionRepository } from '../repositories/local/LocalTransactionRepository';
import { SyncEngine, ChangeSet, RemoteSyncAdapter } from '../domain/SyncEngine';
import {
  ConflictResolver,
  ConflictStrategy,
  EntityVersion,
  ManualMergeRequired
} from '../domain/ConflictResolver';
import { Transaction } from '../types';

describe('D4 — Offline-First Database & Sync Layer', () => {

  // ==========================================
  // D4-001: Local Storage Operations
  // ==========================================
  describe('D4-001: Local Storage Operations', () => {
    let repo: LocalTransactionRepository;

    beforeEach(() => {
      repo = new LocalTransactionRepository();
      repo.clear();
    });

    it('should add a transaction and assign defaults (id, version, audit trail)', async () => {
      const created = await repo.addTransaction({
        type: 'expense',
        amount: 50000,
        currency: 'VND',
        category: 'Ăn uống',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      expect(created.id).toBeDefined();
      expect(created.id.startsWith('tx_')).toBe(true);
      expect(created.version).toBe(1);
      expect(created.isDeleted).toBe(false);
      expect(created.status).toBe('draft');
      expect(created.auditTrail).toHaveLength(1);
      expect(created.auditTrail![0].action).toBe('create');
    });

    it('should retrieve a transaction by ID', async () => {
      const tx = await repo.addTransaction({
        type: 'income',
        amount: 20000000,
        currency: 'VND',
        category: 'Lương',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      const retrieved = await repo.getTransactionById(tx.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(tx.id);
      expect(retrieved?.amount).toBe(20000000);
    });

    it('should update an existing transaction and increment version', async () => {
      const tx = await repo.addTransaction({
        type: 'expense',
        amount: 100000,
        currency: 'VND',
        category: 'Mua sắm',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      const updated = await repo.updateTransaction({
        ...tx,
        amount: 120000,
        note: 'Cập nhật giá thực tế'
      });

      expect(updated.amount).toBe(120000);
      expect(updated.version).toBe(2);
      expect(updated.note).toBe('Cập nhật giá thực tế');

      const fetched = await repo.getTransactionById(tx.id);
      expect(fetched?.amount).toBe(120000);
      expect(fetched?.version).toBe(2);
    });

    it('should soft-delete a transaction and update status to soft_deleted', async () => {
      const tx = await repo.addTransaction({
        type: 'expense',
        amount: 45000,
        currency: 'VND',
        category: 'Cafe',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      const deleted = await repo.deleteTransaction(tx.id);
      expect(deleted).toBe(true);

      const fetched = await repo.getTransactionById(tx.id);
      expect(fetched?.isDeleted).toBe(true);
      expect(fetched?.status).toBe('soft_deleted');
      expect(fetched?.deletedAt).toBeDefined();

      // Normal getTransactions should not return soft-deleted items
      const activeTxs = await repo.getTransactions('sp_personal');
      expect(activeTxs.some(t => t.id === tx.id)).toBe(false);
    });

    it('should restore a soft-deleted transaction idempotently', async () => {
      const tx = await repo.addTransaction({
        type: 'expense',
        amount: 90000,
        currency: 'VND',
        category: 'Sách',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      await repo.deleteTransaction(tx.id);
      const restored = await repo.restoreTransaction!(tx.id);
      expect(restored).toBe(true);

      const fetched = await repo.getTransactionById(tx.id);
      expect(fetched?.isDeleted).toBe(false);
      expect(fetched?.status).toBe('confirmed');
      expect(fetched?.deletedAt).toBeNull();

      // Calling restore again should remain successful and idempotent
      const doubleRestore = await repo.restoreTransaction!(tx.id);
      expect(doubleRestore).toBe(true);
    });

    it('should filter transactions by multiple criteria', async () => {
      await repo.addTransaction({
        type: 'expense',
        amount: 200000,
        currency: 'VND',
        category: 'Ăn uống',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        note: 'Bữa tối nhà hàng'
      });

      await repo.addTransaction({
        type: 'expense',
        amount: 500000,
        currency: 'VND',
        category: 'Mua sắm',
        spaceId: 'sp_personal',
        date: '2026-08-05',
        note: 'Quần áo'
      });

      await repo.addTransaction({
        type: 'income',
        amount: 15000000,
        currency: 'VND',
        category: 'Lương',
        spaceId: 'sp_personal',
        date: '2026-08-10',
        note: 'Lương tháng 8'
      });

      // Filter by type
      const expenses = await repo.getTransactionsBySpace('sp_personal', { type: 'expense' });
      expect(expenses).toHaveLength(2);

      // Filter by amount range
      const midAmount = await repo.getTransactionsBySpace('sp_personal', {
        minAmount: 100000,
        maxAmount: 300000
      });
      expect(midAmount).toHaveLength(1);
      expect(midAmount[0].amount).toBe(200000);

      // Filter by search term
      const searchRes = await repo.getTransactionsBySpace('sp_personal', { searchTerm: 'nhà hàng' });
      expect(searchRes).toHaveLength(1);
      expect(searchRes[0].note).toBe('Bữa tối nhà hàng');
    });

    it('should bulk upsert transactions idempotently', async () => {
      const tx1: Transaction = {
        id: 'tx_bulk_1',
        type: 'expense',
        amount: 10000,
        currency: 'VND',
        category: 'Test',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        version: 1
      };

      const tx2: Transaction = {
        id: 'tx_bulk_2',
        type: 'income',
        amount: 50000,
        currency: 'VND',
        category: 'Test',
        spaceId: 'sp_personal',
        date: '2026-08-01',
        version: 1
      };

      await repo.bulkUpsert([tx1, tx2]);
      expect(await repo.getTransactionById('tx_bulk_1')).not.toBeNull();
      expect(await repo.getTransactionById('tx_bulk_2')).not.toBeNull();

      // Upsert updated tx1
      const tx1Updated: Transaction = { ...tx1, amount: 25000, version: 2 };
      await repo.bulkUpsert([tx1Updated]);
      const fetched = await repo.getTransactionById('tx_bulk_1');
      expect(fetched?.amount).toBe(25000);
      expect(fetched?.version).toBe(2);
    });

    it('should find soft-deleted and syncable transactions', async () => {
      const tx = await repo.addTransaction({
        type: 'expense',
        amount: 30000,
        currency: 'VND',
        category: 'Test',
        spaceId: 'sp_personal',
        date: '2026-08-27'
      });

      const syncableBefore = await repo.findSyncableTransactions!();
      expect(syncableBefore.some(t => t.id === tx.id)).toBe(true);

      await repo.deleteTransaction(tx.id);
      const deletedList = await repo.findDeletedTransactions!();
      expect(deletedList.some(t => t.id === tx.id)).toBe(true);
    });
  });

  // ==========================================
  // D4-002: Sync Engine Operations
  // ==========================================
  describe('D4-002: Sync Engine Operations', () => {
    let syncEngine: SyncEngine;

    beforeEach(() => {
      syncEngine = new SyncEngine();
    });

    it('should queue local changes and merge updates for the same entity', () => {
      const change1: ChangeSet = {
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_sync_1',
        data: { amount: 100000, category: 'Ăn uống' },
        timestamp: '2026-08-27T08:00:00Z',
        spaceId: 'sp_personal'
      };

      const change2: ChangeSet = {
        entity: 'transaction',
        operation: 'update',
        entityId: 'tx_sync_1',
        data: { amount: 120000, note: 'Thêm note' },
        timestamp: '2026-08-27T08:05:00Z',
        spaceId: 'sp_personal'
      };

      syncEngine.queueChange(change1);
      expect(syncEngine.getPendingChanges()).toHaveLength(1);

      syncEngine.queueChange(change2);
      const pending = syncEngine.getPendingChanges();
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe('create');
      expect(pending[0].data.amount).toBe(120000);
      expect(pending[0].data.note).toBe('Thêm note');
    });

    it('should push local changes to remote cloud adapter and update queue', async () => {
      const change: ChangeSet = {
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_remote_1',
        data: { amount: 50000 },
        timestamp: new Date().toISOString(),
        spaceId: 'sp_personal'
      };
      syncEngine.queueChange(change);

      const mockAdapter: RemoteSyncAdapter = {
        push: async (changes) => ({
          success: true,
          ackIds: changes.map(c => c.entityId),
          serverToken: 'srv_token_123'
        }),
        pull: async () => ({ changes: [], serverToken: 'srv_token_123' })
      };

      const pushRes = await syncEngine.pushToCloud(undefined, undefined, mockAdapter);
      expect(pushRes.success).toBe(true);
      expect(pushRes.appliedChangesCount).toBe(1);
      expect(syncEngine.getPendingChanges()).toHaveLength(0);
      expect(syncEngine.getLastSyncedAt()).not.toBeNull();
    });

    it('should pull remote changes and return deltas', async () => {
      const mockAdapter: RemoteSyncAdapter = {
        push: async () => ({ success: true }),
        pull: async () => ({
          changes: [
            {
              entity: 'transaction',
              operation: 'create',
              entityId: 'tx_from_server',
              data: { amount: 75000, category: 'Tiền điện' },
              timestamp: '2026-08-27T09:00:00Z',
              spaceId: 'sp_personal'
            }
          ],
          serverToken: 'srv_token_456'
        })
      };

      const pullRes = await syncEngine.pullFromCloud(undefined, mockAdapter);
      expect(pullRes.success).toBe(true);
      expect(pullRes.appliedChangesCount).toBe(1);
      expect(pullRes.remoteChanges).toHaveLength(1);
      expect(pullRes.remoteChanges![0].entityId).toBe('tx_from_server');
    });

    it('should perform full bidirectional sync', async () => {
      syncEngine.queueChange({
        entity: 'wallet',
        operation: 'create',
        entityId: 'wal_local_1',
        data: { name: 'Ví MoMo', balance: 500000 },
        timestamp: '2026-08-27T10:00:00Z',
        spaceId: 'sp_personal'
      });

      const mockAdapter: RemoteSyncAdapter = {
        push: async (changes) => ({
          success: true,
          ackIds: changes.map(c => c.entityId),
          serverToken: 'srv_v2'
        }),
        pull: async () => ({
          changes: [
            {
              entity: 'transaction',
              operation: 'create',
              entityId: 'tx_pulled_1',
              data: { amount: 30000 },
              timestamp: '2026-08-27T10:01:00Z',
              spaceId: 'sp_personal'
            }
          ],
          serverToken: 'srv_v2'
        })
      };

      const syncResult = await syncEngine.sync(undefined, mockAdapter);
      expect(syncResult.success).toBe(true);
      expect(syncResult.appliedChangesCount).toBe(2);
      expect(syncEngine.getPendingChanges()).toHaveLength(0);
    });

    it('should gracefully handle network failure during push without losing changes', async () => {
      syncEngine.queueChange({
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_offline',
        data: { amount: 20000 },
        timestamp: new Date().toISOString(),
        spaceId: 'sp_personal'
      });

      const failingAdapter: RemoteSyncAdapter = {
        push: async () => {
          throw new Error('Network timeout (HTTP 503)');
        },
        pull: async () => ({ changes: [] })
      };

      const res = await syncEngine.pushToCloud(undefined, undefined, failingAdapter);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Network timeout');
      // Queue must retain unsent changes!
      expect(syncEngine.getPendingChanges()).toHaveLength(1);
    });
  });

  // ==========================================
  // D4-003: Conflict Resolution
  // ==========================================
  describe('D4-003: Conflict Resolution', () => {
    const localEntity: EntityVersion = {
      id: 'tx_conflict_1',
      entityType: 'transaction',
      timestamp: '2026-08-27T10:00:00Z',
      version: 2,
      data: { amount: 150000, category: 'Ăn sáng', note: 'Phở bò', tags: ['food'] }
    };

    const remoteEntity: EntityVersion = {
      id: 'tx_conflict_1',
      entityType: 'transaction',
      timestamp: '2026-08-27T10:05:00Z', // 5 minutes newer
      version: 2,
      data: { amount: 160000, category: 'Ăn trưa', merchant: 'Quán ăn', tags: ['dining'] }
    };

    it('should resolve using LAST_WRITE_WINS (remote is newer)', () => {
      const resolved = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        ConflictStrategy.LAST_WRITE_WINS
      );

      expect(resolved.winner).toBe('remote');
      expect(resolved.resolvedBy).toBe(ConflictStrategy.LAST_WRITE_WINS);
      expect(resolved.data.amount).toBe(160000);
      expect(resolved.version).toBe(3);
    });

    it('should resolve using CLIENT_WINS regardless of timestamp', () => {
      const resolved = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        ConflictStrategy.CLIENT_WINS
      );

      expect(resolved.winner).toBe('local');
      expect(resolved.resolvedBy).toBe(ConflictStrategy.CLIENT_WINS);
      expect(resolved.data.amount).toBe(150000);
      expect(resolved.data.category).toBe('Ăn sáng');
    });

    it('should resolve using SERVER_WINS regardless of timestamp', () => {
      const resolved = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        ConflictStrategy.SERVER_WINS
      );

      expect(resolved.winner).toBe('remote');
      expect(resolved.resolvedBy).toBe(ConflictStrategy.SERVER_WINS);
      expect(resolved.data.amount).toBe(160000);
    });

    it('should throw ManualMergeRequired when strategy is MANUAL_MERGE', () => {
      expect(() => {
        ConflictResolver.resolve(localEntity, remoteEntity, ConflictStrategy.MANUAL_MERGE);
      }).toThrow(ManualMergeRequired);
    });

    it('should perform CREATIVE_MERGE by combining non-overlapping fields and arrays', () => {
      const resolved = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        ConflictStrategy.CREATIVE_MERGE
      );

      expect(resolved.winner).toBe('merged');
      expect(resolved.resolvedBy).toBe(ConflictStrategy.CREATIVE_MERGE);
      // Merged data contains note from local and merchant from remote
      expect(resolved.data.note).toBe('Phở bò');
      expect(resolved.data.merchant).toBe('Quán ăn');
      // Tags array combined and deduplicated
      expect(resolved.data.tags).toContain('food');
      expect(resolved.data.tags).toContain('dining');
      expect(resolved.version).toBe(3);
    });

    it('should automatically resolve conflicts in SyncEngine pull', async () => {
      const engine = new SyncEngine();
      engine.queueChange({
        entity: 'transaction',
        operation: 'update',
        entityId: 'tx_conf_sync',
        data: { amount: 100000 },
        timestamp: '2026-08-27T08:00:00Z',
        spaceId: 'sp_personal'
      });

      const mockAdapter: RemoteSyncAdapter = {
        push: async () => ({ success: true }),
        pull: async () => ({
          changes: [
            {
              entity: 'transaction',
              operation: 'update',
              entityId: 'tx_conf_sync',
              data: { amount: 120000 },
              timestamp: '2026-08-27T08:10:00Z', // newer
              spaceId: 'sp_personal'
            }
          ]
        })
      };

      const res = await engine.pullFromCloud(undefined, mockAdapter, ConflictStrategy.LAST_WRITE_WINS);
      expect(res.success).toBe(true);
      expect(res.conflicts).toHaveLength(1);
      expect(res.remoteChanges![0].data.amount).toBe(120000);
    });
  });

  // ==========================================
  // D4-004: Idempotency & Resiliency
  // ==========================================
  describe('D4-004: Idempotency & Resiliency', () => {
    it('should prevent identical change-set from being queued multiple times', () => {
      const engine = new SyncEngine();
      const change: ChangeSet = {
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_idem_1',
        data: { amount: 50000 },
        timestamp: '2026-08-27T12:00:00.000Z',
        spaceId: 'sp_personal'
      };

      engine.queueChange(change);
      engine.queueChange(change);
      engine.queueChange(change);

      expect(engine.getPendingChanges()).toHaveLength(1);
    });

    it('should handle repeated push retries without state corruption', async () => {
      const engine = new SyncEngine();
      engine.queueChange({
        entity: 'wallet',
        operation: 'create',
        entityId: 'wal_retry_1',
        data: { name: 'Ví Tiền Mặt' },
        timestamp: '2026-08-27T12:00:00Z',
        spaceId: 'sp_personal'
      });

      let callCount = 0;
      const idempotentAdapter: RemoteSyncAdapter = {
        push: async (changes) => {
          callCount++;
          return { success: true, ackIds: changes.map(c => c.entityId) };
        },
        pull: async () => ({ changes: [] })
      };

      await engine.pushToCloud(undefined, undefined, idempotentAdapter);
      expect(callCount).toBe(1);
      expect(engine.getPendingChanges()).toHaveLength(0);

      // Re-pushing with empty queue should be safe and no-op
      const secondPush = await engine.pushToCloud(undefined, undefined, idempotentAdapter);
      expect(secondPush.success).toBe(true);
      expect(secondPush.appliedChangesCount).toBe(0);
    });
  });
});
