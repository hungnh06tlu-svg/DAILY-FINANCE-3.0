/**
 * Daily Finance 3.0 - FinancialSnapshot Domain Model
 * Read-Only Unified Financial Projection
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-002 Read Model Architecture.
 */

import { Language } from '../types';
import { FinancialSnapshotInput } from './AICoachEngine';

export interface SavingsSnapshotProgress {
  readonly totalSaved: number;
  readonly targetAmount: number;
  readonly progressPercent: number;
  readonly activeGoalsCount: number;
  readonly emergencyFundBalance: number;
}

export interface InvestmentSnapshotValue {
  readonly totalPortfolioValue: number;
  readonly totalCostBasis: number;
  readonly totalUnrealizedGain: number;
  readonly roiPercent: number;
  readonly activeAssetCount: number;
}

export interface DebtSnapshotSummary {
  readonly totalDebtOwed: number;
  readonly totalLoansGiven: number;
  readonly netDebt: number;
  readonly activeDebtsCount: number;
  readonly monthlyMinDebtPayment: number;
}

export interface BudgetSnapshotSummary {
  readonly totalAllocated: number;
  readonly totalSpent: number;
  readonly totalRemaining: number;
  readonly activeBudgetsCount: number;
  readonly overspentBudgetsCount: number;
}

export interface SixJarsSnapshotSummary {
  readonly isCompliant: boolean;
  readonly totalAllocated: number;
  readonly jars: ReadonlyArray<{
    readonly jarKey: string;
    readonly name: string;
    readonly percentage: number;
    readonly allocatedAmount: number;
  }>;
}

export interface FIRESnapshotProgress {
  readonly targetNetWorth: number;
  readonly currentNetWorth: number;
  readonly progressPercent: number;
  readonly yearsToFIRE: number;
  readonly isFIREFeesible: boolean;
}

export interface EmergencyFundSnapshot {
  readonly currentBalance: number;
  readonly targetMonths: number;
  readonly targetAmount: number;
  readonly coverageMonths: number;
  readonly isSufficient: boolean;
}

export interface HealthScoreSnapshot {
  readonly overallScore: number;
  readonly status: 'excellent' | 'good' | 'fair' | 'warning' | 'critical';
  readonly categoryScores: Readonly<Record<string, number>>;
}

export interface FinancialSnapshot {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly currency: string;

  readonly cashBalance: number;
  readonly netWorth: number;
  readonly monthlyIncome: number;
  readonly monthlyExpense: number;

  readonly savingsProgress: SavingsSnapshotProgress;
  readonly investmentValue: InvestmentSnapshotValue;
  readonly debtSummary: DebtSnapshotSummary;
  readonly budgetSummary: BudgetSnapshotSummary;
  readonly sixJarsSummary: SixJarsSnapshotSummary;
  readonly fireProgress: FIRESnapshotProgress;
  readonly emergencyFund: EmergencyFundSnapshot;
  readonly financialHealthScore: HealthScoreSnapshot;
}

export interface SnapshotUiState {
  readonly isLoading: boolean;
  readonly snapshot: FinancialSnapshot | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}

/**
 * Pure converter to FinancialSnapshotInput for AI Coach compatibility
 */
export function toAICoachSnapshotInput(snapshot: FinancialSnapshot): FinancialSnapshotInput {
  return {
    netWorth: snapshot.netWorth,
    monthlyIncome: snapshot.monthlyIncome,
    monthlyExpense: snapshot.monthlyExpense,
    monthlySavings: snapshot.savingsProgress.totalSaved,
    monthlyInvestment: snapshot.investmentValue.totalPortfolioValue,
    totalDebt: snapshot.debtSummary.totalDebtOwed,
    totalAssets: snapshot.cashBalance + snapshot.investmentValue.totalPortfolioValue,
    totalSavingsBalance: snapshot.savingsProgress.totalSaved,
    activeBudgetsCount: snapshot.budgetSummary.activeBudgetsCount,
    overspentBudgetsCount: snapshot.budgetSummary.overspentBudgetsCount,
    fireProgressPercent: snapshot.fireProgress.progressPercent,
    fireYearsRemaining: snapshot.fireProgress.yearsToFIRE,
    sixJarsCompliant: snapshot.sixJarsSummary.isCompliant,
    recentTransactionCount: 0
  };
}
