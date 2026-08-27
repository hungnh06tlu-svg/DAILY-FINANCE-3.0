import React, { useState, useEffect } from 'react';
import { Language, Transaction } from '../../types';
import { FiftyThirtyTwentyViewModel, FiftyThirtyTwentyUiState } from '../../viewmodels/methods/FiftyThirtyTwentyViewModel';
import { MoneyFormatter } from '../../formatters';
import { PieChart, CheckCircle2, AlertTriangle, Lightbulb, Wallet, Sparkles } from 'lucide-react';

interface FiftyThirtyTwentyViewProps {
  language: Language;
  transactions?: Transaction[];
  viewModel?: FiftyThirtyTwentyViewModel;
}

export const FiftyThirtyTwentyView: React.FC<FiftyThirtyTwentyViewProps> = ({
  language,
  transactions = [],
  viewModel = new FiftyThirtyTwentyViewModel()
}) => {
  const [uiState, setUiState] = useState<FiftyThirtyTwentyUiState | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(25000000);

  useEffect(() => {
    viewModel.evaluateSpending(monthlyIncome, transactions).then((state) => setUiState(state));
  }, [monthlyIncome, transactions, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const budget = uiState?.budget;
  const evalResult = uiState?.evaluation;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Quy Tắc Ngân Sách 50/30/20 (Elizabeth Warren)' : '50/30/20 Budgeting Rule'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi' 
                ? '50% Nhu cầu thiết yếu — 30% Mong muốn linh hoạt — 20% Tích lũy & Trả nợ' 
                : '50% Needs — 30% Wants — 20% Savings & Debt Repayment'}
            </p>
          </div>
        </div>

        {/* Income control */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {language === 'vi' ? 'Thu nhập hàng tháng sau thuế:' : 'Net Monthly Income:'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
              step={1000000}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-indigo-400 font-bold">{formatCurrency(monthlyIncome)}</span>
          </div>
        </div>
      </div>

      {/* 3 Envelopes */}
      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs 50% */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-blue-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-400">{language === 'vi' ? 'Thiết Yếu (Needs)' : 'Needs'}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold">50%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(budget.needsBudget)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Tiền nhà, điện nước, ăn uống, di chuyển, y tế' : 'Rent, groceries, utilities, transit, medicine'}
            </p>
          </div>

          {/* Wants 30% */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-purple-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-400">{language === 'vi' ? 'Mong Muốn (Wants)' : 'Wants'}</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-bold">30%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(budget.wantsBudget)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Mua sắm, cà phê, du lịch, giải trí, sở thích' : 'Shopping, dining out, hobbies, streaming'}
            </p>
          </div>

          {/* Savings 20% */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400">{language === 'vi' ? 'Tích Lũy (Savings)' : 'Savings'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold">20%</span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {formatCurrency(budget.savingsBudget)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Quỹ khẩn cấp, đầu tư, trả góp nợ gốc' : 'Emergency fund, investments, debt principal'}
            </p>
          </div>
        </div>
      )}

      {/* Compliance & Recommendations */}
      {evalResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              {language === 'vi' ? 'Điểm Kỷ Luật Ngân Sách:' : 'Budget Compliance Score:'}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${evalResult.complianceScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {evalResult.complianceScore} / 100
            </span>
          </div>

          {evalResult.recommendations.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              {evalResult.recommendations.map((rec, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
