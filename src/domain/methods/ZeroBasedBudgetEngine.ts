/**
 * Daily Finance 3.0 — D2-003: ZeroBasedBudgetEngine
 * Safe domain extension for Zero-Based Budgeting (ZBB).
 * Core Invariant: Total Income - All Assigned Envelope Dollars = 0.
 */

import { Transaction } from '../../types';
import {
  ZeroBasedEnvelope,
  ZeroBasedPlanResult,
  ZeroBasedReconciliationResult
} from './types';

export class ZeroBasedBudgetEngine {
  /**
   * Creates a Zero-Based Budget plan where every dollar of income is assigned to an envelope.
   */
  static createPlan(income: number, envelopes: ZeroBasedEnvelope[]): ZeroBasedPlanResult {
    const totalIncome = Math.max(0, income);
    let totalAllocated = 0;
    const categoryTotals: Record<string, number> = {};

    for (const env of envelopes) {
      const amt = Math.max(0, env.allocatedAmount);
      totalAllocated += amt;
      categoryTotals[env.category] = (categoryTotals[env.category] || 0) + amt;
    }

    const leftoverToAssign = totalIncome - totalAllocated;
    const isBalancedToZero = leftoverToAssign === 0;

    return {
      totalIncome,
      totalAllocated,
      leftoverToAssign,
      isBalancedToZero,
      envelopes,
      categoryTotals
    };
  }

  /**
   * Reconciles the zero-based budget plan against actual transactions executed in the period.
   */
  static reconcileActual(
    plan: ZeroBasedPlanResult,
    actualTransactions: Transaction[]
  ): ZeroBasedReconciliationResult {
    const spendingMap = new Map<string, number>();

    for (const tx of actualTransactions) {
      if (tx.isDeleted || tx.status === 'soft_deleted' || tx.status === 'draft') continue;
      if (tx.type !== 'expense' && tx.type !== 'saving' && tx.type !== 'debt_payment') continue;

      const catKey = (tx.category || tx.categoryId || '').trim().toLowerCase();
      spendingMap.set(catKey, (spendingMap.get(catKey) || 0) + Math.max(0, tx.amount));
    }

    let totalSpent = 0;
    const envelopesReconciled = plan.envelopes.map((env) => {
      const catKey = env.category.trim().toLowerCase();
      const actualSpent = spendingMap.get(catKey) || 0;
      totalSpent += actualSpent;

      const remaining = env.allocatedAmount - actualSpent;
      let status: 'under_budget' | 'exact' | 'over_budget' = 'under_budget';
      if (remaining === 0) {
        status = 'exact';
      } else if (remaining < 0) {
        status = 'over_budget';
      }

      return {
        envelopeId: env.id,
        name: env.name,
        allocated: env.allocatedAmount,
        actualSpent,
        remaining,
        status
      };
    });

    const totalRemaining = plan.totalAllocated - totalSpent;
    let overallHealth: 'excellent' | 'fair' | 'overspent' = 'excellent';
    if (totalRemaining < 0) {
      overallHealth = 'overspent';
    } else if (envelopesReconciled.some((e) => e.status === 'over_budget')) {
      overallHealth = 'fair';
    }

    return {
      plan,
      envelopesReconciled,
      totalSpent,
      totalRemaining,
      overallHealth
    };
  }
}
