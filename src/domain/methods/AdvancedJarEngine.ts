/**
 * Daily Finance 3.0 — D2-003: AdvancedJarEngine
 * Safe domain extension for multi-space allocation, target tracking, auto-transfers & rebalancing.
 * Zero UI, zero repository side-effects, 100% pure mathematical logic.
 */

import { Jar, JarTarget } from '../../types';
import { DEFAULT_SIX_JARS_CONFIG } from '../CanonicalFinancialModel';
import {
  MultiSpaceIncome,
  JarAllocationRule,
  MultiSpaceAllocationResult,
  SpaceJarAllocation,
  JarTargetProgressResult,
  JarAutoTransferRule,
  JarAutoTransferAction,
  JarRebalanceAction
} from './types';

export class AdvancedJarEngine {
  /**
   * Allocates income across multiple financial spaces while strictly preserving space boundaries.
   */
  static allocateMultiSpaceIncome(
    spaceIncomes: MultiSpaceIncome[],
    customRules?: JarAllocationRule[]
  ): MultiSpaceAllocationResult {
    const rules = customRules && customRules.length > 0
      ? customRules
      : DEFAULT_SIX_JARS_CONFIG.map((c) => ({ jarKey: c.key, percent: c.percent }));

    let totalIncome = 0;
    const spaceBreakdown: Record<string, number> = {};
    const allocations: SpaceJarAllocation[] = [];
    const allocatedByJarKey: Record<string, number> = {};

    // Initialize jar key totals
    for (const rule of rules) {
      allocatedByJarKey[rule.jarKey] = 0;
    }

    for (const item of spaceIncomes) {
      const validAmount = Math.max(0, item.amount);
      totalIncome += validAmount;
      spaceBreakdown[item.spaceId] = (spaceBreakdown[item.spaceId] || 0) + validAmount;

      for (const rule of rules) {
        const allocatedAmount = Math.round((validAmount * rule.percent) / 100);
        allocations.push({
          spaceId: item.spaceId,
          jarKey: rule.jarKey,
          jarName: rule.jarKey,
          allocatedAmount,
          percent: rule.percent
        });
        allocatedByJarKey[rule.jarKey] = (allocatedByJarKey[rule.jarKey] || 0) + allocatedAmount;
      }
    }

    return {
      totalIncome,
      spaceBreakdown,
      allocations,
      allocatedByJarKey
    };
  }

  /**
   * Evaluates the progress and health status of a specific jar target.
   */
  static calculateJarTargetProgress(jar: Jar, target: JarTarget): JarTargetProgressResult {
    const targetAmount = Math.max(0, target.targetAmount);
    const balanceVal = (jar.currentBalance !== undefined && !isNaN(jar.currentBalance))
      ? jar.currentBalance
      : ((jar as any).balance !== undefined && !isNaN((jar as any).balance) ? (jar as any).balance : 0);
    const currentBalance = Math.max(0, balanceVal);
    const remainingAmount = Math.max(0, targetAmount - currentBalance);
    const progressPercent = targetAmount > 0
      ? Math.min(100, Math.round((currentBalance / targetAmount) * 100))
      : (currentBalance >= 0 ? 100 : 0);

    const isReached = currentBalance >= targetAmount && targetAmount > 0;

    let status: 'achieved' | 'on_track' | 'lagging' | 'critical' = 'on_track';
    if (isReached) {
      status = 'achieved';
    } else if (progressPercent < 25) {
      status = 'critical';
    } else if (progressPercent < 60) {
      status = 'lagging';
    }

    return {
      jarId: jar.id,
      targetAmount,
      currentBalance,
      remainingAmount,
      progressPercent,
      isReached,
      status
    };
  }

  /**
   * Generates automated transfer actions when a jar balance exceeds its designated threshold.
   */
  static generateAutoTransfers(jars: Jar[], rules: JarAutoTransferRule[]): JarAutoTransferAction[] {
    const jarMap = new Map<string, Jar>();
    for (const j of jars) {
      jarMap.set(j.id, { ...j });
    }

    const actions: JarAutoTransferAction[] = [];
    const nowIso = new Date().toISOString();

    for (const rule of rules) {
      const fromJar = jarMap.get(rule.fromJarId);
      const toJar = jarMap.get(rule.toJarId);

      if (!fromJar || !toJar) continue;

      if (fromJar.currentBalance >= rule.thresholdBalance && rule.transferAmount > 0) {
        const actualTransfer = Math.min(fromJar.currentBalance, rule.transferAmount);
        if (actualTransfer > 0) {
          fromJar.currentBalance -= actualTransfer;
          toJar.currentBalance += actualTransfer;

          actions.push({
            fromJarId: rule.fromJarId,
            toJarId: rule.toJarId,
            amount: actualTransfer,
            reason: rule.description || `Auto-transfer threshold triggered at ${rule.thresholdBalance}`,
            executedAt: nowIso
          });
        }
      }
    }

    return actions;
  }

  /**
   * Generates a rebalancing plan to align actual jar balances with target percentage allocations.
   */
  static rebalanceJars(jars: Jar[], targetPercentages: Record<string, number>): JarRebalanceAction[] {
    const totalBalance = jars.reduce((sum, j) => sum + Math.max(0, j.currentBalance), 0);
    const actions: JarRebalanceAction[] = [];

    for (const jar of jars) {
      const targetPercent = targetPercentages[jar.key] || targetPercentages[jar.id] || 0;
      const targetBalance = Math.round((totalBalance * targetPercent) / 100);
      const delta = targetBalance - jar.currentBalance;

      let action: 'deposit' | 'withdraw' | 'hold' = 'hold';
      if (delta > 0) {
        action = 'deposit';
      } else if (delta < 0) {
        action = 'withdraw';
      }

      actions.push({
        jarId: jar.id,
        currentBalance: jar.currentBalance,
        targetBalance,
        delta,
        action
      });
    }

    return actions;
  }
}
