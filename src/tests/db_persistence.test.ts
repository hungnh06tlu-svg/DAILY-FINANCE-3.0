/**
 * Daily Finance 3.0 - DB-001 Persistence Adapter & Schema Suite
 * Standard: Clean Architecture / Offline-First Relational Database Verification
 * Tests SQLite persistence adapter, schema migrations, reopen durability,
 * atomic transactions, multi-space/fund isolation, and soft-delete lifecycle.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLitePersistenceAdapter } from '../data/database/SQLitePersistenceAdapter';
import { LocalTransactionRepository } from '../repositories/local/LocalTransactionRepository';
import { LocalDataSource } from '../data/datasource/LocalDataSource';
import fs from 'node:fs';

describe('DB-001 — SQLite Persistence Adapter & Schema Suite', () => {
  const TEST_DB_PATH = '/tmp/df3_test_db001.sqlite';

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {
        // Ignored
      }
    }
  });

  afterEach(() => {
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

      // Verify schema_migrations table records both versions
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

      // Run migrations again
      const vAfter = await adapter.runMigrations();
      expect(vAfter).toBe(vBefore);
      expect(vAfter).toBe(2);

      await adapter.close();
    });
  });

  // ==========================================
  // 2. Reopen Durability & Persistence Across Instances
  // ==========================================
  describe('2. Persistence Across Reopen', () => {
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
  });

  // ==========================================
  // 3. Atomic Multi-Record Transactions & Rollback
  // ==========================================
  describe('3. Atomic Multi-Record Transactions', () => {
    it('DB04 — Atomic commit: all records in transaction are persisted together', async () => {
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

    it('DB05 — Atomic rollback: error inside transaction rolls back all pending changes', async () => {
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
          // Deliberate error to trigger rollback
          throw new Error('Simulated network/disk write failure');
        });
      } catch (err) {
        errorThrown = true;
        expect((err as Error).message).toContain('Simulated network/disk write failure');
      }

      expect(errorThrown).toBe(true);

      // Verify the space was NOT inserted
      const space = await adapter.queryOne('SELECT * FROM spaces WHERE id = ?;', ['sp_tx_fail']);
      expect(space).toBeNull();

      await adapter.close();
    });
  });

  // ==========================================
  // 4. Multi-Space & Multi-Fund Isolation
  // ==========================================
  describe('4. Space & Fund Isolation', () => {
    it('DB06 — Strict space isolation: space A records never leak into space B queries', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      await adapter.execute(
        `INSERT INTO transactions (id, spaceId, categoryId, transactionType, amount, currency, transactionDate, date, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['tx_space_a', 'sp_alpha', 'cat_food', 'expense', 45000, 'VND', now, '2026-10-22', now, now]
      );
      await adapter.execute(
        `INSERT INTO transactions (id, spaceId, categoryId, transactionType, amount, currency, transactionDate, date, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['tx_space_b', 'sp_beta', 'cat_shop', 'expense', 990000, 'VND', now, '2026-10-22', now, now]
      );

      const alphaTxs = await adapter.query('SELECT * FROM transactions WHERE spaceId = ?;', ['sp_alpha']);
      expect(alphaTxs.length).toBe(1);
      expect(alphaTxs[0].id).toBe('tx_space_a');
      expect(alphaTxs[0].amount).toBe(45000);

      const betaTxs = await adapter.query('SELECT * FROM transactions WHERE spaceId = ?;', ['sp_beta']);
      expect(betaTxs.length).toBe(1);
      expect(betaTxs[0].id).toBe('tx_space_b');
      expect(betaTxs[0].amount).toBe(990000);

      // Cross-space query on gamma returns 0 rows
      const gammaTxs = await adapter.query('SELECT * FROM transactions WHERE spaceId = ?;', ['sp_gamma']);
      expect(gammaTxs.length).toBe(0);

      await adapter.close();
    });
  });

  // ==========================================
  // 5. Exact Numeric Precision & Currency Preservation
  // ==========================================
  describe('5. Financial Precision & Exactness', () => {
    it('DB07 — Preserves fractional numbers, large values, and exact currencies without rounding', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      const testValues = [
        { id: 'tx_p1', amount: 100.456, currency: 'USD' },
        { id: 'tx_p2', amount: 0.01, currency: 'EUR' },
        { id: 'tx_p3', amount: 999999999.999, currency: 'VND' },
        { id: 'tx_p4', amount: 0, currency: 'JPY' }
      ];

      for (const t of testValues) {
        await adapter.execute(
          `INSERT INTO transactions (id, spaceId, categoryId, transactionType, amount, currency, transactionDate, date, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [t.id, 'sp_personal', 'cat_test', 'expense', t.amount, t.currency, now, '2026-10-22', now, now]
        );

        const fetched = await adapter.queryOne('SELECT amount, currency FROM transactions WHERE id = ?;', [t.id]);
        expect(fetched?.amount).toBe(t.amount);
        expect(typeof fetched?.amount).toBe('number');
        expect(fetched?.currency).toBe(t.currency);
      }

      await adapter.close();
    });
  });

  // ==========================================
  // 6. Soft-Delete Lifecycle Semantics
  // ==========================================
  describe('6. Soft-Delete Lifecycle', () => {
    it('DB08 — Soft-delete and restore cycle updates status, isDeleted, and timestamps', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();
      const now = new Date().toISOString();

      await adapter.execute(
        `INSERT INTO transactions (id, spaceId, categoryId, transactionType, amount, currency, transactionDate, date, status, isDeleted, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['tx_lifecycle', 'sp_personal', 'cat_1', 'expense', 50000, 'VND', now, '2026-10-22', 'confirmed', 0, now, now]
      );

      // 1. Active query finds it
      let active = await adapter.query('SELECT * FROM transactions WHERE spaceId = ? AND isDeleted = 0;', ['sp_personal']);
      expect(active.length).toBe(1);

      // 2. Soft delete
      const deletedAt = new Date().toISOString();
      await adapter.execute(
        `UPDATE transactions SET isDeleted = 1, status = 'soft_deleted', deletedAt = ? WHERE id = ?;`,
        [deletedAt, 'tx_lifecycle']
      );

      active = await adapter.query('SELECT * FROM transactions WHERE spaceId = ? AND isDeleted = 0;', ['sp_personal']);
      expect(active.length).toBe(0);

      const trash = await adapter.query('SELECT * FROM transactions WHERE spaceId = ? AND isDeleted = 1;', ['sp_personal']);
      expect(trash.length).toBe(1);
      expect(trash[0].status).toBe('soft_deleted');
      expect(trash[0].deletedAt).toBe(deletedAt);

      // 3. Restore
      await adapter.execute(
        `UPDATE transactions SET isDeleted = 0, status = 'confirmed', deletedAt = NULL WHERE id = ?;`,
        ['tx_lifecycle']
      );

      active = await adapter.query('SELECT * FROM transactions WHERE spaceId = ? AND isDeleted = 0;', ['sp_personal']);
      expect(active.length).toBe(1);
      expect(active[0].status).toBe('confirmed');

      await adapter.close();
    });
  });

  // ==========================================
  // 7. Repository Integration with SQLite Adapter
  // ==========================================
  describe('7. Repository Integration', () => {
    it('DB09 — LocalTransactionRepository write through to SQLite adapter', async () => {
      const adapter = new SQLitePersistenceAdapter({ inMemory: true });
      await adapter.open();

      const repo = new LocalTransactionRepository([], adapter);
      await repo.init();

      const added = await repo.addTransaction({
        spaceId: 'sp_integration',
        type: 'expense',
        amount: 320000,
        currency: 'VND',
        category: 'Shopping',
        date: '2026-10-22',
        note: 'Supermarket'
      });

      expect(added.id).toBeDefined();

      // Query database table directly to verify write-through persistence
      const row = await adapter.queryOne('SELECT * FROM transactions WHERE id = ?;', [added.id]);
      expect(row).not.toBeNull();
      expect(row?.amount).toBe(320000);
      expect(row?.spaceId).toBe('sp_integration');
      expect(row?.note).toBe('Supermarket');

      await adapter.close();
    });

    it('DB10 — LocalDataSource provides active database adapter', async () => {
      const ds = LocalDataSource.getInstance();
      const db = ds.getDatabaseAdapter();
      expect(db).toBeDefined();
      expect(typeof db.query).toBe('function');
      expect(typeof db.transaction).toBe('function');
    });
  });
});
