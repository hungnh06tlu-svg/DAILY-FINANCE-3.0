import React, { useState } from 'react';
import { 
  Language, 
  DeviceViewport, 
  ThemeStyle, 
  ActiveTab, 
  AppScreen, 
  FinancialSpace, 
  Transaction, 
  FeatureModulesState,
  NavigationContext,
  NavigationTarget
} from './types';
import { 
  INITIAL_SPACES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_CREDIT_CARDS, 
  INITIAL_DEBTS, 
  INITIAL_INSTALLMENTS, 
  INITIAL_SIX_JARS, 
  INITIAL_FIRE_CONFIG, 
  DEFAULT_FEATURE_MODULES 
} from './data/initialData';

import { Header } from './components/Header';
import { DeviceFrame } from './components/DeviceFrame';
import { Navigation } from './components/Navigation';
import { AppleGoogleWalletStack } from './components/wallet/AppleGoogleWalletStack';
import { TransactionManager } from './components/transactions/TransactionManager';
import { WealthAndDebtsView } from './components/wealth/WealthAndDebtsView';
import { BudgetingMethodsView } from './components/methods/BudgetingMethodsView';
import { MethodsDashboard } from './components/methods/MethodsDashboard';
import { AiCoachInsights } from './components/ai/AiCoachInsights';
import { ReportsView } from './components/analytics/ReportsView';
import { SmartBackupAndHealthCenter } from './components/backup/SmartBackupAndHealthCenter';
import { FeatureTogglesModal } from './components/modularity/FeatureTogglesModal';
import { DesignBlueprintWorkspace } from './components/blueprint/DesignBlueprintWorkspace';
import { Sprint2DomainInspector } from './components/sprint2/Sprint2DomainInspector';
import { CompositionRoot } from './di/CompositionRoot';
import { resolveWidgetRoute } from './components/widgets/SmartWidgets';

function resolveWidgetRouteWithContext(targetRoute?: string): NavigationTarget | null {
  const screen = resolveWidgetRoute(targetRoute);
  if (!screen) return null;

  const context: NavigationContext = {};
  if (targetRoute) {
    const routeLower = targetRoute.toLowerCase();
    
    if (routeLower.includes('expense') || routeLower.includes('type=expense')) {
      context.transactionType = 'expense';
    } else if (routeLower.includes('income') || routeLower.includes('type=income')) {
      context.transactionType = 'income';
    } else if (routeLower.includes('transfer') || routeLower.includes('type=transfer')) {
      context.transactionType = 'transfer';
    }

    if (routeLower.includes('today') || routeLower.includes('cash_flow')) {
      context.reportPeriod = 'today';
      context.analyticsCategory = 'cash_flow';
    } else if (routeLower.includes('fire')) {
      context.analyticsCategory = 'fire';
      context.goalId = 'fire';
    } else if (routeLower.includes('jar')) {
      context.analyticsCategory = 'jars';
    } else if (routeLower.includes('goal')) {
      context.analyticsCategory = 'saving';
    } else if (routeLower.includes('debt')) {
      context.analyticsCategory = 'debt';
    }
    
    const catMatch = targetRoute.match(/[?&]category=([^&]+)/i);
    if (catMatch) {
      context.category = decodeURIComponent(catMatch[1]);
    }
    
    const goalMatch = targetRoute.match(/[?&]goalId=([^&]+)/i);
    if (goalMatch) {
      context.goalId = decodeURIComponent(goalMatch[1]);
    }

    const budgetMatch = targetRoute.match(/[?&]budgetId=([^&]+)/i);
    if (budgetMatch) {
      context.budgetId = decodeURIComponent(budgetMatch[1]);
    }
  }

  return { screen, context };
}

function isScreenEnabled(screen: AppScreen, modulesState: FeatureModulesState): boolean {
  if (screen === 'dashboard' || screen === 'settings_modules') {
    return true;
  }
  if (screen === 'transactions') {
    return !!(modulesState.incomeExpense || modulesState.transfers);
  }
  if (screen === 'wealth_debts') {
    return !!(
      modulesState.savingsGoals ||
      modulesState.investments ||
      modulesState.loansDebts ||
      modulesState.creditCards ||
      modulesState.installments
    );
  }
  if (screen === 'methods_fire') {
    return !!(
      modulesState.budgetsForecasting ||
      modulesState.sixJars ||
      modulesState.envelopeBudgeting ||
      modulesState.kakeiboJournal ||
      modulesState.snowballAvalanche ||
      modulesState.fireTracking
    );
  }
  if (screen === 'methods_advanced') {
    return !!(
      modulesState.advancedJarUI ||
      modulesState.advancedFireUI ||
      modulesState.fiftyThirtyTwentyUI ||
      modulesState.ruleOf72UI ||
      modulesState.advancedDebtUI ||
      modulesState.zeroBasedBudgetUI ||
      modulesState.sinkingFundUI ||
      modulesState.payYourselfFirstUI ||
      modulesState.fiftyTwoWeekUI ||
      modulesState.dcaUI
    );
  }
  if (screen === 'ai_insights') {
    return !!modulesState.aiInsights;
  }
  if (screen === 'reports') {
    return !!modulesState.incomeExpense;
  }
  return true;
}

export default function App() {
  // Obtain Composition Root Graph at the App Boundary
  const compositionRoot = CompositionRoot.getInstance();

  // Global Workspace Configuration State
  const [language, setLanguage] = useState<Language>('vi');
  const [viewport, setViewport] = useState<DeviceViewport>('phone');
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>('m3-expressive');
  const [activeTab, setActiveTab] = useState<ActiveTab>('prototype');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [showFeatureCustomizer, setShowFeatureCustomizer] = useState(false);

  // App Data State
  const [spaces, setSpaces] = useState<FinancialSpace[]>(INITIAL_SPACES);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(INITIAL_SPACES[0].id);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [modules, setModules] = useState<FeatureModulesState>(DEFAULT_FEATURE_MODULES);
  const [navigationContext, setNavigationContext] = useState<NavigationContext | undefined>(undefined);

  // Contextual Navigation Handler
  const handleNavigate = (target: AppScreen | NavigationTarget | string) => {
    let screen: AppScreen = 'dashboard';
    let context: NavigationContext | undefined = undefined;

    if (typeof target === 'string') {
      if (['dashboard', 'transactions', 'wealth_debts', 'methods_fire', 'methods_advanced', 'ai_insights', 'reports', 'settings_modules'].includes(target)) {
        screen = target as AppScreen;
      } else {
        const resolved = resolveWidgetRouteWithContext(target);
        if (resolved) {
          screen = resolved.screen;
          context = resolved.context;
        } else {
          screen = 'dashboard';
        }
      }
    } else if (typeof target === 'object' && target !== null && 'screen' in target) {
      screen = target.screen;
      context = target.context;
    }

    // Check module features toggled before allowing screen navigation
    if (!isScreenEnabled(screen, modules)) {
      screen = 'settings_modules';
    }

    setNavigationContext(context);
    setCurrentScreen(screen);
  };

  // Handler for Space Transfer
  const handleSpaceTransfer = (
    sourceSpaceId: string, 
    targetSpaceId: string, 
    amount: number, 
    note: string
  ) => {
    setSpaces(prev => prev.map(space => {
      if (space.id === sourceSpaceId) {
        return { ...space, balance: space.balance - amount };
      }
      if (space.id === targetSpaceId) {
        return { ...space, balance: space.balance + amount };
      }
      return space;
    }));

    // Add transfer record
    const sourceSpace = spaces.find(s => s.id === sourceSpaceId);
    const targetSpace = spaces.find(s => s.id === targetSpaceId);

    const newTx: Transaction = {
      id: `tx_transfer_${Date.now()}`,
      type: 'transfer',
      amount,
      currency: 'VND',
      category: language === 'vi' ? 'Chuyển Quỹ (Space Transfer)' : 'Space Transfer',
      spaceId: sourceSpaceId,
      targetSpaceId,
      date: new Date().toISOString(),
      note: `${note} (${sourceSpace?.name} ➔ ${targetSpace?.name})`,
      method: 'bank'
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  // Handler for Adding New Transaction
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx_${Date.now()}`
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update space balance if expense or income
    setSpaces(prev => prev.map(space => {
      if (space.id === newTxData.spaceId) {
        if (newTxData.type === 'expense') {
          return { ...space, balance: space.balance - newTxData.amount };
        }
        if (newTxData.type === 'income') {
          return { ...space, balance: space.balance + newTxData.amount };
        }
      }
      return space;
    }));
  };

  // Handler for Module Toggling
  const handleToggleModule = (key: keyof FeatureModulesState) => {
    setModules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Workspace Top Header */}
      <Header
        language={language}
        setLanguage={setLanguage}
        viewport={viewport}
        setViewport={setViewport}
        themeStyle={themeStyle}
        setThemeStyle={setThemeStyle}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFeatureCustomizer={() => setShowFeatureCustomizer(true)}
      />

      {/* Main Content Area */}
      <main className="py-4 px-2 sm:px-4 max-w-7xl mx-auto">
        {activeTab === 'prototype' ? (
          /* Interactive Android Application Frame Preview */
          <DeviceFrame viewport={viewport} language={language}>
            <div className={`min-h-full flex ${viewport === 'tablet' || viewport === 'foldable' ? 'flex-row' : 'flex-col'}`}>
              {/* Sidebar Navigation for Tablet/Foldable */}
              {(viewport === 'tablet' || viewport === 'foldable') && (
                <Navigation
                  currentScreen={currentScreen}
                  setScreen={handleNavigate}
                  language={language}
                  viewport={viewport}
                />
              )}

              {/* Main Screen Router Canvas */}
              <div className="flex-1 pb-16">
                {currentScreen === 'dashboard' && (
                  <AppleGoogleWalletStack
                    spaces={spaces}
                    selectedSpaceId={selectedSpaceId}
                    onSelectSpace={setSelectedSpaceId}
                    onSpaceTransfer={handleSpaceTransfer}
                    language={language}
                    themeStyle={themeStyle}
                    onNavigateScreen={handleNavigate}
                    homeViewModel={compositionRoot.homeViewModel}
                    dashboardViewModel={compositionRoot.dashboardViewModel}
                    widgetViewModel={compositionRoot.widgetViewModel}
                  />
                )}

                {currentScreen === 'transactions' && (
                  <TransactionManager
                    transactions={transactions}
                    spaces={spaces}
                    selectedSpaceId={selectedSpaceId}
                    onAddTransaction={handleAddTransaction}
                    language={language}
                    navigationContext={navigationContext}
                  />
                )}

                {currentScreen === 'wealth_debts' && (
                  <WealthAndDebtsView
                    savingsGoals={INITIAL_SAVINGS_GOALS}
                    creditCards={INITIAL_CREDIT_CARDS}
                    debts={INITIAL_DEBTS}
                    installments={INITIAL_INSTALLMENTS}
                    language={language}
                    selectedSpaceId={selectedSpaceId}
                    onNavigateScreen={handleNavigate}
                    goalPlannerViewModel={compositionRoot.goalPlannerViewModel}
                    navigationContext={navigationContext}
                  />
                )}

                {currentScreen === 'methods_fire' && (
                  <BudgetingMethodsView
                    sixJars={INITIAL_SIX_JARS}
                    fireConfig={INITIAL_FIRE_CONFIG}
                    language={language}
                    transactions={transactions}
                    budgetViewModel={compositionRoot.budgetViewModel}
                    onNavigateScreen={handleNavigate}
                    navigationContext={navigationContext}
                    modules={modules}
                    debts={INITIAL_DEBTS}
                    initialTab="jars"
                  />
                )}

                {currentScreen === 'methods_advanced' && (
                  <BudgetingMethodsView
                    sixJars={INITIAL_SIX_JARS}
                    fireConfig={INITIAL_FIRE_CONFIG}
                    language={language}
                    transactions={transactions}
                    budgetViewModel={compositionRoot.budgetViewModel}
                    onNavigateScreen={handleNavigate}
                    navigationContext={navigationContext}
                    modules={modules}
                    debts={INITIAL_DEBTS}
                    initialTab="methods_advanced"
                  />
                )}

                {currentScreen === 'ai_insights' && (
                  <AiCoachInsights
                    transactions={transactions}
                    budgets={INITIAL_BUDGETS}
                    language={language}
                    selectedSpaceId={selectedSpaceId}
                    onNavigateScreen={handleNavigate}
                    onAddTransaction={handleAddTransaction}
                    notificationCenterViewModel={compositionRoot.notificationCenterViewModel}
                    habitEngineViewModel={compositionRoot.habitEngineViewModel}
                    automationCenterViewModel={compositionRoot.automationCenterViewModel}
                    aiChatViewModel={compositionRoot.aiChatViewModel}
                    voiceAssistantViewModel={compositionRoot.voiceAssistantViewModel}
                  />
                )}

                {currentScreen === 'reports' && (
                  <ReportsView
                    transactions={transactions}
                    language={language}
                    selectedSpaceId={selectedSpaceId}
                    reportsViewModel={compositionRoot.reportsViewModel}
                    analyticsViewModel={compositionRoot.analyticsViewModel}
                    onNavigateScreen={handleNavigate}
                    navigationContext={navigationContext}
                  />
                )}

                {currentScreen === 'settings_modules' && (
                  <div className="space-y-6">
                    <div className="p-6 text-center space-y-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                      <h2 className="text-base font-bold text-emerald-400">
                        {language === 'vi' ? 'Cấu Hình Module Bật/Tắt' : 'Modular Feature Control'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {language === 'vi' 
                          ? 'Mọi tính năng trong Daily Finance 3.0 đều là tùy chọn độc lập. Bạn có thể bật/tắt bất kỳ module nào.' 
                          : 'Every feature module in Daily Finance 3.0 is modular and independent.'}
                      </p>
                      <button
                        onClick={() => setShowFeatureCustomizer(true)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-lg"
                      >
                        {language === 'vi' ? 'Mở Bảng Bật/Tắt Module' : 'Open Feature Control Panel'}
                      </button>
                    </div>

                    <SmartBackupAndHealthCenter
                      viewModel={compositionRoot.backupAndHealthViewModel}
                      selectedSpaceId={selectedSpaceId}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Floating Navigation for Phone Viewport */}
              {(viewport === 'phone') && (
                <Navigation
                  currentScreen={currentScreen}
                  setScreen={handleNavigate}
                  language={language}
                  viewport={viewport}
                />
              )}
            </div>
          </DeviceFrame>
        ) : activeTab === 'sprint2-domain' ? (
          <Sprint2DomainInspector />
        ) : (
          /* Design System & Architectural Blueprint Specification View */
          <DesignBlueprintWorkspace activeTab={activeTab} language={language} />
        )}
      </main>

      {/* Feature Customizer Modal */}
      <FeatureTogglesModal
        isOpen={showFeatureCustomizer}
        onClose={() => setShowFeatureCustomizer(false)}
        modules={modules}
        onToggleModule={handleToggleModule}
        language={language}
      />
    </div>
  );
}
