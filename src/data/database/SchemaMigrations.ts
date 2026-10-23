/**
 * Daily Finance 3.0 - Schema Migrations (DB-001)
 * Standard: Room-Compatible Versioned DDL Schema and Migration Scripts
 */

import { TransactionContext } from './DatabaseAdapter';

export interface MigrationStep {
  version: number;
  description: string;
  up(trx: TransactionContext): Promise<void>;
  down?(trx: TransactionContext): Promise<void>;
}

export const CURRENT_SCHEMA_VERSION = 2;

export const MIGRATIONS: MigrationStep[] = [
  {
    version: 1,
    description: 'Initial Room-compatible relational schema',
    async up(trx: TransactionContext): Promise<void> {
      // 1. Schema migrations table
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          appliedAt TEXT NOT NULL,
          description TEXT NOT NULL
        );
      `);

      // 2. Spaces
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS spaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'VND',
          cardColor TEXT,
          iconName TEXT,
          ownerName TEXT,
          membersCount INTEGER NOT NULL DEFAULT 1,
          isPrimary INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 3. Wallets
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS wallets (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          currency TEXT NOT NULL DEFAULT 'VND',
          initialBalance REAL NOT NULL DEFAULT 0,
          currentBalance REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          cardColor TEXT,
          iconName TEXT,
          isDefault INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 4. Transactions
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          walletId TEXT,
          accountId TEXT,
          targetSpaceId TEXT,
          targetWalletId TEXT,
          categoryId TEXT NOT NULL,
          category TEXT,
          transactionType TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'VND',
          exchangeRate REAL NOT NULL DEFAULT 1,
          note TEXT,
          description TEXT,
          transactionDate TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          merchant TEXT,
          method TEXT,
          fundId TEXT,
          targetFundId TEXT,
          tags TEXT,
          auditTrail TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncStatus TEXT NOT NULL DEFAULT 'pending',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 5. Budgets
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          categoryName TEXT,
          period TEXT NOT NULL DEFAULT 'monthly',
          allocatedAmount REAL NOT NULL,
          spentAmount REAL NOT NULL DEFAULT 0,
          remainingAmount REAL NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'VND',
          warningThreshold REAL NOT NULL DEFAULT 80,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 6. Savings Goals
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS savings_goals (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          name TEXT NOT NULL,
          targetAmount REAL NOT NULL,
          currentAmount REAL NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'VND',
          targetDate TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 7. Debts & Loans
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS debts_loans (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          type TEXT NOT NULL,
          personName TEXT NOT NULL,
          amount REAL NOT NULL,
          remainingAmount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'VND',
          dueDate TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 8. Credit Cards
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS credit_cards (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          name TEXT NOT NULL,
          bank TEXT NOT NULL,
          cardLimit REAL NOT NULL,
          currentBalance REAL NOT NULL DEFAULT 0,
          statementDate TEXT,
          paymentDueDate TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 9. Investments
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS investments (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity REAL NOT NULL,
          purchasePrice REAL NOT NULL,
          currentPrice REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'VND',
          symbol TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 10. Six Jars
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS six_jars (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          name TEXT NOT NULL,
          percentage REAL NOT NULL,
          allocatedAmount REAL NOT NULL DEFAULT 0,
          spentAmount REAL NOT NULL DEFAULT 0,
          color TEXT,
          icon TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          deletedAt TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          isDeleted INTEGER NOT NULL DEFAULT 0,
          syncState TEXT NOT NULL DEFAULT 'synced',
          deviceId TEXT NOT NULL DEFAULT 'local_device'
        );
      `);

      // 11. User Preferences
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          userId TEXT PRIMARY KEY,
          language TEXT NOT NULL DEFAULT 'vi',
          theme TEXT NOT NULL DEFAULT 'm3-expressive',
          baseCurrency TEXT NOT NULL DEFAULT 'VND',
          defaultSpaceId TEXT NOT NULL DEFAULT 'sp_personal',
          biometricEnabled INTEGER NOT NULL DEFAULT 1,
          notificationEnabled INTEGER NOT NULL DEFAULT 1,
          updatedAt TEXT NOT NULL
        );
      `);
    }
  },
  {
    version: 2,
    description: 'Add performance & space isolation indexes and backup package storage',
    async up(trx: TransactionContext): Promise<void> {
      // Performance indexes for space isolation & query acceleration
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_space ON transactions(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transactionType);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_wallets_space ON wallets(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_space ON budgets(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_savings_space ON savings_goals(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_debts_space ON debts_loans(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_credit_cards_space ON credit_cards(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_investments_space ON investments(spaceId);`);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_six_jars_space ON six_jars(spaceId);`);

      // Dedicated table for atomic backup packages
      await trx.execute(`
        CREATE TABLE IF NOT EXISTS backup_packages (
          id TEXT PRIMARY KEY,
          spaceId TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          payload TEXT NOT NULL,
          checksum TEXT NOT NULL
        );
      `);
      await trx.execute(`CREATE INDEX IF NOT EXISTS idx_backup_space ON backup_packages(spaceId);`);
    }
  }
];
