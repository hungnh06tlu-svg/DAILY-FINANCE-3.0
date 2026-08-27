/**
 * Daily Finance 3.0 — D2-003: Financial Methods Engine Suite Test
 * Comprehensive unit tests for all 10 specialized financial method engines.
 * Validates algorithmic correctness, mathematical precision, boundary conditions, and invariant stability.
 */

import { describe, it, expect } from 'vitest';
import {
  AdvancedJarEngine,
  AdvancedFireEngine,
  FiftyThirtyTwentyEngine,
  RuleOf72Engine,
  AdvancedDebtStrategyEngine,
  ZeroBasedBudgetEngine,
  SinkingFundEngine,
  PayYourselfFirstEngine,
  FiftyTwoWeekChallengeEngine,
  DCAEngine,
  SinkingFund
} from '../domain/methods';
import { Jar, JarTarget, DebtItem, Transaction } from '../types';

describe('D2-003: Financial Methods Engine Suite', () => {

  // ==========================================================================
  // 1. ADVANCED JAR ENGINE
  // ==========================================================================
  describe('1. AdvancedJarEngine', () => {
    it('allocates multi-space income preserving space breakdown and jar allocations', () => {
      const spaceIncomes = [
        { spaceId: 'sp_personal', amount: 10_000_000 },
        { spaceId: 'sp_business', amount: 20_000_000 }
      ];

      const result = AdvancedJarEngine.allocateMultiSpaceIncome(spaceIncomes);
      expect(result.totalIncome).toBe(30_000_000);
      expect(result.spaceBreakdown['sp_personal']).toBe(10_000_000);
      expect(result.spaceBreakdown['sp_business']).toBe(20_000_000);
      // NEC is 55% -> 55% of 30M = 16,500,000
      expect(result.allocatedByJarKey['NEC']).toBe(16_500_000);
      // FFA is 10% -> 10% of 30M = 3,000,000
      expect(result.allocatedByJarKey['FFA']).toBe(3_000_000);
      expect(result.allocations.length).toBe(12); // 2 spaces * 6 jars
    });

    it('calculates jar target progress accurately with status transitions', () => {
      const mockJar: Jar = {
        id: 'jar_ffa',
        key: 'FFA',
        nameVi: 'Tự do tài chính',
        nameEn: 'Financial Freedom',
        percent: 10,
        currentBalance: 8_000_000,
        color: '#10B981',
        descriptionVi: '',
        descriptionEn: '',
        spaceId: 'sp_personal',
        targetAmount: 10_000_000,
        status: 'active',
        ruleType: 'percentage',
        isEnabled: true,
        isCustom: false,
        isSoftDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockTarget: JarTarget = {
        id: 'target_1',
        jarId: 'jar_ffa',
        targetAmount: 10_000_000,
        formattedTargetAmount: '10.000.000 đ',
        currentBalance: 8_000_000,
        progressPercent: 80,
        isReached: false
      };

      const progress = AdvancedJarEngine.calculateJarTargetProgress(mockJar, mockTarget);
      expect(progress.targetAmount).toBe(10_000_000);
      expect(progress.currentBalance).toBe(8_000_000);
      expect(progress.remainingAmount).toBe(2_000_000);
      expect(progress.progressPercent).toBe(80);
      expect(progress.isReached).toBe(false);
      expect(progress.status).toBe('on_track');
    });

    it('triggers auto-transfers when threshold is reached', () => {
      const jars: Jar[] = [
        {
          id: 'jar_nec',
          key: 'NEC',
          nameVi: 'Thiết yếu',
          nameEn: 'Necessities',
          percent: 55,
          currentBalance: 15_000_000,
          color: '#3B82F6',
          descriptionVi: '',
          descriptionEn: '',
          spaceId: 'sp_personal',
          targetAmount: 0,
          status: 'active',
          ruleType: 'percentage',
          isEnabled: true,
          isCustom: false,
          isSoftDeleted: false,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'jar_ffa',
          key: 'FFA',
          nameVi: 'Tự do tài chính',
          nameEn: 'Financial Freedom',
          percent: 10,
          currentBalance: 2_000_000,
          color: '#10B981',
          descriptionVi: '',
          descriptionEn: '',
          spaceId: 'sp_personal',
          targetAmount: 0,
          status: 'active',
          ruleType: 'percentage',
          isEnabled: true,
          isCustom: false,
          isSoftDeleted: false,
          createdAt: '',
          updatedAt: ''
        }
      ];

      const rules = [
        {
          fromJarId: 'jar_nec',
          toJarId: 'jar_ffa',
          thresholdBalance: 10_000_000,
          transferAmount: 3_000_000,
          description: 'Transfer surplus NEC to FFA'
        }
      ];

      const actions = AdvancedJarEngine.generateAutoTransfers(jars, rules);
      expect(actions.length).toBe(1);
      expect(actions[0].fromJarId).toBe('jar_nec');
      expect(actions[0].toJarId).toBe('jar_ffa');
      expect(actions[0].amount).toBe(3_000_000);
    });

    it('generates rebalancing plan based on target percentages', () => {
      const jars: Jar[] = [
        { id: 'j1', key: 'NEC', nameVi: 'NEC', nameEn: 'NEC', percent: 55, currentBalance: 8_000_000, color: '', descriptionVi: '', descriptionEn: '', spaceId: 'sp1', targetAmount: 0, status: 'active', ruleType: 'percentage', isEnabled: true, isCustom: false, isSoftDeleted: false, createdAt: '', updatedAt: '' },
        { id: 'j2', key: 'FFA', nameVi: 'FFA', nameEn: 'FFA', percent: 10, currentBalance: 2_000_000, color: '', descriptionVi: '', descriptionEn: '', spaceId: 'sp1', targetAmount: 0, status: 'active', ruleType: 'percentage', isEnabled: true, isCustom: false, isSoftDeleted: false, createdAt: '', updatedAt: '' }
      ];

      // Total is 10M. Target 50% for NEC (5M) and 50% for FFA (5M)
      const plan = AdvancedJarEngine.rebalanceJars(jars, { NEC: 50, FFA: 50 });
      expect(plan.length).toBe(2);
      expect(plan[0].targetBalance).toBe(5_000_000);
      expect(plan[0].action).toBe('withdraw');
      expect(plan[0].delta).toBe(-3_000_000);

      expect(plan[1].targetBalance).toBe(5_000_000);
      expect(plan[1].action).toBe('deposit');
      expect(plan[1].delta).toBe(3_000_000);
    });
  });

  // ==========================================================================
  // 2. ADVANCED FIRE ENGINE
  // ==========================================================================
  describe('2. AdvancedFireEngine', () => {
    it('calculates Lean, Regular, Fat FIRE variants with correct multipliers', () => {
      const monthlyExp = 20_000_000;
      const swr = 4.0;

      const lean = AdvancedFireEngine.calculateLeanFire(monthlyExp, swr, 0.70);
      // Lean expense: 14M/month -> 168M/year -> / 0.04 = 4.2 Billion VND
      expect(lean.monthlyExpensesAssumed).toBe(14_000_000);
      expect(lean.targetNetWorth).toBe(4_200_000_000);

      const regular = AdvancedFireEngine.calculateRegularFire(monthlyExp, swr);
      // Regular expense: 20M/month -> 240M/year -> / 0.04 = 6.0 Billion VND
      expect(regular.monthlyExpensesAssumed).toBe(20_000_000);
      expect(regular.targetNetWorth).toBe(6_000_000_000);

      const fat = AdvancedFireEngine.calculateFatFire(monthlyExp, swr, 1.50);
      // Fat expense: 30M/month -> 360M/year -> / 0.04 = 9.0 Billion VND
      expect(fat.monthlyExpensesAssumed).toBe(30_000_000);
      expect(fat.targetNetWorth).toBe(9_000_000_000);
    });

    it('calculates Coast FIRE required principal compounding to retirement', () => {
      // Age 30 to 60 (30 years compounding at 8% annual return), monthly exp 20M, SWR 4%
      // Target FIRE at 60 = 6 Billion VND
      // Principal required at age 30 = 6,000,000,000 / (1.08^30) ≈ 596,267,000 VND
      const coast = AdvancedFireEngine.calculateCoastFire(30, 60, 20_000_000, 700_000_000, 8.0, 4.0);
      expect(coast.yearsToCompound).toBe(30);
      expect(coast.requiredInvestedToday).toBeLessThan(650_000_000);
      expect(coast.requiredInvestedToday).toBeGreaterThan(550_000_000);
      expect(coast.hasCoasted).toBe(true); // 700M > ~596M
      expect(coast.surplusDeficit).toBeGreaterThan(0);
    });

    it('calculates Barista FIRE with active side-income covering partial expenses', () => {
      const barista = AdvancedFireEngine.calculateBaristaFire(25_000_000, 10_000_000, 4.0);
      // Gap covered by portfolio: 15M/month -> 180M/year -> / 0.04 = 4.5 Billion VND
      expect(barista.gapCoveredByPortfolioMonthly).toBe(15_000_000);
      expect(barista.targetNetWorth).toBe(4_500_000_000);
      expect(barista.partTimeMonthlyIncome).toBe(10_000_000);
    });

    it('generates a comprehensive FIRE report comparing all 5 variants', () => {
      const report = AdvancedFireEngine.generateComprehensiveFireReport({
        currentAge: 28,
        targetRetirementAge: 55,
        currentNetWorth: 500_000_000,
        monthlyExpenses: 15_000_000,
        safeWithdrawalRate: 4.0,
        expectedAnnualReturn: 8.0
      });

      expect(report.leanFire.targetNetWorth).toBeLessThan(report.regularFire.targetNetWorth);
      expect(report.regularFire.targetNetWorth).toBeLessThan(report.fatFire.targetNetWorth);
      expect(report.summary.fastestFireType).toBeDefined();
    });
  });

  // ==========================================================================
  // 3. 50/30/20 BUDGET ENGINE
  // ==========================================================================
  describe('3. FiftyThirtyTwentyEngine', () => {
    it('computes standard 50/30/20 budget allocations', () => {
      const result = FiftyThirtyTwentyEngine.calculateBudget(20_000_000);
      expect(result.needsBudget).toBe(10_000_000); // 50%
      expect(result.wantsBudget).toBe(6_000_000);  // 30%
      expect(result.savingsBudget).toBe(4_000_000); // 20%
    });

    it('classifies expense categories appropriately', () => {
      expect(FiftyThirtyTwentyEngine.classifyCategory('Tiền nhà & Điện nước')).toBe('needs');
      expect(FiftyThirtyTwentyEngine.classifyCategory('Shopping quần áo')).toBe('wants');
      expect(FiftyThirtyTwentyEngine.classifyCategory('Đầu tư chứng khoán')).toBe('savings');
      expect(FiftyThirtyTwentyEngine.classifyCategory('Quỹ dự phòng khẩn cấp')).toBe('savings');
      expect(FiftyThirtyTwentyEngine.classifyCategory('Cafe & Ăn hàng')).toBe('wants');
    });

    it('evaluates compliance against actual spending and generates score', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx1',
          spaceId: 'sp1',
          type: 'expense',
          amount: 5_000_000,
          currency: 'VND',
          category: 'Tiền thuê nhà',
          date: '2026-03-01',
          accountId: 'acc_cash',
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'tx2',
          spaceId: 'sp1',
          type: 'expense',
          amount: 3_000_000,
          currency: 'VND',
          category: 'Shopping & Ăn uống',
          date: '2026-03-02',
          accountId: 'acc_cash',
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'tx3',
          spaceId: 'sp1',
          type: 'saving',
          amount: 2_000_000,
          currency: 'VND',
          category: 'Tiết kiệm',
          date: '2026-03-03',
          accountId: 'acc_bank',
          createdAt: '',
          updatedAt: ''
        }
      ];

      // Income 10M -> 50% needs (5M), 30% wants (3M), 20% savings (2M) -> Perfect 100% compliance!
      const evalResult = FiftyThirtyTwentyEngine.evaluateSpending(transactions, 10_000_000);
      expect(evalResult.complianceScore).toBe(100);
      expect(evalResult.isCompliant).toBe(true);
      expect(evalResult.actual.needs).toBe(5_000_000);
      expect(evalResult.actual.wants).toBe(3_000_000);
      expect(evalResult.actual.savings).toBe(2_000_000);
    });
  });

  // ==========================================================================
  // 4. RULE OF 72 ENGINE
  // ==========================================================================
  describe('4. RuleOf72Engine', () => {
    it('calculates doubling time with both 72 rule and exact logarithmic formula', () => {
      const result = RuleOf72Engine.calculateDoublingTime(8); // 8% annual return
      expect(result.yearsToDoubleApproximation).toBe(9.00); // 72 / 8 = 9 years
      expect(result.yearsToDoubleExact).toBe(9.01); // ln(2) / ln(1.08) ≈ 9.0064
      expect(result.yearsToTripleApproximation).toBe(14.25); // 114 / 8
      expect(result.yearsToQuadrupleApproximation).toBe(18.00); // 144 / 8
    });

    it('calculates inflation purchasing power halving time', () => {
      const halving = RuleOf72Engine.calculateInflationHalving(4); // 4% inflation
      expect(halving.yearsToHalvePurchasingPower).toBe(18.00); // 72 / 4 = 18 years
      expect(halving.halvingFactor20Years).toBeLessThan(0.5); // After 20 years at 4%, <50% value remains
    });

    it('generates doubling milestone sequence', () => {
      const milestones = RuleOf72Engine.generateDoublingMilestones(100_000_000, 10, 3, 2026);
      expect(milestones.length).toBe(3);
      expect(milestones[0].value).toBe(200_000_000);
      expect(milestones[1].value).toBe(400_000_000);
      expect(milestones[2].value).toBe(800_000_000);
      expect(milestones[0].projectedYear).toBe(2026 + 7);
    });
  });

  // ==========================================================================
  // 5. ADVANCED DEBT STRATEGY ENGINE
  // ==========================================================================
  describe('5. AdvancedDebtStrategyEngine', () => {
    const sampleDebts: DebtItem[] = [
      {
        id: 'debt_card',
        title: 'Thẻ tín dụng',
        type: 'debt',
        counterparty: 'Techcombank',
        spaceId: 'sp1',
        originalAmount: 20_000_000,
        remainingAmount: 20_000_000,
        interestRate: 24.0, // 24% annual
        minimumMonthlyPayment: 1_000_000,
        dueDate: '2026-12-31',
        isSoftDeleted: false,
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'debt_personal',
        title: 'Vay tín chấp',
        type: 'debt',
        counterparty: 'VPBank',
        spaceId: 'sp1',
        originalAmount: 50_000_000,
        remainingAmount: 50_000_000,
        interestRate: 12.0, // 12% annual
        minimumMonthlyPayment: 2_000_000,
        dueDate: '2027-12-31',
        isSoftDeleted: false,
        createdAt: '',
        updatedAt: ''
      }
    ];

    it('simulates Snowball and Avalanche payoff schedules', () => {
      const comparison = AdvancedDebtStrategyEngine.compareStrategies(sampleDebts, 2_000_000);

      expect(comparison.snowball.totalMonths).toBeGreaterThan(0);
      expect(comparison.avalanche.totalMonths).toBeGreaterThan(0);
      // Avalanche pays highest rate (24%) first, saving total interest
      expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(comparison.snowball.totalInterestPaid);
      expect(comparison.interestSavingsWithAvalanche).toBeGreaterThanOrEqual(0);
      expect(comparison.recommendedStrategy).toBeDefined();
    });

    it('handles empty debt list gracefully', () => {
      const emptyComparison = AdvancedDebtStrategyEngine.compareStrategies([], 1_000_000);
      expect(emptyComparison.snowball.totalMonths).toBe(0);
      expect(emptyComparison.avalanche.totalMonths).toBe(0);
    });
  });

  // ==========================================================================
  // 6. ZERO-BASED BUDGET ENGINE
  // ==========================================================================
  describe('6. ZeroBasedBudgetEngine', () => {
    it('verifies zero balance invariant when all income is assigned', () => {
      const envelopes = [
        { id: 'e1', name: 'Nhà ở', category: 'Housing', allocatedAmount: 5_000_000, type: 'necessity' as const },
        { id: 'e2', name: 'Ăn uống', category: 'Food', allocatedAmount: 3_000_000, type: 'necessity' as const },
        { id: 'e3', name: 'Tiết kiệm', category: 'Savings', allocatedAmount: 2_000_000, type: 'savings' as const }
      ];

      const plan = ZeroBasedBudgetEngine.createPlan(10_000_000, envelopes);
      expect(plan.totalIncome).toBe(10_000_000);
      expect(plan.totalAllocated).toBe(10_000_000);
      expect(plan.leftoverToAssign).toBe(0);
      expect(plan.isBalancedToZero).toBe(true);
    });

    it('flags unassigned income when allocations do not reach total income', () => {
      const envelopes = [
        { id: 'e1', name: 'Nhà ở', category: 'Housing', allocatedAmount: 5_000_000, type: 'necessity' as const }
      ];

      const plan = ZeroBasedBudgetEngine.createPlan(10_000_000, envelopes);
      expect(plan.leftoverToAssign).toBe(5_000_000);
      expect(plan.isBalancedToZero).toBe(false);
    });

    it('reconciles envelope allocations against actual spending', () => {
      const envelopes = [
        { id: 'e1', name: 'Ăn uống', category: 'Food', allocatedAmount: 3_000_000, type: 'necessity' as const }
      ];
      const plan = ZeroBasedBudgetEngine.createPlan(3_000_000, envelopes);

      const actualTransactions: Transaction[] = [
        { id: 't1', spaceId: 's1', type: 'expense', amount: 2_500_000, currency: 'VND', category: 'Food', date: '2026-03-01', accountId: 'acc_cash', createdAt: '', updatedAt: '' }
      ];

      const reconciliation = ZeroBasedBudgetEngine.reconcileActual(plan, actualTransactions);
      expect(reconciliation.totalSpent).toBe(2_500_000);
      expect(reconciliation.totalRemaining).toBe(500_000);
      expect(reconciliation.envelopesReconciled[0].status).toBe('under_budget');
    });
  });

  // ==========================================================================
  // 7. SINKING FUND ENGINE
  // ==========================================================================
  describe('7. SinkingFundEngine', () => {
    it('calculates monthly contributions to reach target date', () => {
      // 12M target, 0 current, 6 months away -> 2M per month
      const now = new Date('2026-01-01');
      const result = SinkingFundEngine.calculateMonthlyContribution(
        12_000_000,
        0,
        '2026-07-01',
        now
      );

      expect(result.monthsRemaining).toBe(6);
      expect(result.recommendedMonthlyContribution).toBe(2_000_000);
      expect(result.isAchieved).toBe(false);
    });

    it('simulates monthly progression schedule', () => {
      const fund: SinkingFund = {
        id: 'sf_tet',
        name: 'Quỹ Tết 2027',
        targetAmount: 10_000_000,
        currentAmount: 2_000_000,
        targetDate: '2026-06-01',
        startDate: '2026-02-01'
      };

      const schedule = SinkingFundEngine.simulateFundSchedule(fund, new Date('2026-02-01'));
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[schedule.length - 1].accumulatedBalance).toBe(10_000_000);
    });

    it('verifies non-double-counting invariant between allocations and operating expenses', () => {
      const invariantHolds = SinkingFundEngine.verifyInvariantNoDoubleCount([2_000_000], [5_000_000]);
      expect(invariantHolds).toBe(true);
    });
  });

  // ==========================================================================
  // 8. PAY YOURSELF FIRST ENGINE
  // ==========================================================================
  describe('8. PayYourselfFirstEngine', () => {
    it('allocates designated savings first and calculates remainder for living', () => {
      // Income 20M, 20% savings rate = 4M savings, 16M remainder for living
      const result = PayYourselfFirstEngine.calculateAllocation(20_000_000, 20);
      expect(result.totalSavingsAllocated).toBe(4_000_000);
      expect(result.remainderForLivingExpenses).toBe(16_000_000);
      expect(result.bucketAllocations.length).toBe(3);
    });

    it('evaluates feasibility against fixed survival expenses', () => {
      // Income 20M, 20% savings (16M remainder). Fixed expenses = 10M -> Feasible!
      const feasible = PayYourselfFirstEngine.assessFeasibility(20_000_000, 10_000_000, 20);
      expect(feasible.isFeasible).toBe(true);
      expect(feasible.surplusDeficit).toBe(6_000_000);

      // Fixed expenses = 18M -> Infeasible!
      const infeasible = PayYourselfFirstEngine.assessFeasibility(20_000_000, 18_000_000, 20);
      expect(infeasible.isFeasible).toBe(false);
      expect(infeasible.surplusDeficit).toBe(-2_000_000);
    });
  });

  // ==========================================================================
  // 9. 52-WEEK CHALLENGE ENGINE
  // ==========================================================================
  describe('9. FiftyTwoWeekChallengeEngine', () => {
    it('generates standard schedule totaling 1,378 x base increment', () => {
      const schedule = FiftyTwoWeekChallengeEngine.generateSchedule(10_000, 'standard');
      expect(schedule.items.length).toBe(52);
      expect(schedule.items[0].scheduledAmount).toBe(10_000);
      expect(schedule.items[51].scheduledAmount).toBe(520_000);
      // Sum 1..52 = 52 * 53 / 2 = 1378 -> 13,780,000 VND
      expect(schedule.totalGoal).toBe(13_780_000);
    });

    it('generates reverse schedule starting with highest deposit week', () => {
      const schedule = FiftyTwoWeekChallengeEngine.generateSchedule(10_000, 'reverse');
      expect(schedule.items[0].scheduledAmount).toBe(520_000);
      expect(schedule.items[51].scheduledAmount).toBe(10_000);
      expect(schedule.totalGoal).toBe(13_780_000);
    });

    it('evaluates completion progress and streak', () => {
      const schedule = FiftyTwoWeekChallengeEngine.generateSchedule(10_000, 'standard');
      const progress = FiftyTwoWeekChallengeEngine.evaluateProgress(schedule, [1, 2, 3]);

      expect(progress.completedWeeksCount).toBe(3);
      expect(progress.totalSaved).toBe(60_000); // 10k + 20k + 30k
      expect(progress.currentStreak).toBe(3);
      expect(progress.status).toBe('on_track');
    });
  });

  // ==========================================================================
  // 10. DCA ENGINE
  // ==========================================================================
  describe('10. DCAEngine', () => {
    it('simulates DCA across fluctuating asset prices calculating units and average cost basis', () => {
      // 3 periods, 1,000,000 VND each period. Prices: 100, 50, 100
      // Period 1: 1,000,000 / 100 = 10,000 units
      // Period 2: 1,000,000 / 50 = 20,000 units
      // Period 3: 1,000,000 / 100 = 10,000 units
      // Total: 40,000 units for 3,000,000 VND. Average cost basis = 75 VND/unit.
      // Final portfolio value at price 100 = 40,000 * 100 = 4,000,000 VND (+33.33% return).
      const dca = DCAEngine.simulateDCA(1_000_000, [100, 50, 100]);

      expect(dca.totalCapitalInvested).toBe(3_000_000);
      expect(dca.totalUnitsAccumulated).toBe(40_000);
      expect(dca.averageCostBasis).toBe(75);
      expect(dca.finalPortfolioValue).toBe(4_000_000);
      expect(dca.totalReturnAmount).toBe(1_000_000);
      expect(dca.totalReturnPercent).toBe(33.33);
    });

    it('compares DCA vs Lump-Sum investing and determines winner and volatility buffer', () => {
      // Prices: 100 (initial), then dips to 50, then ends at 80
      // Total capital: 3,000,000
      // Lump sum: buys at 100 -> 30,000 units -> at 80 value = 2,400,000 (loss -20%)
      // DCA: 1M at 100 (10k) + 1M at 50 (20k) + 1M at 80 (12.5k) = 42,500 units -> at 80 value = 3,400,000 (+13.33%)
      // DCA wins due to buying during dip!
      const comparison = DCAEngine.compareDCAvsLumpSum(3_000_000, [100, 50, 80]);

      expect(comparison.winner).toBe('dca');
      expect(comparison.dca.finalPortfolioValue).toBeGreaterThan(comparison.lumpSum.finalPortfolioValue);
      expect(comparison.volatilityBufferPercent).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 11. FINANCIAL HARDENING & EDGE CASE AUDIT TESTS (G1 - G3)
  // ==========================================================================
  describe('11. Financial Hardening & Edge Cases (D2-003G)', () => {
    // Edge case: Rule of 72 with negative or zero interest rate
    it('handles negative and zero interest rates gracefully in RuleOf72Engine', () => {
      const zeroRate = RuleOf72Engine.calculateDoublingTime(0);
      expect(zeroRate.annualInterestRate).toBeGreaterThan(0);
      expect(Number.isFinite(zeroRate.yearsToDoubleApproximation)).toBe(true);

      const negativeRate = RuleOf72Engine.calculateDoublingTime(-5);
      expect(negativeRate.annualInterestRate).toBeGreaterThan(0);
      expect(Number.isFinite(negativeRate.yearsToDoubleExact)).toBe(true);
    });

    // Edge case: Coast FIRE when user is already at or past retirement age
    it('handles retirementAge <= currentAge correctly in Coast FIRE without dividing by zero', () => {
      const coast = AdvancedFireEngine.calculateCoastFire(60, 55, 20_000_000, 5_000_000_000, 8.0, 4.0);
      expect(coast.yearsToCompound).toBe(0);
      expect(coast.requiredInvestedToday).toBe(coast.targetNetWorth);
      expect(coast.hasCoasted).toBe(false);
      expect(Number.isFinite(coast.requiredInvestedToday)).toBe(true);
    });

    // Edge case: 52-Week Challenge with missing weeks evaluates broken streak correctly
    it('evaluates broken streak correctly when user misses intermediate weeks in 52-Week Challenge', () => {
      const schedule = FiftyTwoWeekChallengeEngine.generateSchedule(10_000, 'standard');
      // Completed week 1, 2, skipped week 3, completed week 4
      const progress = FiftyTwoWeekChallengeEngine.evaluateProgress(schedule, [1, 2, 4]);
      expect(progress.completedWeeksCount).toBe(3);
      expect(progress.currentStreak).toBe(2); // Streak stops at week 2 because week 3 was missed
      expect(progress.totalSaved).toBe(10_000 + 20_000 + 40_000);
    });

    // Edge case: Zero-Based Budgeting strictly enforces Income - Allocated = 0 invariant
    it('strictly checks balanced-to-zero invariant for over-allocated or under-allocated plans', () => {
      const underPlan = ZeroBasedBudgetEngine.createPlan(10_000_000, [
        { id: 'e1', name: 'Rent', category: 'Housing', allocatedAmount: 8_000_000, type: 'necessity' }
      ]);
      expect(underPlan.isBalancedToZero).toBe(false);
      expect(underPlan.leftoverToAssign).toBe(2_000_000);

      const overPlan = ZeroBasedBudgetEngine.createPlan(10_000_000, [
        { id: 'e1', name: 'Rent', category: 'Housing', allocatedAmount: 12_000_000, type: 'necessity' }
      ]);
      expect(overPlan.isBalancedToZero).toBe(false);
      expect(overPlan.leftoverToAssign).toBe(-2_000_000);
    });

    // Edge case: DCA when asset price drops drastically or goes to near zero
    it('handles dramatic market downturns without NaN or division by zero in DCAEngine', () => {
      const dcaDownturn = DCAEngine.simulateDCA(1_000_000, [1000, 500, 100, 10]);
      expect(dcaDownturn.totalCapitalInvested).toBe(4_000_000);
      expect(dcaDownturn.totalUnitsAccumulated).toBeGreaterThan(0);
      expect(Number.isFinite(dcaDownturn.averageCostBasis)).toBe(true);
      expect(dcaDownturn.totalReturnPercent).toBeLessThan(0); // In a downturn, return is negative
    });

    // Edge case: Debt engine handles zero interest debts and extreme rollover amounts
    it('simulates zero-interest debts (family loan) cleanly without amortization failure', () => {
      const debts: DebtItem[] = [
        {
          id: 'loan_family',
          title: 'Vay người thân',
          type: 'debt',
          counterparty: 'Family',
          spaceId: 'sp1',
          originalAmount: 10_000_000,
          remainingAmount: 10_000_000,
          interestRate: 0, // 0% interest
          minimumMonthlyPayment: 1_000_000,
          dueDate: '2027-01-01',
          status: 'active',
          isSoftDeleted: false,
          createdAt: '',
          updatedAt: ''
        }
      ];

      const res = AdvancedDebtStrategyEngine.simulateStrategy(debts, 0, 'snowball');
      expect(res.totalMonths).toBe(10);
      expect(res.totalInterestPaid).toBe(0);
      expect(res.totalPrincipalPaid).toBe(10_000_000);
    });

    // Edge case: Sinking Fund target date in the past defaults to safe 1 month duration
    it('handles past target dates in SinkingFundEngine by clamping to at least 1 month remaining', () => {
      const pastContribution = SinkingFundEngine.calculateMonthlyContribution(
        12_000_000,
        2_000_000,
        '2020-01-01', // Date in the past
        new Date('2026-08-01')
      );

      expect(pastContribution.monthsRemaining).toBe(1);
      expect(pastContribution.recommendedMonthlyContribution).toBe(10_000_000);
    });

    // Edge case: PayYourselfFirst with 100% savings rate
    it('handles 100% and 0% savings rates in PayYourselfFirstEngine safely', () => {
      const allSavings = PayYourselfFirstEngine.calculateAllocation(10_000_000, 100);
      expect(allSavings.totalSavingsAllocated).toBe(10_000_000);
      expect(allSavings.remainderForLivingExpenses).toBe(0);

      const zeroSavings = PayYourselfFirstEngine.calculateAllocation(10_000_000, 0);
      expect(zeroSavings.totalSavingsAllocated).toBe(0);
      expect(zeroSavings.remainderForLivingExpenses).toBe(10_000_000);
    });
  });

});
