# 📋 TASK REGISTRY — GLOBAL WORKFLOW & TASK PROGRESS

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Full Hierarchical Task Breakdown, Granular Subtasks, Ownership & Progress Tracking  
> **LAST VERIFIED:** 2026-08-28  

---

## 1. PRESENTATION & NAVIGATION SHELL (PHASE-01 & PHASE-02)

| Task / Subtask ID | Parent | Phase | Task Name | Status | Progress | Owner | Dependencies | Started | Completed | Evidence Ref | Next Task |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **G1** | Root | PRESENTATION | Navigation Shell Restructuring | `COMPLETE` | `100%` | AI Studio | None | 2026-08-27 | 2026-08-27 | `EVD-G1-01` | G2 |
| ├── **G1-001** | G1 | PRESENTATION | Mobile 5-item Bottom Navigation | `COMPLETE` | `100%` | AI Studio | None | 2026-08-27 | 2026-08-27 | `EVD-G1-01` | G1-002 |
| └── **G1-002** | G1 | PRESENTATION | Tablet/Desktop 7-item Sidebar | `COMPLETE` | `100%` | AI Studio | G1-001 | 2026-08-27 | 2026-08-27 | `EVD-G1-01` | G2 |
| **G2** | Root | PRESENTATION | 10 Methods UX Integration under Jars | `COMPLETE` | `100%` | AI Studio | G1 | 2026-08-27 | 2026-08-27 | `EVD-G2-01` | S5-001 |
| ├── **G2-001** | G2 | PRESENTATION | Jars Hub Methods Placement | `COMPLETE` | `100%` | AI Studio | G1 | 2026-08-27 | 2026-08-27 | `EVD-G2-01` | G2-002 |
| └── **G2-002** | G2 | PRESENTATION | Quick Switcher & Breadcrumb Navigation | `COMPLETE` | `100%` | AI Studio | G2-001 | 2026-08-27 | 2026-08-27 | `EVD-G2-01` | S5-001 |
| **S5-001 → S5-012** | Root | PRESENTATION | 12 MVI Presentation Modules | `COMPLETE` | `100%` | AI Studio | G1, G2 | 2026-08-27 | 2026-08-28 | `FREEZE-CERT` | D1 |

---

## 2. DOMAIN & FINANCIAL TRUTH (PHASE-03 & PHASE-04)

| Task / Subtask ID | Parent | Phase | Task Name | Status | Progress | Owner | Dependencies | Started | Completed | Evidence Ref | Next Task |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **D1** | Root | DOMAIN | Canonical Financial Model Core | `COMPLETE` | `100%` | AI Studio | None | 2026-08-27 | 2026-08-27 | `EVD-D1-01` | D2-001 |
| ├── **D1-001** | D1 | DOMAIN | Standard Domain Entities & Types | `COMPLETE` | `100%` | AI Studio | None | 2026-08-27 | 2026-08-27 | `EVD-D1-01` | D1-002 |
| ├── **D1-002** | D1 | DOMAIN | Multi-Space & Multi-Fund Guards | `COMPLETE` | `100%` | AI Studio | D1-001 | 2026-08-27 | 2026-08-27 | `EVD-D1-01` | D1-003 |
| └── **D1-003** | D1 | DOMAIN | Raw Precision & MoneyUtils | `COMPLETE` | `100%` | AI Studio | D1-002 | 2026-08-27 | 2026-08-27 | `EVD-D1-01` | D2-001 |
| **D2-001** | Root | DOMAIN | Transaction Lifecycle Engine | `COMPLETE` | `100%` | AI Studio | D1 | 2026-08-27 | 2026-08-28 | `EVD-D2-01` | D2-002 |
| **D2-002** | Root | DOMAIN | Financial Truth Calculation Pipeline | `COMPLETE` | `100%` | AI Studio | D1, D2-001 | 2026-08-27 | 2026-08-28 | `EVD-D2-02` | D2-003 |
| **D2-003** | Root | DOMAIN | 10 Financial Method Engines | `COMPLETE` | `100%` | AI Studio | D1, D2-002 | 2026-08-27 | 2026-08-28 | `EVD-D2-03` | D2-VER |
| **D2-VER** | Root | DOMAIN | D2 Invariant Audit (D2-TEST-001..020) | `COMPLETE` | `100%` | AI Studio | D2-001..003 | 2026-08-28 | 2026-08-28 | `EVD-D2-VER` | D3-001 |

---

## 3. FINANCIAL INVARIANTS ENGINE (PHASE-05: D3)

| Task / Subtask ID | Parent | Phase | Task Name | Status | Progress | Owner | Dependencies | Started | Completed | Evidence Ref | Next Task |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **D3-001** | Root | DOMAIN | Invariant Engine Architecture & Rules | `COMPLETE` | `100%` | AI Studio | D1, D2 | 2026-08-28 | 2026-08-28 | `EVD-D3-001E` | D3-002 |
| ├── **D3-001A** | D3-001 | DOMAIN | Invariant Inventory & Schema Mapping | `COMPLETE` | `100%` | AI Studio | D2 | 2026-08-28 | 2026-08-28 | `EVD-D3-001A` | D3-001B |
| ├── **D3-001B** | D3-001 | DOMAIN | Conservation Invariants (INV-001..003) | `COMPLETE` | `100%` | AI Studio | D3-001A | 2026-08-28 | 2026-08-28 | `EVD-D3-001B` | D3-001C |
| ├── **D3-001C** | D3-001 | DOMAIN | Boundary Invariants (INV-004..006) | `COMPLETE` | `100%` | AI Studio | D3-001B | 2026-08-28 | 2026-08-28 | `EVD-D3-001C` | D3-001D |
| ├── **D3-001D** | D3-001 | DOMAIN | Lifecycle Invariants (INV-007..009) | `COMPLETE` | `100%` | AI Studio | D3-001C | 2026-08-28 | 2026-08-28 | `EVD-D3-001D` | D3-001E |
| └── **D3-001E** | D3-001 | DOMAIN | Space Isolation Invariants (INV-010..015) | `COMPLETE` | `100%` | AI Studio | D3-001D | 2026-08-28 | 2026-08-28 | `EVD-D3-001E` | D3-002 |
| **D3-002** | Root | DOMAIN | Invariant Test Runner & Property Tests | `COMPLETE` | `100%` | AI Studio | D3-001 | 2026-08-28 | 2026-08-28 | `EVD-D3-002C` | D3-003 |
| ├── **D3-002A** | D3-002 | DOMAIN | Invariant Execution Harness & Diagnostics | `COMPLETE` | `100%` | AI Studio | D3-001 | 2026-08-28 | 2026-08-28 | `EVD-D3-002A` | D3-002B |
| ├── **D3-002B** | D3-002 | DOMAIN | Property-Based Invariant Regression Tests | `COMPLETE` | `100%` | AI Studio | D3-002A | 2026-08-28 | 2026-08-28 | `EVD-D3-002B` | D3-002C |
| └── **D3-002C** | D3-002 | DOMAIN | Property-Based Cross-Space/Fund Isolation & Transfer Conservation Expansion | `COMPLETE` | `100%` | Google AI Studio Agent | D3-002B | 2026-08-28 | 2026-08-28 | `EVD-D3-002C` | D3-003 |
| **D3-003** | Root | DOMAIN | D3 Freeze Certification & Evidence Indexing | `COMPLETE` | `100%` | Google AI Studio Agent | D3-002 | 2026-08-28 | 2026-08-28 | `EVD-D3-003` | D4-001 |

---

## 4. DATA CONTRACTS & LOCAL SYNC (PHASE-06: D4)

| Task / Subtask ID | Parent | Phase | Task Name | Status | Progress | Owner | Dependencies | Started | Completed | Evidence Ref | Next Task |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **D4-001** | Root | DOMAIN | Repository Data Contracts & Interfaces | `NOT STARTED` | `0%` | Unassigned | D1 | — | — | Pending Audit | D4-002 |
| ├── **D4-001A** | D4-001 | DOMAIN | Transaction & Wallet Repository Contracts | `NOT STARTED` | `0%` | Unassigned | D1 | — | — | None | D4-001B |
| └── **D4-001B** | D4-001 | DOMAIN | Method & Budget Repository Contracts | `NOT STARTED` | `0%` | Unassigned | D4-001A | — | — | None | D4-002 |
| **D4-002** | Root | DOMAIN | Local Storage Adapter & Soft-Delete Invariant | `NOT STARTED` | `0%` | Unassigned | D4-001 | — | — | Pending Audit | D4-003 |
| **D4-003** | Root | DOMAIN | Delta Sync Engine & Conflict Resolution | `NOT STARTED` | `0%` | Unassigned | D4-002 | — | — | Pending Audit | AI-001A |

---

## 5. AI ENGINES & TOOLS (PHASE-07: AI)

| Task / Subtask ID | Parent | Phase | Task Name | Status | Progress | Owner | Dependencies | Started | Completed | Evidence Ref | Next Task |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **AI-001A** | Root | AI | AI Component & Tool Architecture Discovery | `NOT CONFIRMED` | `50%` | Unassigned | D2 | 2026-08-28 | — | Audit Draft | AI-001B |
| **AI-001B** | Root | AI | AI Tool Standard Contracts & Schema Hardening | `NOT STARTED` | `0%` | Unassigned | AI-001A | — | — | None | AI-001C |
| **AI-001C** | Root | AI | Voice Assistant Two-Phase Confirmation Guard | `NOT STARTED` | `0%` | Unassigned | AI-001B | — | — | None | AI-001D |
| **AI-001D** | Root | AI | Server-Side Gemini API Proxy Hardening | `NOT STARTED` | `0%` | Unassigned | AI-001B | — | — | None | UC-001 |

---

## 6. APPLICATION, INFRASTRUCTURE & QA ROADMAP

| Phase ID | Subsystem | Scope Description | Status | Progress | Owner | Dependencies | Next Task |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **PHASE-08** | **USE CASE** | 31 Clean Architecture Application Use Cases | `NOT CONFIRMED` | `50%` | Unassigned | D1, D2 | `UC-001` |
| **PHASE-09** | **REPOSITORY** | Domain Repository Implementations | `NOT STARTED` | `0%` | Unassigned | D4-001 | `REPO-001` |
| **PHASE-10** | **DATABASE** | Local Persistence / Room SQLite Adapter | `NOT STARTED` | `0%` | Unassigned | PHASE-09 | `DB-001` |
| **PHASE-11** | **SYNC** | Delta-Sync, Outbox Queue & Cloud Backup | `NOT STARTED` | `0%` | Unassigned | PHASE-10 | `SYNC-001` |
| **PHASE-12** | **SECURITY** | Role Isolation, Space Guard & Cloud Storage | `NOT STARTED` | `0%` | Unassigned | PHASE-11 | `SEC-001` |
| **PHASE-13** | **QA / RELEASE** | Vitest Regression (1,227 tests), Build & Dist | `IN PROGRESS` | `85%` | AI Studio | All | Production Ready |
