import React, { useState, useEffect } from 'react';
import { Language, FireConfig } from '../../types';
import { AdvancedFireViewModel, AdvancedFireUiState } from '../../viewmodels/methods/AdvancedFireViewModel';
import { MoneyFormatter } from '../../formatters';
import { Flame, Compass, Coffee, Shield, Zap, TrendingUp, CheckCircle } from 'lucide-react';

interface AdvancedFireViewProps {
  language: Language;
  fireConfig?: FireConfig;
  viewModel?: AdvancedFireViewModel;
}

export const AdvancedFireView: React.FC<AdvancedFireViewProps> = ({
  language,
  fireConfig,
  viewModel = new AdvancedFireViewModel()
}) => {
  const [uiState, setUiState] = useState<AdvancedFireUiState | null>(null);

  const [currentAge, setCurrentAge] = useState<number>(fireConfig?.currentAge || 30);
  const [retirementAge, setRetirementAge] = useState<number>(fireConfig?.targetRetirementAge || 45);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(fireConfig?.monthlyExpense || 20000000);
  const [netWorth, setNetWorth] = useState<number>(fireConfig?.currentNetWorth || 500000000);

  useEffect(() => {
    viewModel.getComprehensiveFireReport({
      currentAge,
      targetRetirementAge: retirementAge,
      monthlyExpenses: monthlyExpense,
      currentNetWorth: netWorth,
      expectedAnnualReturn: 8.5,
      safeWithdrawalRate: 4.0,
      partTimeBaristaIncome: 8000000
    }).then((state) => setUiState(state));
  }, [currentAge, retirementAge, monthlyExpense, netWorth, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const report = uiState?.report;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Độc Lập Tài Chính & Nghỉ Hưu Sớm (5 Mô Hình FIRE)' : 'Financial Independence & Early Retirement (5 FIRE Variants)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi' 
                ? 'Đo lường chi tiết Lean FIRE, Regular FIRE, Fat FIRE, Coast FIRE và Barista FIRE' 
                : 'Comparative modeling for Lean, Regular, Fat, Coast, and Barista FIRE'}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Tuổi hiện tại:' : 'Current Age:'}</span>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Tuổi mục tiêu:' : 'Retire Age:'}</span>
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Chi phí/tháng:' : 'Monthly Exp:'}</span>
            <input
              type="number"
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(Number(e.target.value))}
              step={1000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Tài sản hiện có:' : 'Net Worth:'}</span>
            <input
              type="number"
              value={netWorth}
              onChange={(e) => setNetWorth(Number(e.target.value))}
              step={10000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* 5 Variants Grid */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Lean FIRE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                {language === 'vi' ? report.leanFire.nameVi : report.leanFire.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold">
                {report.leanFire.progressPercent}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(report.leanFire.targetNetWorth)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Chi phí tối giản: ' : 'Minimalist expenses: '}
              <b className="text-slate-200">{formatCurrency(report.leanFire.monthlyExpensesAssumed)}/tháng</b>
            </p>
          </div>

          {/* Regular FIRE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                {language === 'vi' ? report.regularFire.nameVi : report.regularFire.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 font-semibold">
                {report.regularFire.progressPercent}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(report.regularFire.targetNetWorth)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Chi tiêu hiện tại: ' : 'Current living: '}
              <b className="text-slate-200">{formatCurrency(report.regularFire.monthlyExpensesAssumed)}/tháng</b>
            </p>
          </div>

          {/* Fat FIRE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                {language === 'vi' ? report.fatFire.nameVi : report.fatFire.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold">
                {report.fatFire.progressPercent}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(report.fatFire.targetNetWorth)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Hưởng thụ thoải mái: ' : 'Affluent luxury: '}
              <b className="text-slate-200">{formatCurrency(report.fatFire.monthlyExpensesAssumed)}/tháng</b>
            </p>
          </div>

          {/* Coast FIRE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                {language === 'vi' ? report.coastFire.nameVi : report.coastFire.nameEn}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${report.coastFire.hasCoasted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-cyan-300'}`}>
                {report.coastFire.hasCoasted ? (language === 'vi' ? 'Đã Đạt Coast FIRE' : 'Coasted!') : `${report.coastFire.progressPercent}%`}
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(report.coastFire.requiredInvestedToday)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' 
                ? `Cần đầu tư hôm nay để tự tăng trưởng sau ${report.coastFire.yearsToCompound} năm.` 
                : `Required today to compound naturally in ${report.coastFire.yearsToCompound} yrs.`}
            </p>
          </div>

          {/* Barista FIRE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-pink-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                {language === 'vi' ? report.baristaFire.nameVi : report.baristaFire.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 font-semibold">
                {report.baristaFire.progressPercent}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(report.baristaFire.targetNetWorth)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi'
                ? `Kết hợp làm bán thời gian bù đắp ${formatCurrency(report.baristaFire.partTimeMonthlyIncome)}/tháng.`
                : `Part-time side hustle covers ${formatCurrency(report.baristaFire.partTimeMonthlyIncome)}/mo.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
