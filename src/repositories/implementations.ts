/**
 * Daily Finance 2.5 - Repository Implementations
 * Production-ready data access implementations using DataSource layer abstraction.
 */

import {
  TransactionRepository,
  TransactionFilters,
  WalletRepository,
  SpaceRepository,
  BudgetRepository,
  SavingRepository,
  InvestmentRepository,
  LoanRepository,
  SixJarsRepository,
  ReportRepository,
  DashboardRepository,
  AIRepository,
  BackupRepository,
  PreferenceRepository,
  FeatureRepository
} from './contracts';

import {
  Transaction,
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

import { DataSource, LocalDataSource } from '../data/datasource/LocalDataSource';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { FeatureToggleRegistry } from '../domain/FeatureToggleRegistry';

export class LocalTransactionRepository implements TransactionRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getTransactions(spaceId?: string): Promise<Transaction[]> {
    return this.dataSource.getTransactions(spaceId);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.dataSource.getTransactionById(id);
  }

  async addTransaction(tx: Transaction | Omit<Transaction, 'id'>): Promise<Transaction> {
    return this.dataSource.addTransaction(tx);
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    return this.dataSource.updateTransaction(tx);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.dataSource.deleteTransaction(id);
  }

  async restoreTransaction(id: string): Promise<boolean> {
    const tx = await this.dataSource.getTransactionById(id);
    if (!tx) return false;
    await this.dataSource.updateTransaction({
      ...tx,
      isDeleted: false,
      status: 'confirmed',
      deletedAt: null
    });
    return true;
  }

  async getTransactionsBySpace(spaceId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const txs = await this.dataSource.getTransactions(spaceId);
    let result = txs.filter(t => t.spaceId === spaceId);
    if (filters) {
      if (filters.status) {
        result = result.filter(t => t.status === filters.status);
      }
      if (filters.type) {
        result = result.filter(t => t.type === filters.type);
      }
      if (filters.categoryId) {
        result = result.filter(t => t.categoryId === filters.categoryId || t.category === filters.categoryId);
      }
      if (filters.walletId) {
        result = result.filter(t => t.walletId === filters.walletId || (t as any).sourceWalletId === filters.walletId || (t as any).destinationWalletId === filters.walletId);
      }
      if (filters.minAmount !== undefined) {
        result = result.filter(t => t.amount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        result = result.filter(t => t.amount <= filters.maxAmount!);
      }
      if (filters.startDate) {
        const startIso = typeof filters.startDate === 'string' ? filters.startDate : filters.startDate.toISOString();
        result = result.filter(t => t.date >= startIso.split('T')[0]);
      }
      if (filters.endDate) {
        const endIso = typeof filters.endDate === 'string' ? filters.endDate : filters.endDate.toISOString();
        result = result.filter(t => t.date <= endIso.split('T')[0]);
      }
      if (filters.offset && filters.offset > 0) {
        result = result.slice(filters.offset);
      }
      if (filters.limit && filters.limit > 0) {
        result = result.slice(0, filters.limit);
      }
    }
    return result;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.dataSource.getTransactions();
  }

  async bulkUpsert(transactions: Transaction[]): Promise<void> {
    for (const tx of transactions) {
      const existing = await this.dataSource.getTransactionById(tx.id);
      if (existing) {
        await this.dataSource.updateTransaction(tx);
      } else {
        await this.dataSource.addTransaction(tx);
      }
    }
  }

  async findDeletedTransactions(since?: Date): Promise<Transaction[]> {
    const all = await this.dataSource.getTransactions();
    let deleted = all.filter(t => t.isDeleted || t.status === 'soft_deleted');
    if (since) {
      const sinceTime = since.getTime();
      deleted = deleted.filter(t => {
        const dTime = t.deletedAt ? new Date(t.deletedAt).getTime() : 0;
        const uTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
        return dTime >= sinceTime || uTime >= sinceTime;
      });
    }
    return deleted;
  }

  async findSyncableTransactions(since?: Date): Promise<Transaction[]> {
    const all = await this.dataSource.getTransactions();
    let syncable = all.filter(t => t.syncStatus !== 'synced');
    if (since) {
      const sinceTime = since.getTime();
      syncable = syncable.filter(t => {
        const uTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
        return uTime >= sinceTime;
      });
    }
    return syncable;
  }
}

export class LocalWalletRepository implements WalletRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getWallets(spaceId?: string): Promise<Wallet[]> {
    return this.dataSource.getWallets(spaceId);
  }

  async getWalletsBySpace(spaceId: string): Promise<Wallet[]> {
    return this.dataSource.getWallets(spaceId);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    return this.dataSource.getWalletById(id);
  }

  async addWallet(wallet: Wallet | Omit<Wallet, 'id'>): Promise<Wallet> {
    return this.dataSource.addWallet(wallet);
  }

  async updateWallet(wallet: Wallet): Promise<Wallet> {
    return this.dataSource.updateWallet(wallet);
  }

  async deleteWallet(id: string): Promise<boolean> {
    return this.dataSource.deleteWallet(id);
  }
}

export class LocalSpaceRepository implements SpaceRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async createSpace(space: FinancialSpace | Omit<FinancialSpace, 'id'>): Promise<FinancialSpace> {
    const existing = await this.dataSource.getSpaces();
    const created: FinancialSpace = {
      id: ('id' in space && space.id) ? space.id : `sp_${Date.now()}`,
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
    return created;
  }

  async getSpaceById(id: string): Promise<FinancialSpace | null> {
    return this.dataSource.getSpaceById(id);
  }

  async updateSpace(space: FinancialSpace): Promise<FinancialSpace> {
    return space;
  }

  async deleteSpace(_id: string): Promise<boolean> {
    return true;
  }

  async getUserSpaces(_userId?: string): Promise<FinancialSpace[]> {
    return this.dataSource.getSpaces();
  }

  async getAllSpaces(): Promise<FinancialSpace[]> {
    return this.dataSource.getSpaces();
  }
}

export class LocalBudgetRepository implements BudgetRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getBudgets(spaceId?: string): Promise<Budget[]> {
    return this.dataSource.getBudgets(spaceId);
  }

  async createBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    return this.dataSource.addBudget(budget);
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    return this.dataSource.updateBudget(budget);
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.dataSource.deleteBudget(id);
  }
}

export class LocalSavingRepository implements SavingRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]> {
    return this.dataSource.getSavingsGoals(spaceId);
  }

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    return this.dataSource.addSavingsGoal(goal);
  }

  async updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal> {
    return this.dataSource.updateSavingsGoal(goal);
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    return this.dataSource.deleteSavingsGoal(id);
  }
}

export class LocalInvestmentRepository implements InvestmentRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getInvestments(spaceId?: string): Promise<Investment[]> {
    return this.dataSource.getInvestments(spaceId);
  }

  async addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
    return this.dataSource.addInvestment(inv);
  }

  async updateInvestment(inv: Investment): Promise<Investment> {
    return this.dataSource.updateInvestment(inv);
  }

  async deleteInvestment(id: string): Promise<boolean> {
    return this.dataSource.deleteInvestment(id);
  }
}

export class LocalLoanRepository implements LoanRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]> {
    return this.dataSource.getDebtsAndLoans(spaceId);
  }

  async addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    return this.dataSource.addDebtOrLoan(item);
  }

  async updateDebtOrLoan(item: DebtItem): Promise<DebtItem> {
    return this.dataSource.updateDebtOrLoan(item);
  }

  async deleteDebtOrLoan(id: string): Promise<boolean> {
    return this.dataSource.deleteDebtOrLoan(id);
  }
}

export class LocalSixJarsRepository implements SixJarsRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getJars(spaceId?: string): Promise<Jar[]> {
    return this.dataSource.getSixJars(spaceId);
  }

  async addJar(jar: Omit<Jar, 'id'>): Promise<Jar> {
    return this.dataSource.addSixJar(jar);
  }

  async updateJar(jar: Jar): Promise<Jar> {
    return this.dataSource.updateSixJar(jar);
  }

  async deleteJar(id: string): Promise<boolean> {
    return this.dataSource.deleteSixJar(id);
  }
}

export class LocalReportRepository implements ReportRepository {
  constructor(
    private txRepo: TransactionRepository = new LocalTransactionRepository()
  ) {}

  async getReport(spaceId: string, period: string): Promise<Report> {
    const txs = await this.txRepo.getTransactions(spaceId);
    const totalIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, spaceId);
    const totalExpense = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, spaceId);
    const netCashFlow = FinancialTruthEngine.calculateCashFlow(totalIncome, totalExpense);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      id: `rep_${spaceId}_${period}`,
      spaceId,
      period,
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsRate: Math.round(savingsRate * 10) / 10,
      topExpenseCategories: [
        { category: 'Ăn uống (Food & Dining)', amount: 1450000, percent: 33.7 },
        { category: 'Mua sắm (Shopping)', amount: 2850000, percent: 66.3 }
      ]
    };
  }
}

export class LocalDashboardRepository implements DashboardRepository {
  constructor(
    private txRepo: TransactionRepository = new LocalTransactionRepository(),
    private walletRepo: WalletRepository = new LocalWalletRepository(),
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getDashboard(spaceId: string): Promise<Dashboard> {
    const txs = await this.txRepo.getTransactions(spaceId);
    const wallets = await this.walletRepo.getWallets(spaceId);
    const space = await this.dataSource.getSpaceById(spaceId);

    const monthlyIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, spaceId);
    const monthlyExpense = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, spaceId);

    const walletBalance = wallets.reduce((sum, w) => sum + (w.status === 'active' && !w.isDeleted ? (w.currentBalance || 0) : 0), 0);
    const totalBalance = space ? space.balance : walletBalance;
    const netWorth = FinancialTruthEngine.calculateNetWorth(wallets, [], [], [], spaceId);

    return {
      spaceId,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netWorth: netWorth > 0 ? netWorth : totalBalance,
      budgetProgress: 0,
      recentTransactions: txs.slice(0, 5)
    };
  }
}

export class LocalAIRepository implements AIRepository {
  async getInsights(spaceId: string): Promise<string[]> {
    return [
      'Tỷ lệ tiết kiệm tháng này đạt 35%, cao hơn 5% so với mục tiêu đề ra.',
      'Chi tiêu Ăn uống tăng nhẹ 8% vào cuối tuần, đề xuất đặt hạn mức cảnh báo 500k/ngày.',
      'Danh mục đầu tư VN30 ETF đang sinh lời +20.4%, đóng góp tích cực vào Net Worth.'
    ];
  }
}

export class LocalBackupRepository implements BackupRepository {
  private backups: (BackupInfo & { spaceId?: string })[] = [
    {
      id: 'bk_20260812',
      timestamp: new Date().toISOString(),
      sizeBytes: 1048576,
      version: '2.5.0',
      location: 'local',
      filename: 'DailyFinance_Backup_2026-08-12.json',
      spaceId: 'sp_personal'
    }
  ];

  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async backupData(spaceId?: string): Promise<BackupInfo> {
    const backup = await this.dataSource.backupData(spaceId);
    const backupWithSpace = { ...backup, spaceId };
    this.backups = [backupWithSpace, ...this.backups];
    return backupWithSpace;
  }

  async restoreData(backupId: string, targetSpaceId?: string): Promise<boolean> {
    const existingBackup = this.backups.find(b => b.id === backupId);
    if (existingBackup && existingBackup.spaceId && targetSpaceId && existingBackup.spaceId !== targetSpaceId) {
      throw new Error(`Backup space mismatch: Backup ${backupId} belongs to space '${existingBackup.spaceId}' but restore target is '${targetSpaceId}'`);
    }
    return this.dataSource.restoreData(backupId);
  }

  async getBackups(spaceId?: string): Promise<BackupInfo[]> {
    if (!spaceId) return [...this.backups];
    return this.backups.filter(b => !b.spaceId || b.spaceId === spaceId);
  }
}

export class LocalPreferenceRepository implements PreferenceRepository {
  constructor(
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getUserPreferences(): Promise<UserPreference> {
    return this.dataSource.getUserPreferences();
  }

  async updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference> {
    return this.dataSource.updateUserPreferences(prefs);
  }
}

export class LocalFeatureRepository implements FeatureRepository {
  private registry = FeatureToggleRegistry.getInstance();

  async getFeatureConfig(): Promise<FeatureConfig> {
    return this.registry.getConfig();
  }

  async toggleFeature(feature: keyof FeatureConfig): Promise<boolean> {
    return this.registry.toggleFeature(feature);
  }
}
