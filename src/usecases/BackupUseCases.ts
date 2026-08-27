/**
 * Daily Finance 2.5 - Backup UseCases
 * Single-responsibility Use Cases for Data Backup & Recovery validation.
 */

import { BackupInfo } from '../types';
import { BackupRepository } from '../repositories/contracts';
import { BackupAndSyncEngine, BackupPackage, RestorePreviewSummary } from '../domain/BackupAndSyncEngine';

export class BackupDataUseCase {
  constructor(private backupRepo: BackupRepository) {}

  async execute(): Promise<BackupInfo> {
    return this.backupRepo.backupData();
  }
}

export class RestoreDataUseCase {
  constructor(private backupRepo: BackupRepository) {}

  async execute(backupId: string): Promise<boolean> {
    if (!backupId || backupId.trim() === '') {
      throw new Error('Backup ID is required for restore');
    }
    return this.backupRepo.restoreData(backupId);
  }
}

export class ValidateBackupUseCase {
  async execute(pkg: BackupPackage): Promise<RestorePreviewSummary> {
    return BackupAndSyncEngine.validateBackupPackage(pkg);
  }
}
