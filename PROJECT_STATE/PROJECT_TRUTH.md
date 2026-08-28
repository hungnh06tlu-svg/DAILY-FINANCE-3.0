# 📜 PROJECT TRUTH — IMMUTABLE PROJECT RULES

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Universal Invariants, Architectural Contracts & Boundary Constraints  
> **STATUS:** IMMUTABLE & MANDATORY FOR ALL AI AGENTS (AI Studio, ChatGPT, Claude, Cursor, Gemini)  
> **LAST VERIFIED:** 2026-08-28

---

## 1. ARCHITECTURAL BASELINE & STRATIFICATION

The architecture of DAILY FINANCE 3.0 strictly follows Clean Architecture + Model-View-Intent (MVI) principles. No layer may bypass adjacent layers or violate the downward dependency rule.

```text
PRESENTATION / MVI (UI Components, ViewModels, UI State & Intents)
        ↓
DOMAIN (Pure Entities, Invariants, Financial Calculations, Rule Engines)
        ↓
AI / AI TOOLS (Read Models, Intent Parsers, Decision Engines, Context Builders)
        ↓
USE CASES (Application Orchestration, Flow Control, Atomic Operations)
        ↓
REPOSITORY INTERFACES (Contracts for Domain Persistence & Queries)
        ↓
OFFLINE-FIRST DATABASE (Local SQLite / Room / IndexedDB / Storage Adapters)
        ↓
SYNC / BACKUP (Delta Sync Engine, Outbox Queue, Conflict Resolvers)
        ↓
CLOUD STORAGE (Firebase / Remote Backup / Optional Cloud Gateways)
```

**Boundary Rules:**
- **Presentation** communicates only with **Domain / ViewModels / UseCases**.
- **Domain** is completely pure, deterministic, and free of platform/framework dependencies.
- **AI Components** must never call databases directly, perform hidden writes, or execute mutations outside established Use Cases.
- **Use Cases** orchestrate Domain engines and interact with Repository contracts.

---

## 2. FINANCIAL TRUTH AUTHORITY

```text
FinancialTruthEngine = Sole, Universal Authority for Financial Calculations
```

- **Zero Calculation Duplication**: No UI component, ViewModel, AI Assistant, or Use Case is permitted to implement independent balance, income, expense, net worth, or debt calculation logic.
- **Pure Function Contract**: All calculations in `FinancialTruthEngine` must be deterministic pure functions of time $O(n)$ with zero side-effects and zero mutations on input arrays.
- **Bypass Prohibition**: No AI agent or subsystem may establish an alternative calculation engine or bypass `FinancialTruthEngine`.

---

## 3. CANONICAL FINANCIAL MODEL FOUNDATION

The Canonical Financial Model defined in `src/domain/CanonicalFinancialModel.ts` is the single source of truth for all domain types, entities, and validation invariants.
- **Immutable Types**: Canonical structures (`Transaction`, `Wallet`, `Fund`, `Budget`, `Debt`, `SavingsGoal`, `InvestmentItem`) must not be modified, replaced, or extended with incompatible schemas without explicit, multi-party architectural approval.
- **Status Machine Invariants**: Transaction lifecycle states are strictly constrained:
  $$\text{draft} \rightarrow \text{validated} \rightarrow \text{confirmed} \rightarrow \text{soft\_deleted} \rightleftharpoons \text{restored} \rightarrow \text{archived}$$

---

## 4. MULTI-SPACE & MULTI-FUND ISOLATION

DAILY FINANCE 3.0 is intrinsically multi-tenant at the local domain level:
- **Multi-Space**: All financial entities, queries, and calculations must enforce strict `spaceId` isolation (e.g., `sp_personal`, `sp_business`, `sp_alpha`, `sp_beta`). No cross-space data leakage is permitted. Empty string `spaceId` is strictly forbidden.
- **Multi-Fund**: Financial structures support multiple independent funds (`fundId`). No calculations may assume a single monolithic fund or merge funds without explicit domain grouping.

---

## 5. RAW AMOUNT PRECISION & MONEY INTEGRITY

- **Raw Precision Preservation**: Normalization pipelines and domain entities must preserve exact floating-point and decimal values as authored (e.g., `100.456` must NEVER be rounded to `100.46` during ingestion, normalization, or domain storage).
- **VND Rounding Boundary**: Currency formatting or discrete rounding rules must only apply at presentation/display boundaries or when explicitly commanded by canonical domain rules (e.g., `MoneyUtils.round`), never implicitly during processing.
- **Extreme Boundary Safety**: Boundary values (e.g., `Number.MAX_SAFE_INTEGER`, `0.00000001`) must not degrade or overflow.

---

## 6. EXPLICIT CURRENCY CONTRACT

- **No Implicit Currency Assumption**: Systems must not silently inject default currencies (e.g., assuming USD or VND) unless specified by the entity contract or user space configuration.
- **Multi-Currency Reconciliation**: Currency conversions require explicit rates and must not alter underlying source transaction amounts.

---

## 7. TRANSFER CONSERVATION & SYSTEM NEUTRALITY

- **Same-Space Transfer**:
  $$\Delta \text{Source Wallet} = -X, \quad \Delta \text{Target Wallet} = +X \implies \Delta \text{Space Balance} = 0$$
- **Cross-Space Transfer**:
  $$\Delta \text{Source Space} = -X, \quad \Delta \text{Target Space} = +X \implies \Delta \text{System Net Balance} = 0$$
- Every transfer must atomically update both endpoints or roll back entirely.

---

## 8. STRICT LIFECYCLE & INACTIVE ENTITY EXCLUSION

- **Active Calculation Filter**: The following states are unconditionally EXCLUDED from active financial metrics (Income, Expense, Cash Balance, Budget Spent, Net Worth):
  - `status: 'draft'`
  - `status: 'pending'`
  - `status: 'soft_deleted'` (or `isDeleted: true`, `isSoftDeleted: true`, `deletedAt != null`)
  - `status: 'archived'`
- **Reversibility**: Soft-deleted entities can only return to active calculations via explicit restoration to `confirmed` status.

---

## 9. SEPARATION OF OPENING & INITIAL BALANCES

- `opening_balance` and `initial_balance` are baseline balance initializations.
- **Operational Exclusion**: They must **NEVER** be categorized or summed as operational `income` or `expense`.
- **Balance Inclusion**: They participate strictly in wallet balance calculation:
  $$\text{Balance} = \text{InitialBalance} + \sum \text{Income} - \sum \text{Expense} \pm \sum \text{Transfers} + \sum \text{Adjustments}$$

---

## 10. AI SAFETY & TRUST BOUNDARIES

- **No Silent Mutations**: AI components, voice assistants, and LLM endpoints are strictly prohibited from performing direct or silent database writes.
- **Two-Phase Commit for AI Actions**: Any financial modification initiated by AI must create a `PendingAction` and require explicit user confirmation before executing via a canonical Use Case.
- **Fact vs. Recommendation**: AI outputs must strictly separate factual financial truth (verified balances) from algorithmic insights or subjective recommendations.
- **No Guessing**: If required entities (such as source wallet or space) are ambiguous or missing, AI must prompt the user or fail safely; it must NEVER guess or default to `wallets[0]`.

---

## 11. ARCHITECTURAL FREEZE GOVERNANCE

- **Frozen Modules**: Components certified as `COMPLETE & FROZEN` cannot be modified, refactored, or rearranged without formal unfreezing approval and explicit verification evidence.
- **Audit-First Rule**: Any claim of task completion must be backed by reproducible test evidence and recorded in `EVIDENCE_INDEX.md`.
