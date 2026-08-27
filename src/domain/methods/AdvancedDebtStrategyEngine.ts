/**
 * Daily Finance 3.0 — D2-003: AdvancedDebtStrategyEngine
 * Safe domain extension for Debt Snowball (lowest balance first) vs Debt Avalanche (highest interest rate first).
 * Precise monthly amortization calculations with payment acceleration rollover.
 */

import { DebtItem } from '../../types';
import {
  DebtMonthlyPaymentSchedule,
  DebtStrategySimulationResult,
  DebtStrategyComparisonResult
} from './types';

interface DebtSimulationState {
  id: string;
  title: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
}

export class AdvancedDebtStrategyEngine {
  /**
   * Simulates a single payoff strategy (snowball or avalanche).
   */
  static simulateStrategy(
    debts: DebtItem[],
    extraMonthlyPayment: number = 0,
    strategy: 'snowball' | 'avalanche' = 'avalanche'
  ): DebtStrategySimulationResult {
    const validExtra = Math.max(0, extraMonthlyPayment);

    // Filter active debts with remaining balances
    const activeDebts: DebtSimulationState[] = debts
      .filter((d) => !d.isSoftDeleted && (d.remainingAmount > 0 || d.originalAmount > 0))
      .map((d) => ({
        id: d.id,
        title: d.title,
        balance: d.remainingAmount > 0 ? d.remainingAmount : d.originalAmount,
        annualRate: Math.max(0, d.interestRate),
        minimumPayment: Math.max(10_000, d.minimumMonthlyPayment || Math.round((d.remainingAmount || d.originalAmount) * 0.03))
      }));

    if (activeDebts.length === 0) {
      return {
        strategy,
        nameVi: strategy === 'snowball' ? 'Phương pháp Quả cầu tuyết (Snowball)' : 'Phương pháp Tuyết lở (Avalanche)',
        totalMonths: 0,
        totalInterestPaid: 0,
        totalPrincipalPaid: 0,
        totalAmountPaid: 0,
        debtPayoffOrder: [],
        schedule: []
      };
    }

    // Sort priority order based on strategy
    if (strategy === 'snowball') {
      // Lowest balance first
      activeDebts.sort((a, b) => a.balance - b.balance);
    } else {
      // Highest interest rate first
      activeDebts.sort((a, b) => b.annualRate - a.annualRate);
    }

    const debtPayoffOrder: string[] = [];
    const schedule: DebtMonthlyPaymentSchedule[] = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    let month = 0;
    const maxMonthsLimit = 360; // 30 years safety cap

    while (activeDebts.some((d) => d.balance > 0) && month < maxMonthsLimit) {
      month++;
      let monthlyInterestPaid = 0;
      let monthlyPrincipalPaid = 0;
      let availableExtra = validExtra;
      const clearedInThisMonth: string[] = [];

      // Step 1: Accrue monthly interest & Pay minimum on all active debts
      for (const debt of activeDebts) {
        if (debt.balance <= 0) {
          // Rollover freed up minimum payment to extra payment pool
          availableExtra += debt.minimumPayment;
          continue;
        }

        const monthlyRate = debt.annualRate / 100 / 12;
        const interestAccrued = Math.round(debt.balance * monthlyRate);
        debt.balance += interestAccrued;
        monthlyInterestPaid += interestAccrued;

        // Minimum payment applied
        const minPay = Math.min(debt.balance, debt.minimumPayment);
        debt.balance -= minPay;
        const principalPart = Math.max(0, minPay - interestAccrued);
        monthlyPrincipalPaid += principalPart;

        if (debt.balance <= 0) {
          clearedInThisMonth.push(debt.id);
          debtPayoffOrder.push(debt.id);
          // Rollover remainder of minimum payment to extra pool
          availableExtra += Math.max(0, debt.minimumPayment - minPay);
        }
      }

      // Step 2: Apply accumulated extra payment to the #1 priority active debt
      for (const priorityDebt of activeDebts) {
        if (priorityDebt.balance > 0 && availableExtra > 0) {
          const extraPayment = Math.min(priorityDebt.balance, availableExtra);
          priorityDebt.balance -= extraPayment;
          monthlyPrincipalPaid += extraPayment;
          availableExtra -= extraPayment;

          if (priorityDebt.balance <= 0) {
            if (!clearedInThisMonth.includes(priorityDebt.id)) {
              clearedInThisMonth.push(priorityDebt.id);
              debtPayoffOrder.push(priorityDebt.id);
            }
          }
        }
      }

      totalInterestPaid += monthlyInterestPaid;
      totalPrincipalPaid += monthlyPrincipalPaid;

      const remainingBalances: Record<string, number> = {};
      let totalRemaining = 0;
      for (const d of activeDebts) {
        remainingBalances[d.id] = Math.max(0, d.balance);
        totalRemaining += Math.max(0, d.balance);
      }

      schedule.push({
        month,
        remainingBalances,
        totalRemainingBalance: totalRemaining,
        interestPaidThisMonth: monthlyInterestPaid,
        principalPaidThisMonth: monthlyPrincipalPaid,
        totalPaidThisMonth: monthlyInterestPaid + monthlyPrincipalPaid,
        clearedDebtIds: clearedInThisMonth
      });
    }

    return {
      strategy,
      nameVi: strategy === 'snowball' ? 'Phương pháp Quả cầu tuyết (Snowball)' : 'Phương pháp Tuyết lở (Avalanche)',
      totalMonths: month,
      totalInterestPaid: Math.round(totalInterestPaid),
      totalPrincipalPaid: Math.round(totalPrincipalPaid),
      totalAmountPaid: Math.round(totalInterestPaid + totalPrincipalPaid),
      debtPayoffOrder,
      schedule
    };
  }

  /**
   * Directly compares Snowball vs Avalanche strategies with comprehensive metrics.
   */
  static compareStrategies(
    debts: DebtItem[],
    extraMonthlyPayment: number = 0
  ): DebtStrategyComparisonResult {
    const snowball = this.simulateStrategy(debts, extraMonthlyPayment, 'snowball');
    const avalanche = this.simulateStrategy(debts, extraMonthlyPayment, 'avalanche');

    const interestSavingsWithAvalanche = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);
    const monthsSavedWithAvalanche = Math.max(0, snowball.totalMonths - avalanche.totalMonths);

    const recommendedStrategy = interestSavingsWithAvalanche > 1_000_000 ? 'avalanche' : 'snowball';
    const recommendationReason = recommendedStrategy === 'avalanche'
      ? `Phương pháp Tuyết lở (Avalanche) giúp tiết kiệm ${interestSavingsWithAvalanche.toLocaleString('vi-VN')} đ tiền lãi và trả hết nợ nhanh hơn.`
      : 'Phương pháp Quả cầu tuyết (Snowball) mang lại động lực tâm lý mạnh mẽ bằng cách tất toán các khoản nợ nhỏ trước.';

    return {
      snowball,
      avalanche,
      interestSavingsWithAvalanche,
      monthsSavedWithAvalanche,
      recommendedStrategy,
      recommendationReason
    };
  }
}
