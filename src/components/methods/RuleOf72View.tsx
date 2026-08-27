import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { RuleOf72ViewModel, RuleOf72UiState } from '../../viewmodels/methods/RuleOf72ViewModel';
import { MoneyFormatter } from '../../formatters';
import { Calculator, TrendingUp, AlertCircle, Award, Calendar, DollarSign } from 'lucide-react';

interface RuleOf72ViewProps {
  language: Language;
  viewModel?: RuleOf72ViewModel;
}

export const RuleOf72View: React.FC<RuleOf72ViewProps> = ({
  language,
  viewModel = new RuleOf72ViewModel()
}) => {
  const [uiState, setUiState] = useState<RuleOf72UiState | null>(null);
  const [interestRate, setInterestRate] = useState<number>(10.0);
  const [inflationRate, setInflationRate] = useState<number>(4.0);
  const [initialCapital, setInitialCapital] = useState<number>(100000000);

  useEffect(() => {
    viewModel.calculate(interestRate, inflationRate, initialCapital, 2026).then((state) => setUiState(state));
  }, [interestRate, inflationRate, initialCapital, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const doubling = uiState?.doublingResult;
  const inflation = uiState?.inflationResult;
  const milestones = uiState?.milestones || [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Quy Tắc 72 (Rule of 72 & Compound Milestones)' : 'Rule of 72 & Compound Milestones'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi' 
                ? 'Tính toán tốc độ nhân đôi, nhân ba tài sản và thời gian mất nửa sức mua do lạm phát' 
                : 'Asset doubling velocity calculation & inflation purchasing power halving'}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Lợi nhuận kỳ vọng (%/năm):' : 'Expected Return (%/yr):'}</span>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              step={0.5}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Lạm phát giả định (%/năm):' : 'Inflation Rate (%/yr):'}</span>
            <input
              type="number"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              step={0.5}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Vốn đầu tư ban đầu:' : 'Starting Capital:'}</span>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              step={10000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {doubling && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Doubling Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Thời Gian Nhân Đôi (2X)' : 'Doubling Time (2X)'}
            </span>
            <div className="text-2xl font-extrabold text-teal-400">
              {doubling.yearsToDoubleExact} <span className="text-sm font-normal text-slate-300">{language === 'vi' ? 'năm' : 'years'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'vi' ? `Xấp xỉ Quy tắc 72: ${doubling.yearsToDoubleApproximation} năm` : `Rule 72 approx: ${doubling.yearsToDoubleApproximation} yrs`}
            </p>
          </div>

          {/* Tripling & Quadrupling */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Nhân 3 (3X) & Nhân 4 (4X)' : 'Tripling (3X) & 4X'}
            </span>
            <div className="text-xl font-bold text-slate-100">
              {doubling.yearsToTripleApproximation} / {doubling.yearsToQuadrupleApproximation} <span className="text-xs font-normal text-slate-300">{language === 'vi' ? 'năm' : 'yrs'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'vi' ? 'Quy tắc 114 & Quy tắc 144' : 'Rule of 114 & Rule of 144'}
            </p>
          </div>

          {/* Inflation Halving */}
          {inflation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                {language === 'vi' ? 'Mất Nửa Sức Mua' : 'Inflation Halving'}
              </span>
              <div className="text-2xl font-extrabold text-rose-400">
                {inflation.yearsToHalvePurchasingPower} <span className="text-sm font-normal text-slate-300">{language === 'vi' ? 'năm' : 'years'}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'vi' ? 'Thời gian tiền mặt mất 50% giá trị' : 'Cash loses 50% purchasing power'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compounding Milestones List */}
      {milestones.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            {language === 'vi' ? 'Lộ Trình Tăng Trưởng Tài Sản Đột Phá' : 'Wealth Doubling Trajectory'}
          </h4>

          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.step}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px]">
                    {m.doublingCount}x
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 block">{m.milestoneName}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {language === 'vi' ? `Năm dự kiến: ${m.projectedYear}` : `Projected: Year ${m.projectedYear}`}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-bold text-teal-400">
                  {formatCurrency(m.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
