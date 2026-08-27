/**
 * Daily Finance 2.5 - SixJarsValidator
 * Pure business domain validator for Six Jars Domain (TASK 2).
 * Validates allocation percentage, duplicate jar, transfer, contribution, target, custom ratio, and total allocation = 100%.
 */

import { Jar } from '../types';

export class SixJarsValidator {
  /**
   * Validates a single jar allocation percentage (0 to 100).
   */
  static validateAllocationPercentage(percent: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(percent) || percent < 0) {
      errors.push('Percentage cannot be negative');
    } else if (percent > 100) {
      errors.push('Percentage cannot exceed 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates if the total allocation percentage across all active jars equals 100%.
   */
  static validateTotalAllocation(jars: Jar[]): {
    isValid: boolean;
    totalPercent: number;
    errors: string[];
  } {
    const errors: string[] = [];
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false && j.status !== 'archived');
    const totalPercent = activeJars.reduce((sum, j) => sum + (Number(j.percent) || 0), 0);

    if (Math.abs(totalPercent - 100) > 0.01) {
      errors.push(`Total jar allocation percentage must equal 100%. Current total: ${totalPercent}%`);
    }

    return {
      isValid: errors.length === 0,
      totalPercent,
      errors
    };
  }

  /**
   * Validates a jar model before creation or modification.
   */
  static validateJarModel(jar: Partial<Jar>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jar.nameVi || jar.nameVi.trim() === '') {
      errors.push('Jar Vietnamese name is required');
    }

    if (!jar.key || jar.key.trim() === '') {
      errors.push('Jar key is required');
    }

    if (jar.percent !== undefined) {
      const percentValidation = this.validateAllocationPercentage(jar.percent);
      if (!percentValidation.isValid) {
        errors.push(...percentValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks for duplicate jar entries by key or Vietnamese/English name.
   */
  static validateDuplicateJar(
    existingJars: Jar[],
    name: string,
    key?: string,
    excludeId?: string
  ): boolean {
    if (!name) return false;

    const cleanName = name.trim().toLowerCase();
    const cleanKey = key ? key.trim().toUpperCase() : '';

    return existingJars.some((j) => {
      if (excludeId && j.id === excludeId) return false;
      if (j.isSoftDeleted) return false;

      const nameViMatch = j.nameVi.trim().toLowerCase() === cleanName;
      const nameEnMatch = j.nameEn ? j.nameEn.trim().toLowerCase() === cleanName : false;
      const keyMatch = cleanKey ? j.key.trim().toUpperCase() === cleanKey : false;

      return nameViMatch || nameEnMatch || keyMatch;
    });
  }

  /**
   * Validates transfer parameters between two jars.
   */
  static validateTransfer(
    fromJar: Jar,
    toJar: Jar,
    amount: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(amount) || amount <= 0) {
      errors.push('Transfer amount must be greater than zero');
    }

    if (fromJar.id === toJar.id) {
      errors.push('Cannot transfer funds to the same jar');
    }

    if ((fromJar.currentBalance || 0) < amount) {
      errors.push(`Insufficient funds in source jar '${fromJar.nameVi}'. Current balance: ${fromJar.currentBalance}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates contribution amount to a jar.
   */
  static validateContribution(jar: Jar, amount: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(amount) || amount <= 0) {
      errors.push('Contribution amount must be greater than zero');
    }

    if (jar.isSoftDeleted || jar.status === 'archived') {
      errors.push('Cannot contribute to an archived or deleted jar');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates target parameters.
   */
  static validateTarget(targetAmount: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(targetAmount) || targetAmount <= 0) {
      errors.push('Target amount must be greater than zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
