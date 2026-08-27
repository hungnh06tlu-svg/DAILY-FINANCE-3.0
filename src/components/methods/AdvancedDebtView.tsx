import React, { useState, useEffect } from 'react';
import { Language, DebtItem } from '../../types';
import { AdvancedDebtViewModel, AdvancedDebtUiState } from '../../viewmodels/methods/AdvancedDebtViewModel';
import { MoneyFormatter } from '../../formatters';
import { ShieldAlert, TrendingDown, ArrowDownRight, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';

interface AdvancedDebtViewProps {
  language: Language;
  debts?: DebtItem[];
  viewModel?: AdvancedDebtViewModel;
}

export const AdvancedDebtView: React.FC<AdvancedDebtViewProps> = ({
  language,
  debts = [],
  viewModel = new AdvancedDebtViewModel()
}) => {
  const [uiState, setUiState] = useState<AdvancedDebtUiState | null>(null);
  const [extraPayment, setExtraPayment] = useState<number>(3000000);

  // Sample fallback debts if list is empty
  const activeDebts: DebtItem[] = debts.length > 0 ? debts : [
    {
      id: 'd_credit_card',
      title: 'Thẻ tín dụng (Credit Card)',
      type: 'debt',
      counterparty: 'Techcombank',
      originalAmount: 30000000,
      remainingAmount: 25000000,
      interestRate: 24.0,
      minimumMonthlyPayment: 2000000,
      dueDate: '2026-09-05'
    },
    {
      id: 'd_personal_loan',
      title: 'Vay tín chấp cá nhân',
      type: 'debt',
      counterparty: 'VPBank',
      originalAmount: 60000000,
      remainingAmount: 45000000,
      interestRate: 14.5,
      minimumMonthlyPayment: 3200000,
      dueDate: '2027-05-15'
    }
  ];

  useEffect(() => {
    viewModel.compareStrategies(activeDebts, extraPayment).then((state) => setUiState(state));
  }, [extraPayment, activeDebts, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const comparison = uiState?.comparison;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Chiến Lược Trả Nợ Nâng Cao (Snowball vs Avalanche)' : 'Advanced Debt Strategy (Snowball vs Avalanche)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Mô phỏng bảng khấu hao, cơ chế dồn tiền (rollover) và so sánh tiền lãi tiết kiệm được'
                : 'Debt payoff acceleration, rollover simulations & interest optimization'}
            </p>
          </div>
        </div>

        {/* Extra budget input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {language === 'vi' ? 'Khoản dồn trả nợ thêm mỗi tháng (Extra Budget):' : 'Extra Monthly Payoff Accelerator:'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(Math.max(0, Number(e.target.value)))}
              step={500000}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-100 font-bold focus:outline-none focus:border-rose-500"
            />
            <span className="text-xs text-rose-400 font-bold">{formatCurrency(extraPayment)}</span>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Snowball */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">
                {language === 'vi' ? 'Quả Cầu Tuyết (Snowball)' : 'Debt Snowball'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold">
                {language === 'vi' ? 'Ưu tiên tâm lý' : 'Behavioral Win'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {comparison.snowball.totalMonths} <span className="text-xs font-normal text-slate-400">{language === 'vi' ? 'tháng về đích' : 'months'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Tổng tiền lãi phải trả: ' : 'Total interest paid: '}
              <b className="text-slate-200">{formatCurrency(comparison.snowball.totalInterestPaid)}</b>
            </p>
          </div>

          {/* Avalanche */}
          <div className="bg-slate-900 border border-emerald-500/40 bg-emerald-950/10 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {language === 'vi' ? 'Tuyết Lở (Avalanche - Tối Ưu)' : 'Debt Avalanche (Optimal)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                {language === 'vi' ? 'Tiết kiệm nhất' : 'Math Optimal'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {comparison.avalanche.totalMonths} <span className="text-xs font-normal text-slate-400">{language === 'vi' ? 'tháng về đích' : 'months'}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {language === 'vi' ? 'Tiết kiệm được: ' : 'Total interest saved: '}
              <b className="text-emerald-400 font-bold">{formatCurrency(comparison.interestSavingsWithAvalanche)}</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
