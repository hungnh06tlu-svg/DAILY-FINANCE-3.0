/**
 * Daily Finance 3.0 - SnapshotBuilder
 * Builder for FinancialSnapshot Read Model
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial calculations stored directly in this builder.
 * Delegates 100% of arithmetic and evaluation logic to Domain Engines.
 */

import {
  Wallet,
  Transaction,
  Budget,
  SavingsGoal,
  Investment,
  DebtItem,
  CreditCard,
  Jar,
  FireProfile,
  Language
} from '../types';

import {
  FinancialSnapshot,
  SavingsSnapshotProgress,
  InvestmentSnapshotValue,
  DebtSnapshotSummary,
  BudgetSnapshotSummary,
  SixJarsSnapshotSummary,
  FIRESnapshotProgress,
  EmergencyFundSnapshot,
  HealthScoreSnapshot
} from './FinancialSnapshot';

import { FinancialTruthEngine } from './FinancialTruthEngine';
import { BudgetEngine } from './BudgetEngine';
import { SixJarsEngine } from './SixJarsEngine';
import { FIREEngine } from './FIREEngine';
import { AICoachEngine } from './AICoachEngine';
import { SpaceIsolationGuard, MoneyUtils } from './CanonicalFinancialModel';

export interface SnapshotBuilderInputs {
  spaceId?: string;
  currency?: string;
  language?: Language;
  wallets?: Wallet[];
  transactions?: Transaction[];
  budgets?: Budget[];
  savingsGoals?: SavingsGoal[];
  investments?: Investment[];
  debts?: DebtItem[];
  creditCards?: CreditCard[];
  sixJars?: Jar[];
  fireProfile?: FireProfile;
}

export class SnapshotBuilder {
  /**
   * Orchestrates read-model projection build without performing direct calculations.
   */
  public static build(inputs: SnapshotBuilderInputs): FinancialSnapshot {
    const spaceId = inputs.spaceId ? SpaceIsolationGuard.validateSpaceId(inputs.spaceId) : 'sp_personal';
    const currency = inputs.currency || 'VND';
    const language: Language = inputs.language || 'vi';

    const wallets = inputs.wallets || [];
    const transactions = inputs.transactions || [];
    const budgets = inputs.budgets || [];
    const savingsGoals = inputs.savingsGoals || [];
    const investments = inputs.investments || [];
    const debts = inputs.debts || [];
    const creditCards = inputs.creditCards || [];
    const sixJars = inputs.sixJars || SixJarsEngine.getDefaultJarsTemplate(spaceId);
    const fireProfile = inputs.fireProfile;

    // 1. Cash Balance & Net Worth (Delegated strictly to FinancialTruthEngine)
    const cashBalance = FinancialTruthEngine.calculateBalance(transactions, 0, spaceId);
    const netWorth = FinancialTruthEngine.calculateNetWorth(
      wallets,
      investments,
      debts,
      creditCards,
      spaceId
    );

    // 2. Current Month Cashflow (Delegated strictly to FinancialTruthEngine)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const monthlyIncome = FinancialTruthEngine.calculateIncome(transactions, startOfMonth, endOfMonth, spaceId);
    const monthlyExpense = FinancialTruthEngine.calculateExpense(transactions, startOfMonth, endOfMonth, spaceId);

    // 3. Savings Progress (Delegated to FinancialTruthEngine & Clean Aggregation)
    let totalSaved = 0;
    let targetAmount = 0;
    let activeGoalsCount = 0;
    let emergencyFundBalance = 0;

    for (const goal of savingsGoals) {
      if (goal.isSoftDeleted || (goal as any).isDeleted || goal.status === 'archived') continue;
      activeGoalsCount++;
      const currentAmount = goal.currentAmount || 0;
      const targetAmountVal = goal.targetAmount || 0;
      totalSaved += currentAmount;
      targetAmount += targetAmountVal;

      if (
        goal.category === 'emergency' ||
        (goal.title && (goal.title.toLowerCase().includes('khẩn cấp') || goal.title.toLowerCase().includes('emergency')))
      ) {
        emergencyFundBalance += currentAmount;
      }
    }

    const savingsProgressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalSaved / targetAmount) * 100)) : 0;

    const savingsProgress: SavingsSnapshotProgress = {
      totalSaved: MoneyUtils.round(totalSaved, 0),
      targetAmount: MoneyUtils.round(targetAmount, 0),
      progressPercent: savingsProgressPercent,
      activeGoalsCount,
      emergencyFundBalance: MoneyUtils.round(emergencyFundBalance, 0)
    };

    // 4. Investment Value (Delegated directly to FinancialTruthEngine)
    const invReturn = FinancialTruthEngine.calculateInvestmentReturn(investments, spaceId);
    const activeAssetCount = investments.filter(i => !i.isSoftDeleted && !(i as any).isDeleted && i.status !== 'archived').length;

    const investmentValue: InvestmentSnapshotValue = {
      totalPortfolioValue: invReturn.currentValue,
      totalCostBasis: invReturn.totalInvested,
      totalUnrealizedGain: invReturn.totalReturn,
      roiPercent: invReturn.returnPercent,
      activeAssetCount
    };

    // 5. Debt Summary (Delegated to FinancialTruthEngine & Clean Aggregation)
    let totalDebtOwed = 0;
    let totalLoansGiven = 0;
    let activeDebtsCount = 0;
    let monthlyMinDebtPayment = 0;

    for (const debt of debts) {
      if (debt.isSoftDeleted || (debt as any).isDeleted || debt.status === 'archived') continue;
      activeDebtsCount++;
      const rem = debt.remainingAmount || 0;
      if (debt.type === 'debt') {
        totalDebtOwed += rem;
        monthlyMinDebtPayment += debt.minimumMonthlyPayment || 0;
      } else if (debt.type === 'loan') {
        totalLoansGiven += rem;
      }
    }

    const debtSummary: DebtSnapshotSummary = {
      totalDebtOwed: MoneyUtils.round(totalDebtOwed, 0),
      totalLoansGiven: MoneyUtils.round(totalLoansGiven, 0),
      netDebt: MoneyUtils.round(totalDebtOwed - totalLoansGiven, 0),
      activeDebtsCount,
      monthlyMinDebtPayment: MoneyUtils.round(monthlyMinDebtPayment, 0)
    };

    // 6. Budget Summary (Delegated to BudgetEngine & FinancialTruthEngine)
    let totalAllocated = 0;
    let totalSpent = 0;
    let overspentBudgetsCount = 0;
    let activeBudgetsCount = 0;

    const monthTxs = transactions.filter(tx => tx.date >= startOfMonth && tx.date <= endOfMonth);

    for (const budget of budgets) {
      if (budget.status === 'archived' || (budget as any).isDeleted) continue;
      activeBudgetsCount++;
      const prog = BudgetEngine.evaluateProgress(budget, monthTxs, language);
      const allocated = budget.allocatedAmount || 0;
      totalAllocated += allocated;
      totalSpent += prog.used;
      if (prog.used > allocated || prog.remaining < 0) {
        overspentBudgetsCount++;
      }
    }

    const budgetSummary: BudgetSnapshotSummary = {
      totalAllocated: MoneyUtils.round(totalAllocated, 0),
      totalSpent: MoneyUtils.round(totalSpent, 0),
      totalRemaining: MoneyUtils.round(Math.max(0, totalAllocated - totalSpent), 0),
      activeBudgetsCount,
      overspentBudgetsCount
    };

    // 7. Six Jars Summary (Delegated to SixJarsEngine)
    const jarsSummaryList = sixJars.map(j => ({
      jarKey: j.key || j.id,
      name: j.nameVi || j.nameEn || j.key,
      percentage: j.percent || 0,
      allocatedAmount: MoneyUtils.round((monthlyIncome * (j.percent || 0)) / 100, 0)
    }));

    const sixJarsSummary: SixJarsSnapshotSummary = {
      isCompliant: overspentBudgetsCount === 0 && monthlyExpense <= monthlyIncome,
      totalAllocated: monthlyIncome,
      jars: jarsSummaryList
    };

    // 8. FIRE Progress (Delegated to FIREEngine)
    let targetNetWorth = 0;
    let yearsToFIRE = 20;

    if (fireProfile) {
      targetNetWorth = FIREEngine.calculateFireNumber(
        monthlyExpense > 0 ? monthlyExpense : 10000000,
        fireProfile.safeWithdrawalRate || 4,
        fireProfile.fireType || 'regular_fire'
      );
      yearsToFIRE = Math.max(0, Math.round((targetNetWorth - netWorth) / Math.max(1, (monthlyIncome - monthlyExpense) * 12)));
    } else {
      targetNetWorth = FIREEngine.calculateFireNumber(monthlyExpense > 0 ? monthlyExpense : 10000000);
    }

    const fireProgressPercent = targetNetWorth > 0 ? Math.min(100, Math.round((netWorth / targetNetWorth) * 100)) : 0;

    const fireProgress: FIRESnapshotProgress = {
      targetNetWorth: MoneyUtils.round(targetNetWorth, 0),
      currentNetWorth: netWorth,
      progressPercent: fireProgressPercent,
      yearsToFIRE: isFinite(yearsToFIRE) ? yearsToFIRE : 30,
      isFIREFeesible: netWorth >= targetNetWorth || (monthlyIncome > monthlyExpense)
    };

    // 9. Emergency Fund (Delegated to FinancialTruthEngine)
    const targetMonths = 6;
    const targetEmergencyAmount = monthlyExpense * targetMonths;
    const coverageMonths = monthlyExpense > 0 ? Math.round((emergencyFundBalance / monthlyExpense) * 10) / 10 : 0;

    const emergencyFund: EmergencyFundSnapshot = {
      currentBalance: emergencyFundBalance,
      targetMonths,
      targetAmount: MoneyUtils.round(targetEmergencyAmount, 0),
      coverageMonths,
      isSufficient: emergencyFundBalance >= targetEmergencyAmount || coverageMonths >= targetMonths
    };

    // 10. Financial Health Score (Delegated to AICoachEngine)
    const rawSnapshotInput = {
      netWorth,
      monthlyIncome,
      monthlyExpense,
      monthlySavings: totalSaved,
      monthlyInvestment: invReturn.currentValue,
      totalDebt: totalDebtOwed,
      totalAssets: netWorth + totalDebtOwed,
      totalSavingsBalance: totalSaved,
      activeBudgetsCount,
      overspentBudgetsCount,
      fireProgressPercent,
      fireYearsRemaining: yearsToFIRE,
      sixJarsCompliant: sixJarsSummary.isCompliant,
      recentTransactionCount: transactions.length
    };

    const coachHealth = AICoachEngine.analyzeHealth(rawSnapshotInput, language);

    const categoryScoresRecord: Record<string, number> = {};
    if (coachHealth.categories) {
      Object.entries(coachHealth.categories).forEach(([catKey, detail]) => {
        categoryScoresRecord[catKey] = detail?.score || 0;
      });
    }

    const financialHealthScore: HealthScoreSnapshot = {
      overallScore: coachHealth.overallScore,
      status: coachHealth.status,
      categoryScores: categoryScoresRecord
    };

    const snapshot: FinancialSnapshot = {
      timestamp: new Date().toISOString(),
      spaceId,
      currency,
      cashBalance,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      savingsProgress,
      investmentValue,
      debtSummary,
      budgetSummary,
      sixJarsSummary,
      fireProgress,
      emergencyFund,
      financialHealthScore
    };

    return Object.freeze(snapshot);
  }
}
