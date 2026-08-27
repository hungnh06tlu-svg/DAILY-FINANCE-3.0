/**
 * Daily Finance 3.0 - FinancialSnapshotUseCase
 * Clean Architecture UseCase for building/retrieving the unified FinancialSnapshot Read Model.
 * ViewModels consume ONLY this UseCase for financial projections.
 * Adheres strictly to DF3-002 Read Model Architecture.
 */

import {
  TransactionRepository,
  WalletRepository,
  BudgetRepository,
  SavingRepository,
  InvestmentRepository,
  LoanRepository,
  SixJarsRepository,
  PreferenceRepository,
  BackupRepository
} from '../repositories/contracts';

import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { SnapshotBuilder } from '../domain/SnapshotBuilder';
import { Language } from '../types';

export interface RepositoriesContainer {
  txRepo: TransactionRepository;
  walletRepo: WalletRepository;
  budgetRepo: BudgetRepository;
  savingRepo: SavingRepository;
  investmentRepo: InvestmentRepository;
  loanRepo: LoanRepository;
  sixJarsRepo: SixJarsRepository;
  prefRepo?: PreferenceRepository;
  backupRepo?: BackupRepository;
}

export class GetFinancialSnapshotUseCase {
  private repos: RepositoriesContainer;

  constructor(repos: RepositoriesContainer) {
    if (!repos) {
      throw new Error('[GetFinancialSnapshotUseCase] Fail-Fast: RepositoriesContainer must be provided to constructor');
    }
    if (
      !repos.txRepo ||
      !repos.walletRepo ||
      !repos.budgetRepo ||
      !repos.savingRepo ||
      !repos.investmentRepo ||
      !repos.loanRepo ||
      !repos.sixJarsRepo
    ) {
      throw new Error('[GetFinancialSnapshotUseCase] Fail-Fast: All domain repositories in RepositoriesContainer are required');
    }
    this.repos = repos;
  }

  async execute(spaceId: string = 'sp_personal', language: Language = 'vi'): Promise<FinancialSnapshot> {
    const [
      txs,
      wallets,
      budgets,
      savingsGoals,
      investments,
      debts,
      sixJars,
      prefs
    ] = await Promise.all([
      this.repos.txRepo.getTransactions(spaceId),
      this.repos.walletRepo.getWallets(spaceId),
      this.repos.budgetRepo.getBudgets(spaceId),
      this.repos.savingRepo.getSavingsGoals(spaceId),
      this.repos.investmentRepo.getInvestments(spaceId),
      this.repos.loanRepo.getDebtsAndLoans(spaceId),
      this.repos.sixJarsRepo.getJars(spaceId),
      this.repos.prefRepo ? this.repos.prefRepo.getUserPreferences() : Promise.resolve(null)
    ]);

    const currency = prefs?.currency || 'VND';

    const snapshot = SnapshotBuilder.build({
      spaceId,
      currency,
      language,
      wallets,
      transactions: txs,
      budgets,
      savingsGoals,
      investments,
      debts,
      sixJars
    });

    return snapshot;
  }
}
