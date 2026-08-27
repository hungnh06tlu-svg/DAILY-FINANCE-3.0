/**
 * Daily Finance 2.5 - Sprint 2 Complete Unit Test Suite
 */

import { describe, it, expect } from 'vitest';
import { Sprint2TestSuite } from './sprint2_runner';

export * from './sprint2_runner';

const results = await Sprint2TestSuite.runAllTests();
const categories = Array.from(new Set(results.map((r) => r.category)));

describe('Daily Finance Complete Domain & Integration Suite', () => {
  for (const cat of categories) {
    describe(`Domain Suite / ${cat}`, () => {
      const catResults = results.filter((r) => r.category === cat);
      for (const res of catResults) {
        it(res.name, () => {
          expect(res.passed, res.message).toBe(true);
        });
      }
    });
  }
});

