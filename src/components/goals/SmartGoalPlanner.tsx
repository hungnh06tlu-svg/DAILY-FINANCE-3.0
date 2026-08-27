/**
 * Daily Finance 3.0 - SmartGoalPlanner
 * Smart Goal Planner UI Component (S5-002).
 * Consumes strictly immutable GoalPlannerUiState provided by GoalPlannerViewModel.
 * Performs zero business calculations, zero direct repository queries.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppScreen, NavigationContext } from '../../types';
import { GoalPlannerViewModel } from '../../viewmodels/GoalPlannerViewModel';
import { toSafeUserError } from '../../utils/safeError';
import {
  GoalPlannerUiState,
  GoalCategory,
  GoalCard,
  GoalMilestone,
  GoalQuickAction,
  GoalPriority,
  GoalStatus
} from '../../domain/GoalPlannerState';
import { MoneyFormatter } from '../../formatters';
import {
  Target,
  Trophy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Flame,
  Coins,
  LineChart,
  CreditCard,
  Users,
  Award,
  ChevronRight,
  Filter,
  Flag,
  Zap,
  Info
} from 'lucide-react';

interface SmartGoalPlannerProps {
  selectedSpaceId?: string;
  language: Language;
  viewModel: GoalPlannerViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
  navigationContext?: NavigationContext;
}

export const SmartGoalPlanner: React.FC<SmartGoalPlannerProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language,
  viewModel,
  onNavigateScreen,
  navigationContext
}) => {
  const isVi = language === 'vi';

  const [uiState, setUiState] = useState<GoalPlannerUiState | null>(null);
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all');

  // Sync with navigationContext
  useEffect(() => {
    if (navigationContext) {
      if (navigationContext.analyticsCategory === 'fire' || navigationContext.goalId === 'fire') {
        setFilterCategory('fire');
      } else if (navigationContext.analyticsCategory === 'debt') {
        setFilterCategory('debt');
      } else if (navigationContext.analyticsCategory === 'saving') {
        setFilterCategory('saving');
      }
    }
  }, [navigationContext]);

  useEffect(() => {
    let isMounted = true;
    viewModel.getGoalPlannerUiState(selectedSpaceId, language, filterCategory)
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
              'Không thể tải dữ liệu Kế Hoạch Mục Tiêu. Vui lòng thử lại.',
              'Failed to load Goal Planner state. Please try again.',
              language
            ),
            lastUpdated: new Date().toISOString(),
            filterCategory
          });
        }
      });
    return () => { isMounted = false; };
  }, [selectedSpaceId, language, filterCategory, viewModel]);

  const categoriesList: Array<{ id: GoalCategory | 'all'; label: string }> = [
    { id: 'all', label: isVi ? 'Tất cả' : 'All' },
    { id: 'savings', label: isVi ? 'Tiết kiệm' : 'Savings' },
    { id: 'emergency_fund', label: isVi ? 'Quỹ khẩn cấp' : 'Emergency Fund' },
    { id: 'investment', label: isVi ? 'Đầu tư' : 'Investment' },
    { id: 'debt_payoff', label: isVi ? 'Trả nợ' : 'Debt Payoff' },
    { id: 'fire', label: isVi ? 'Tự do TC (FIRE)' : 'FIRE' },
    { id: 'budget_improvement', label: isVi ? 'Cải thiện NS' : 'Budget' },
    { id: 'recurring', label: isVi ? 'Định kỳ' : 'Recurring' },
    { id: 'family', label: isVi ? 'Gia đình' : 'Family' },
    { id: 'challenge', label: isVi ? 'Thử thách' : 'Challenge' }
  ];

  const getPriorityBadge = (priority: GoalPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">{isVi ? 'Khẩn cấp' : 'Urgent'}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">{isVi ? 'Ưu tiên cao' : 'High'}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">{isVi ? 'Trung bình' : 'Medium'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/60">{isVi ? 'Thấp' : 'Low'}</span>;
    }
  };

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />{isVi ? 'Hoàn thành' : 'Completed'}</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{isVi ? 'Quá hạn' : 'Overdue'}</span>;
      case 'paused':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">{isVi ? 'Tạm dừng' : 'Paused'}</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">{isVi ? 'Đã hủy' : 'Cancelled'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{isVi ? 'Đang thực hiện' : 'Active'}</span>;
    }
  };

  const getCategoryIcon = (category: GoalCategory) => {
    switch (category) {
      case 'savings': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'emergency_fund': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'investment': return <LineChart className="w-4 h-4 text-teal-400" />;
      case 'debt_payoff': return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'fire': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'family': return <Users className="w-4 h-4 text-indigo-400" />;
      case 'challenge': return <Award className="w-4 h-4 text-amber-300" />;
      default: return <Target className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleQuickAction = (action: GoalQuickAction) => {
    if (!onNavigateScreen) return;
    switch (action.actionType) {
      case 'add_transaction':
        onNavigateScreen('transactions');
        break;
      case 'view_savings':
      case 'view_investment':
      case 'view_debt':
        onNavigateScreen('wealth_debts');
        break;
      case 'view_fire':
      case 'open_planning':
        onNavigateScreen('methods_fire');
        break;
      case 'open_ai_coach':
        onNavigateScreen('ai_insights');
        break;
      default:
        break;
    }
  };

  // Loading State
  if (uiState?.isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-800/60 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 bg-slate-800/60 rounded-2xl" />
          <div className="h-32 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (uiState?.error) {
    return (
      <div className="bg-rose-950/30 border border-rose-800/50 rounded-3xl p-5 text-rose-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{isVi ? 'Không thể tải Goal Planner:' : 'Failed to load Goal Planner:'} {uiState.error}</span>
        </div>
      </div>
    );
  }

  const plannerState = uiState?.state;
  if (!plannerState) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center text-slate-400 text-xs">
        {isVi ? 'Chưa có kế hoạch mục tiêu' : 'No Goal Planner state available'}
      </div>
    );
  }

  // Filter goals based on filterCategory
  const displayedGoals = filterCategory === 'all'
    ? plannerState.goals
    : plannerState.goals.filter(g => g.category === filterCategory);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* Header & Planner Summary Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-100">
                {plannerState.summary.headline || (isVi ? 'Trung Tâm Kế Hoạch Mục Tiêu' : 'Goal Planner Center')}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {plannerState.summary.description || (isVi ? 'Định hình tương lai tài chính' : 'Shape your financial future')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Tổng Mục Tiêu' : 'Total Target'}
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {MoneyFormatter.format(plannerState.summary.totalCurrentAmount, 'VND', language)} / {MoneyFormatter.format(plannerState.summary.totalTargetAmount, 'VND', language)}
            </span>
          </div>
        </div>

        {/* Highlights Bar */}
        {(plannerState.summary.topPriorityGoalTitle || plannerState.summary.nextMilestoneTitle) && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            {plannerState.summary.topPriorityGoalTitle && (
              <div className="flex items-center gap-2 text-slate-200">
                <Flag className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong className="text-slate-400">{isVi ? 'Ưu tiên hàng đầu: ' : 'Top Priority: '}</strong>
                  <span className="font-semibold text-rose-300">{plannerState.summary.topPriorityGoalTitle}</span>
                </span>
              </div>
            )}
            {plannerState.summary.nextMilestoneTitle && (
              <div className="flex items-center gap-2 text-slate-200">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-slate-400">{isVi ? 'Cột mốc tiếp theo: ' : 'Next Milestone: '}</strong>
                  <span className="font-semibold text-amber-300">{plannerState.summary.nextMilestoneTitle}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Statistics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Mục tiêu đang chạy' : 'Active Goals'}</span>
          <span className="text-lg font-black text-indigo-400">{plannerState.statistics.activeGoalsCount} / {plannerState.statistics.totalGoals}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Cột mốc hoàn thành' : 'Milestones Done'}</span>
          <span className="text-lg font-black text-emerald-400">{plannerState.statistics.completedMilestonesCount} / {plannerState.statistics.totalMilestonesCount}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Tiến độ trung bình' : 'Avg Progress'}</span>
          <span className="text-lg font-black text-teal-400">{plannerState.statistics.averageProgressPercent}%</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Đã hoàn thành' : 'Completed Goals'}</span>
          <span className="text-lg font-black text-amber-400">{plannerState.statistics.completedGoalsCount}</span>
        </div>
      </div>

      {/* Category Filter Scrollable Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {categoriesList.map(cat => {
          const isActive = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Goal Cards Grid */}
      {displayedGoals.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center text-slate-400 text-xs">
          {isVi ? 'Chưa có mục tiêu nào trong danh mục này' : 'No goals found in this category'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedGoals.map(goal => (
            <div
              key={goal.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-600 transition-all"
            >
              {/* Goal Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0 mt-0.5">
                    {getCategoryIcon(goal.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100">{goal.title}</h3>
                    <p className="text-[11px] text-slate-400">{goal.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {getStatusBadge(goal.status)}
                  {getPriorityBadge(goal.priority)}
                </div>
              </div>

              {/* Progress Bar & Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    {typeof goal.currentAmount === 'number' && typeof goal.targetAmount === 'number'
                      ? `${MoneyFormatter.format(goal.currentAmount, 'VND', language)} / ${MoneyFormatter.format(goal.targetAmount, 'VND', language)}`
                      : (isVi ? 'Tiến độ' : 'Progress')}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{Math.round(goal.progress)}%</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                  />
                </div>
              </div>

              {/* Milestones count & target date */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
                {goal.targetDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{isVi ? 'Hạn:' : 'Target:'} {goal.targetDate}</span>
                  </span>
                )}

                {typeof goal.milestonesCount === 'number' && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>{goal.completedMilestonesCount ?? 0}/{goal.milestonesCount} {isVi ? 'cột mốc' : 'milestones'}</span>
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              {goal.quickActions && goal.quickActions.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {goal.quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-700 hover:text-white text-[10px] font-semibold border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Milestones Section */}
      {plannerState.upcomingMilestones.length > 0 && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{isVi ? 'Cột Mốc Mục Tiêu Sắp Tới' : 'Upcoming Goal Milestones'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plannerState.upcomingMilestones.map(ms => (
              <div key={ms.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ms.title}</span>
                  </span>
                  <span className="text-amber-400 font-mono text-[11px]">{Math.round(ms.completionPercentage)}%</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, ms.completionPercentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extensibility Badges */}
      <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800/80">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Mục tiêu định kỳ' : 'Recurring Goals'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Mục tiêu gia đình' : 'Shared Family'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Kế hoạch trả nợ' : 'Debt Payoff'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Thử thách tiết kiệm' : 'Savings Challenge'}</span>
      </div>
    </div>
  );
});

SmartGoalPlanner.displayName = 'SmartGoalPlanner';
