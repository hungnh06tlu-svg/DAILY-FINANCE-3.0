/**
 * Daily Finance 2.5 - Health Score UseCases
 * Single-responsibility Use Case for Financial Health Score calculation using FinancialTruthEngine.
 */

import { TransactionRepository, WalletRepository, LoanRepository } from '../repositories/contracts';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';

export class CalculateHealthScoreUseCase {
  constructor(
    private txRepo: TransactionRepository,
    private walletRepo: WalletRepository,
    private loanRepo: LoanRepository
  ) {}

  async execute(spaceId: string) {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('SpaceId is required for health score calculation');
    }

    const txs = await this.txRepo.getTransactions(spaceId);
    const wallets = await this.walletRepo.getWallets(spaceId);
    const debts = await this.loanRepo.getDebtsAndLoans(spaceId);

    const income = FinancialTruthEngine.calculateIncome(txs);
    const expense = FinancialTruthEngine.calculateExpense(txs);
    const netWorth = FinancialTruthEngine.calculateNetWorth(wallets, [], debts, []);
    const totalDebt = debts.filter((d) => d.type === 'debt').reduce((sum, d) => sum + d.remainingAmount, 0);

    const emergency = FinancialTruthEngine.calculateEmergencyFund(wallets, expense > 0 ? expense : 15000000);

    return FinancialTruthEngine.calculateFinancialHealth(
      income,
      expense,
      netWorth,
      totalDebt,
      emergency.coverageMonths
    );
  }
}
