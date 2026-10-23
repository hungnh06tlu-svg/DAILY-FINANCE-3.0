/**
 * Daily Finance 3.0 - SQLitePersistenceAdapter (DB-001)
 * Standard: Clean Architecture / Offline-First Durable Persistence Adapter
 * Provides native SQLite 3 persistence in Node.js/Vitest via node:sqlite (DatabaseSync)
 * with a durable transactional web storage engine for client browser runtimes.
 */

import { DatabaseAdapter, TransactionContext, DatabaseConfig } from './DatabaseAdapter';
import { MIGRATIONS, CURRENT_SCHEMA_VERSION } from './SchemaMigrations';

// Dynamic resolver for node:sqlite to prevent bundler errors in browser Vite builds
function getNodeSQLite(): any {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Dynamic import/require check
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
 * Universal in-memory & WebStorage relational driver for browser environments
 */
class WebRelationalDriver implements DatabaseAdapter {
  private openState = false;
  private tables: Map<string, Map<string, any>> = new Map();
  private storageKey: string;
  private inMemory: boolean;

  constructor(config?: DatabaseConfig) {
    this.inMemory = !!config?.inMemory;
    this.storageKey = `df3_sqlite_${config?.databaseName || 'daily_finance'}`;
  }

  async open(): Promise<void> {
    if (this.openState) return;
    this.openState = true;

    // Load from storage if not strictly inMemory
    if (!this.inMemory && typeof window !== 'undefined' && window.localStorage) {
      try {
        const serialized = window.localStorage.getItem(this.storageKey);
        if (serialized) {
          const parsed = JSON.parse(serialized);
          for (const [table, rows] of Object.entries(parsed)) {
            const tableMap = new Map<string, any>();
            if (Array.isArray(rows)) {
              for (const row of rows) {
                if (row && row.id) {
                  tableMap.set(String(row.id), row);
                } else if (row && row.userId) {
                  tableMap.set(String(row.userId), row);
                } else if (row && row.version !== undefined) {
                  tableMap.set(String(row.version), row);
                }
              }
            }
            this.tables.set(table, tableMap);
          }
        }
      } catch (err) {
        console.warn('[WebRelationalDriver] Error loading stored database, initializing fresh:', err);
      }
    }

    await this.runMigrations();
    this.persist();
  }

  async close(): Promise<void> {
    this.persist();
    this.openState = false;
  }

  isOpen(): boolean {
    return this.openState;
  }

  private persist(): void {
    if (this.inMemory || typeof window === 'undefined' || !window.localStorage) return;
    try {
      const data: Record<string, any[]> = {};
      for (const [tableName, map] of this.tables.entries()) {
        data[tableName] = Array.from(map.values());
      }
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.warn('[WebRelationalDriver] Persistence error:', err);
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
      return; // Indexes implicit in memory driver
    }
    if (trimmed.startsWith('INSERT INTO')) {
      const match = trimmed.match(/INSERT INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
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
      }
      return;
    }
    if (trimmed.startsWith('UPDATE')) {
      const match = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
      if (match && match[1]) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          // Find target rows matching WHERE id = ?
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
      }
      return;
    }
    if (trimmed.startsWith('DELETE FROM')) {
      const match = trimmed.match(/DELETE FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
      if (match && match[1]) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          if (params.length > 0) {
            table.delete(String(params[0]));
          } else {
            table.clear();
          }
          this.persist();
        }
      }
      return;
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
        rows = rows.filter(r => r.spaceId === params[0] || (r.targetSpaceId && r.targetSpaceId === params[0]));
      }
    }

    return rows.map(r => ({ ...r })) as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction<T>(action: (trx: TransactionContext) => Promise<T>): Promise<T> {
    // Snapshot state for atomic rollback
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
      // Rollback
      this.tables = snapshot;
      this.persist();
      throw err;
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
 * Node.js SQLite driver using native node:sqlite DatabaseSync
 */
class NodeSQLiteDriver implements DatabaseAdapter {
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

  async open(): Promise<void> {
    if (this.openState && this.db) return;
    const nodeSqlite = getNodeSQLite();
    if (!nodeSqlite || !nodeSqlite.DatabaseSync) {
      throw new Error('[NodeSQLiteDriver] Native node:sqlite DatabaseSync is not available in this environment');
    }

    this.db = new nodeSqlite.DatabaseSync(this.dbPath);
    this.openState = true;

    // Enable WAL mode & foreign keys for high performance and integrity
    if (this.dbPath !== ':memory:') {
      try {
        this.db.exec('PRAGMA journal_mode = WAL;');
      } catch {
        // Fallback for environments where WAL PRAGMA is restricted
      }
    }
    this.db.exec('PRAGMA foreign_keys = ON;');

    await this.runMigrations();
  }

  async close(): Promise<void> {
    if (this.db && this.openState) {
      try {
        if (typeof this.db.close === 'function') {
          this.db.close();
        }
      } catch {
        // Ignore close error
      }
      this.db = null;
      this.openState = false;
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
    } catch {
      return 0;
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

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.isOpen()) await this.open();
    if (!params || params.length === 0) {
      this.db.exec(sql);
    } else {
      const stmt = this.db.prepare(sql);
      stmt.run(...params);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isOpen()) await this.open();
    const stmt = this.db.prepare(sql);
    const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
    return rows as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.isOpen()) await this.open();
    const stmt = this.db.prepare(sql);
    const row = params.length > 0 ? stmt.get(...params) : stmt.get();
    return (row as T) || null;
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
        // Rollback attempt
      }
      throw err;
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
 * Universal SQLitePersistenceAdapter Facade
 */
export class SQLitePersistenceAdapter implements DatabaseAdapter {
  private static instance: SQLitePersistenceAdapter | null = null;
  private driver: DatabaseAdapter;

  constructor(config?: DatabaseConfig) {
    const nodeSqlite = getNodeSQLite();
    if (nodeSqlite && nodeSqlite.DatabaseSync) {
      this.driver = new NodeSQLiteDriver(config);
    } else {
      this.driver = new WebRelationalDriver(config);
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
