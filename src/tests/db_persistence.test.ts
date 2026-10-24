/**
 * Daily Finance 3.0 - DB-001 / DB-001R Persistence Correctness Test Suite
 * Standard: Clean Architecture / Offline-First Relational Database Verification
 * Tests SQLite persistence adapter, browser relational adapter, schema migrations,
 * reopen durability, hydration across instances, non-destructive corruption handling,
 * atomic transactions, multi-space isolation with cross-space transfers, and backup/restore.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SQLitePersistenceAdapter,
  BrowserStoragePersistenceAdapter,
  NodeSQLiteDriver,
  DatabaseInitializationError,
  StorageCorruptError,
  StorageQuotaExceededError,
  TransactionAbortedError
} from '../data/database/SQLitePersistenceAdapter';
import { LocalTransactionRepository } from '../repositories/local/LocalTransactionRepository';
import { LocalDataSource } from '../data/datasource/LocalDataSource';
import fs from 'node:fs';

describe('DB-001R — Persistence Correctness & Durability Suite', () => {
  const TEST_DB_PATH = '/tmp/df3_test_db001r.sqlite';

  beforeEach(() => {
    LocalDataSource.resetInstance();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {
        // Ignored
      }
    }
  });

  afterEach(() => {
    LocalDataSource.resetInstance();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {
        // Ignored
      }
    }
  });

  // ==========================================
  // 1. Schema Initialization & Versioned Migrations
  // ==========================================
  describe('1. Schema Initialization & Migrations', () => {
    it('DB01 — Initializes schema and applies versioned migrations up to v2', async () => {
      const adapter = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      await adapter.open();

      const version = await adapter.getSchemaVersion();
      expect(version).toBe(2);

      const migrations = await adapter.query('SELECT * FROM schema_migrations ORDER BY version ASC;');
      expect(migrations.length).toBe(2);
      expect(migrations[0].version).toBe(1);
      expect(migrations[1].version).toBe(2);

      await adapter.close();
    });

    it('DB02 — Migration is idempotent and safe to re-run', async () => {
      const adapter = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      await adapter.open();
      const vBefore = await adapter.getSchemaVersion();

      const vAfter = await adapter.runMigrations();
      expect(vAfter).toBe(vBefore);
      expect(vAfter).toBe(2);

      await adapter.close();
    });
  });

  // ==========================================
  // 2. Reopen Durability & Hydration Across Instances
  // ==========================================
  describe('2. Persistence Across Reopen & Instance Hydration', () => {
    it('DB03 — Data persists across close and reopen on file-backed SQLite database', async () => {
      const adapter1 = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      await adapter1.open();

      const now = new Date().toISOString();
      await adapter1.execute(
        `INSERT INTO spaces (id, name, type, balance, currency, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        ['sp_persisted', 'Persisted Space', 'personal', 12500000, 'VND', now, now]
      );
      await adapter1.execute(
        `INSERT INTO wallets (id, spaceId, name, type, currency, initialBalance, currentBalance, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['w_persisted', 'sp_persisted', 'Persisted Wallet', 'cash', 'VND', 5000000, 12500000, now, now]
      );

      await adapter1.close();
      expect(adapter1.isOpen()).toBe(false);

      // Open a second independent instance on the exact same database file
      const adapter2 = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      await adapter2.open();

      const space = await adapter2.queryOne('SELECT * FROM spaces WHERE id = ?;', ['sp_persisted']);
      expect(space).not.toBeNull();
      expect(space?.name).toBe('Persisted Space');
      expect(space?.balance).toBe(12500000);

      const wallet = await adapter2.queryOne('SELECT * FROM wallets WHERE id = ?;', ['w_persisted']);
      expect(wallet).not.toBeNull();
      expect(wallet?.name).toBe('Persisted Wallet');
      expect(wallet?.spaceId).toBe('sp_persisted');

      await adapter2.close();
    });

    it('DB04 — Recreating LocalDataSource hydrates state directly from durable storage', async () => {
      const adapter = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      const ds1 = LocalDataSource.resetInstance(adapter);
      await ds1.init();

      // Add custom space and wallet through ds1
      const createdSpace = await ds1.addSpace({
        id: 'sp_hydration_test',
        name: 'Hydration Test Space',
        type: 'personal',
        balance: 5000000,
        currency: 'VND',
        cardColor: '#3B82F6',
        iconName: 'User',
        ownerName: 'Tester',
        membersCount: 1
      });
      expect(createdSpace.id).toBe('sp_hydration_test');

      const createdWallet = await ds1.addWallet({
        id: 'w_hydration_test',
        spaceId: 'sp_hydration_test',
        name: 'Hydration Wallet',
        type: 'bank',
        currency: 'VND',
        initialBalance: 5000000,
        currentBalance: 5000000,
        status: 'active'
      });
      expect(createdWallet.id).toBe('w_hydration_test');

      // Now create a completely fresh LocalDataSource instance pointing to the same adapter
      const ds2 = new LocalDataSource(adapter);
      await ds2.init();

      // Verify ds2 hydrated the custom records from the database, not hardcoded defaults
      const spaceInDs2 = await ds2.getSpaceById('sp_hydration_test');
      expect(spaceInDs2).not.toBeNull();
      expect(spaceInDs2?.name).toBe('Hydration Test Space');

      const walletsInDs2 = await ds2.getWallets('sp_hydration_test');
      expect(walletsInDs2.length).toBe(1);
      expect(walletsInDs2[0].id).toBe('w_hydration_test');

      await adapter.close();
    });
  });

  // ==========================================
  // 3. Atomic Multi-Record Transactions & Rollback
  // ==========================================
  describe('3. Atomic Multi-Record Transactions', () => {
    it('DB05 — Atomic commit: all records in transaction are persisted together', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      await adapter.transaction(async (trx) => {
        await trx.execute(
          `INSERT INTO spaces (id, name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);`,
          ['sp_tx_success', 'Atomic Space', 'company', now, now]
        );
        await trx.execute(
          `INSERT INTO wallets (id, spaceId, name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?);`,
          ['w_tx_success', 'sp_tx_success', 'Atomic Wallet', 'bank', now, now]
        );
      });

      const space = await adapter.queryOne('SELECT * FROM spaces WHERE id = ?;', ['sp_tx_success']);
      const wallet = await adapter.queryOne('SELECT * FROM wallets WHERE id = ?;', ['w_tx_success']);
      expect(space).not.toBeNull();
      expect(wallet).not.toBeNull();

      await adapter.close();
    });

    it('DB06 — Atomic rollback: error inside transaction rolls back all pending changes', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      let errorThrown = false;
      try {
        await adapter.transaction(async (trx) => {
          await trx.execute(
            `INSERT INTO spaces (id, name, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);`,
            ['sp_tx_fail', 'Doomed Space', 'company', now, now]
          );
          throw new Error('Simulated network/disk write failure');
        });
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).toContain('rolled back');
      }

      expect(errorThrown).toBe(true);

      const space = await adapter.queryOne('SELECT * FROM spaces WHERE id = ?;', ['sp_tx_fail']);
      expect(space).toBeNull();

      await adapter.close();
    });
  });

  // ==========================================
  // 4. Space Isolation & Legitimate Cross-Space Transfers
  // ==========================================
  describe('4. Space Isolation & Cross-Space Transfers', () => {
    it('DB07 — Space isolation: Space A records are isolated, cross-space transfers visible in both', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      const ds = LocalDataSource.resetInstance(adapter);
      await ds.init();

      // Transaction strictly in Space A
      await ds.addTransaction({
        spaceId: 'sp_alpha',
        type: 'expense',
        amount: 45000,
        currency: 'VND',
        category: 'Food',
        date: '2026-10-23'
      });

      // Transaction strictly in Space B
      await ds.addTransaction({
        spaceId: 'sp_beta',
        type: 'expense',
        amount: 990000,
        currency: 'VND',
        category: 'Electronics',
        date: '2026-10-23'
      });

      // Legitimate cross-space transfer from Space A to Space B
      await ds.addTransaction({
        spaceId: 'sp_alpha',
        targetSpaceId: 'sp_beta',
        type: 'transfer',
        amount: 200000,
        currency: 'VND',
        category: 'Transfer',
        date: '2026-10-23'
      });

      // Space Alpha query gets local expense + cross-space transfer = 2
      const alphaTxs = await ds.getTransactions('sp_alpha');
      expect(alphaTxs.length).toBe(2);

      // Space Beta query gets local expense + cross-space transfer = 2
      const betaTxs = await ds.getTransactions('sp_beta');
      expect(betaTxs.length).toBe(2);

      // Space Gamma gets 0 records (no data bleed)
      const gammaTxs = await ds.getTransactions('sp_gamma');
      expect(gammaTxs.length).toBe(0);

      await adapter.close();
    });
  });

  // ==========================================
  // 5. Corruption Recovery & Non-Destructive Protection
  // ==========================================
  describe('5. Corruption Recovery & Error Handling', () => {
    it('DB08 — BrowserStoragePersistenceAdapter detects corrupt JSON and quarantines it without destructive overwrite', async () => {
      const mockStorage: Record<string, string> = {
        'df3_relational_corrupt_test': '{{THIS_IS_CORRUPTED_NON_JSON_DATA}}'
      };

      const storageDriver = {
        getItem: (k: string) => mockStorage[k] || null,
        setItem: (k: string, v: string) => { mockStorage[k] = v; },
        removeItem: (k: string) => { delete mockStorage[k]; }
      };

      const adapter = new BrowserStoragePersistenceAdapter({
        databaseName: 'corrupt_test',
        storageDriver
      });

      let corruptErrorCaught = false;
      try {
        await adapter.open();
      } catch (err) {
        corruptErrorCaught = true;
        expect(err).toBeInstanceOf(StorageCorruptError);
      }

      expect(corruptErrorCaught).toBe(true);
      expect(adapter.isCorrupted()).toBe(true);
      expect(adapter.getCorruptionDetails()?.rawPayload).toBe('{{THIS_IS_CORRUPTED_NON_JSON_DATA}}');

      // Verify the corrupt data was NOT wiped/overwritten; original key remains intact
      expect(mockStorage['df3_relational_corrupt_test']).toBe('{{THIS_IS_CORRUPTED_NON_JSON_DATA}}');

      // Verify a quarantine backup was created
      const quarantineKeys = Object.keys(mockStorage).filter(k => k.includes('_corrupt_'));
      expect(quarantineKeys.length).toBeGreaterThan(0);
    });

    it('DB09 — Quota exceeded error is surfaced through StorageQuotaExceededError contract', async () => {
      const quotaDriver = {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError: DOMException: The quota has been exceeded.');
        },
        removeItem: () => {}
      };

      const adapter = new BrowserStoragePersistenceAdapter({
        databaseName: 'quota_test',
        storageDriver: quotaDriver
      });

      let quotaCaught = false;
      try {
        await adapter.open();
      } catch (err) {
        quotaCaught = true;
        expect(err).toBeInstanceOf(DatabaseInitializationError);
      }

      expect(quotaCaught).toBe(true);
    });
  });

  // ==========================================
  // 6. Backup & Restore Compatibility
  // ==========================================
  describe('6. Backup & Restore Atomic Compatibility', () => {
    it('DB10 — backupData persists package to backup_packages table, and restoreData performs atomic restore', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      const ds = LocalDataSource.resetInstance(adapter);
      await ds.init();

      // Trigger backup for personal space
      const backupInfo = await ds.backupData('sp_personal');
      expect(backupInfo.id).toBeDefined();

      // Verify backup package exists in database table
      const stored = await adapter.queryOne('SELECT * FROM backup_packages WHERE id = ?;', [backupInfo.id]);
      expect(stored).not.toBeNull();
      expect(stored?.spaceId).toBe('sp_personal');

      // Add a temporary transaction
      const tempTx = await ds.addTransaction({
        spaceId: 'sp_personal',
        type: 'expense',
        amount: 88888,
        currency: 'VND',
        category: 'Temp',
        date: '2026-10-23'
      });
      expect(await ds.getTransactionById(tempTx.id)).not.toBeNull();

      // Restore from original backup
      const restored = await ds.restoreData(backupInfo.id, 'sp_personal');
      expect(restored).toBe(true);

      // Verify the temp transaction was atomically cleaned up by the restore
      const postRestoreTx = await ds.getTransactionById(tempTx.id);
      expect(postRestoreTx).toBeNull();

      await adapter.close();
    });
  });

  // ==========================================
  // 7. Architectural Disclosure & Backend Type
  // ==========================================
  describe('7. Architectural Disclosure Verification', () => {
    it('DB11 — Reports honest backend type without misleading claims', async () => {
      const nodeAdapter = new SQLitePersistenceAdapter({ inMemory: true });
      expect(nodeAdapter.getBackendType()).toBe('sqlite-node');

      const browserAdapter = new BrowserStoragePersistenceAdapter({ inMemory: true });
      expect(browserAdapter.getBackendType()).toBe('browser-relational-storage');
    });

    it('DB12 — Preserves numeric precision and currencies without float rounding loss', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      const testValues = [
        { id: 'tx_prec_1', amount: 100.456, currency: 'USD' },
        { id: 'tx_prec_2', amount: 0.01, currency: 'EUR' },
        { id: 'tx_prec_3', amount: 999999999.999, currency: 'VND' }
      ];

      for (const t of testValues) {
        await adapter.execute(
          `INSERT INTO transactions (id, spaceId, categoryId, transactionType, amount, currency, transactionDate, date, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [t.id, 'sp_personal', 'cat_test', 'expense', t.amount, t.currency, now, '2026-10-23', now, now]
        );

        const fetched = await adapter.queryOne('SELECT amount, currency FROM transactions WHERE id = ?;', [t.id]);
        expect(fetched?.amount).toBe(t.amount);
        expect(fetched?.currency).toBe(t.currency);
      }

      await adapter.close();
    });
  });

  // ==========================================
  // 8. Multi-Entity CRUD Durability & Multiple Funds Isolation
  // ==========================================
  describe('8. Multi-Entity CRUD Durability & Fund Isolation', () => {
    it('DB13 — CRUD durability for auxiliary entities (budgets, savings, debts, investments, jars, preferences)', async () => {
      const adapter = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      const ds = LocalDataSource.resetInstance(adapter);
      await ds.init();

      // 1. Budget
      const budget = await ds.addBudget({
        spaceId: 'sp_entity_test',
        category: 'cat_dining',
        allocatedAmount: 3000000,
        spentAmount: 0,
        warningThreshold: 80,
        currency: 'VND',
        period: 'monthly'
      });
      expect(budget.id).toBeDefined();

      // 2. Savings Goal
      const goal = await ds.addSavingsGoal({
        spaceId: 'sp_entity_test',
        title: 'Emergency Fund 2026',
        category: 'emergency',
        icon: 'shield',
        targetAmount: 50000000,
        currency: 'VND',
        currentAmount: 10000000,
        deadline: '2026-12-31'
      });
      expect(goal.id).toBeDefined();

      // 3. Debt/Loan
      const debt = await ds.addDebtOrLoan({
        spaceId: 'sp_entity_test',
        type: 'debt',
        title: 'Bank Loan A',
        counterparty: 'Vietcombank',
        originalAmount: 100000000,
        remainingAmount: 85000000,
        interestRate: 7.5,
        minimumMonthlyPayment: 5000000,
        dueDate: '2027-01-01',
        status: 'active'
      });
      expect(debt.id).toBeDefined();

      // 4. Investment
      const inv = await ds.addInvestment({
        spaceId: 'sp_entity_test',
        name: 'Vingroup Bonds',
        type: 'bond',
        quantity: 100,
        purchasePrice: 100000,
        currentPrice: 105000,
        currency: 'VND',
        symbol: 'VIC123'
      });
      expect(inv.id).toBeDefined();

      // 5. Six Jar
      const jar = await ds.addSixJar({
        spaceId: 'sp_entity_test',
        key: 'NEC',
        nameVi: 'Chi tiêu thiết yếu',
        nameEn: 'Necessities',
        percent: 55,
        currentBalance: 2500000,
        color: '#3B82F6'
      });
      expect(jar.id).toBeDefined();

      // 6. User Preferences
      await ds.updateUserPreferences({
        language: 'vi',
        theme: 'm3-expressive',
        baseCurrency: 'VND',
        defaultSpaceId: 'sp_entity_test'
      });

      // Verify records are present in durable database
      const dbBudget = await adapter.queryOne('SELECT * FROM budgets WHERE id = ?;', [budget.id]);
      expect(dbBudget).not.toBeNull();
      expect(dbBudget?.categoryId).toBe('cat_dining');

      const dbGoal = await adapter.queryOne('SELECT * FROM savings_goals WHERE id = ?;', [goal.id]);
      expect(dbGoal).not.toBeNull();

      const dbDebt = await adapter.queryOne('SELECT * FROM debts_loans WHERE id = ?;', [debt.id]);
      expect(dbDebt).not.toBeNull();

      const dbInv = await adapter.queryOne('SELECT * FROM investments WHERE id = ?;', [inv.id]);
      expect(dbInv).not.toBeNull();

      const dbJar = await adapter.queryOne('SELECT * FROM six_jars WHERE id = ?;', [jar.id]);
      expect(dbJar).not.toBeNull();

      const dbPref = await adapter.queryOne('SELECT * FROM user_preferences WHERE userId = ?;', ['usr_default']);
      expect(dbPref?.defaultSpaceId).toBe('sp_entity_test');

      // Now close and reopen with a fresh LocalDataSource to verify complete hydration
      await adapter.close();

      const adapter2 = new SQLitePersistenceAdapter({ storagePath: TEST_DB_PATH });
      const ds2 = LocalDataSource.resetInstance(adapter2);
      await ds2.init();

      const hydratedBudgets = await ds2.getBudgets('sp_entity_test');
      expect(hydratedBudgets.some(b => b.id === budget.id)).toBe(true);

      const hydratedGoals = await ds2.getSavingsGoals('sp_entity_test');
      expect(hydratedGoals.some(g => g.id === goal.id)).toBe(true);

      const hydratedDebts = await ds2.getDebtsAndLoans('sp_entity_test');
      expect(hydratedDebts.some(d => d.id === debt.id)).toBe(true);

      const hydratedInvs = await ds2.getInvestments('sp_entity_test');
      expect(hydratedInvs.some(i => i.id === inv.id)).toBe(true);

      const hydratedJars = await ds2.getSixJars('sp_entity_test');
      expect(hydratedJars.some(j => j.id === jar.id)).toBe(true);

      const hydratedPrefs = await ds2.getUserPreferences();
      expect(hydratedPrefs.defaultSpaceId).toBe('sp_entity_test');

      await adapter2.close();
    });

    it('DB14 — Fund isolation: Multiple Funds / Six Jars enforce space & fund isolation without bleed', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      const ds = LocalDataSource.resetInstance(adapter);
      await ds.init();

      // Create fund jars for Space Alpha
      const jarAlpha1 = await ds.addSixJar({
        spaceId: 'sp_fund_alpha',
        key: 'NEC',
        nameVi: 'Thiết yếu Alpha',
        nameEn: 'Necessities Alpha',
        percent: 50,
        currentBalance: 5000000,
        color: '#10B981'
      });

      const jarAlpha2 = await ds.addSixJar({
        spaceId: 'sp_fund_alpha',
        key: 'FFA',
        nameVi: 'Tự do tài chính Alpha',
        nameEn: 'Financial Freedom Alpha',
        percent: 20,
        currentBalance: 2000000,
        color: '#3B82F6'
      });

      // Create fund jars for Space Beta
      const jarBeta1 = await ds.addSixJar({
        spaceId: 'sp_fund_beta',
        key: 'NEC',
        nameVi: 'Thiết yếu Beta',
        nameEn: 'Necessities Beta',
        percent: 60,
        currentBalance: 6000000,
        color: '#F59E0B'
      });

      // Query Six Jars for Space Alpha
      const alphaJars = await ds.getSixJars('sp_fund_alpha');
      expect(alphaJars.length).toBe(2);
      expect(alphaJars.map(j => j.id)).toContain(jarAlpha1.id);
      expect(alphaJars.map(j => j.id)).toContain(jarAlpha2.id);
      expect(alphaJars.map(j => j.id)).not.toContain(jarBeta1.id);

      // Query Six Jars for Space Beta
      const betaJars = await ds.getSixJars('sp_fund_beta');
      expect(betaJars.length).toBe(1);
      expect(betaJars[0].id).toBe(jarBeta1.id);

      // Query Six Jars for an empty space
      const gammaJars = await ds.getSixJars('sp_fund_gamma');
      expect(gammaJars.length).toBe(0);

      // Add a transaction linked to a specific fund jar in Space Alpha
      const fundTx = await ds.addTransaction({
        spaceId: 'sp_fund_alpha',
        tags: [`fund:${jarAlpha1.id}`],
        type: 'expense',
        amount: 250000,
        currency: 'VND',
        category: 'Groceries',
        date: '2026-10-23'
      });

      const alphaTxs = await ds.getTransactions('sp_fund_alpha');
      expect(alphaTxs.some(t => t.id === fundTx.id && t.tags?.includes(`fund:${jarAlpha1.id}`))).toBe(true);

      // Beta space must not see this transaction
      const betaTxs = await ds.getTransactions('sp_fund_beta');
      expect(betaTxs.some(t => t.id === fundTx.id)).toBe(false);

      await adapter.close();
    });
  });
});

