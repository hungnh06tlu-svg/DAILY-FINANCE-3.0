import React, { useState, useEffect } from 'react';
import { Language, Transaction } from '../../types';
import { ZeroBasedBudgetViewModel, ZeroBasedBudgetUiState } from '../../viewmodels/methods/ZeroBasedBudgetViewModel';
import { MoneyFormatter } from '../../formatters';
import { Target, CheckCircle2, AlertCircle, Sparkles, Inbox } from 'lucide-react';
import { ZeroBasedEnvelope } from '../../domain/methods/types';

interface ZeroBasedBudgetViewProps {
  language: Language;
  transactions?: Transaction[];
  viewModel?: ZeroBasedBudgetViewModel;
}

export const ZeroBasedBudgetView: React.FC<ZeroBasedBudgetViewProps> = ({
  language,
  transactions = [],
  viewModel = new ZeroBasedBudgetViewModel()
}) => {
  const [uiState, setUiState] = useState<ZeroBasedBudgetUiState | null>(null);
  const [income, setIncome] = useState<number>(20000000);

  const initialEnvelopes: ZeroBasedEnvelope[] = [
    { id: 'env_rent', name: 'Tiền thuê nhà & dịch vụ', category: 'Housing', allocatedAmount: 7000000, type: 'necessity' },
    { id: 'env_food', name: 'Thực phẩm & Ăn uống', category: 'Food', allocatedAmount: 5000000, type: 'necessity' },
    { id: 'env_savings', name: 'Tích lũy & Đầu tư', category: 'Investments', allocatedAmount: 5000000, type: 'savings' },
    { id: 'env_fun', name: 'Hưởng thụ & Cafe', category: 'Lifestyle', allocatedAmount: 3000000, type: 'discretionary' }
  ];

  useEffect(() => {
    viewModel.createPlan(income, initialEnvelopes).then((state) => {
      if (state.plan) {
        viewModel.reconcileActual(state.plan, transactions).then((recState) => setUiState(recState));
      } else {
        setUiState(state);
      }
    });
  }, [income, transactions, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const plan = uiState?.plan;
  const reconciliation = uiState?.reconciliation;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Ngân Sách Cân Bằng Zero-Based (ZBB)' : 'Zero-Based Budgeting (ZBB)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Mỗi đồng thu nhập đều có mục đích cụ thể: Thu nhập - Tổng phân bổ = 0'
                : 'Every dollar has a job: Income - Total Allocated = 0'}
            </p>
          </div>
        </div>

        {/* Balance Status Banner */}
        {plan && (
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${plan.isBalancedToZero ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
            <div className="flex items-center gap-2">
              {plan.isBalancedToZero ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
              <span className="font-semibold">
                {plan.isBalancedToZero
                  ? (language === 'vi' ? 'Ngân sách cân bằng hoàn hảo (0đ còn thừa)' : 'Zero-Based Balanced Perfectly!')
                  : (language === 'vi' ? `Chưa cân bằng: Còn ${formatCurrency(plan.leftoverToAssign)} chưa phân bổ` : `Unassigned: ${formatCurrency(plan.leftoverToAssign)} left`)}
              </span>
            </div>
            <span className="font-bold text-slate-100">{formatCurrency(plan.totalIncome)}</span>
          </div>
        )}
      </div>

      {/* Envelope Cards */}
      {reconciliation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reconciliation.envelopesReconciled.map((env) => (
            <div
              key={env.envelopeId}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{env.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${env.status === 'over_budget' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {env.status === 'over_budget' ? (language === 'vi' ? 'Vượt ngân sách' : 'Over') : (language === 'vi' ? 'Đúng kế hoạch' : 'OK')}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-lg font-bold text-slate-100">{formatCurrency(env.allocated)}</span>
                <span className="text-xs text-slate-400">
                  {language === 'vi' ? 'Còn lại: ' : 'Left: '}
                  <b className={env.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(env.remaining)}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
