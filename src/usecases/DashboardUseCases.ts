/**
 * Daily Finance 3.0 - Dashboard UseCases
 * Single-responsibility Use Case for Dashboard generation with domain engine integration.
 */

import { Dashboard } from '../types';
import { TransactionRepository, WalletRepository, DashboardRepository } from '../repositories/contracts';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { SpaceIsolationGuard, MoneyUtils } from '../domain/CanonicalFinancialModel';

export class GenerateDashboardUseCase {
  constructor(
    private txRepo: TransactionRepository,
    private walletRepo: WalletRepository,
    private dashboardRepo?: DashboardRepository
  ) {}

  async execute(spaceId: string): Promise<Dashboard> {
    const validSpaceId = SpaceIsolationGuard.validateSpaceId(spaceId);

    if (this.dashboardRepo) {
      return this.dashboardRepo.getDashboard(validSpaceId);
    }

    const txs = await this.txRepo.getTransactions(validSpaceId);
    const wallets = await this.walletRepo.getWallets(validSpaceId);

    const monthlyIncome = FinancialTruthEngine.calculateIncome(txs, undefined, undefined, validSpaceId);
    const monthlyExpense = FinancialTruthEngine.calculateExpense(txs, undefined, undefined, validSpaceId);
    const totalBalance = FinancialTruthEngine.calculateBalance(txs, 0, validSpaceId);
    const netWorth = FinancialTruthEngine.calculateNetWorth(wallets, [], [], [], validSpaceId);

    return {
      spaceId: validSpaceId,
      totalBalance: totalBalance > 0 ? totalBalance : wallets.reduce((s, w) => s + (w.currentBalance || 0), 0),
      monthlyIncome,
      monthlyExpense,
      netWorth: netWorth > 0 ? netWorth : totalBalance,
      budgetProgress: 0,
      recentTransactions: txs.slice(0, 5)
    };
  }
}

export class GetDashboardUseCase {
  constructor(
    private dashboardRepo: DashboardRepository,
    private txRepo?: TransactionRepository,
    private walletRepo?: WalletRepository
  ) {}

  async execute(spaceId: string): Promise<Dashboard> {
    const validSpaceId = SpaceIsolationGuard.validateSpaceId(spaceId);
    return this.dashboardRepo.getDashboard(validSpaceId);
  }
}
