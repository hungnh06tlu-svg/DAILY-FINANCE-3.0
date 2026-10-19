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
  CreditCard,
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
import { SpaceIsolationGuard, MoneyUtils } from '../domain/CanonicalFinancialModel';
import { FeatureToggleRegistry } from '../domain/FeatureToggleRegistry';

import { LocalTransactionRepository } from './local/LocalTransactionRepository';
export { LocalTransactionRepository };

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
    return this.dataSource.addSpace(space);
  }

  async getSpaceById(id: string): Promise<FinancialSpace | null> {
    return this.dataSource.getSpaceById(id);
  }

  async updateSpace(space: FinancialSpace): Promise<FinancialSpace> {
    return this.dataSource.updateSpace(space);
  }

  async deleteSpace(id: string): Promise<boolean> {
    return this.dataSource.deleteSpace(id);
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
    const validSpaceId = SpaceIsolationGuard.validateSpaceId(spaceId);
    const txs = await this.txRepo.getTransactions(validSpaceId);

    // Lifecycle filtering: active & confirmed transactions
    const activeTxs = txs.filter((t) => FinancialTruthEngine.isActiveConfirmedTransaction(t));

    // Optional period filtering if period specifies calendar month (e.g. YYYY-MM) or this_month
    let periodTxs = activeTxs;
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
      periodTxs = activeTxs.filter((t) => t.date >= start && t.date <= end);
    } else if (period === 'this_month') {
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
      const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
      const matching = activeTxs.filter((t) => t.date >= start && t.date <= end);
      if (matching.length > 0) {
        periodTxs = matching;
      }
    }

    const totalIncome = FinancialTruthEngine.calculateIncome(periodTxs, undefined, undefined, validSpaceId);
    const totalExpense = FinancialTruthEngine.calculateExpense(periodTxs, undefined, undefined, validSpaceId);
    const netCashFlow = FinancialTruthEngine.calculateCashFlow(totalIncome, totalExpense);

    const savingsRate = totalIncome > 0 ? MoneyUtils.round(((totalIncome - totalExpense) / totalIncome) * 100, 1) : 0;

    // Grounded top expense categories from actual transactions
    const expenseTxs = periodTxs.filter((t) => t.type === 'expense' && (t.amount || 0) > 0);
    const categoryTotals = new Map<string, number>();
    for (const t of expenseTxs) {
      const cat = t.category || t.categoryId || 'Khác';
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + Math.abs(t.amount || 0));
    }

    const topExpenseCategories = Array.from(categoryTotals.entries())
      .map(([category, amount]) => {
        const roundedAmount = MoneyUtils.round(amount, 2);
        const percent = totalExpense > 0 ? MoneyUtils.round((roundedAmount / totalExpense) * 100, 1) : 0;
        return { category, amount: roundedAmount, percent };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      id: `rep_${validSpaceId}_${period}`,
      spaceId: validSpaceId,
      period,
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsRate,
      topExpenseCategories
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
    const validSpaceId = SpaceIsolationGuard.validateSpaceId(spaceId);
    const txs = await this.txRepo.getTransactions(validSpaceId);
    const wallets = await this.walletRepo.getWallets(validSpaceId);
    const space = await this.dataSource.getSpaceById(validSpaceId);
    const investments = await this.dataSource.getInvestments(validSpaceId);
    const debts = await this.dataSource.getDebtsAndLoans(validSpaceId);
    const creditCards = (this.dataSource as any).getCreditCards
      ? await (this.dataSource as any).getCreditCards(validSpaceId)
      : [];
    const budgets = await this.dataSource.getBudgets(validSpaceId);

    const monthlyIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, validSpaceId);
    const monthlyExpense = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, validSpaceId);

    const activeWallets = wallets.filter(
      (w) => FinancialTruthEngine.isActiveEntity(w) && (w.status === 'active' || w.status === undefined)
    );
    const walletBalance = activeWallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0);
    const totalBalance = space && typeof space.balance === 'number' && space.balance !== 0
      ? space.balance
      : walletBalance;

    const netWorth = FinancialTruthEngine.calculateNetWorth(
      activeWallets,
      investments,
      debts,
      creditCards,
      validSpaceId
    );

    // Grounded budget progress calculation
    const activeBudgets = budgets.filter((b) => FinancialTruthEngine.isActiveEntity(b));
    const totalAllocated = activeBudgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const budgetProgress = totalAllocated > 0
      ? Math.min(100, MoneyUtils.round((totalSpent / totalAllocated) * 100, 1))
      : 0;

    const recentTransactions = txs
      .filter((t) => FinancialTruthEngine.isActiveConfirmedTransaction(t))
      .slice(0, 5);

    return {
      spaceId: validSpaceId,
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netWorth,
      budgetProgress,
      recentTransactions
    };
  }
}

export class LocalAIRepository implements AIRepository {
  constructor(
    private txRepo: TransactionRepository = new LocalTransactionRepository(),
    private walletRepo: WalletRepository = new LocalWalletRepository(),
    private dataSource: DataSource = LocalDataSource.getInstance()
  ) {}

  async getInsights(spaceId: string): Promise<string[]> {
    const validSpaceId = SpaceIsolationGuard.validateSpaceId(spaceId);
    const txs = await this.txRepo.getTransactions(validSpaceId);
    const wallets = await this.walletRepo.getWallets(validSpaceId);
    const investments = await this.dataSource.getInvestments(validSpaceId);
    const debts = await this.dataSource.getDebtsAndLoans(validSpaceId);

    const activeTxs = txs.filter((t) => FinancialTruthEngine.isActiveConfirmedTransaction(t));
    if (activeTxs.length === 0 && wallets.length === 0) {
      return ['Chưa có đủ dữ liệu giao dịch trong không gian này để phân tích thông tin tài chính.'];
    }

    const insights: string[] = [];
    const totalIncome = FinancialTruthEngine.calculateIncome(activeTxs, undefined, undefined, validSpaceId);
    const totalExpense = FinancialTruthEngine.calculateExpense(activeTxs, undefined, undefined, validSpaceId);
    const netCashFlow = FinancialTruthEngine.calculateCashFlow(totalIncome, totalExpense);

    if (totalIncome > 0) {
      const savingsRate = MoneyUtils.round(((totalIncome - totalExpense) / totalIncome) * 100, 1);
      if (savingsRate >= 20) {
        insights.push(`Tỷ lệ tiết kiệm hiện tại đạt ${savingsRate}%, phản ánh dòng tiền thặng dư tích cực trong không gian này.`);
      } else if (savingsRate > 0) {
        insights.push(`Tỷ lệ tiết kiệm hiện tại là ${savingsRate}%. Có thể tối ưu thêm chi tiêu để gia tăng tích lũy.`);
      } else {
        const formattedDeficit = new Intl.NumberFormat('vi-VN').format(Math.abs(netCashFlow));
        insights.push(`Dòng tiền đang thâm hụt (${formattedDeficit} VND). Đề xuất rà soát các khoản chi tiêu không thiết yếu.`);
      }
    }

    const expenseTxs = activeTxs.filter((t) => t.type === 'expense' && (t.amount || 0) > 0);
    if (expenseTxs.length > 0 && totalExpense > 0) {
      const categoryMap = new Map<string, number>();
      for (const t of expenseTxs) {
        const cat = t.category || t.categoryId || 'Khác';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount || 0));
      }
      let topCat = '';
      let topAmount = 0;
      for (const [cat, amt] of categoryMap.entries()) {
        if (amt > topAmount) {
          topAmount = amt;
          topCat = cat;
        }
      }
      if (topCat && topAmount > 0) {
        const catPercent = MoneyUtils.round((topAmount / totalExpense) * 100, 1);
        const formattedAmount = new Intl.NumberFormat('vi-VN').format(topAmount);
        insights.push(`Danh mục chi tiêu lớn nhất là "${topCat}" với ${formattedAmount} VND (${catPercent}% tổng chi tiêu).`);
      }
    }

    const activeInvestments = investments.filter((inv) => FinancialTruthEngine.isActiveEntity(inv));
    if (activeInvestments.length > 0) {
      const totalInvValue = activeInvestments.reduce((sum, inv) => sum + ((inv.quantity || 0) * (inv.currentPrice || 0)), 0);
      const totalInvCost = activeInvestments.reduce((sum, inv) => sum + ((inv.quantity || 0) * (inv.purchasePrice || 0)), 0);
      if (totalInvCost > 0) {
        const returnPct = MoneyUtils.round(((totalInvValue - totalInvCost) / totalInvCost) * 100, 1);
        const sign = returnPct >= 0 ? '+' : '';
        insights.push(`Danh mục đầu tư (${activeInvestments.length} khoản) có hiệu suất ${sign}${returnPct}% so với giá vốn.`);
      } else {
        const formattedValue = new Intl.NumberFormat('vi-VN').format(totalInvValue);
        insights.push(`Danh mục đầu tư hiện có tổng giá trị thị trường là ${formattedValue} VND.`);
      }
    }

    const activeDebts = debts.filter((d) => FinancialTruthEngine.isActiveEntity(d) && d.type === 'debt' && (d.remainingAmount || 0) > 0);
    if (activeDebts.length > 0) {
      const totalDebtOwed = activeDebts.reduce((sum, d) => sum + (d.remainingAmount || 0), 0);
      const formattedDebt = new Intl.NumberFormat('vi-VN').format(totalDebtOwed);
      insights.push(`Tổng dư nợ cần thanh toán trong không gian là ${formattedDebt} VND trên ${activeDebts.length} khoản nợ.`);
    }

    if (insights.length === 0) {
      insights.push('Chưa có đủ biến động thu chi hoặc danh mục đầu tư để đưa ra khuyến nghị chi tiết.');
    }

    return insights;
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
    return this.dataSource.restoreData(backupId, targetSpaceId);
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
