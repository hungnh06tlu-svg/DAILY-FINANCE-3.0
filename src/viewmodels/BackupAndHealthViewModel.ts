/**
 * Daily Finance 3.0 - BackupAndHealthViewModel (S5-011)
 * Presentation ViewModel for Backup, Restore, Sync & Database Health Center.
 */

import { GetBackupAndHealthStateUseCase } from '../usecases/GetBackupAndHealthStateUseCase';
import { BackupAndHealthUiState, BackupAndHealthState } from '../domain/BackupAndHealthState';
import { BackupPackage, RestorePreviewSummary, SyncResult } from '../domain/BackupAndSyncEngine';
import { HealthCheckReport } from '../domain/DatabaseHealthEngine';
import { toSafeUserError } from '../utils/safeError';

export class BackupAndHealthViewModel {
  private stateUseCase: GetBackupAndHealthStateUseCase;

  constructor(stateUseCase: GetBackupAndHealthStateUseCase) {
    if (!stateUseCase) {
      throw new Error('[BackupAndHealthViewModel] Fail-Fast: GetBackupAndHealthStateUseCase is required');
    }
    this.stateUseCase = stateUseCase;
  }

  async getBackupAndHealthUiState(
    spaceId: string,
    healthReportOverride?: HealthCheckReport,
    lastSyncResult?: SyncResult,
    restorePreview?: RestorePreviewSummary,
    userMessage?: string | null,
    error?: string | null
  ): Promise<BackupAndHealthUiState> {
    try {
      const domainState: BackupAndHealthState = await this.stateUseCase.execute(
        spaceId,
        healthReportOverride,
        lastSyncResult,
        restorePreview
      );

      return Object.freeze({
        state: domainState,
        isLoading: false,
        isBackupInProgress: false,
        isRestoreInProgress: false,
        isSyncInProgress: false,
        isHealthCheckRunning: false,
        userMessage: userMessage || null,
        error: error || null
      });
    } catch (err: unknown) {
      const safeError = toSafeUserError(err, 'Lỗi tải trạng thái sao lưu và sức khỏe', 'Failed to load backup and health state');
      throw new Error(safeError);
    }
  }

  async triggerBackup(spaceId: string): Promise<BackupAndHealthUiState> {
    try {
      await this.stateUseCase.createBackup(spaceId);
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        'Sao lưu dữ liệu thành công với mã hóa AES-256 và chữ ký SHA-256.'
      );
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi khi tạo bản sao lưu mới', 'Failed to create new backup');
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        null,
        safeErr
      );
    }
  }

  async validatePackage(spaceId: string, pkg: BackupPackage): Promise<BackupAndHealthUiState> {
    try {
      const preview = await this.stateUseCase.validatePackage(pkg, spaceId);
      const msg = preview.isValid
        ? `Gói sao lưu hợp lệ (${preview.totalRecordsToRestore} bản ghi, Schema v${preview.schemaVersion}).`
        : `Kiểm tra gói sao lưu thất bại: ${preview.errors.join('; ')}`;

      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        preview,
        msg,
        preview.isValid ? null : preview.errors[0]
      );
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi kiểm tra gói sao lưu', 'Failed to validate backup package');
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        null,
        safeErr
      );
    }
  }

  async restoreBackup(spaceId: string, backupId: string): Promise<BackupAndHealthUiState> {
    try {
      const success = await this.stateUseCase.restoreData(backupId, spaceId);
      if (success) {
        return await this.getBackupAndHealthUiState(
          spaceId,
          undefined,
          undefined,
          undefined,
          `Khôi phục dữ liệu từ bản sao lưu ${backupId} thành công.`
        );
      } else {
        return await this.getBackupAndHealthUiState(
          spaceId,
          undefined,
          undefined,
          undefined,
          null,
          'Không thể khôi phục dữ liệu từ bản sao lưu đã chọn.'
        );
      }
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi khôi phục sao lưu', 'Failed to restore backup');
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        null,
        safeErr
      );
    }
  }

  async runHealthCheck(spaceId: string): Promise<BackupAndHealthUiState> {
    try {
      const report = await this.stateUseCase.runHealthCheck(spaceId);
      return await this.getBackupAndHealthUiState(
        spaceId,
        report,
        undefined,
        undefined,
        'Hoàn tất kiểm tra chẩn đoán toàn vẹn cơ sở dữ liệu và hiệu năng.'
      );
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi chẩn đoán sức khỏe cơ sở dữ liệu', 'Failed to run database health check');
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        null,
        safeErr
      );
    }
  }

  async triggerSync(spaceId: string): Promise<BackupAndHealthUiState> {
    try {
      const syncRes = await this.stateUseCase.syncSpaceData(spaceId);

      const isSuccess = syncRes.status === 'success';
      const msg = isSuccess
        ? 'Đồng bộ Google Drive thành công.'
        : null;
      const err = !isSuccess
        ? (syncRes.details || 'Chưa kết nối Google Drive Cloud. Đồng bộ tự động tạm thời chưa khả dụng.')
        : null;

      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        syncRes,
        undefined,
        msg,
        err
      );
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi đồng bộ dữ liệu ngoại tuyến', 'Failed to sync offline data');
      return await this.getBackupAndHealthUiState(
        spaceId,
        undefined,
        undefined,
        undefined,
        null,
        safeErr
      );
    }
  }

  exportDataToCSV(records: Array<Record<string, unknown>>): string {
    try {
      return this.stateUseCase.exportCSV(records);
    } catch (err: unknown) {
      const safeErr = toSafeUserError(err, 'Lỗi xuất file CSV', 'Failed to export CSV file');
      throw new Error(safeErr);
    }
  }
}
