import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Language, ReportUiState, ReportPeriod, AppScreen, NavigationContext } from '../../types';
import { ReportsViewModel } from '../../viewmodels/ReportsViewModel';
import { AnalyticsViewModel } from '../../viewmodels/AnalyticsViewModel';
import { SmartAnalyticsCenter } from './SmartAnalyticsCenter';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  Layers,
  CreditCard,
  Building,
  Filter,
  Bot
} from 'lucide-react';

interface ReportsViewProps {
  transactions?: Transaction[];
  language?: Language;
  selectedSpaceId?: string;
  uiState?: ReportUiState;
  reportsViewModel: ReportsViewModel;
  analyticsViewModel?: AnalyticsViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
  navigationContext?: NavigationContext;
}

export const ReportsView: React.FC<ReportsViewProps> = React.memo(({
  transactions = [],
  language = 'vi',
  selectedSpaceId = 'sp_personal',
  uiState: propsUiState,
  reportsViewModel,
  analyticsViewModel,
  onNavigateScreen,
  navigationContext
}) => {
  const [localUiState, setLocalUiState] = useState<ReportUiState | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('this_month');

  useEffect(() => {
    if (navigationContext?.reportPeriod) {
      if (['today', 'this_week', 'this_month', 'this_year'].includes(navigationContext.reportPeriod)) {
        setSelectedPeriod(navigationContext.reportPeriod as ReportPeriod);
      }
    }
  }, [navigationContext]);

  useEffect(() => {
    if (!propsUiState) {
      reportsViewModel.getReportUiState(
        selectedSpaceId,
        transactions,
        { period: selectedPeriod },
        language
      ).then((state) => setLocalUiState(state));
    }
  }, [selectedSpaceId, transactions, selectedPeriod, language, propsUiState, reportsViewModel]);

  const activeUiState = propsUiState || localUiState;

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period);
    if (!propsUiState) {
      reportsViewModel.getReportUiState(
        selectedSpaceId,
        transactions,
        { period },
        language
      ).then((state) => setLocalUiState(state));
    }
  };

  if (!activeUiState) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
        {language === 'vi' ? 'Đang tải báo cáo tài chính...' : 'Loading financial report...'}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Smart Advanced Analytics Center (S5-006 Domain UI Integration) */}
      {analyticsViewModel && (
        <SmartAnalyticsCenter
          selectedSpaceId={selectedSpaceId}
          language={language}
          viewModel={analyticsViewModel}
          onNavigateScreen={onNavigateScreen}
          navigationContext={navigationContext}
        />
      )}

      {/* Main Report Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
        {/* Header & Filter Controls (TASK 9 - Pure ViewModel filter trigger) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>{language === 'vi' ? 'Báo Cáo & Phân Tích Dòng Tiền' : 'Reports & Cashflow Analytics'}</span>
          </h2>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {(['this_week', 'this_month', 'this_year'] as ReportPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                  activeUiState.reportPeriod === period
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {period === 'this_week'
                  ? (language === 'vi' ? 'Tuần' : 'Week')
                  : period === 'this_month'
                  ? (language === 'vi' ? 'Tháng' : 'Month')
                  : (language === 'vi' ? 'Năm' : 'Year')}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts & Insights (Pure presentation rendering) */}
        {activeUiState.alerts.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-xs text-rose-300 font-medium">
            {activeUiState.alerts.join(' ')}
          </div>
        )}

        {/* Precomputed Cashflow Summary Grid (TASK 3 & 4: Zero calculation in UI) */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              {language === 'vi' ? 'Tổng Thu' : 'Income'}
            </span>
            <span className="text-emerald-400 font-extrabold text-xs sm:text-sm block mt-1">
              +{activeUiState.formattedTotalIncome}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              {language === 'vi' ? 'Tổng Chi' : 'Expense'}
            </span>
            <span className="text-rose-400 font-extrabold text-xs sm:text-sm block mt-1">
              -{activeUiState.formattedTotalExpense}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              {language === 'vi' ? 'Dư Ròng' : 'Net Surplus'}
            </span>
            <span className="text-indigo-400 font-extrabold text-xs sm:text-sm block mt-1">
              +{activeUiState.formattedCashFlow}
            </span>
          </div>
        </div>

        {/* Precomputed Chart Representation (TASK 4) */}
        <div className="pt-2 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <span>{language === 'vi' ? 'Cơ Cấu Chi Tiêu Theo Danh Mục:' : 'Category Expense Distribution:'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {language === 'vi' ? 'Dữ liệu đã tính toán' : 'Precomputed Dataset'}
            </span>
          </div>

          <div className="space-y-2.5">
            {activeUiState.categoryDistribution.map((cat, i) => (
              <div key={i} className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>{cat.name}</span>
                  <span className="font-mono text-slate-300">
                    {cat.formattedAmount} ({cat.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${Math.min(100, cat.percent)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Precomputed Space & Payment Method Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'vi' ? 'Phân Bổ Theo Quỹ' : 'Space Distribution'}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {activeUiState.spaceDistribution.map((sp, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                  <span>{sp.spaceName}</span>
                  <span className="font-mono font-medium text-emerald-400">{sp.formattedAmount} ({sp.percent}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'vi' ? 'Phương Thức Thanh Toán' : 'Payment Methods'}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {activeUiState.paymentMethodDistribution.map((pm, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                  <span>{pm.method}</span>
                  <span className="font-mono font-medium text-indigo-400">{pm.formattedAmount} ({pm.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Extensible Future Report Modules Container (TASK 7) */}
        {activeUiState.widgets && activeUiState.widgets.length > 0 && (
          <div className="pt-2 space-y-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Bot className="w-4 h-4" />
                <span>{language === 'vi' ? 'Module Báo Cáo Mở Rộng' : 'Extensible Report Modules'}</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {activeUiState.widgets.length} Sub-Reports Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeUiState.widgets.map((w) => (
                <div key={w.widgetId} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-200">{w.title}</span>
                  <span className="text-[10px] text-purple-300 font-bold mt-1">
                    {w.precomputedData.savingsRatePercent !== undefined && `${w.precomputedData.savingsRatePercent}%`}
                    {w.precomputedData.roiPercent !== undefined && `ROI +${w.precomputedData.roiPercent}%`}
                    {w.precomputedData.yearsToFire !== undefined && `${w.precomputedData.yearsToFire} yrs`}
                    {w.precomputedData.healthScore !== undefined && `Score ${w.precomputedData.healthScore}/100`}
                    {w.precomputedData.projectedGrowth !== undefined && `+${w.precomputedData.projectedGrowth}%`}
                    {w.precomputedData.debtCoverageRatio !== undefined && `Coverage ${w.precomputedData.debtCoverageRatio}x`}
                    {w.precomputedData.necPercent !== undefined && `NEC ${w.precomputedData.necPercent}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ReportsView.displayName = 'ReportsView';
