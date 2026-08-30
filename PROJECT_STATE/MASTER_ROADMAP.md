# 🗺️ MASTER ROADMAP — DAILY FINANCE 3.0

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Comprehensive End-to-End Architectural Roadmap & Phase Delivery Tracking  
> **GOVERNING PRINCIPLE:** Clean Architecture + MVI + Deterministic Financial Truth  
> **LAST VERIFIED:** 2026-08-28  

---

## 1. ARCHITECTURAL LAYER HIERARCHY & DELIVERY SEQUENCE

The system delivery roadmap strictly follows Clean Architecture dependencies from inside-out for domain logic, and top-down for presentation shell integration:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. PRESENTATION / MVI                           │
│      G1 Navigation Shell ──► G2 UX Hierarchy ──► S5-001..S5-012        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                             2. DOMAIN                                  │
│  D1 Canonical Model ──► D2 Financial Truth ──► D3 Invariants ──► D4    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        3. AI / AI TOOLS ENGINE                         │
│   AI-001A Discovery ──► AI-001B Standardization ──► AI-001C Hardening  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           4. USE CASE LAYER                            │
│           31 Clean Architecture Transaction & Method Use Cases         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      5. REPOSITORY & PERSISTENCE                       │
│     Data Contracts ──► Offline Local DB ──► Delta Sync & Conflict Res  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      6. CLOUD, SECURITY & RELEASE                      │
│        Cloud Storage / Backup ──► Security Audit ──► Full QA Release   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MASTER PHASE MATRIX

| Phase ID | Phase Name | Status | Roadmap Progress | Dependencies | Owner | Evidence Ref | Next Planned Task |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **PHASE-01** | **Presentation Navigation (G1, G2)** | `COMPLETE & FROZEN` | `100%` | None | AI Studio | `EVD-G1-01`, `EVD-G2-01` | None (Sealed) |
| **PHASE-02** | **Presentation Views (S5-001 → S5-012)** | `COMPLETE & FROZEN` | `100%` | PHASE-01 | AI Studio | `FREEZE-CERTIFICATE.md` | None (Sealed) |
| **PHASE-03** | **D1 — Canonical Financial Model** | `COMPLETE & FROZEN` | `100%` | None | AI Studio | `EVD-D1-01` | None (Sealed) |
| **PHASE-04** | **D2 — Financial Truth & 10 Methods** | `COMPLETE & FROZEN` | `100%` | PHASE-03 | AI Studio | `EVD-D2-VER` (20/20 PASS) | None (Sealed) |
| **PHASE-05** | **D3 — Financial Invariants Engine** | `COMPLETE & FROZEN` | `100%` | PHASE-03, PHASE-04 | AI Studio | `EVD-D3-003` (134/134 PASS) | None (Sealed) |
| **PHASE-06** | **D4 — Data Contracts & Local Sync** | `COMPLETE & FROZEN` | `100%` | PHASE-03, PHASE-05 | Google AI Studio Agent | `EVD-D4-003` (15/15 PASS) | `AI-001A` (AI Architecture Audit) |
| **PHASE-07** | **AI — Architecture Discovery & Tools** | `IN PROGRESS` | `50%` | PHASE-04 | Google AI Studio Agent | `EVD-AI-001A`, `EVD-AI-001B` | `AI-002` (Coach & Intelligence Integration) |
| **PHASE-08** | **Use Case Layer Orchestration** | `NOT CONFIRMED` | `0%` | PHASE-03, PHASE-04 | Unassigned | `EVD-UC-01` (791 tests) | `UC-001` (Audit Cycle) |
| **PHASE-09** | **Repository Implementations** | `NOT STARTED` | `0%` | PHASE-06 | Unassigned | None | `REPO-001` |
| **PHASE-10** | **Offline-First Database Engine** | `NOT STARTED` | `0%` | PHASE-09 | Unassigned | None | `DB-001` |
| **PHASE-11** | **Sync, Outbox & Cloud Backup** | `NOT STARTED` | `0%` | PHASE-10 | Unassigned | None | `SYNC-001` |
| **PHASE-12** | **Security, RBAC & Cloud Storage** | `NOT STARTED` | `0%` | PHASE-11 | Unassigned | None | `SEC-001` |
| **PHASE-13** | **Comprehensive QA & Release** | `COMPLETE` | `100%` | All Phases | AI Studio | `EVD-REG-01` (1,335 tests) | Production Deployment |

---

## 3. PHASE DETAILS & SUBTASK BREAKDOWN

### PHASE-01 & PHASE-02: Presentation & Navigation Shell
- **Status:** `COMPLETE & FROZEN`
- **Scope:** 
  - **G1**: 5 bottom-bar tabs on Mobile, 7 sidebar items on Tablet/Desktop. Removed 10 methods from top navigation.
  - **G2**: 10 financial methods unified under Jars & Methods hub with quick switcher and breadcrumb navigation.
  - **S5-001..S5-012**: 12 dedicated views (Wallets, Transactions, Assets/Debts, Jars, Budgets, Savings, Investments, Voice Assistant, AI Coach, AI Chat, Reports, Automation).

### PHASE-03: D1 — Canonical Financial Model
- **Status:** `COMPLETE & FROZEN`
- **Scope:**
  - Standardized domain types: `Transaction`, `Wallet`, `Fund`, `Budget`, `Debt`, `SavingsGoal`, `InvestmentItem`.
  - Invariant guards: `SpaceIsolationGuard`, `TransactionLifecycleGuard`, `MoneyUtils`.
  - Raw amount precision preservation (zero implicit rounding).

### PHASE-04: D2 — Financial Truth Engine & 10 Methods
- **Status:** `COMPLETE & FROZEN`
- **Scope:**
  - `FinancialTruthEngine`: Authority for income, expense, balance, net worth, transfers, opening balance.
  - 10 Method Engines: Six Jars, 50/30/20, Zero-Based Budgeting, Sinking Fund, Debt Snowball/Avalanche, 52-Week Challenge, FIRE Planning (Standard, Lean, Fat, Coast, Barista), Envelope Budgeting, DCA vs Lump Sum, Emergency Fund Runway.
  - Certified by `D2-TEST-001 → D2-TEST-020` (20/20 PASS).

### PHASE-05: D3 — FINANCIAL INVARIANTS ENGINE (INV-001 → INV-015)
- **Status:** `COMPLETE & FROZEN`
- **Completed Subtasks:**
  - `D3-001`: Core Invariant Engine Structure & Execution Harness (INV-001..INV-015)
  - `D3-002`: Automated Invariant Assertion Runners, Single & Cross-Space Property Tests
  - `D3-003`: Invariant Freeze Certification & Evidence Registry (`EVD-D3-003`, 134/134 PASS)

### PHASE-06: D4 — DATA CONTRACTS & LOCAL SYNC ENGINE
- **Status:** `IMPLEMENTED / PENDING FORMAL AUDIT (READY FOR D4-001)`
- **Planned Subtasks:**
  - `D4-001`: Repository Contracts & Domain Transfer Objects Audit
  - `D4-002`: Local Storage Adapters & Soft-Delete Invariant Enforcement
  - `D4-003`: Delta Synchronization Engine, Change Log & Vector Clocks
  - `D4-004`: Conflict Resolution Strategy (Last-Write-Wins & Field Merging)

### PHASE-07: AI — Architecture Discovery & Tools Standardization
- **Status:** `NOT CONFIRMED`
- **Planned Subtasks:**
  - `AI-001A`: Discovery & Formal Verification of AI Components & Tools
  - `AI-001B`: Standardize AI Tool Interface Contracts (`AIToolContract<TInput, TOutput>`)
  - `AI-001C`: Voice Assistant Two-Phase Confirmation & Space Guarding
  - `AI-001D`: Server-Side Gemini API Proxy Payload Validation & Error Normalization

### PHASE-08: Use Case Layer Orchestration
- **Status:** `NOT CONFIRMED`
- **Scope:** Formal validation of the 31 Clean Architecture use cases connecting Domain to Repositories.

### PHASE-09 → PHASE-13: Infrastructure, Persistence & QA
- **Status:** `NOT STARTED / IN PROGRESS`
- **Scope:** SQLite/Room persistence, delta sync engine, security guards, Vitest suite regression, production compilation.
