import React, { useState, useMemo } from 'react';
import { SavingsGoal, CreditCard, DebtItem, Installment, Language, AppScreen, NavigationContext } from '../../types';
import { MoneyFormatter } from '../../formatters';
import { SmartGoalPlanner } from '../goals/SmartGoalPlanner';
import { GoalPlannerViewModel } from '../../viewmodels/GoalPlannerViewModel';
import { 
  ShieldCheck, 
  Building, 
  Plane, 
  CreditCard as CardIcon, 
  AlertTriangle, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  DollarSign
} from 'lucide-react';

interface WealthAndDebtsViewProps {
  savingsGoals: SavingsGoal[];
  creditCards: CreditCard[];
  debts: DebtItem[];
  installments: Installment[];
  language: Language;
  selectedSpaceId?: string;
  onNavigateScreen?: (screen: AppScreen) => void;
  goalPlannerViewModel: GoalPlannerViewModel;
  navigationContext?: NavigationContext;
}

export const WealthAndDebtsView: React.FC<WealthAndDebtsViewProps> = React.memo(({
  savingsGoals,
  creditCards,
  debts,
  installments,
  language,
  selectedSpaceId,
  onNavigateScreen,
  goalPlannerViewModel,
  navigationContext
}) => {
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('avalanche');

  const formatCurrency = (val: number) => {
    return MoneyFormatter.format(val, 'VND', language);
  };

  // Sort debts based on strategy
  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (debtStrategy === 'snowball') {
        return a.remainingAmount - b.remainingAmount; // Smallest balance first
      } else {
        return b.interestRate - a.interestRate; // Highest interest rate first
      }
    });
  }, [debts, debtStrategy]);

  return (
    <div className="p-4 space-y-6">
      {/* Smart Goal Planner Center (S5-002 Domain UI Integration) */}
      <SmartGoalPlanner
        selectedSpaceId={selectedSpaceId}
        language={language}
        viewModel={goalPlannerViewModel}
        onNavigateScreen={onNavigateScreen}
        navigationContext={navigationContext}
      />

      {/* 1. Goal-based Savings & Emergency Fund */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{language === 'vi' ? 'Mục Tiêu Tiết Kiệm & Quỹ Khẩn Cấp' : 'Goal Savings & Emergency Fund'}</span>
          </h2>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            {savingsGoals.length} goals
          </span>
        </div>

        <div className="space-y-3.5">
          {savingsGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <div key={goal.id} className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-2">
                    {goal.category === 'emergency' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> :
                     goal.category === 'house' ? <Building className="w-4 h-4 text-amber-400" /> :
                     <Plane className="w-4 h-4 text-indigo-400" />}
                    <span>{goal.title}</span>
                  </span>
                  <span className="text-emerald-400 font-mono">{percent}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  <span>{language === 'vi' ? 'Hạn:' : 'Target:'} {goal.deadline}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Credit Cards & Installments */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-indigo-400" />
            <span>{language === 'vi' ? 'Quản Lý Thẻ Tín Dụng & Trả Góp' : 'Credit Cards & Installments'}</span>
          </h2>
        </div>

        {/* Cards Stack */}
        <div className="space-y-3">
          {creditCards.map((card) => {
            const utilization = Math.round((card.currentBalance / card.creditLimit) * 100);
            return (
              <div key={card.id} className={`rounded-2xl p-4 bg-gradient-to-r ${card.cardColor} text-white shadow-lg space-y-3`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{card.bankName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md">
                    Cashback {card.cashbackPercent}%
                  </span>
                </div>

                <div>
                  <div className="text-sm font-black">{card.cardName}</div>
                  <div className="text-lg font-bold my-1">{formatCurrency(card.currentBalance)} / {formatCurrency(card.creditLimit)}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                  <span>{language === 'vi' ? `Chốt sổ ngày ${card.statementDate}` : `Statement day ${card.statementDate}`}</span>
                  <span className="text-amber-300 font-semibold">
                    {language === 'vi' ? `Hạn trả ngày ${card.dueDate}` : `Due day ${card.dueDate}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Installments */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-300 mb-2">
            {language === 'vi' ? 'Các Khoản Trả Góp Đang Chạy (0% Lãi)' : 'Active Installment Plans (0% Interest)'}
          </div>
          {installments.map((ins) => (
            <div key={ins.id} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/70 space-y-1 mb-2 text-xs">
              <div className="flex justify-between font-bold text-slate-200">
                <span>{ins.itemTitle}</span>
                <span className="text-rose-400">{formatCurrency(ins.monthlyAmount)} / {language === 'vi' ? 'tháng' : 'mo'}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{language === 'vi' ? `Đã trả ${ins.paidMonths}/${ins.totalMonths} kỳ` : `Paid ${ins.paidMonths}/${ins.totalMonths} months`}</span>
                <span>{language === 'vi' ? `Hạn kế: ${ins.nextDueDate}` : `Next due: ${ins.nextDueDate}`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Debt Payoff Strategy Engine: Snowball vs. Avalanche */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>{language === 'vi' ? 'Chiến Lược Trả Nợ Tối Ưu' : 'Debt Payoff Optimizer'}</span>
          </h2>

          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs">
            <button
              onClick={() => setDebtStrategy('avalanche')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                debtStrategy === 'avalanche' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              Avalanche (Lãi Cao)
            </button>
            <button
              onClick={() => setDebtStrategy('snowball')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                debtStrategy === 'snowball' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              Snowball (Nợ Nhỏ)
            </button>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200">
          {debtStrategy === 'avalanche' ? (
            <p>
              ⚡ <strong>Phương Pháp Avalanche (Lở Tuyết):</strong> Ưu tiên dồn tiền trả hết khoản nợ có lãi suất cao nhất ({sortedDebts[0]?.interestRate}%/năm) trước để tiết kiệm tối đa tiền lãi.
            </p>
          ) : (
            <p>
              ❄️ <strong>Phương Pháp Snowball (Tuyết Lăn):</strong> Ưu tiên dồn tiền trả dứt điểm khoản nợ có số dư nhỏ nhất trước ({formatCurrency(sortedDebts[0]?.remainingAmount)}) tạo động lực tâm lý mạnh mẽ.
            </p>
          )}
        </div>

        <div className="space-y-2">
          {sortedDebts.map((item, idx) => (
            <div key={item.id} className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/80 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-200">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Lãi suất: <span className="text-amber-400 font-bold">{item.interestRate}%/năm</span> • Trả tối thiểu: {formatCurrency(item.minimumMonthlyPayment)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-extrabold text-sm text-rose-400">{formatCurrency(item.remainingAmount)}</div>
                <div className="text-[10px] text-slate-500">{item.counterparty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
