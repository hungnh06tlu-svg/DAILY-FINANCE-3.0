/**
 * Daily Finance 2.5 - SixJarsEngine
 * Domain Engine - Pure business orchestration for Six Jars domain.
 * Delegates financial arithmetic exclusively to FinancialTruthEngine.
 * Uses IdGenerator for all generated identifiers.
 * Zero UI, zero rendering, zero direct side-effects, zero repository access.
 */

import {
  Jar,
  JarAllocation,
  JarContribution,
  JarTransfer,
  JarTarget,
  JarSummary,
  JarStatistics,
  JarForecast,
  JarAlert,
  JarHistory,
  JarRule,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { IdGenerator } from '../services/IdGenerator';
import { DEFAULT_SIX_JARS_CONFIG, JarConfigItem } from './CanonicalFinancialModel';

export class SixJarsEngine {
  /**
   * TASK 7 & D2-001B: Returns jars template based on canonical or custom configuration.
   * Defaults to canonical 6 Jars per T. Harv Eker methodology (NEC: 55%, FFA: 10%, LTSS: 10%, EDU: 10%, PLAY: 10%, GIVE: 5%).
   */
  static getDefaultJarsTemplate(spaceId: string = 'sp_personal', customSpecs?: readonly JarConfigItem[] | JarConfigItem[]): Jar[] {
    const specs = customSpecs && customSpecs.length > 0 ? customSpecs : DEFAULT_SIX_JARS_CONFIG;

    return specs.map((spec) => ({
      id: spec.id || `jar_${spec.key.toLowerCase()}`,
      key: spec.key,
      nameVi: spec.nameVi || spec.key,
      nameEn: spec.nameEn || spec.key,
      percent: spec.percent,
      currentBalance: spec.currentBalance || 0,
      color: spec.color || '#3B82F6',
      descriptionVi: spec.descriptionVi || '',
      descriptionEn: spec.descriptionEn || '',
      spaceId: spec.spaceId || spaceId,
      targetAmount: 0,
      status: (spec.status as any) || 'active',
      ruleType: 'percentage',
      isEnabled: spec.isEnabled !== false,
      isCustom: customSpecs ? true : false,
      isSoftDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * TASK 1 & 11: Orchestrates income allocation across active jars.
   * Delegates arithmetic calculations exclusively to FinancialTruthEngine.calculateSixJars.
   */
  static orchestrateIncomeAllocation(
    jars: Jar[],
    incomeAmount: number,
    language: Language = 'vi',
    now: Date = new Date()
  ): { updatedJars: Jar[]; allocations: JarAllocation[]; contributions: JarContribution[] } {
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false && j.status === 'active');
    
    // TASK 11: Delegate 6 jars calculation to FinancialTruthEngine
    const truthCalculatedJars = FinancialTruthEngine.calculateSixJars(incomeAmount, activeJars);

    const updatedJars: Jar[] = [];
    const allocations: JarAllocation[] = [];
    const contributions: JarContribution[] = [];

    activeJars.forEach((jar) => {
      const calculatedMatch = truthCalculatedJars.find((c) => c.key === jar.key || c.id === jar.id);
      const allocatedAmount = calculatedMatch
        ? Math.max(0, calculatedMatch.currentBalance - jar.currentBalance)
        : Math.round((incomeAmount * jar.percent) / 100);

      const newBalance = jar.currentBalance + allocatedAmount;

      const updatedJar: Jar = {
        ...jar,
        currentBalance: newBalance,
        updatedAt: now.toISOString()
      };
      updatedJars.push(updatedJar);

      const allocId = IdGenerator.generateId('alloc');
      allocations.push({
        id: allocId,
        jarId: jar.id,
        amount: allocatedAmount,
        formattedAmount: '',
        percentage: jar.percent,
        incomeAmount,
        allocatedAt: now.toISOString().split('T')[0],
        note: `Phân bổ ${jar.percent}% từ thu nhập ${incomeAmount}`
      });

      const contrId = IdGenerator.generateId('contr');
      contributions.push({
        id: contrId,
        jarId: jar.id,
        amount: allocatedAmount,
        formattedAmount: '',
        date: now.toISOString().split('T')[0],
        type: 'income_allocation',
        note: `Nạp tự động từ phân bổ thu nhập`
      });
    });

    // Retain non-active jars untouched
    jars.forEach((j) => {
      if (!updatedJars.some((u) => u.id === j.id)) {
        updatedJars.push(j);
      }
    });

    return { updatedJars, allocations, contributions };
  }

  /**
   * TASK 1 & 11: Orchestrates transfer between two jars.
   * Delegates balance updating exclusively to FinancialTruthEngine.calculateTransfer.
   */
  static orchestrateTransfer(
    fromJar: Jar,
    toJar: Jar,
    amount: number,
    language: Language = 'vi',
    now: Date = new Date()
  ): { updatedFromJar: Jar; updatedToJar: Jar; transfer: JarTransfer } {
    // TASK 11: Delegate transfer math to FinancialTruthEngine
    const transferResult = FinancialTruthEngine.calculateTransfer(
      fromJar.currentBalance,
      toJar.currentBalance,
      amount
    );

    if (!transferResult.isSuccess) {
      throw new Error(`Transfer failed: ${transferResult.errorReason || 'Insufficient funds'}`);
    }

    const updatedFromJar: Jar = {
      ...fromJar,
      currentBalance: transferResult.newFromBalance,
      updatedAt: now.toISOString()
    };

    const updatedToJar: Jar = {
      ...toJar,
      currentBalance: transferResult.newToBalance,
      updatedAt: now.toISOString()
    };

    const transferId = IdGenerator.generateId('xfer');
    const transfer: JarTransfer = {
      id: transferId,
      fromJarId: fromJar.id,
      toJarId: toJar.id,
      amount,
      formattedAmount: '',
      date: now.toISOString().split('T')[0],
      note: `Chuyển từ ${fromJar.nameVi} sang ${toJar.nameVi}`
    };

    return { updatedFromJar, updatedToJar, transfer };
  }

  /**
   * TASK 1: Orchestrates direct manual contribution to a jar.
   */
  static orchestrateContribution(
    jar: Jar,
    amount: number,
    note?: string,
    language: Language = 'vi',
    now: Date = new Date()
  ): { updatedJar: Jar; contribution: JarContribution } {
    const newBalance = (jar.currentBalance || 0) + amount;

    const updatedJar: Jar = {
      ...jar,
      currentBalance: newBalance,
      updatedAt: now.toISOString()
    };

    const contrId = IdGenerator.generateId('contr');
    const contribution: JarContribution = {
      id: contrId,
      jarId: jar.id,
      amount,
      formattedAmount: '',
      date: now.toISOString().split('T')[0],
      type: 'manual_contribution',
      note: note || `Nạp tiền trực tiếp vào hũ ${jar.nameVi}`
    };

    return { updatedJar, contribution };
  }

  /**
   * TASK 1, 9 & 11: Evaluates targets for all active jars.
   */
  static evaluateTargets(jars: Jar[], language: Language = 'vi'): JarTarget[] {
    const activeJars = jars.filter((j) => !j.isSoftDeleted);

    return activeJars.map((j) => {
      const bal = Math.max(0, j.currentBalance || 0);
      const targetAmount = Math.max(0, j.targetAmount || 0);
      const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((bal / targetAmount) * 100)) : 100;
      const isReached = targetAmount > 0 && bal >= targetAmount;

      return {
        id: IdGenerator.generateId('tgt'),
        jarId: j.id,
        targetAmount,
        formattedTargetAmount: '',
        currentBalance: bal,
        progressPercent,
        isReached
      };
    });
  }

  /**
   * TASK 1 & 11: Orchestrates 3, 6, 12 month forecasts for jars.
   * Delegates compound growth timeline to FinancialTruthEngine.calculateForecast.
   */
  static orchestrateForecast(
    jars: Jar[],
    monthlyIncomeEstimate: number = 30000000,
    language: Language = 'vi'
  ): JarForecast {
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false);

    const projectedBalances3Months: Record<string, number> = {};
    const projectedBalances6Months: Record<string, number> = {};
    const projectedBalances12Months: Record<string, number> = {};
    const formattedProjectedBalances: Record<string, string> = {};
    const monthsToReachTargets: Record<string, number> = {};

    activeJars.forEach((j) => {
      const monthlyAlloc = Math.round((monthlyIncomeEstimate * (j.percent || 0)) / 100);

      // TASK 11: Delegate growth calculation to FinancialTruthEngine
      const timeline12 = FinancialTruthEngine.calculateForecast(
        j.currentBalance || 0,
        monthlyAlloc,
        0, // 0% interest for cash allocation jars
        12
      );

      const bal3 = timeline12[2]?.estimatedNetWorth || j.currentBalance + monthlyAlloc * 3;
      const bal6 = timeline12[5]?.estimatedNetWorth || j.currentBalance + monthlyAlloc * 6;
      const bal12 = timeline12[11]?.estimatedNetWorth || j.currentBalance + monthlyAlloc * 12;

      projectedBalances3Months[j.id] = bal3;
      projectedBalances6Months[j.id] = bal6;
      projectedBalances12Months[j.id] = bal12;
      formattedProjectedBalances[j.id] = '';

      if (j.targetAmount && j.targetAmount > j.currentBalance && monthlyAlloc > 0) {
        monthsToReachTargets[j.id] = Math.ceil((j.targetAmount - j.currentBalance) / monthlyAlloc);
      } else {
        monthsToReachTargets[j.id] = 0;
      }
    });

    return {
      projectedBalances3Months,
      projectedBalances6Months,
      projectedBalances12Months,
      formattedProjectedBalances,
      monthsToReachTargets,
      status: 'on_track'
    };
  }

  /**
   * TASK 10: Evaluates alerts across jars (Target Reached, Low Balance, No Contribution, Invalid Total %).
   */
  static evaluateAlerts(jars: Jar[], language: Language = 'vi'): JarAlert[] {
    const alerts: JarAlert[] = [];
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false);

    // 1. Total percentage check
    const totalPercent = activeJars.reduce((sum, j) => sum + (j.percent || 0), 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      alerts.push({
        id: IdGenerator.generateId('alt_pct'),
        message: language === 'vi'
          ? `Cảnh báo phân bổ: Tổng tỷ lệ 6 hũ là ${totalPercent}% (chưa đủ hoặc vượt 100%).`
          : `Allocation warning: Total jar ratio is ${totalPercent}% (must equal 100%).`,
        level: 'invalid_total_percentage'
      });
    }

    // 2. Per-jar alerts
    activeJars.forEach((j) => {
      // Target reached
      if (j.targetAmount && j.targetAmount > 0 && j.currentBalance >= j.targetAmount) {
        alerts.push({
          id: IdGenerator.generateId('alt_tgt'),
          message: language === 'vi'
            ? `Chúc mừng! Hũ '${j.nameVi}' đã đạt mục tiêu ${j.targetAmount}!`
            : `Congratulations! Jar '${j.nameEn}' reached target ${j.targetAmount}!`,
          level: 'target_reached',
          jarId: j.id
        });
      }

      // Low balance in NEC jar
      if (j.key === 'NEC' && j.currentBalance < 1000000) {
        alerts.push({
          id: IdGenerator.generateId('alt_low'),
          message: language === 'vi'
            ? `Hũ Thiết yếu (${j.nameVi}) số dư thấp (${j.currentBalance}).`
            : `Necessities Jar low balance (${j.currentBalance}).`,
          level: 'low_balance',
          jarId: j.id
        });
      }
    });

    return alerts;
  }

  /**
   * Calculates summary across all jars.
   */
  static calculateSummary(
    jars: Jar[],
    contributions: JarContribution[] = [],
    transfers: JarTransfer[] = [],
    language: Language = 'vi'
  ): JarSummary {
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false);

    const totalBalance = activeJars.reduce((sum, j) => sum + Math.max(0, j.currentBalance || 0), 0);
    const totalAllocatedPercent = activeJars.reduce((sum, j) => sum + (j.percent || 0), 0);

    const nowMonthStr = new Date().toISOString().substring(0, 7);

    const totalContributionsThisMonth = contributions
      .filter((c) => c.date.startsWith(nowMonthStr))
      .reduce((sum, c) => sum + c.amount, 0);

    const totalTransfersThisMonth = transfers
      .filter((t) => t.date.startsWith(nowMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBalance,
      formattedTotalBalance: '',
      totalAllocatedPercent,
      activeJarsCount: activeJars.length,
      totalContributionsThisMonth,
      formattedTotalContributionsThisMonth: '',
      totalTransfersThisMonth,
      formattedTotalTransfersThisMonth: ''
    };
  }

  /**
   * Calculates statistics for jar portfolio.
   */
  static calculateStatistics(jars: Jar[]): JarStatistics {
    const activeJars = jars.filter((j) => !j.isSoftDeleted && j.isEnabled !== false);

    let largestName: string | undefined;
    let largestBal = 0;
    let topAllocName: string | undefined;
    let topAllocPct = 0;
    let sumBal = 0;

    activeJars.forEach((j) => {
      const bal = j.currentBalance || 0;
      const pct = j.percent || 0;
      sumBal += bal;

      if (bal > largestBal) {
        largestBal = bal;
        largestName = j.nameVi;
      }

      if (pct > topAllocPct) {
        topAllocPct = pct;
        topAllocName = j.nameVi;
      }
    });

    const averageJarBalance = activeJars.length > 0 ? Math.round(sumBal / activeJars.length) : 0;
    const totalAlloc = activeJars.reduce((sum, j) => sum + (j.percent || 0), 0);
    const complianceScore = Math.max(0, 100 - Math.abs(100 - totalAlloc) * 5);

    return {
      largestJarName: largestName,
      largestJarBalance: largestBal,
      topAllocatedJarName: topAllocName,
      topAllocatedPercent: topAllocPct,
      averageJarBalance,
      complianceScore
    };
  }
}
