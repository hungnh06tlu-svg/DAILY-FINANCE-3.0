import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Calculator,
  ToggleLeft,
  ToggleRight,
  Layers,
  Database,
  Code2,
  FileCode2,
  DollarSign,
  PieChart,
  RefreshCw,
  Sparkles,
  Search,
  Activity
} from 'lucide-react';

import { FinancialTruthEngine } from '../../domain/FinancialTruthEngine';
import { FeatureToggleRegistry } from '../../domain/FeatureToggleRegistry';
import {
  MoneyFormatter,
  CurrencyFormatter,
  DateFormatter,
  PercentageFormatter,
  CompactNumberFormatter
} from '../../formatters';
import { Sprint2TestSuite, TestResult } from '../../tests/sprint2_runner';
import { INITIAL_TRANSACTIONS, INITIAL_SPACES, INITIAL_DEBTS } from '../../data/initialData';
import { FeatureConfig, Wallet, Investment, CreditCard, DebtItem } from '../../types';

export const Sprint2DomainInspector: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tests' | 'truth_engine' | 'feature_toggles' | 'formatters' | 'architecture'>('tests');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Financial Truth Engine Interactive Playground State
  const [incomeInput, setIncomeInput] = useState<number>(38000000);
  const [expenseInput, setExpenseInput] = useState<number>(24500000);
  const [liquidWalletInput, setLiquidWalletInput] = useState<number>(85000000);
  const [investmentValInput, setInvestmentValInput] = useState<number>(45000000);
  const [debtValInput, setDebtValInput] = useState<number>(15000000);

  // Formatter Playground State
  const [formatterAmount, setFormatterAmount] = useState<number>(12850000);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('VND');
  const [useTabularNums, setUseTabularNums] = useState<boolean>(true);

  // Feature Toggle Registry State
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>(
    FeatureToggleRegistry.getInstance().getConfig()
  );

  useEffect(() => {
    const registry = FeatureToggleRegistry.getInstance();
    const unsubscribe = registry.subscribe((newConfig) => {
      setFeatureConfig(newConfig);
    });
    // Auto-run tests on load
    runTests();
    return () => unsubscribe();
  }, []);

  const runTests = () => {
    setIsTestRunning(true);
    setTimeout(async () => {
      const results = await Sprint2TestSuite.runAllTests();
      setTestResults(results);
      setIsTestRunning(false);
    }, 200);
  };

  const handleToggleFeature = (featureKey: keyof FeatureConfig) => {
    FeatureToggleRegistry.getInstance().toggleFeature(featureKey);
  };

  // Calculations from FinancialTruthEngine memoized
  const {
    mockWallets,
    mockInvestments,
    mockDebts,
    calculatedNetWorth,
    calculatedCashFlow,
    emergencyFund,
    healthScore,
    sixJars
  } = useMemo(() => {
    const wallets: Wallet[] = [
      {
        id: 'w1',
        spaceId: 'sp_personal',
        name: 'Ví Cá Nhân',
        type: 'bank',
        currency: 'VND',
        initialBalance: 0,
        currentBalance: liquidWalletInput,
        status: 'active'
      }
    ];

    const investments: Investment[] = [
      {
        id: 'inv1',
        spaceId: 'sp_personal',
        name: 'VN30 Fund',
        type: 'fund',
        quantity: 1,
        purchasePrice: investmentValInput * 0.8,
        currentPrice: investmentValInput,
        currency: 'VND'
      }
    ];

    const debts: DebtItem[] = [
      {
        id: 'd1',
        title: 'Khoản Vay',
        type: 'debt',
        originalAmount: debtValInput * 1.2,
        remainingAmount: debtValInput,
        interestRate: 8,
        minimumMonthlyPayment: debtValInput * 0.1,
        counterparty: 'Ngân Hàng',
        dueDate: '2026-12-31'
      }
    ];

    const creditCards: CreditCard[] = [];

    const netWorth = FinancialTruthEngine.calculateNetWorth(
      wallets,
      investments,
      debts,
      creditCards
    );

    const cashFlow = FinancialTruthEngine.calculateCashFlow(incomeInput, expenseInput);
    const emgFund = FinancialTruthEngine.calculateEmergencyFund(wallets, expenseInput || 15000000);
    const hScore = FinancialTruthEngine.calculateFinancialHealth(
      incomeInput,
      expenseInput,
      netWorth,
      debtValInput,
      emgFund.coverageMonths
    );
    const jars = FinancialTruthEngine.calculateSixJars(incomeInput);

    return {
      mockWallets: wallets,
      mockInvestments: investments,
      mockDebts: debts,
      calculatedNetWorth: netWorth,
      calculatedCashFlow: cashFlow,
      emergencyFund: emgFund,
      healthScore: hScore,
      sixJars: jars
    };
  }, [incomeInput, expenseInput, liquidWalletInput, investmentValInput, debtValInput]);

  const totalPassCount = useMemo(() => testResults.filter((r) => r.passed).length, [testResults]);
  const passPercent = useMemo(
    () => (testResults.length > 0 ? Math.round((totalPassCount / testResults.length) * 100) : 0),
    [testResults, totalPassCount]
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 md:p-6 overflow-y-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Sprint 2 Foundation
            </span>
            <span className="text-xs text-slate-400 font-mono">ADR-013 & ADR-011 Verified</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Financial Truth Engine & Domain Foundation</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            100% Pure Business Logic, Feature Toggle Registry, Formatters, Repositories, and Unit Test Suite.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-right">
            <div className="text-xs text-slate-400 uppercase font-mono">Test Suite Pass Rate</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">{passPercent}% ({totalPassCount}/{testResults.length})</div>
          </div>
          <button
            onClick={runTests}
            disabled={isTestRunning}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isTestRunning ? 'animate-spin' : ''}`} />
            <span>{isTestRunning ? 'Running Tests...' : 'Run Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('tests')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'tests'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>100% Unit Tests</span>
          <span className="ml-1 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono">{totalPassCount}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('truth_engine')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'truth_engine'
              ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Financial Truth Engine</span>
        </button>

        <button
          onClick={() => setActiveSubTab('feature_toggles')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'feature_toggles'
              ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ToggleRight className="w-4 h-4" />
          <span>Feature Toggles (ADR-013)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('formatters')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'formatters'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Formatters (ADR-011)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'architecture'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Domain Architecture & Contracts</span>
        </button>
      </div>

      {/* SUB TAB 1: UNIT TEST RESULTS */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Total Unit Tests</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{testResults.length}</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Passed</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{totalPassCount}</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Failed</div>
              <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{testResults.length - totalPassCount}</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Coverage Status</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">100% Pure</div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Sprint 2 Unit Test Execution Logs</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Isolated Pure Runner</span>
            </div>

            <div className="divide-y divide-slate-800">
              {testResults.map((result, idx) => (
                <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    {result.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{result.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{result.message}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-mono font-medium ${
                      result.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: FINANCIAL TRUTH ENGINE PLAYGROUND */}
      {activeSubTab === 'truth_engine' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Input */}
          <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Calculator className="w-5 h-5 text-blue-400" />
              <span>Input Simulation Parameters</span>
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Monthly Income (VND)</label>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Monthly Expense (VND)</label>
              <input
                type="number"
                value={expenseInput}
                onChange={(e) => setExpenseInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Liquid Wallets Balance (VND)</label>
              <input
                type="number"
                value={liquidWalletInput}
                onChange={(e) => setLiquidWalletInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Investment Portfolio Value (VND)</label>
              <input
                type="number"
                value={investmentValInput}
                onChange={(e) => setInvestmentValInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Debts & Liabilities (VND)</label>
              <input
                type="number"
                value={debtValInput}
                onChange={(e) => setDebtValInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              <span className="font-semibold">Note:</span> All calculations on the right are powered strictly by <code className="bg-slate-950 px-1 py-0.5 rounded font-mono">FinancialTruthEngine</code> pure domain functions with 0 side-effects.
            </div>
          </div>

          {/* Engine Calculation Outputs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Net Worth & Cash Flow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Calculated Net Worth</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {MoneyFormatter.format(calculatedNetWorth, 'VND')}
                </div>
                <p className="text-xs text-slate-400 mt-2">Assets - Liabilities</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Net Monthly Cash Flow</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${calculatedCashFlow >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {MoneyFormatter.format(calculatedCashFlow, 'VND')}
                </div>
                <p className="text-xs text-slate-400 mt-2">Income - Expense</p>
              </div>
            </div>

            {/* Financial Health Score Breakdown */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>Financial Health Score Engine</span>
                </h4>
                <span className="text-sm font-bold font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  {healthScore.score} / 100 ({healthScore.status.toUpperCase()})
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Savings Rate</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{healthScore.breakdown.savingsScore}/30</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Debt Ratio</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{healthScore.breakdown.debtScore}/25</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Emergency Fund</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{healthScore.breakdown.emergencyScore}/25</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Net Worth Score</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{healthScore.breakdown.netWorthScore}/20</div>
                </div>
              </div>
            </div>

            {/* Emergency Fund Analysis */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Emergency Fund Coverage</span>
                <span className="text-sm font-mono font-bold text-blue-400">{emergencyFund.coverageMonths} Months</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (emergencyFund.coverageMonths / 6) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>Current: {MoneyFormatter.format(emergencyFund.currentFund, 'VND')}</span>
                <span>6 Months Target: {MoneyFormatter.format(emergencyFund.targetFund6Months, 'VND')}</span>
              </div>
            </div>

            {/* 6 Jars Allocation */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                <span>6 Jars Formula Allocation</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sixJars.map((jar) => (
                  <div key={jar.key} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-white">{jar.nameVi}</span>
                      <span className="text-slate-400 font-mono">{jar.percent}%</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                      {MoneyFormatter.format(jar.currentBalance, 'VND')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: FEATURE TOGGLES REGISTRY (ADR-013) */}
      {activeSubTab === 'feature_toggles' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <ToggleRight className="w-5 h-5 text-purple-400" />
                <span>ADR-013 Feature Toggle Registry</span>
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Dynamic Feature Visibility Registry. No UI component queries feature flags directly.
              </p>
            </div>

            <div className="text-xs font-mono text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
              Flow Subscription Active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(featureConfig) as (keyof FeatureConfig)[]).map((key) => {
              const isEnabled = featureConfig[key];
              return (
                <div
                  key={key}
                  onClick={() => handleToggleFeature(key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    isEnabled
                      ? 'bg-slate-900 border-purple-500/40 hover:border-purple-500/70'
                      : 'bg-slate-950 border-slate-800/80 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-white font-mono">{key}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {isEnabled ? 'Enabled in Domain' : 'Disabled in Domain'}
                    </div>
                  </div>

                  <button className="text-purple-400">
                    {isEnabled ? (
                      <ToggleRight className="w-7 h-7 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB TAB 4: FORMATTERS (ADR-011) */}
      {activeSubTab === 'formatters' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
              <Code2 className="w-5 h-5 text-amber-400" />
              <span>ADR-011 Tabular Numbers & Formatter Testing</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Amount</label>
                <input
                  type="number"
                  value={formatterAmount}
                  onChange={(e) => setFormatterAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Currency</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                >
                  <option value="VND">VND (Việt Nam Đồng)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="JPY">JPY (Japanese Yen)</option>
                  <option value="SGD">SGD (Singapore Dollar)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="tabNumCheck"
                  checked={useTabularNums}
                  onChange={(e) => setUseTabularNums(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <label htmlFor="tabNumCheck" className="text-sm text-slate-200 cursor-pointer">
                  Enable ADR-011 Tabular Numbers CSS
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-mono">MoneyFormatter Output</div>
                <div className={`text-xl font-bold text-amber-400 mt-2 ${useTabularNums ? 'tabular-nums' : ''}`}>
                  {MoneyFormatter.format(formatterAmount, selectedCurrency, 'vi')}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-mono">CompactNumberFormatter Output</div>
                <div className="text-xl font-bold text-amber-400 mt-2 font-mono">
                  {CompactNumberFormatter.format(formatterAmount, 'vi')}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-mono">PercentageFormatter Output</div>
                <div className="text-xl font-bold text-amber-400 mt-2 font-mono">
                  {PercentageFormatter.format(12.845, 1, true)}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-mono">DateFormatter Relative Output</div>
                <div className="text-xl font-bold text-amber-400 mt-2">
                  {DateFormatter.formatRelative(new Date().toISOString(), 'vi')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 5: DOMAIN ARCHITECTURE & CONTRACTS */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-3">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Sprint 2 Clean Architecture Domain Map</span>
            </h3>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div>
                <span className="text-emerald-400 font-bold">1. Root Aggregate:</span> FinancialSpace → Personal, Family, Company, Class, Travel, Custom
              </div>
              <div>
                <span className="text-blue-400 font-bold">2. Financial Domain Engine:</span> FinancialTruthEngine (Pure, 0 side-effects, 100% Kotlin/TS mathematical accuracy)
              </div>
              <div>
                <span className="text-purple-400 font-bold">3. Feature Toggle Registry:</span> FeatureToggleRegistry (ADR-013 Reactive Flow)
              </div>
              <div>
                <span className="text-amber-400 font-bold">4. Formatters:</span> MoneyFormatter, CurrencyFormatter, DateFormatter, PercentageFormatter, CompactNumberFormatter (ADR-011 Tabular Numbers)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">5. Repository Contracts:</span> TransactionRepository, WalletRepository, BudgetRepository, SavingRepository, InvestmentRepository, LoanRepository, ReportRepository, DashboardRepository, AIRepository, BackupRepository, PreferenceRepository, FeatureRepository
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
