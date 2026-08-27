/**
 * Daily Finance 3.0 - SmartAutomationCenter
 * Smart Automation Center UI Component (S5-004).
 * Consumes strictly immutable AutomationCenterUiState provided by AutomationCenterViewModel.
 * Performs zero business calculations, zero direct repository queries.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppScreen } from '../../types';
import { AutomationCenterViewModel } from '../../viewmodels/AutomationCenterViewModel';
import { toSafeUserError } from '../../utils/safeError';
import {
  AutomationCenterUiState,
  AutomationCategory,
  AutomationRule,
  AutomationSuggestion,
  AutomationHistoryItem,
  AutomationPriority,
  AutomationStatus,
  AutomationQuickAction
} from '../../domain/AutomationCenterState';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Info,
  Filter,
  ArrowRight,
  RefreshCw,
  Cpu,
  TrendingUp,
  Sliders,
  History,
  ToggleLeft,
  ToggleRight,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';

interface SmartAutomationCenterProps {
  selectedSpaceId?: string;
  language: Language;
  viewModel: AutomationCenterViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
}

export const SmartAutomationCenter: React.FC<SmartAutomationCenterProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language,
  viewModel,
  onNavigateScreen
}) => {
  const isVi = language === 'vi';

  const [uiState, setUiState] = useState<AutomationCenterUiState | null>(null);
  const [filterCategory, setFilterCategory] = useState<AutomationCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'rules' | 'suggestions' | 'history'>('rules');

  const fetchUiState = () => {
    let isMounted = true;
    viewModel.getAutomationCenterUiState(selectedSpaceId, language, filterCategory)
      .then(state => {
        if (isMounted) setUiState(state);
      })
      .catch(err => {
        if (isMounted) {
          setUiState({
            isLoading: false,
            state: null,
            error: toSafeUserError(
              err,
              'Không thể tải dữ liệu Trung Tâm Tự Động Hóa. Vui lòng thử lại.',
              'Failed to load Automation Center state. Please try again.',
              language
            ),
            lastUpdated: new Date().toISOString(),
            filterCategory
          });
        }
      });
    return () => { isMounted = false; };
  };

  useEffect(() => {
    const cleanup = fetchUiState();
    return cleanup;
  }, [selectedSpaceId, language, filterCategory, viewModel]);

  const categoriesList: Array<{ id: AutomationCategory | 'all'; label: string }> = [
    { id: 'all', label: isVi ? 'Tất cả' : 'All' },
    { id: 'auto_categorization', label: isVi ? 'Phân loại tự động' : 'Categorize' },
    { id: 'auto_budget', label: isVi ? 'Quản lý ngân sách' : 'Budget' },
    { id: 'auto_savings', label: isVi ? 'Tích lũy tự động' : 'Savings' },
    { id: 'recurring_transactions', label: isVi ? 'Giao dịch định kỳ' : 'Recurring' },
    { id: 'rebalancing', label: isVi ? 'Tái cơ cấu danh mục' : 'Rebalance' },
    { id: 'debt_repayment', label: isVi ? 'Thanh toán nợ' : 'Debt Repay' },
    { id: 'smart_notifications', label: isVi ? 'Thông báo thông minh' : 'Alerts' },
    { id: 'goal_automation', label: isVi ? 'Mục tiêu tự động' : 'Goal Auto' },
    { id: 'ai_rule', label: isVi ? 'Quy tắc AI' : 'AI Rule' }
  ];

  const getPriorityBadgeColor = (priority: AutomationPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryIcon = (cat: AutomationCategory) => {
    switch (cat) {
      case 'auto_categorization': return <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'auto_budget': return <Sliders className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'auto_savings': return <Award className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'recurring_transactions': return <Clock className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'rebalancing': return <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'debt_repayment': return <Zap className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'smart_notifications': return <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
      default: return <Cpu className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Map quick actions to page navigation if applicable
  const handleQuickAction = (action: AutomationQuickAction) => {
    if (!onNavigateScreen) return;
    if (action.targetRoute) {
      if (action.targetRoute.includes('dashboard')) onNavigateScreen('dashboard');
      else if (action.targetRoute.includes('transaction')) onNavigateScreen('transactions');
      else if (action.targetRoute.includes('wealth') || action.targetRoute.includes('goal')) onNavigateScreen('wealth_debts');
      else if (action.targetRoute.includes('fire') || action.targetRoute.includes('jar')) onNavigateScreen('methods_fire');
      else if (action.targetRoute.includes('insights') || action.targetRoute.includes('coach')) onNavigateScreen('ai_insights');
      else if (action.targetRoute.includes('report')) onNavigateScreen('reports');
      else if (action.targetRoute.includes('setting')) onNavigateScreen('settings_modules');
    }
  };

  if (!uiState) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-12 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { isLoading, state, error } = uiState;

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>{isVi ? 'Đang tải trung tâm tự động hóa...' : 'Loading Automation Center...'}</span>
          </h2>
          <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/30 animate-pulse" />
          <div className="h-24 bg-slate-800/50 rounded-2xl border border-slate-700/30 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/90 border border-rose-500/20 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{isVi ? 'Lỗi Tải Dữ Liệu Tự Động Hóa' : 'Automation Center Error'}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
        <button
          onClick={fetchUiState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all border border-rose-500/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl text-center py-8 space-y-2">
        <Info className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-xs text-slate-400 font-medium">
          {isVi ? 'Không tìm thấy dữ liệu tự động hóa.' : 'No automation data found.'}
        </p>
      </div>
    );
  }

  const {
    automationRules,
    suggestedAutomations,
    activeAutomations,
    pausedAutomations,
    automationHistory,
    statistics,
    summary
  } = state;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* 1. Header with Stats Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {isVi ? 'Trung Tâm Tự Động Hóa' : 'Automation Center'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isVi ? 'Quy tắc phân loại và tối ưu ngân sách tự động' : 'Automatic rule classification and budget execution'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchUiState}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Headline Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-slate-800/40 rounded-2xl border border-emerald-500/20 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-emerald-300">
            🤖 {summary.headline || (isVi ? 'Tối ưu hóa hành trình tài chính!' : 'Optimizing your financial life!')}
          </div>
          <div className="text-[9px] font-mono text-slate-400">
            {isVi ? 'Độ chính xác' : 'Accuracy'} <b className="text-emerald-400">{statistics.executionSuccessRatePercent}%</b>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {summary.description || (isVi ? 'Kích hoạt robot trợ lý để tự động gom tiết kiệm, cảnh báo hạn mức chi tiêu rảnh tay.' : 'Set assistant triggers for stress-free automatic savings transfer.')}
        </p>

        {/* Statistics grid */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-center">
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400">{statistics.totalRules}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Quy tắc' : 'Rules'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-teal-400">{statistics.activeRulesCount}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Đang chạy' : 'Active'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-indigo-400">{statistics.suggestionsCount}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Gợi ý AI' : 'AI Ideas'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-amber-400">{statistics.historyItemsCount}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Lịch sử' : 'Logs'}</div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border shrink-0 ${
              filterCategory === cat.id
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. Core Navigation Tabs (Rules, Suggestions, History logs) */}
      <div className="grid grid-cols-3 bg-slate-950/80 rounded-xl p-1 border border-slate-800">
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'rules'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>{isVi ? 'Quy Tắc' : 'Rules'}</span>
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'suggestions'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isVi ? 'Gợi Ý AI' : 'AI Ideas'}</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'history'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3 h-3" />
          <span>{isVi ? 'Lịch Sử' : 'Logs'}</span>
        </button>
      </div>

      {/* 5. Main Content Switching */}
      <div className="space-y-3">
        {/* TAB 1: RULES */}
        {activeTab === 'rules' && (
          automationRules.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              {isVi ? 'Chưa cấu hình quy tắc tự động hóa nào.' : 'No active automation rules found.'}
            </div>
          ) : (
            automationRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
              >
                {/* Rule Title & Enable/Disable State */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 self-start">
                      {getCategoryIcon(rule.category)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 leading-snug flex items-center gap-1.5">
                        <span>{rule.name}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getPriorityBadgeColor(rule.priority)}`}>
                      {rule.priority}
                    </span>
                    <div className="text-slate-400 hover:text-slate-200 cursor-pointer">
                      {rule.status === 'active' ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Automation Details Block */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800/40 text-[9px] font-mono text-slate-300">
                  <div className="min-w-0">
                    <div className="text-slate-500 font-bold uppercase truncate">{isVi ? 'Trigger' : 'Trigger'}</div>
                    <div className="truncate text-slate-300 mt-0.5" title={rule.trigger}>{rule.trigger}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-500 font-bold uppercase truncate">{isVi ? 'Điều kiện' : 'Condition'}</div>
                    <div className="truncate text-slate-300 mt-0.5" title={rule.condition}>{rule.condition}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-500 font-bold uppercase truncate">{isVi ? 'Hành động' : 'Action'}</div>
                    <div className="truncate text-teal-300 mt-0.5" title={rule.action}>{rule.action}</div>
                  </div>
                </div>

                {/* Quick Actions if available */}
                {rule.quickActions && rule.quickActions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-900/80">
                    {rule.quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-emerald-400 transition-all cursor-pointer"
                      >
                        <span>{action.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {/* TAB 2: SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          suggestedAutomations.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              {isVi ? 'Chưa có gợi ý tối ưu tự động nào hôm nay.' : 'No active suggestions from AI Engine.'}
            </div>
          ) : (
            suggestedAutomations.map((sug) => (
              <div
                key={sug.id}
                className="p-3.5 bg-purple-950/5 border border-purple-900/20 rounded-2xl hover:border-purple-500/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 self-start border border-purple-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-purple-300 leading-snug">
                        {sug.recommendation}
                      </h3>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
                        <b>{isVi ? 'Lý do:' : 'Reason:'}</b> {sug.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {sug.confidence}% Conf
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${getPriorityBadgeColor(sug.priority)}`}>
                      {sug.priority}
                    </span>
                  </div>
                </div>

                {sug.suggestedRule && (
                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-900 text-[10px] space-y-1 text-slate-300">
                    <div className="text-purple-300 font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      <span>{isVi ? 'Quy tắc mẫu' : 'Suggested Rule'}</span>
                    </div>
                    <div><b>If:</b> {sug.suggestedRule.trigger}</div>
                    <div><b>Then:</b> {sug.suggestedRule.action}</div>
                  </div>
                )}
                
                <button
                  onClick={() => alert(isVi ? 'Đã kích hoạt thử nghiệm quy tắc tự động hóa này!' : 'Experimentation rule activated successfully!')}
                  className="w-full py-1.5 text-[10px] font-bold text-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-xl transition-all cursor-pointer"
                >
                  {isVi ? 'Áp dụng đề xuất này' : 'Accept & Deploy Rule'}
                </button>
              </div>
            ))
          )
        )}

        {/* TAB 3: HISTORY LOGS */}
        {activeTab === 'history' && (
          automationHistory.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              {isVi ? 'Chưa phát sinh lịch sử thực thi.' : 'No automation history logs found.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {automationHistory.map((hist) => (
                <div
                  key={hist.id}
                  className="p-2.5 bg-slate-950/20 border border-slate-850 rounded-xl text-[10px] leading-relaxed flex items-start gap-2 justify-between"
                >
                  <div className="flex gap-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      hist.result === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      hist.result === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {hist.result === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{hist.ruleName}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{hist.reason}</div>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-500 font-mono text-right shrink-0">
                    <div>{new Date(hist.timestamp).toLocaleTimeString()}</div>
                    <div className="uppercase font-bold mt-0.5">{hist.result}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
});
