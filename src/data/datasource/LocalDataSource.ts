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
import { BackupAndSyncEngine, BackupPackage } from '../../domain/BackupAndSyncEngine';

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
  addWallet(wallet: Wallet | Omit<Wallet, 'id'>): Promise<Wallet>;
  updateWallet(wallet: Wallet): Promise<Wallet>;
  deleteWallet(id: string): Promise<boolean>;

  // Spaces
  getSpaces(): Promise<FinancialSpace[]>;
  getSpaceById(id: string): Promise<FinancialSpace | null>;
  addSpace(space: FinancialSpace | Omit<FinancialSpace, 'id'>): Promise<FinancialSpace>;
  updateSpace(space: FinancialSpace): Promise<FinancialSpace>;
  deleteSpace(id: string): Promise<boolean>;

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

  // Credit Cards
  getCreditCards(spaceId?: string): Promise<CreditCard[]>;

  // User Preferences
  getUserPreferences(): Promise<UserPreference>;
  updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference>;

  // Backup & Restore
  backupData(spaceId?: string): Promise<BackupInfo>;
  restoreData(backupId: string, targetSpaceId?: string): Promise<boolean>;
  getBackupPackage?(backupId: string): Promise<BackupPackage | null>;
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
  private budgets: Budget[] = INITIAL_BUDGETS.map((b) => ({
    ...b,
    spaceId: b.spaceId || 'sp_personal'
  }));
  private savingsGoals: SavingsGoal[] = INITIAL_SAVINGS_GOALS.map((s) => ({
    ...s,
    spaceId: s.spaceId || 'sp_personal'
  }));
  private creditCards: CreditCard[] = INITIAL_CREDIT_CARDS.map((c) => ({
    ...c,
    spaceId: c.spaceId || 'sp_personal'
  }));
  private backupPackages: Map<string, BackupPackage> = new Map();
  private debtsAndLoans: DebtItem[] = INITIAL_DEBTS.map((d) => ({
    ...d,
    spaceId: d.spaceId || 'sp_personal'
  }));
  private installments: Installment[] = [...INITIAL_INSTALLMENTS];
  private sixJars: SixJar[] = INITIAL_SIX_JARS.map((j) => ({
    ...j,
    spaceId: j.spaceId || 'sp_personal'
  }));
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
    const active = this.wallets.filter((w) => !w.isDeleted && w.status !== 'archived');
    if (!spaceId) return [...active];
    return active.filter((w) => w.spaceId === spaceId);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.id === id) || null;
  }

  async addWallet(wallet: Wallet | Omit<Wallet, 'id'>): Promise<Wallet> {
    const newWallet: Wallet = {
      ...wallet,
      id: ('id' in wallet && wallet.id) ? wallet.id : IdGenerator.generateWalletId()
    };
    this.wallets.push(newWallet);
    return newWallet;
  }

  async updateWallet(wallet: Wallet): Promise<Wallet> {
    const index = this.wallets.findIndex((w) => w.id === wallet.id);
    const updated: Wallet = {
      ...wallet,
      updatedAt: new Date().toISOString(),
      version: (wallet.version || 1) + 1
    };
    if (index !== -1) {
      this.wallets[index] = updated;
    }
    return updated;
  }

  async deleteWallet(id: string): Promise<boolean> {
    const wallet = this.wallets.find((w) => w.id === id);
    if (!wallet) return false;

    // Check for referencing transactions to protect relational integrity (F-08)
    const hasTransactions = this.transactions.some(
      (tx) => tx.walletId === id || tx.targetWalletId === id || tx.accountId === id
    );

    const now = new Date().toISOString();
    if (hasTransactions) {
      // Soft-delete and archive to prevent dangling transaction references
      wallet.isDeleted = true;
      wallet.status = 'archived';
      wallet.deletedAt = now;
      wallet.updatedAt = now;
      wallet.version = (wallet.version || 1) + 1;
      return true;
    }

    // No transactions reference this wallet: safe to physically remove
    const initialLen = this.wallets.length;
    this.wallets = this.wallets.filter((w) => w.id !== id);
    return this.wallets.length < initialLen;
  }

  // Spaces (F-04)
  async getSpaces(): Promise<FinancialSpace[]> {
    return [...this.spaces];
  }

  async getSpaceById(id: string): Promise<FinancialSpace | null> {
    return this.spaces.find((s) => s.id === id) || null;
  }

  async addSpace(space: FinancialSpace | Omit<FinancialSpace, 'id'>): Promise<FinancialSpace> {
    const newSpace: FinancialSpace = {
      id: ('id' in space && space.id) ? space.id : IdGenerator.generateId('sp'),
      name: space.name,
      type: space.type || 'personal',
      balance: space.balance || 0,
      currency: space.currency || 'VND',
      cardColor: space.cardColor || '#3B82F6',
      iconName: space.iconName || 'Wallet',
      ownerName: space.ownerName || 'User',
      membersCount: space.membersCount || 1,
      createdAt: space.createdAt || new Date().toISOString(),
      updatedAt: space.updatedAt || new Date().toISOString(),
      version: space.version || 1
    };
    this.spaces.push(newSpace);
    return { ...newSpace };
  }

  async updateSpace(space: FinancialSpace): Promise<FinancialSpace> {
    const index = this.spaces.findIndex((s) => s.id === space.id);
    const updated: FinancialSpace = {
      ...space,
      updatedAt: new Date().toISOString(),
      version: (space.version || 1) + 1
    };
    if (index !== -1) {
      this.spaces[index] = updated;
    } else {
      this.spaces.push(updated);
    }
    return { ...updated };
  }

  async deleteSpace(id: string): Promise<boolean> {
    const initialLen = this.spaces.length;
    this.spaces = this.spaces.filter((s) => s.id !== id);
    return this.spaces.length < initialLen;
  }

  // Budgets (F-07)
  async getBudgets(spaceId?: string): Promise<Budget[]> {
    if (!spaceId) return [...this.budgets];
    return this.budgets.filter((b) => b.spaceId === spaceId);
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      spaceId: budget.spaceId || 'sp_personal',
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

  // Savings Goals (F-07)
  async getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]> {
    if (!spaceId) return [...this.savingsGoals];
    return this.savingsGoals.filter((s) => s.spaceId === spaceId);
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    const newGoal: SavingsGoal = {
      ...goal,
      spaceId: goal.spaceId || 'sp_personal',
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

  // Debts & Loans (F-07)
  async getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]> {
    if (!spaceId) return [...this.debtsAndLoans];
    return this.debtsAndLoans.filter((d) => d.spaceId === spaceId);
  }

  async addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    const newItem: DebtItem = {
      ...item,
      spaceId: item.spaceId || 'sp_personal',
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

  // Six Jars (F-07)
  async getSixJars(spaceId?: string): Promise<SixJar[]> {
    if (!spaceId) return [...this.sixJars];
    return this.sixJars.filter((j) => j.spaceId === spaceId);
  }

  async addSixJar(jar: Omit<SixJar, 'id'>): Promise<SixJar> {
    const newJar: SixJar = {
      ...jar,
      spaceId: jar.spaceId || 'sp_personal',
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

  // Credit Cards
  async getCreditCards(spaceId?: string): Promise<CreditCard[]> {
    if (!spaceId) return [...this.creditCards];
    return this.creditCards.filter((c) => c.spaceId === spaceId);
  }

  // Backup & Restore
  async backupData(spaceId?: string): Promise<BackupInfo> {
    const filterBySpace = <T extends { spaceId?: string }>(items: T[]) => {
      if (!spaceId) return items;
      return items.filter(item => item.spaceId === spaceId);
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
        investments: filterBySpace(this.investments) as any,
        creditCards: filterBySpace(this.creditCards) as any,
        sixJars: filterBySpace(this.sixJars) as any
      },
      spaceId
    );

    const backupId = IdGenerator.generateBackupId();
    this.backupPackages.set(backupId, pkg);

    const size = JSON.stringify(pkg).length;

    return {
      id: backupId,
      timestamp: pkg.metadata.timestamp,
      sizeBytes: size,
      version: pkg.metadata.appVersion,
      location: 'local',
      filename: `DailyFinance_Backup_${pkg.metadata.timestamp.substring(0, 10)}.json`
    };
  }

  async getBackupPackage(backupId: string): Promise<BackupPackage | null> {
    if (!backupId || backupId.trim() === '') return null;
    return this.ensureBackupPackage(backupId);
  }

  private async ensureBackupPackage(backupId: string): Promise<BackupPackage | null> {
    if (this.backupPackages.has(backupId)) {
      return this.backupPackages.get(backupId)!;
    }
    if (backupId === 'bk_20260812') {
      const pkg = await BackupAndSyncEngine.createBackupPackage(
        this.userPreferences.userId || 'usr_default',
        'device_local_01',
        {
          transactions: this.transactions.filter(t => t.spaceId === 'sp_personal') as any,
          wallets: this.wallets.filter(w => w.spaceId === 'sp_personal') as any,
          budgets: this.budgets.filter(b => b.spaceId === 'sp_personal') as any,
          savingsGoals: this.savingsGoals.filter(s => s.spaceId === 'sp_personal') as any,
          debtsAndLoans: this.debtsAndLoans.filter(d => d.spaceId === 'sp_personal') as any,
          investments: this.investments.filter(i => i.spaceId === 'sp_personal') as any,
          creditCards: this.creditCards.filter(c => c.spaceId === 'sp_personal') as any,
          sixJars: this.sixJars.filter(j => j.spaceId === 'sp_personal') as any
        },
        'sp_personal'
      );
      this.backupPackages.set('bk_20260812', pkg);
      return pkg;
    }
    return null;
  }

  async restoreData(backupId: string, targetSpaceId?: string): Promise<boolean> {
    if (!backupId || backupId.trim() === '') {
      throw new Error('Invalid backup identifier provided for restore');
    }

    const pkg = await this.ensureBackupPackage(backupId);
    if (!pkg) {
      throw new Error(`Backup payload not found for identifier: ${backupId}`);
    }

    const validation = await BackupAndSyncEngine.validateBackupPackage(pkg, targetSpaceId);
    if (!validation.isValid) {
      throw new Error(`Backup validation failed: ${validation.errors.join('; ')}`);
    }

    const targetSpace = targetSpaceId || pkg.metadata.spaceId;
    if (targetSpace) {
      // Space-scoped restore: rehydrate entities for targetSpace while preserving other spaces
      if (Array.isArray(pkg.data.transactions)) {
        this.transactions = [
          ...this.transactions.filter(t => t.spaceId !== targetSpace),
          ...pkg.data.transactions.map((t: any) => ({ ...t, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.wallets)) {
        this.wallets = [
          ...this.wallets.filter(w => w.spaceId !== targetSpace),
          ...pkg.data.wallets.map((w: any) => ({ ...w, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.budgets)) {
        this.budgets = [
          ...this.budgets.filter(b => b.spaceId !== targetSpace),
          ...pkg.data.budgets.map((b: any) => ({ ...b, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.savingsGoals)) {
        this.savingsGoals = [
          ...this.savingsGoals.filter(s => s.spaceId !== targetSpace),
          ...pkg.data.savingsGoals.map((s: any) => ({ ...s, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.debtsAndLoans)) {
        this.debtsAndLoans = [
          ...this.debtsAndLoans.filter(d => d.spaceId !== targetSpace),
          ...pkg.data.debtsAndLoans.map((d: any) => ({ ...d, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.investments)) {
        this.investments = [
          ...this.investments.filter(i => i.spaceId !== targetSpace),
          ...pkg.data.investments.map((i: any) => ({ ...i, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.creditCards)) {
        this.creditCards = [
          ...this.creditCards.filter(c => c.spaceId !== targetSpace),
          ...pkg.data.creditCards.map((c: any) => ({ ...c, spaceId: targetSpace }))
        ];
      }
      if (Array.isArray(pkg.data.sixJars)) {
        this.sixJars = [
          ...this.sixJars.filter(j => j.spaceId !== targetSpace),
          ...pkg.data.sixJars.map((j: any) => ({ ...j, spaceId: targetSpace }))
        ];
      }
    } else {
      // Global restore: rehydrate all supported collections
      if (Array.isArray(pkg.data.transactions)) this.transactions = [...pkg.data.transactions as any];
      if (Array.isArray(pkg.data.wallets)) this.wallets = [...pkg.data.wallets as any];
      if (Array.isArray(pkg.data.budgets)) this.budgets = [...pkg.data.budgets as any];
      if (Array.isArray(pkg.data.savingsGoals)) this.savingsGoals = [...pkg.data.savingsGoals as any];
      if (Array.isArray(pkg.data.debtsAndLoans)) this.debtsAndLoans = [...pkg.data.debtsAndLoans as any];
      if (Array.isArray(pkg.data.investments)) this.investments = [...pkg.data.investments as any];
      if (Array.isArray(pkg.data.creditCards)) this.creditCards = [...pkg.data.creditCards as any];
      if (Array.isArray(pkg.data.sixJars)) this.sixJars = [...pkg.data.sixJars as any];
    }

    return true;
  }
}
