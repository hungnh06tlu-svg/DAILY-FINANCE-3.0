/**
 * Daily Finance 3.0 - SmartHabitEngine
 * Smart Habit Engine UI Component (S5-004).
 * Consumes strictly immutable HabitEngineUiState provided by HabitEngineViewModel.
 * Performs zero business calculations, zero direct repository queries.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppScreen } from '../../types';
import { HabitEngineViewModel } from '../../viewmodels/HabitEngineViewModel';
import { toSafeUserError } from '../../utils/safeError';
import {
  HabitEngineUiState,
  HabitCategory,
  HabitItem,
  HabitPriority,
  HabitStatus,
  HabitQuickAction,
  HabitAchievement
} from '../../domain/HabitEngineState';
import {
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Info,
  Filter,
  ArrowRight,
  RefreshCw,
  Play,
  Check,
  Pause,
  Target
} from 'lucide-react';

interface SmartHabitEngineProps {
  selectedSpaceId?: string;
  language: Language;
  viewModel: HabitEngineViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
}

export const SmartHabitEngine: React.FC<SmartHabitEngineProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language,
  viewModel,
  onNavigateScreen
}) => {
  const isVi = language === 'vi';

  const [uiState, setUiState] = useState<HabitEngineUiState | null>(null);
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'paused'>('active');

  const fetchUiState = () => {
    let isMounted = true;
    viewModel.getHabitEngineUiState(selectedSpaceId, language, filterCategory)
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
              'Không thể tải dữ liệu Thói Quen. Vui lòng thử lại.',
              'Failed to load Habit Engine state. Please try again.',
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

  const categoriesList: Array<{ id: HabitCategory | 'all'; label: string }> = [
    { id: 'all', label: isVi ? 'Tất cả' : 'All' },
    { id: 'daily_tracking', label: isVi ? 'Ghi chép hàng ngày' : 'Daily Logs' },
    { id: 'budget_discipline', label: isVi ? 'Kỷ luật ngân sách' : 'Budget Rule' },
    { id: 'savings_habit', label: isVi ? 'Thói quen tích lũy' : 'Savings Habit' },
    { id: 'debt_repayment', label: isVi ? 'Thanh toán nợ' : 'Debt Repay' },
    { id: 'investment_routine', label: isVi ? 'Đầu tư định kỳ' : 'Investment' },
    { id: 'learning_coaching', label: isVi ? 'Học hỏi & Cố vấn' : 'AI Learning' },
    { id: 'challenge', label: isVi ? 'Thử thách tài chính' : 'Challenge' }
  ];

  const getPriorityBadgeColor = (priority: HabitPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryIcon = (cat: HabitCategory) => {
    switch (cat) {
      case 'budget_discipline': return <Target className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'savings_habit': return <Award className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'debt_repayment': return <Zap className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'investment_routine': return <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'learning_coaching': return <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />;
      default: return <Clock className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Map quick action click to navigation
  const handleQuickAction = (action: HabitQuickAction) => {
    if (!onNavigateScreen) return;
    if (action.targetRoute) {
      // Safely navigate if route matches
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
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>{isVi ? 'Đang tải Thói quen...' : 'Loading Habits...'}</span>
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
          <span>{isVi ? 'Lỗi Tải Dữ Liệu Thói Quen' : 'Habit Engine Error'}</span>
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
          {isVi ? 'Không tìm thấy dữ liệu thói quen.' : 'No habit engine data found.'}
        </p>
      </div>
    );
  }

  const { statistics, summary, activeHabits, completedHabits, pausedHabits, streaks, achievements } = state;

  const currentHabitsList = 
    activeTab === 'active' ? activeHabits :
    activeTab === 'completed' ? completedHabits :
    pausedHabits;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* 1. Header with Stats Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {isVi ? 'Kỷ Luật Tài Chính (Habit Engine)' : 'Habit Engine & Discipline'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {isVi ? 'Tự động rèn luyện thói quen chi tiêu & tích lũy' : 'Automated spending & saving behavioral discipline'}
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

      {/* 2. Streak and Summary Card */}
      <div className="bg-gradient-to-r from-amber-950/40 to-slate-800/40 rounded-2xl border border-amber-500/20 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-amber-200">
            ✨ {summary.headline || (isVi ? 'Duy trì chuỗi kỷ luật!' : 'Maintain your streak!')}
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>{streaks.currentStreak} {isVi ? 'Ngày' : 'Days'}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {summary.description || (isVi ? 'Các thói quen lành mạnh giúp bạn đạt tự do tài chính bền vững.' : 'Healthy habits lead to sustainable financial independence.')}
        </p>
        
        {/* Statistics Badges */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-center">
          <div>
            <div className="text-xs font-mono font-bold text-amber-400">{statistics.totalHabits}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Tổng số' : 'Total'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400">{statistics.activeHabitsCount}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Đang chạy' : 'Active'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-blue-400">{statistics.completedHabitsCount}</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Hoàn thành' : 'Done'}</div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-purple-400">{statistics.averageProgressPercent}%</div>
            <div className="text-[9px] text-slate-400">{isVi ? 'Tiến trình' : 'Progress'}</div>
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
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. Status Tabs (Active, Completed, Paused) */}
      <div className="grid grid-cols-3 bg-slate-950/80 rounded-xl p-1 border border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            activeTab === 'active'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isVi ? `Đang chạy (${activeHabits.length})` : `Active (${activeHabits.length})`}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isVi ? `Đã hoàn thành (${completedHabits.length})` : `Done (${completedHabits.length})`}
        </button>
        <button
          onClick={() => setActiveTab('paused')}
          className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            activeTab === 'paused'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isVi ? `Tạm dừng (${pausedHabits.length})` : `Paused (${pausedHabits.length})`}
        </button>
      </div>

      {/* 5. Habits List */}
      <div className="space-y-3">
        {currentHabitsList.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            {isVi 
              ? 'Không có thói quen nào trong danh mục này.' 
              : 'No habits found in this category.'}
          </div>
        ) : (
          currentHabitsList.map((habit) => (
            <div
              key={habit.id}
              className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 self-start">
                    {getCategoryIcon(habit.category)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 leading-snug">
                      {habit.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      {habit.description}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-bold ${getPriorityBadgeColor(habit.priority)}`}>
                  {habit.priority}
                </span>
              </div>

              {/* Progress & Streaks */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500/30" />
                    <span>Streak: <b className="text-amber-400">{habit.currentStreak}</b> / Best: {habit.bestStreak}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{habit.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      habit.status === 'completed' ? 'bg-emerald-500' :
                      habit.status === 'paused' ? 'bg-indigo-500' :
                      'bg-gradient-to-r from-amber-500 to-rose-500'
                    }`}
                    style={{ width: `${habit.progress}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions if available */}
              {habit.quickActions && habit.quickActions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-900">
                  {habit.quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-amber-400 transition-all cursor-pointer"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 6. Achievements Section */}
      {achievements && achievements.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60 space-y-2.5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isVi ? 'Thành Tích Đạt Được' : 'Habit Milestones & Achievements'}</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {achievements.slice(0, 4).map((ach) => (
              <div
                key={ach.id}
                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  ach.unlocked
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-slate-950/20 border-slate-850 text-slate-500'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${ach.unlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold truncate leading-tight">{ach.title}</div>
                  <div className="text-[8px] opacity-80 truncate leading-normal">{ach.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
