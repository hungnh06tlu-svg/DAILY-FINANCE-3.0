/**
 * Daily Finance 3.0 - GoogleDriveSyncProvider (S5-012)
 * Real Google Drive REST API v3 Integration Provider.
 * Restricts all file storage and queries strictly to the hidden appDataFolder scope.
 */

import { BaseRoomEntity } from './RoomEntities';
import {
  CloudSyncProvider,
  CloudProviderState,
  SyncResult,
  BackupPackage,
  BackupAndSyncEngine
} from './BackupAndSyncEngine';
import { GoogleAuthClient } from './GoogleAuthClient';
import { FeatureToggleRegistry } from './FeatureToggleRegistry';
import { toSafeUserError } from '../utils/safeError';

export type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class GoogleDriveSyncProvider implements CloudSyncProvider {
  private authClient: GoogleAuthClient;
  private customFetch?: FetchFunction;

  constructor(authClient?: GoogleAuthClient, customFetch?: FetchFunction) {
    this.authClient = authClient || GoogleAuthClient.getInstance();
    this.customFetch = customFetch;
  }

  public setCustomFetch(fetchFn: FetchFunction): void {
    this.customFetch = fetchFn;
  }

  private async fetchApi(url: string, init: RequestInit = {}, retryCount = 0): Promise<Response> {
    const fetcher = this.customFetch || (typeof fetch !== 'undefined' ? fetch : undefined);
    if (!fetcher) {
      throw new Error('HTTP Transport fetch is not available');
    }

    const token = await this.authClient.getAccessToken();
    if (!token) {
      throw new Error('Chưa kết nối tài khoản Google Drive. Vui lòng đăng nhập.');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const res = await fetcher(url, { ...init, headers });

    // Handle 401 Unauthorized token expiry with single retry
    if (res.status === 401 && retryCount === 0) {
      this.authClient.clearToken();
      const newToken = await this.authClient.refreshIfNeeded();
      if (newToken) {
        return this.fetchApi(url, init, retryCount + 1);
      }
    }

    return res;
  }

  public getProviderState(): CloudProviderState {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup')) {
      return 'unavailable';
    }
    if (!this.authClient.isAuthenticated()) {
      return 'not_connected';
    }
    return 'ready';
  }

  public isAvailable(): boolean {
    return FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup') && this.authClient.isAuthenticated();
  }

  public async sync(spaceId: string, localEntities: BaseRoomEntity[]): Promise<SyncResult> {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup')) {
      return {
        status: 'error',
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolvedCount: 0,
        syncTimestamp: new Date().toISOString(),
        details: 'Tính năng đồng bộ Google Drive tạm thời bị tắt.'
      };
    }

    if (!this.authClient.isAuthenticated()) {
      return {
        status: 'error',
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolvedCount: 0,
        syncTimestamp: new Date().toISOString(),
        details: 'Chưa kết nối Google Drive. Vui lòng đăng nhập để đồng bộ.'
      };
    }

    try {
      const fileName = `DF_Sync_${spaceId}.json`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `'appDataFolder' in parents and name = '${fileName}' and trashed = false`
      )}&spaces=appDataFolder`;

      const searchRes = await this.fetchApi(searchUrl);
      if (!searchRes.ok) {
        throw new Error(`Google Drive API Search Error HTTP ${searchRes.status}`);
      }

      const searchData = await searchRes.json();
      const files = searchData.files || [];

      let remoteEntities: BaseRoomEntity[] = [];
      let existingFileId: string | null = null;

      if (files.length > 0) {
        existingFileId = files[0].id;
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`;
        const downloadRes = await this.fetchApi(downloadUrl);
        if (downloadRes.ok) {
          const content = await downloadRes.json();
          if (Array.isArray(content)) {
            remoteEntities = content;
          }
        }
      }

      // Merge using BackupAndSyncEngine conflict rules
      const syncOutcome = BackupAndSyncEngine.syncCollections(localEntities, remoteEntities);

      // Save merged collection back to appDataFolder
      const payloadString = JSON.stringify(syncOutcome.merged);

      if (existingFileId) {
        // Update file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
        await this.fetchApi(updateUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payloadString
        });
      } else {
        // Create multipart file in appDataFolder
        const metadata = {
          name: fileName,
          parents: ['appDataFolder']
        };
        const boundary = 'df3_sync_boundary_' + Date.now();
        const multipartBody =
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${JSON.stringify(metadata)}\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          `${payloadString}\r\n` +
          `--${boundary}--`;

        const createUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
        await this.fetchApi(createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        });
      }

      return {
        status: 'success',
        pushedCount: syncOutcome.pushedCount,
        pulledCount: syncOutcome.pulledCount,
        conflictsResolvedCount: syncOutcome.conflictsResolvedCount,
        syncTimestamp: new Date().toISOString(),
        details: 'Đồng bộ Google Drive thành công.'
      };
    } catch (err: unknown) {
      const safeErr = toSafeUserError(
        err,
        'Không thể kết nối Google Drive. Vui lòng thử lại sau.',
        'Unable to connect to Google Drive. Please try again later.'
      );
      return {
        status: 'error',
        pushedCount: 0,
        pulledCount: 0,
        conflictsResolvedCount: 0,
        syncTimestamp: new Date().toISOString(),
        details: safeErr
      };
    }
  }

  public async uploadBackup(pkg: BackupPackage): Promise<{ id: string; name: string }> {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup')) {
      throw new Error('Tính năng đồng bộ Google Drive bị tắt.');
    }

    const validation = await BackupAndSyncEngine.validateBackupPackage(pkg, pkg.metadata.spaceId);
    if (!validation.isValid) {
      throw new Error(`Gói sao lưu không hợp lệ: ${validation.errors.join('; ')}`);
    }

    const spaceId = pkg.metadata.spaceId || 'sp_personal';
    const timestampStr = pkg.metadata.timestamp ? pkg.metadata.timestamp.replace(/[:.]/g, '-') : Date.now().toString();
    const fileName = `DF_Backup_${spaceId}_${pkg.metadata.deviceId}_${timestampStr}.json`;

    const metadata = {
      name: fileName,
      parents: ['appDataFolder']
    };
    const boundary = 'df3_backup_boundary_' + Date.now();
    const payloadString = JSON.stringify(pkg);

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${payloadString}\r\n` +
      `--${boundary}--`;

    const createUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
    const res = await this.fetchApi(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!res.ok) {
      throw new Error(`Google Drive Backup Upload Failed HTTP ${res.status}`);
    }

    const data = await res.json();
    return { id: data.id || `file_${Date.now()}`, name: fileName };
  }

  public async listCloudBackups(spaceId: string): Promise<Array<{ id: string; name: string; timestamp: string; size?: number }>> {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup') || !this.authClient.isAuthenticated()) {
      return [];
    }

    try {
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `'appDataFolder' in parents and name contains 'DF_Backup_${spaceId}_' and trashed = false`
      )}&spaces=appDataFolder&fields=files(id,name,createdTime,size)`;

      const res = await this.fetchApi(searchUrl);
      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const files = data.files || [];

      return files.map((f: any) => ({
        id: f.id,
        name: f.name,
        timestamp: f.createdTime || new Date().toISOString(),
        size: f.size ? parseInt(f.size, 10) : undefined
      }));
    } catch (err: unknown) {
      console.error('[GoogleDriveSyncProvider] listCloudBackups error:', err);
      return [];
    }
  }

  public async downloadBackup(fileId: string, targetSpaceId?: string): Promise<BackupPackage> {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup')) {
      throw new Error('Tính năng đồng bộ Google Drive bị tắt.');
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await this.fetchApi(downloadUrl);
    if (!res.ok) {
      throw new Error(`Google Drive Backup Download Failed HTTP ${res.status}`);
    }

    const pkg: BackupPackage = await res.json();
    const validation = await BackupAndSyncEngine.validateBackupPackage(pkg, targetSpaceId);
    if (!validation.isValid) {
      throw new Error(`Bản sao lưu tải về không hợp lệ hoặc không đúng không gian: ${validation.errors.join('; ')}`);
    }

    return pkg;
  }

  public async deleteCloudBackup(fileId: string): Promise<boolean> {
    if (!FeatureToggleRegistry.getInstance().isEnabled('googleDriveBackup')) {
      throw new Error('Tính năng đồng bộ Google Drive bị tắt.');
    }

    const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await this.fetchApi(deleteUrl, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Google Drive Backup Delete Failed HTTP ${res.status}`);
    }

    return true;
  }
}
