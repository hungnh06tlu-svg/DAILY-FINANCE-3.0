/**
 * Daily Finance 3.0 - Repository Contracts
 * Offline-First & Canonical Data Access Abstraction Layer.
 */

import {
  Transaction,
  TransactionType,
  TransactionStatus,
  Wallet,
  Budget,
  SavingsGoal,
  Investment,
  DebtItem,
  Jar,
  Report,
  Dashboard,
  BackupInfo,
  UserPreference,
  FeatureConfig,
  FinancialSpace
} from '../types';

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  categoryId?: string;
  walletId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionRepository {
  // CRUD Operations
  addTransaction(tx: Transaction | Omit<Transaction, 'id'>): Promise<Transaction>;
  getTransactionById(id: string): Promise<Transaction | null>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  restoreTransaction?(id: string): Promise<boolean>;
  
  // Batch Operations
  getTransactions(spaceId?: string): Promise<Transaction[]>;
  getTransactionsBySpace?(spaceId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  getAllTransactions?(): Promise<Transaction[]>;
  bulkUpsert?(transactions: Transaction[]): Promise<void>;
  
  // Query Operations
  findDeletedTransactions?(since?: Date): Promise<Transaction[]>;
  findSyncableTransactions?(since?: Date): Promise<Transaction[]>;
}

export interface WalletRepository {
  getWallets(spaceId?: string): Promise<Wallet[]>;
  getWalletById(id: string): Promise<Wallet | null>;
  addWallet(wallet: Wallet | Omit<Wallet, 'id'>): Promise<Wallet>;
  updateWallet(wallet: Wallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<boolean>;
  getWalletsBySpace?(spaceId: string): Promise<Wallet[]>;
}

export interface SpaceRepository {
  createSpace(space: FinancialSpace | Omit<FinancialSpace, 'id'>): Promise<FinancialSpace>;
  getSpaceById(id: string): Promise<FinancialSpace | null>;
  updateSpace(space: FinancialSpace): Promise<FinancialSpace>;
  deleteSpace(id: string): Promise<boolean>;
  getUserSpaces(userId?: string): Promise<FinancialSpace[]>;
  getAllSpaces?(): Promise<FinancialSpace[]>;
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
