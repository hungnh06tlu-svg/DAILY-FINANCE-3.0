import React from 'react';
import { AppScreen, Language, DeviceViewport } from '../types';
import { 
  Wallet, 
  Receipt, 
  TrendingUp, 
  Sparkles, 
  PieChart, 
  Sliders, 
  Target
} from 'lucide-react';

interface NavigationProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  language: Language;
  viewport: DeviceViewport;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  setScreen,
  language,
  viewport
}) => {
  const isLargeScreen = viewport === 'tablet' || viewport === 'foldable';

  const navItems = [
    {
      id: 'dashboard' as AppScreen,
      icon: Wallet,
      labelVi: 'Ví & Quỹ',
      labelEn: 'Wallet',
    },
    {
      id: 'transactions' as AppScreen,
      icon: Receipt,
      labelVi: 'Giao Dịch',
      labelEn: 'Transactions',
    },
    {
      id: 'wealth_debts' as AppScreen,
      icon: TrendingUp,
      labelVi: 'Tài Sản & Nợ',
      labelEn: 'Wealth & Debt',
    },
    {
      id: 'methods_fire' as AppScreen,
      icon: Target,
      labelVi: 'Hũ & FIRE',
      labelEn: 'Jars & FIRE',
    },
    {
      id: 'ai_insights' as AppScreen,
      icon: Sparkles,
      labelVi: 'Trợ Lý AI',
      labelEn: 'AI Coach',
    },
    {
      id: 'reports' as AppScreen,
      icon: PieChart,
      labelVi: 'Báo Cáo',
      labelEn: 'Reports',
    },
    {
      id: 'settings_modules' as AppScreen,
      icon: Sliders,
      labelVi: 'Cấu Hình',
      labelEn: 'Modules',
    }
  ];

  if (isLargeScreen) {
    return (
      <nav className="bg-slate-900 border-r border-slate-800 p-3 flex flex-col gap-2 min-w-[200px]">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {language === 'vi' ? 'Điều Hướng M3' : 'M3 Navigation'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{language === 'vi' ? item.labelVi : item.labelEn}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Floating Material 3 Expressive Bottom Navigation Bar for Mobile Phone Viewport
  return (
    <div className="sticky bottom-0 left-0 right-0 p-2 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 z-40">
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all ${
                isActive ? 'bg-emerald-500/20 ring-2 ring-emerald-500/40 text-emerald-400 scale-105' : 'bg-transparent'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-[58px]">
                {language === 'vi' ? item.labelVi : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
