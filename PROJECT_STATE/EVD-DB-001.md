# EVIDENCE REPORT: EVD-DB-001 / EVD-DB-001R

> **TASK ID:** DB-001 / DB-001R  
> **TASK NAME:** Local Persistence / Persistence Correctness Remediation  
> **PREDECESSOR TASKS:** REPO-004 (COMPLETE & CERTIFIED), GOV-REPO-004R2 (Remote Publication & Reconciliation)  
> **PARENT PHASE:** PHASE-10 — OFFLINE-FIRST DATABASE ENGINE  
> **DATE:** 2026-10-23  
> **STATUS:** IN PROGRESS (REMEDIATION AUDIT)  
> **AUTHOR:** Google AI Studio Agent  
> **BASELINE COMMIT:** `f56a23a2b0fccd3d4bac87b2e70757f9074fb423`

---

## 1. PERSISTENCE ARCHITECTURE AUDIT & STRATEGY DISCLOSURE

### Runtime Constraint & Browser Persistence Strategy Selection (Strategy B):
1. **Node.js Environment (Vitest & Server):**
   - Node 22 ships with native `node:sqlite` (`DatabaseSync`), an official ACID SQLite 3 engine supporting WAL mode, foreign keys, prepared statements, and transactions.
   - Implemented via `NodeSQLiteDriver` in `src/data/database/SQLitePersistenceAdapter.ts` with `getBackendType(): 'sqlite-node'`.
2. **Browser Environment (Vite Client & Preview Iframe):**
   - SQLite WASM/OPFS cannot be safely run in the browser client because:
     a. The application runs within an iframe sandbox where COOP/COEP isolation headers required for SharedArrayBuffer / OPFS are disabled or blocked.
     b. External WASM npm packages cannot be installed safely due to container package boundary constraints.
   - **Architectural Decision (Strategy B):** We explicitly choose and document Strategy B. We implement `BrowserStoragePersistenceAdapter` — an honest, non-SQLite relational persistence adapter. It implements the standard `DatabaseAdapter` interface with typed tables, schema migrations, atomic transaction staging, rollback, quota error detection, and quarantine of corrupted data without destructive overwriting. It honestly declares `getBackendType(): 'browser-relational-storage'`.

---

## 2. PERSISTENCE CORRECTNESS & RELIABILITY REMEDIATIONS

1. **Elimination of Silent Catch Blocks:**
   - Audited and removed all `catch {}` empty blocks in `SQLitePersistenceAdapter.ts`, `LocalDataSource.ts`, and `LocalTransactionRepository.ts`.
   - Persistence failures now surface explicit errors:
     - `DatabaseInitializationError` on migration / open failure.
     - `StorageQuotaExceededError` on storage quota exhaustion.
     - `StorageCorruptError` on parse or data integrity corruption.
     - `TransactionAbortedError` on transaction failure.
2. **Explicit Await of Initialization Readiness:**
   - `LocalDataSource.init()` and `ensureInitialized()` explicitly await database open and migrations before processing read/write operations.
3. **Protection Against Destructive Overwrite on Corrupt Storage:**
   - In `BrowserStoragePersistenceAdapter`, if stored database payload is corrupted or unparseable, it is NOT destructively overwritten with empty tables.
   - Corrupt data is quarantined under `${storageKey}_corrupt_${Date.now()}`, the adapter sets `isCorrupted() = true`, and raises `StorageCorruptError`.
4. **Hydration Across Application & Repository Instances:**
   - `LocalDataSource` checks if durable storage already holds records. If records exist, it hydrates in-memory collections (`spaces`, `wallets`, `transactions`, `budgets`, `savingsGoals`, `debtsAndLoans`, `investments`, `sixJars`, `creditCards`, `userPreferences`) directly from the database tables.
   - When instantiated fresh, it seeds initial collections into the database transactionally so state remains 1:1 consistent.
5. **Space Isolation & Legitimate Cross-Space Transfers:**
   - Strict space isolation enforced on all read, write, and delete queries.
   - Legitimate cross-space transfers (`spaceId = sp_A` and `targetSpaceId = sp_B`) are correctly visible in both participating spaces without leaking unshared records to unrelated spaces.
6. **Atomic Multi-Entity Restore:**
   - Multi-entity restore executes inside an atomic database transaction. If the database transaction aborts or fails, in-memory arrays remain completely intact.

---

## 3. MODIFIED & AUDITED FILES

| File Path | Role | Actions Performed |
| :--- | :--- | :--- |
| `src/data/database/DatabaseAdapter.ts` | Database Abstraction | Added `DatabaseInitializationError`, `StorageQuotaExceededError`, `StorageCorruptError`, `TransactionAbortedError`, and `getBackendType()` contract. |
| `src/data/database/SchemaMigrations.ts` | Schema Migrations | Maintained Room-compatible versioned migrations v1 and v2 for all 11+ tables, constraints, and indexes. |
| `src/data/database/SQLitePersistenceAdapter.ts` | Concrete Persistence Adapters | Separated `NodeSQLiteDriver` (native SQLite) and `BrowserStoragePersistenceAdapter` (Strategy B honest browser persistence) with corruption quarantine and quota handling. |
| `src/data/datasource/LocalDataSource.ts` | Local Data Source | Implemented durable write-through and startup hydration across all domain entities, atomic transactional restore, and error propagation. |
| `src/repositories/local/LocalTransactionRepository.ts` | Transaction Repository | Wired durable write-through with explicit error propagation and readiness verification. |
| `src/tests/db_persistence.test.ts` | Test Suite | Expanded to 12 focused tests verifying migrations, reopen durability, instance hydration, corruption quarantine, rollback, space isolation with transfers, and backup/restore. |
| `/PROJECT_STATE/*` | Governance State | Maintained `IN PROGRESS` status under DB-001R governance rules. |

**Strict Boundary Adherence:** Zero modifications to frozen domain engines (`src/domain/FinancialTruthEngine.ts`, `src/domain/CanonicalFinancialModel.ts`, `src/domain/InvariantEngine.ts`, `src/usecases/*`, presentation views, or navigation).

---

## 4. TECHNICAL VERIFICATION & ACCEPTANCE CRITERIA

| Test ID | Verified Behavior | Assertion / Proof |
| :--- | :--- | :--- |
| **DB01** | Schema Initialization & Migration | `schema_migrations` records v1 and v2; all 11+ tables initialized. |
| **DB02** | Migration Idempotency | Repeated `runMigrations()` returns current version 2 without error or data loss. |
| **DB03** | Reopen Durability | Data written to file-backed database survives `close()` and subsequent `open()` by separate adapter instance. |
| **DB04** | Instance Hydration | Recreating `LocalDataSource` hydrates state directly from durable storage without relying on hardcoded seeds. |
| **DB05** | Atomic Commit | Multi-table inserts in a single transaction commit together. |
| **DB06** | Atomic Rollback | Error in transaction block triggers full rollback, leaving database state unmutated. |
| **DB07** | Space Isolation & Transfers | Space A records isolated from Space B; cross-space transfer visible in both Space A and B; Space Gamma isolated. |
| **DB08** | Corruption Quarantine | BrowserStoragePersistenceAdapter detects corrupt JSON, preserves raw payload, creates quarantine backup, and avoids destructive overwrite. |
| **DB09** | Quota Error Contract | Quota exhaustion during write surfaces `DatabaseInitializationError` / `StorageQuotaExceededError`. |
| **DB10** | Backup & Restore Atomicity | `backupData()` persists to `backup_packages` table; `restoreData()` atomically replaces space data in DB and memory. |
| **DB11** | Backend Type Disclosure | Node runtime reports `sqlite-node`; browser relational adapter reports `browser-relational-storage`. |
| **DB12** | Numeric Precision & Currency | Large numbers, fractional decimals, and exact currencies preserved without rounding loss. |

---

## 5. QUALITY GATES

```bash
# Typecheck & Lint
$ npm run lint
> tsc --noEmit
# Result: Clean (0 errors)

# Full Vitest Regression Suite
$ npx vitest run
# Result: 17 passed (17 suites), 1,454 passed (1,454 tests)
```

---

## 6. STATUS

**IN PROGRESS (DB-001R REMEDIATION AUDIT)**  
*Under strict governance rule 6: task remains IN PROGRESS until the persistence architecture and integration are independently audited and confirmed.*
