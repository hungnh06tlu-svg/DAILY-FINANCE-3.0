# 📑 EVIDENCE INDEX — VERIFIED ARTIFACTS & AUDIT PROOFS

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Ground Truth Evidence Records, Test Verifications & Cross-Report Reconciliation  
> **LAST VERIFIED:** 2026-08-28  

---

## 1. EVIDENCE REGISTRY TABLE

| Evidence ID | Task ID | Claim | Evidence Type | Automated Test Result | Lint Status | Build Status | Primary Source File(s) | Status | Last Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **EVD-G1-01** | G1 | Navigation restructured (5 mobile, 7 tablet items) | UI Smoke & Spec | 10/10 PASS | Clean | Success | `App.tsx`, `NavigationShell.tsx` | `VERIFIED` | 2026-08-28 |
| **EVD-G2-01** | G2 | 10 Methods nested under Jars UI | UI Smoke & Spec | 10/10 PASS | Clean | Success | `BudgetingMethodsView.tsx` | `VERIFIED` | 2026-08-28 |
| **EVD-D1-01** | D1 | Canonical Financial Model types, guards & precision | Unit Tests | 17/17 PASS | Clean | Success | `src/tests/d1_financial_model.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D2-01** | D2-001 | Transaction lifecycle state transitions & guards | Unit & Invariant | G1-G6 PASS | Clean | Success | `src/tests/d2_runner.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D2-02** | D2-002 | Financial Truth calculation pipeline & purity | Unit & Property | 319/319 PASS | Clean | Success | `src/tests/d2_financial_truth.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D2-03** | D2-003 | 10 Financial Method Engines (FIRE, Jars, Zero-based, etc.) | Unit & Scenario | 37/37 PASS | Clean | Success | `src/tests/d2_003_methods_engine.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D2-VER** | D2-TEST | 20-Point Invariant Verification (D2-TEST-001..020) | Audit Matrix | 20/20 PASS | Clean | Success | `d2_runner.ts`, `d2_financial_truth.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-001A** | D3-001A | 15/15 Financial Invariants Inventory & Schema Mapping | Architecture Audit | 26/26 PASS | Clean | Success | `InvariantEngine.ts`, `d3_invariants.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-001B** | D3-001B | Conservation Invariants (INV-001..003) Hardening & Taxonomy | Unit & Invariants | 26/26 PASS | Clean | Success | `InvariantEngine.ts`, `d3_invariants.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-001C** | D3-001C | Boundary Invariants (INV-004..006) Hardening & Taxonomy | Unit & Invariants | 26/26 PASS | Clean | Success | `InvariantEngine.ts`, `d3_invariants.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-001D** | D3-001D | Lifecycle & Balance Invariants (INV-007..009) Hardening & Taxonomy | Unit & Invariants | 31/31 PASS | Clean | Success | `InvariantEngine.ts`, `d3_invariants.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-001E** | D3-001E | Space Isolation & Global Invariants (INV-010..015) Hardening & Taxonomy | Unit & Invariants | 35/35 PASS | Clean | Success | `InvariantEngine.ts`, `d3_invariants.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-002A** | D3-002A | Invariant Execution Harness, Property Verification & Diagnostics | Unit & Harness | 15/15 PASS | Clean | Success | `InvariantExecutionHarness.ts`, `d3_harness.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-002B** | D3-002B | Property-Based Invariant Regression Tests (INV-001..INV-015) | Property Tests | 62/62 PASS | Clean | Success | `src/tests/d3_property.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-002C** | D3-002C | Property-Based Cross-Space/Fund Isolation & Transfer Conservation Expansion | Property Tests | 22/22 PASS | Clean | Success | `src/tests/d3_cross_space_property.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D3-003** | D3-003 | PHASE-05 / D3 Financial Invariants Engine Freeze Certification | Freeze Audit | 1,335/1,335 PASS | Clean (0 err) | Success (Build OK) | `InvariantEngine.ts`, `d3_cross_space_property.test.ts` | `VERIFIED & FROZEN` | 2026-08-28 |
| **EVD-GOV-001** | GOV-001 | Governance / Repository Synchronization Audit (1,335 tests reconciled) | Governance Audit | 1,335/1,335 PASS | Clean (0 err) | Success (Build OK) | `/FREEZE-CERTIFICATE.md`, `/PROJECT_STATE/*` | `VERIFIED` | 2026-08-28 |
| **EVD-D4-001** | D4-001 | Data Contracts & Local Repository Audit (Contracts, LocalRepo, Sync, Conflict) | Contract Audit | 21/21 PASS (1,335 total) | Clean (0 err) | Success (Build OK) | `src/repositories/contracts.ts`, `src/tests/d4_sync.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D4-002** | D4-002 | Local Storage Adapters & Persistence Behavior Verification | Persistence Audit | 21/21 PASS (1,356 total) | Clean (0 err) | Success (Build OK) | `src/repositories/local/*`, `src/tests/d4_persistence.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-D4-003** | D4-003 | Sync Engine & Conflict Resolution Audit | Sync & Conflict Audit | 15/15 PASS (1,371 total) | Clean (0 err) | Success (Build OK) | `src/domain/SyncEngine.ts`, `src/domain/ConflictResolver.ts`, `src/tests/d4_sync_property.test.ts` | `VERIFIED` | 2026-08-28 |
| **EVD-AI-001A** | AI-001A | AI Architecture Discovery & Inventory (18 components, 3 endpoints, 5 engines) | Discovery Audit | 1,371/1,371 PASS | Clean (0 err) | Success (Build OK) | `server.ts`, `src/domain/AI*.ts`, `AI_ARCHITECTURE_AUDIT.md`, `EVD-AI-001A.md` | `VERIFIED` | 2026-08-30 |
| **EVD-AI-001B** | AI-001B | AI Tools & Endpoint Guardrails Final Verification Gate | Guardrail Suite | 1,396/1,396 PASS | Clean (0 err) | Success (Build OK) | `server.ts`, `src/tests/ai_guardrails.test.ts`, `EVD-AI-001B.md` | `CERTIFIED` | 2026-08-30 |
| **EVD-GOV-002** | GOV-002 | AI Phase Repository / PROJECT_STATE Synchronization Audit | Governance Audit | 1,396/1,396 PASS | Clean (0 err) | Success (Build OK) | `/PROJECT_STATE/*`, `EVD-GOV-002.md` | `SYNCHRONIZED / CLEAR` | 2026-08-30 |
| **EVD-UC-01** | USE CASE | 31 Clean Architecture Use Cases | Unit Tests | 791/791 PASS | Clean | Success | `src/tests/domain.test.ts` | `RECONCILIATION REQUIRED` | 2026-08-28 |
| **EVD-REG-01** | QA | Full Suite Regression & Complexity Benchmarks | Vitest Runner | 1,396/1,396 PASS | 0 errors | Success | All 14 Test Suites | `VERIFIED` | 2026-08-30 |

---

## 2. TEST COUNT RECONCILIATION BREAKDOWN

To eliminate confusion across different AI agents quoting different test counts in prior reports, here is the exact breakdown verified by `npx vitest run`:

| Test Suite File | Test Category | Number of Tests | Status |
| :--- | :--- | :---: | :---: |
| `src/tests/domain.test.ts` | Domain Entities, 31 Use Cases & AI Engines | **791** | `PASS` |
| `src/tests/d2_financial_truth.test.ts` | D2 Financial Truth Calculations & Invariants | **319** | `PASS` |
| `src/tests/d3_property.test.ts` | D3 Property-Based Invariant Regression Tests | **62** | `PASS` |
| `src/tests/d2_003_methods_engine.test.ts` | 10 Financial Method Domain Engines | **37** | `PASS` |
| `src/tests/d3_invariants.test.ts` | D3 Invariants Engine (INV-001..INV-015) | **35** | `PASS` |
| `src/tests/ai_guardrails.test.ts` | AI Guardrails & Financial Truth Protection (FG-01..05, T01..T11) | **25** | `PASS` |
| `src/tests/d3_cross_space_property.test.ts` | D3 Cross-Space/Fund Isolation & Transfer Conservation | **22** | `PASS` |
| `src/tests/d4_sync.test.ts` | D4 Data Contracts, Local DB & Sync | **21** | `PASS` |
| `src/tests/d4_persistence.test.ts` | D4 Local Storage Adapters & Soft-Delete Invariant | **21** | `PASS` |
| `src/tests/d1_financial_model.test.ts` | D1 Canonical Financial Model & Guards | **17** | `PASS` |
| `src/tests/d4_sync_property.test.ts` | D4 Sync Property Tests & Conflict Resolution | **15** | `PASS` |
| `src/tests/d3_harness.test.ts` | D3 Invariant Execution Harness & Diagnostics | **15** | `PASS` |
| `src/tests/d2_003_ui_smoke.test.ts` | Presentation Integration Smoke Tests | **10** | `PASS` |
| `src/tests/g5_benchmark.test.ts` | Algorithm Complexity Benchmarks ($O(n)$) | **6** | `PASS` |
| **TOTAL VITEST RUN** | **14 Test Files** | **1,396** | **100% PASS** |

### Summary of Historical Test Milestones:
- **"1,335 tests"**: The baseline achieved after D3 Freeze Certification (`EVD-D3-003`, 11 test files).
- **"1,356 tests"**: Baseline after D4-002 local persistence suite was added (+21 tests in `d4_persistence.test.ts`).
- **"1,371 tests"**: Baseline after D4-003 sync property suite was added (+15 tests in `d4_sync_property.test.ts`, 13 test files).
- **"1,385 tests"**: Intermediate baseline during AI-001B implementation.
- **"1,396 tests"**: Current canonical executable test baseline following AI-001B Final Verification Gate (+25 tests in `ai_guardrails.test.ts`, 14 test files).

---

## 3. SPECIAL AUDIT EVIDENCE: D2 FINAL VERIFICATION (20/20)

| Test ID | Verified Invariant / Criterion | Specific Assertion Proof |
| :--- | :--- | :--- |
| **D2-TEST-001** | Income Calculation | `d2_runner.ts:1738` (`invInc === 10_000_000`), `d2_runner.ts:1823` |
| **D2-TEST-002** | Expense Calculation | `d2_runner.ts:1739` (`invExp === 3_000_000`), `d2_runner.ts:1824` |
| **D2-TEST-003** | Transfer Neutrality | `d2_runner.ts:1828` (`15k === 15k`), `d2_runner.ts:1835-1836` |
| **D2-TEST-004** | Balance Calculation | `d2_runner.ts:193` (`bal === 36M`), `d2_runner.ts:1740-1742` |
| **D2-TEST-005** | Soft-Delete Exclusion | `d2_runner.ts:76-79` (5M instead of 11M), `d2_runner.ts:1908` |
| **D2-TEST-006** | Draft Exclusion | `d2_runner.ts:92` (`exp === 500k`), `d2_runner.ts:271` |
| **D2-TEST-007** | Space Isolation | `d2_runner.ts:1750-1752` (sp_alpha 8M, sp_beta 12M, sp_gamma 5M) |
| **D2-TEST-008** | Net Worth Calculation | `d2_runner.ts:159`, `d2_runner.ts:214`, `d2_runner.ts:254` |
| **D2-TEST-009** | Debt Handling | `d2_runner.ts:1814-1824`, `d2_003_ui_smoke.test.ts:107` |
| **D2-TEST-010** | Saving Handling | `d2_runner.ts:1812-1824`, `d2_003_ui_smoke.test.ts:133` |
| **D2-TEST-011** | Investment Handling | `d2_runner.ts:242-243` (Negative ROI -60%), `d2_003_ui_smoke:168` |
| **D2-TEST-012** | Budget Handling | `d2_runner.ts:270-271` (`used: 500k`, `remaining: 1.5M`) |
| **D2-TEST-013** | FIRE Calculation | `d2_003_ui_smoke.test.ts:52-70`, `d2_003_methods_engine.test.ts` |
| **D2-TEST-014** | Money Precision | `d2_runner.ts:1768` (`100.456` unrounded), `d2_runner.ts:2006-2008` |
| **D2-TEST-015** | Deterministic Output | `d2_runner.ts:159` (`run1 === run2 === run3`), `d2_runner.ts:1969` |
| **D2-TEST-016** | Empty Dataset | `d2_runner.ts:2000-2002` (Returns safe deterministic 0) |
| **D2-TEST-017** | Duplicate Protection | `d2_runner.ts:1903`, `d2_runner.ts:1933` (Idempotent transitions) |
| **D2-TEST-018** | Opening Balance | `d2_runner.ts:190` (Opening balance excluded from 20M income) |
| **D2-TEST-019** | Adjustment Handling | `d2_runner.ts:1817-1824` (Adjustment modifies balance, not income) |
| **D2-TEST-020** | Full Regression | `npx vitest run`: **1,227 / 1,227 PASSED** (0 failures, 0 skipped) |
