/**
 * Daily Finance 3.0 - ConflictResolver (D4-004)
 * Deterministic multi-strategy conflict resolution engine for offline-first delta synchronization.
 */

export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  MANUAL_MERGE = 'manual_merge',
  CREATIVE_MERGE = 'creative_merge' // CRDT-inspired field-level merge
}

export interface EntityVersion {
  id: string;
  entityType?: string;
  timestamp: string;
  version?: number;
  vectorClock?: number[] | Record<string, number>;
  data: Record<string, any>;
  updatedAt?: string;
}

export interface ResolvedEntity {
  id: string;
  data: Record<string, any>;
  resolvedBy: ConflictStrategy;
  winner: 'local' | 'remote' | 'merged';
  timestamp: string;
  version: number;
}

export class ManualMergeRequired extends Error {
  public readonly local: EntityVersion;
  public readonly remote: EntityVersion;

  constructor(local: EntityVersion, remote: EntityVersion) {
    super(`Manual merge required for entity ${local.id}`);
    this.name = 'ManualMergeRequired';
    this.local = local;
    this.remote = remote;
    Object.setPrototypeOf(this, ManualMergeRequired.prototype);
  }
}

export class CreativeMerge {
  /**
   * Performs a deterministic, CRDT-inspired field-level merge between local and remote entity versions.
   */
  static merge(local: EntityVersion, remote: EntityVersion): ResolvedEntity {
    const localData = local.data || {};
    const remoteData = remote.data || {};
    const localTime = new Date(local.updatedAt || local.timestamp || 0).getTime();
    const remoteTime = new Date(remote.updatedAt || remote.timestamp || 0).getTime();
    const mergedData: Record<string, any> = { ...remoteData, ...localData };

    // For overlapping fields, resolve individually:
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);
    for (const key of allKeys) {
      const lVal = localData[key];
      const rVal = remoteData[key];

      if (lVal === undefined && rVal !== undefined) {
        mergedData[key] = rVal;
      } else if (lVal !== undefined && rVal === undefined) {
        mergedData[key] = lVal;
      } else if (Array.isArray(lVal) && Array.isArray(rVal)) {
        // Merge arrays (such as auditTrail, tags, splits) deduplicating by JSON representation or id
        const combined = [...rVal];
        for (const item of lVal) {
          const itemKey = item && typeof item === 'object' && item.id ? item.id : JSON.stringify(item);
          const alreadyExists = combined.some(c => 
            (c && typeof c === 'object' && c.id && c.id === itemKey) ||
            JSON.stringify(c) === itemKey
          );
          if (!alreadyExists) {
            combined.push(item);
          }
        }
        mergedData[key] = combined;
      } else if (lVal !== undefined && rVal !== undefined) {
        // If primitive or object value conflict, prefer the one with the latest timestamp
        mergedData[key] = localTime >= remoteTime ? lVal : rVal;
      }
    }

    const mergedVersion = Math.max(local.version || 1, remote.version || 1) + 1;
    const resolvedTimestamp = new Date(Math.max(localTime, remoteTime, Date.now())).toISOString();

    // Ensure ID is preserved
    mergedData.id = local.id || remote.id;
    mergedData.version = mergedVersion;
    mergedData.updatedAt = resolvedTimestamp;

    return {
      id: mergedData.id,
      data: mergedData,
      resolvedBy: ConflictStrategy.CREATIVE_MERGE,
      winner: 'merged',
      timestamp: resolvedTimestamp,
      version: mergedVersion
    };
  }
}

export class ConflictResolver {
  /**
   * Resolves a conflict between a local and remote entity version according to the specified strategy.
   */
  static resolve(
    local: EntityVersion,
    remote: EntityVersion,
    strategy: ConflictStrategy = ConflictStrategy.LAST_WRITE_WINS
  ): ResolvedEntity {
    if (!local || !remote) {
      throw new Error('Both local and remote EntityVersions are required for conflict resolution');
    }

    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS: {
        const localTime = new Date(local.updatedAt || local.timestamp || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.timestamp || 0).getTime();
        const winner = localTime >= remoteTime ? 'local' : 'remote';
        const winningEntity = winner === 'local' ? local : remote;
        const nextVersion = Math.max(local.version || 1, remote.version || 1) + 1;

        return {
          id: winningEntity.id,
          data: { ...winningEntity.data, version: nextVersion, updatedAt: winningEntity.updatedAt || winningEntity.timestamp },
          resolvedBy: ConflictStrategy.LAST_WRITE_WINS,
          winner,
          timestamp: winningEntity.updatedAt || winningEntity.timestamp,
          version: nextVersion
        };
      }

      case ConflictStrategy.CLIENT_WINS: {
        const nextVersion = Math.max(local.version || 1, remote.version || 1) + 1;
        return {
          id: local.id,
          data: { ...local.data, version: nextVersion, updatedAt: local.updatedAt || local.timestamp },
          resolvedBy: ConflictStrategy.CLIENT_WINS,
          winner: 'local',
          timestamp: local.updatedAt || local.timestamp,
          version: nextVersion
        };
      }

      case ConflictStrategy.SERVER_WINS: {
        const nextVersion = Math.max(local.version || 1, remote.version || 1) + 1;
        return {
          id: remote.id,
          data: { ...remote.data, version: nextVersion, updatedAt: remote.updatedAt || remote.timestamp },
          resolvedBy: ConflictStrategy.SERVER_WINS,
          winner: 'remote',
          timestamp: remote.updatedAt || remote.timestamp,
          version: nextVersion
        };
      }

      case ConflictStrategy.MANUAL_MERGE: {
        throw new ManualMergeRequired(local, remote);
      }

      case ConflictStrategy.CREATIVE_MERGE: {
        return CreativeMerge.merge(local, remote);
      }

      default:
        return ConflictResolver.resolve(local, remote, ConflictStrategy.LAST_WRITE_WINS);
    }
  }
}
