/**
 * Daily Finance 3.0 — D2-003: AdvancedFireEngine
 * Safe domain extension for Lean, Regular, Fat, Coast, and Barista FIRE methodologies.
 * Mathematical precision with zero side-effects.
 */

import {
  FireVariantResult,
  CoastFireResult,
  BaristaFireResult,
  AdvancedFireProfileInput,
  AdvancedFireComprehensiveReport
} from './types';

export class AdvancedFireEngine {
  /**
   * Calculates Lean FIRE target (essential survival lifestyle).
   * Typically 70% of standard living expenses.
   */
  static calculateLeanFire(
    monthlyExpense: number,
    safeWithdrawalRate: number = 4.0,
    leanMultiplier: number = 0.70
  ): FireVariantResult {
    const swr = Math.max(0.1, safeWithdrawalRate);
    const leanExpenses = Math.max(0, monthlyExpense) * leanMultiplier;
    const targetNetWorth = Math.round((leanExpenses * 12) / (swr / 100));

    return {
      variant: 'lean_fire',
      nameVi: 'Lean FIRE (Tối giản)',
      nameEn: 'Lean FIRE',
      targetNetWorth,
      monthlyExpensesAssumed: Math.round(leanExpenses),
      monthlyPassiveIncomeTarget: Math.round(leanExpenses),
      safeWithdrawalRate: swr,
      multiplier: leanMultiplier,
      progressPercent: 0,
      isAchieved: false
    };
  }

  /**
   * Calculates Regular FIRE target (current baseline lifestyle).
   */
  static calculateRegularFire(
    monthlyExpense: number,
    safeWithdrawalRate: number = 4.0
  ): FireVariantResult {
    const swr = Math.max(0.1, safeWithdrawalRate);
    const regularExpenses = Math.max(0, monthlyExpense);
    const targetNetWorth = Math.round((regularExpenses * 12) / (swr / 100));

    return {
      variant: 'regular_fire',
      nameVi: 'Regular FIRE (Tiêu chuẩn)',
      nameEn: 'Regular FIRE',
      targetNetWorth,
      monthlyExpensesAssumed: Math.round(regularExpenses),
      monthlyPassiveIncomeTarget: Math.round(regularExpenses),
      safeWithdrawalRate: swr,
      multiplier: 1.0,
      progressPercent: 0,
      isAchieved: false
    };
  }

  /**
   * Calculates Fat FIRE target (luxury / abundant retirement lifestyle).
   * Typically 140-150% of standard living expenses.
   */
  static calculateFatFire(
    monthlyExpense: number,
    safeWithdrawalRate: number = 4.0,
    fatMultiplier: number = 1.50
  ): FireVariantResult {
    const swr = Math.max(0.1, safeWithdrawalRate);
    const fatExpenses = Math.max(0, monthlyExpense) * fatMultiplier;
    const targetNetWorth = Math.round((fatExpenses * 12) / (swr / 100));

    return {
      variant: 'fat_fire',
      nameVi: 'Fat FIRE (Thịnh vượng / Thư thái)',
      nameEn: 'Fat FIRE',
      targetNetWorth,
      monthlyExpensesAssumed: Math.round(fatExpenses),
      monthlyPassiveIncomeTarget: Math.round(fatExpenses),
      safeWithdrawalRate: swr,
      multiplier: fatMultiplier,
      progressPercent: 0,
      isAchieved: false
    };
  }

  /**
   * Calculates Coast FIRE (Invested principal today that compounds to traditional FIRE without future contributions).
   * Formula: Required Today = Target FIRE / (1 + r)^years
   */
  static calculateCoastFire(
    currentAge: number,
    retirementAge: number,
    monthlyExpense: number,
    currentInvestments: number,
    annualReturnRate: number = 8.0,
    safeWithdrawalRate: number = 4.0
  ): CoastFireResult {
    const swr = Math.max(0.1, safeWithdrawalRate);
    const r = Math.max(0.1, annualReturnRate) / 100;
    const yearsToCompound = Math.max(0, retirementAge - currentAge);

    const fullFireTarget = Math.round((Math.max(0, monthlyExpense) * 12) / (swr / 100));
    const compoundFactor = Math.pow(1 + r, yearsToCompound);
    const requiredInvestedToday = compoundFactor > 0
      ? Math.round(fullFireTarget / compoundFactor)
      : fullFireTarget;

    const validCurrent = Math.max(0, currentInvestments);
    const hasCoasted = validCurrent >= requiredInvestedToday;
    const surplusDeficit = validCurrent - requiredInvestedToday;
    const progressPercent = requiredInvestedToday > 0
      ? Math.min(100, Math.round((validCurrent / requiredInvestedToday) * 100))
      : 100;

    return {
      variant: 'coast_fire',
      nameVi: 'Coast FIRE (An tâm tích lũy)',
      nameEn: 'Coast FIRE',
      targetNetWorth: fullFireTarget,
      monthlyExpensesAssumed: Math.round(monthlyExpense),
      monthlyPassiveIncomeTarget: Math.round(monthlyExpense),
      safeWithdrawalRate: swr,
      multiplier: 1.0,
      currentAge,
      retirementAge,
      yearsToCompound,
      assumedAnnualReturn: annualReturnRate,
      requiredInvestedToday,
      currentInvestments: validCurrent,
      hasCoasted,
      surplusDeficit,
      progressPercent,
      isAchieved: hasCoasted
    };
  }

  /**
   * Calculates Barista FIRE (Portfolio covers gap while low-stress part-time work covers remainder).
   * Formula: Target = (Total Monthly Expense - Part Time Monthly Income) * 12 / SWR
   */
  static calculateBaristaFire(
    totalMonthlyExpense: number,
    partTimeMonthlyIncome: number,
    safeWithdrawalRate: number = 4.0
  ): BaristaFireResult {
    const swr = Math.max(0.1, safeWithdrawalRate);
    const gapCovered = Math.max(0, totalMonthlyExpense - partTimeMonthlyIncome);
    const targetNetWorth = Math.round((gapCovered * 12) / (swr / 100));

    return {
      variant: 'barista_fire',
      nameVi: 'Barista FIRE (Linh hoạt bán thời gian)',
      nameEn: 'Barista FIRE',
      targetNetWorth,
      monthlyExpensesAssumed: Math.round(totalMonthlyExpense),
      monthlyPassiveIncomeTarget: Math.round(gapCovered),
      safeWithdrawalRate: swr,
      multiplier: totalMonthlyExpense > 0 ? gapCovered / totalMonthlyExpense : 0,
      partTimeMonthlyIncome: Math.max(0, partTimeMonthlyIncome),
      gapCoveredByPortfolioMonthly: Math.round(gapCovered),
      fullTimeMonthlyExpense: Math.round(totalMonthlyExpense),
      progressPercent: 0,
      isAchieved: false
    };
  }

  /**
   * Generates a comprehensive comparison report across all 5 FIRE archetypes.
   */
  static generateComprehensiveFireReport(input: AdvancedFireProfileInput): AdvancedFireComprehensiveReport {
    const swr = input.safeWithdrawalRate || 4.0;
    const exp = input.monthlyExpenses;
    const r = input.expectedAnnualReturn || 8.0;
    const curNetWorth = Math.max(0, input.currentNetWorth);

    const lean = this.calculateLeanFire(exp, swr, input.leanMultiplier || 0.70);
    lean.progressPercent = lean.targetNetWorth > 0 ? Math.min(100, Math.round((curNetWorth / lean.targetNetWorth) * 100)) : 100;
    lean.isAchieved = curNetWorth >= lean.targetNetWorth;

    const regular = this.calculateRegularFire(exp, swr);
    regular.progressPercent = regular.targetNetWorth > 0 ? Math.min(100, Math.round((curNetWorth / regular.targetNetWorth) * 100)) : 100;
    regular.isAchieved = curNetWorth >= regular.targetNetWorth;

    const fat = this.calculateFatFire(exp, swr, input.fatMultiplier || 1.50);
    fat.progressPercent = fat.targetNetWorth > 0 ? Math.min(100, Math.round((curNetWorth / fat.targetNetWorth) * 100)) : 100;
    fat.isAchieved = curNetWorth >= fat.targetNetWorth;

    const coast = this.calculateCoastFire(
      input.currentAge,
      input.targetRetirementAge,
      exp,
      curNetWorth,
      r,
      swr
    );

    const barista = this.calculateBaristaFire(
      exp,
      input.partTimeBaristaIncome || exp * 0.40,
      swr
    );
    barista.progressPercent = barista.targetNetWorth > 0 ? Math.min(100, Math.round((curNetWorth / barista.targetNetWorth) * 100)) : 100;
    barista.isAchieved = curNetWorth >= barista.targetNetWorth;

    return {
      leanFire: lean,
      regularFire: regular,
      fatFire: fat,
      coastFire: coast,
      baristaFire: barista,
      summary: {
        currentNetWorth: curNetWorth,
        baselineMonthlyExpenses: exp,
        safeWithdrawalRate: swr,
        expectedAnnualReturn: r,
        fastestFireType: barista.targetNetWorth < lean.targetNetWorth ? 'Barista FIRE' : 'Lean FIRE',
        yearsToFastestFire: Math.max(0, input.targetRetirementAge - input.currentAge)
      }
    };
  }
}
