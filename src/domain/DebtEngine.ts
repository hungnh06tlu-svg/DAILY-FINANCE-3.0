/**
 * Daily Finance 2.5 - DebtEngine
 * Domain Engine - Pure business orchestration for Debt & Loan domain.
 * Delegates arithmetic exclusively to FinancialTruthEngine.
 * Uses IdGenerator for all generated identifiers.
 * Zero UI, zero rendering, zero direct side-effects, zero repository access.
 */

import {
  DebtItem,
  DebtStatus,
  DebtSummary,
  DebtStatistics,
  DebtForecast,
  DebtAlert,
  DebtReminder,
  DebtSchedule,
  Repayment,
  InterestPolicy,
  Language
} from '../types';
import { FinancialTruthEngine } from './FinancialTruthEngine';
import { DebtMapper } from './DebtMapper';
import { IdGenerator } from '../services/IdGenerator';

export class DebtEngine {
  /**
   * TASK 7: Evaluates the lifecycle status of a debt or loan item.
   */
  static evaluateLifecycle(item: DebtItem): DebtStatus {
    if (item.isSoftDeleted) return 'soft_deleted';
    if (item.remainingAmount <= 0) return 'completed';
    if (item.status === 'archived' || item.status === 'paused' || item.status === 'draft') {
      return item.status;
    }
    return item.status || 'active';
  }

  /**
   * TASK 9: Evaluates interest policy configuration.
   */
  static evaluateInterestPolicy(item: DebtItem): InterestPolicy {
    const policyType = item.interestPolicy || 'fixed_interest';
    return {
      policyType,
      annualRate: item.interestRate || 0
    };
  }

  /**
   * TASK 10 & 11: Generates repayment schedule breakdown for a debt item.
   */
  static generateSchedule(
    item: DebtItem,
    repayments: Repayment[] = [],
    language: Language = 'vi'
  ): DebtSchedule[] {
    const totalAmount = Math.max(0, item.originalAmount || 0);
    const monthlyPayment = Math.max(1, item.minimumMonthlyPayment || Math.round(totalAmount / 12) || 1);
    const totalInstallments = Math.max(1, Math.ceil(totalAmount / monthlyPayment));

    const itemRepayments = repayments.filter((r) => r.debtId === item.id);
    const totalPaid = itemRepayments.reduce((sum, r) => sum + r.amount, 0);

    const schedule: DebtSchedule[] = [];
    let runningBalance = totalAmount;

    const baseDueDate = item.dueDate ? new Date(item.dueDate) : new Date();

    for (let i = 1; i <= Math.min(totalInstallments, 60); i++) {
      const amountDue = Math.min(monthlyPayment, runningBalance);
      const interestPortion = Math.round((runningBalance * (item.interestRate || 0)) / 100 / 12);
      const principalPortion = Math.max(0, amountDue - interestPortion);

      runningBalance = Math.max(0, runningBalance - amountDue);

      const dueDateObj = new Date(baseDueDate);
      dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
      const dueDateStr = dueDateObj.toISOString().split('T')[0];

      const isPaid = totalPaid >= i * monthlyPayment || runningBalance === 0;

      schedule.push({
        installmentNumber: i,
        dueDate: dueDateStr,
        amountDue,
        formattedAmountDue: '',
        principalPortion,
        interestPortion,
        remainingBalanceAfter: runningBalance,
        isPaid
      });

      if (runningBalance <= 0) break;
    }

    return schedule;
  }

  /**
   * TASK 11 & 13: Calculates overall summary for Debt & Loan domain.
   * Delegates debt progress arithmetic exclusively to FinancialTruthEngine.
   */
  static calculateSummary(
    items: DebtItem[] = [],
    repayments: Repayment[] = [],
    language: Language = 'vi'
  ): DebtSummary {
    const activeItems = items.filter((i) => !i.isSoftDeleted);

    // TASK 13: Delegate core debt calculations to FinancialTruthEngine
    const truthProgress = FinancialTruthEngine.calculateDebtProgress(activeItems);

    let totalDebt = 0;
    let totalLoan = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;

    activeItems.forEach((d) => {
      const orig = Math.max(0, d.originalAmount || 0);
      const rem = Math.max(0, d.remainingAmount || 0);
      const paid = Math.max(0, d.paidAmount !== undefined ? d.paidAmount : orig - rem);

      if (d.type === 'debt') {
        totalDebt += orig;
      } else {
        totalLoan += orig;
      }

      totalPaidAmount += paid;
      totalRemainingAmount += rem;
    });

    const netDebtBalance = totalDebt - totalLoan;
    const totalOutstandingBalance = truthProgress.remainingDebt;

    // Estimate interest paid / remaining based on average interest rate
    let totalInterestPaid = 0;
    let totalInterestRemaining = 0;

    activeItems.forEach((d) => {
      const annualRate = d.interestRate || 0;
      if (annualRate > 0) {
        const estInterestYear = (d.originalAmount * annualRate) / 100;
        totalInterestRemaining += Math.round((estInterestYear * (d.remainingAmount / d.originalAmount)));
      }
    });

    return {
      totalDebt,
      formattedTotalDebt: '',
      totalLoan,
      formattedTotalLoan: '',
      netDebtBalance,
      formattedNetDebtBalance: '',
      totalOutstandingBalance,
      formattedOutstandingBalance: '',
      totalPaidAmount,
      formattedTotalPaidAmount: '',
      totalRemainingAmount,
      formattedTotalRemainingAmount: '',
      totalInterestPaid,
      formattedTotalInterestPaid: '',
      totalInterestRemaining,
      formattedTotalInterestRemaining: '',
      activeDebtsCount: activeItems.filter((i) => i.type === 'debt' && i.remainingAmount > 0).length,
      activeLoansCount: activeItems.filter((i) => i.type === 'loan' && i.remainingAmount > 0).length
    };
  }

  /**
   * TASK 0 & 11: Calculates statistics for debt portfolio.
   */
  static calculateStatistics(items: DebtItem[] = []): DebtStatistics {
    const activeItems = items.filter((i) => !i.isSoftDeleted && i.remainingAmount > 0);

    let highestInterestRate = 0;
    let highestInterestTitle: string | undefined;
    let largestAmount = 0;
    let largestTitle: string | undefined;
    let sumRate = 0;

    activeItems.forEach((d) => {
      const rate = d.interestRate || 0;
      sumRate += rate;

      if (rate > highestInterestRate) {
        highestInterestRate = rate;
        highestInterestTitle = d.title;
      }

      if (d.originalAmount > largestAmount) {
        largestAmount = d.originalAmount;
        largestTitle = d.title;
      }
    });

    const averageInterestRate = activeItems.length > 0 ? parseFloat((sumRate / activeItems.length).toFixed(2)) : 0;

    return {
      highestInterestRate,
      highestInterestDebtTitle: highestInterestTitle,
      largestDebtTitle: largestTitle,
      largestDebtAmount: largestAmount,
      averageInterestRate
    };
  }

  /**
   * TASK 11 & 13: Calculates projected debt completion forecast.
   */
  static calculateForecast(
    items: DebtItem[] = [],
    repayments: Repayment[] = [],
    language: Language = 'vi'
  ): DebtForecast {
    const activeDebts = items.filter((i) => !i.isSoftDeleted && i.type === 'debt' && i.remainingAmount > 0);
    const truthProgress = FinancialTruthEngine.calculateDebtProgress(activeDebts);

    let totalMonthlyMinPayment = 0;
    activeDebts.forEach((d) => {
      totalMonthlyMinPayment += d.minimumMonthlyPayment || Math.round(d.originalAmount / 12) || 1;
    });

    const remainingDebt = truthProgress.remainingDebt;
    const projectedMonthsToClear = totalMonthlyMinPayment > 0 ? Math.ceil(remainingDebt / totalMonthlyMinPayment) : 0;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + projectedMonthsToClear);
    const forecastCompletionDate = targetDate.toISOString().split('T')[0];

    // Estimate total projected interest over remaining tenure
    let totalProjectedInterest = 0;
    activeDebts.forEach((d) => {
      if (d.interestRate > 0) {
        const estAnnualInterest = (d.remainingAmount * d.interestRate) / 100;
        totalProjectedInterest += Math.round(estAnnualInterest * (projectedMonthsToClear / 12));
      }
    });

    return {
      forecastCompletionDate,
      projectedMonthsToClear,
      totalProjectedInterest,
      formattedTotalProjectedInterest: '',
      forecastStatus: projectedMonthsToClear <= 12 ? 'on_track' : projectedMonthsToClear <= 36 ? 'delayed' : 'accelerated'
    };
  }

  /**
   * TASK 12: Evaluates and generates debt alerts (overdue, due today, high interest, large exposure).
   */
  static evaluateAlerts(
    items: DebtItem[] = [],
    language: Language = 'vi',
    nowStr: string = new Date().toISOString().split('T')[0]
  ): DebtAlert[] {
    const alerts: DebtAlert[] = [];
    const activeItems = items.filter((i) => !i.isSoftDeleted && i.remainingAmount > 0);

    activeItems.forEach((d) => {
      if (d.dueDate < nowStr) {
        alerts.push({
          id: IdGenerator.generateId('alt_overdue'),
          message: language === 'vi'
            ? `Cảnh báo quá hạn: ${d.title} (${d.counterparty}) đã quá hạn ngày ${d.dueDate}!`
            : `Overdue alert: ${d.title} (${d.counterparty}) was due on ${d.dueDate}!`,
          level: 'overdue',
          debtId: d.id,
          dueDate: d.dueDate
        });
      } else if (d.dueDate === nowStr) {
        alerts.push({
          id: IdGenerator.generateId('alt_today'),
          message: language === 'vi'
            ? `Thanh toán hôm nay: ${d.title} cần thanh toán trong hôm nay!`
            : `Due today: ${d.title} is due today!`,
          level: 'payment_due_today',
          debtId: d.id,
          dueDate: d.dueDate
        });
      }

      // High interest alert (> 18% per year)
      if (d.interestRate >= 18) {
        alerts.push({
          id: IdGenerator.generateId('alt_high_int'),
          message: language === 'vi'
            ? `Lãi suất cao (${d.interestRate}%/năm): ${d.title}. Đề xuất ưu tiên trả trước.`
            : `High interest rate (${d.interestRate}%/yr): ${d.title}. Consider early payoff.`,
          level: 'high_interest',
          debtId: d.id
        });
      }

      // Large debt exposure (> 100M VND)
      if (d.remainingAmount >= 100000000) {
        alerts.push({
          id: IdGenerator.generateId('alt_large_debt'),
          message: language === 'vi'
            ? `Khoản nợ lớn: ${d.title} còn lại ${d.remainingAmount}.`
            : `Large exposure: ${d.title} remaining balance ${d.remainingAmount}.`,
          level: 'large_debt_exposure',
          debtId: d.id
        });
      }
    });

    return alerts;
  }

  /**
   * TASK 12 & 15: Evaluates reminders for upcoming and overdue payments.
   */
  static evaluateReminders(
    items: DebtItem[] = [],
    language: Language = 'vi',
    nowStr: string = new Date().toISOString().split('T')[0]
  ): { upcoming: DebtReminder[]; overdue: DebtReminder[] } {
    const upcoming: DebtReminder[] = [];
    const overdue: DebtReminder[] = [];

    const activeItems = items.filter((i) => !i.isSoftDeleted && i.remainingAmount > 0);

    const nowTime = new Date(nowStr).getTime();

    activeItems.forEach((d) => {
      const dueTime = new Date(d.dueDate).getTime();
      const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

      const amountDue = d.minimumMonthlyPayment || d.remainingAmount;

      const reminder: DebtReminder = {
        id: IdGenerator.generateId('rem'),
        debtId: d.id,
        title: d.title,
        dueDate: d.dueDate,
        amountDue,
        formattedAmountDue: '',
        isOverdue: diffDays < 0,
        daysRemaining: diffDays
      };

      if (diffDays < 0) {
        overdue.push(reminder);
      } else if (diffDays <= 30) {
        upcoming.push(reminder);
      }
    });

    return { upcoming, overdue };
  }

  /**
   * TASK 6 & 10: Applies repayment transaction to a debt item.
   * Generates repayment model using IdGenerator for IDs.
   */
  static applyRepayment(
    item: DebtItem,
    amount: number,
    note?: string,
    now: Date = new Date()
  ): { updatedItem: DebtItem; repayment: Repayment } {
    const orig = item.originalAmount || 0;
    const currentRemaining = item.remainingAmount || orig;
    const newRemaining = Math.max(0, currentRemaining - amount);
    const newPaid = (item.paidAmount || (orig - currentRemaining)) + amount;

    const updatedItem: DebtItem = {
      ...item,
      remainingAmount: newRemaining,
      paidAmount: newPaid,
      status: newRemaining <= 0 ? 'completed' : item.status,
      updatedAt: now.toISOString()
    };

    const repayment: Repayment = {
      id: IdGenerator.generateId('rep'),
      debtId: item.id,
      amount,
      formattedAmount: '',
      principalAmount: amount,
      interestAmount: 0,
      date: now.toISOString().split('T')[0],
      note: note || `Thanh toán khoản ${item.title}`
    };

    return { updatedItem, repayment };
  }
}
