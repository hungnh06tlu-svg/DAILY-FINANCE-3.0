/**
 * Daily Finance 3.0 - BackupAndHealthBuilder Domain Builder (S5-011)
 * Assembles immutable BackupAndHealthState models from domain inputs and health benchmarks.
 */

import { BackupInfo, Transaction } from '../types';
import { BackupAndHealthState, BackupAndHealthSummary } from './BackupAndHealthState';
import { DatabaseHealthEngine, HealthCheckReport } from './DatabaseHealthEngine';
import { SyncResult, RestorePreviewSummary } from './BackupAndSyncEngine';

export class BackupAndHealthBuilder {
  /**
   * Formats raw bytes to human readable string (KB, MB, GB)
   */
  public static formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Builds an immutable BackupAndHealthState object
   */
  public static async buildState(
    spaceId: string,
    backups: BackupInfo[],
    transactions: Transaction[],
    healthReportOverride?: HealthCheckReport,
    lastSyncResult?: SyncResult,
    restorePreview?: RestorePreviewSummary
  ): Promise<BackupAndHealthState> {
    const totalTransactions = transactions.length;
    const estimatedBytes = Math.max(1024 * 512, totalTransactions * 256); // Base size 512KB + 256B per tx

    const healthReport = healthReportOverride || await DatabaseHealthEngine.runHealthCheck(
      1, // Schema version 1
      totalTransactions,
      3, // Default 3 spaces
      estimatedBytes
    );

    const latestBackup = backups[0];
    const lastBackupDate = latestBackup ? latestBackup.timestamp : 'Never';

    const summary: BackupAndHealthSummary = {
      totalBackups: backups.length,
      lastBackupDate,
      storageUsageFormatted: this.formatBytes(healthReport.storageUsageBytes),
      storageUsageBytes: healthReport.storageUsageBytes,
      isDatabaseHealthy: healthReport.isHealthy,
      activeSpaceId: spaceId,
      schemaVersion: healthReport.schemaVersion,
      totalTransactions
    };

    return Object.freeze({
      summary: Object.freeze(summary),
      healthReport: Object.freeze(healthReport),
      backups: Object.freeze([...backups]),
      lastSyncResult: lastSyncResult ? Object.freeze(lastSyncResult) : undefined,
      restorePreview: restorePreview ? Object.freeze(restorePreview) : undefined
    });
  }
}
