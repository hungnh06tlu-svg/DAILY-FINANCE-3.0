/**
 * Daily Finance 3.0 — D2-003S5: Presentation Integration Smoke & Verification Suite
 * Tests all 10 Financial Method ViewModels to ensure correct UiState structure and zero deviation from Engines.
 */

import { describe, it, expect } from 'vitest';
import {
  AdvancedJarViewModel,
  AdvancedFireViewModel,
  FiftyThirtyTwentyViewModel,
  RuleOf72ViewModel,
  AdvancedDebtViewModel,
  ZeroBasedBudgetViewModel,
  SinkingFundViewModel,
  PayYourselfFirstViewModel,
  FiftyTwoWeekViewModel,
  DCAViewModel
} from '../viewmodels/methods';
import { Jar, JarTarget, DebtItem, Transaction } from '../types';

describe('D2-003S5: Presentation Layer ViewModels Smoke Test', () => {
  // 1. Advanced Jar ViewModel
  it('1. AdvancedJarViewModel returns valid allocation and target UiState', async () => {
    const vm = new AdvancedJarViewModel();
    const state = await vm.getAllocationUiState(
      [
        { spaceId: 'sp1', amount: 10000000 },
        { spaceId: 'sp2', amount: 5000000 }
      ],
      [
        { jarKey: 'NEC', percent: 55 },
        { jarKey: 'FFA', percent: 45 }
      ]
    );

    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.allocationResult).not.toBeNull();
    expect(state.allocationResult?.totalIncome).toBe(15000000);
    expect(state.allocationResult?.allocations).toHaveLength(4);

    const jars: Jar[] = [{ id: 'j1', key: 'NEC', nameVi: 'Thiết yếu', nameEn: 'Necessities', currentBalance: 5000000, color: '#000', percent: 55 }];
    const targets: JarTarget[] = [{ id: 't1', jarId: 'j1', targetAmount: 10000000, formattedTargetAmount: '10.000.000 ₫', currentBalance: 5000000, progressPercent: 50, isReached: false, targetDate: '2026-12-31' }];
    const targetState = await vm.evaluateTargetsUiState(jars, targets);
    expect(targetState.targetProgresses).toHaveLength(1);
    expect(targetState.targetProgresses[0].progressPercent).toBe(50);
  });

  // 2. Advanced FIRE ViewModel
  it('2. AdvancedFireViewModel computes 5 FIRE models comprehensive report', async () => {
    const vm = new AdvancedFireViewModel();
    const state = await vm.getComprehensiveFireReport({
      currentAge: 30,
      targetRetirementAge: 45,
      monthlyExpenses: 20000000,
      currentNetWorth: 500000000,
      expectedAnnualReturn: 8,
      safeWithdrawalRate: 4
    });

    expect(state.isLoading).toBe(false);
    expect(state.report).not.toBeNull();
    expect(state.leanFire).not.toBeNull();
    expect(state.regularFire).not.toBeNull();
    expect(state.fatFire).not.toBeNull();
    expect(state.coastFire).not.toBeNull();
    expect(state.baristaFire).not.toBeNull();
    expect(state.regularFire?.targetNetWorth).toBe(6000000000);
  });

  // 3. 50/30/20 ViewModel
  it('3. FiftyThirtyTwentyViewModel evaluates budget and transactions compliance', async () => {
    const vm = new FiftyThirtyTwentyViewModel();
    const txs: Transaction[] = [
      { id: 'tx1', spaceId: 'sp1', type: 'expense', amount: 5000000, category: 'rent', currency: 'VND', date: '2026-08-01', method: 'cash' },
      { id: 'tx2', spaceId: 'sp1', type: 'expense', amount: 3000000, category: 'dining', currency: 'VND', date: '2026-08-02', method: 'cash' }
    ];
    const state = await vm.evaluateSpending(20000000, txs);

    expect(state.isLoading).toBe(false);
    expect(state.budget).not.toBeNull();
    expect(state.budget?.needsBudget).toBe(10000000);
    expect(state.budget?.wantsBudget).toBe(6000000);
    expect(state.budget?.savingsBudget).toBe(4000000);
    expect(state.evaluation?.complianceScore).toBeGreaterThanOrEqual(0);
  });

  // 4. Rule of 72 ViewModel
  it('4. RuleOf72ViewModel calculates doubling, inflation halving and milestones', async () => {
    const vm = new RuleOf72ViewModel();
    const state = await vm.calculate(12, 4, 100000000, 2026);

    expect(state.isLoading).toBe(false);
    expect(state.doublingResult?.yearsToDoubleApproximation).toBe(6);
    expect(state.inflationResult?.yearsToHalvePurchasingPower).toBe(18);
    expect(state.milestones).toHaveLength(5);
    expect(state.milestones[0].value).toBe(200000000);
  });

  // 5. Advanced Debt ViewModel
  it('5. AdvancedDebtViewModel compares Snowball vs Avalanche payoff strategies', async () => {
    const vm = new AdvancedDebtViewModel();
    const debts: DebtItem[] = [
      { id: 'd1', spaceId: 'sp1', title: 'Card', counterparty: 'Bank', dueDate: '2026-12-31', type: 'debt', originalAmount: 20000000, remainingAmount: 10000000, interestRate: 20, minimumMonthlyPayment: 1000000 },
      { id: 'd2', spaceId: 'sp1', title: 'Loan', counterparty: 'Bank', dueDate: '2027-12-31', type: 'debt', originalAmount: 50000000, remainingAmount: 30000000, interestRate: 10, minimumMonthlyPayment: 1500000 }
    ];
    const state = await vm.compareStrategies(debts, 1000000);

    expect(state.isLoading).toBe(false);
    expect(state.comparison).not.toBeNull();
    expect(state.snowball?.totalMonths).toBeGreaterThan(0);
    expect(state.avalanche?.totalMonths).toBeGreaterThan(0);
  });

  // 6. Zero-Based Budget ViewModel
  it('6. ZeroBasedBudgetViewModel creates plan and reconciles envelopes', async () => {
    const vm = new ZeroBasedBudgetViewModel();
    const state = await vm.createPlan(10000000, [
      { id: 'e1', name: 'Rent', category: 'Housing', allocatedAmount: 6000000, type: 'necessity' },
      { id: 'e2', name: 'Food', category: 'Food', allocatedAmount: 4000000, type: 'necessity' }
    ]);

    expect(state.plan?.isBalancedToZero).toBe(true);
    expect(state.plan?.leftoverToAssign).toBe(0);

    const recState = await vm.reconcileActual(state.plan!, []);
    expect(recState.reconciliation?.envelopesReconciled).toHaveLength(2);
  });

  // 7. Sinking Fund ViewModel
  it('7. SinkingFundViewModel calculates monthly contribution recommendations', async () => {
    const vm = new SinkingFundViewModel();
    const state = await vm.calculateFund(12000000, 0, '2027-08-01', new Date('2026-08-01'));

    expect(state.isLoading).toBe(false);
    expect(state.contribution?.monthsRemaining).toBe(12);
    expect(state.contribution?.recommendedMonthlyContribution).toBe(1000000);
    expect(state.schedule.length).toBeGreaterThan(0);
  });

  // 8. Pay Yourself First ViewModel
  it('8. PayYourselfFirstViewModel calculates savings allocation and assesses feasibility', async () => {
    const vm = new PayYourselfFirstViewModel();
    const state = await vm.calculateAllocation(30000000, 20, undefined, 15000000);

    expect(state.isLoading).toBe(false);
    expect(state.allocation?.totalSavingsAllocated).toBe(6000000);
    expect(state.allocation?.remainderForLivingExpenses).toBe(24000000);
    expect(state.feasibility?.isFeasible).toBe(true);
  });

  // 9. 52-Week Money Challenge ViewModel
  it('9. FiftyTwoWeekViewModel generates schedule and evaluates streaks', async () => {
    const vm = new FiftyTwoWeekViewModel();
    const state = await vm.getScheduleAndProgress(10000, 'standard', [1, 2, 3]);

    expect(state.isLoading).toBe(false);
    expect(state.schedule?.items).toHaveLength(52);
    expect(state.schedule?.totalGoal).toBe(13780000);
    expect(state.progress?.completedWeeksCount).toBe(3);
    expect(state.progress?.currentStreak).toBe(3);
  });

  // 10. DCA ViewModel
  it('10. DCAViewModel simulates DCA and compares with Lump-Sum', async () => {
    const vm = new DCAViewModel();
    const prices = [100, 90, 80, 70, 85, 95, 110];
    const state = await vm.compareDCAvsLumpSum(1000000, prices);

    expect(state.isLoading).toBe(false);
    expect(state.simulation?.periods).toHaveLength(7);
    expect(state.comparison?.winner).toBeDefined();
    expect(state.comparison?.dcaAverageCost).toBeGreaterThan(0);
  });
});
