import React, { useState, useEffect } from 'react';
import { Language, AppScreen, NavigationContext } from '../../types';
import { AnalyticsViewModel } from '../../viewmodels/AnalyticsViewModel';
import { AnalyticsUiState, AnalyticsCategory } from '../../domain/AnalyticsState';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  ShieldCheck, 
  Target, 
  Zap, 
  BrainCircuit, 
  Sparkles, 
  Filter, 
  Activity, 
  DollarSign, 
  Wallet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Flame,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export interface SmartAnalyticsCenterProps {
  selectedSpaceId?: string;
  language?: Language;
  viewModel: AnalyticsViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
  navigationContext?: NavigationContext;
}

export const SmartAnalyticsCenter: React.FC<SmartAnalyticsCenterProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language = 'vi',
  viewModel,
  onNavigateScreen,
  navigationContext
}) => {
  const [uiState, setUiState] = useState<AnalyticsUiState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AnalyticsCategory | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (navigationContext?.analyticsCategory) {
      if (['cash_flow', 'net_worth', 'category', 'budget', 'savings', 'investment', 'debt', 'fire', 'goals', 'habits', 'forecast', 'overall'].includes(navigationContext.analyticsCategory)) {
        setSelectedCategory(navigationContext.analyticsCategory as AnalyticsCategory);
      }
    }
  }, [navigationContext]);

  const fetchAnalyticsState = async (cat: AnalyticsCategory | 'all') => {
    setLoading(true);
    try {
      const state = await viewModel.getAnalyticsUiState(selectedSpaceId, language, cat);
      setUiState(state);
    } catch (err) {
      // ViewModel handles error mapping safely via toSafeUserError
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsState(selectedCategory);
  }, [selectedSpaceId, language, selectedCategory, viewModel]);

  const handleCategoryFilter = (cat: AnalyticsCategory | 'all') => {
    setSelectedCategory(cat);
  };

  const isVi = language === 'vi';

  const categoryLabels: Record<AnalyticsCategory | 'all', string> = {
    all: isVi ? 'Tất cả' : 'All',
    cash_flow: isVi ? 'Dòng tiền' : 'Cash Flow',
    net_worth: isVi ? 'Tài sản ròng' : 'Net Worth',
    category: isVi ? 'Danh mục' : 'Categories',
    budget: isVi ? 'Ngân sách' : 'Budget',
    savings: isVi ? 'Tiết kiệm' : 'Savings',
    investment: isVi ? 'Đầu tư' : 'Investment',
    debt: isVi ? 'Khoản nợ' : 'Debt',
    fire: isVi ? 'Tự do tài chính' : 'FIRE',
    goals: isVi ? 'Mục tiêu' : 'Goals',
    habits: isVi ? 'Thói quen' : 'Habits',
    forecast: isVi ? 'Dự báo' : 'Forecast',
    overall: isVi ? 'Tổng quan' : 'Overall'
  };

  const categoriesList: (AnalyticsCategory | 'all')[] = [
    'all',
    'cash_flow',
    'net_worth',
    'category',
    'budget',
    'savings',
    'investment',
    'debt',
    'fire',
    'goals',
    'habits',
    'forecast'
  ];

  if (loading && !uiState) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-slate-800" />
          <div className="h-5 bg-slate-800 rounded w-1/3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-800/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-32 bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  if (uiState?.error) {
    return (
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs text-rose-300 font-medium">{uiState.error}</p>
        <button
          onClick={() => fetchAnalyticsState(selectedCategory)}
          className="px-4 py-2 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  const stateData = uiState?.state;

  if (!stateData) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl text-center text-slate-400 text-xs space-y-2">
        <Info className="w-6 h-6 text-slate-500 mx-auto" />
        <p>{isVi ? 'Không có dữ liệu phân tích khả dụng.' : 'No analytics data available.'}</p>
      </div>
    );
  }

  // Use domain-provided trend and performance cards directly (Clean Architecture)
  const trendCards = stateData.trendCards;
  const performanceCards = stateData.performanceCards;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              {stateData.dashboard.headline}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {stateData.dashboard.summaryText}
          </p>
        </div>

        <button
          onClick={() => fetchAnalyticsState(selectedCategory)}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
          title={isVi ? 'Làm mới phân tích' : 'Refresh analytics'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline text-[11px] font-semibold">{isVi ? 'Làm mới' : 'Refresh'}</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isVi ? 'Lọc theo chủ đề phân tích:' : 'Filter by Analytics Subject:'}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-2xl font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Cash Flow Surplus */}
        <div 
          onClick={() => onNavigateScreen?.('transactions')}
          className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1 cursor-pointer hover:border-emerald-500/40 hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>{isVi ? 'Thặng Dư Dòng Tiền' : 'Net Cash Flow'}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-emerald-400">
            {stateData.cashFlowAnalysis.netCashFlow > 0 ? '+' : ''}
            {stateData.cashFlowAnalysis.netCashFlow.toLocaleString()} VND
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>{isVi ? 'Tỷ lệ tiết kiệm:' : 'Savings rate:'}</span>
            <span className="font-bold text-slate-200">{stateData.cashFlowAnalysis.savingsRatePercent}%</span>
          </div>
        </div>

        {/* Net Worth */}
        <div 
          onClick={() => onNavigateScreen?.('wealth_debts')}
          className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1 cursor-pointer hover:border-indigo-500/40 hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>{isVi ? 'Tài Sản Ròng' : 'Net Worth'}</span>
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-indigo-300">
            {stateData.netWorthAnalysis.netWorth.toLocaleString()} VND
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>{isVi ? 'Trạng thái:' : 'Status:'}</span>
            <span className="font-bold text-emerald-400 uppercase">{stateData.netWorthAnalysis.status}</span>
          </div>
        </div>

        {/* Budget Health */}
        <div 
          onClick={() => onNavigateScreen?.('methods_fire')}
          className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>{isVi ? 'Sức Khỏe Ngân Sách' : 'Budget Health'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-cyan-300">
            {stateData.budgetAnalysis.budgetHealthPercent}%
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>{isVi ? 'Vượt hạn mức:' : 'Overspent:'}</span>
            <span className="font-bold text-rose-400">{stateData.budgetAnalysis.overspentCategoriesCount} {isVi ? 'hạng mục' : 'cats'}</span>
          </div>
        </div>

        {/* FIRE Progress */}
        <div 
          onClick={() => onNavigateScreen?.('methods_fire')}
          className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1 cursor-pointer hover:border-amber-500/40 hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>{isVi ? 'Tiến Độ FIRE' : 'FIRE Progress'}</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-300">
            {stateData.fireAnalysis.currentFireProgressPercent}%
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>{isVi ? 'Dự kiến:' : 'Est. time:'}</span>
            <span className="font-bold text-amber-400">{stateData.fireAnalysis.estimatedYearsToFIRE} {isVi ? 'năm' : 'yrs'}</span>
          </div>
        </div>
      </div>

      {/* Category Expense Breakdown Module */}
      {(selectedCategory === 'all' || selectedCategory === 'category') && (
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>{isVi ? 'Cơ Cấu Phân Bổ Chi Tiêu Danh Mục' : 'Category Expense Distribution'}</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {isVi ? 'Top:' : 'Top:'} {stateData.categoryAnalysis.topExpenseCategory}
            </span>
          </div>

          <div className="space-y-2">
            {stateData.categoryAnalysis.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{cat.category}</span>
                  <span className="font-mono text-slate-400">
                    {cat.amount.toLocaleString()} VND ({cat.percent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.min(100, cat.percent)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend & Performance Cards Grid */}
      {(trendCards.length > 0 || performanceCards.length > 0) && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>{isVi ? 'Thẻ Chỉ Số Xu Hướng & Hiệu Suất' : 'Trend & Performance Index Cards'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...trendCards, ...performanceCards].map((card) => (
              <div key={card.id} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{card.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    card.trend === 'upward' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {card.trend}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{card.subtitle}</p>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
                  {card.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="bg-slate-900/60 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 block">{m.label}</span>
                      <span className="text-xs font-extrabold text-slate-100 block mt-0.5">
                        {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-300 italic pt-1">{card.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights & Recommendations Section */}
      {stateData.insights.length > 0 && (
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span>{isVi ? 'Thông Tuệ & Khuyến Nghị Chiến Lược' : 'Analytics Insights & Strategic Guidance'}</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {stateData.insights.length} {isVi ? 'Phân Tích' : 'Insights'}
            </span>
          </div>

          <div className="space-y-2.5">
            {stateData.insights.map((ins) => (
              <div key={ins.id} className="bg-slate-900/70 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{ins.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    {isVi ? 'Độ tin cậy:' : 'Confidence:'} {ins.confidence}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{ins.description}</p>
                {ins.recommendation && (
                  <p className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    💡 {ins.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {stateData.recommendations.length > 0 && (
            <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 block">
                {isVi ? 'Hành động khuyến nghị:' : 'Recommended Actions:'}
              </span>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {stateData.recommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SmartAnalyticsCenter.displayName = 'SmartAnalyticsCenter';
