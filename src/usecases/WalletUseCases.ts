/**
 * Daily Finance 2.5 - Wallet UseCases
 * Single-responsibility Use Cases for Wallet calculations and summaries.
 */

import { Wallet } from '../types';
import { WalletRepository, TransactionRepository } from '../repositories/contracts';

export class GetWalletSummaryUseCase {
  constructor(
    private walletRepo: WalletRepository,
    private txRepo: TransactionRepository
  ) {}

  async execute(spaceId: string): Promise<{
    wallets: Wallet[];
    totalBalance: number;
    activeWalletsCount: number;
  }> {
    if (!spaceId || spaceId.trim() === '') {
      throw new Error('SpaceId is required for wallet summary');
    }

    const wallets = await this.walletRepo.getWallets(spaceId);

    const activeWallets = wallets.filter((w) => w.status === 'active');
    const totalBalance = activeWallets.reduce(
      (sum, w) => sum + (w.currentBalance || 0),
      0
    );

    return {
      wallets,
      totalBalance,
      activeWalletsCount: activeWallets.length
    };
  }
}

export class GetWalletsUseCase {
  constructor(private walletRepo: WalletRepository) {}

  async execute(spaceId?: string): Promise<Wallet[]> {
    return this.walletRepo.getWallets(spaceId);
  }
}
