/**
 * Daily Finance 3.0 - SyncEngine (D4-003)
 * Offline-first Delta-Sync Orchestration Engine.
 * Manages local mutation change-sets, push/pull delta replication, vector clock ordering, and conflict resolution.
 */

import { ConflictResolver, ConflictStrategy, EntityVersion, ManualMergeRequired } from './ConflictResolver';

export interface ChangeSet {
  entity: 'transaction' | 'wallet' | 'space' | 'budget' | 'saving' | 'category';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data: any;
  timestamp: string;
  vectorClock?: number[] | Record<string, number>;
  spaceId?: string;
  version?: number;
}

export interface Conflict {
  entityId: string;
  entityType: string;
  localChange: ChangeSet;
  remoteChange: ChangeSet;
  resolvedData?: any;
  strategyApplied?: ConflictStrategy;
}

export interface SyncResult {
  success: boolean;
  appliedChangesCount?: number;
  conflicts?: Conflict[];
  lastSyncedAt?: string;
  serverToken?: string;
  error?: string;
}

export interface ResolvedChangeSet {
  resolvedChanges: ChangeSet[];
  conflicts: Conflict[];
}

export interface RemoteSyncAdapter {
  push(
    changes: ChangeSet[],
    serverToken?: string
  ): Promise<{ success: boolean; ackIds?: string[]; serverToken?: string; error?: string }>;
  pull(
    serverToken?: string
  ): Promise<{ changes: ChangeSet[]; serverToken?: string; error?: string }>;
}

export class SyncEngine {
  private pendingChanges: ChangeSet[] = [];
  private lastSyncedAt: string | null = null;
  private serverToken: string | null = null;
  private processedOperationIds: Set<string> = new Set();

  constructor(initialPending: ChangeSet[] = []) {
    this.pendingChanges = [...initialPending];
  }

  /**
   * Enqueues a local mutation change into the pending sync queue.
   * Merges with existing pending changes for the same entity if present (idempotent local queuing).
   */
  public queueChange(change: ChangeSet): void {
    if (!change || !change.entityId) {
      throw new Error('[SyncEngine] ChangeSet must have a valid entityId');
    }

    const opKey = `${change.entity}:${change.entityId}:${change.timestamp}:${change.operation}`;
    if (this.processedOperationIds.has(opKey)) {
      return; // Already processed idempotently
    }

    const existingIdx = this.pendingChanges.findIndex(
      c => c.entity === change.entity && c.entityId === change.entityId
    );

    if (existingIdx !== -1) {
      const existing = this.pendingChanges[existingIdx];
      // If previous was create and now update, keep as create with merged data
      if (existing.operation === 'create' && change.operation === 'update') {
        this.pendingChanges[existingIdx] = {
          ...change,
          operation: 'create',
          data: { ...existing.data, ...change.data },
          timestamp: change.timestamp
        };
      } else if (existing.operation === 'create' && change.operation === 'delete') {
        // If created locally then deleted before sync, remove from pending completely
        this.pendingChanges.splice(existingIdx, 1);
      } else {
        this.pendingChanges[existingIdx] = { ...change };
      }
    } else {
      this.pendingChanges.push({ ...change });
    }

    this.processedOperationIds.add(opKey);
  }

  /**
   * Retrieves pending un-synced local changes.
   */
  public getPendingChanges(): ChangeSet[] {
    return [...this.pendingChanges];
  }

  /**
   * Clears pending changes.
   */
  public clearPendingChanges(): void {
    this.pendingChanges = [];
  }

  /**
   * Returns the last sync timestamp.
   */
  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  /**
   * Pushes local changes to the remote cloud storage adapter.
   */
  public async pushToCloud(
    changes?: ChangeSet[],
    serverToken?: string,
    remoteAdapter?: RemoteSyncAdapter
  ): Promise<SyncResult> {
    const toPush = changes || this.pendingChanges;
    const token = serverToken || this.serverToken || undefined;

    if (!remoteAdapter) {
      // Offline fallback: changes stay queued, marks as unpushed but safe
      return {
        success: true,
        appliedChangesCount: 0,
        conflicts: [],
        lastSyncedAt: this.lastSyncedAt || undefined,
        serverToken: token
      };
    }

    try {
      const res = await remoteAdapter.push(toPush, token);
      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Push to cloud failed',
          conflicts: [],
          appliedChangesCount: 0
        };
      }

      if (res.serverToken) {
        this.serverToken = res.serverToken;
      }

      // Remove successfully acknowledged items from pending queue
      if (res.ackIds && res.ackIds.length > 0) {
        const ackSet = new Set(res.ackIds);
        this.pendingChanges = this.pendingChanges.filter(c => !ackSet.has(c.entityId));
      } else if (!changes) {
        this.pendingChanges = [];
      }

      this.lastSyncedAt = new Date().toISOString();

      return {
        success: true,
        appliedChangesCount: toPush.length,
        conflicts: [],
        lastSyncedAt: this.lastSyncedAt,
        serverToken: this.serverToken || undefined
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error during pushToCloud',
        conflicts: [],
        appliedChangesCount: 0
      };
    }
  }

  /**
   * Pulls remote changes from the cloud and checks for local conflicts.
   */
  public async pullFromCloud(
    serverToken?: string,
    remoteAdapter?: RemoteSyncAdapter,
    strategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS
  ): Promise<SyncResult & { remoteChanges?: ChangeSet[] }> {
    const token = serverToken || this.serverToken || undefined;

    if (!remoteAdapter) {
      return {
        success: true,
        appliedChangesCount: 0,
        conflicts: [],
        lastSyncedAt: this.lastSyncedAt || undefined,
        remoteChanges: []
      };
    }

    try {
      const pullRes = await remoteAdapter.pull(token);
      if (pullRes.error) {
        return {
          success: false,
          error: pullRes.error,
          conflicts: [],
          appliedChangesCount: 0,
          remoteChanges: []
        };
      }

      if (pullRes.serverToken) {
        this.serverToken = pullRes.serverToken;
      }

      const remoteChanges = pullRes.changes || [];
      const { resolvedChanges, conflicts } = await this.resolveConflicts(
        this.pendingChanges,
        remoteChanges,
        strategy
      );

      this.lastSyncedAt = new Date().toISOString();

      return {
        success: true,
        appliedChangesCount: resolvedChanges.length,
        conflicts,
        lastSyncedAt: this.lastSyncedAt,
        serverToken: this.serverToken || undefined,
        remoteChanges: resolvedChanges
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error during pullFromCloud',
        conflicts: [],
        appliedChangesCount: 0,
        remoteChanges: []
      };
    }
  }

  /**
   * Resolves conflicts between local and remote change-sets using the specified ConflictStrategy.
   */
  public async resolveConflicts(
    localChanges: ChangeSet[],
    remoteChanges: ChangeSet[],
    strategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS
  ): Promise<ResolvedChangeSet> {
    const conflicts: Conflict[] = [];
    const resolvedChanges: ChangeSet[] = [];

    const localMap = new Map<string, ChangeSet>();
    for (const lc of localChanges) {
      localMap.set(`${lc.entity}:${lc.entityId}`, lc);
    }

    for (const rc of remoteChanges) {
      const key = `${rc.entity}:${rc.entityId}`;
      const matchingLocal = localMap.get(key);

      if (matchingLocal) {
        // Conflict detected!
        const localVersion: EntityVersion = {
          id: matchingLocal.entityId,
          entityType: matchingLocal.entity,
          timestamp: matchingLocal.timestamp,
          version: matchingLocal.version,
          vectorClock: matchingLocal.vectorClock,
          data: matchingLocal.data || {},
          updatedAt: matchingLocal.timestamp
        };

        const remoteVersion: EntityVersion = {
          id: rc.entityId,
          entityType: rc.entity,
          timestamp: rc.timestamp,
          version: rc.version,
          vectorClock: rc.vectorClock,
          data: rc.data || {},
          updatedAt: rc.timestamp
        };

        try {
          const resolved = ConflictResolver.resolve(localVersion, remoteVersion, strategy);
          const conflict: Conflict = {
            entityId: rc.entityId,
            entityType: rc.entity,
            localChange: matchingLocal,
            remoteChange: rc,
            resolvedData: resolved.data,
            strategyApplied: strategy
          };
          conflicts.push(conflict);

          resolvedChanges.push({
            entity: rc.entity,
            operation: resolved.winner === 'local' ? matchingLocal.operation : rc.operation,
            entityId: rc.entityId,
            data: resolved.data,
            timestamp: resolved.timestamp,
            version: resolved.version,
            spaceId: matchingLocal.spaceId || rc.spaceId
          });
        } catch (err) {
          if (err instanceof ManualMergeRequired) {
            conflicts.push({
              entityId: rc.entityId,
              entityType: rc.entity,
              localChange: matchingLocal,
              remoteChange: rc,
              strategyApplied: ConflictStrategy.MANUAL_MERGE
            });
            throw err;
          }
          throw err;
        }
      } else {
        // Non-conflicting remote change
        resolvedChanges.push({ ...rc });
      }
    }

    return { resolvedChanges, conflicts };
  }

  /**
   * Executes a full bidirectional sync flow: push un-synced local changes, then pull and resolve remote deltas.
   */
  public async sync(
    serverToken?: string,
    remoteAdapter?: RemoteSyncAdapter,
    strategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS
  ): Promise<SyncResult> {
    const pushResult = await this.pushToCloud(this.pendingChanges, serverToken, remoteAdapter);
    if (!pushResult.success && pushResult.error) {
      return pushResult;
    }

    const pullResult = await this.pullFromCloud(pushResult.serverToken || serverToken, remoteAdapter, strategy);
    return {
      success: pullResult.success,
      appliedChangesCount: (pushResult.appliedChangesCount || 0) + (pullResult.appliedChangesCount || 0),
      conflicts: pullResult.conflicts || [],
      lastSyncedAt: pullResult.lastSyncedAt || pushResult.lastSyncedAt || new Date().toISOString(),
      serverToken: pullResult.serverToken || pushResult.serverToken,
      error: pullResult.error
    };
  }
}
