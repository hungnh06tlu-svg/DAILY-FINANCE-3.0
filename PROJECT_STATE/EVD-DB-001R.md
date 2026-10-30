# EVIDENCE REPORT: EVD-DB-001R

> **TASK ID:** DB-001R / GOV-DB-001R-STATE-SYNC  
> **TASK NAME:** Persistence Correctness Remediation, Authoritative Remote Hygiene & Governance Reconciliation  
> **PREDECESSOR TASKS:** DB-001 (Offline-First SQLite Adapter), REPO-004 (COMPLETE & CERTIFIED)  
> **PARENT PHASE:** PHASE-10 — OFFLINE-FIRST DATABASE ENGINE  
> **DATE:** 2026-10-29  
> **STATUS:** COMPLETE & RECONCILED (REMOTE MAIN VERIFIED)  
> **AUTHOR:** Google AI Studio Agent  
> **EXPECTED GITHUB BASELINE:** `6f41e8699885197ed0fa4cac74d0f2cd87e7ac1a`  
> **AUTHORITATIVE REMOTE HEAD:** `4702c7d523bfd9ebf2f2ccd072af76771b8132c5`  
> **PARENT SHA:** `d3d73c65a93191666209d1f0c6c62dd2a3e0a642`  
> **REMOTE TREE SHA:** `bedb37ac05d7bdaea3a5b852c53ca8d6a0852213`  

---

## 1. REMEDIATION SCOPE & ARCHITECTURAL FOUNDATION

DB-001R was initiated to eliminate discrepancies between advertised persistence capabilities and actual execution environments, ensuring rigorous correctness across runtime boundaries without violating container constraints.

### 1.1 Dual Persistence Strategy (Strategy B Architecture)
1. **Node.js Environment (`node:sqlite`):**
   - Implemented via `NodeSQLiteDriver` in `src/data/database/SQLitePersistenceAdapter.ts`.
   - Utilizes Node 22 native `DatabaseSync` with synchronous ACID semantics, WAL journaling, foreign key enforcement (`PRAGMA foreign_keys = ON`), prepared statements, and transactional execution.
   - Declares `getBackendType(): 'sqlite-node'`.
   - Guaranteed server-side / test-runtime isolation: Node-only built-in modules (`node:sqlite`, `node:fs`, `node:path`) are strictly protected from client-side bundle leakage.

2. **Browser Environment (Strategy B - Relational Web Storage):**
   - Implemented via `BrowserStoragePersistenceAdapter` in `src/data/database/SQLitePersistenceAdapter.ts`.
   - **Architectural Honesty:** Transparently identified and declared as relational Web Storage (`getBackendType(): 'browser-relational-storage'`), explicitly rejecting pseudo-SQLite claims in browser iframe contexts where COOP/COEP header isolation for OPFS/SharedArrayBuffer is unavailable.
   - Enforces full Room-compatible relational schema contracts: typed tables, versioned migrations (`v1`, `v2`), atomic staged transactions, index maps, and rollback semantics.
   - **Non-Destructive Corruption Quarantine:** Detects corrupted or unparseable payloads without wiping user data; isolates unparseable storage to `${storageKey}_corrupt_${Date.now()}`, sets `isCorrupted() = true`, and surfaces `StorageCorruptError`.
   - **Quota Exhaustion Handling:** Catches browser quota boundaries, rolls back active transactional writes, and surfaces typed `StorageQuotaExceededError`.

3. **Lifecycle & Persistence Hardening:**
   - **Zero Silent Failures:** Removed all silent `catch {}` blocks across `SQLitePersistenceAdapter.ts`, `LocalDataSource.ts`, and `LocalTransactionRepository.ts`.
   - **Readiness Invariant:** All read and write operations in `LocalDataSource` explicitly await database open and migration completion (`ensureInitialized()`).
   - **Cross-Instance Hydration:** On instantiation, `LocalDataSource` queries durable storage; existing persisted entities (`spaces`, `wallets`, `transactions`, `budgets`, `savingsGoals`, `debtsAndLoans`, `investments`, `sixJars`, `creditCards`, `userPreferences`) hydrate into active memory. Fresh instances seed transactionally.
   - **Space Isolation & Transfer Preservation:** Enforces strict tenant separation on all queries while preserving cross-space transfer visibility (`spaceId === spaceId || targetSpaceId === spaceId`).
   - **Atomic Multi-Entity Restore:** Executes database backup restoration inside a transactional block; database rollback prevents memory array desynchronization upon failure.

---

## 2. VERIFIED EXECUTION EVIDENCE

### 2.1 Focused Database Persistence Test Suite (`src/tests/db_persistence.test.ts`)
Executed via `npx vitest run src/tests/db_persistence.test.ts`:
- **Result:** **14 / 14 PASSED (100%)**
- **Test Duration:** 919 ms
- **Execution Log Excerpt:**
  ```text
  RUN v4.1.10 /app/applet
  (node:1048) ExperimentalWarning: SQLite is an experimental feature and might change at any time
  ✓ src/tests/db_persistence.test.ts (14 tests) 100ms
  Test Files  1 passed (1)
       Tests  14 passed (14)
    Duration  919ms
  ```

| Test ID | Verified Behavior | Assertion / Proof | Result |
| :--- | :--- | :--- | :---: |
| **DB01** | Schema Initialization & Migration | Tables created, `schema_migrations` records v1 and v2 | `PASS` |
| **DB02** | Migration Idempotency | Consecutive migration runs preserve schema version 2 without error | `PASS` |
| **DB03** | Reopen Durability | Data persisted survives database `close()` and subsequent re-open | `PASS` |
| **DB04** | Instance Hydration | Secondary `LocalDataSource` instance hydrates records from disk | `PASS` |
| **DB05** | Atomic Commit | Multi-table entity insertion commits atomically | `PASS` |
| **DB06** | Atomic Rollback | Fault injected in transaction block rolls back state cleanly | `PASS` |
| **DB07** | Space Isolation & Transfers | Space A/B tenant boundary enforced; cross-space transfer visible in both | `PASS` |
| **DB08** | Corruption Quarantine | Malformed JSON in storage is quarantined without destructive wipe | `PASS` |
| **DB09** | Quota Error Contract | Quota exhaustion surfaces `StorageQuotaExceededError` | `PASS` |
| **DB10** | Backup & Restore Atomicity | Restore roundtrip validates checksum and restores entities transactionally | `PASS` |
| **DB11** | Backend Type Disclosure | Node runtime returns `sqlite-node`; browser adapter returns `browser-relational-storage` | `PASS` |
| **DB12** | Numeric Precision & Currency | Float amounts (e.g. `100.456`) and multi-currency codes preserved exactly | `PASS` |
| **DB13** | Multi-Entity Auxiliary Durability | Budgets, goals, debts, investments, six jars hydrate across instances | `PASS` |
| **DB14** | Fund & Six Jars Isolation | Six Jars and fund transactions maintain tenant isolation | `PASS` |

### 2.2 Full Vitest Regression Suite
- **Execution Command:** `npx vitest run --fileParallelism=false`
- **Result:** **1,456 / 1,456 PASSED (100% across all 17 test suites, 0 failures, 0 skipped)**
- **Note on Test Isolation:** Shared file database `./daily_finance.sqlite` requires sequential execution (`--fileParallelism=false`) or dedicated in-memory database instances to avoid concurrent thread table-lock contention.

### 2.3 Quality Gates & Build Verification
1. **TypeScript Compilation & Lint (`tsc --noEmit`):**
   - **Result:** Clean (0 errors, exit code 0).
2. **Production Bundle (`npm run build`):**
   - **Vite Client Bundle:**
     - `dist/index.html` (0.84 kB)
     - `dist/assets/index-*.css` (89.44 kB)
     - `dist/assets/__vite-browser-external_fs-*.js` (0.29 kB)
     - `dist/assets/index-*.js` (1,687.31 kB)
   - **Esbuild Server Bundle:**
     - `dist/server.cjs` (22.4 kB)
     - `dist/server.cjs.map` (38.7 kB)
   - **Result:** SUCCESS (exit code 0).
3. **AI Studio Compilation Gate (`compile_applet`):**
   - **Result:** `Build succeeded - the applet is compiled`.

---

## 3. STRICT FROZEN MODULE INVARIANCE

Zero modifications were introduced to frozen financial domain contracts or presentation components during DB-001R:
- `src/domain/FinancialTruthEngine.ts` (**100% UNTOUCHED / FROZEN**)
- `src/domain/CanonicalFinancialModel.ts` (**100% UNTOUCHED / FROZEN**)
- `src/domain/InvariantEngine.ts` (**100% UNTOUCHED / FROZEN**)
- `src/domain/methods/*.ts` (**100% UNTOUCHED / FROZEN**)
- `src/usecases/*` (**100% UNTOUCHED / FROZEN**)
- `src/views/*` (**100% UNTOUCHED / FROZEN**)

---

## 4. AUTHORITATIVE REMOTE HYGIENE RECONCILIATION

### 4.1 Authoritative Commit Lineage on GitHub `main`
Live verification against `https://api.github.com/repos/hungnh06tlu-svg/DAILY-FINANCE-3.0`:
- **Current Remote `main` HEAD SHA:** `4702c7d523bfd9ebf2f2ccd072af76771b8132c5`
- **Parent Commit SHA:** `d3d73c65a93191666209d1f0c6c62dd2a3e0a642`
- **Remote Tree SHA:** `bedb37ac05d7bdaea3a5b852c53ca8d6a0852213`
- **Commit Message:** `chore: ignore SQLite runtime files\n\nUpdate .gitignore to exclude SQLite database files and temporary patch exports to maintain a clean repository.`
- **Author / Committer:** `hungnh06tlu-svg <hungnh06tlu@gmail.com>`
- **Author Date:** `2026-10-29T16:38:09Z`
- **API Concordance:** `GET /git/ref/heads/main` and `GET /branches/main` both return `4702c7d523bfd9ebf2f2ccd072af76771b8132c5` (100% agreement).

### 4.2 Removal of Unintended Runtime & Patch Artifacts
Audited against remote tree `bedb37ac05d7bdaea3a5b852c53ca8d6a0852213`:
1. `daily_finance.sqlite` — **REMOVED** from remote tracking
2. `daily_finance.sqlite-wal` — **REMOVED** from remote tracking
3. `daily_finance.sqlite-shm` — **REMOVED** from remote tracking
4. `db_001r_against_baseline_6f41e8.patch` (root) — **REMOVED** from remote tracking
5. `db_001r_against_remote_d82b7df.patch` (root) — **REMOVED** from remote tracking
6. `.aistudio/artifacts/brain/3c73673d-7c47-4a9f-8c3c-b5519b929d46/db_001r_against_baseline_6f41e8.patch` — **REMOVED** from remote tracking
7. `.aistudio/artifacts/brain/3c73673d-7c47-4a9f-8c3c-b5519b929d46/db_001r_against_remote_d82b7df.patch` — **REMOVED** from remote tracking

### 4.3 Active `.gitignore` Exclusions
Verified committed and active on `main`:
```gitignore
# SQLite runtime database & journal companions
*.sqlite
*.sqlite-wal
*.sqlite-shm
*.sqlite-journal
*.db
*.db-wal
*.db-shm

# Temporary patch & diff export files
*.patch
*.diff
```

### 4.4 Backup Preservation Proofs
Prior to hygiene cleanup, the runtime database containing generated test/development records was backed up:
- **Filesystem Backup:** `/tmp/backup_runtime_db_hygiene/daily_finance.sqlite` (724,992 bytes, verified intact)
- **Artifact Brain Backup:** `/app/applet/.aistudio/artifacts/brain/3c73673d-7c47-4a9f-8c3c-b5519b929d46/daily_finance_backup.sqlite` (724,992 bytes, verified intact)
- **Commit Patch Backup:** `/app/applet/.aistudio/artifacts/brain/3c73673d-7c47-4a9f-8c3c-b5519b929d46/gov_db_001r_hygiene_commit_4702c7d.patch` (SHA-256: `733240996c3db72f557196e5d3ec9dace532be09a0c9c67607ae47928f806b46`)

---

## 5. LIMITATIONS & UNRESOLVED RISKS

1. **Container Environment Write Boundary:** The AI Studio preview environment lacks interactive Git write credentials; direct `git push` from inside the web container cannot be executed without external credentials. Remote publication was verified through authoritative GitHub REST API queries.
2. **Sequential Test Execution Requirement:** In parallel Vitest execution across multiple worker threads, concurrent workers writing to the same SQLite file path can encounter table-lock contention (`no such table: spaces`). For continuous integration, tests should be run sequentially (`--fileParallelism=false`) or configured with unique test database paths.
3. **Downstream Task Gate:** `SYNC-001` (Phase-11) is strictly held pending user authorization.

---

## 6. STATUS DECLARATION

**STATUS:** **COMPLETE & RECONCILED (REMOTE MAIN VERIFIED)**  
- Implementation: Complete & Verified (14/14 persistence tests, 1,456/1,456 full suite)
- Repository Hygiene: Published and verified on remote `main` at `4702c7d523bfd9ebf2f2ccd072af76771b8132c5`
- Governance State: Synchronized across `/PROJECT_STATE/*`
- Explicit Statement: **`SYNC-001 NOT STARTED — AWAITING USER AUTHORIZATION`**
