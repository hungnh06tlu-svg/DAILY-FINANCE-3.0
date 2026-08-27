/**
 * Daily Finance 2.5 - Savings UseCases
 * Single-responsibility Use Cases for Savings management and domain logic.
 */

import { SavingsGoal, SavingsProgress, SavingsForecast, SavingsContribution } from '../types';
import { SavingRepository } from '../repositories/contracts';
import { SavingsEngine } from '../domain/SavingsEngine';

export class CreateSavingsGoalUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    if (!goal.title || goal.title.trim() === '') {
      throw new Error('Savings goal title is required');
    }
    if (!goal.targetAmount || goal.targetAmount <= 0) {
      throw new Error('Savings goal target amount must be positive');
    }
    return this.savingRepo.createSavingsGoal(goal);
  }
}

export class UpdateSavingsGoalUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(goal: SavingsGoal): Promise<SavingsGoal> {
    if (!goal.id || goal.id.trim() === '') {
      throw new Error('Savings goal ID is required');
    }
    return this.savingRepo.updateSavingsGoal(goal);
  }
}

export class ArchiveSavingsGoalUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(goalId: string): Promise<SavingsGoal | null> {
    if (!goalId || goalId.trim() === '') {
      throw new Error('Savings goal ID is required');
    }
    const goals = await this.savingRepo.getSavingsGoals();
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return null;

    const archivedGoal: SavingsGoal = {
      ...targetGoal,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    return this.savingRepo.updateSavingsGoal(archivedGoal);
  }
}

export class DeleteSavingsGoalUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(goalId: string, hardDelete: boolean = false): Promise<boolean> {
    if (!goalId || goalId.trim() === '') {
      throw new Error('Savings goal ID is required');
    }

    if (hardDelete) {
      return this.savingRepo.deleteSavingsGoal(goalId);
    }

    // Soft delete implementation (TASK 4 & TASK 5)
    const goals = await this.savingRepo.getSavingsGoals();
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return false;

    const softDeletedGoal: SavingsGoal = {
      ...targetGoal,
      isSoftDeleted: true,
      status: 'soft_deleted',
      updatedAt: new Date().toISOString()
    };

    await this.savingRepo.updateSavingsGoal(softDeletedGoal);
    return true;
  }
}

export class GetSavingsGoalUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(spaceId?: string): Promise<SavingsGoal[]> {
    const goals = await this.savingRepo.getSavingsGoals(spaceId);
    return goals.filter((g) => !g.isSoftDeleted);
  }
}

export class GetSavingsProgressUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(
    goalId: string,
    contributions: SavingsContribution[] = []
  ): Promise<SavingsProgress | null> {
    const goals = await this.savingRepo.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    return SavingsEngine.evaluateProgress(goal, contributions);
  }
}

export class GetSavingsForecastUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(
    goalId: string,
    contributions: SavingsContribution[] = []
  ): Promise<SavingsForecast | null> {
    const goals = await this.savingRepo.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    return SavingsEngine.calculateForecast(goal, contributions);
  }
}

export class RecordContributionUseCase {
  constructor(private savingRepo: SavingRepository) {}

  async execute(
    goalId: string,
    amount: number,
    note?: string
  ): Promise<{ updatedGoal: SavingsGoal; contribution: SavingsContribution } | null> {
    if (!goalId || goalId.trim() === '') {
      throw new Error('Savings goal ID is required');
    }
    if (amount <= 0) {
      throw new Error('Contribution amount must be positive');
    }

    const goals = await this.savingRepo.getSavingsGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const { updatedGoal, contribution } = SavingsEngine.applyContribution(goal, amount, note);
    const savedGoal = await this.savingRepo.updateSavingsGoal(updatedGoal);

    return { updatedGoal: savedGoal, contribution };
  }
}
