/**
 * Daily Finance 2.5 - FIREValidator
 * Domain Validator for FIRE Planner (TASK 2).
 * Pure functions to validate FIRE parameters, scenarios, and user profiles.
 */

import { FireProfile, FireType, FireScenarioType } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FIREValidator {
  /**
   * Validates Safe Withdrawal Rate (SWR).
   * Standard SWR is between 1% and 10% (typically 3% - 5%).
   */
  static validateSafeWithdrawalRate(swr: number): ValidationResult {
    const errors: string[] = [];
    if (swr === undefined || swr === null || isNaN(swr)) {
      errors.push('Safe Withdrawal Rate is required.');
    } else if (swr <= 0 || swr > 10) {
      errors.push('Safe Withdrawal Rate must be greater than 0% and no more than 10%.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Monthly Expenses.
   * Monthly expenses must be strictly positive.
   */
  static validateMonthlyExpenses(expenses: number): ValidationResult {
    const errors: string[] = [];
    if (expenses === undefined || expenses === null || isNaN(expenses)) {
      errors.push('Monthly expenses amount is required.');
    } else if (expenses <= 0) {
      errors.push('Monthly expenses must be greater than 0.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Target Assets or Net Worth.
   * Target assets must be non-negative.
   */
  static validateTargetAssets(targetAssets: number): ValidationResult {
    const errors: string[] = [];
    if (targetAssets === undefined || targetAssets === null || isNaN(targetAssets)) {
      errors.push('Target assets amount is required.');
    } else if (targetAssets < 0) {
      errors.push('Target assets cannot be negative.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Passive Income.
   * Passive income must be non-negative.
   */
  static validatePassiveIncome(passiveIncome: number): ValidationResult {
    const errors: string[] = [];
    if (passiveIncome === undefined || passiveIncome === null || isNaN(passiveIncome)) {
      errors.push('Passive income amount is required.');
    } else if (passiveIncome < 0) {
      errors.push('Passive income cannot be negative.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Savings Rate (0% to 100%).
   */
  static validateSavingsRate(rate: number): ValidationResult {
    const errors: string[] = [];
    if (rate === undefined || rate === null || isNaN(rate)) {
      errors.push('Savings rate is required.');
    } else if (rate < 0 || rate > 100) {
      errors.push('Savings rate must be between 0% and 100%.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Retirement Age relative to Current Age.
   */
  static validateRetirementAge(currentAge: number, targetRetirementAge: number): ValidationResult {
    const errors: string[] = [];
    if (currentAge < 18 || currentAge > 100) {
      errors.push('Current age must be between 18 and 100.');
    }
    if (targetRetirementAge < 18 || targetRetirementAge > 100) {
      errors.push('Target retirement age must be between 18 and 100.');
    }
    if (targetRetirementAge <= currentAge) {
      errors.push('Target retirement age must be strictly greater than current age.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Projection Period (1 to 60 years).
   */
  static validateProjectionPeriod(years: number): ValidationResult {
    const errors: string[] = [];
    if (years === undefined || years === null || isNaN(years) || years < 1 || years > 60) {
      errors.push('Projection period must be between 1 and 60 years.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Scenario Consistency.
   */
  static validateScenario(
    annualReturnRate: number,
    monthlySavings: number,
    monthlyExpenses: number
  ): ValidationResult {
    const errors: string[] = [];
    if (annualReturnRate < -10 || annualReturnRate > 30) {
      errors.push('Annual return rate must be between -10% and 30%.');
    }
    if (monthlySavings < 0) {
      errors.push('Monthly savings cannot be negative.');
    }
    if (monthlyExpenses <= 0) {
      errors.push('Monthly expenses must be greater than 0.');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates full FIRE Profile model.
   */
  static validateProfile(profile: Partial<FireProfile>): ValidationResult {
    const errors: string[] = [];

    if (profile.currentAge !== undefined && profile.targetRetirementAge !== undefined) {
      const ageVal = this.validateRetirementAge(profile.currentAge, profile.targetRetirementAge);
      errors.push(...ageVal.errors);
    }

    if (profile.monthlyExpenses !== undefined) {
      const expVal = this.validateMonthlyExpenses(profile.monthlyExpenses);
      errors.push(...expVal.errors);
    }

    if (profile.safeWithdrawalRate !== undefined) {
      const swrVal = this.validateSafeWithdrawalRate(profile.safeWithdrawalRate);
      errors.push(...swrVal.errors);
    }

    if (profile.expectedAnnualReturn !== undefined) {
      if (profile.expectedAnnualReturn < -10 || profile.expectedAnnualReturn > 30) {
        errors.push('Expected annual return rate must be between -10% and 30%.');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
