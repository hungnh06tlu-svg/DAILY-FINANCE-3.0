/**
 * Daily Finance 2.5 - LocalDataSource
 * Local in-memory data source holding initial collections and managing local data access.
 * Implements DataSource abstraction for future Room, GoogleDrive, or Remote DataSources.
 */

import {
  FinancialSpace,
  Transaction,
  Wallet,
  Budget,
  SavingsGoal,
  CreditCard,
  DebtItem,
  Installment,
  SixJar,
  FireConfig,
  FeatureModulesState,
  Investment,
  UserPreference,
  BackupInfo
} from '../../types';

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
} from '../initialData';

import { IdGenerator } from '../../services/IdGenerator';
import { BackupAndSyncEngine } from '../../domain/BackupAndSyncEngine';

export interface DataSource {
  // Transactions
  getTransactions(spaceId?: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // Wallets
  getWallets(spaceId?: string): Promise<Wallet[]>;
  getWalletById(id: string): Promise<Wallet | null>;
  addWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet>;
  updateWallet(wallet: Wallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<boolean>;

  // Spaces
  getSpaces(): Promise<FinancialSpace[]>;
  getSpaceById(id: string): Promise<FinancialSpace | null>;

  // Budgets
  getBudgets(spaceId?: string): Promise<Budget[]>;
  addBudget(budget: Omit<Budget, 'id'>): Promise<Budget>;
  updateBudget(budget: Budget): Promise<Budget>;
  deleteBudget(id: string): Promise<boolean>;

  // Savings Goals
  getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]>;
  addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal>;
  updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal>;
  deleteSavingsGoal(id: string): Promise<boolean>;

  // Investments
  getInvestments(spaceId?: string): Promise<Investment[]>;
  addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment>;
  updateInvestment(inv: Investment): Promise<Investment>;
  deleteInvestment(id: string): Promise<boolean>;

  // Debts & Loans
  getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]>;
  addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem>;
  updateDebtOrLoan(item: DebtItem): Promise<DebtItem>;
  deleteDebtOrLoan(id: string): Promise<boolean>;

  // Six Jars
  getSixJars(spaceId?: string): Promise<SixJar[]>;
  addSixJar(jar: Omit<SixJar, 'id'>): Promise<SixJar>;
  updateSixJar(jar: SixJar): Promise<SixJar>;
  deleteSixJar(id: string): Promise<boolean>;

  // User Preferences
  getUserPreferences(): Promise<UserPreference>;
  updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference>;

  // Backup & Restore
  backupData(spaceId?: string): Promise<BackupInfo>;
  restoreData(backupId: string): Promise<boolean>;
}

export class LocalDataSource implements DataSource {
  private static instance: LocalDataSource;

  private spaces: FinancialSpace[] = [...INITIAL_SPACES];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private wallets: Wallet[] = [
    {
      id: 'w_cash_personal',
      spaceId: 'sp_personal',
      name: 'Tiền mặt (Personal Cash)',
      type: 'cash',
      currency: 'VND',
      initialBalance: 5000000,
      currentBalance: 8500000,
      status: 'active',
      isDefault: true
    },
    {
      id: 'w_vcb_personal',
      spaceId: 'sp_personal',
      name: 'Techcombank Chín (TCB)',
      type: 'bank',
      currency: 'VND',
      initialBalance: 20000000,
      currentBalance: 40000000,
      status: 'active'
    },
    {
      id: 'w_momo_personal',
      spaceId: 'sp_personal',
      name: 'MoMo E-Wallet',
      type: 'e_wallet',
      currency: 'VND',
      initialBalance: 1000000,
      currentBalance: 3200000,
      status: 'active'
    }
  ];
  private budgets: Budget[] = [...INITIAL_BUDGETS];
  private savingsGoals: SavingsGoal[] = [...INITIAL_SAVINGS_GOALS];
  private creditCards: CreditCard[] = [...INITIAL_CREDIT_CARDS];
  private debtsAndLoans: DebtItem[] = [...INITIAL_DEBTS];
  private installments: Installment[] = [...INITIAL_INSTALLMENTS];
  private sixJars: SixJar[] = [...INITIAL_SIX_JARS];
  private fireConfig: FireConfig = { ...INITIAL_FIRE_CONFIG };
  private featureConfig: FeatureModulesState = { ...DEFAULT_FEATURE_MODULES };
  private investments: Investment[] = [
    {
      id: 'inv_1',
      spaceId: 'sp_personal',
      name: 'Chứng Chỉ Quỹ ETF VN30',
      type: 'fund',
      quantity: 5000,
      purchasePrice: 22000,
      currentPrice: 26500,
      currency: 'VND',
      symbol: 'E1VFVN30'
    },
    {
      id: 'inv_2',
      spaceId: 'sp_personal',
      name: 'Cổ phiếu FPT Corporation',
      type: 'stock',
      quantity: 800,
      purchasePrice: 110000,
      currentPrice: 135000,
      currency: 'VND',
      symbol: 'FPT'
    }
  ];
  private userPreferences: UserPreference = {
    userId: 'usr_default',
    language: 'vi',
    theme: 'm3-expressive',
    baseCurrency: 'VND',
    defaultSpaceId: 'sp_personal',
    biometricEnabled: true,
    notificationEnabled: true
  };

  public static getInstance(): LocalDataSource {
    if (!LocalDataSource.instance) {
      LocalDataSource.instance = new LocalDataSource();
    }
    return LocalDataSource.instance;
  }

  // Transactions
  async getTransactions(spaceId?: string): Promise<Transaction[]> {
    if (!spaceId) return [...this.transactions];
    return this.transactions.filter(
      (tx) => tx.spaceId === spaceId || tx.targetSpaceId === spaceId
    );
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.find((tx) => tx.id === id) || null;
  }

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: IdGenerator.generateTransactionId()
    };
    this.transactions.unshift(newTx);
    return newTx;
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    const index = this.transactions.findIndex((item) => item.id === tx.id);
    if (index !== -1) {
      this.transactions[index] = { ...tx };
    } else {
      this.transactions.unshift(tx);
    }
    return tx;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const initialLen = this.transactions.length;
    this.transactions = this.transactions.filter((tx) => tx.id !== id);
    return this.transactions.length < initialLen;
  }

  // Wallets
  async getWallets(spaceId?: string): Promise<Wallet[]> {
    if (!spaceId) return [...this.wallets];
    return this.wallets.filter((w) => w.spaceId === spaceId);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.id === id) || null;
  }

  async addWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
    const newWallet: Wallet = {
      ...wallet,
      id: IdGenerator.generateWalletId()
    };
    this.wallets.push(newWallet);
    return newWallet;
  }

  async updateWallet(wallet: Wallet): Promise<Wallet> {
    const index = this.wallets.findIndex((w) => w.id === wallet.id);
    if (index !== -1) {
      this.wallets[index] = { ...wallet };
    }
    return wallet;
  }

  async deleteWallet(id: string): Promise<boolean> {
    const initialLen = this.wallets.length;
    this.wallets = this.wallets.filter((w) => w.id !== id);
    return this.wallets.length < initialLen;
  }

  // Spaces
  async getSpaces(): Promise<FinancialSpace[]> {
    return [...this.spaces];
  }

  async getSpaceById(id: string): Promise<FinancialSpace | null> {
    return this.spaces.find((s) => s.id === id) || null;
  }

  // Budgets
  async getBudgets(spaceId?: string): Promise<Budget[]> {
    if (!spaceId) return [...this.budgets];
    return this.budgets.filter((b) => !b.spaceId || b.spaceId === spaceId);
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: IdGenerator.generateBudgetId()
    };
    this.budgets.push(newBudget);
    return newBudget;
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const index = this.budgets.findIndex((b) => b.id === budget.id);
    if (index !== -1) {
      this.budgets[index] = { ...budget };
    }
    return budget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const initialLen = this.budgets.length;
    this.budgets = this.budgets.filter((b) => b.id !== id);
    return this.budgets.length < initialLen;
  }

  // Savings Goals
  async getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]> {
    if (!spaceId) return [...this.savingsGoals];
    return this.savingsGoals.filter((s) => !s.spaceId || s.spaceId === spaceId);
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      id: IdGenerator.generateSavingsGoalId()
    };
    this.savingsGoals.push(newGoal);
    return newGoal;
  }

  async updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal> {
    const index = this.savingsGoals.findIndex((s) => s.id === goal.id);
    if (index !== -1) {
      this.savingsGoals[index] = { ...goal };
    }
    return goal;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const initialLen = this.savingsGoals.length;
    this.savingsGoals = this.savingsGoals.filter((s) => s.id !== id);
    return this.savingsGoals.length < initialLen;
  }

  // Investments
  async getInvestments(spaceId?: string): Promise<Investment[]> {
    if (!spaceId) return [...this.investments];
    return this.investments.filter((inv) => inv.spaceId === spaceId);
  }

  async addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
    const newInv: Investment = {
      ...inv,
      id: IdGenerator.generateInvestmentId()
    };
    this.investments.push(newInv);
    return newInv;
  }

  async updateInvestment(inv: Investment): Promise<Investment> {
    const index = this.investments.findIndex((item) => item.id === inv.id);
    if (index !== -1) {
      this.investments[index] = { ...inv };
    }
    return inv;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    const initialLen = this.investments.length;
    this.investments = this.investments.filter((i) => i.id !== id);
    return this.investments.length < initialLen;
  }

  // Debts & Loans
  async getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]> {
    if (!spaceId) return [...this.debtsAndLoans];
    return this.debtsAndLoans.filter((d) => !d.spaceId || d.spaceId === spaceId);
  }

  async addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    const newItem: DebtItem = {
      ...item,
      id: IdGenerator.generateDebtId()
    };
    this.debtsAndLoans.push(newItem);
    return newItem;
  }

  async updateDebtOrLoan(item: DebtItem): Promise<DebtItem> {
    const index = this.debtsAndLoans.findIndex((d) => d.id === item.id);
    if (index !== -1) {
      this.debtsAndLoans[index] = { ...item };
    }
    return item;
  }

  async deleteDebtOrLoan(id: string): Promise<boolean> {
    const initialLen = this.debtsAndLoans.length;
    this.debtsAndLoans = this.debtsAndLoans.filter((d) => d.id !== id);
    return this.debtsAndLoans.length < initialLen;
  }

  // Six Jars
  async getSixJars(spaceId?: string): Promise<SixJar[]> {
    if (!spaceId) return [...this.sixJars];
    return this.sixJars.filter((j) => !j.spaceId || j.spaceId === spaceId);
  }

  async addSixJar(jar: Omit<SixJar, 'id'>): Promise<SixJar> {
    const newJar: SixJar = {
      ...jar,
      id: IdGenerator.generateId('jar')
    };
    this.sixJars.push(newJar);
    return newJar;
  }

  async updateSixJar(jar: SixJar): Promise<SixJar> {
    const index = this.sixJars.findIndex((j) => j.id === jar.id);
    if (index !== -1) {
      this.sixJars[index] = { ...jar };
    }
    return jar;
  }

  async deleteSixJar(id: string): Promise<boolean> {
    const initialLen = this.sixJars.length;
    this.sixJars = this.sixJars.filter((j) => j.id !== id);
    return this.sixJars.length < initialLen;
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreference> {
    return { ...this.userPreferences };
  }

  async updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference> {
    this.userPreferences = { ...this.userPreferences, ...prefs };
    return { ...this.userPreferences };
  }

  // Backup & Restore
  async backupData(spaceId?: string): Promise<BackupInfo> {
    const filterBySpace = <T extends { spaceId?: string }>(items: T[]) => {
      if (!spaceId) return items;
      return items.filter(item => !item.spaceId || item.spaceId === spaceId);
    };

    const pkg = await BackupAndSyncEngine.createBackupPackage(
      this.userPreferences.userId || 'usr_default',
      'device_local_01',
      {
        transactions: filterBySpace(this.transactions) as any,
        wallets: filterBySpace(this.wallets) as any,
        budgets: filterBySpace(this.budgets) as any,
        savingsGoals: filterBySpace(this.savingsGoals) as any,
        debtsAndLoans: filterBySpace(this.debtsAndLoans) as any,
        investments: filterBySpace(this.investments) as any
      },
      spaceId
    );

    const size = JSON.stringify(pkg).length;

    return {
      id: IdGenerator.generateBackupId(),
      timestamp: pkg.metadata.timestamp,
      sizeBytes: size,
      version: pkg.metadata.appVersion,
      location: 'local',
      filename: `DailyFinance_Backup_${pkg.metadata.timestamp.substring(0, 10)}.json`
    };
  }

  async restoreData(backupId: string): Promise<boolean> {
    if (!backupId || backupId.trim() === '') {
      throw new Error('Invalid backup identifier provided for restore');
    }
    return true;
  }
}
