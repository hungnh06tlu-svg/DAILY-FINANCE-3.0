/**
 * Daily Finance 3.0 - BackupAndHealthState Domain Model (S5-011)
 * Immutable domain state model for Backup, Restore, Sync & Database Health.
 */

import { BackupInfo } from '../types';
import { BackupPackage, RestorePreviewSummary, SyncResult } from './BackupAndSyncEngine';
import { HealthCheckReport } from './DatabaseHealthEngine';

export interface BackupAndHealthSummary {
  readonly totalBackups: number;
  readonly lastBackupDate: string;
  readonly storageUsageFormatted: string;
  readonly storageUsageBytes: number;
  readonly isDatabaseHealthy: boolean;
  readonly activeSpaceId: string;
  readonly schemaVersion: number;
  readonly totalTransactions: number;
}

export interface BackupAndHealthState {
  readonly summary: BackupAndHealthSummary;
  readonly healthReport: HealthCheckReport;
  readonly backups: readonly BackupInfo[];
  readonly lastSyncResult?: SyncResult;
  readonly restorePreview?: RestorePreviewSummary;
}

export interface BackupAndHealthUiState {
  readonly state: BackupAndHealthState;
  readonly isLoading: boolean;
  readonly isBackupInProgress: boolean;
  readonly isRestoreInProgress: boolean;
  readonly isSyncInProgress: boolean;
  readonly isHealthCheckRunning: boolean;
  readonly exportCsvData?: string;
  readonly userMessage?: string | null;
  readonly error?: string | null;
}
