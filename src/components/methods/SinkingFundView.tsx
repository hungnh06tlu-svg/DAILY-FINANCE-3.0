import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { SinkingFundViewModel, SinkingFundUiState } from '../../viewmodels/methods/SinkingFundViewModel';
import { MoneyFormatter } from '../../formatters';
import { Calendar, Target, ShieldCheck, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';

interface SinkingFundViewProps {
  language: Language;
  viewModel?: SinkingFundViewModel;
}

export const SinkingFundView: React.FC<SinkingFundViewProps> = ({
  language,
  viewModel = new SinkingFundViewModel()
}) => {
  const [uiState, setUiState] = useState<SinkingFundUiState | null>(null);
  const [targetAmount, setTargetAmount] = useState<number>(36000000);
  const [currentAmount, setCurrentAmount] = useState<number>(12000000);
  const [targetDate, setTargetDate] = useState<string>('2027-08-31');

  useEffect(() => {
    viewModel.calculateFund(targetAmount, currentAmount, targetDate, new Date('2026-09-01'))
      .then((state) => setUiState(state));
  }, [targetAmount, currentAmount, targetDate, viewModel]);

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const contrib = uiState?.contribution;
  const schedule = uiState?.schedule || [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Quỹ Chìm Định Kỳ (Sinking Funds - No Double Count)' : 'Sinking Funds (No Double Count Invariant)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Tích lũy đều đặn cho các khoản chi lớn trong tương lai (Bảo hiểm, du lịch, học phí) mà không làm xáo trộn ngân sách sinh hoạt'
                : 'Accumulate systematically for upcoming periodic expenses without distorting operating cash flow'}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Số tiền mục tiêu:' : 'Target Amount:'}</span>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              step={5000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Hiện đã có:' : 'Current Saved:'}</span>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(Number(e.target.value))}
              step={1000000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Hạn chót mục tiêu:' : 'Deadline Target:'}</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Target Result Metric */}
      {contrib && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Số Tiền Cần Tích Lũy Mỗi Tháng' : 'Recommended Monthly Contribution'}
            </span>
            <div className="text-2xl font-extrabold text-cyan-400">
              {formatCurrency(contrib.recommendedMonthlyContribution)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? `Thời gian còn lại: ${contrib.monthsRemaining} tháng` : `Remaining horizon: ${contrib.monthsRemaining} months`}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Số Tiền Còn Thiếu' : 'Remaining To Save'}
            </span>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(contrib.remainingAmount)}
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Nguyên tắc an toàn: Không tính trùng vào chi phí sinh hoạt' : 'Safe Invariant: Disjoint from operating expenses'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
