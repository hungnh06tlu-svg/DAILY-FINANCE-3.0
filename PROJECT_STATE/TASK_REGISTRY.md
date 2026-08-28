# 📋 TASK REGISTRY — GLOBAL WORKFLOW & ROADMAP

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Full Lifecycle Task Tracking & Multi-Agent Responsibility Matrix  
> **LAST VERIFIED:** 2026-08-28  

---

## 1. PRESENTATION & NAVIGATION ROADMAP (G1, G2 & SPRINT 5)

| Task ID | Task Description | Status | Owner | Evidence Ref | Tests | Files Impacted | Dependencies | Last Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **G1** | Navigation Restructuring (5 mobile, 7 tablet items) | `COMPLETE & FROZEN` | AI Studio | EVD-G1-01 | UI Smoke | `App.tsx`, `NavigationShell.tsx` | None | 2026-08-28 |
| **G2** | UX Hierarchy (Methods nested under Jars) | `COMPLETE & FROZEN` | AI Studio | EVD-G2-01 | UI Smoke | `BudgetingMethodsView.tsx` | G1 | 2026-08-28 |
| **S5-001** | Wallets & Funds Overview UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-001 | Smoke (10/10) | `WalletsView.tsx`, `FundsView.tsx` | G1, G2 | 2026-08-28 |
| **S5-002** | Transaction History & Filter UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-002 | Smoke (10/10) | `TransactionsView.tsx` | D1, D2 | 2026-08-28 |
| **S5-003** | Assets, Debts & Net Worth UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-003 | Smoke (10/10) | `AssetsDebtsView.tsx` | D1, D2 | 2026-08-28 |
| **S5-004** | Jars & Financial Methods Hub UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-004 | Smoke (10/10) | `SixJarsView.tsx`, `MethodsDashboard.tsx` | G2, D2-003 | 2026-08-28 |
| **S5-005** | Budgeting & Spending Limits UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-005 | Smoke (10/10) | `BudgetsView.tsx` | D2-003 | 2026-08-28 |
| **S5-006** | Savings Goals & Sinking Funds UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-006 | Smoke (10/10) | `SavingsGoalsView.tsx` | D2-003 | 2026-08-28 |
| **S5-007** | Investment Portfolio & DCA UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-007 | Smoke (10/10) | `InvestmentsView.tsx` | D2-003 | 2026-08-28 |
| **S5-008** | Smart Voice Assistant UI & Audio Wave | `COMPLETE & FROZEN` | AI Studio | EVD-S5-008 | Smoke (10/10) | `SmartVoiceAssistant.tsx` | D1, D2 | 2026-08-28 |
| **S5-009** | AI Coach & Financial Insights UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-009 | Smoke (10/10) | `AiCoachInsights.tsx` | D2, D2-003 | 2026-08-28 |
| **S5-010** | Smart AI Interactive Chat UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-010 | Smoke (10/10) | `SmartAIChat.tsx` | D2 | 2026-08-28 |
| **S5-011** | Financial Reports & Export UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-011 | Smoke (10/10) | `ReportsView.tsx` | D2, D2-003 | 2026-08-28 |
| **S5-012** | Automation Center & Notifications UI | `COMPLETE & FROZEN` | AI Studio | EVD-S5-012 | Smoke (10/10) | `AutomationCenterView.tsx` | D1 | 2026-08-28 |

---

## 2. DOMAIN & FINANCIAL TRUTH ROADMAP (D1 & D2)

| Task ID | Task Description | Status | Owner | Evidence Ref | Tests | Files Impacted | Dependencies | Last Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **D1** | Canonical Financial Model Core | `COMPLETE & FROZEN` | AI Studio | EVD-D1-01 | 17/17 PASS | `CanonicalFinancialModel.ts` | None | 2026-08-28 |
| **D2-001** | Transaction Lifecycle & State Transitions | `COMPLETE & FROZEN` | AI Studio | EVD-D2-01 | G1-G6 PASS | `TransactionLifecycleGuard.ts` | D1 | 2026-08-28 |
| **D2-002** | Financial Truth Engine Pipeline & Calculations | `COMPLETE & FROZEN` | AI Studio | EVD-D2-02 | 319/319 PASS | `FinancialTruthEngine.ts` | D1, D2-001 | 2026-08-28 |
| **D2-003** | 10 Financial Method Domain Engines | `STABLE` | AI Studio | EVD-D2-03 | 37/37 PASS | `src/domain/methods/*.ts` | D1, D2-002 | 2026-08-28 |
| **D2-VERIFY** | D2 Final 20-Point Invariant Verification | `COMPLETE & FROZEN` | AI Studio | EVD-D2-VER | 20/20 PASS | `d2_runner.ts` | D2-001..003 | 2026-08-28 |

---

## 3. INVARIANTS & INTEGRITY (D3)

| Task ID | Task Description | Status | Owner | Evidence Ref | Tests | Files Impacted | Dependencies | Last Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **D3-001** | Invariant Engine Core (INV-001..INV-005) | `NOT STARTED` | Unassigned | Pending Audit | 26 tests exist | `src/domain/InvariantEngine.ts` | D1, D2 | 2026-08-28 |
| **D3-002** | Invariant Engine Rules (INV-006..INV-010) | `NOT STARTED` | Unassigned | Pending Audit | 26 tests exist | `src/domain/InvariantEngine.ts` | D3-001 | 2026-08-28 |
| **D3-003** | Invariant Engine Bounds (INV-011..INV-015) | `NOT STARTED` | Unassigned | Pending Audit | 26 tests exist | `src/domain/InvariantEngine.ts` | D3-002 | 2026-08-28 |

---

## 4. PERSISTENCE & DATA CONTRACTS (D4)

| Task ID | Task Description | Status | Owner | Evidence Ref | Tests | Files Impacted | Dependencies | Last Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **D4-001** | Repository Data Contracts & Entities | `NOT STARTED` | Unassigned | Pending Audit | 21 tests exist | `src/repositories/contracts.ts` | D1 | 2026-08-28 |
| **D4-002** | Local Storage Adapter & Soft-Delete | `NOT STARTED` | Unassigned | Pending Audit | 21 tests exist | `src/repositories/local/*.ts` | D4-001 | 2026-08-28 |
| **D4-003** | Delta Sync Engine & Conflict Resolver | `NOT STARTED` | Unassigned | Pending Audit | 21 tests exist | `src/domain/SyncEngine.ts` | D4-002 | 2026-08-28 |

---

## 5. AI ARCHITECTURE & INTEGRATION (AI-001)

| Task ID | Task Description | Status | Owner | Evidence Ref | Tests | Files Impacted | Dependencies | Last Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **AI-001A** | AI Architecture Discovery & Inventory | `NOT CONFIRMED` | AI Studio | EVD-AI-01 | Audit Draft | `server.ts`, `src/domain/AI*.ts` | D2 | 2026-08-28 |
| **AI-001B** | AI Tools Standardization & Schema Contracts | `NOT STARTED` | Unassigned | None | None | `src/domain/ai/*.ts` | AI-001A | — |
| **AI-001C** | Voice Assistant Hardening & Space Guard | `NOT STARTED` | Unassigned | None | None | `VoiceAssistantBuilder.ts` | AI-001B, D1 | — |
| **AI-001D** | Server Gemini Proxy Security & Validation | `NOT STARTED` | Unassigned | None | None | `server.ts` | AI-001B | — |

---

## 6. APPLICATION & INFRASTRUCTURE SUBSYSTEMS

| Subsystem | Scope Description | Status | Owner | Dependencies | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **USE CASE** | 31 Clean Architecture Use Cases | `NOT CONFIRMED` | Unassigned | D1, D2 | 791 passing tests exist; requires formal state confirmation. |
| **REPOSITORY** | Domain Repository Implementations | `NOT STARTED / NOT CONFIRMED` | Unassigned | D4-001 | Offline local implementation present in code. |
| **DATABASE** | Room / SQLite / Local Storage Engine | `NOT STARTED / NOT CONFIRMED` | Unassigned | D4-002 | Needs cross-platform persistence audit. |
| **SYNC / BACKUP** | Delta-Sync, Outbox, Cloud Backup | `NOT STARTED / NOT CONFIRMED` | Unassigned | D4-003 | SyncEngine & ConflictResolver present. |
| **CLOUD** | Cloud Ingress, Firebase Auth/Firestore | `NOT STARTED / NOT CONFIRMED` | Unassigned | SYNC | Deferred until local sync certified. |
| **SECURITY** | Role Isolation, Space Guard, Key Safety | `AUDIT REQUIRED` | Unassigned | D1, AI-001 | Server Gemini key safe; space check needed on AI proxy. |
| **QA / TEST** | Test Runner, Complexity Benchmarks | `COMPLETE` | AI Studio | All | 1,227/1,227 tests passing, O(n) benchmarks verified. |
| **RELEASE** | Production Bundle & Distribution | `IN PROGRESS` | AI Studio | All | Build & Lint passing. Production deploy ready. |
