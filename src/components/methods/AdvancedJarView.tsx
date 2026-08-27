import React, { useState, useEffect } from 'react';
import { Language, Jar, JarTarget } from '../../types';
import { AdvancedJarViewModel, AdvancedJarUiState } from '../../viewmodels/methods/AdvancedJarViewModel';
import { MoneyFormatter } from '../../formatters';
import { Layers, ArrowRightLeft, Target, ShieldCheck, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

interface AdvancedJarViewProps {
  language: Language;
  jars?: Jar[];
  targets?: JarTarget[];
  viewModel?: AdvancedJarViewModel;
}

export const AdvancedJarView: React.FC<AdvancedJarViewProps> = ({
  language,
  jars = [],
  targets = [],
  viewModel = new AdvancedJarViewModel()
}) => {
  const [uiState, setUiState] = useState<AdvancedJarUiState | null>(null);
  const [incomeAmount, setIncomeAmount] = useState<number>(30000000);

  useEffect(() => {
    // Multi-space sample allocation
    viewModel.getAllocationUiState(
      [
        { spaceId: 'sp_personal', amount: incomeAmount * 0.7 },
        { spaceId: 'sp_business', amount: incomeAmount * 0.3 }
      ],
      [
        { jarKey: 'NEC', percent: 55 },
        { jarKey: 'FFA', percent: 10 },
        { jarKey: 'LTSS', percent: 10 },
        { jarKey: 'EDU', percent: 10 },
        { jarKey: 'PLAY', percent: 10 },
        { jarKey: 'GIVE', percent: 5 }
      ]
    ).then((state) => setUiState(state));
  }, [incomeAmount, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Phương Pháp 6 Hũ Nâng Cao (Multi-Space 6 Jars)' : 'Advanced Multi-Space 6 Jars System'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi' 
                ? 'Tự động phân bổ thu nhập đa không gian, theo dõi hạn mức mục tiêu và tái cân bằng quỹ' 
                : 'Automated multi-space income distribution, jar target tracking & rebalancing'}
            </p>
          </div>
        </div>

        {/* Dynamic Income Input */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-medium text-slate-300">
            {language === 'vi' ? 'Tổng Thu Nhập Cần Phân Bổ:' : 'Total Income to Allocate:'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(Math.max(0, Number(e.target.value)))}
              step={1000000}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-emerald-400 font-bold">{formatCurrency(incomeAmount)}</span>
          </div>
        </div>
      </div>

      {/* Multi-space Allocation Grid */}
      {uiState?.allocationResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {language === 'vi' ? 'Bảng Phân Bổ 6 Hũ Đa Không Gian' : 'Multi-Space 6-Jar Allocation Matrix'}
            </h4>
            <span className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Tổng:' : 'Total:'} <b className="text-emerald-400">{formatCurrency(uiState.allocationResult.totalIncome)}</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uiState.allocationResult.allocations.map((item, idx) => (
              <div
                key={`${item.spaceId}-${item.jarKey}-${idx}`}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-all shadow-md"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{item.jarName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-700">
                    {item.percent}%
                  </span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatCurrency(item.allocatedAmount)}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.spaceId === 'sp_personal' ? (language === 'vi' ? 'Không gian: Cá nhân' : 'Space: Personal') : (language === 'vi' ? 'Không gian: Kinh doanh' : 'Space: Business')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
