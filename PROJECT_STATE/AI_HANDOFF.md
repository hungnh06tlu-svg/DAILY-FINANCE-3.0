# 🤝 AI HANDOFF — MULTI-AI COLLABORATION & EXECUTION PROTOCOL

> **PROJECT:** DAILY FINANCE 3.0  
> **SCOPE:** Mandatory Standard Operating Procedure for all AI Agents (AI Studio, ChatGPT, Claude, Cursor, Gemini)  
> **GOVERNING PRINCIPLE:** Shared Memory & Grounded Evidence over Independent Recollection  

---

## 1. AI STARTUP PROTOCOL (MANDATORY AT SESSION START)

Every AI entering this repository MUST sequentially execute the following read steps before writing any code or reporting any status:

```text
┌─────────────────────────────────────────────────────────────┐
│                   AI STARTUP READING LIST                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Read /PROJECT_STATE/PROJECT_TRUTH.md                     │
│    -> Understand immutable invariants & financial truth     │
│ 2. Read /PROJECT_STATE/MASTER_STATE.md                      │
│    -> Understand exact current progress & frozen modules    │
│ 3. Read /PROJECT_STATE/TASK_REGISTRY.md                     │
│    -> Identify active task, owner, and dependencies         │
│ 4. Read /PROJECT_STATE/DECISION_LOG.md                      │
│    -> Review historical architectural decisions             │
│ 5. Read /PROJECT_STATE/EVIDENCE_INDEX.md                    │
│    -> Verify proof for claimed completed tasks              │
│ 6. Read /PROJECT_STATE/AI_HANDOFF.md (this document)        │
│    -> Align with active execution constraints               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CONTEXT CHECKLIST BEFORE ACTION

Before issuing any tool call or code modification, confirm:

1. **CURRENT TASK**: What exact task ID from `TASK_REGISTRY.md` is requested?
2. **CURRENT STATUS**: Is the task `NOT STARTED` or `IN PROGRESS`?
3. **FROZEN AREAS**: Is any target file in a `COMPLETE & FROZEN` module? (If yes -> **ABORT / DO NOT TOUCH**).
4. **DEPENDENCIES**: Have prerequisite tasks completed and been certified in `MASTER_STATE.md`?
5. **ALLOWED FILES**: Are the files within the authorized scope of the task?
6. **FORBIDDEN FILES**: Are core truth engines, frozen models, or unrelated views untouched?
7. **REQUIRED TESTS**: What automated test suite verifies this work?
8. **REQUIRED EVIDENCE**: What specific assertions must be logged in `EVIDENCE_INDEX.md`?

---

## 3. AI TASK EXECUTION LIFECYCLE

```text
  [START TASK]
       │
       ▼
[Read Project State] ────► [Identify Scope & Boundaries]
                                   │
                                   ▼
                         [Audit Target Code]
                                   │
                                   ▼
                     [Implementation (If Authorized)]
                                   │
                                   ▼
                   [Run Automated Tests & Benchmarks]
                                   │
                                   ▼
               [Run Full Regression, Lint & Build Check]
                                   │
                                   ▼
                      [Compile Evidence Artifacts]
                                   │
                                   ▼
               [Generate Task Result & Update State Docs]
                                   │
                                   ▼
                       [Human / Audit Verification]
                                   │
                                   ▼
                                 [DONE]
```

---

## 4. CONCURRENT AI SAFETY & COLLABORATION RULES

- **No Premature Promotion**: An AI must NEVER mark a task `COMPLETE` or `FROZEN` based on assumptions or conversational claims. Status requires reproducible test results.
- **No Concurrent Overwrites**: If a task in `TASK_REGISTRY.md` is marked `IN PROGRESS` with another owner, do NOT modify its code or overwrite its state without an explicit handoff command.
- **Preserve Existing Evidence**: When updating `EVIDENCE_INDEX.md` or `MASTER_STATE.md`, append or refine; NEVER wipe out historical verified evidence records.
- **Fail-Safe Discrepancy Reporting**: If a conflict is discovered between code, tests, and documentation, mark the status as `RECONCILIATION REQUIRED` and report the issue immediately.

---

## 5. STRICT PROHIBITIONS

```text
❌ DO NOT invent status or declare completion without automated test output.
❌ DO NOT modify FinancialTruthEngine or CanonicalFinancialModel without unfreeze orders.
❌ DO NOT implement independent calculation logic outside FinancialTruthEngine.
❌ DO NOT use personal session memory to override PROJECT_STATE/ documents.
❌ DO NOT perform silent or unconfirmed AI writes to persistence layers.
```
