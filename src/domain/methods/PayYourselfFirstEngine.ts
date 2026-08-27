/**
 * Daily Finance 3.0 — D2-003: PayYourselfFirstEngine
 * Safe domain extension for Pay Yourself First (Reverse Budgeting).
 * Automatically allocates designated savings & investment portions first, leaving remainder for living expenses.
 */

import {
  PayYourselfFirstBucketConfig,
  PayYourselfFirstResult,
  PayYourselfFirstBucketAllocation,
  PayYourselfFirstFeasibility
} from './types';

export const DEFAULT_PAY_YOURSELF_FIRST_BUCKETS: PayYourselfFirstBucketConfig[] = [
  {
    key: 'emergency',
    nameVi: 'Quỹ Dự phòng Khẩn cấp',
    nameEn: 'Emergency Fund',
    percentageOfSavings: 40
  },
  {
    key: 'investments',
    nameVi: 'Đầu tư Tăng trưởng',
    nameEn: 'Growth Investments',
    percentageOfSavings: 40
  },
  {
    key: 'goals',
    nameVi: 'Mục tiêu Tài chính Ngắn hạn',
    nameEn: 'Short-term Goals',
    percentageOfSavings: 20
  }
];

export class PayYourselfFirstEngine {
  /**
   * Calculates the savings allocation split and remainder for living expenses.
   */
  static calculateAllocation(
    income: number,
    savingsRatePercent: number = 20,
    customBuckets: PayYourselfFirstBucketConfig[] = DEFAULT_PAY_YOURSELF_FIRST_BUCKETS
  ): PayYourselfFirstResult {
    const validIncome = Math.max(0, income);
    const validRate = Math.min(100, Math.max(0, savingsRatePercent));

    const totalSavingsAllocated = Math.round((validIncome * validRate) / 100);
    const remainderForLivingExpenses = validIncome - totalSavingsAllocated;

    const bucketAllocations: PayYourselfFirstBucketAllocation[] = customBuckets.map((bucket) => {
      const amount = Math.round((totalSavingsAllocated * bucket.percentageOfSavings) / 100);
      const percentageOfTotalIncome = validIncome > 0
        ? Number(((amount / validIncome) * 100).toFixed(1))
        : 0;

      return {
        key: bucket.key,
        nameVi: bucket.nameVi,
        nameEn: bucket.nameEn,
        amount,
        percentageOfSavings: bucket.percentageOfSavings,
        percentageOfTotalIncome
      };
    });

    return {
      totalIncome: validIncome,
      savingsRatePercent: validRate,
      totalSavingsAllocated,
      remainderForLivingExpenses,
      bucketAllocations
    };
  }

  /**
   * Evaluates if the remaining income after savings is sufficient to cover fixed baseline living expenses.
   */
  static assessFeasibility(
    income: number,
    fixedExpenses: number,
    desiredSavingsRate: number = 20
  ): PayYourselfFirstFeasibility {
    const allocation = this.calculateAllocation(income, desiredSavingsRate);
    const surplusDeficit = allocation.remainderForLivingExpenses - Math.max(0, fixedExpenses);
    const isFeasible = surplusDeficit >= 0;

    let advice = 'Kế hoạch tiết kiệm hoàn toàn khả thi và cân bằng với sinh hoạt phí.';
    if (!isFeasible) {
      const maxPossibleRate = income > 0
        ? Math.max(0, Math.floor(((income - fixedExpenses) / income) * 100))
        : 0;
      advice = `Khoản dư sau tiết kiệm không đủ trả sinh hoạt phí cố định (thiếu hụt ${Math.abs(surplusDeficit).toLocaleString('vi-VN')} đ). Hãy hạ tỷ lệ tiết kiệm xuống tối đa ${maxPossibleRate}%.`;
    }

    return {
      isFeasible,
      totalIncome: allocation.totalIncome,
      savingsAllocated: allocation.totalSavingsAllocated,
      remainderForLiving: allocation.remainderForLivingExpenses,
      fixedExpenses,
      surplusDeficit,
      advice
    };
  }
}
