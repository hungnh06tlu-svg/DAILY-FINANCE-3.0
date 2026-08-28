import React, { useState, useEffect, useMemo } from 'react';
import { SixJar, FireConfig, Language, Transaction, BudgetUiState, AppScreen, NavigationContext, FeatureModulesState, Jar, JarTarget, DebtItem } from '../../types';
import { INITIAL_FIRE_CONFIG } from '../../data/initialData';
import { BudgetViewModel } from '../../viewmodels/BudgetViewModel';
import { MoneyFormatter } from '../../formatters';
import { MethodsDashboard } from './MethodsDashboard';
import { 
  Target, 
  Flame, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Calculator,
  Bot,
  Compass
} from 'lucide-react';

interface BudgetingMethodsViewProps {
  sixJars: SixJar[];
  fireConfig?: FireConfig;
  language: Language;
  transactions?: Transaction[];
  selectedSpaceId?: string;
  uiState?: BudgetUiState;
  budgetViewModel: BudgetViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
  navigationContext?: NavigationContext;
  modules?: FeatureModulesState;
  jars?: Jar[];
  targets?: JarTarget[];
  debts?: DebtItem[];
  initialTab?: 'jars' | 'envelope' | 'kakeibo' | 'fire' | 'methods_advanced';
}

export const BudgetingMethodsView: React.FC<BudgetingMethodsViewProps> = React.memo(({
  sixJars,
  fireConfig = INITIAL_FIRE_CONFIG,
  language,
  transactions = [],
  selectedSpaceId,
  uiState: propsUiState,
  budgetViewModel,
  onNavigateScreen,
  navigationContext,
  modules,
  jars = [],
  targets = [],
  debts = [],
  initialTab = 'jars'
}) => {
  const [localUiState, setLocalUiState] = useState<BudgetUiState | null>(null);

  useEffect(() => {
    if (!propsUiState) {
      budgetViewModel.getBudgetUiState(selectedSpaceId, transactions, 'monthly', language)
        .then((state) => setLocalUiState(state));
    }
  }, [selectedSpaceId, transactions, language, propsUiState, budgetViewModel]);

  const activeUiState = propsUiState || localUiState;
  const [activeTab, setActiveTab] = useState<'jars' | 'envelope' | 'kakeibo' | 'fire' | 'methods_advanced'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (navigationContext) {
      if (navigationContext.analyticsCategory === 'fire' || navigationContext.goalId === 'fire') {
        setActiveTab('fire');
      } else if (navigationContext.analyticsCategory === 'jars') {
        setActiveTab('jars');
      } else if (navigationContext.analyticsCategory === 'methods_advanced') {
        setActiveTab('methods_advanced');
      }
    }
  }, [navigationContext]);

  // Kakeibo state
  const [kakeiboAvailable, setKakeiboAvailable] = useState('38000000');
  const [kakeiboGoal, setKakeiboGoal] = useState('12000000');
  const [kakeiboActual, setKakeiboActual] = useState('21500000');
  const [kakeiboNote, setKakeiboNote] = useState(
    language === 'vi' ? 'Cần giảm tần suất đi ăn ngoài cuối tuần và mua sắm đồ công nghệ không cần thiết.' : 'Need to cut down weekend luxury dining out.'
  );

  // FIRE calculation memoized
  const { annualExpense, fireCorpusNeeded, fireProgressPercent } = useMemo(() => {
    const annExp = fireConfig.monthlyExpense * 12;
    const corpusNeeded = annExp / (fireConfig.safeWithdrawalRate / 100);
    const progressPercent = Math.min(100, Math.round((fireConfig.currentNetWorth / corpusNeeded) * 100));
    return { annualExpense: annExp, fireCorpusNeeded: corpusNeeded, fireProgressPercent: progressPercent };
  }, [fireConfig]);

  const formatCurrency = (val: number) => {
    return MoneyFormatter.format(val, 'VND', language);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Navigation Grouping for Hũ & FIRE Suite */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {/* GROUP 1: HŨ TÀI CHÍNH (6 Hũ & 10 Phương Pháp Mở Rộng) */}
        <div className="flex items-center bg-slate-900/90 border border-emerald-900/50 rounded-2xl p-1 gap-1 shrink-0 shadow-inner">
          <button
            onClick={() => setActiveTab('jars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'jars'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'vi' ? '6 Hũ Tài Chính' : '6 Jars'}</span>
          </button>

          <button
            onClick={() => setActiveTab('methods_advanced')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'methods_advanced'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-300" />
            <span>{language === 'vi' ? '10 Phương Pháp' : '10 Methods'}</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-teal-500/20 text-teal-300 rounded-md border border-teal-500/30">
              Suite
            </span>
          </button>
        </div>

        {/* OTHER STANDALONE PHILOSOPHIES */}
        <button
          onClick={() => setActiveTab('envelope')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'envelope'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 text-indigo-400" />
          <span>{language === 'vi' ? 'Phong Bì' : 'Envelope'}</span>
        </button>

        <button
          onClick={() => setActiveTab('kakeibo')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'kakeibo'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>{language === 'vi' ? 'Sổ Kakeibo' : 'Kakeibo'}</span>
        </button>

        <button
          onClick={() => setActiveTab('fire')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fire'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>FIRE & Overdrive</span>
        </button>
      </div>

      {/* TAB 1: SIX JARS METHOD */}
      {activeTab === 'jars' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                <span>{language === 'vi' ? 'HŨ TÀI CHÍNH › 6 HŨ HARV EKER' : 'JARS SUITE › 6 JARS HARV EKER'}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>{language === 'vi' ? 'Phương Pháp 6 Hũ (Harv Eker)' : 'Six Jars Method (Harv Eker)'}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'vi' ? 'Tự động phân bổ thu nhập hàng tháng vào 6 mục tiêu tự do tài chính.' : 'Auto-allocate monthly income into 6 dedicated wealth jars.'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('methods_advanced')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Mở 10 Phương Pháp' : 'Open 10 Methods'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sixJars.map((jar) => (
              <div 
                key={jar.id} 
                className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-2 relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 bottom-0 w-1.5" 
                  style={{ backgroundColor: jar.color }}
                />

                <div className="flex items-center justify-between pl-2">
                  <span className="font-bold text-xs text-slate-200">
                    {language === 'vi' ? jar.nameVi : jar.nameEn}
                  </span>
                  <span 
                    className="text-xs font-extrabold px-2 py-0.5 rounded-full text-slate-950" 
                    style={{ backgroundColor: jar.color }}
                  >
                    {jar.percent}%
                  </span>
                </div>

                <div className="pl-2">
                  <div className="text-lg font-black text-white">{formatCurrency(jar.currentBalance)}</div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {language === 'vi' ? jar.descriptionVi : jar.descriptionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ENVELOPE BUDGETING */}
      {activeTab === 'envelope' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>{language === 'vi' ? 'Hệ Thống Ngân Sách Phong Bì (Envelope System)' : 'Envelope Budgeting System'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'vi' ? 'Giới hạn cứng số tiền tiêu cho từng danh mục. Hết tiền phong bì = Ngừng chi tiêu.' : 'Hard cap envelope limits. Once the envelope is empty, spending stops.'}
            </p>
          </div>

          {activeUiState?.alerts && activeUiState.alerts.length > 0 && (
            <div className="space-y-1.5">
              {activeUiState.alerts.map((alt) => (
                <div key={alt.id} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-2.5 text-xs text-rose-300 font-medium">
                  {alt.message}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {(activeUiState?.budgets && activeUiState.budgets.length > 0 ? activeUiState.budgets : [
              { id: 'env_1', category: 'Ăn Uống & Cafe', allocatedAmount: 8000000, formattedAllocated: '8.000.000 ₫', spentAmount: 5450000, formattedSpent: '5.450.000 ₫', remainingAmount: 2550000, formattedRemaining: '2.550.000 ₫', usagePercent: 68, isWarning: false, isExceeded: false, alertLevel: '50%', currency: 'VND', period: 'monthly', status: 'active', strategy: 'hard_budget', scopeType: 'category', progress: { used: 5450000, formattedUsed: '5.450.000 ₫', remaining: 2550000, formattedRemaining: '2.550.000 ₫', percentage: 68, forecast: 5450000, formattedForecast: '5.450.000 ₫', remainingDays: 10, dailyAllowance: 255000, formattedDailyAllowance: '255.000 ₫' } },
              { id: 'env_2', category: 'Mua Sắm & Trang Phục', allocatedAmount: 4000000, formattedAllocated: '4.000.000 ₫', spentAmount: 3800000, formattedSpent: '3.800.000 ₫', remainingAmount: 200000, formattedRemaining: '200.000 ₫', usagePercent: 95, isWarning: true, isExceeded: false, alertLevel: '90%', currency: 'VND', period: 'monthly', status: 'active', strategy: 'soft_budget', scopeType: 'category', progress: { used: 3800000, formattedUsed: '3.800.000 ₫', remaining: 200000, formattedRemaining: '200.000 ₫', percentage: 95, forecast: 3800000, formattedForecast: '3.800.000 ₫', remainingDays: 10, dailyAllowance: 20000, formattedDailyAllowance: '20.000 ₫' } },
              { id: 'env_3', category: 'Giải Trí & Phim Ảnh', allocatedAmount: 2500000, formattedAllocated: '2.500.000 ₫', spentAmount: 1100000, formattedSpent: '1.100.000 ₫', remainingAmount: 1400000, formattedRemaining: '1.400.000 ₫', usagePercent: 44, isWarning: false, isExceeded: false, alertLevel: 'normal', currency: 'VND', period: 'monthly', status: 'active', strategy: 'soft_budget', scopeType: 'category', progress: { used: 1100000, formattedUsed: '1.100.000 ₫', remaining: 1400000, formattedRemaining: '1.400.000 ₫', percentage: 44, forecast: 1100000, formattedForecast: '1.100.000 ₫', remainingDays: 10, dailyAllowance: 140000, formattedDailyAllowance: '140.000 ₫' } }
            ]).map((b) => (
              <div key={b.id} className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span>{b.category}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-400">
                      {b.strategy}
                    </span>
                  </span>
                  <span className={b.isExceeded || b.isWarning ? 'text-rose-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                    {b.usagePercent}% {language === 'vi' ? 'đã tiêu' : 'spent'}
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isExceeded ? 'bg-rose-500' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.usagePercent)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>{b.formattedSpent} / {b.formattedAllocated}</span>
                  <span>{language === 'vi' ? 'Còn lại:' : 'Remaining:'} <strong className="text-slate-200">{b.formattedRemaining}</strong></span>
                </div>

                {b.progress && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
                    <span>{language === 'vi' ? 'Định mức ngày:' : 'Daily allowance:'} <strong className="text-emerald-400">{b.progress.formattedDailyAllowance}</strong></span>
                    <span>{language === 'vi' ? 'Dự báo cuối kỳ:' : 'Forecast:'} {b.progress.formattedForecast}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Extensible Future Budget Modules Container (TASK 7) */}
          {activeUiState?.widgets && activeUiState.widgets.length > 0 && (
            <div className="pt-2 space-y-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Bot className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Module Ngân Sách Mở Rộng' : 'Extensible Budget Modules'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {activeUiState.widgets.length} Modules Active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeUiState.widgets.map((w) => (
                  <div key={w.widgetId} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-200">{w.title}</span>
                    <span className="text-[10px] text-indigo-300 font-bold mt-1">
                      {w.precomputedData.totalEnvelopes !== undefined && `${w.precomputedData.totalEnvelopes} Envelopes`}
                      {w.precomputedData.activeHardCaps !== undefined && `${w.precomputedData.activeHardCaps} Hard Caps`}
                      {w.precomputedData.totalCarryOver !== undefined && `Carry Over Ready`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KAKEIBO METHOD */}
      {activeTab === 'kakeibo' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>{language === 'vi' ? 'Sổ Chi Tiêu Kakeibo (Nhật Bản)' : 'Kakeibo Mindful Spending Journal'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'vi' ? 'Nghệ thuật ghi chép và tự vấn tài chính 4 câu hỏi giúp tìm sự bình an tiền bạc.' : 'The Japanese art of mindful financial journaling based on 4 guiding questions.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-amber-400 font-bold block">1. Tiền bạn có sẵn tháng này?</span>
              <input
                type="number"
                value={kakeiboAvailable}
                onChange={(e) => setKakeiboAvailable(e.target.value)}
                className="w-full p-2 bg-slate-900 rounded-xl text-slate-100 font-bold border border-slate-700"
              />
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold block">2. Tiền bạn muốn tiết kiệm?</span>
              <input
                type="number"
                value={kakeiboGoal}
                onChange={(e) => setKakeiboGoal(e.target.value)}
                className="w-full p-2 bg-slate-900 rounded-xl text-emerald-400 font-bold border border-slate-700"
              />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-indigo-400 font-bold block">3. Tiền bạn thực tế đã chi tiêu?</span>
            <input
              type="number"
              value={kakeiboActual}
              onChange={(e) => setKakeiboActual(e.target.value)}
              className="w-full p-2 bg-slate-900 rounded-xl text-slate-100 font-bold border border-slate-700"
            />
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-rose-400 font-bold block">4. Bạn có thể cải thiện điều gì ở tháng tới?</span>
            <textarea
              rows={2}
              value={kakeiboNote}
              onChange={(e) => setKakeiboNote(e.target.value)}
              className="w-full p-2.5 bg-slate-900 rounded-xl text-slate-200 outline-none border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* TAB 4: FIRE CALCULATOR */}
      {activeTab === 'fire' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <span>{language === 'vi' ? 'Độc Lập Tài Chính FIRE (Financial Independence Retire Early)' : 'FIRE Independence Engine'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'vi' ? 'Quy tắc 4% Safe Withdrawal Rate & Bảng tính Coast FIRE.' : '4% Safe Withdrawal rule & Coast FIRE calculator.'}
            </p>
          </div>

          {/* FIRE Summary Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block">{language === 'vi' ? 'Tài Sản Hiện Có:' : 'Current Net Worth:'}</span>
              <span className="text-lg font-black text-white block">{formatCurrency(fireConfig.currentNetWorth)}</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-slate-400 block">{language === 'vi' ? 'Mục Tiêu Tự Do FIRE:' : 'Target FIRE Corpus:'}</span>
              <span className="text-lg font-black text-rose-400 block">{formatCurrency(fireCorpusNeeded)}</span>
            </div>
          </div>

          {/* FIRE Progress Bar */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>{language === 'vi' ? 'Tiến Độ Đạt FIRE:' : 'FIRE Progress:'}</span>
              <span className="text-rose-400 font-mono">{fireProgressPercent}%</span>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 transition-all duration-500"
                style={{ width: `${fireProgressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>{language === 'vi' ? 'Tuổi hiện tại: 31' : 'Current Age: 31'}</span>
              <span>{language === 'vi' ? 'Dự kiến nghỉ hưu: 45 tuổi' : 'Target Retirement: Age 45'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADVANCED METHODS DASHBOARD */}
      {activeTab === 'methods_advanced' && (
        <MethodsDashboard
          language={language}
          modules={modules}
          fireConfig={fireConfig}
          jars={jars}
          targets={targets}
          debts={debts}
          transactions={transactions}
          onNavigateScreen={onNavigateScreen}
        />
      )}
    </div>
  );
});
