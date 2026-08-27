import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { FiftyTwoWeekViewModel, FiftyTwoWeekUiState } from '../../viewmodels/methods/FiftyTwoWeekViewModel';
import { MoneyFormatter } from '../../formatters';
import { Award, Flame, CheckCircle2, Circle, Calendar, Sparkles } from 'lucide-react';
import { FiftyTwoWeekMode } from '../../domain/methods/types';

interface FiftyTwoWeekViewProps {
  language: Language;
  viewModel?: FiftyTwoWeekViewModel;
}

export const FiftyTwoWeekView: React.FC<FiftyTwoWeekViewProps> = ({
  language,
  viewModel = new FiftyTwoWeekViewModel()
}) => {
  const [uiState, setUiState] = useState<FiftyTwoWeekUiState | null>(null);
  const [baseIncrement, setBaseIncrement] = useState<number>(10000);
  const [mode, setMode] = useState<FiftyTwoWeekMode>('standard');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([1, 2, 3, 4]);

  useEffect(() => {
    viewModel.getScheduleAndProgress(baseIncrement, mode, completedWeeks)
      .then((state) => setUiState(state));
  }, [baseIncrement, mode, completedWeeks, viewModel]);

  const toggleWeek = (weekNumber: number) => {
    if (completedWeeks.includes(weekNumber)) {
      setCompletedWeeks(completedWeeks.filter((w) => w !== weekNumber));
    } else {
      setCompletedWeeks([...completedWeeks, weekNumber].sort((a, b) => a - b));
    }
  };

  const formatCurrency = (val: number) => MoneyFormatter.format(val, 'VND', language);

  const schedule = uiState?.schedule;
  const progress = uiState?.progress;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              {language === 'vi' ? 'Thử Thách Tiết Kiệm 52 Tuần (52-Week Money Challenge)' : '52-Week Money Challenge'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Rèn luyện kỷ luật tài chính với 52 bước tích lũy tăng dần, đảo ngược hoặc linh hoạt'
                : 'Build unbreakable saving momentum across 52 progressive or reverse weekly milestones'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Bước tăng mỗi tuần:' : 'Weekly Base Increment:'}</span>
            <input
              type="number"
              value={baseIncrement}
              onChange={(e) => setBaseIncrement(Math.max(1000, Number(e.target.value)))}
              step={5000}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-slate-400 block">{language === 'vi' ? 'Chế độ thử thách:' : 'Challenge Mode:'}</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as FiftyTwoWeekMode)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="standard">{language === 'vi' ? 'Tăng dần tiêu chuẩn (Tuần 1: 10k -> Tuần 52: 520k)' : 'Standard Progressive'}</option>
              <option value="reverse">{language === 'vi' ? 'Đảo ngược giảm dần (Tuần 1: 520k -> Tuần 52: 10k)' : 'Reverse Challenge'}</option>
              <option value="flat">{language === 'vi' ? 'Cố định hàng tuần (Đều nhau mỗi tuần)' : 'Flat Weekly Equal'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      {progress && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Tổng Đã Tích Lũy' : 'Total Saved'}
            </span>
            <div className="text-2xl font-extrabold text-amber-400">
              {formatCurrency(progress.totalSaved)}
            </div>
            <p className="text-[10px] text-slate-400">
              {progress.completedWeeksCount} / {progress.totalWeeksCount} {language === 'vi' ? 'tuần hoàn thành' : 'weeks completed'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Mục Tiêu Năm' : 'Total 52-Week Goal'}
            </span>
            <div className="text-2xl font-extrabold text-slate-100">
              {formatCurrency(progress.totalGoal)}
            </div>
            <p className="text-[10px] text-slate-400">
              {progress.progressPercent}% {language === 'vi' ? 'tiến độ tổng thể' : 'overall progress'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Chuỗi Tuần Liên Tục' : 'Current Streak'}
            </span>
            <div className="text-2xl font-extrabold text-orange-400 flex items-center gap-1.5">
              <Flame className="w-6 h-6" />
              {progress.currentStreak} <span className="text-xs font-normal text-slate-400">{language === 'vi' ? 'tuần' : 'weeks'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'vi' ? 'Giữ vững chuỗi streak để tạo thói quen' : 'Maintain momentum for long-term habits'}
            </p>
          </div>
        </div>
      )}

      {/* Week Grid (First 12 Weeks preview for responsive performance) */}
      {schedule && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            {language === 'vi' ? 'Danh Sách 52 Tuần (Nhấp để đánh dấu hoàn thành)' : '52 Weekly Checkpoints (Click to Toggle)'}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
            {schedule.items.map((item) => {
              const isDone = completedWeeks.includes(item.weekNumber);
              return (
                <button
                  key={item.weekNumber}
                  onClick={() => toggleWeek(item.weekNumber)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    isDone
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold">Tuần {item.weekNumber}</span>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className="text-xs font-bold mt-1">
                    {formatCurrency(item.scheduledAmount)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
