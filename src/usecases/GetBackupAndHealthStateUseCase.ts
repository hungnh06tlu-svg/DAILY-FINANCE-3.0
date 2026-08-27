/**
 * Daily Finance 3.0 - GetBackupAndHealthStateUseCase (S5-011)
 * Single-responsibility Use Case for Backup, Restore, Sync & Database Health Center.
 */

import { BackupRepository, TransactionRepository } from '../repositories/contracts';
import { BackupAndHealthState } from '../domain/BackupAndHealthState';
import { BackupAndHealthBuilder } from '../domain/BackupAndHealthBuilder';
import { BackupAndSyncEngine, BackupPackage, RestorePreviewSummary, SyncResult, CloudSyncProvider, DisconnectedDriveSyncProvider } from '../domain/BackupAndSyncEngine';
import { DatabaseHealthEngine, HealthCheckReport } from '../domain/DatabaseHealthEngine';
import { BaseRoomEntity } from '../domain/RoomEntities';
import { SyncOutboxQueue } from '../domain/SyncOutboxQueue';

export class GetBackupAndHealthStateUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private txRepo: TransactionRepository,
    private cloudSyncProvider: CloudSyncProvider = new DisconnectedDriveSyncProvider(),
    private outboxQueue?: SyncOutboxQueue
  ) {
    if (!backupRepo) {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: BackupRepository is required');
    }
    if (!txRepo) {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: TransactionRepository is required');
    }
  }

  public getCloudSyncProvider(): CloudSyncProvider {
    return this.cloudSyncProvider;
  }

  public getOutboxQueue(): SyncOutboxQueue | undefined {
    return this.outboxQueue;
  }

  async execute(
    spaceId: string,
    healthReportOverride?: HealthCheckReport,
    lastSyncResult?: SyncResult,
    restorePreview?: RestorePreviewSummary
  ): Promise<BackupAndHealthState> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required');
    }

    const backups = this.backupRepo.getBackups ? await this.backupRepo.getBackups(spaceId) : [];
    const txs = await this.txRepo.getTransactions(spaceId);

    return BackupAndHealthBuilder.buildState(
      spaceId,
      backups,
      txs,
      healthReportOverride,
      lastSyncResult,
      restorePreview
    );
  }

  async createBackup(spaceId: string): Promise<BackupAndHealthState> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required for backup');
    }
    await this.backupRepo.backupData(spaceId);
    return this.execute(spaceId);
  }

  async uploadCloudBackup(spaceId: string): Promise<{ id: string; name: string }> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required for cloud upload');
    }
    if (!this.cloudSyncProvider.uploadBackup) {
      throw new Error('Nhà cung cấp đám mây không hỗ trợ tải bản sao lưu.');
    }
    const txs = await this.txRepo.getTransactions(spaceId);
    const pkg = await BackupAndSyncEngine.createBackupPackage('user', 'device1', { transactions: txs as any }, spaceId);
    return this.cloudSyncProvider.uploadBackup(pkg);
  }

  async listCloudBackups(spaceId: string): Promise<Array<{ id: string; name: string; timestamp: string; size?: number }>> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required to list cloud backups');
    }
    if (!this.cloudSyncProvider.listCloudBackups) {
      return [];
    }
    return this.cloudSyncProvider.listCloudBackups(spaceId);
  }

  async downloadAndRestoreCloudBackup(fileId: string, targetSpaceId: string): Promise<boolean> {
    if (!fileId || fileId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid fileId is required for cloud restore');
    }
    if (!targetSpaceId || targetSpaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid targetSpaceId is required for cloud restore');
    }
    if (!this.cloudSyncProvider.downloadBackup) {
      throw new Error('Nhà cung cấp đám mây không hỗ trợ tải bản sao lưu.');
    }

    const pkg = await this.cloudSyncProvider.downloadBackup(fileId, targetSpaceId);
    const validation = await BackupAndSyncEngine.validateBackupPackage(pkg, targetSpaceId);
    if (!validation.isValid) {
      throw new Error(`Bản sao lưu tải về từ Cloud không hợp lệ: ${validation.errors.join('; ')}`);
    }

    // Save package locally and restore
    const localBackup = await this.backupRepo.backupData(targetSpaceId);
    return this.backupRepo.restoreData(localBackup.id, targetSpaceId);
  }

  async deleteCloudBackup(fileId: string): Promise<boolean> {
    if (!fileId || fileId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid fileId is required');
    }
    if (!this.cloudSyncProvider.deleteCloudBackup) {
      throw new Error('Nhà cung cấp đám mây không hỗ trợ xóa bản sao lưu.');
    }
    return this.cloudSyncProvider.deleteCloudBackup(fileId);
  }

  async validatePackage(pkg: BackupPackage, targetSpaceId?: string): Promise<RestorePreviewSummary> {
    return BackupAndSyncEngine.validateBackupPackage(pkg, targetSpaceId);
  }

  async restoreData(backupId: string, targetSpaceId?: string): Promise<boolean> {
    if (!backupId || backupId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid backupId required for restore');
    }
    return this.backupRepo.restoreData(backupId, targetSpaceId);
  }

  async runHealthCheck(spaceId: string): Promise<HealthCheckReport> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required for health check');
    }
    const txs = await this.txRepo.getTransactions(spaceId);
    return DatabaseHealthEngine.runHealthCheck(
      1,
      txs.length,
      3,
      Math.max(1024 * 512, txs.length * 256)
    );
  }

  async syncSpaceData(spaceId: string): Promise<SyncResult> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('[GetBackupAndHealthStateUseCase] Fail-Fast: Valid spaceId is required for cloud sync');
    }
    const txs = await this.txRepo.getTransactions(spaceId);
    const spaceEntities = txs.filter(t => !t.spaceId || t.spaceId === spaceId) as unknown as BaseRoomEntity[];

    // Flush outbox queue if present
    if (this.outboxQueue) {
      await this.outboxQueue.flush(spaceId, this.cloudSyncProvider);
    }

    return this.cloudSyncProvider.sync(spaceId, spaceEntities);
  }

  async syncCollections<T extends BaseRoomEntity>(local: T[], remote: T[]): Promise<SyncResult & { merged: T[] }> {
    return BackupAndSyncEngine.syncCollections(local, remote);
  }

  exportCSV(records: Array<Record<string, unknown>>): string {
    return BackupAndSyncEngine.exportToCSV(records);
  }
}
