/**
 * Daily Finance 3.0 - Database Adapter Abstraction Layer (DB-001 / DB-001R)
 * Standard: Clean Architecture / Offline-First Persistence
 * Provides unified transactional database contract matching Room / SQLite relational semantics.
 */

export class DatabaseInitializationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[DatabaseInitializationError]: ${message}`);
    this.name = 'DatabaseInitializationError';
  }
}

export class StorageQuotaExceededError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[StorageQuotaExceededError]: ${message}`);
    this.name = 'StorageQuotaExceededError';
  }
}

export class StorageCorruptError extends Error {
  constructor(message: string, public readonly rawPayload?: string, public readonly cause?: unknown) {
    super(`[StorageCorruptError]: ${message}`);
    this.name = 'StorageCorruptError';
  }
}

export class TransactionAbortedError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`[TransactionAbortedError]: ${message}`);
    this.name = 'TransactionAbortedError';
  }
}

export interface TransactionContext {
  execute(sql: string, params?: any[]): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

export interface DatabaseConfig {
  databaseName?: string;
  inMemory?: boolean;
  storagePath?: string;
  storageDriver?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
}

export interface DatabaseAdapter {
  /**
   * Identifies the underlying persistence engine honestly.
   * 'sqlite-node' = Genuine SQLite 3 engine running on Node.js via node:sqlite.
   * 'browser-relational-storage' = Browser-safe relational persistence adapter over WebStorage/Memory.
   */
  getBackendType(): 'sqlite-node' | 'browser-relational-storage';

  /**
   * Initializes and opens the database connection.
   * Runs schema migrations up to latest version.
   */
  open(): Promise<void>;

  /**
   * Closes the active database connection.
   */
  close(): Promise<void>;

  /**
   * Returns whether the database connection is currently open and ready.
   */
  isOpen(): boolean;

  /**
   * Returns current schema version from schema_migrations table.
   */
  getSchemaVersion(): Promise<number>;

  /**
   * Runs all pending versioned migrations.
   */
  runMigrations(): Promise<number>;

  /**
   * Executes a single DDL or DML statement with optional parameters.
   */
  execute(sql: string, params?: any[]): Promise<void>;

  /**
   * Executes a query returning multiple typed rows.
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Executes a query returning a single typed row or null.
   */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Executes an atomic multi-statement transaction with automatic rollback on error.
   */
  transaction<T>(action: (trx: TransactionContext) => Promise<T>): Promise<T>;

  /**
   * Clears table contents (for testing and isolated test environments).
   */
  clearAllTables(): Promise<void>;

  /**
   * Serializes the current persistent state for backup and diagnostics.
   */
  exportState(): Promise<Record<string, any[]>>;

  /**
   * Restores state into the database transactionally.
   */
  importState(state: Record<string, any[]>): Promise<void>;

  /**
   * Returns true if storage corruption was detected during initialization.
   */
  isCorrupted?(): boolean;

  /**
   * Returns details of quarantined corrupt storage for recovery.
   */
  getCorruptionDetails?(): { rawPayload: string; error: string } | null;
}

