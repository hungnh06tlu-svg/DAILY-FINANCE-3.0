/**
 * Daily Finance 2.5 - Repository Contracts
 * Interfaces defining data access layer abstraction.
 */

import {
  Transaction,
  Wallet,
  Budget,
  SavingsGoal,
  Investment,
  DebtItem,
  Jar,
  SixJar,
  Report,
  Dashboard,
  BackupInfo,
  UserPreference,
  FeatureConfig
} from '../types';

export interface TransactionRepository {
  getTransactions(spaceId?: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
}

export interface WalletRepository {
  getWallets(spaceId?: string): Promise<Wallet[]>;
  getWalletById(id: string): Promise<Wallet | null>;
  addWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet>;
  updateWallet(wallet: Wallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<boolean>;
}

export interface BudgetRepository {
  getBudgets(spaceId?: string): Promise<Budget[]>;
  createBudget(budget: Omit<Budget, 'id'>): Promise<Budget>;
  updateBudget(budget: Budget): Promise<Budget>;
  deleteBudget(id: string): Promise<boolean>;
}

export interface SavingRepository {
  getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]>;
  createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal>;
  updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal>;
  deleteSavingsGoal(id: string): Promise<boolean>;
}

export interface InvestmentRepository {
  getInvestments(spaceId?: string): Promise<Investment[]>;
  addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment>;
  updateInvestment(inv: Investment): Promise<Investment>;
  deleteInvestment(id: string): Promise<boolean>;
}

export interface LoanRepository {
  getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]>;
  addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem>;
  updateDebtOrLoan(item: DebtItem): Promise<DebtItem>;
  deleteDebtOrLoan(id: string): Promise<boolean>;
}

export interface SixJarsRepository {
  getJars(spaceId?: string): Promise<Jar[]>;
  addJar(jar: Omit<Jar, 'id'>): Promise<Jar>;
  updateJar(jar: Jar): Promise<Jar>;
  deleteJar(id: string): Promise<boolean>;
}

export interface ReportRepository {
  getReport(spaceId: string, period: string): Promise<Report>;
}

export interface DashboardRepository {
  getDashboard(spaceId: string): Promise<Dashboard>;
}

export interface AIRepository {
  getInsights(spaceId: string): Promise<string[]>;
}

export interface BackupRepository {
  backupData(spaceId?: string): Promise<BackupInfo>;
  restoreData(backupId: string, targetSpaceId?: string): Promise<boolean>;
  getBackups?(spaceId?: string): Promise<BackupInfo[]>;
}

export interface PreferenceRepository {
  getUserPreferences(): Promise<UserPreference>;
  updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference>;
}

export interface FeatureRepository {
  getFeatureConfig(): Promise<FeatureConfig>;
  toggleFeature(feature: keyof FeatureConfig): Promise<boolean>;
}
