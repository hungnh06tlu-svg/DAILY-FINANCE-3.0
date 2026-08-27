/**
 * Daily Finance 3.0 - SmartDashboardCards
 * Smart Dashboard UI Component (S5-001).
 * Consumes strictly immutable DashboardUiState provided by DashboardViewModel.
 * Performs zero business calculations, zero direct repository queries.
 */

import React from 'react';
import { Language, AppScreen } from '../../types';
import {
  DashboardUiState,
  DashboardCard,
  DashboardSectionType,
  DashboardCardType,
  DashboardQuickAction
} from '../../domain/DashboardState';
import {
  PieChart,
  Calendar,
  BarChart3,
  Wallet,
  TrendingUp,
  Target,
  Coins,
  LineChart,
  CreditCard,
  Flame,
  Boxes,
  ShieldCheck,
  Bot,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Activity,
  Layers,
  Info
} from 'lucide-react';

interface SmartDashboardCardsProps {
  uiState: DashboardUiState | null;
  language: Language;
  selectedSection: DashboardSectionType;
  onSelectSection: (section: DashboardSectionType) => void;
  onNavigateScreen?: (screen: AppScreen) => void;
}

export const SmartDashboardCards: React.FC<SmartDashboardCardsProps> = React.memo(({
  uiState,
  language,
  selectedSection,
  onSelectSection,
  onNavigateScreen
}) => {
  const isVi = language === 'vi';

  // Section tabs configuration
  const sectionTabs: Array<{ id: DashboardSectionType; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: isVi ? 'Tổng quan' : 'Overview', icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'health', label: isVi ? 'Sức khỏe TC' : 'Health', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'goals', label: isVi ? 'Mục tiêu' : 'Goals', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'planning', label: isVi ? 'Kế hoạch' : 'Planning', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'alerts', label: isVi ? 'Cảnh báo' : 'Alerts', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'recommendations', label: isVi ? 'Gợi ý AI' : 'AI Coach', icon: <Bot className="w-3.5 h-3.5" /> }
  ];

  const getCardIcon = (type: DashboardCardType) => {
    switch (type) {
      case 'overview': return <PieChart className="w-4 h-4 text-emerald-400" />;
      case 'today_summary': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'month_summary': return <BarChart3 className="w-4 h-4 text-indigo-400" />;
      case 'net_worth': return <Wallet className="w-4 h-4 text-teal-400" />;
      case 'cash_flow': return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'budget': return <Target className="w-4 h-4 text-purple-400" />;
      case 'savings': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'investment': return <LineChart className="w-4 h-4 text-emerald-400" />;
      case 'debt': return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'fire': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'six_jars': return <Boxes className="w-4 h-4 text-sky-400" />;
      case 'emergency_fund': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'ai_coach': return <Bot className="w-4 h-4 text-amber-300" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: 'normal' | 'warning' | 'alert' | 'success') => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />{isVi ? 'Tốt' : 'Optimal'}</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{isVi ? 'Lưu ý' : 'Warning'}</span>;
      case 'alert':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{isVi ? 'Cảnh báo' : 'Alert'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">{isVi ? 'Bình thường' : 'Normal'}</span>;
    }
  };

  const handleQuickAction = (action: DashboardQuickAction) => {
    if (!onNavigateScreen) return;
    switch (action.actionType) {
      case 'add_transaction':
      case 'add_expense':
        onNavigateScreen('transactions');
        break;
      case 'view_reports':
      case 'view_month':
        onNavigateScreen('reports');
        break;
      case 'view_assets':
      case 'view_savings':
      case 'view_investment':
      case 'view_debt':
      case 'view_emergency':
        onNavigateScreen('wealth_debts');
        break;
      case 'view_budget':
      case 'view_fire':
      case 'view_six_jars':
        onNavigateScreen('methods_fire');
        break;
      case 'open_ai_coach':
        onNavigateScreen('ai_insights');
        break;
      default:
        break;
    }
  };

  // Filter cards based on selected section
  const dashboardState = uiState?.dashboardState;
  let displayedCards: ReadonlyArray<DashboardCard> = [];

  if (dashboardState) {
    if (selectedSection === 'overview') {
      displayedCards = dashboardState.cards;
    } else {
      const section = dashboardState.sections.find(s => s.type === selectedSection);
      displayedCards = section ? section.cards : dashboardState.cards;
    }
  }

  // Handle Loading State
  if (uiState?.isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-28 bg-slate-800/60 rounded-2xl" />
          <div className="h-28 bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Handle Error State
  if (uiState?.error) {
    return (
      <div className="bg-rose-950/30 border border-rose-800/50 rounded-3xl p-5 text-rose-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{isVi ? 'Không thể tải dữ liệu Dashboard:' : 'Failed to load Dashboard state:'} {uiState.error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardState) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-center text-slate-400 text-xs">
        {isVi ? 'Chưa có dữ liệu không gian tài chính' : 'No financial space state available'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview & Today & Month Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Financial Health Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Điểm Sức Khỏe' : 'Health Score'}
            </span>
            <div className="text-xl font-extrabold text-emerald-400 flex items-baseline gap-1">
              <span>{dashboardState.overview.healthScore}</span>
              <span className="text-xs font-normal text-slate-500">/100</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Metric 2: Estimated Daily Expense */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Chi Tiêu Hôm Nay (Ước tính)' : 'Today Spending (Est.)'}
            </span>
            <div className="text-xl font-extrabold text-rose-400">
              -{dashboardState.todaySummary.totalExpenseToday.toLocaleString()} {dashboardState.overview.currency}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-rose-400" />
          </div>
        </div>

        {/* Metric 3: Monthly Savings Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {isVi ? 'Tỷ Lệ Tiết Kiệm Tháng' : 'Monthly Savings Rate'}
            </span>
            <div className="text-xl font-extrabold text-blue-400">
              {dashboardState.monthSummary.savingsRatePercent}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Section Filter Tabs Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {sectionTabs.map(tab => {
          const isActive = selectedSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedCards.map(card => (
          <div
            key={card.id}
            className={`bg-slate-900/90 border rounded-3xl p-4 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-slate-700 ${
              card.status === 'alert'
                ? 'border-rose-800/50 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20'
                : card.status === 'warning'
                ? 'border-amber-800/50'
                : 'border-slate-800'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  {getCardIcon(card.type)}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100">{card.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{card.subtitle}</p>
                </div>
              </div>

              <div>{getStatusBadge(card.status)}</div>
            </div>

            {/* Value & Progress Bar */}
            <div className="my-3">
              {card.valueFormatted && (
                <div className="text-lg font-black tracking-tight text-white mb-1">
                  {card.valueFormatted}
                </div>
              )}

              {typeof card.progress === 'number' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{isVi ? 'Tiến độ' : 'Progress'}</span>
                    <span className="font-bold text-slate-200">{Math.round(card.progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        card.status === 'alert'
                          ? 'bg-rose-500'
                          : card.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Coach Special Read-Only Detail Card Content */}
            {card.type === 'ai_coach' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 my-2 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Gợi Ý Độc Quyền AI Coach' : 'AI Coach Exclusive Insight'}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>
            )}

            {/* Quick Actions Footer Bar */}
            {card.quickActions && card.quickActions.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {card.quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-[10px] font-semibold border border-slate-700/60 transition-all flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

SmartDashboardCards.displayName = 'SmartDashboardCards';
