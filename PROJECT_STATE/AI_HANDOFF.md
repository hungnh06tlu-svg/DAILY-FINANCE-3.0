# 🤝 AI HANDOFF — MULTI-AI COLLABORATION & EXECUTION PROTOCOL v2

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Mandatory Standard Operating Procedure for all AI Agents (AI Studio, ChatGPT, Claude, Cursor, Gemini)  
> **GOVERNING PRINCIPLE:** Shared Memory & Grounded Evidence over Independent Recollection  

---

## 1. MANDATORY 10-STEP STARTUP PROTOCOL

Before writing code, changing state, or reporting status, EVERY AI agent MUST read these 10 documents in order:

```text
┌─────────────────────────────────────────────────────────────┐
│             10-STEP MANDATORY AI STARTUP SEQUENCE           │
├─────────────────────────────────────────────────────────────┤
│ 1. Read /PROJECT_STATE/PROJECT_TRUTH.md                     │
│    -> Understand immutable invariants & financial authority │
│ 2. Read /PROJECT_STATE/MASTER_STATE.md                      │
│    -> Understand current global progress & frozen modules   │
│ 3. Read /PROJECT_STATE/MASTER_ROADMAP.md                    │
│    -> Review the end-to-end multi-phase architecture roadmap│
│ 4. Read /PROJECT_STATE/TASK_REGISTRY.md                     │
│    -> Identify active task hierarchy, subtasks & ownership  │
│ 5. Read /PROJECT_STATE/CURRENT_TASK.md                      │
│    -> Inspect active workspace, allowed/forbidden files     │
│ 6. Read /PROJECT_STATE/DECISION_LOG.md                      │
│    -> Review historical architectural decisions (DEC-001+)  │
│ 7. Read /PROJECT_STATE/EVIDENCE_INDEX.md                    │
│    -> Check test proofs, lint & build verification data     │
│ 8. Read /PROJECT_STATE/D2_FROZEN_VERIFICATION.md            │
│    -> Review the 20-point Financial Truth proof contract    │
│ 9. Read /PROJECT_STATE/CHANGELOG.md                         │
│    -> Review latest state mutations and handoff logs        │
│ 10. Read /PROJECT_STATE/AI_HANDOFF.md (this document)       │
│    -> Follow execution rules & final handoff formatting     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CONCURRENT AI SAFETY & COLLABORATION RULES

1. **NO INDEPENDENT MEMORY OVERRIDE**: Never rely on isolated session memory to claim status. `PROJECT_STATE/` is the single source of truth.
2. **NO ASSUMPTION OF COMPLETION**: A task is never `COMPLETE` without reproducible test results recorded in `EVIDENCE_INDEX.md`.
3. **NO UNAUTHORIZED TAKEOVER**: If a task is `IN PROGRESS` with another owner, do not modify files without an explicit handoff logged in `CHANGELOG.md`.
4. **NO TAMPERING WITH FROZEN MODULES**:
   - `FinancialTruthEngine.ts` is **FROZEN**.
   - `CanonicalFinancialModel.ts` is **FROZEN**.
   - Presentation (S5-001..S5-012, G1, G2) is **FROZEN**.
   - D2 Test Matrix (D2-TEST-001..020) is **FROZEN**.
5. **UPDATE AFTER EVERY SUBTASK**: Update `CURRENT_TASK.md`, `TASK_REGISTRY.md`, and `EVIDENCE_INDEX.md` immediately upon completing each subtask.

---

## 3. MANDATORY END-OF-SESSION HANDOFF BLOCK

When ending your session or completing a task, you MUST format your final handoff as follows:

```yaml
LAST_COMPLETED_TASK: "DB-001R / GOV-DB-001R-STATE-SYNC"
LAST_COMPLETED_IMPLEMENTATION_TASK: "DB-001R (COMPLETE & CERTIFIED)"
LAST_COMPLETED_GOVERNANCE_TASK: "GOV-DB-001R-STATE-SYNC (Complete & Synchronized)"
CURRENT_STATUS: "CLEAN / RECONCILED (DB-001R COMPLETE, PHASE-10 COMPLETE, REMOTE MAIN 4702c7d VERIFIED)"
CURRENT_POSITION: "Dual persistence adapter (Node SQLite / Strategy B Browser Relational) verified; corruption quarantine, quota handling, startup hydration, and space isolation hardened; authoritative remote hygiene reconciled on main (Commit 4702c7d); governance state synchronized"
CURRENT_OWNER: "Google AI Studio Agent"
TEST_RESULT: "1,456 / 1,456 PASS (100%) across 17 test suites (14/14 db_persistence.test.ts)"
REGRESSION_STATUS: "CLEAN (0 failures, 0 skipped)"
LINT_STATUS: "CLEAN (0 errors)"
BUILD_STATUS: "SUCCESS (dist/ compiled, Vite client + server.cjs)"
FILES_CHANGED: "PROJECT_STATE/EVD-DB-001R.md, PROJECT_STATE/CURRENT_TASK.md, PROJECT_STATE/TASK_REGISTRY.md, PROJECT_STATE/MASTER_STATE.md, PROJECT_STATE/MASTER_ROADMAP.md, PROJECT_STATE/EVIDENCE_INDEX.md, PROJECT_STATE/CHANGELOG.md, PROJECT_STATE/AI_HANDOFF.md"
EVIDENCE_LOCATION: "/PROJECT_STATE/EVIDENCE_INDEX.md (EVD-DB-001, EVD-DB-001R, commit 4702c7d)"
BLOCKERS: "NONE (Phase-10 complete & certified; SYNC-001 awaiting explicit user authorization)"
PREREQUISITES_FOR_PHASE_11: "SATISFIED"
NEXT_PHASE: "PHASE-11 (SYNC)"
NEXT_TASK: "SYNC-001 (Delta-Sync, Outbox Queue & Cloud Backup — AWAITING USER AUTHORIZATION)"
NEXT_SUBTASK: "SYNC-001"
DO_NOT_MODIFY: "FinancialTruthEngine, CanonicalFinancialModel, InvariantEngine, D1/D2/D3/D4 implementation and tests, src/usecases/* (Audited & Certified), Frozen Presentation (S5-001..S5-012, G1, G2), src/repositories/contracts.ts"
INSTRUCTIONS_FOR_NEXT_AGENT: "Phase-10 (Offline-First Database Engine) is 100% complete and verified on remote main (commit 4702c7d). DO NOT start Phase-11 / SYNC-001 without explicit user authorization."
```
