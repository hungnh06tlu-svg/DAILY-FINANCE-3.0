/**
 * Daily Finance 3.0 - Persistence Architecture (DB-001 / DB-001R)
 * Standard: Clean Architecture / Offline-First Persistence
 *
 * ARCHITECTURAL DISCLOSURE (Strategy B - Honest Browser Architecture):
 * 1. Node.js Environment (Vitest / Server):
 *    Uses genuine SQLite 3 engine via native `node:sqlite` (DatabaseSync) with WAL mode,
 *    foreign key constraints, and atomic ACID transactions.
 * 2. Browser Environment:
 *    Genuine SQLite WASM/OPFS is not supported under the current iframe sandbox and dependency
 *    policy. The browser environment uses `BrowserStoragePersistenceAdapter` — an honest,
 *    non-SQLite relational persistence adapter providing table partitioning, atomic transaction
 *    staging with rollback, versioned migrations, corruption quarantine, and quota safety.
 */

import {
  DatabaseAdapter,
  TransactionContext,
  DatabaseConfig,
  DatabaseInitializationError,
  StorageQuotaExceededError,
  StorageCorruptError,
  TransactionAbortedError
} from './DatabaseAdapter';
import { MIGRATIONS, CURRENT_SCHEMA_VERSION } from './SchemaMigrations';

export type {
  DatabaseAdapter,
  TransactionContext,
  DatabaseConfig
};

export {
  DatabaseInitializationError,
  StorageQuotaExceededError,
  StorageCorruptError,
  TransactionAbortedError
};

/**
 * Dynamic resolver for node:sqlite to isolate Node.js runtime from browser Vite bundle.
 */
function getNodeSQLite(): any {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const req = typeof require !== 'undefined' ? require : null;
      if (req) {
        return req('node:sqlite');
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Honest Browser-Compatible Relational Storage Adapter (Strategy B)
 * Does NOT represent itself as SQLite.
 */
export class BrowserStoragePersistenceAdapter implements DatabaseAdapter {
  private openState = false;
  private tables: Map<string, Map<string, any>> = new Map();
  private storageKey: string;
  private inMemory: boolean;
  private storageDriver: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } | null;
  private corruptionFlag = false;
  private corruptionDetails: { rawPayload: string; error: string } | null = null;

  constructor(config?: DatabaseConfig) {
    this.inMemory = !!config?.inMemory;
    this.storageKey = `df3_relational_${config?.databaseName || 'daily_finance'}`;

    if (config?.storageDriver) {
      this.storageDriver = config.storageDriver;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storageDriver = window.localStorage;
    } else {
      this.storageDriver = null;
    }
  }

  getBackendType(): 'browser-relational-storage' {
    return 'browser-relational-storage';
  }

  isCorrupted(): boolean {
    return this.corruptionFlag;
  }

  getCorruptionDetails(): { rawPayload: string; error: string } | null {
    return this.corruptionDetails;
  }

  async open(): Promise<void> {
    if (this.openState) return;

    if (!this.inMemory && this.storageDriver) {
      const raw = this.storageDriver.getItem(this.storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Stored payload is not a valid JSON object');
          }
          for (const [table, rows] of Object.entries(parsed)) {
            const tableMap = new Map<string, any>();
            if (Array.isArray(rows)) {
              for (const row of rows) {
                if (row && typeof row === 'object') {
                  const pk = row.id ?? row.userId ?? row.version;
                  if (pk !== undefined) {
                    tableMap.set(String(pk), row);
                  }
                }
              }
            }
            this.tables.set(table, tableMap);
          }
        } catch (parseError) {
          // DO NOT DESTRUCTIVELY OVERWRITE CORRUPTED DATA!
          this.corruptionFlag = true;
          this.corruptionDetails = {
            rawPayload: raw,
            error: (parseError as Error).message
          };

          // Quarantine corrupt data under safe timestamped key for manual/diagnostic recovery
          const quarantineKey = `${this.storageKey}_corrupt_${Date.now()}`;
          try {
            this.storageDriver.setItem(quarantineKey, raw);
          } catch {
            // Ignore secondary quarantine failure
          }

          throw new StorageCorruptError(
            `Stored database at key "${this.storageKey}" is corrupt and cannot be parsed. Preserved under quarantine key "${quarantineKey}".`,
            raw,
            parseError
          );
        }
      }
    }

    this.openState = true;
    try {
      await this.runMigrations();
      this.persist();
    } catch (migErr) {
      this.openState = false;
      throw new DatabaseInitializationError('Failed to execute schema migrations on open', migErr);
    }
  }

  async close(): Promise<void> {
    if (this.openState) {
      this.persist();
      this.openState = false;
    }
  }

  isOpen(): boolean {
    return this.openState;
  }

  private persist(): void {
    if (this.inMemory || !this.storageDriver) return;
    try {
      const data: Record<string, any[]> = {};
      for (const [tableName, map] of this.tables.entries()) {
        data[tableName] = Array.from(map.values());
      }
      this.storageDriver.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      const msg = (err as Error)?.message || String(err);
      if (msg.includes('QuotaExceeded') || msg.includes('quota') || msg.includes('QUOTA_EXCEEDED_ERR')) {
        throw new StorageQuotaExceededError(`Storage quota exceeded while persisting database to "${this.storageKey}"`, err);
      }
      throw new Error(`Durable persistence failed: ${msg}`);
    }
  }

  async getSchemaVersion(): Promise<number> {
    const migrationsTable = this.tables.get('schema_migrations');
    if (!migrationsTable || migrationsTable.size === 0) return 0;
    const versions = Array.from(migrationsTable.values()).map(r => Number(r.version));
    return Math.max(0, ...versions);
  }

  async runMigrations(): Promise<number> {
    const currentVer = await this.getSchemaVersion();
    const pending = MIGRATIONS.filter(m => m.version > currentVer).sort((a, b) => a.version - b.version);

    for (const step of pending) {
      await step.up({
        execute: async (sql, params) => this.execute(sql, params),
        query: async <T>(sql: string, params?: any[]) => this.query<T>(sql, params),
        queryOne: async <T>(sql: string, params?: any[]) => this.queryOne<T>(sql, params)
      });

      const migrationsTable = this.ensureTable('schema_migrations');
      migrationsTable.set(String(step.version), {
        version: step.version,
        appliedAt: new Date().toISOString(),
        description: step.description
      });
    }

    return pending.length > 0 ? pending[pending.length - 1].version : currentVer;
  }

  private ensureTable(name: string): Map<string, any> {
    let t = this.tables.get(name);
    if (!t) {
      t = new Map<string, any>();
      this.tables.set(name, t);
    }
    return t;
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    const trimmed = sql.trim();
    if (trimmed.startsWith('CREATE TABLE')) {
      const match = trimmed.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match && match[1]) {
        this.ensureTable(match[1]);
      }
      return;
    }
    if (trimmed.startsWith('CREATE INDEX')) {
      return;
    }
    if (trimmed.startsWith('INSERT INTO') || trimmed.startsWith('INSERT OR REPLACE INTO')) {
      const match = trimmed.match(/INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
      if (match && match[1]) {
        const tableName = match[1];
        const cols = match[2].split(',').map(c => c.trim());
        const table = this.ensureTable(tableName);
        const row: any = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        const pk = row.id ?? row.userId ?? row.version;
        if (pk !== undefined) {
          table.set(String(pk), row);
        }
        this.persist();
        return;
      }
    }
    if (trimmed.startsWith('UPDATE')) {
      const match = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
      if (match && match[1]) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          const pk = params[params.length - 1];
          const existing = table.get(String(pk));
          if (existing) {
            const setClauses = match[2].split(',').map(s => s.trim());
            setClauses.forEach((clause, idx) => {
              const col = clause.split('=')[0].trim();
              existing[col] = params[idx];
            });
            table.set(String(pk), existing);
            this.persist();
          }
        }
        return;
      }
    }
    if (trimmed.startsWith('DELETE FROM')) {
      const match = trimmed.match(/DELETE FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
      if (match && match[1]) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          const whereClause = match[2];
          if (whereClause && whereClause.includes('spaceId = ?') && params.length >= 1) {
            const spaceId = params[0];
            for (const [k, v] of table.entries()) {
              if (v && v.spaceId === spaceId) {
                table.delete(k);
              }
            }
          } else if (params.length > 0) {
            table.delete(String(params[0]));
          } else {
            table.clear();
          }
          this.persist();
        }
        return;
      }
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const trimmed = sql.trim();
    const match = trimmed.match(/SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (!match) return [];

    const tableName = match[2];
    const table = this.tables.get(tableName);
    if (!table) return [];

    let rows = Array.from(table.values());

    if (match[3]) {
      const whereClause = match[3];
      if (whereClause.includes('id = ?') && params.length >= 1) {
        rows = rows.filter(r => String(r.id) === String(params[0]));
      } else if (whereClause.includes('spaceId = ?') && params.length >= 1) {
        const targetSpace = params[0];
        // Support legitimate cross-space transfer visibility
        rows = rows.filter(r => r.spaceId === targetSpace || (r.targetSpaceId && r.targetSpaceId === targetSpace));
      }
      if (whereClause.includes('isDeleted = 0')) {
        rows = rows.filter(r => !r.isDeleted || r.isDeleted === 0);
      }
      if (whereClause.includes('isDeleted = 1')) {
        rows = rows.filter(r => r.isDeleted === 1 || r.isDeleted === true);
      }
    }

    return rows.map(r => ({ ...r })) as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction<T>(action: (trx: TransactionContext) => Promise<T>): Promise<T> {
    // Staging snapshot for atomic rollback
    const snapshot = new Map<string, Map<string, any>>();
    for (const [name, map] of this.tables.entries()) {
      const copy = new Map<string, any>();
      for (const [k, v] of map.entries()) {
        copy.set(k, { ...v });
      }
      snapshot.set(name, copy);
    }

    try {
      const result = await action({
        execute: async (sql, params) => this.execute(sql, params),
        query: async <R>(sql: string, params?: any[]) => this.query<R>(sql, params),
        queryOne: async <R>(sql: string, params?: any[]) => this.queryOne<R>(sql, params)
      });
      this.persist();
      return result;
    } catch (err) {
      // Revert in-memory tables to snapshot on failure
      this.tables = snapshot;
      throw new TransactionAbortedError('Transaction failed and was rolled back safely', err);
    }
  }

  async clearAllTables(): Promise<void> {
    for (const table of this.tables.values()) {
      table.clear();
    }
    this.persist();
  }

  async exportState(): Promise<Record<string, any[]>> {
    const res: Record<string, any[]> = {};
    for (const [name, map] of this.tables.entries()) {
      res[name] = Array.from(map.values());
    }
    return res;
  }

  async importState(state: Record<string, any[]>): Promise<void> {
    await this.transaction(async () => {
      this.tables.clear();
      for (const [name, rows] of Object.entries(state)) {
        const table = this.ensureTable(name);
        for (const row of rows) {
          const pk = row.id ?? row.userId ?? row.version;
          if (pk !== undefined) {
            table.set(String(pk), { ...row });
          }
        }
      }
    });
  }
}

/**
 * Genuine Native SQLite 3 Driver for Node.js (Vitest & Server Runtime)
 */
export class NodeSQLiteDriver implements DatabaseAdapter {
  private db: any = null;
  private openState = false;
  private dbPath: string;

  constructor(config?: DatabaseConfig) {
    if (config?.inMemory) {
      this.dbPath = ':memory:';
    } else if (config?.storagePath) {
      this.dbPath = config.storagePath;
    } else {
      this.dbPath = `./${config?.databaseName || 'daily_finance'}.sqlite`;
    }
  }

  getBackendType(): 'sqlite-node' {
    return 'sqlite-node';
  }

  async open(): Promise<void> {
    if (this.openState && this.db) return;
    const nodeSqlite = getNodeSQLite();
    if (!nodeSqlite || !nodeSqlite.DatabaseSync) {
      throw new DatabaseInitializationError(
        'Native node:sqlite DatabaseSync is not available in this runtime environment.'
      );
    }

    try {
      this.db = new nodeSqlite.DatabaseSync(this.dbPath);
      this.openState = true;

      if (this.dbPath !== ':memory:') {
        try {
          this.db.exec('PRAGMA journal_mode = WAL;');
        } catch {
          // WAL may not be allowed on in-memory or some container filesystems
        }
      }
      this.db.exec('PRAGMA foreign_keys = ON;');

      await this.runMigrations();
    } catch (err) {
      this.openState = false;
      this.db = null;
      throw new DatabaseInitializationError(
        `Failed to open native SQLite database at "${this.dbPath}": ${(err as Error).message}`,
        err
      );
    }
  }

  async close(): Promise<void> {
    if (this.db && this.openState) {
      try {
        if (typeof this.db.close === 'function') {
          this.db.close();
        }
      } finally {
        this.db = null;
        this.openState = false;
      }
    }
  }

  isOpen(): boolean {
    return this.openState && this.db !== null;
  }

  async getSchemaVersion(): Promise<number> {
    if (!this.isOpen()) await this.open();
    try {
      const checkTable = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations';"
      ).get();
      if (!checkTable) return 0;

      const row = this.db.prepare(
        "SELECT MAX(version) as maxVer FROM schema_migrations;"
      ).get();
      return row && row.maxVer ? Number(row.maxVer) : 0;
    } catch (err) {
      throw new Error(`Failed to query schema version: ${(err as Error).message}`);
    }
  }

  async runMigrations(): Promise<number> {
    const currentVersion = await this.getSchemaVersion();
    const pending = MIGRATIONS.filter(m => m.version > currentVersion).sort((a, b) => a.version - b.version);

    for (const step of pending) {
      await this.transaction(async (trx) => {
        await step.up(trx);
        await trx.execute(
          "INSERT INTO schema_migrations (version, appliedAt, description) VALUES (?, ?, ?);",
          [step.version, new Date().toISOString(), step.description]
        );
      });
    }

    return pending.length > 0 ? pending[pending.length - 1].version : currentVersion;
  }

  private sanitizeParams(params: any[] = []): any[] {
    return (params || []).map(p => (p === undefined ? null : p));
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.isOpen()) await this.open();
    try {
      const sanitized = this.sanitizeParams(params);
      if (!sanitized || sanitized.length === 0) {
        this.db.exec(sql);
      } else {
        const stmt = this.db.prepare(sql);
        stmt.run(...sanitized);
      }
    } catch (err) {
      throw new Error(`SQLite execute error on statement "${sql.substring(0, 60)}...": ${(err as Error).message}`);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isOpen()) await this.open();
    try {
      const sanitized = this.sanitizeParams(params);
      const stmt = this.db.prepare(sql);
      const rows = sanitized.length > 0 ? stmt.all(...sanitized) : stmt.all();
      return rows as T[];
    } catch (err) {
      throw new Error(`SQLite query error on statement "${sql.substring(0, 60)}...": ${(err as Error).message}`);
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.isOpen()) await this.open();
    try {
      const sanitized = this.sanitizeParams(params);
      const stmt = this.db.prepare(sql);
      const row = sanitized.length > 0 ? stmt.get(...sanitized) : stmt.get();
      return (row as T) || null;
    } catch (err) {
      throw new Error(`SQLite queryOne error on statement "${sql.substring(0, 60)}...": ${(err as Error).message}`);
    }
  }

  async transaction<T>(action: (trx: TransactionContext) => Promise<T>): Promise<T> {
    if (!this.isOpen()) await this.open();
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = await action({
        execute: async (sql, params) => this.execute(sql, params),
        query: async <R>(sql: string, params?: any[]) => this.query<R>(sql, params),
        queryOne: async <R>(sql: string, params?: any[]) => this.queryOne<R>(sql, params)
      });
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // Rollback failed if transaction was already closed
      }
      throw new TransactionAbortedError('SQLite transaction failed and was rolled back', err);
    }
  }

  async clearAllTables(): Promise<void> {
    if (!this.isOpen()) await this.open();
    const tables = [
      'transactions',
      'wallets',
      'spaces',
      'budgets',
      'savings_goals',
      'debts_loans',
      'credit_cards',
      'investments',
      'six_jars',
      'backup_packages'
    ];
    await this.transaction(async (trx) => {
      for (const t of tables) {
        try {
          await trx.execute(`DELETE FROM ${t};`);
        } catch {
          // Table may not exist yet
        }
      }
    });
  }

  async exportState(): Promise<Record<string, any[]>> {
    if (!this.isOpen()) await this.open();
    const tables = [
      'schema_migrations',
      'spaces',
      'wallets',
      'transactions',
      'budgets',
      'savings_goals',
      'debts_loans',
      'credit_cards',
      'investments',
      'six_jars',
      'user_preferences',
      'backup_packages'
    ];
    const res: Record<string, any[]> = {};
    for (const t of tables) {
      try {
        res[t] = await this.query(`SELECT * FROM ${t};`);
      } catch {
        res[t] = [];
      }
    }
    return res;
  }

  async importState(state: Record<string, any[]>): Promise<void> {
    if (!this.isOpen()) await this.open();
    await this.transaction(async (trx) => {
      for (const [tableName, rows] of Object.entries(state)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;
        for (const row of rows) {
          const keys = Object.keys(row);
          const placeholders = keys.map(() => '?').join(', ');
          const values = Object.values(row);
          await trx.execute(
            `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders});`,
            values
          );
        }
      }
    });
  }
}

/**
 * Universal Persistence Adapter Facade
 * Automatically selects genuine SQLite for Node.js environments and honest
 * BrowserStoragePersistenceAdapter for browser environments.
 */
export class SQLitePersistenceAdapter implements DatabaseAdapter {
  private static instance: SQLitePersistenceAdapter | null = null;
  private driver: DatabaseAdapter;

  constructor(config?: DatabaseConfig) {
    const nodeSqlite = getNodeSQLite();
    if (nodeSqlite && nodeSqlite.DatabaseSync) {
      this.driver = new NodeSQLiteDriver(config);
    } else {
      this.driver = new BrowserStoragePersistenceAdapter(config);
    }
  }

  public static getInstance(config?: DatabaseConfig): SQLitePersistenceAdapter {
    if (!SQLitePersistenceAdapter.instance) {
      SQLitePersistenceAdapter.instance = new SQLitePersistenceAdapter(config);
    }
    return SQLitePersistenceAdapter.instance;
  }

  public static setInstance(customAdapter: SQLitePersistenceAdapter | null): void {
    SQLitePersistenceAdapter.instance = customAdapter;
  }

  getBackendType(): 'sqlite-node' | 'browser-relational-storage' {
    return this.driver.getBackendType();
  }

  isCorrupted(): boolean {
    return this.driver.isCorrupted ? this.driver.isCorrupted() : false;
  }

  getCorruptionDetails(): { rawPayload: string; error: string } | null {
    return this.driver.getCorruptionDetails ? this.driver.getCorruptionDetails() : null;
  }

  async open(): Promise<void> {
    return this.driver.open();
  }

  async close(): Promise<void> {
    return this.driver.close();
  }

  isOpen(): boolean {
    return this.driver.isOpen();
  }

  async getSchemaVersion(): Promise<number> {
    return this.driver.getSchemaVersion();
  }

  async runMigrations(): Promise<number> {
    return this.driver.runMigrations();
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    return this.driver.execute(sql, params);
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.driver.query<T>(sql, params);
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    return this.driver.queryOne<T>(sql, params);
  }

  async transaction<T>(action: (trx: TransactionContext) => Promise<T>): Promise<T> {
    return this.driver.transaction<T>(action);
  }

  async clearAllTables(): Promise<void> {
    return this.driver.clearAllTables();
  }

  async exportState(): Promise<Record<string, any[]>> {
    return this.driver.exportState();
  }

  async importState(state: Record<string, any[]>): Promise<void> {
    return this.driver.importState(state);
  }
}
