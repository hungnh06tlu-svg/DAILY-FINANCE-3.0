import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { PayYourselfFirstViewModel, PayYourselfFirstUiState } from '../../viewmodels/methods/PayYourselfFirstViewModel';
import { MoneyFormatter } from '../../formatters';
import { Wallet, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface PayYourselfFirstViewProps {
  language: Language;
  viewModel?: PayYourselfFirstViewModel;
}

export const PayYourselfFirstView: React.FC<PayYourselfFirstViewProps> = ({
  language,
  viewModel = new PayYourselfFirstViewModel()
}) => {
  const [uiState, setUiState] = useState<PayYourselfFirstUiState | null>(null);
  const [income, setIncome] = useState<number>(30000000);
  const [savingsRate, setSavingsRate] = useState<number>(20);
  const [fixedExpenses, setFixedExpenses] = useState<number>(15000000);

  useEffect(() => {
    viewModel.calculateAllocation(income, savingsRate, undefined, fixedExpenses)
      .then((state) => setUiState(state));
  }, [income, savingsRate, fixedExpenses, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const alloc = uiState?.allocation;
  const feas = uiState?.feasibility;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Trả Cho Bản Thân Trước (Pay Yourself First)' : 'Pay Yourself First (Reverse Budgeting)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Tự động trích phần trăm thu nhập vào các quỹ tiết kiệm & đầu tư ngay khi nhận lương trước khi chi tiêu'
                : 'Automatically prioritize wealth & savings buckets immediately upon receiving income'}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Thu nhập hàng tháng:' : 'Monthly Income:'}</span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
              step={1000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Tỷ lệ trích quỹ (%):' : 'Savings Rate (%):'}</span>
            <input
              type="number"
              value={savingsRate}
              onChange={(e) => setSavingsRate(Math.min(100, Math.max(0, Number(e.target.value))))}
              step={5}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Chi phí cố định tối thiểu:' : 'Fixed Expenses:'}</span>
            <input
              type="number"
              value={fixedExpenses}
              onChange={(e) => setFixedExpenses(Math.max(0, Number(e.target.value)))}
              step={1000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Allocation Metrics */}
      {alloc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Trích Ngay Vào Quỹ Tiết Kiệm' : 'Automated Wealth Deposit'}
            </span>
            <div className="text-2xl font-extrabold text-emerald-400">
              {formatCurrency(alloc.totalSavingsAllocated)} <span className="text-xs font-normal text-slate-400">({alloc.savingsRatePercent}%)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Chuyển tự động sang tài khoản tích lũy' : 'Transferred immediately to savings'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {language === 'vi' ? 'Hạn Mức Sinh Hoạt Còn Lại' : 'Remaining Living Allowance'}
            </span>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(alloc.remainderForLivingExpenses)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Ngân sách chi tiêu sinh hoạt thoải mái' : 'Guilt-free lifestyle budget'}
            </p>
          </div>
        </div>
      )}

      {/* Feasibility Advice */}
      {feas && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${feas.isFeasible ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <div className="flex items-center gap-2">
            {feas.isFeasible ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feas.advice}</span>
          </div>
        </div>
      )}
    </div>
  );
};
