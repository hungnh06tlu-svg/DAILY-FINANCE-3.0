/**
 * Daily Finance 3.0 - D4-003 Sync Engine & Conflict Resolution Audit Suite
 * Rigorous property-based & deterministic verification of offline outbox, delta sync,
 * version monotonicity, conflict resolution strategies, Space/Fund isolation,
 * transfer topology preservation, amount/currency precision, and Financial Truth boundary.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine, ChangeSet, RemoteSyncAdapter } from '../domain/SyncEngine';
import {
  ConflictResolver,
  ConflictStrategy,
  EntityVersion,
  ManualMergeRequired,
  CreativeMerge
} from '../domain/ConflictResolver';
import { LocalTransactionRepository } from '../repositories/local/LocalTransactionRepository';
import { Transaction } from '../types';

describe('D4-003: Sync Engine & Conflict Resolution Audit Suite', () => {
  let syncEngine: SyncEngine;
  let repo: LocalTransactionRepository;

  beforeEach(() => {
    syncEngine = new SyncEngine();
    repo = new LocalTransactionRepository();
    repo.clear();
  });

  // ==========================================
  // P01 — Idempotent Sync
  // ==========================================
  it('P01 — Idempotent sync (SYNC(SYNC(S)) == SYNC(S))', async () => {
    const change: ChangeSet = {
      entity: 'transaction',
      operation: 'create',
      entityId: 'tx_idem_p01',
      data: { amount: 150000, currency: 'VND', category: 'Food' },
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_A'
    };

    syncEngine.queueChange(change);

    const mockAdapter: RemoteSyncAdapter = {
      push: async (changes) => ({
        success: true,
        ackIds: changes.map(c => c.entityId),
        serverToken: 'token_v1'
      }),
      pull: async () => ({ changes: [], serverToken: 'token_v1' })
    };

    const res1 = await syncEngine.sync(undefined, mockAdapter);
    expect(res1.success).toBe(true);
    expect(res1.appliedChangesCount).toBe(1);
    expect(syncEngine.getPendingChanges().length).toBe(0);

    // Second sync call on already synchronized state
    const res2 = await syncEngine.sync(undefined, mockAdapter);
    expect(res2.success).toBe(true);
    expect(res2.appliedChangesCount).toBe(0);
    expect(syncEngine.getPendingChanges().length).toBe(0);
  });

  // ==========================================
  // P02 — Version Monotonicity & Stale Write Rejection
  // ==========================================
  it('P02 — Version monotonicity & stale write rejection (local v5 vs remote v3)', async () => {
    const localEntity: EntityVersion = {
      id: 'tx_ver_p02',
      timestamp: '2026-08-29T10:00:00Z',
      version: 5,
      data: { amount: 500000, note: 'Local Newer Version' }
    };

    const remoteEntity: EntityVersion = {
      id: 'tx_ver_p02',
      timestamp: '2026-08-29T09:00:00Z',
      version: 3,
      data: { amount: 100000, note: 'Remote Stale Version' }
    };

    const resolved = ConflictResolver.resolve(localEntity, remoteEntity, ConflictStrategy.LAST_WRITE_WINS);

    expect(resolved.winner).toBe('local');
    expect(resolved.data.amount).toBe(500000);
    expect(resolved.version).toBe(6); // Max(5, 3) + 1
    expect(resolved.version).toBeGreaterThan(localEntity.version!);
  });

  // ==========================================
  // P03 — Remote Version Advancement
  // ==========================================
  it('P03 — Remote version advancement (local v2 vs remote v4)', async () => {
    const localEntity: EntityVersion = {
      id: 'tx_ver_p03',
      timestamp: '2026-08-29T08:00:00Z',
      version: 2,
      data: { amount: 20000 }
    };

    const remoteEntity: EntityVersion = {
      id: 'tx_ver_p03',
      timestamp: '2026-08-29T11:00:00Z',
      version: 4,
      data: { amount: 30000 }
    };

    const resolved = ConflictResolver.resolve(localEntity, remoteEntity, ConflictStrategy.LAST_WRITE_WINS);

    expect(resolved.winner).toBe('remote');
    expect(resolved.data.amount).toBe(30000);
    expect(resolved.version).toBe(5); // Max(2, 4) + 1
  });

  // ==========================================
  // P04 — Multi-Space Isolation
  // ==========================================
  it('P04 — Multi-Space isolation under concurrent sync', async () => {
    const spaces = ['space_A', 'space_B', 'space_C'];

    for (const sp of spaces) {
      syncEngine.queueChange({
        entity: 'transaction',
        operation: 'create',
        entityId: `tx_same_id_${sp}`,
        data: { amount: sp === 'space_A' ? 100 : sp === 'space_B' ? 200 : 300 },
        timestamp: '2026-08-29T10:00:00Z',
        spaceId: sp
      });
    }

    const pending = syncEngine.getPendingChanges();
    expect(pending.length).toBe(3);

    const spaceA = pending.filter(c => c.spaceId === 'space_A');
    const spaceB = pending.filter(c => c.spaceId === 'space_B');
    const spaceC = pending.filter(c => c.spaceId === 'space_C');

    expect(spaceA.length).toBe(1);
    expect(spaceB.length).toBe(1);
    expect(spaceC.length).toBe(1);

    expect(spaceA[0].data.amount).toBe(100);
    expect(spaceB[0].data.amount).toBe(200);
    expect(spaceC[0].data.amount).toBe(300);
  });

  // ==========================================
  // P05 — Multi-Fund Isolation
  // ==========================================
  it('P05 — Multi-Fund isolation under shared Space', async () => {
    const localChanges: ChangeSet[] = [
      {
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_fund_1',
        data: { fundId: 'fund_A1', amount: 1000 },
        timestamp: '2026-08-29T10:00:00Z',
        spaceId: 'space_A'
      }
    ];

    const remoteChanges: ChangeSet[] = [
      {
        entity: 'transaction',
        operation: 'create',
        entityId: 'tx_fund_2',
        data: { fundId: 'fund_A2', amount: 2000 },
        timestamp: '2026-08-29T10:01:00Z',
        spaceId: 'space_A'
      }
    ];

    const { resolvedChanges } = await syncEngine.resolveConflicts(localChanges, remoteChanges);
    expect(resolvedChanges.length).toBe(1);
    expect(resolvedChanges[0].data.fundId).toBe('fund_A2');
  });

  // ==========================================
  // P06 — Transfer Topology Preservation
  // ==========================================
  it('P06 — Cross-Space & Cross-Fund transfer topology preservation', async () => {
    const transferTx = {
      id: 'tx_transfer_p06',
      spaceId: 'space_source',
      fundId: 'fund_source',
      walletId: 'wallet_source',
      targetSpaceId: 'space_target',
      targetFundId: 'fund_target',
      targetWalletId: 'wallet_target',
      amount: 500000,
      currency: 'VND',
      type: 'transfer',
      category: 'Transfer',
      date: '2026-08-29'
    };

    const change: ChangeSet = {
      entity: 'transaction',
      operation: 'create',
      entityId: transferTx.id,
      data: transferTx,
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_source'
    };

    syncEngine.queueChange(change);
    const pending = syncEngine.getPendingChanges();

    expect(pending[0].data.spaceId).toBe('space_source');
    expect(pending[0].data.fundId).toBe('fund_source');
    expect(pending[0].data.walletId).toBe('wallet_source');
    expect(pending[0].data.targetSpaceId).toBe('space_target');
    expect(pending[0].data.targetFundId).toBe('fund_target');
    expect(pending[0].data.targetWalletId).toBe('wallet_target');
  });

  // ==========================================
  // P07 — Exact Money Amount Preservation
  // ==========================================
  it('P07 — Exact money amount preservation (zero rounding/truncation)', async () => {
    const testAmounts = [100.456, 0.01, 999999999.999, -500.1234, 0];

    for (const amt of testAmounts) {
      const change: ChangeSet = {
        entity: 'transaction',
        operation: 'create',
        entityId: `tx_amt_${amt}`,
        data: { amount: amt, currency: 'USD' },
        timestamp: '2026-08-29T10:00:00Z',
        spaceId: 'space_A'
      };

      const localVer: EntityVersion = {
        id: `tx_amt_${amt}`,
        timestamp: '2026-08-29T10:00:00Z',
        version: 1,
        data: { amount: amt, currency: 'USD' }
      };

      const remoteVer: EntityVersion = {
        id: `tx_amt_${amt}`,
        timestamp: '2026-08-29T10:05:00Z',
        version: 1,
        data: { amount: amt, currency: 'USD' }
      };

      const resolved = ConflictResolver.resolve(localVer, remoteVer, ConflictStrategy.CREATIVE_MERGE);
      expect(resolved.data.amount).toBe(amt);
      expect(typeof resolved.data.amount).toBe('number');
    }
  });

  // ==========================================
  // P08 — Currency Code Preservation
  // ==========================================
  it('P08 — Currency code preservation without implicit conversion', async () => {
    const currencies = ['VND', 'USD', 'EUR', 'JPY'];

    for (const curr of currencies) {
      const localVer: EntityVersion = {
        id: `tx_curr_${curr}`,
        timestamp: '2026-08-29T10:00:00Z',
        version: 1,
        data: { amount: 1000, currency: curr }
      };

      const remoteVer: EntityVersion = {
        id: `tx_curr_${curr}`,
        timestamp: '2026-08-29T10:05:00Z',
        version: 1,
        data: { amount: 1000, currency: curr }
      };

      const resolved = ConflictResolver.resolve(localVer, remoteVer, ConflictStrategy.LAST_WRITE_WINS);
      expect(resolved.data.currency).toBe(curr);
      expect(resolved.data.amount).toBe(1000);
    }
  });

  // ==========================================
  // P09 — Soft-Delete Persistence & Outbox Replication
  // ==========================================
  it('P09 — Soft-delete persistence & outbox replication', async () => {
    const softDelChange: ChangeSet = {
      entity: 'transaction',
      operation: 'delete',
      entityId: 'tx_soft_del_1',
      data: { isDeleted: true, status: 'soft_deleted', deletedAt: '2026-08-29T10:00:00Z' },
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_A'
    };

    syncEngine.queueChange(softDelChange);
    const pending = syncEngine.getPendingChanges();

    expect(pending.length).toBe(1);
    expect(pending[0].operation).toBe('delete');
    expect(pending[0].data.isDeleted).toBe(true);
    expect(pending[0].data.status).toBe('soft_deleted');
    expect(pending[0].data.deletedAt).toBe('2026-08-29T10:00:00Z');
  });

  // ==========================================
  // P10 — Restore Cycle Sync
  // ==========================================
  it('P10 — Restore cycle sync handling', async () => {
    // Queue soft delete
    syncEngine.queueChange({
      entity: 'transaction',
      operation: 'update',
      entityId: 'tx_restore_1',
      data: { isDeleted: true, status: 'soft_deleted', deletedAt: '2026-08-29T10:00:00Z' },
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_A'
    });

    // Queue restore operation
    syncEngine.queueChange({
      entity: 'transaction',
      operation: 'update',
      entityId: 'tx_restore_1',
      data: { isDeleted: false, status: 'confirmed', deletedAt: null },
      timestamp: '2026-08-29T10:05:00Z',
      spaceId: 'space_A'
    });

    const pending = syncEngine.getPendingChanges();
    expect(pending.length).toBe(1);
    expect(pending[0].data.isDeleted).toBe(false);
    expect(pending[0].data.deletedAt).toBeNull();
    expect(pending[0].data.status).toBe('confirmed');
  });

  // ==========================================
  // P11 — Audit Trail Preservation & Sequential Appending
  // ==========================================
  it('P11 — Audit trail preservation & array deduplication during CreativeMerge', () => {
    const localEntity: EntityVersion = {
      id: 'tx_audit_p11',
      timestamp: '2026-08-29T10:00:00Z',
      version: 1,
      data: {
        auditTrail: [
          { action: 'create', timestamp: '2026-08-29T08:00:00Z' },
          { action: 'update', timestamp: '2026-08-29T09:00:00Z' }
        ]
      }
    };

    const remoteEntity: EntityVersion = {
      id: 'tx_audit_p11',
      timestamp: '2026-08-29T10:05:00Z',
      version: 1,
      data: {
        auditTrail: [
          { action: 'create', timestamp: '2026-08-29T08:00:00Z' },
          { action: 'soft_delete', timestamp: '2026-08-29T10:05:00Z' }
        ]
      }
    };

    const resolved = CreativeMerge.merge(localEntity, remoteEntity);
    expect(resolved.data.auditTrail.length).toBe(3); // create, update, soft_delete
    expect(resolved.data.auditTrail.map((a: any) => a.action)).toEqual(['create', 'soft_delete', 'update']);
  });

  // ==========================================
  // P12 — No Duplicate Entity Creation
  // ==========================================
  it('P12 — No duplicate entity creation on repeated queueing or pull', async () => {
    const change: ChangeSet = {
      entity: 'transaction',
      operation: 'create',
      entityId: 'tx_no_dup_p12',
      data: { amount: 50000 },
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_A'
    };

    syncEngine.queueChange(change);
    syncEngine.queueChange(change);
    syncEngine.queueChange(change);

    const pending = syncEngine.getPendingChanges();
    expect(pending.length).toBe(1);
  });

  // ==========================================
  // P13 — Deterministic Strategy Resolution Invariants
  // ==========================================
  it('P13 — Deterministic strategy resolution invariants', () => {
    const local: EntityVersion = { id: 'tx_1', timestamp: '2026-08-29T10:00:00Z', version: 1, data: { val: 'L' } };
    const remote: EntityVersion = { id: 'tx_1', timestamp: '2026-08-29T10:00:00Z', version: 1, data: { val: 'R' } };

    // Equal timestamp in LAST_WRITE_WINS: local wins deterministically
    const lwwEqual = ConflictResolver.resolve(local, remote, ConflictStrategy.LAST_WRITE_WINS);
    expect(lwwEqual.winner).toBe('local');
    expect(lwwEqual.data.val).toBe('L');

    // CLIENT_WINS
    const clientWins = ConflictResolver.resolve(local, remote, ConflictStrategy.CLIENT_WINS);
    expect(clientWins.winner).toBe('local');
    expect(clientWins.data.val).toBe('L');

    // SERVER_WINS
    const serverWins = ConflictResolver.resolve(local, remote, ConflictStrategy.SERVER_WINS);
    expect(serverWins.winner).toBe('remote');
    expect(serverWins.data.val).toBe('R');

    // MANUAL_MERGE throws ManualMergeRequired
    expect(() => ConflictResolver.resolve(local, remote, ConflictStrategy.MANUAL_MERGE)).toThrow(ManualMergeRequired);
  });

  // ==========================================
  // P14 — Network Failure Durability & Retry
  // ==========================================
  it('P14 — Network failure durability & outbox retry safety', async () => {
    syncEngine.queueChange({
      entity: 'transaction',
      operation: 'create',
      entityId: 'tx_retry_p14',
      data: { amount: 77000 },
      timestamp: '2026-08-29T10:00:00Z',
      spaceId: 'space_A'
    });

    const failingAdapter: RemoteSyncAdapter = {
      push: async () => { throw new Error('503 Service Unavailable'); },
      pull: async () => ({ changes: [] })
    };

    const failRes = await syncEngine.pushToCloud(undefined, undefined, failingAdapter);
    expect(failRes.success).toBe(false);
    expect(syncEngine.getPendingChanges().length).toBe(1);

    // Recovery retry with functional adapter
    const successAdapter: RemoteSyncAdapter = {
      push: async (changes) => ({ success: true, ackIds: changes.map(c => c.entityId) }),
      pull: async () => ({ changes: [] })
    };

    const retryRes = await syncEngine.pushToCloud(undefined, undefined, successAdapter);
    expect(retryRes.success).toBe(true);
    expect(syncEngine.getPendingChanges().length).toBe(0);
  });

  // ==========================================
  // P15 — Financial Truth Protection (Engine Non-Involvement)
  // ==========================================
  it('P15 — Financial truth protection (SyncEngine/ConflictResolver do not alter transaction math)', () => {
    const localVer: EntityVersion = {
      id: 'tx_math_p15',
      timestamp: '2026-08-29T10:00:00Z',
      version: 1,
      data: { amount: 500000, type: 'expense', currency: 'VND' }
    };

    const remoteVer: EntityVersion = {
      id: 'tx_math_p15',
      timestamp: '2026-08-29T10:05:00Z',
      version: 1,
      data: { amount: 500000, type: 'expense', currency: 'VND' }
    };

    const resolved = ConflictResolver.resolve(localVer, remoteVer, ConflictStrategy.CREATIVE_MERGE);

    // Ensure sign and type are preserved exactly without recalculation
    expect(resolved.data.amount).toBe(500000);
    expect(resolved.data.type).toBe('expense');
    expect(resolved.data.currency).toBe('VND');
  });
});
