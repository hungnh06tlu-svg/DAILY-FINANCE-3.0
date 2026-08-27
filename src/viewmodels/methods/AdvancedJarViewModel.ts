/**
 * Daily Finance 3.0 — D2-003S5: Advanced Jar ViewModel
 * Pure presentation adapter delegating all financial logic to AdvancedJarEngine.
 */

import { AdvancedJarEngine } from '../../domain/methods/AdvancedJarEngine';
import {
  MultiSpaceIncome,
  JarAllocationRule,
  MultiSpaceAllocationResult,
  JarTargetProgressResult,
  JarAutoTransferRule,
  JarAutoTransferAction,
  JarRebalanceAction
} from '../../domain/methods/types';
import { Jar, JarTarget } from '../../types';

export interface AdvancedJarUiState {
  allocationResult: MultiSpaceAllocationResult | null;
  targetProgresses: JarTargetProgressResult[];
  autoTransfers: JarAutoTransferAction[];
  rebalancePlan: JarRebalanceAction[];
  isLoading: boolean;
  error?: string | null;
}

export class AdvancedJarViewModel {
  /**
   * Generates multi-space income allocation UI state by delegating to AdvancedJarEngine.
   */
  async getAllocationUiState(
    incomes: MultiSpaceIncome[],
    rules: JarAllocationRule[]
  ): Promise<AdvancedJarUiState> {
    try {
      const allocationResult = AdvancedJarEngine.allocateMultiSpaceIncome(incomes, rules);
      return {
        allocationResult,
        targetProgresses: [],
        autoTransfers: [],
        rebalancePlan: [],
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        allocationResult: null,
        targetProgresses: [],
        autoTransfers: [],
        rebalancePlan: [],
        isLoading: false,
        error: err?.message || 'Failed to allocate multi-space income'
      };
    }
  }

  /**
   * Evaluates target progress for all jars.
   */
  async evaluateTargetsUiState(
    jars: Jar[],
    targets: JarTarget[]
  ): Promise<AdvancedJarUiState> {
    try {
      const targetProgresses = targets.map((target) => {
        const jar: Jar = jars.find((j) => j.id === target.jarId) || {
          id: target.jarId,
          key: 'CUSTOM',
          nameVi: '',
          nameEn: '',
          color: '#10b981',
          percent: 0,
          currentBalance: target.currentBalance ?? 0
        };
        return AdvancedJarEngine.calculateJarTargetProgress(jar, target);
      });

      return {
        allocationResult: null,
        targetProgresses,
        autoTransfers: [],
        rebalancePlan: [],
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        allocationResult: null,
        targetProgresses: [],
        autoTransfers: [],
        rebalancePlan: [],
        isLoading: false,
        error: err?.message || 'Failed to evaluate jar targets'
      };
    }
  }

  /**
   * Generates automated overflow transfers and rebalancing recommendations.
   */
  async getAutomationUiState(
    jars: Jar[],
    transferRules: JarAutoTransferRule[],
    targetBalances: Record<string, number>
  ): Promise<AdvancedJarUiState> {
    try {
      const autoTransfers = AdvancedJarEngine.generateAutoTransfers(jars, transferRules);
      const rebalancePlan = AdvancedJarEngine.rebalanceJars(jars, targetBalances);

      return {
        allocationResult: null,
        targetProgresses: [],
        autoTransfers,
        rebalancePlan,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        allocationResult: null,
        targetProgresses: [],
        autoTransfers: [],
        rebalancePlan: [],
        isLoading: false,
        error: err?.message || 'Failed to compute jar automations'
      };
    }
  }
}
