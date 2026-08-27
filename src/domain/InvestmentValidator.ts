/**
 * Daily Finance 2.5 - InvestmentValidator
 * Pure business domain validator for Investment Domain (TASK 14).
 * Validates asset details, amounts, prices, quantities, and duplicate assets.
 */

import { Investment, InvestmentAsset, InvestmentTransaction } from '../types';

export class InvestmentValidator {
  /**
   * Validates asset metadata (name, symbol, prices).
   */
  static validateAsset(asset: Partial<InvestmentAsset>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!asset.name || asset.name.trim() === '') {
      errors.push('Asset name is required');
    }

    if (asset.currentPrice !== undefined && asset.currentPrice < 0) {
      errors.push('Asset price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates investment model before creation or modification.
   */
  static validateInvestment(inv: Partial<Investment>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!inv.name || inv.name.trim() === '') {
      errors.push('Investment name is required');
    }

    if (inv.quantity === undefined || inv.quantity <= 0) {
      errors.push('Investment quantity must be greater than zero');
    }

    if (inv.purchasePrice === undefined || inv.purchasePrice <= 0) {
      errors.push('Purchase price must be greater than zero');
    }

    if (inv.currentPrice === undefined || inv.currentPrice < 0) {
      errors.push('Current price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates quantity and price inputs.
   */
  static validateQuantityAndPrice(quantity: number, price: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(quantity) || quantity <= 0) {
      errors.push('Quantity must be a positive number');
    }

    if (isNaN(price) || price < 0) {
      errors.push('Price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates an investment transaction (Buy, Sell, Dividend).
   */
  static validateTransaction(tx: Partial<InvestmentTransaction>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tx.investmentId || tx.investmentId.trim() === '') {
      errors.push('Investment ID is required for transaction');
    }

    if (tx.amount === undefined || tx.amount <= 0) {
      errors.push('Transaction amount must be greater than zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks for duplicate assets within the space/portfolio.
   */
  static validateDuplicateAsset(
    existingInvestments: Investment[],
    symbolOrName: string,
    excludeId?: string
  ): boolean {
    if (!symbolOrName || symbolOrName.trim() === '') return false;
    const cleanKey = symbolOrName.trim().toLowerCase();

    return existingInvestments.some((inv) => {
      if (excludeId && inv.id === excludeId) return false;
      const invSymbol = (inv.symbol || '').trim().toLowerCase();
      const invName = (inv.name || '').trim().toLowerCase();
      return invSymbol === cleanKey || invName === cleanKey;
    });
  }
}
