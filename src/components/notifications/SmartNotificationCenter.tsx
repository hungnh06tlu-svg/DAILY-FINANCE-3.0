/**
 * Daily Finance 3.0 - SmartNotificationCenter
 * Smart Notification Center UI Component (S5-003).
 * Consumes strictly immutable NotificationCenterUiState provided by NotificationCenterViewModel.
 * Performs zero business calculations, zero direct repository queries.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppScreen } from '../../types';
import { NotificationCenterViewModel } from '../../viewmodels/NotificationCenterViewModel';
import { DateFormatter } from '../../formatters';
import { toSafeUserError } from '../../utils/safeError';
import {
  NotificationCenterUiState,
  NotificationCategory,
  NotificationItem,
  NotificationPriority,
  NotificationType,
  NotificationQuickAction
} from '../../domain/NotificationCenterState';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Clock,
  Pin,
  Tag,
  ChevronRight,
  Filter,
  Flame,
  Target,
  Coins,
  LineChart,
  CreditCard,
  Layers,
  Inbox,
  Zap,
  ArrowRight
} from 'lucide-react';

interface SmartNotificationCenterProps {
  selectedSpaceId?: string;
  language: Language;
  viewModel: NotificationCenterViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
}

export const SmartNotificationCenter: React.FC<SmartNotificationCenterProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language,
  viewModel,
  onNavigateScreen
}) => {
  const isVi = language === 'vi';

  const [uiState, setUiState] = useState<NotificationCenterUiState | null>(null);
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'urgent'>('all');

  useEffect(() => {
    let isMounted = true;
    viewModel.getNotificationCenterUiState(selectedSpaceId, language, filterCategory)
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
              'Không thể tải trạng thái Trung tâm thông báo. Vui lòng thử lại.',
              'Failed to load Notification Center state. Please try again.',
              language
            ),
            lastUpdated: new Date().toISOString(),
            filterCategory
          });
        }
      });
    return () => { isMounted = false; };
  }, [selectedSpaceId, language, filterCategory, viewModel]);

  const categoriesList: Array<{ id: NotificationCategory | 'all'; label: string }> = [
    { id: 'all', label: isVi ? 'Tất cả' : 'All' },
    { id: 'ai_coach', label: isVi ? 'AI Coach' : 'AI Coach' },
    { id: 'budget', label: isVi ? 'Ngân sách' : 'Budget' },
    { id: 'savings', label: isVi ? 'Tiết kiệm' : 'Savings' },
    { id: 'goals', label: isVi ? 'Mục tiêu' : 'Goals' },
    { id: 'investment', label: isVi ? 'Đầu tư' : 'Investment' },
    { id: 'debt', label: isVi ? 'Nợ' : 'Debt' },
    { id: 'fire', label: isVi ? 'FIRE' : 'FIRE' },
    { id: 'system', label: isVi ? 'Hệ thống' : 'System' }
  ];

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />{isVi ? 'Khẩn cấp' : 'Urgent'}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">{isVi ? 'Ưu tiên cao' : 'High'}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">{isVi ? 'Trung bình' : 'Medium'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">{isVi ? 'Thấp' : 'Low'}</span>;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'achievement':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-teal-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'ai_coach': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'budget': return <Layers className="w-4 h-4 text-blue-400" />;
      case 'savings': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'goals': return <Target className="w-4 h-4 text-emerald-400" />;
      case 'investment': return <LineChart className="w-4 h-4 text-teal-400" />;
      case 'debt': return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'fire': return <Flame className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryLabel = (cat: NotificationCategory) => {
    switch (cat) {
      case 'ai_coach': return 'AI Coach';
      case 'budget': return isVi ? 'Ngân sách' : 'Budget';
      case 'savings': return isVi ? 'Tiết kiệm' : 'Savings';
      case 'goals': return isVi ? 'Mục tiêu' : 'Goals';
      case 'investment': return isVi ? 'Đầu tư' : 'Investment';
      case 'debt': return isVi ? 'Khoản nợ' : 'Debt';
      case 'fire': return 'FIRE';
      case 'system': return isVi ? 'Hệ thống' : 'System';
      default: return String(cat);
    }
  };

  const handleQuickAction = (action: NotificationQuickAction) => {
    if (!onNavigateScreen) return;
    switch (action.actionType) {
      case 'open_ai_coach':
        onNavigateScreen('ai_insights');
        break;
      case 'view_budgets':
      case 'view_budget':
      case 'view_fire':
      case 'execute_action':
        onNavigateScreen('methods_fire');
        break;
      case 'view_savings':
      case 'view_investment':
      case 'view_debt':
      case 'view_goal':
      case 'topup_emergency':
        onNavigateScreen('wealth_debts');
        break;
      case 'add_transaction':
        onNavigateScreen('transactions');
        break;
      default:
        break;
    }
  };

  // Loading State
  if (uiState?.isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 animate-pulse">
        <div className="h-6 w-52 bg-slate-800 rounded-xl" />
        <div className="h-20 bg-slate-800/60 rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
          <div className="h-16 bg-slate-800/60 rounded-xl" />
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
          <span>{isVi ? 'Không thể tải Trung Tâm Thông Báo. Vui lòng thử lại.' : 'Unable to load Notification Center. Please try again.'}</span>
        </div>
      </div>
    );
  }

  const notifState = uiState?.state;
  if (!notifState) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center text-slate-400 text-xs">
        {isVi ? 'Không có dữ liệu thông báo' : 'No notification state available'}
      </div>
    );
  }

  // Flatten items for list display
  let allItems: NotificationItem[] = [
    ...notifState.pinnedNotifications,
    ...notifState.unreadNotifications,
    ...notifState.readNotifications
  ];

  // Remove duplicate IDs
  const seenIds = new Set<string>();
  allItems = allItems.filter(item => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  // Apply presentation filters
  if (filterCategory !== 'all') {
    allItems = allItems.filter(i => i.category === filterCategory);
  }
  if (filterType === 'unread') {
    allItems = allItems.filter(i => i.status === 'unread' || i.status === 'pinned');
  } else if (filterType === 'urgent') {
    allItems = allItems.filter(i => i.priority === 'urgent' || i.priority === 'high');
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* Header & Notification Summary Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative">
              <Bell className="w-5 h-5 text-indigo-400" />
              {notifState.statistics.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-900">
                  {notifState.statistics.unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-100">
                {isVi ? 'Trung Tâm Thông Báo & Cảnh Báo' : 'Notification & Alert Center'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {notifState.summary.headline}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Chưa đọc / Ưu tiên' : 'Unread / Urgent'}
            </span>
            <span className="text-xs font-bold text-rose-400">
              {notifState.statistics.unreadCount} / {notifState.statistics.urgentCount}
            </span>
          </div>
        </div>

        {/* Headline Description */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-xs text-slate-300 flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{notifState.summary.description}</span>
        </div>
      </div>

      {/* Notification Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Tổng thông báo' : 'Total Alerts'}</span>
          <span className="text-lg font-black text-indigo-400">{notifState.statistics.totalNotifications}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Chưa đọc' : 'Unread'}</span>
          <span className="text-lg font-black text-rose-400">{notifState.statistics.unreadCount}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Ghim quan trọng' : 'Pinned'}</span>
          <span className="text-lg font-black text-amber-400">{notifState.statistics.pinnedCount}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold block">{isVi ? 'Khẩn cấp / Cao' : 'Urgent / High'}</span>
          <span className="text-lg font-black text-emerald-400">{notifState.statistics.urgentCount}</span>
        </div>
      </div>

      {/* Filter Tabs (Type & Category) */}
      <div className="space-y-2">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isVi ? 'Tất cả' : 'All'} ({allItems.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'unread'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isVi ? 'Chưa đọc' : 'Unread'}
          </button>
          <button
            onClick={() => setFilterType('urgent')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'urgent'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isVi ? 'Khẩn cấp / Cao' : 'Urgent'}
          </button>
        </div>

        {/* Category Scrollable Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {categoriesList.map(cat => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Items Stream */}
      {allItems.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-2">
          <Inbox className="w-8 h-8 mx-auto text-slate-600" />
          <p>{isVi ? 'Khởi tạo hoàn tất. Không có thông báo nào trong bộ lọc này.' : 'All clear. No notifications matching this filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map(item => {
            const isPinned = item.status === 'pinned';
            const isUnread = item.status === 'unread';
            const isUrgent = item.priority === 'urgent';

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 space-y-2.5 transition-all border ${
                  isUrgent
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-md shadow-rose-950/30'
                    : isPinned
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/30'
                    : isUnread
                    ? 'bg-slate-800/90 border-indigo-500/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-80'
                }`}
              >
                {/* Notification Item Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-100">{item.title}</h3>
                        {isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getPriorityBadge(item.priority)}
                    <span className="text-[10px] text-slate-500 font-mono">{item.source}</span>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-2.5 border border-slate-800/60">
                  {item.message}
                </p>

                {/* Footer Meta & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/50 pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-400">
                      {getCategoryIcon(item.category)}
                      <span>{getCategoryLabel(item.category)}</span>
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">
                      {DateFormatter.formatRelative(item.createdTime, language)}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  {item.quickActions && item.quickActions.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {item.quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[10px] font-semibold border border-indigo-500/30 transition-all flex items-center gap-1"
                        >
                          <span>{action.label}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-70" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extensibility Support Badges */}
      <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800/80">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Kênh Android Channels' : 'Android Channels'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Thông báo Đẩy Push' : 'Push Notifications'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Lịch Nhắc nhở' : 'Reminder Scheduling'}</span>
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {isVi ? 'Đồng bộ Nền' : 'Background Sync'}</span>
      </div>
    </div>
  );
});

SmartNotificationCenter.displayName = 'SmartNotificationCenter';
