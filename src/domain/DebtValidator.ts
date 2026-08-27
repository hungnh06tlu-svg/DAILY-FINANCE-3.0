/**
 * Daily Finance 2.5 - DebtValidator
 * Pure business domain validator for Debt & Loan Domain (TASK 2).
 * Validates amounts, interest, schedule, due date, duplicate debt, and settlement.
 */

import { DebtItem, RepaymentFrequency } from '../types';

export class DebtValidator {
  /**
   * Validates a debt or loan model before creation or modification.
   */
  static validateDebt(item: Partial<DebtItem>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.title || item.title.trim() === '') {
      errors.push('Debt/Loan title is required');
    }

    if (!item.counterparty || item.counterparty.trim() === '') {
      errors.push('Counterparty name is required');
    }

    if (item.originalAmount === undefined || item.originalAmount <= 0) {
      errors.push('Original amount must be greater than zero');
    }

    if (item.interestRate !== undefined && item.interestRate < 0) {
      errors.push('Interest rate cannot be negative');
    }

    if (!item.dueDate || item.dueDate.trim() === '') {
      errors.push('Due date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates repayment amount.
   */
  static validateRepayment(amount: number, remainingAmount: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(amount) || amount <= 0) {
      errors.push('Repayment amount must be greater than zero');
    }

    if (remainingAmount > 0 && amount > remainingAmount + 0.01) {
      errors.push('Repayment amount exceeds remaining balance');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates settlement parameters for full or early payoff.
   */
  static validateSettlement(item: DebtItem, settlementAmount: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settlementAmount <= 0) {
      errors.push('Settlement amount must be positive');
    }

    if (item.remainingAmount <= 0) {
      errors.push('Debt is already fully paid or settled');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates schedule parameters.
   */
  static validateSchedule(
    frequency: RepaymentFrequency,
    startDate?: string,
    dueDate?: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!frequency) {
      errors.push('Repayment frequency is required');
    }

    if (startDate && dueDate && startDate > dueDate) {
      errors.push('Start date cannot be later than due date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks for duplicate debt entries.
   */
  static validateDuplicateDebt(
    existingDebts: DebtItem[],
    title: string,
    counterparty: string,
    excludeId?: string
  ): boolean {
    if (!title || !counterparty) return false;

    const cleanTitle = title.trim().toLowerCase();
    const cleanCounterparty = counterparty.trim().toLowerCase();

    return existingDebts.some((d) => {
      if (excludeId && d.id === excludeId) return false;
      return (
        d.title.trim().toLowerCase() === cleanTitle &&
        d.counterparty.trim().toLowerCase() === cleanCounterparty
      );
    });
  }
}
