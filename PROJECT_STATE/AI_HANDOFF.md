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
LAST_COMPLETED_TASK: "REPO-004"
LAST_COMPLETED_IMPLEMENTATION_TASK: "REPO-004 (COMPLETE & CERTIFIED)"
LAST_COMPLETED_GOVERNANCE_TASK: "REPO-004 Governance Synchronization"
CURRENT_STATUS: "CLEAN / VERIFIED (REPO-004 COMPLETE, PHASE-09 COMPLETE)"
CURRENT_POSITION: "Dashboard & Report projections data-grounded, Net Worth calculation corrected across assets & liabilities, functional backup restore & collection rehydration implemented, dynamic AI insights grounded in actual space data; Phase-09 repository layer fully hardened & certified"
CURRENT_OWNER: "Google AI Studio Agent"
TEST_RESULT: "1,442 / 1,442 PASS (100%) across 16 test suites"
REGRESSION_STATUS: "CLEAN (0 failures, 0 skipped)"
LINT_STATUS: "CLEAN (0 errors)"
BUILD_STATUS: "SUCCESS (dist/ compiled, Vite client + server.cjs)"
FILES_CHANGED: "src/data/datasource/LocalDataSource.ts, src/repositories/implementations.ts, PROJECT_STATE/EVD-REPO-004.md, PROJECT_STATE/CURRENT_TASK.md, PROJECT_STATE/TASK_REGISTRY.md, PROJECT_STATE/MASTER_STATE.md, PROJECT_STATE/MASTER_ROADMAP.md, PROJECT_STATE/EVIDENCE_INDEX.md, PROJECT_STATE/CHANGELOG.md, PROJECT_STATE/AI_HANDOFF.md"
EVIDENCE_LOCATION: "/PROJECT_STATE/EVIDENCE_INDEX.md (EVD-UC-001, EVD-REPO-001, EVD-GOV-006, EVD-GOV-006R3, EVD-REPO-002, EVD-REPO-003, EVD-REPO-004)"
BLOCKERS: "NONE (Phase-09 complete; all 9 findings F-01 through F-09 remediated; Phase-10 ready for dispatch pending governance authorization)"
PREREQUISITES_FOR_PHASE_10: "SATISFIED"
NEXT_PHASE: "PHASE-10 (DATABASE)"
NEXT_TASK: "DB-001 (Local Persistence / Room SQLite Adapter - Pending Governance Authorization)"
NEXT_SUBTASK: "DB-001"
DO_NOT_MODIFY: "FinancialTruthEngine, CanonicalFinancialModel, InvariantEngine, D1/D2/D3/D4 implementation and tests, src/usecases/* (Audited & Certified), Frozen Presentation (S5-001..S5-012, G1, G2), src/repositories/contracts.ts"
INSTRUCTIONS_FOR_NEXT_AGENT: "Phase-09 (Repository Implementations) is 100% complete with all findings F-01..F-09 certified. Do not begin Phase-10 / DB-001 without user authorization and dispatch confirmation."
```
