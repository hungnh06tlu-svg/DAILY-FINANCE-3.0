import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { DCAViewModel, DCAUiState } from '../../viewmodels/methods/DCAViewModel';
import { MoneyFormatter } from '../../formatters';
import { TrendingUp, BarChart2, ShieldCheck, Trophy, Sparkles, AlertCircle } from 'lucide-react';

interface DCAViewProps {
  language: Language;
  viewModel?: DCAViewModel;
}

export const DCAView: React.FC<DCAViewProps> = ({
  language,
  viewModel = new DCAViewModel()
}) => {
  const [uiState, setUiState] = useState<DCAUiState | null>(null);
  const [monthlyInvest, setMonthlyInvest] = useState<number>(5000000);

  // Sample fluctuating asset price history
  const samplePrices = [100000, 92000, 85000, 78000, 88000, 95000, 110000, 125000];

  useEffect(() => {
    viewModel.compareDCAvsLumpSum(monthlyInvest, samplePrices).then((state) => setUiState(state));
  }, [monthlyInvest, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const comp = uiState?.comparison;
  const dca = uiState?.simulation;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Bình Quân Giá Đầu Tư (DCA vs Lump-Sum)' : 'Dollar-Cost Averaging (DCA vs Lump-Sum)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Tự động tính toán giá vốn trung bình, tối ưu tâm lý và so sánh định lượng với đầu tư một lần'
                : 'Automated cost basis averaging, volatility buffering and empirical comparison with Lump-Sum'}
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {language === 'vi' ? 'Số tiền đầu tư mỗi kỳ (DCA amount):' : 'Periodic Investment Amount:'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={monthlyInvest}
              onChange={(e) => setMonthlyInvest(Math.max(500000, Number(e.target.value)))}
              step={1000000}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-emerald-400 font-bold">{formatCurrency(monthlyInvest)}</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      {comp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DCA Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" />
                {language === 'vi' ? 'Chiến Lược DCA (Đều đặn)' : 'DCA Strategy'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold">
                {dca?.totalReturnPercent ?? 0}% ROI
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(dca?.finalPortfolioValue ?? 0)}
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>{language === 'vi' ? 'Giá vốn trung bình: ' : 'Average cost basis: '} <b className="text-slate-200">{formatCurrency(comp.dcaAverageCost)}/đơn vị</b></div>
              <div>{language === 'vi' ? 'Tổng vốn đã bỏ ra: ' : 'Total capital: '} <b className="text-slate-200">{formatCurrency(dca?.totalCapitalInvested ?? 0)}</b></div>
            </div>
          </div>

          {/* Lump Sum Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {language === 'vi' ? 'Đầu Tư Một Lần (Lump-Sum)' : 'Lump-Sum Investing'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold">
                {comp.lumpSum.totalReturnPercent}% ROI
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(comp.lumpSum.finalPortfolioValue)}
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>{language === 'vi' ? 'Giá vốn mua ban đầu: ' : 'Initial entry price: '} <b className="text-slate-200">{formatCurrency(comp.lumpSumCost)}/đơn vị</b></div>
              <div>{language === 'vi' ? 'Tổng vốn đã bỏ ra: ' : 'Total capital: '} <b className="text-slate-200">{formatCurrency(comp.lumpSum.totalCapitalInvested)}</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
