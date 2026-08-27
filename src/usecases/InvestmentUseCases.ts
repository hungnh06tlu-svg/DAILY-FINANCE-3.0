/**
 * Daily Finance 2.5 - Investment UseCases
 * Single-responsibility Use Cases for Investment domain management (TASK 4).
 */

import {
  Investment,
  InvestmentPerformance,
  InvestmentForecast,
  InvestmentTransaction
} from '../types';
import { InvestmentRepository } from '../repositories/contracts';
import { InvestmentEngine } from '../domain/InvestmentEngine';
import { InvestmentValidator } from '../domain/InvestmentValidator';
import { IdGenerator } from '../services/IdGenerator';

export class CreateInvestmentUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(inv: Omit<Investment, 'id'>): Promise<Investment> {
    const validation = InvestmentValidator.validateInvestment(inv);
    if (!validation.isValid) {
      throw new Error(`Invalid investment data: ${validation.errors.join(', ')}`);
    }

    const existing = await this.invRepo.getInvestments(inv.spaceId);
    const isDup = InvestmentValidator.validateDuplicateAsset(existing, inv.symbol || inv.name);
    if (isDup) {
      throw new Error(`Asset ${inv.symbol || inv.name} already exists in portfolio`);
    }

    return this.invRepo.addInvestment(inv);
  }
}

export class UpdateInvestmentUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(inv: Investment): Promise<Investment> {
    if (!inv.id || inv.id.trim() === '') {
      throw new Error('Investment ID is required for update');
    }
    const validation = InvestmentValidator.validateInvestment(inv);
    if (!validation.isValid) {
      throw new Error(`Invalid investment data: ${validation.errors.join(', ')}`);
    }
    return this.invRepo.updateInvestment(inv);
  }
}

export class ArchiveInvestmentUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(investmentId: string): Promise<Investment | null> {
    if (!investmentId || investmentId.trim() === '') {
      throw new Error('Investment ID is required');
    }
    const list = await this.invRepo.getInvestments();
    const target = list.find((i) => i.id === investmentId);
    if (!target) return null;

    const archivedInv: Investment = {
      ...target,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    return this.invRepo.updateInvestment(archivedInv);
  }
}

export class DeleteInvestmentUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(investmentId: string, hardDelete: boolean = false): Promise<boolean> {
    if (!investmentId || investmentId.trim() === '') {
      throw new Error('Investment ID is required');
    }

    if (hardDelete) {
      return this.invRepo.deleteInvestment(investmentId);
    }

    // Soft delete implementation (TASK 4 & TASK 5)
    const list = await this.invRepo.getInvestments();
    const target = list.find((i) => i.id === investmentId);
    if (!target) return false;

    const softDeletedInv: Investment = {
      ...target,
      isSoftDeleted: true,
      status: 'soft_deleted',
      updatedAt: new Date().toISOString()
    };

    await this.invRepo.updateInvestment(softDeletedInv);
    return true;
  }
}

export class BuyAssetUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(
    investmentId: string,
    quantity: number,
    buyPrice: number
  ): Promise<{ updatedInvestment: Investment; transaction: InvestmentTransaction } | null> {
    const qtyValid = InvestmentValidator.validateQuantityAndPrice(quantity, buyPrice);
    if (!qtyValid.isValid) {
      throw new Error(qtyValid.errors.join(', '));
    }

    const list = await this.invRepo.getInvestments();
    const target = list.find((i) => i.id === investmentId);
    if (!target) return null;

    const { updatedInvestment, transaction } = InvestmentEngine.applyBuyAsset(target, quantity, buyPrice);
    const savedInv = await this.invRepo.updateInvestment(updatedInvestment);

    return { updatedInvestment: savedInv, transaction };
  }
}

export class SellAssetUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(
    investmentId: string,
    quantity: number,
    sellPrice: number
  ): Promise<{ updatedInvestment: Investment; transaction: InvestmentTransaction } | null> {
    const qtyValid = InvestmentValidator.validateQuantityAndPrice(quantity, sellPrice);
    if (!qtyValid.isValid) {
      throw new Error(qtyValid.errors.join(', '));
    }

    const list = await this.invRepo.getInvestments();
    const target = list.find((i) => i.id === investmentId);
    if (!target) return null;

    const { updatedInvestment, transaction } = InvestmentEngine.applySellAsset(target, quantity, sellPrice);
    const savedInv = await this.invRepo.updateInvestment(updatedInvestment);

    return { updatedInvestment: savedInv, transaction };
  }
}

export class RecordDividendUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(
    investmentId: string,
    amount: number,
    note?: string
  ): Promise<InvestmentTransaction | null> {
    if (amount <= 0) {
      throw new Error('Dividend amount must be greater than zero');
    }

    const list = await this.invRepo.getInvestments();
    const target = list.find((i) => i.id === investmentId);
    if (!target) return null;

    const transaction: InvestmentTransaction = {
      id: IdGenerator.generateId('div_tx'),
      investmentId: target.id,
      type: 'dividend',
      quantity: 0,
      price: amount,
      amount,
      formattedAmount: '',
      date: new Date().toISOString().split('T')[0],
      note: note || `Cổ tức / Lợi tức từ ${target.symbol || target.name}`
    };

    return transaction;
  }
}

export class GetPortfolioUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(spaceId?: string): Promise<Investment[]> {
    const list = await this.invRepo.getInvestments(spaceId);
    return list.filter((i) => !i.isSoftDeleted);
  }
}

export class GetPerformanceUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(spaceId?: string): Promise<InvestmentPerformance> {
    const list = await this.invRepo.getInvestments(spaceId);
    return InvestmentEngine.evaluatePortfolio(list);
  }
}

export class GetForecastUseCase {
  constructor(private invRepo: InvestmentRepository) {}

  async execute(spaceId?: string, rate: number = 0.08): Promise<InvestmentForecast> {
    const list = await this.invRepo.getInvestments(spaceId);
    return InvestmentEngine.calculateForecast(list, rate);
  }
}
