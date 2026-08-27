/**
 * Daily Finance 3.0 - SyncOutboxQueue (S5-012)
 * Offline-first mutation outbox queue.
 * Guarantees local database mutations succeed immediately while queuing pending updates for cloud synchronization.
 */

import { CloudSyncProvider } from './BackupAndSyncEngine';

export type OutboxItemStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OutboxItem {
  id: string;
  spaceId: string;
  entityId: string;
  entityType: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  status: OutboxItemStatus;
}

export class SyncOutboxQueue {
  private static STORAGE_KEY = 'df3_sync_outbox_v1';
  public static MAX_RETRIES = 5;

  private items: OutboxItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(SyncOutboxQueue.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed.filter(i => i && typeof i.id === 'string' && typeof i.spaceId === 'string');
        }
      }
    } catch (e) {
      console.error('[SyncOutboxQueue] Error loading outbox queue from storage:', e);
      this.items = [];
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SyncOutboxQueue.STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('[SyncOutboxQueue] Error saving outbox queue to storage:', e);
    }
  }

  public enqueue(
    spaceId: string,
    entityId: string,
    entityType: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: Record<string, unknown>
  ): OutboxItem {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[SyncOutboxQueue] Valid spaceId required to enqueue item');
    }
    const item: OutboxItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spaceId,
      entityId,
      entityType,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING'
    };
    this.items.push(item);
    this.saveToStorage();
    return item;
  }

  public getItems(spaceId?: string): OutboxItem[] {
    if (spaceId) {
      return this.items.filter(i => i.spaceId === spaceId);
    }
    return [...this.items];
  }

  public updateItemStatus(id: string, status: OutboxItemStatus, error?: string): void {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx].status = status;
      if (error) {
        this.items[idx].lastError = error;
      }
      if (status === 'FAILED') {
        this.items[idx].retryCount += 1;
      }
      this.saveToStorage();
    }
  }

  public removeSynced(): void {
    this.items = this.items.filter(i => i.status !== 'SYNCED');
    this.saveToStorage();
  }

  public clear(spaceId?: string): void {
    if (spaceId) {
      this.items = this.items.filter(i => i.spaceId !== spaceId);
    } else {
      this.items = [];
    }
    this.saveToStorage();
  }

  public async flush(
    spaceId: string,
    provider: CloudSyncProvider
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (!provider || !provider.isAvailable()) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const pending = this.items.filter(
      i => i.spaceId === spaceId && (i.status === 'PENDING' || i.status === 'FAILED') && i.retryCount < SyncOutboxQueue.MAX_RETRIES
    );

    let succeeded = 0;
    let failed = 0;

    for (const item of pending) {
      this.updateItemStatus(item.id, 'SYNCING');
      try {
        const payloadEntity = {
          id: item.entityId,
          spaceId: item.spaceId,
          ...item.payload,
          updatedAt: item.createdAt,
          createdAt: item.createdAt,
          version: 1,
          syncState: 'pending'
        } as any;

        const res = await provider.sync(item.spaceId, [payloadEntity]);
        if (res.status === 'success' || res.status === 'conflict') {
          this.updateItemStatus(item.id, 'SYNCED');
          succeeded++;
        } else {
          this.updateItemStatus(item.id, 'FAILED', res.details || 'Cloud sync error');
          failed++;
        }
      } catch (err: any) {
        this.updateItemStatus(item.id, 'FAILED', err.message || 'Error flushing outbox');
        failed++;
      }
    }

    this.removeSynced();
    return { processed: pending.length, succeeded, failed };
  }
}
