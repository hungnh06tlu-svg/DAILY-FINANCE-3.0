# 📜 DECISION LOG — ARCHITECTURAL & BUSINESS DECISIONS

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Immutable Architectural Decisions, Invariant Rationales & Compliance History  
> **LAST VERIFIED:** 2026-08-28  

---

## 1. ARCHITECTURAL & FINANCIAL INVARIANT DECISIONS

### DEC-001: FinancialTruthEngine as Sole Financial Authority
- **Decision ID:** `DEC-001`
- **Date:** `2026-08-27`
- **Decision:** `FinancialTruthEngine` is established as the sole, universal calculation authority for all financial balances, incomes, expenses, net worths, and method evaluations across the entire system.
- **Reason:** Prevent divergent or competing calculations across ViewModels, AI assistants, and reports that lead to financial truth inconsistencies.
- **Affected Areas:** `Domain`, `UseCases`, `AI`, `Presentation`, `Reports`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `src/domain/FinancialTruthEngine.ts`, `src/tests/d2_financial_truth.test.ts` (319 tests).

---

### DEC-002: Native Multi-Space Isolation
- **Decision ID:** `DEC-002`
- **Date:** `2026-08-27`
- **Decision:** The domain natively supports multiple distinct spaces (e.g., Personal, Business, Alpha). Every transaction, wallet, budget, and calculation must explicitly specify and validate `spaceId`.
- **Reason:** Guarantee strict tenant data separation and prevent business vs. personal financial contamination.
- **Affected Areas:** `CanonicalFinancialModel`, `SpaceIsolationGuard`, all calculation paths.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `SpaceIsolationGuard.ts`, `d2_runner.ts:1750-1752` (Multi-space isolation tests).

---

### DEC-003: Native Multi-Fund Architecture
- **Decision ID:** `DEC-003`
- **Date:** `2026-08-27`
- **Decision:** Support multiple distinct financial funds (`fundId`) under spaces without assuming a single monolithic fund structure.
- **Reason:** Allow granular allocation across emergency funds, investment funds, and sinking funds.
- **Affected Areas:** `WalletUseCases`, `FundsView`, `FinancialTruthEngine`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1953-1954` (Fund isolation tests).

---

### DEC-004: Raw Amount Precision Preservation
- **Decision ID:** `DEC-004`
- **Date:** `2026-08-27`
- **Decision:** The domain normalization layer and truth engine must never automatically round floating-point amounts (e.g., `100.456` must remain `100.456`, not rounded to `100.46`).
- **Reason:** Preserve exact transactional precision for multi-currency conversions, crypto, micro-transactions, and audits.
- **Affected Areas:** `TransactionNormalizer`, `MoneyUtils`, `FinancialTruthEngine`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1768` (Floating precision test).

---

### DEC-005: Explicit Currency Specifications
- **Decision ID:** `DEC-005`
- **Date:** `2026-08-27`
- **Decision:** Do not silently inject default currencies during transaction normalization unless specified by the entity contract or space settings.
- **Reason:** Prevent silent distortion of multi-currency ledgers.
- **Affected Areas:** `TransactionNormalizer`, `CanonicalFinancialModel`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1821-1824`.

---

### DEC-006: System Conservation in Transfers
- **Decision ID:** `DEC-006`
- **Date:** `2026-08-27`
- **Decision:** 
  - Same-space transfers must yield net zero change at the space level ($\Delta \text{Space} = 0$).
  - Cross-space transfers must preserve global system balance neutrality ($\Delta \text{System} = 0$).
- **Reason:** Obey fundamental accounting conservation invariants; prevent money creation or destruction.
- **Affected Areas:** `TransferMoneyUseCase`, `FinancialTruthEngine.calculateTransfer`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1828-1836` (Transfer conservation tests).

---

### DEC-007: Lifecycle Filtering of Inactive Records
- **Decision ID:** `DEC-007`
- **Date:** `2026-08-27`
- **Decision:** Records with status `draft`, `pending`, `soft_deleted`, or `archived` are strictly excluded from all active financial truth calculations.
- **Reason:** Prevent uncommitted or deleted items from distorting user net worth, income, or budgets.
- **Affected Areas:** `FinancialTruthEngine.isActiveTransaction`, `BudgetEngine`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1738-1742`, `d3_invariants.test.ts` (INV-002, INV-003).

---

### DEC-008: Non-Operational Opening & Initial Balances
- **Decision ID:** `DEC-008`
- **Date:** `2026-08-27`
- **Decision:** `opening_balance` and `initial_balance` participate only in wallet baseline balance accumulation and must NEVER be treated as operational income or expense.
- **Reason:** Prevent artificial inflation of monthly revenue or expenses upon wallet setup or import.
- **Affected Areas:** `FinancialTruthEngine.calculateIncome`, `calculateExpense`, `calculateBalance`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `d2_runner.ts:1818-1823`.

---

### DEC-009: AI Two-Phase Mutation & Trust Boundary
- **Decision ID:** `DEC-009`
- **Date:** `2026-08-28`
- **Decision:** AI tools, voice assistants, and LLM integrations are prohibited from direct or silent database writes. All actions must produce a `PendingAction` and execute only via canonical Use Cases upon explicit user confirmation.
- **Reason:** Protect user financial data from hallucinated or unintended modifications.
- **Affected Areas:** `VoiceAssistantBuilder`, `SmartVoiceAssistant`, `server.ts`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `GetVoiceAssistantStateUseCase.ts`, `src/tests/sprint2_runner.ts` (S5-008 suite).

---

### DEC-010: Strict Architecture Freeze Governance
- **Decision ID:** `DEC-010`
- **Date:** `2026-08-28`
- **Decision:** No AI agent may modify, refactor, or delete certified frozen components without explicit multi-AI verification and human sign-off.
- **Reason:** Ensure long-term stability and eliminate regression churn across multi-agent sessions.
- **Affected Areas:** All modules marked `COMPLETE & FROZEN`.
- **Status:** `FROZEN & ENFORCED`
- **Evidence:** `FREEZE-CERTIFICATE.md`, `PROJECT_STATE/PROJECT_TRUTH.md`.
