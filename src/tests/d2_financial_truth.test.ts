/**
 * Daily Finance 3.0 - D2 Financial Truth & Invariants Test Suite
 * Validates all 12 Canonical Financial Invariants and Domain Calculation Robustness.
 */

import { describe, it, expect } from 'vitest';
import { runD2FinancialTruthTests } from './d2_runner';

export * from './d2_runner';

const results = await runD2FinancialTruthTests();

function getMilestoneGroup(name: string): string {
  if (name.includes('INV-') || name.includes('EDGE:')) return 'D2-001A: Invariants & Authority';
  if (name.includes('D2-001B')) return 'D2-001B: Lifecycle & Truth Audit';
  if (name.includes('D2-002A')) return 'D2-002A: Normalization & Aliases';
  if (name.includes('D2-002B')) return 'D2-002B: Lifecycle Transitions';
  if (name.includes('D2-002C')) return 'D2-002C: Advanced Domain Validation';
  if (name.includes('D2-002D')) return 'D2-002D: Calculation Execution';
  if (name.includes('D2-002E')) return 'D2-002E: Pipeline & Failure Safety';
  if (name.includes('D2-002F')) return 'D2-002F: Compatibility Migration';
  if (name.includes('D2-002G-G4') || name.includes('G4-')) return 'D2-002G: G4 Regression Hardening';
  if (name.includes('D2-002G') || name.includes('G3-')) return 'D2-002G: G3 Edge Case & Fault Injection';
  return 'D2: Financial Truth Core';
}

const groups = Array.from(new Set(results.map((r) => getMilestoneGroup(r.name))));

describe('D2 Financial Truth & Invariants Test Suite', () => {
  for (const grp of groups) {
    describe(grp, () => {
      const groupResults = results.filter((r) => getMilestoneGroup(r.name) === grp);
      for (const res of groupResults) {
        it(res.name, () => {
          expect(res.passed, res.message).toBe(true);
        });
      }
    });
  }
});

