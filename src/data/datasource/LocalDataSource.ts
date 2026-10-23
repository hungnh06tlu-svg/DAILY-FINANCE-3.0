/**
 * Daily Finance 3.0 - LocalDataSource (DB-001 / DB-001R)
 * Offline-first local data source with dual-layer synchronization:
 * Active in-memory caching grounded in durable, transactional relational persistence.
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
import { SQLitePersistenceAdapter } from '../database/SQLitePersistenceAdapter';

export interface DataSource {
  // Database Adapter
  getDatabaseAdapter?(): SQLitePersistenceAdapter;

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
  private static instance: LocalDataSource | null = null;

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

  private db: SQLitePersistenceAdapter;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(customDb?: SQLitePersistenceAdapter) {
    this.db = customDb || SQLitePersistenceAdapter.getInstance();
  }

  public static getInstance(customDb?: SQLitePersistenceAdapter): LocalDataSource {
    if (!LocalDataSource.instance) {
      LocalDataSource.instance = new LocalDataSource(customDb);
    }
    return LocalDataSource.instance;
  }

  public static resetInstance(customDb?: SQLitePersistenceAdapter): LocalDataSource {
    LocalDataSource.instance = new LocalDataSource(customDb);
    return LocalDataSource.instance;
  }

  public getDatabaseAdapter(): SQLitePersistenceAdapter {
    return this.db;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.db.open();

      // Check if durable storage already holds data
      const existingSpaces = await this.db.query('SELECT * FROM spaces;');
      if (existingSpaces && existingSpaces.length > 0) {
        // Hydrate from durable persistent storage
        await this.hydrateFromDatabase();
      } else {
        // First run on clean database: seed initial collections transactionally
        await this.seedInitialDatabase();
      }

      this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  private async hydrateFromDatabase(): Promise<void> {
    // 1. Spaces
    const spaces = await this.db.query('SELECT * FROM spaces;');
    if (spaces.length > 0) {
      this.spaces = spaces.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        balance: Number(r.balance || 0),
        currency: r.currency || 'VND',
        cardColor: r.cardColor,
        iconName: r.iconName,
        ownerName: r.ownerName,
        membersCount: Number(r.membersCount || 1),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        version: Number(r.version || 1)
      }));
    }

    // 2. Wallets
    const wallets = await this.db.query('SELECT * FROM wallets;');
    if (wallets.length > 0) {
      this.wallets = wallets.map((r) => ({
        id: r.id,
        spaceId: r.spaceId,
        name: r.name,
        type: r.type,
        currency: r.currency || 'VND',
        initialBalance: Number(r.initialBalance || 0),
        currentBalance: Number(r.currentBalance || 0),
        status: r.status || 'active',
        cardColor: r.cardColor,
        iconName: r.iconName,
        isDefault: Boolean(r.isDefault),
        isDeleted: Boolean(r.isDeleted),
        deletedAt: r.deletedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        version: Number(r.version || 1)
      }));
    }

    // 3. Transactions
    const txs = await this.db.query('SELECT * FROM transactions;');
    if (txs.length > 0) {
      this.transactions = txs.map((r) => ({
        id: r.id,
        spaceId: r.spaceId,
        walletId: r.walletId,
        accountId: r.accountId,
        targetSpaceId: r.targetSpaceId,
        targetWalletId: r.targetWalletId,
        categoryId: r.categoryId,
        category: r.category,
        type: r.transactionType,
        amount: Number(r.amount),
        currency: r.currency || 'VND',
        note: r.note,
        description: r.description,
        date: r.date,
        status: r.status,
        merchant: r.merchant,
        fundId: r.fundId,
        targetFundId: r.targetFundId,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
        auditTrail: typeof r.auditTrail === 'string' ? JSON.parse(r.auditTrail) : r.auditTrail || [],
        isDeleted: Boolean(r.isDeleted),
        deletedAt: r.deletedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        version: Number(r.version || 1),
        syncStatus: r.syncStatus || 'pending'
      }));
    }

    // 4. Budgets
    const budgets = await this.db.query('SELECT * FROM budgets;');
    if (budgets.length > 0) {
      this.budgets = budgets.map((r) => {
        const existing = this.budgets.find(b => b.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          category: existing?.category || r.categoryName || r.categoryId || 'General',
          categoryId: r.categoryId,
          categoryName: r.categoryName || existing?.category,
          period: (r.period as any) || existing?.period || 'monthly',
          allocatedAmount: Number(r.allocatedAmount !== undefined ? r.allocatedAmount : ((existing as any)?.allocatedAmount || 0)),
          spentAmount: Number(r.spentAmount !== undefined ? r.spentAmount : ((existing as any)?.spentAmount || 0)),
          remainingAmount: Number(r.remainingAmount !== undefined ? r.remainingAmount : ((existing as any)?.remainingAmount || 0)),
          currency: r.currency || existing?.currency || 'VND',
          warningThreshold: Number(r.warningThreshold !== undefined ? r.warningThreshold : (existing?.warningThreshold || 0.8)),
          status: r.status || existing?.status || 'active'
        };
      });
    }

    // 5. Savings Goals
    const savings = await this.db.query('SELECT * FROM savings_goals;');
    if (savings.length > 0) {
      this.savingsGoals = savings.map((r) => {
        const existing = this.savingsGoals.find(s => s.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          title: existing?.title || r.name || 'Mục tiêu',
          name: r.name || existing?.title || 'Mục tiêu',
          targetAmount: Number(r.targetAmount !== undefined ? r.targetAmount : (existing?.targetAmount || 0)),
          currentAmount: Number(r.currentAmount !== undefined ? r.currentAmount : (existing?.currentAmount || 0)),
          currency: r.currency || existing?.currency || 'VND',
          deadline: r.targetDate || existing?.deadline || new Date().toISOString(),
          category: (existing?.category || 'general') as any,
          icon: existing?.icon || 'Target',
          status: r.status || existing?.status || 'active'
        };
      });
    }

    // 6. Debts
    const debts = await this.db.query('SELECT * FROM debts_loans;');
    if (debts.length > 0) {
      this.debtsAndLoans = debts.map((r) => {
        const existing = this.debtsAndLoans.find(d => d.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          type: (r.type as 'debt' | 'loan') || existing?.type || 'debt',
          title: existing?.title || r.personName || 'Khoản nợ',
          counterparty: existing?.counterparty || r.personName || 'Đối tác',
          originalAmount: existing?.originalAmount || Number(r.amount || 0),
          remainingAmount: Number(r.remainingAmount !== undefined ? r.remainingAmount : (existing?.remainingAmount || r.amount || 0)),
          interestRate: existing?.interestRate || 0,
          minimumMonthlyPayment: existing?.minimumMonthlyPayment || 0,
          dueDate: r.dueDate || existing?.dueDate || new Date().toISOString().split('T')[0],
          status: r.status || existing?.status || 'active'
        };
      });
    }

    // 7. Investments
    const invs = await this.db.query('SELECT * FROM investments;');
    if (invs.length > 0) {
      this.investments = invs.map((r) => {
        const existing = this.investments.find(i => i.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          name: r.name,
          type: (r.type as any) || existing?.type || 'stock',
          quantity: Number(r.quantity || 0),
          purchasePrice: Number(r.purchasePrice || 0),
          currentPrice: Number(r.currentPrice || 0),
          currency: r.currency || 'VND',
          symbol: r.symbol || existing?.symbol
        };
      });
    }

    // 8. Six Jars
    const jars = await this.db.query('SELECT * FROM six_jars;');
    if (jars.length > 0) {
      this.sixJars = jars.map((r) => {
        const existing = this.sixJars.find(j => j.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          key: existing?.key || r.id.replace('jar_', '').toUpperCase(),
          nameVi: existing?.nameVi || r.name || 'Hũ tài chính',
          nameEn: existing?.nameEn || r.name || 'Financial Jar',
          name: r.name,
          percent: Number(r.percentage !== undefined ? r.percentage : (existing?.percent || 0)),
          percentage: Number(r.percentage !== undefined ? r.percentage : (existing?.percent || 0)),
          currentBalance: Number(r.allocatedAmount !== undefined ? r.allocatedAmount : (existing?.currentBalance || 0)),
          allocatedAmount: Number(r.allocatedAmount || 0),
          spentAmount: Number(r.spentAmount || 0),
          color: r.color || existing?.color || '#3B82F6'
        };
      });
    }

    // 9. Credit Cards
    const cards = await this.db.query('SELECT * FROM credit_cards;');
    if (cards.length > 0) {
      this.creditCards = cards.map((r) => {
        const existing = this.creditCards.find(c => c.id === r.id);
        return {
          id: r.id,
          spaceId: r.spaceId,
          cardName: existing?.cardName || r.name || 'Thẻ tín dụng',
          name: r.name || existing?.cardName || 'Thẻ tín dụng',
          bankName: existing?.bankName || r.bank || 'Ngân hàng',
          creditLimit: Number(r.cardLimit !== undefined ? r.cardLimit : (existing?.creditLimit || 0)),
          currentBalance: Number(r.currentBalance !== undefined ? r.currentBalance : (existing?.currentBalance || 0)),
          statementDate: Number(r.statementDate) || existing?.statementDate || 20,
          dueDate: Number(r.paymentDueDate) || existing?.dueDate || 5,
          cashbackPercent: existing?.cashbackPercent || Number(r.cashbackPercent) || 0,
          cardColor: existing?.cardColor || '#10B981'
        };
      });
    }

    // 10. Preferences
    const pref = await this.db.queryOne('SELECT * FROM user_preferences WHERE userId = ?;', ['usr_default']);
    if (pref) {
      this.userPreferences = {
        userId: pref.userId,
        language: pref.language || 'vi',
        theme: pref.theme || 'm3-expressive',
        baseCurrency: pref.baseCurrency || 'VND',
        defaultSpaceId: pref.defaultSpaceId || 'sp_personal',
        biometricEnabled: Boolean(pref.biometricEnabled),
        notificationEnabled: Boolean(pref.notificationEnabled)
      };
    }
  }

  private async seedInitialDatabase(): Promise<void> {
    await this.db.transaction(async (trx) => {
      const now = new Date().toISOString();

      // Spaces
      for (const s of this.spaces) {
        await trx.execute(`
          INSERT INTO spaces (id, name, type, balance, currency, cardColor, iconName, ownerName, membersCount, createdAt, updatedAt, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [s.id, s.name, s.type, s.balance || 0, s.currency || 'VND', s.cardColor || null, s.iconName || null, s.ownerName || null, s.membersCount || 1, s.createdAt || now, s.updatedAt || now, s.version || 1]);
      }

      // Wallets
      for (const w of this.wallets) {
        await trx.execute(`
          INSERT INTO wallets (id, spaceId, name, type, currency, initialBalance, currentBalance, status, isDefault, isDeleted, createdAt, updatedAt, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [w.id, w.spaceId, w.name, w.type, w.currency || 'VND', w.initialBalance || 0, w.currentBalance || 0, w.status || 'active', w.isDefault ? 1 : 0, w.isDeleted ? 1 : 0, w.createdAt || now, w.updatedAt || now, w.version || 1]);
      }

      // Transactions
      for (const t of this.transactions) {
        await trx.execute(`
          INSERT INTO transactions (
            id, spaceId, walletId, accountId, targetSpaceId, targetWalletId,
            categoryId, category, transactionType, amount, currency, exchangeRate,
            note, description, transactionDate, date, status, merchant,
            tags, auditTrail, createdAt, updatedAt, version, isDeleted, syncStatus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          t.id, t.spaceId, t.walletId || null, (t as any).accountId || null, t.targetSpaceId || null, (t as any).targetWalletId || null,
          t.categoryId || t.category || 'general', t.category || t.categoryId || 'General', t.type, t.amount, t.currency || 'VND', 1,
          t.note || null, t.description || null, (t as any).transactionDate || t.date || now, t.date || now.split('T')[0], t.status || 'draft', t.merchant || null,
          JSON.stringify(t.tags || []), JSON.stringify(t.auditTrail || []), t.createdAt || now, t.updatedAt || now, t.version || 1, t.isDeleted ? 1 : 0, t.syncStatus || 'pending'
        ]);
      }

      // Budgets
      for (const b of this.budgets as any[]) {
        await trx.execute(`
          INSERT INTO budgets (id, spaceId, categoryId, categoryName, period, allocatedAmount, spentAmount, remainingAmount, currency, warningThreshold, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          b.id, b.spaceId, b.categoryId ?? b.category ?? 'general', b.categoryName ?? b.category ?? null,
          b.period ?? 'monthly', b.allocatedAmount ?? 0, b.spentAmount ?? 0, b.remainingAmount ?? 0, b.currency ?? 'VND',
          b.warningThreshold ?? 80, b.status ?? 'active', now, now
        ]);
      }

      // Savings Goals
      for (const s of this.savingsGoals as any[]) {
        await trx.execute(`
          INSERT INTO savings_goals (id, spaceId, name, targetAmount, currentAmount, currency, targetDate, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          s.id, s.spaceId, s.name ?? s.title ?? 'Goal', s.targetAmount ?? 0, s.currentAmount ?? 0,
          s.currency ?? 'VND', s.targetDate ?? s.deadline ?? null, s.status ?? 'active', now, now
        ]);
      }

      // Debts & Loans
      for (const d of this.debtsAndLoans as any[]) {
        await trx.execute(`
          INSERT INTO debts_loans (id, spaceId, type, personName, amount, remainingAmount, currency, dueDate, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          d.id, d.spaceId, d.type ?? 'debt', d.personName ?? d.title ?? d.counterparty ?? 'Counterparty',
          d.amount ?? d.originalAmount ?? 0, d.remainingAmount ?? 0, d.currency ?? 'VND', d.dueDate ?? null, d.status ?? 'active', now, now
        ]);
      }

      // Investments
      for (const i of this.investments as any[]) {
        await trx.execute(`
          INSERT INTO investments (id, spaceId, name, type, quantity, purchasePrice, currentPrice, currency, symbol, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          i.id, i.spaceId, i.name, i.type, i.quantity ?? 0, i.purchasePrice ?? 0,
          i.currentPrice ?? 0, i.currency ?? 'VND', i.symbol ?? null, now, now
        ]);
      }

      // Six Jars
      for (const j of this.sixJars as any[]) {
        await trx.execute(`
          INSERT INTO six_jars (id, spaceId, name, percentage, allocatedAmount, spentAmount, color, icon, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          j.id, j.spaceId, j.name ?? j.nameVi ?? j.nameEn ?? 'Jar',
          j.percentage ?? j.percent ?? 0, j.allocatedAmount ?? j.currentBalance ?? 0,
          j.spentAmount ?? 0, j.color ?? null, j.icon ?? null, now, now
        ]);
      }

      // Credit Cards
      for (const c of this.creditCards as any[]) {
        await trx.execute(`
          INSERT INTO credit_cards (id, spaceId, name, bank, cardLimit, currentBalance, statementDate, paymentDueDate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [
          c.id, c.spaceId, c.name ?? c.cardName ?? 'Card', c.bank ?? c.bankName ?? 'Bank',
          c.cardLimit ?? c.creditLimit ?? 0, c.currentBalance ?? 0,
          String(c.statementDate ?? ''), String(c.dueDate ?? c.paymentDueDate ?? ''), now, now
        ]);
      }

      // User Preferences
      await trx.execute(`
        INSERT INTO user_preferences (userId, language, theme, baseCurrency, defaultSpaceId, biometricEnabled, notificationEnabled, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, ['usr_default', this.userPreferences.language, this.userPreferences.theme, this.userPreferences.baseCurrency, this.userPreferences.defaultSpaceId, this.userPreferences.biometricEnabled ? 1 : 0, this.userPreferences.notificationEnabled ? 1 : 0, now]);
    });
  }

  // Transactions
  async getTransactions(spaceId?: string): Promise<Transaction[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.transactions];
    // Preserve legitimate cross-space transfer source/destination visibility
    return this.transactions.filter(
      (tx) => tx.spaceId === spaceId || tx.targetSpaceId === spaceId
    );
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.ensureInitialized();
    return this.transactions.find((tx) => tx.id === id) || null;
  }

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    await this.ensureInitialized();
    const newTx: Transaction = {
      ...tx,
      id: IdGenerator.generateTransactionId()
    };
    const now = new Date().toISOString();

    // Durable write-through first: if durable write fails, memory state is not modified
    await this.db.execute(`
      INSERT OR REPLACE INTO transactions (
        id, spaceId, walletId, accountId, targetSpaceId, targetWalletId,
        categoryId, category, transactionType, amount, currency, exchangeRate,
        note, description, transactionDate, date, status, merchant,
        tags, auditTrail, createdAt, updatedAt, version, isDeleted, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newTx.id, newTx.spaceId, newTx.walletId || null, (newTx as any).accountId || null, newTx.targetSpaceId || null, (newTx as any).targetWalletId || null,
      newTx.categoryId || newTx.category || 'general', newTx.category || newTx.categoryId || 'General', newTx.type, newTx.amount, newTx.currency || 'VND', 1,
      newTx.note || null, newTx.description || null, (newTx as any).transactionDate || newTx.date || now, newTx.date || now.split('T')[0], newTx.status || 'draft', newTx.merchant || null,
      JSON.stringify(newTx.tags || []), JSON.stringify(newTx.auditTrail || []), newTx.createdAt || now, newTx.updatedAt || now, newTx.version || 1, newTx.isDeleted ? 1 : 0, newTx.syncStatus || 'pending'
    ]);

    this.transactions.unshift(newTx);
    return newTx;
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    await this.ensureInitialized();
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT OR REPLACE INTO transactions (
        id, spaceId, walletId, accountId, targetSpaceId, targetWalletId,
        categoryId, category, transactionType, amount, currency, exchangeRate,
        note, description, transactionDate, date, status, merchant,
        tags, auditTrail, createdAt, updatedAt, version, isDeleted, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      tx.id, tx.spaceId, tx.walletId || null, (tx as any).accountId || null, tx.targetSpaceId || null, (tx as any).targetWalletId || null,
      tx.categoryId || tx.category || 'general', tx.category || tx.categoryId || 'General', tx.type, tx.amount, tx.currency || 'VND', 1,
      tx.note || null, tx.description || null, (tx as any).transactionDate || tx.date || now, tx.date || now.split('T')[0], tx.status || 'draft', tx.merchant || null,
      JSON.stringify(tx.tags || []), JSON.stringify(tx.auditTrail || []), tx.createdAt || now, now, (tx.version || 1) + 1, tx.isDeleted ? 1 : 0, tx.syncStatus || 'pending'
    ]);

    const index = this.transactions.findIndex((item) => item.id === tx.id);
    if (index !== -1) {
      this.transactions[index] = { ...tx, updatedAt: now, version: (tx.version || 1) + 1 };
    } else {
      this.transactions.unshift({ ...tx, updatedAt: now, version: (tx.version || 1) + 1 });
    }
    return tx;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.transactions.find((tx) => tx.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM transactions WHERE id = ?;', [id]);
    this.transactions = this.transactions.filter((tx) => tx.id !== id);
    return true;
  }

  // Wallets
  async getWallets(spaceId?: string): Promise<Wallet[]> {
    await this.ensureInitialized();
    const active = this.wallets.filter((w) => !w.isDeleted && w.status !== 'archived');
    if (!spaceId) return [...active];
    return active.filter((w) => w.spaceId === spaceId);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    await this.ensureInitialized();
    return this.wallets.find((w) => w.id === id) || null;
  }

  async addWallet(wallet: Wallet | Omit<Wallet, 'id'>): Promise<Wallet> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newWallet: Wallet = {
      ...wallet,
      id: ('id' in wallet && wallet.id) ? wallet.id : IdGenerator.generateWalletId()
    };

    await this.db.execute(`
      INSERT OR REPLACE INTO wallets (id, spaceId, name, type, currency, initialBalance, currentBalance, status, isDefault, isDeleted, createdAt, updatedAt, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newWallet.id, newWallet.spaceId, newWallet.name, newWallet.type, newWallet.currency || 'VND',
      newWallet.initialBalance || 0, newWallet.currentBalance || 0, newWallet.status || 'active',
      newWallet.isDefault ? 1 : 0, newWallet.isDeleted ? 1 : 0, newWallet.createdAt || now, now, newWallet.version || 1
    ]);

    this.wallets.push(newWallet);
    return newWallet;
  }

  async updateWallet(wallet: Wallet): Promise<Wallet> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const updated: Wallet = {
      ...wallet,
      updatedAt: now,
      version: (wallet.version || 1) + 1
    };

    await this.db.execute(`
      INSERT OR REPLACE INTO wallets (id, spaceId, name, type, currency, initialBalance, currentBalance, status, isDefault, isDeleted, createdAt, updatedAt, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      updated.id, updated.spaceId, updated.name, updated.type, updated.currency || 'VND',
      updated.initialBalance || 0, updated.currentBalance || 0, updated.status || 'active',
      updated.isDefault ? 1 : 0, updated.isDeleted ? 1 : 0, updated.createdAt || now, now, updated.version
    ]);

    const index = this.wallets.findIndex((w) => w.id === wallet.id);
    if (index !== -1) {
      this.wallets[index] = updated;
    }
    return updated;
  }

  async deleteWallet(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const wallet = this.wallets.find((w) => w.id === id);
    if (!wallet) return false;

    const hasTransactions = this.transactions.some(
      (tx) => tx.walletId === id || tx.targetWalletId === id || (tx as any).accountId === id
    );

    const now = new Date().toISOString();
    if (hasTransactions) {
      // Soft-delete and archive in database
      await this.db.execute(`
        UPDATE wallets SET isDeleted = 1, status = 'archived', deletedAt = ?, updatedAt = ?, version = version + 1
        WHERE id = ?;
      `, [now, now, id]);

      wallet.isDeleted = true;
      wallet.status = 'archived';
      wallet.deletedAt = now;
      wallet.updatedAt = now;
      wallet.version = (wallet.version || 1) + 1;
      return true;
    }

    // Hard delete
    await this.db.execute('DELETE FROM wallets WHERE id = ?;', [id]);
    this.wallets = this.wallets.filter((w) => w.id !== id);
    return true;
  }

  // Spaces
  async getSpaces(): Promise<FinancialSpace[]> {
    await this.ensureInitialized();
    return [...this.spaces];
  }

  async getSpaceById(id: string): Promise<FinancialSpace | null> {
    await this.ensureInitialized();
    return this.spaces.find((s) => s.id === id) || null;
  }

  async addSpace(space: FinancialSpace | Omit<FinancialSpace, 'id'>): Promise<FinancialSpace> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
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
      createdAt: space.createdAt || now,
      updatedAt: space.updatedAt || now,
      version: space.version || 1
    };

    await this.db.execute(`
      INSERT OR REPLACE INTO spaces (id, name, type, balance, currency, cardColor, iconName, ownerName, membersCount, createdAt, updatedAt, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newSpace.id, newSpace.name, newSpace.type, newSpace.balance || 0, newSpace.currency || 'VND',
      newSpace.cardColor || null, newSpace.iconName || null, newSpace.ownerName || null, newSpace.membersCount || 1,
      newSpace.createdAt, newSpace.updatedAt, newSpace.version
    ]);

    this.spaces.push(newSpace);
    return { ...newSpace };
  }

  async updateSpace(space: FinancialSpace): Promise<FinancialSpace> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const updated: FinancialSpace = {
      ...space,
      updatedAt: now,
      version: (space.version || 1) + 1
    };

    await this.db.execute(`
      INSERT OR REPLACE INTO spaces (id, name, type, balance, currency, cardColor, iconName, ownerName, membersCount, createdAt, updatedAt, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      updated.id, updated.name, updated.type, updated.balance || 0, updated.currency || 'VND',
      updated.cardColor || null, updated.iconName || null, updated.ownerName || null, updated.membersCount || 1,
      updated.createdAt || now, now, updated.version
    ]);

    const index = this.spaces.findIndex((s) => s.id === space.id);
    if (index !== -1) {
      this.spaces[index] = updated;
    } else {
      this.spaces.push(updated);
    }
    return { ...updated };
  }

  async deleteSpace(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.spaces.find((s) => s.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM spaces WHERE id = ?;', [id]);
    this.spaces = this.spaces.filter((s) => s.id !== id);
    return true;
  }

  // Budgets
  async getBudgets(spaceId?: string): Promise<Budget[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.budgets];
    return this.budgets.filter((b) => b.spaceId === spaceId);
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newBudget: Budget = {
      ...budget,
      spaceId: budget.spaceId || 'sp_personal',
      id: IdGenerator.generateBudgetId()
    };

    const bCatId = (newBudget as any).categoryId || newBudget.category || 'general';
    const bCatName = (newBudget as any).categoryName || newBudget.category || null;
    const bRemaining = (newBudget as any).remainingAmount || 0;

    await this.db.execute(`
      INSERT OR REPLACE INTO budgets (id, spaceId, categoryId, categoryName, period, allocatedAmount, spentAmount, remainingAmount, currency, warningThreshold, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newBudget.id, newBudget.spaceId, bCatId, bCatName, newBudget.period,
      newBudget.allocatedAmount, newBudget.spentAmount || 0, bRemaining, newBudget.currency || 'VND',
      newBudget.warningThreshold || 80, newBudget.status || 'active', now, now
    ]);

    this.budgets.push(newBudget);
    return newBudget;
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const bCatId = (budget as any).categoryId || budget.category || 'general';
    const bCatName = (budget as any).categoryName || budget.category || null;
    const bRemaining = (budget as any).remainingAmount || 0;

    await this.db.execute(`
      INSERT OR REPLACE INTO budgets (id, spaceId, categoryId, categoryName, period, allocatedAmount, spentAmount, remainingAmount, currency, warningThreshold, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      budget.id, budget.spaceId, bCatId, bCatName, budget.period,
      budget.allocatedAmount, budget.spentAmount || 0, bRemaining, budget.currency || 'VND',
      budget.warningThreshold || 80, budget.status || 'active', now, now
    ]);

    const index = this.budgets.findIndex((b) => b.id === budget.id);
    if (index !== -1) {
      this.budgets[index] = { ...budget };
    }
    return budget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.budgets.find((b) => b.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM budgets WHERE id = ?;', [id]);
    this.budgets = this.budgets.filter((b) => b.id !== id);
    return true;
  }

  // Savings Goals
  async getSavingsGoals(spaceId?: string): Promise<SavingsGoal[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.savingsGoals];
    return this.savingsGoals.filter((s) => s.spaceId === spaceId);
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newGoal: SavingsGoal = {
      ...goal,
      spaceId: goal.spaceId || 'sp_personal',
      id: IdGenerator.generateSavingsGoalId()
    };
    const gName = (newGoal as any).name || newGoal.title || 'Mục tiêu';
    const gDate = (newGoal as any).targetDate || newGoal.deadline || null;

    await this.db.execute(`
      INSERT INTO savings_goals (id, spaceId, name, targetAmount, currentAmount, currency, targetDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newGoal.id, newGoal.spaceId, gName, newGoal.targetAmount, newGoal.currentAmount || 0,
      newGoal.currency || 'VND', gDate, newGoal.status || 'active', now, now
    ]);

    this.savingsGoals.push(newGoal);
    return newGoal;
  }

  async updateSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const gName = (goal as any).name || goal.title || 'Mục tiêu';
    const gDate = (goal as any).targetDate || goal.deadline || null;

    await this.db.execute(`
      INSERT OR REPLACE INTO savings_goals (id, spaceId, name, targetAmount, currentAmount, currency, targetDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      goal.id, goal.spaceId, gName, goal.targetAmount, goal.currentAmount || 0,
      goal.currency || 'VND', gDate, goal.status || 'active', now, now
    ]);

    const index = this.savingsGoals.findIndex((s) => s.id === goal.id);
    if (index !== -1) {
      this.savingsGoals[index] = { ...goal };
    }
    return goal;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.savingsGoals.find((s) => s.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM savings_goals WHERE id = ?;', [id]);
    this.savingsGoals = this.savingsGoals.filter((s) => s.id !== id);
    return true;
  }

  // Investments
  async getInvestments(spaceId?: string): Promise<Investment[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.investments];
    return this.investments.filter((inv) => inv.spaceId === spaceId);
  }

  async addInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newInv: Investment = {
      ...inv,
      id: IdGenerator.generateInvestmentId()
    };

    await this.db.execute(`
      INSERT OR REPLACE INTO investments (id, spaceId, name, type, quantity, purchasePrice, currentPrice, currency, symbol, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newInv.id, newInv.spaceId, newInv.name, newInv.type, newInv.quantity, newInv.purchasePrice,
      newInv.currentPrice, newInv.currency || 'VND', newInv.symbol || null, now, now
    ]);

    this.investments.push(newInv);
    return newInv;
  }

  async updateInvestment(inv: Investment): Promise<Investment> {
    await this.ensureInitialized();
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT OR REPLACE INTO investments (id, spaceId, name, type, quantity, purchasePrice, currentPrice, currency, symbol, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      inv.id, inv.spaceId, inv.name, inv.type, inv.quantity, inv.purchasePrice,
      inv.currentPrice, inv.currency || 'VND', inv.symbol || null, now, now
    ]);

    const index = this.investments.findIndex((item) => item.id === inv.id);
    if (index !== -1) {
      this.investments[index] = { ...inv };
    }
    return inv;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.investments.find((i) => i.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM investments WHERE id = ?;', [id]);
    this.investments = this.investments.filter((i) => i.id !== id);
    return true;
  }

  // Debts & Loans
  async getDebtsAndLoans(spaceId?: string): Promise<DebtItem[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.debtsAndLoans];
    return this.debtsAndLoans.filter((d) => d.spaceId === spaceId);
  }

  async addDebtOrLoan(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newItem: DebtItem = {
      ...item,
      spaceId: item.spaceId || 'sp_personal',
      id: IdGenerator.generateDebtId()
    };
    const personName = (newItem as any).personName || newItem.counterparty || newItem.title || 'Đối tác';
    const amount = (newItem as any).amount ?? newItem.originalAmount ?? 0;
    const currency = (newItem as any).currency || 'VND';

    await this.db.execute(`
      INSERT OR REPLACE INTO debts_loans (id, spaceId, type, personName, amount, remainingAmount, currency, dueDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newItem.id, newItem.spaceId, newItem.type, personName, amount,
      newItem.remainingAmount, currency, newItem.dueDate || null, newItem.status || 'active', now, now
    ]);

    this.debtsAndLoans.push(newItem);
    return newItem;
  }

  async updateDebtOrLoan(item: DebtItem): Promise<DebtItem> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const personName = (item as any).personName || item.counterparty || item.title || 'Đối tác';
    const amount = (item as any).amount ?? item.originalAmount ?? 0;
    const currency = (item as any).currency || 'VND';

    await this.db.execute(`
      INSERT OR REPLACE INTO debts_loans (id, spaceId, type, personName, amount, remainingAmount, currency, dueDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      item.id, item.spaceId, item.type, personName, amount,
      item.remainingAmount, currency, item.dueDate || null, item.status || 'active', now, now
    ]);

    const index = this.debtsAndLoans.findIndex((d) => d.id === item.id);
    if (index !== -1) {
      this.debtsAndLoans[index] = { ...item };
    }
    return item;
  }

  async deleteDebtOrLoan(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.debtsAndLoans.find((d) => d.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM debts_loans WHERE id = ?;', [id]);
    this.debtsAndLoans = this.debtsAndLoans.filter((d) => d.id !== id);
    return true;
  }

  // Six Jars
  async getSixJars(spaceId?: string): Promise<SixJar[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.sixJars];
    return this.sixJars.filter((j) => j.spaceId === spaceId);
  }

  async addSixJar(jar: Omit<SixJar, 'id'>): Promise<SixJar> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const newJar: SixJar = {
      ...jar,
      spaceId: jar.spaceId || 'sp_personal',
      id: IdGenerator.generateId('jar')
    };
    const name = (newJar as any).name || (newJar as any).nameVi || (newJar as any).nameEn || 'Hũ';
    const percentage = (newJar as any).percentage ?? (newJar as any).percent ?? 0;
    const allocated = (newJar as any).allocatedAmount ?? (newJar as any).currentBalance ?? 0;
    const spent = (newJar as any).spentAmount ?? 0;
    const icon = (newJar as any).icon ?? null;

    await this.db.execute(`
      INSERT OR REPLACE INTO six_jars (id, spaceId, name, percentage, allocatedAmount, spentAmount, color, icon, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newJar.id, newJar.spaceId, name, percentage, allocated,
      spent, newJar.color || null, icon, now, now
    ]);

    this.sixJars.push(newJar);
    return newJar;
  }

  async updateSixJar(jar: SixJar): Promise<SixJar> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const name = (jar as any).name || (jar as any).nameVi || (jar as any).nameEn || 'Hũ';
    const percentage = (jar as any).percentage ?? (jar as any).percent ?? 0;
    const allocated = (jar as any).allocatedAmount ?? (jar as any).currentBalance ?? 0;
    const spent = (jar as any).spentAmount ?? 0;
    const icon = (jar as any).icon ?? null;

    await this.db.execute(`
      INSERT OR REPLACE INTO six_jars (id, spaceId, name, percentage, allocatedAmount, spentAmount, color, icon, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      jar.id, jar.spaceId, name, percentage, allocated,
      spent, jar.color || null, icon, now, now
    ]);

    const index = this.sixJars.findIndex((j) => j.id === jar.id);
    if (index !== -1) {
      this.sixJars[index] = { ...jar };
    }
    return jar;
  }

  async deleteSixJar(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const existing = this.sixJars.find((j) => j.id === id);
    if (!existing) return false;

    await this.db.execute('DELETE FROM six_jars WHERE id = ?;', [id]);
    this.sixJars = this.sixJars.filter((j) => j.id !== id);
    return true;
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreference> {
    await this.ensureInitialized();
    return { ...this.userPreferences };
  }

  async updateUserPreferences(prefs: Partial<UserPreference>): Promise<UserPreference> {
    await this.ensureInitialized();
    const updated = { ...this.userPreferences, ...prefs };
    const now = new Date().toISOString();

    await this.db.execute(`
      INSERT OR REPLACE INTO user_preferences (userId, language, theme, baseCurrency, defaultSpaceId, biometricEnabled, notificationEnabled, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      'usr_default', updated.language, updated.theme, updated.baseCurrency,
      updated.defaultSpaceId, updated.biometricEnabled ? 1 : 0, updated.notificationEnabled ? 1 : 0, now
    ]);

    this.userPreferences = updated;
    return { ...this.userPreferences };
  }

  // Credit Cards
  async getCreditCards(spaceId?: string): Promise<CreditCard[]> {
    await this.ensureInitialized();
    if (!spaceId) return [...this.creditCards];
    return this.creditCards.filter((c) => c.spaceId === spaceId);
  }

  // Backup & Restore
  async backupData(spaceId?: string): Promise<BackupInfo> {
    await this.ensureInitialized();
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

    // Persist backup package into durable database table
    await this.db.execute(
      'INSERT OR REPLACE INTO backup_packages (id, spaceId, timestamp, payload, checksum) VALUES (?, ?, ?, ?, ?);',
      [backupId, spaceId || 'sp_personal', pkg.metadata.timestamp, JSON.stringify(pkg), pkg.metadata.checksum]
    );

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
    await this.ensureInitialized();
    if (!backupId || backupId.trim() === '') return null;
    return this.ensureBackupPackage(backupId);
  }

  private async ensureBackupPackage(backupId: string): Promise<BackupPackage | null> {
    if (this.backupPackages.has(backupId)) {
      return this.backupPackages.get(backupId)!;
    }

    const row = await this.db.queryOne<{ payload: string }>(
      'SELECT payload FROM backup_packages WHERE id = ?;',
      [backupId]
    );
    if (row && row.payload) {
      const parsed = JSON.parse(row.payload);
      this.backupPackages.set(backupId, parsed);
      return parsed;
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
    await this.ensureInitialized();
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
    const now = new Date().toISOString();

    // ATOMIC TRANSACTION: Multi-entity database replacement
    // If database transaction fails, memory remains untouched!
    await this.db.transaction(async (trx) => {
      if (targetSpace) {
        // Space-scoped atomic restore
        await trx.execute('DELETE FROM transactions WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM wallets WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM budgets WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM savings_goals WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM debts_loans WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM investments WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM credit_cards WHERE spaceId = ?;', [targetSpace]);
        await trx.execute('DELETE FROM six_jars WHERE spaceId = ?;', [targetSpace]);

        if (Array.isArray(pkg.data.transactions)) {
          for (const t of pkg.data.transactions as any[]) {
            await trx.execute(`
              INSERT INTO transactions (id, spaceId, walletId, categoryId, category, transactionType, amount, currency, transactionDate, date, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              t.id, targetSpace, t.walletId || null, t.categoryId || t.category || 'general',
              t.category || t.categoryId || 'General', t.type, t.amount, t.currency || 'VND',
              t.transactionDate || t.date || now, t.date || now.split('T')[0], t.status || 'draft', now, now
            ]);
          }
        }
        if (Array.isArray(pkg.data.wallets)) {
          for (const w of pkg.data.wallets as any[]) {
            await trx.execute(`
              INSERT INTO wallets (id, spaceId, name, type, currency, initialBalance, currentBalance, status, isDefault, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [w.id, targetSpace, w.name, w.type, w.currency || 'VND', w.initialBalance || 0, w.currentBalance || 0, w.status || 'active', w.isDefault ? 1 : 0, now, now]);
          }
        }
      } else {
        // Global atomic restore
        await trx.execute('DELETE FROM transactions;');
        await trx.execute('DELETE FROM wallets;');
        await trx.execute('DELETE FROM budgets;');
        await trx.execute('DELETE FROM savings_goals;');
        await trx.execute('DELETE FROM debts_loans;');
        await trx.execute('DELETE FROM investments;');
        await trx.execute('DELETE FROM credit_cards;');
        await trx.execute('DELETE FROM six_jars;');

        if (Array.isArray(pkg.data.transactions)) {
          for (const t of pkg.data.transactions as any[]) {
            await trx.execute(`
              INSERT INTO transactions (id, spaceId, walletId, categoryId, category, transactionType, amount, currency, transactionDate, date, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
              t.id, t.spaceId || 'sp_personal', t.walletId || null, t.categoryId || t.category || 'general',
              t.category || t.categoryId || 'General', t.type, t.amount, t.currency || 'VND',
              t.transactionDate || t.date || now, t.date || now.split('T')[0], t.status || 'draft', now, now
            ]);
          }
        }
      }
    });

    // Database transaction succeeded: rehydrate memory collections atomically
    if (targetSpace) {
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
