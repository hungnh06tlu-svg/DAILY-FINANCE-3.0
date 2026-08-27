/**
 * Daily Finance 3.0 - SmartBackupAndHealthCenter Presentation Component (S5-011)
 * Clean Architecture Presentation UI for Backup, Restore, Cloud Sync & Database Health Center.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BackupAndHealthViewModel } from '../../viewmodels/BackupAndHealthViewModel';
import { BackupAndHealthUiState } from '../../domain/BackupAndHealthState';
import { 
  HardDrive, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Upload, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Cloud, 
  FileSpreadsheet,
  Database,
  Lock,
  Layers,
  Cpu,
  Clock
} from 'lucide-react';

interface SmartBackupAndHealthCenterProps {
  viewModel: BackupAndHealthViewModel;
  selectedSpaceId: string;
  onClose?: () => void;
}

export const SmartBackupAndHealthCenter: React.FC<SmartBackupAndHealthCenterProps> = ({
  viewModel,
  selectedSpaceId,
  onClose
}) => {
  const [uiState, setUiState] = useState<BackupAndHealthUiState | null>(null);
  const [activeTab, setActiveTab] = useState<'health' | 'backup' | 'sync' | 'export'>('health');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [packageJsonInput, setPackageJsonInput] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await viewModel.getBackupAndHealthUiState(selectedSpaceId);
      setUiState(state);
    } catch (err) {
      console.error('Failed to load Backup & Health state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [viewModel, selectedSpaceId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleRunHealthCheck = async () => {
    setIsLoading(true);
    const newState = await viewModel.runHealthCheck(selectedSpaceId);
    setUiState(newState);
    setIsLoading(false);
  };

  const handleTriggerBackup = async () => {
    setIsLoading(true);
    const newState = await viewModel.triggerBackup(selectedSpaceId);
    setUiState(newState);
    setIsLoading(false);
  };

  const handleRestoreBackup = async (backupId: string) => {
    setIsLoading(true);
    const newState = await viewModel.restoreBackup(selectedSpaceId, backupId);
    setUiState(newState);
    setIsLoading(false);
  };

  const handleValidatePackage = async () => {
    if (!packageJsonInput.trim()) return;
    try {
      const pkg = JSON.parse(packageJsonInput);
      setIsLoading(true);
      const newState = await viewModel.validatePackage(selectedSpaceId, pkg);
      setUiState(newState);
    } catch {
      alert('Chuỗi JSON không đúng định dạng. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsLoading(true);
    const newState = await viewModel.triggerSync(selectedSpaceId);
    setUiState(newState);
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    try {
      const sampleRecords = [
        { id: 'tx_01', spaceId: selectedSpaceId, amount: 150000, category: 'Ăn uống', note: 'Ăn trưa', timestamp: new Date().toISOString() },
        { id: 'tx_02', spaceId: selectedSpaceId, amount: 25000000, category: 'Lương', note: 'Lương T8', timestamp: new Date().toISOString() }
      ];
      const csv = viewModel.exportDataToCSV(sampleRecords);
      setCsvPreview(csv);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xuất dữ liệu thất bại');
    }
  };

  if (isLoading || !uiState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Đang tải Trung tâm Sao lưu & Sức khỏe Database...</p>
      </div>
    );
  }

  const { state, userMessage, error } = uiState;
  const { summary, healthReport, backups, lastSyncResult, restorePreview } = state;

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto my-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Sức Khỏe Database & Đồng Bộ Cloud</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                S5-011 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản lý sao lưu mã hóa AES-256, kiểm tra chẩn đoán hiệu năng & đồng bộ ngoại tuyến.
            </p>
          </div>
        </div>

        {/* Space & Health Status Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Không gian: <strong className="text-white">{summary.activeSpaceId}</strong></span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            summary.isDatabaseHealthy 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {summary.isDatabaseHealthy ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{summary.isDatabaseHealthy ? 'Toàn Vẹn 100%' : 'Cần Chẩn Đoán'}</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {userMessage && (
        <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{userMessage}</span>
        </div>
      )}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-900/40">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'health'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Chẩn Đoán Database
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'backup'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Sao Lưu & Khôi Phục
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'sync'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Đồng Bộ Cloud
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'export'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất CSV
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {/* Tab 1: Database Health Benchmarks */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Dung Lượng Sử Dụng</span>
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-white">{summary.storageUsageFormatted}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tổng {summary.totalTransactions} giao dịch
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Tốc Độ Khởi Động</span>
                  <Cpu className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">{healthReport.benchmarks.coldStartMs.toFixed(1)} ms</div>
                <div className="text-[11px] text-emerald-400 mt-1">Nhanh (mục tiêu &lt; 50ms)</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Ghi Giao Dịch</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">{healthReport.benchmarks.transactionSaveMs.toFixed(1)} ms</div>
                <div className="text-[11px] text-slate-400 mt-1">Độ trễ thấp</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Tốc Độ Refresh</span>
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white">{healthReport.benchmarks.dashboardRefreshMs.toFixed(1)} ms</div>
                <div className="text-[11px] text-slate-400 mt-1">Tải mượt mà</div>
              </div>
            </div>

            {/* Health Actions & Details */}
            <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Chẩn Đoán Toàn Vẹn Cấu Trúc Bảng</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Kiểm tra schema version v{healthReport.schemaVersion}, tính nhất quán của giao dịch & chỉ mục tìm kiếm.
                </p>
              </div>
              <button
                onClick={handleRunHealthCheck}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-cyan-950/50"
              >
                <RefreshCw className="w-4 h-4" />
                Chạy Kiểm Tra Ngay
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Mã Hóa AES-256 GCM & Checksum SHA-256
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tạo bản sao lưu toàn bộ cơ sở dữ liệu local an toàn tuyệt đối.
                </p>
              </div>
              <button
                onClick={handleTriggerBackup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                Tạo Bản Sao Lưu Mới
              </button>
            </div>

            {/* Existing Backups List */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Danh Sách Bản Sao Lưu ({backups.length})
              </h4>
              <div className="space-y-2">
                {backups.map((bk) => (
                  <div key={bk.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{bk.filename}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mã: {bk.id} • Tải lên: {bk.timestamp.substring(0, 16)} • {Math.round(bk.sizeBytes / 1024)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(bk.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Khôi Phục
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Validate Backup JSON Package */}
            <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-white">Kiểm Tra Gói Backup Trực Tiếp (JSON)</h4>
              <textarea
                value={packageJsonInput}
                onChange={(e) => setPackageJsonInput(e.target.value)}
                placeholder='Dán chuỗi BackupPackage JSON tại đây để xác thực checksum...'
                className="w-full h-24 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleValidatePackage}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold transition"
              >
                Xác Thực Gói Backup
              </button>

              {restorePreview && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-cyan-400">Kết Quả Preview Khôi Phục:</div>
                  <div>Hợp lệ: <strong className={restorePreview.isValid ? 'text-emerald-400' : 'text-rose-400'}>{restorePreview.isValid ? 'CÓ' : 'KHÔNG'}</strong></div>
                  <div>Tổng bản ghi: <strong>{restorePreview.totalRecordsToRestore}</strong></div>
                  <div>Schema Version: <strong>{restorePreview.schemaVersion}</strong></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Cloud Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  Đồng Bộ Ngoại Tuyến Google Drive
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đồng bộ hai chiều với giải quyết xung đột tự động theo mốc thời gian (Last-Write-Wins).
                </p>
              </div>
              <button
                onClick={handleTriggerSync}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Kích Hoạt Đồng Bộ
              </button>
            </div>

            {lastSyncResult && (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Trạng Thái:</span>
                    <div className={`font-bold uppercase mt-0.5 ${
                      lastSyncResult.status === 'success' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {lastSyncResult.status === 'success' ? 'THÀNH CÔNG' : 'CHƯA KẾT NỐI'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Đã Đẩy Lên:</span>
                    <div className="font-bold text-white mt-0.5">{lastSyncResult.pushedCount} bản ghi</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Đã Tải Về:</span>
                    <div className="font-bold text-white mt-0.5">{lastSyncResult.pulledCount} bản ghi</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Giải Quyết Xung Đột:</span>
                    <div className="font-bold text-cyan-400 mt-0.5">{lastSyncResult.conflictsResolvedCount}</div>
                  </div>
                </div>
                {lastSyncResult.details && (
                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    Chi tiết Provider: {lastSyncResult.details}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: CSV Export */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Xuất Dữ Liệu Ra File CSV
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Xuất toàn bộ giao dịch không gian <strong className="text-white">{selectedSpaceId}</strong> định dạng UTF-8 CSV.
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Tạo File CSV
              </button>
            </div>

            {csvPreview && (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-cyan-400">Xem Trước Nội Dung CSV:</h4>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
                  {csvPreview}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
