import React, { useState } from 'react';
import { 
  Language, 
  FeatureModulesState, 
  Jar, 
  JarTarget, 
  FireConfig, 
  DebtItem, 
  Transaction,
  AppScreen
} from '../../types';
import { AdvancedJarView } from './AdvancedJarView';
import { AdvancedFireView } from './AdvancedFireView';
import { FiftyThirtyTwentyView } from './FiftyThirtyTwentyView';
import { RuleOf72View } from './RuleOf72View';
import { AdvancedDebtView } from './AdvancedDebtView';
import { ZeroBasedBudgetView } from './ZeroBasedBudgetView';
import { SinkingFundView } from './SinkingFundView';
import { PayYourselfFirstView } from './PayYourselfFirstView';
import { FiftyTwoWeekView } from './FiftyTwoWeekView';
import { DCAView } from './DCAView';
import { 
  Layers, 
  Flame, 
  PieChart, 
  Calculator, 
  ShieldAlert, 
  Target, 
  Calendar, 
  Wallet, 
  Award, 
  TrendingUp,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

interface MethodsDashboardProps {
  language: Language;
  modules?: FeatureModulesState;
  jars?: Jar[];
  targets?: JarTarget[];
  fireConfig?: FireConfig;
  debts?: DebtItem[];
  transactions?: Transaction[];
  onNavigateScreen?: (screen: AppScreen) => void;
}

export type FinancialMethodTab = 
  | 'advanced_jar'
  | 'advanced_fire'
  | 'fifty_thirty_twenty'
  | 'rule_of_72'
  | 'advanced_debt'
  | 'zero_based_budget'
  | 'sinking_fund'
  | 'pay_yourself_first'
  | 'fifty_two_week'
  | 'dca';

export const MethodsDashboard: React.FC<MethodsDashboardProps> = ({
  language,
  modules,
  jars = [],
  targets = [],
  fireConfig,
  debts = [],
  transactions = [],
  onNavigateScreen
}) => {
  const [activeTab, setActiveTab] = useState<FinancialMethodTab>('advanced_jar');

  const methodsList: {
    id: FinancialMethodTab;
    nameVi: string;
    nameEn: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
    color: string;
  }[] = [
    { id: 'advanced_jar', nameVi: '6 Hũ Nâng Cao', nameEn: 'Multi-Space 6 Jars', icon: Layers, category: 'Budgeting', color: 'emerald' },
    { id: 'advanced_fire', nameVi: '5 Mô Hình FIRE', nameEn: '5 FIRE Variants', icon: Flame, category: 'Independence', color: 'orange' },
    { id: 'fifty_thirty_twenty', nameVi: 'Quy Tắc 50/30/20', nameEn: '50/30/20 Rule', icon: PieChart, category: 'Budgeting', color: 'indigo' },
    { id: 'rule_of_72', nameVi: 'Quy Tắc 72 & Tăng Trưởng', nameEn: 'Rule of 72', icon: Calculator, category: 'Investing', color: 'teal' },
    { id: 'advanced_debt', nameVi: 'Trả Nợ Snowball / Avalanche', nameEn: 'Debt Acceleration', icon: ShieldAlert, category: 'Liabilities', color: 'rose' },
    { id: 'zero_based_budget', nameVi: 'Ngân Sách Zero-Based', nameEn: 'Zero-Based Budget', icon: Target, category: 'Budgeting', color: 'blue' },
    { id: 'sinking_fund', nameVi: 'Quỹ Chìm Sinking Funds', nameEn: 'Sinking Funds', icon: Calendar, category: 'Planning', color: 'cyan' },
    { id: 'pay_yourself_first', nameVi: 'Trả Cho Mình Trước', nameEn: 'Pay Yourself First', icon: Wallet, category: 'Savings', color: 'emerald' },
    { id: 'fifty_two_week', nameVi: 'Thử Thách 52 Tuần', nameEn: '52-Week Challenge', icon: Award, category: 'Discipline', color: 'amber' },
    { id: 'dca', nameVi: 'Đầu Tư Bình Quân Giá (DCA)', nameEn: 'DCA Investing', icon: TrendingUp, category: 'Investing', color: 'emerald' }
  ];

  const filteredMethods = methodsList.filter((m) => {
    if (!modules) return true;
    switch (m.id) {
      case 'advanced_jar': return modules.advancedJarUI !== false;
      case 'advanced_fire': return modules.advancedFireUI !== false;
      case 'fifty_thirty_twenty': return modules.fiftyThirtyTwentyUI !== false;
      case 'rule_of_72': return modules.ruleOf72UI !== false;
      case 'advanced_debt': return modules.advancedDebtUI !== false;
      case 'zero_based_budget': return modules.zeroBasedBudgetUI !== false;
      case 'sinking_fund': return modules.sinkingFundUI !== false;
      case 'pay_yourself_first': return modules.payYourselfFirstUI !== false;
      case 'fifty_two_week': return modules.fiftyTwoWeekUI !== false;
      case 'dca': return modules.dcaUI !== false;
      default: return true;
    }
  });

  React.useEffect(() => {
    if (filteredMethods.length > 0 && !filteredMethods.some((m) => m.id === activeTab)) {
      setActiveTab(filteredMethods[0].id);
    }
  }, [filteredMethods, activeTab]);

  if (filteredMethods.length === 0) {
    return (
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-200">
            {language === 'vi' ? 'Tất cả phương pháp nâng cao đang bị tắt' : 'All Advanced Methods are disabled'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {language === 'vi'
              ? 'Vui lòng bật lại các tính năng này trong Cài đặt tính năng (Feature Toggles) để hiển thị bảng điều khiển.'
              : 'Please enable these features in Feature Toggles to view the dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{language === 'vi' ? 'Hệ Thống Phương Pháp Tài Chính Toàn Diện' : 'Financial Methods Engine Suite (D2-003)'}</span>
          </div>
          <h2 className="text-xl font-black text-slate-100">
            {language === 'vi' ? '10 Trường Phái & Chiến Lược Quản Trị Tài Chính' : '10 Financial Philosophies & Methodologies'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Tích hợp chuẩn xác các công thức toán học tài chính: phân bổ hũ đa không gian, 5 mô hình FIRE, 50/30/20, Rule 72, Snowball/Avalanche, Zero-Based, Sinking Funds, Pay Yourself First, 52 Tuần và DCA.'
              : 'Empowering wealth building through verified financial engines: Multi-Space Jars, 5 FIRE variants, 50/30/20, Rule 72, Debt payoff, ZBB, Sinking funds, Pay Yourself First, 52-Week & DCA.'}
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {filteredMethods.map((m) => {
          const Icon = m.icon;
          const isActive = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{language === 'vi' ? m.nameVi : m.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Active Method View Container */}
      <div className="transition-all duration-300">
        {activeTab === 'advanced_jar' && (
          <AdvancedJarView language={language} jars={jars} targets={targets} />
        )}
        {activeTab === 'advanced_fire' && (
          <AdvancedFireView language={language} fireConfig={fireConfig} />
        )}
        {activeTab === 'fifty_thirty_twenty' && (
          <FiftyThirtyTwentyView language={language} transactions={transactions} />
        )}
        {activeTab === 'rule_of_72' && (
          <RuleOf72View language={language} />
        )}
        {activeTab === 'advanced_debt' && (
          <AdvancedDebtView language={language} debts={debts} />
        )}
        {activeTab === 'zero_based_budget' && (
          <ZeroBasedBudgetView language={language} transactions={transactions} />
        )}
        {activeTab === 'sinking_fund' && (
          <SinkingFundView language={language} />
        )}
        {activeTab === 'pay_yourself_first' && (
          <PayYourselfFirstView language={language} />
        )}
        {activeTab === 'fifty_two_week' && (
          <FiftyTwoWeekView language={language} />
        )}
        {activeTab === 'dca' && (
          <DCAView language={language} />
        )}
      </div>
    </div>
  );
};
