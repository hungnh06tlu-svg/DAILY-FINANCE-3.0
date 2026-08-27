/**
 * Daily Finance 2.5 - AICoachValidator
 * Domain Validator for AI Coach (TASK 2).
 * Pure validation functions for Coach Profiles, Priorities, Recommendations, and Action Plans.
 */

import {
  CoachProfile,
  CoachRecommendation,
  CoachPriority,
  CoachAction,
  CoachPriorityLevel,
  CoachHealthCategory
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AICoachValidator {
  /**
   * Validates Coach Profile settings.
   */
  static validateProfile(profile: Partial<CoachProfile>): ValidationResult {
    const errors: string[] = [];

    if (profile.monthlyIncomeTarget !== undefined && profile.monthlyIncomeTarget < 0) {
      errors.push('Monthly income target cannot be negative.');
    }

    if (profile.monthlySavingsTarget !== undefined && profile.monthlySavingsTarget < 0) {
      errors.push('Monthly savings target cannot be negative.');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Priority integrity.
   */
  static validatePriority(priority: Partial<CoachPriority>): ValidationResult {
    const errors: string[] = [];

    if (!priority.title || priority.title.trim().length === 0) {
      errors.push('Priority title is required.');
    }

    if (!priority.domain) {
      errors.push('Priority domain category is required.');
    }

    if (!priority.level) {
      errors.push('Priority level is required.');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Recommendation consistency.
   */
  static validateRecommendation(rec: Partial<CoachRecommendation>): ValidationResult {
    const errors: string[] = [];

    if (!rec.title || rec.title.trim().length === 0) {
      errors.push('Recommendation title is required.');
    }

    if (!rec.type) {
      errors.push('Recommendation type is required.');
    }

    if (!rec.actionableStep || rec.actionableStep.trim().length === 0) {
      errors.push('Actionable step is required for recommendation.');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Goal and Profile consistency.
   */
  static validateGoalConsistency(
    incomeTarget?: number,
    savingsTarget?: number
  ): ValidationResult {
    const errors: string[] = [];

    if (incomeTarget !== undefined && savingsTarget !== undefined) {
      if (savingsTarget > incomeTarget && incomeTarget > 0) {
        errors.push('Monthly savings target cannot exceed monthly income target.');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates Action items.
   */
  static validateAction(action: Partial<CoachAction>): ValidationResult {
    const errors: string[] = [];

    if (!action.title || action.title.trim().length === 0) {
      errors.push('Action title is required.');
    }

    if (!action.timeframe) {
      errors.push('Action timeframe is required.');
    }

    return { isValid: errors.length === 0, errors };
  }
}
