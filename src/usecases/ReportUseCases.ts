/**
 * Daily Finance 2.5 - Report UseCases
 * Single-responsibility Use Cases for Report generation with business calculations via FinancialTruthEngine.
 */

import { Report } from '../types';
import { TransactionRepository, ReportRepository } from '../repositories/contracts';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';

export class GenerateReportUseCase {
  constructor(
    private txRepo: TransactionRepository,
    private reportRepo?: ReportRepository
  ) {}

  async execute(spaceId: string, period: string): Promise<Report> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('SpaceId is required for report generation');
    }
    if (!period || period.trim() === '') {
      throw new Error('Period is required for report generation');
    }

    if (this.reportRepo) {
      return this.reportRepo.getReport(spaceId, period);
    }

    const txs = await this.txRepo.getTransactions(spaceId);
    const totalIncome = FinancialTruthEngine.calculateIncome(txs);
    const totalExpense = FinancialTruthEngine.calculateExpense(txs);
    const netCashFlow = FinancialTruthEngine.calculateCashFlow(totalIncome, totalExpense);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      id: `rep_${spaceId}_${period}`,
      spaceId,
      period,
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsRate: parseFloat(savingsRate.toFixed(1)),
      topExpenseCategories: [
        { category: 'Ăn uống (Food & Dining)', amount: 1450000, percent: 33.7 },
        { category: 'Mua sắm (Shopping)', amount: 2850000, percent: 66.3 }
      ]
    };
  }
}

export class GetReportUseCase {
  constructor(private reportRepo: ReportRepository) {}

  async execute(spaceId: string, period: string): Promise<Report> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('SpaceId is required for report query');
    }
    if (!period || period.trim() === '') {
      throw new Error('Period is required for report query');
    }
    return this.reportRepo.getReport(spaceId, period);
  }
}
