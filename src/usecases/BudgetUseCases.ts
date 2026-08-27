/**
 * Daily Finance 2.5 - Budget UseCases
 * Single-responsibility Use Cases for Budget management and validation.
 */

import { Budget } from '../types';
import { BudgetRepository } from '../repositories/contracts';

export class CreateBudgetUseCase {
  constructor(private budgetRepo: BudgetRepository) {}

  async execute(budget: Omit<Budget, 'id'>): Promise<Budget> {
    if (!budget.category || budget.category.trim() === '') {
      throw new Error('Budget category is required');
    }
    if (!budget.allocatedAmount || budget.allocatedAmount <= 0) {
      throw new Error('Budget allocated amount must be positive');
    }
    return this.budgetRepo.createBudget(budget);
  }
}

export class CloseBudgetUseCase {
  constructor(private budgetRepo: BudgetRepository) {}

  async execute(budgetId: string): Promise<boolean> {
    if (!budgetId || budgetId.trim() === '') {
      throw new Error('Budget ID required');
    }
    return this.budgetRepo.deleteBudget(budgetId);
  }
}

export class GetBudgetsUseCase {
  constructor(private budgetRepo: BudgetRepository) {}

  async execute(spaceId?: string): Promise<Budget[]> {
    return this.budgetRepo.getBudgets(spaceId);
  }
}
