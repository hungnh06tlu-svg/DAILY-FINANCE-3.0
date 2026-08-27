import React from 'react';
import { FeatureModulesState, Language } from '../../types';
import { DEFAULT_FEATURE_MODULES } from '../../data/initialData';
import { Sliders, Check, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';

interface FeatureTogglesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules?: FeatureModulesState;
  onToggleModule: (key: keyof FeatureModulesState) => void;
  language: Language;
}

export const FeatureTogglesModal: React.FC<FeatureTogglesModalProps> = ({
  isOpen,
  onClose,
  modules = DEFAULT_FEATURE_MODULES,
  onToggleModule,
  language
}) => {
  if (!isOpen) return null;

  const moduleList: { key: keyof FeatureModulesState; nameVi: string; nameEn: string; category: string }[] = [
    { key: 'incomeExpense', nameVi: 'Thu Nhập & Chi Phí Cơ Bản', nameEn: 'Income & Expense', category: 'Core' },
    { key: 'transfers', nameVi: 'Chuyển Khoản & Chuyển Quỹ', nameEn: 'Transfers & Space Transfer', category: 'Core' },
    { key: 'multiSpaces', nameVi: 'Đa Không Gian (Cá nhân, Gia đình, Công ty)', nameEn: 'Multiple Financial Spaces', category: 'Core' },
    { key: 'savingsGoals', nameVi: 'Mục Tiêu Tiết Kiệm & Quỹ Khẩn Cấp', nameEn: 'Savings Goals & Emergency Fund', category: 'Wealth' },
    { key: 'investments', nameVi: 'Đầu Tư & Chứng Khoán', nameEn: 'Investments & Stocks', category: 'Wealth' },
    { key: 'creditCards', nameVi: 'Quản Lý Thẻ Tín Dụng & Hạn Mức', nameEn: 'Credit Card Limits & Billing', category: 'Liabilities' },
    { key: 'loansDebts', nameVi: 'Khoản Vay & Khoản Nợ', nameEn: 'Loans & Debts', category: 'Liabilities' },
    { key: 'installments', nameVi: 'Theo Dõi Trả Góp 0%', nameEn: 'Installment Tracking', category: 'Liabilities' },
    { key: 'snowballAvalanche', nameVi: 'Chiến Lược Trả Nợ Snowball / Avalanche', nameEn: 'Snowball & Avalanche Strategy', category: 'Liabilities' },
    { key: 'sixJars', nameVi: 'Phương Pháp 6 Hũ Harv Eker', nameEn: 'Six Jars Method', category: 'Methods' },
    { key: 'envelopeBudgeting', nameVi: 'Quản Lý Ngân Sách Phong Bì', nameEn: 'Envelope Budgeting System', category: 'Methods' },
    { key: 'kakeiboJournal', nameVi: 'Sổ Sách Kakeibo Nhật Bản', nameEn: 'Kakeibo Journaling', category: 'Methods' },
    { key: 'fireTracking', nameVi: 'Độc Lập Tài Chính FIRE & Coast FIRE', nameEn: 'FIRE Independence Tracking', category: 'Methods' },
    { key: 'advancedJarUI', nameVi: '6 Hũ Nâng Cao Đa Không Gian (UI)', nameEn: 'Advanced Multi-Space 6 Jars (UI)', category: 'Methods Suite' },
    { key: 'advancedFireUI', nameVi: '5 Mô Hình FIRE Toàn Diện (UI)', nameEn: '5 FIRE Models Suite (UI)', category: 'Methods Suite' },
    { key: 'fiftyThirtyTwentyUI', nameVi: 'Quy Tắc 50/30/20 (UI)', nameEn: '50/30/20 Rule (UI)', category: 'Methods Suite' },
    { key: 'ruleOf72UI', nameVi: 'Quy Tắc 72 & Tăng Trưởng (UI)', nameEn: 'Rule of 72 & Doubling (UI)', category: 'Methods Suite' },
    { key: 'advancedDebtUI', nameVi: 'Chiến Lược Trả Nợ Snowball/Avalanche (UI)', nameEn: 'Debt Snowball & Avalanche (UI)', category: 'Methods Suite' },
    { key: 'zeroBasedBudgetUI', nameVi: 'Ngân Sách Zero-Based ZBB (UI)', nameEn: 'Zero-Based Budget (UI)', category: 'Methods Suite' },
    { key: 'sinkingFundUI', nameVi: 'Quỹ Chìm Sinking Funds (UI)', nameEn: 'Sinking Funds (UI)', category: 'Methods Suite' },
    { key: 'payYourselfFirstUI', nameVi: 'Trả Cho Mình Trước (UI)', nameEn: 'Pay Yourself First (UI)', category: 'Methods Suite' },
    { key: 'fiftyTwoWeekUI', nameVi: 'Thử Thách 52 Tuần (UI)', nameEn: '52-Week Money Challenge (UI)', category: 'Methods Suite' },
    { key: 'dcaUI', nameVi: 'Đầu Tư Bình Quân Giá DCA (UI)', nameEn: 'Dollar-Cost Averaging DCA (UI)', category: 'Methods Suite' },
    { key: 'budgetsForecasting', nameVi: 'Dự Báo & Lập Ngân Sách', nameEn: 'Budgets & Cashflow Forecasting', category: 'Planning' },
    { key: 'aiInsights', nameVi: 'Cố Vấn Tài Chính Gemini AI', nameEn: 'Gemini AI Financial Coach', category: 'Intelligence' },
    { key: 'voiceInput', nameVi: 'Nhập Liệu Giọng Nói AI', nameEn: 'AI Voice Command Input', category: 'Intelligence' },
    { key: 'ocrReceipt', nameVi: 'Quét Hóa Đơn Tự Động OCR', nameEn: 'OCR Receipt Scanner', category: 'Intelligence' },
    { key: 'googleDriveBackup', nameVi: 'Đồng Bộ Backup Google Drive', nameEn: 'Google Drive Sync Simulation', category: 'System' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
          <div>
            <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              <span>{language === 'vi' ? 'Cấu Hình Module Bật/Tắt (Feature Modularity)' : 'Modular Feature Control Panel'}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'vi' ? 'Tất cả các tính năng đều là TÙY CHỌN. Người dùng có thể bật/tắt theo nhu cầu sử dụng.' : 'Every module is optional. Users can enable or disable features on demand.'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full text-lg">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {moduleList.map((mod) => {
            const isEnabled = modules[mod.key];
            return (
              <div
                key={mod.key}
                onClick={() => onToggleModule(mod.key)}
                className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                    {mod.category}
                  </span>
                  <span className="font-semibold">{language === 'vi' ? mod.nameVi : mod.nameEn}</span>
                </div>

                <div className="text-xl">
                  {isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md text-xs"
          >
            {language === 'vi' ? 'Hoàn Tất Cấu Hình' : 'Save Feature Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
