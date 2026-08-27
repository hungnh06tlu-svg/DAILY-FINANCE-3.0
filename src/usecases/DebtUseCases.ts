/**
 * Daily Finance 2.5 - DebtUseCases
 * Use Case implementations for Debt & Loan Domain (TASK 6).
 * Follows Clean Architecture principles.
 */

import { LoanRepository } from '../repositories/contracts';
import { DebtValidator } from '../domain/DebtValidator';
import { DebtEngine } from '../domain/DebtEngine';
import {
  DebtItem,
  DebtSummary,
  DebtForecast,
  DebtStatistics,
  DebtSchedule,
  Repayment,
  Language
} from '../types';

export class CreateDebtUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[CreateDebtUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    const validation = DebtValidator.validateDebt(item);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.repo.addDebtOrLoan({
      ...item,
      remainingAmount: item.remainingAmount !== undefined ? item.remainingAmount : item.originalAmount,
      status: item.status || 'active',
      isSoftDeleted: false
    });
  }
}

export class UpdateDebtUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[UpdateDebtUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(item: DebtItem): Promise<DebtItem> {
    const validation = DebtValidator.validateDebt(item);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const updatedItem = {
      ...item,
      updatedAt: new Date().toISOString()
    };

    return this.repo.updateDebtOrLoan(updatedItem);
  }
}

export class ArchiveDebtUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[ArchiveDebtUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(id: string, spaceId?: string): Promise<DebtItem | null> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    const existing = items.find((i) => i.id === id);
    if (!existing) return null;

    const archivedItem: DebtItem = {
      ...existing,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    return this.repo.updateDebtOrLoan(archivedItem);
  }
}

export class DeleteDebtUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[DeleteDebtUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(id: string, hardDelete: boolean = false, spaceId?: string): Promise<boolean> {
    if (hardDelete) {
      return this.repo.deleteDebtOrLoan(id);
    }

    const items = await this.repo.getDebtsAndLoans(spaceId);
    const existing = items.find((i) => i.id === id);
    if (!existing) return false;

    const softDeletedItem: DebtItem = {
      ...existing,
      isSoftDeleted: true,
      status: 'soft_deleted',
      updatedAt: new Date().toISOString()
    };

    await this.repo.updateDebtOrLoan(softDeletedItem);
    return true;
  }
}

export class RecordRepaymentUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[RecordRepaymentUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(
    debtId: string,
    amount: number,
    note?: string,
    spaceId?: string
  ): Promise<{ updatedItem: DebtItem; repayment: Repayment } | null> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    const target = items.find((i) => i.id === debtId);
    if (!target) return null;

    const validation = DebtValidator.validateRepayment(amount, target.remainingAmount);
    if (!validation.isValid) {
      throw new Error(`Repayment validation failed: ${validation.errors.join(', ')}`);
    }

    const { updatedItem, repayment } = DebtEngine.applyRepayment(target, amount, note);
    const savedItem = await this.repo.updateDebtOrLoan(updatedItem);

    return { updatedItem: savedItem, repayment };
  }
}

export class RecordBorrowUseCase {
  constructor(private createUseCase: CreateDebtUseCase) {
    if (!createUseCase) throw new Error('[RecordBorrowUseCase] Fail-Fast: CreateDebtUseCase is required');
  }

  async execute(params: {
    title: string;
    counterparty: string;
    amount: number;
    interestRate?: number;
    dueDate: string;
    spaceId?: string;
  }): Promise<DebtItem> {
    return this.createUseCase.execute({
      title: params.title,
      type: 'debt',
      originalAmount: params.amount,
      remainingAmount: params.amount,
      interestRate: params.interestRate || 0,
      minimumMonthlyPayment: Math.round(params.amount / 12),
      counterparty: params.counterparty,
      dueDate: params.dueDate,
      spaceId: params.spaceId || 'default_space',
      debtType: 'borrowed_money',
      status: 'active'
    });
  }
}

export class RecordLoanUseCase {
  constructor(private createUseCase: CreateDebtUseCase) {
    if (!createUseCase) throw new Error('[RecordLoanUseCase] Fail-Fast: CreateDebtUseCase is required');
  }

  async execute(params: {
    title: string;
    counterparty: string;
    amount: number;
    interestRate?: number;
    dueDate: string;
    spaceId?: string;
  }): Promise<DebtItem> {
    return this.createUseCase.execute({
      title: params.title,
      type: 'loan',
      originalAmount: params.amount,
      remainingAmount: params.amount,
      interestRate: params.interestRate || 0,
      minimumMonthlyPayment: Math.round(params.amount / 12),
      counterparty: params.counterparty,
      dueDate: params.dueDate,
      spaceId: params.spaceId || 'default_space',
      debtType: 'money_lent',
      status: 'active'
    });
  }
}

export class GetDebtSummaryUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[GetDebtSummaryUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(spaceId?: string, repayments: Repayment[] = [], language: Language = 'vi'): Promise<DebtSummary> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    return DebtEngine.calculateSummary(items, repayments, language);
  }
}

export class GetDebtForecastUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[GetDebtForecastUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(spaceId?: string, repayments: Repayment[] = [], language: Language = 'vi'): Promise<DebtForecast> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    return DebtEngine.calculateForecast(items, repayments, language);
  }
}

export class GetRepaymentScheduleUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[GetRepaymentScheduleUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(debtId: string, repayments: Repayment[] = [], spaceId?: string, language: Language = 'vi'): Promise<DebtSchedule[]> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    const target = items.find((i) => i.id === debtId);
    if (!target) return [];

    return DebtEngine.generateSchedule(target, repayments, language);
  }
}

export class GetDebtStatisticsUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[GetDebtStatisticsUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(spaceId?: string): Promise<DebtStatistics> {
    const items = await this.repo.getDebtsAndLoans(spaceId);
    return DebtEngine.calculateStatistics(items);
  }
}

export class GetDebtsAndLoansUseCase {
  constructor(private repo: LoanRepository) {
    if (!repo) throw new Error('[GetDebtsAndLoansUseCase] Fail-Fast: LoanRepository is required');
  }

  async execute(spaceId?: string): Promise<DebtItem[]> {
    return this.repo.getDebtsAndLoans(spaceId);
  }
}
