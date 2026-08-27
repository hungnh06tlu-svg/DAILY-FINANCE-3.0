import React, { useState, useEffect, useMemo } from 'react';
import { FinancialSpace, Language, ThemeStyle, DashboardUiState, AppScreen } from '../../types';
import { HomeViewModel } from '../../viewmodels/HomeViewModel';
import { DashboardViewModel } from '../../viewmodels/DashboardViewModel';
import { DashboardUiState as SmartDashboardUiState, DashboardSectionType } from '../../domain/DashboardState';
import { SmartDashboardCards } from '../dashboard/SmartDashboardCards';
import { SmartWidgets } from '../widgets/SmartWidgets';
import { WidgetViewModel } from '../../viewmodels/WidgetViewModel';
import { toSafeUserError } from '../../utils/safeError';
import { 
  User, 
  Home, 
  Briefcase, 
  GraduationCap, 
  ArrowRightLeft, 
  Shield, 
  TrendingUp, 
  Users, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sparkles,
  PieChart,
  BarChart3,
  Bot
} from 'lucide-react';

interface AppleGoogleWalletStackProps {
  spaces: FinancialSpace[];
  selectedSpaceId: string;
  onSelectSpace: (id: string) => void;
  onSpaceTransfer: (sourceSpaceId: string, targetSpaceId: string, amount: number, note: string) => void;
  language: Language;
  themeStyle: ThemeStyle;
  uiState?: DashboardUiState;
  onNavigateScreen?: (screen: AppScreen) => void;
  homeViewModel: HomeViewModel;
  dashboardViewModel: DashboardViewModel;
  widgetViewModel?: WidgetViewModel;
}

export const AppleGoogleWalletStack: React.FC<AppleGoogleWalletStackProps> = React.memo(({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  onSpaceTransfer,
  language,
  themeStyle,
  uiState: propsUiState,
  onNavigateScreen,
  homeViewModel,
  dashboardViewModel,
  widgetViewModel
}) => {

  const [localUiState, setLocalUiState] = useState<DashboardUiState | null>(null);
  const [smartUiState, setSmartUiState] = useState<SmartDashboardUiState | null>(null);
  const [selectedSection, setSelectedSection] = useState<DashboardSectionType>('overview');

  useEffect(() => {
    if (!propsUiState) {
      homeViewModel.getDashboardUiState(selectedSpaceId, spaces, [], language)
        .then(state => setLocalUiState(state));
    }
  }, [selectedSpaceId, spaces, language, propsUiState, homeViewModel]);

  useEffect(() => {
    let isMounted = true;
    dashboardViewModel.getDashboardUiState(selectedSpaceId, language, selectedSection)
      .then(state => {
        if (isMounted) setSmartUiState(state);
      })
      .catch(err => {
        if (isMounted) {
          setSmartUiState({
            isLoading: false,
            dashboardState: null,
            error: toSafeUserError(
              err,
              'Không thể tải dữ liệu bảng điều khiển thông minh. Vui lòng thử lại.',
              'Failed to fetch Smart Dashboard state. Please try again.',
              language
            ),
            lastUpdated: new Date().toISOString(),
            selectedSection
          });
        }
      });
    return () => { isMounted = false; };
  }, [selectedSpaceId, language, selectedSection, dashboardViewModel, spaces]);

  const activeUiState = propsUiState || localUiState;

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [transferAmount, setTransferAmount] = useState('2000000');
  const [targetSpaceId, setTargetSpaceId] = useState(
    spaces.find(s => s.id !== selectedSpaceId)?.id || spaces[1]?.id || ''
  );
  const [transferNote, setTransferNote] = useState(
    language === 'vi' ? 'Chuyển quỹ sinh hoạt' : 'Space contribution'
  );

  const activeSpace = activeUiState?.activeSpace || spaces.find(s => s.id === selectedSpaceId) || spaces[0];
  const displayTotalBalance = activeUiState?.totalBalance ?? 0;

  const getSpaceIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="w-5 h-5 text-white" />;
      case 'Home': return <Home className="w-5 h-5 text-white" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-white" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-white" />;
      default: return <User className="w-5 h-5 text-white" />;
    }
  };

  const formatCurrency = (val: number) => {
    if (!showBalance) return '••••••••';
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(transferAmount);
    if (!numAmount || numAmount <= 0) return;
    onSpaceTransfer(selectedSpaceId, targetSpaceId, numAmount, transferNote);
    setShowTransferModal(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Total Combined Net Balance Header - Pure Presentation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'vi' ? 'Tổng Số Dư Tất Cả Quỹ' : 'Total Combined Liquid Balance'}
          </span>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight my-1">
          {formatCurrency(displayTotalBalance)}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-3">
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.4% {language === 'vi' ? 'so với tháng trước' : 'vs last month'}</span>
          </div>
          <span className="text-slate-400">
            {spaces.length} {language === 'vi' ? 'Không Gian Tài Chính' : 'Financial Spaces'}
          </span>
        </div>
      </div>

      {/* Precomputed Chart & Financial Summary Cards (TASK 4 - Pure precomputed dataset) */}
      {activeUiState?.chartData && activeUiState.chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {activeUiState.chartData.map((item, idx) => (
            <div key={idx} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-xs sm:text-sm font-extrabold mt-1 block" style={{ color: item.color }}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Extensible Smart Widgets Center (S5-007) */}
      {widgetViewModel ? (
        <SmartWidgets
          widgetViewModel={widgetViewModel}
          selectedSpaceId={selectedSpaceId}
          language={language}
          onNavigateScreen={onNavigateScreen}
        />
      ) : (
        activeUiState?.widgets && activeUiState.widgets.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Bot className="w-4 h-4" />
                {language === 'vi' ? 'Widget Dashboard Mở Rộng' : 'Extensible Dashboard Widgets'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {activeUiState.widgets.length} Modules Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeUiState.widgets.slice(0, 4).map((w) => (
                <div key={w.widgetId} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="font-semibold text-slate-200 text-[11px]">{w.title}</span>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1">
                    {w.precomputedData.suggestion || 
                     (w.precomputedData.progressPercent ? `${w.precomputedData.progressPercent}%` : 'Sẵn sàng')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Apple / Google Wallet Stacked Card Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <span>{language === 'vi' ? 'Ví & Quỹ (Financial Spaces)' : 'Financial Spaces Wallet'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {themeStyle === 'apple-wallet' ? 'Apple Physics Stack' : 'M3 Wallet Pass'}
            </span>
          </h2>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:text-emerald-300 transition-all bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Chuyển Quỹ' : 'Space Transfer'}</span>
          </button>
        </div>

        {/* Stacked Cards Layout */}
        <div className="space-y-2 relative">
          {spaces.map((space, index) => {
            const isSelected = space.id === selectedSpaceId;
            return (
              <div
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                style={{
                  transform: isSelected ? 'scale(1)' : `translateY(${index * 2}px) scale(0.98)`,
                  zIndex: isSelected ? 10 : index,
                }}
                className={`cursor-pointer transition-all duration-300 rounded-3xl p-5 bg-gradient-to-r ${space.cardColor} text-white shadow-xl relative overflow-hidden border ${
                  isSelected ? 'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-slate-950 shadow-emerald-900/30' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Background Card Waves Effect */}
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                      {getSpaceIcon(space.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base tracking-tight">{space.name}</h3>
                      <p className="text-xs text-white/70 font-medium">{space.ownerName}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === 'vi' ? 'Đang chọn' : 'Active Space'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold block">
                      {language === 'vi' ? 'Số dư không gian' : 'Space Balance'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black tracking-tight">
                      {formatCurrency(space.balance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs bg-black/20 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">
                    <Users className="w-3.5 h-3.5 text-white/80" />
                    <span className="font-semibold">{space.membersCount} {language === 'vi' ? 'thành viên' : 'members'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Space Action Quick Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>{language === 'vi' ? 'Thao Tác Nhanh Quỹ Này:' : 'Active Space Actions:'}</span>
          <span className="text-emerald-400 font-bold">{activeSpace.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{language === 'vi' ? 'Chuyển Quỹ / Space Transfer' : 'Transfer to Space'}</span>
          </button>
          <button 
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'vi' ? 'Phân Phân Quỹ AI' : 'AI Space Allocation'}</span>
          </button>
        </div>
      </div>

      {/* Smart Dashboard Cards (S5-001 Domain UI Integration) */}
      <div className="pt-2">
        <SmartDashboardCards
          uiState={smartUiState}
          language={language}
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          onNavigateScreen={onNavigateScreen}
        />
      </div>

      {/* Space Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-emerald-400">
                <ArrowRightLeft className="w-5 h-5" />
                <span>{language === 'vi' ? 'Chuyển Tiền Giữa Các Quỹ' : 'Space-to-Space Transfer'}</span>
              </h3>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Quỹ Nguồn (Từ):' : 'From Space:'}
                </label>
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 font-bold text-slate-200">
                  {activeSpace.name} ({formatCurrency(activeSpace.balance)})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Quỹ Đích (Đến):' : 'To Space:'}
                </label>
                <select
                  value={targetSpaceId}
                  onChange={(e) => setTargetSpaceId(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-white font-semibold outline-none focus:border-emerald-500"
                >
                  {spaces.filter(s => s.id !== selectedSpaceId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(s.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Số tiền chuyển (VND):' : 'Transfer Amount (VND):'}
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-emerald-400 text-base font-extrabold outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {language === 'vi' ? 'Ghi chú chuyển quỹ:' : 'Transfer Note:'}
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:brightness-110 shadow-lg shadow-emerald-900/30"
                >
                  {language === 'vi' ? 'Xác Nhận Chuyển Quỹ' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

AppleGoogleWalletStack.displayName = 'AppleGoogleWalletStack';

