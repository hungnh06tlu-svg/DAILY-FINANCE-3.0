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
LAST_COMPLETED_TASK: "GOV-001"
LAST_COMPLETED_SUBTASK: "GOV-001"
CURRENT_STATUS: "GOV-001 SYNCHRONIZED / CLEAR"
CURRENT_OWNER: "Google AI Studio Agent"
TEST_RESULT: "1,335 / 1,335 PASS (100%) across 11 test suites"
REGRESSION_STATUS: "CLEAN (0 failures, 0 skipped)"
LINT_STATUS: "CLEAN (0 errors)"
BUILD_STATUS: "SUCCESS (dist/ compiled)"
FILES_CHANGED: "1 FREEZE-CERTIFICATE file, 5 PROJECT_STATE files"
EVIDENCE_LOCATION: "/PROJECT_STATE/EVIDENCE_INDEX.md (EVD-GOV-001)"
BLOCKERS: "NONE"
NEXT_PHASE: "PHASE-06 (D4 — REPOSITORIES, DATA CONTRACTS & SYNC)"
NEXT_TASK: "D4-001 (Data Contracts & Local Repository Audit)"
NEXT_SUBTASK: "D4-001"
DO_NOT_MODIFY: "FinancialTruthEngine, CanonicalFinancialModel, InvariantEngine, Presentation Views, D2/D3 Test Suites"
```
