import React, { useState, useEffect, useCallback } from 'react';
import { Language, AppScreen, NavigationTarget } from '../../types';
import { WidgetViewModel } from '../../viewmodels/WidgetViewModel';
import { WidgetUiState, WidgetType, WidgetItem } from '../../domain/WidgetState';
import { 
  LayoutGrid, 
  Sparkles, 
  RefreshCw, 
  Pin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Smartphone, 
  Watch,
  ArrowUpRight,
  Sliders,
  PieChart,
  Target,
  Zap,
  Clock
} from 'lucide-react';

export function resolveWidgetRoute(targetRoute?: string): AppScreen | null {
  if (!targetRoute) return null;
  const route = targetRoute.toLowerCase().trim();

  if (
    route === 'transactions' ||
    route.includes('transaction') ||
    route.includes('expense') ||
    route.includes('income') ||
    route.includes('transfer')
  ) {
    return 'transactions';
  }
  if (
    route === 'methods_fire' ||
    route.includes('budget') ||
    route.includes('fire') ||
    route.includes('jar')
  ) {
    return 'methods_fire';
  }
  if (
    route === 'wealth_debts' ||
    route.includes('goal') ||
    route.includes('wealth') ||
    route.includes('debt')
  ) {
    return 'wealth_debts';
  }
  if (route === 'dashboard') {
    return 'dashboard';
  }
  if (
    route === 'reports' ||
    route.includes('report') ||
    route.includes('analytics')
  ) {
    return 'reports';
  }
  if (
    route === 'ai_insights' ||
    route.includes('insight') ||
    route.includes('coach') ||
    route.includes('ai')
  ) {
    return 'ai_insights';
  }
  if (route === 'settings_modules' || route.includes('setting')) {
    return 'settings_modules';
  }

  return null;
}

interface SmartWidgetsProps {
  widgetViewModel: WidgetViewModel;
  selectedSpaceId: string;
  language: Language;
  onNavigateScreen?: (target: AppScreen | NavigationTarget | string) => void;
  className?: string;
}

export const SmartWidgets: React.FC<SmartWidgetsProps> = React.memo(({
  widgetViewModel,
  selectedSpaceId,
  language,
  onNavigateScreen,
  className = ''
}) => {
  const [selectedFilter, setSelectedFilter] = useState<WidgetType | 'all'>('all');
  const [uiState, setUiState] = useState<WidgetUiState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isVi = language === 'vi';

  const loadWidgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await widgetViewModel.getWidgetUiState(selectedSpaceId, language, selectedFilter);
      setUiState(state);
    } catch (err: any) {
      setUiState({
        isLoading: false,
        state: null,
        error: isVi
          ? 'Không thể tải dữ liệu Tiện Ích. Vui lòng thử lại.'
          : 'Unable to load Widget UI State. Please try again.',
        lastUpdated: new Date().toISOString(),
        filterType: selectedFilter
      });
    } finally {
      setIsLoading(false);
    }
  }, [widgetViewModel, selectedSpaceId, language, selectedFilter, isVi]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const filterOptions: { id: WidgetType | 'all'; labelVi: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'all', labelVi: 'Tất cả', labelEn: 'All', icon: LayoutGrid },
    { id: 'overview', labelVi: 'Tổng Quan', labelEn: 'Overview', icon: PieChart },
    { id: 'today_summary', labelVi: 'Hôm Nay', labelEn: 'Today', icon: Clock },
    { id: 'cash_flow', labelVi: 'Dòng Tiền', labelEn: 'Cash Flow', icon: TrendingUp },
    { id: 'budget', labelVi: 'Ngân Sách', labelEn: 'Budget', icon: Sliders },
    { id: 'goals', labelVi: 'Mục Tiêu', labelEn: 'Goals', icon: Target },
    { id: 'quick_actions', labelVi: 'Nhanh', labelEn: 'Quick Actions', icon: Zap }
  ];

  const handleActionClick = (targetRoute?: string) => {
    if (!targetRoute || !onNavigateScreen) return;
    onNavigateScreen(targetRoute);
  };

  const domainState = uiState?.state;
  const items = domainState?.items || [];
  const summary = domainState?.summary;
  const statistics = domainState?.statistics;
  const futureFlags = domainState?.futureSupportFlags;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 backdrop-blur-md shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                  {isVi ? 'Trung Tâm Tiện Ích & Widget' : 'Widget & Quick Action Center'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Android M3 & Wear OS Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {summary?.description || (isVi 
                  ? 'Cung cấp dữ liệu tài chính thời gian thực trực tiếp trên màn hình chính Android & tiện ích nhanh.' 
                  : 'Delivers real-time financial data directly to Android Home Screen & quick actions.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={loadWidgets}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats Pill Bar */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3">
              <div className="text-[11px] font-medium text-slate-400">{isVi ? 'Tổng Số Widget' : 'Total Widgets'}</div>
              <div className="text-base font-bold text-white mt-0.5">{statistics.totalWidgets}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3">
              <div className="text-[11px] font-medium text-slate-400">{isVi ? 'Đang Hoạt Động' : 'Active Widgets'}</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{statistics.enabledWidgetsCount}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3">
              <div className="text-[11px] font-medium text-slate-400">{isVi ? 'Được Ghim' : 'Pinned Widgets'}</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{statistics.pinnedWidgetsCount}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3">
              <div className="text-[11px] font-medium text-slate-400">{isVi ? 'Loại Kích Thước' : 'Size Types'}</div>
              <div className="text-xs font-medium text-slate-300 mt-1 flex items-center gap-1.5">
                <span>S: {statistics.widgetsBySize.small}</span>
                <span>•</span>
                <span>M: {statistics.widgetsBySize.medium}</span>
                <span>•</span>
                <span>L: {statistics.widgetsBySize.large}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = selectedFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelectedFilter(opt.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{isVi ? opt.labelVi : opt.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert Display */}
      {uiState?.error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uiState.error}</span>
          </div>
          <button
            onClick={loadWidgets}
            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition-all shrink-0"
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && !uiState && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
              <div className="h-12 bg-slate-800/40 rounded-xl"></div>
              <div className="h-8 bg-slate-800/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            {isVi ? 'Không tìm thấy tiện ích nào' : 'No matching widgets found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isVi
              ? 'Không có Widget phù hợp với bộ lọc đã chọn. Hãy chọn nhóm khác hoặc đổi không gian tài chính.'
              : 'No widget matches the selected filter category. Try selecting another filter or space.'}
          </p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium hover:bg-emerald-500/30 transition-all"
          >
            {isVi ? 'Xem tất cả tiện ích' : 'View all widgets'}
          </button>
        </div>
      )}

      {/* Widgets Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: WidgetItem) => {
            const isPinned = item.isPinned;
            const sizeLabel = item.size.toUpperCase();

            return (
              <div
                key={item.id}
                className={`bg-slate-900/80 border transition-all rounded-2xl p-4 flex flex-col justify-between space-y-3 ${
                  isPinned
                    ? 'border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-900/60 shadow-sm'
                    : 'border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Item Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      {isPinned && (
                        <span className="p-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0">
                          <Pin className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/60 rounded-md shrink-0">
                      {sizeLabel}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                  )}
                </div>

                {/* Metrics Box */}
                {item.metrics && item.metrics.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 space-y-2">
                    {item.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 truncate">{metric.label}</span>
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span>{metric.value}</span>
                          {metric.changePercent !== undefined && (
                            <span className={`text-[10px] font-bold flex items-center ${
                              metric.changePercent > 0 ? 'text-emerald-400' : metric.changePercent < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {metric.changePercent > 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : metric.changePercent < 0 ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : null}
                              {metric.changePercent > 0 ? `+${metric.changePercent}%` : `${metric.changePercent}%`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary / Trend Message */}
                {item.summary && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 rounded-xl p-2.5 border border-slate-800/30">
                    {item.summary}
                  </p>
                )}

                {/* Action Buttons */}
                {item.actions && item.actions.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {item.actions.map((act, actIdx) => (
                      <button
                        key={act.id}
                        onClick={() => handleActionClick(act.targetRoute)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                          actIdx === 0
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        <span>{act.label}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-70" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Card Footer Meta */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="capitalize">{item.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="text-slate-400">{item.refreshPolicy}</span>
                  </div>
                  {item.lastUpdatedAt && (
                    <span className="text-slate-500">
                      {new Date(item.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* System Integration Badge Panel */}
      {futureFlags && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Smartphone className="w-4 h-4" />
              <span>{isVi ? 'Màn Hình Chính Android' : 'Android Home Screen'}:</span>
              <span className="text-white font-semibold">{futureFlags.supportsHomeScreen ? (isVi ? 'Đã bật' : 'Enabled') : 'N/A'}</span>
            </div>
            <span className="hidden sm:inline text-slate-700">•</span>
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <Watch className="w-4 h-4" />
              <span>Wear OS:</span>
              <span className="text-white font-semibold">{futureFlags.supportsWearOS ? (isVi ? 'Sẵn sàng' : 'Ready') : 'N/A'}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {isVi ? 'Tự động đồng bộ với cấu hình Android M3 Material You' : 'Auto-synced with Android M3 Material You config'}
          </div>
        </div>
      )}
    </div>
  );
});
