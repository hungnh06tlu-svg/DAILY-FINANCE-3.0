/**
 * Daily Finance 3.0 — D1 Core Financial Model Standardization Test Suite
 */

import { describe, it, expect } from 'vitest';
import { D1TestSuite } from './d1_runner';

export * from './d1_runner';

describe('D1 Core Financial Model Standardization', () => {
  const results = D1TestSuite.runAllTests();
  const categories = Array.from(new Set(results.map((r) => r.category)));

  for (const cat of categories) {
    describe(`D1 / ${cat}`, () => {
      const catResults = results.filter((r) => r.category === cat);
      for (const res of catResults) {
        it(res.name, () => {
          expect(res.passed, res.message).toBe(true);
        });
      }
    });
  }
});

