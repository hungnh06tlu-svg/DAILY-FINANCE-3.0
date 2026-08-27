/**
 * Daily Finance 3.0 — D2-003: RuleOf72Engine
 * Safe domain extension for Rule of 72, Rule of 114, Rule of 144 and compound doubling estimations.
 */

import {
  RuleOf72Result,
  InflationHalvingResult,
  DoublingMilestone
} from './types';

export class RuleOf72Engine {
  /**
   * Calculates doubling time for a given annual interest rate (e.g. 8 for 8%).
   * Rule of 72: Years ≈ 72 / rate
   * Exact: Years = ln(2) / ln(1 + rate/100)
   */
  static calculateDoublingTime(annualInterestRate: number): RuleOf72Result {
    const rate = Math.max(0.01, annualInterestRate);

    const yearsToDoubleApproximation = Number((72 / rate).toFixed(2));
    const yearsToDoubleExact = Number((Math.log(2) / Math.log(1 + rate / 100)).toFixed(2));
    const approximationErrorYears = Number(Math.abs(yearsToDoubleApproximation - yearsToDoubleExact).toFixed(2));

    const yearsToTripleApproximation = Number((114 / rate).toFixed(2));
    const yearsToQuadrupleApproximation = Number((144 / rate).toFixed(2));

    return {
      annualInterestRate: rate,
      yearsToDoubleApproximation,
      yearsToDoubleExact,
      approximationErrorYears,
      yearsToTripleApproximation,
      yearsToQuadrupleApproximation
    };
  }

  /**
   * Calculates the number of years until purchasing power is halved by inflation.
   * Years ≈ 72 / inflationRate
   */
  static calculateInflationHalving(inflationRate: number): InflationHalvingResult {
    const rate = Math.max(0.01, inflationRate);
    const yearsToHalve = Number((72 / rate).toFixed(2));
    // Purchasing power left after 20 years: (1 / (1 + rate/100)^20)
    const factor20 = Number((1 / Math.pow(1 + rate / 100, 20)).toFixed(4));

    return {
      inflationRate: rate,
      yearsToHalvePurchasingPower: yearsToHalve,
      halvingFactor20Years: factor20
    };
  }

  /**
   * Generates step-by-step doubling milestones for a principal amount.
   */
  static generateDoublingMilestones(
    principal: number,
    annualInterestRate: number,
    maxDoublings: number = 5,
    startYear: number = new Date().getFullYear()
  ): DoublingMilestone[] {
    const validPrincipal = Math.max(0, principal);
    const doublingTime = this.calculateDoublingTime(annualInterestRate).yearsToDoubleApproximation;
    const milestones: DoublingMilestone[] = [];

    let currentVal = validPrincipal;
    for (let step = 1; step <= maxDoublings; step++) {
      currentVal *= 2;
      const yearsFromStart = Math.round(step * doublingTime);
      milestones.push({
        step,
        milestoneName: `Nhân đôi lần ${step} (${Math.pow(2, step)}x)`,
        projectedYear: startYear + yearsFromStart,
        value: Math.round(currentVal),
        doublingCount: step
      });
    }

    return milestones;
  }
}
