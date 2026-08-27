/**
 * Daily Finance 3.0 — D2-003: FiftyThirtyTwentyEngine
 * Safe domain extension for the 50/30/20 Budgeting Rule (Elizabeth Warren).
 * 50% Needs (Thiết yếu), 30% Wants (Mong muốn / Hưởng thụ), 20% Savings/Investments (Tích lũy & Đầu tư).
 */

import { Transaction } from '../../types';
import {
  FiftyThirtyTwentyRatio,
  FiftyThirtyTwentyResult,
  FiftyThirtyTwentyEvaluation
} from './types';

export const DEFAULT_50_30_20_RATIO: FiftyThirtyTwentyRatio = {
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20
};

export class FiftyThirtyTwentyEngine {
  /**
   * Calculates the target budget allocation for a given net income.
   */
  static calculateBudget(
    income: number,
    customRatio: FiftyThirtyTwentyRatio = DEFAULT_50_30_20_RATIO
  ): FiftyThirtyTwentyResult {
    const validIncome = Math.max(0, income);
    const needsBudget = Math.round((validIncome * customRatio.needsPercent) / 100);
    const wantsBudget = Math.round((validIncome * customRatio.wantsPercent) / 100);
    const savingsBudget = Math.round((validIncome * customRatio.savingsPercent) / 100);

    return {
      monthlyIncome: validIncome,
      needsBudget,
      wantsBudget,
      savingsBudget,
      ratio: customRatio
    };
  }

  /**
   * Classifies a transaction or category name into Needs, Wants, or Savings.
   */
  static classifyCategory(categoryName: string = ''): 'needs' | 'wants' | 'savings' {
    const norm = categoryName.trim().toLowerCase();

    // Savings / Investments / Debt reduction
    if (
      norm.includes('saving') ||
      norm.includes('tích lũy') ||
      norm.includes('tiết kiệm') ||
      norm.includes('invest') ||
      norm.includes('đầu tư') ||
      norm.includes('emergency') ||
      norm.includes('dự phòng') ||
      norm.includes('trả nợ') ||
      norm.includes('debt') ||
      norm.includes('vốn') ||
      norm.includes('chứng khoán') ||
      norm.includes('vàng')
    ) {
      return 'savings';
    }

    // Wants / Discretionary / Lifestyle
    if (
      norm.includes('dining') ||
      norm.includes('nhà hàng') ||
      norm.includes('cafe') ||
      norm.includes('cà phê') ||
      norm.includes('shopping') ||
      norm.includes('mua sắm') ||
      norm.includes('travel') ||
      norm.includes('du lịch') ||
      norm.includes('entertainment') ||
      norm.includes('giải trí') ||
      norm.includes('hobby') ||
      norm.includes('game') ||
      norm.includes('cinema') ||
      norm.includes('phim') ||
      norm.includes('spa') ||
      norm.includes('quà tặng') ||
      norm.includes('hưởng thụ')
    ) {
      return 'wants';
    }

    // Needs (Default for core expenses)
    return 'needs';
  }

  /**
   * Evaluates actual spending against the 50/30/20 target budget and generates a compliance scorecard.
   */
  static evaluateSpending(
    transactions: Transaction[],
    monthlyIncome: number,
    customRatio: FiftyThirtyTwentyRatio = DEFAULT_50_30_20_RATIO
  ): FiftyThirtyTwentyEvaluation {
    const budget = this.calculateBudget(monthlyIncome, customRatio);

    let actualNeeds = 0;
    let actualWants = 0;
    let actualSavings = 0;

    for (const tx of transactions) {
      if (tx.isDeleted || tx.status === 'soft_deleted' || tx.status === 'draft') continue;

      const amt = Math.max(0, tx.amount);

      if (tx.type === 'saving' || tx.type === 'investment' || tx.type === 'debt_payment') {
        actualSavings += amt;
      } else if (tx.type === 'expense') {
        const bucket = this.classifyCategory(tx.category || tx.categoryId || '');
        if (bucket === 'wants') {
          actualWants += amt;
        } else if (bucket === 'savings') {
          actualSavings += amt;
        } else {
          actualNeeds += amt;
        }
      }
    }

    const totalSpent = actualNeeds + actualWants + actualSavings;
    const baseIncome = Math.max(1, monthlyIncome);

    const needsPercent = Math.round((actualNeeds / baseIncome) * 100);
    const wantsPercent = Math.round((actualWants / baseIncome) * 100);
    const savingsPercent = Math.round((actualSavings / baseIncome) * 100);

    const needsVariance = budget.needsBudget - actualNeeds;
    const wantsVariance = budget.wantsBudget - actualWants;
    const savingsVariance = actualSavings - budget.savingsBudget; // positive = saved more than target

    // Compliance scoring (100 is perfect match)
    const needsPenalty = Math.max(0, needsPercent - customRatio.needsPercent) * 2;
    const wantsPenalty = Math.max(0, wantsPercent - customRatio.wantsPercent) * 2;
    const savingsPenalty = Math.max(0, customRatio.savingsPercent - savingsPercent) * 2;

    const complianceScore = Math.max(0, Math.min(100, Math.round(100 - needsPenalty - wantsPenalty - savingsPenalty)));
    const isCompliant = complianceScore >= 80;

    const recommendations: string[] = [];
    if (needsPercent > customRatio.needsPercent) {
      recommendations.push(`Chi phí thiết yếu đang chiếm ${needsPercent}% (vượt mức tiêu chuẩn ${customRatio.needsPercent}%). Hãy tối ưu hóa hóa đơn định kỳ.`);
    }
    if (wantsPercent > customRatio.wantsPercent) {
      recommendations.push(`Chi tiêu mong muốn/hưởng thụ đang chiếm ${wantsPercent}% (vượt mức ${customRatio.wantsPercent}%). Cắt giảm các khoản không bắt buộc.`);
    }
    if (savingsPercent < customRatio.savingsPercent) {
      recommendations.push(`Tỷ lệ tích lũy đang đạt ${savingsPercent}% (chưa đạt mục tiêu ${customRatio.savingsPercent}%). Trích quỹ tự động đầu tháng.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Cơ cấu ngân sách 50/30/20 đang được duy trì xuất sắc!');
    }

    return {
      income: monthlyIncome,
      budget,
      actual: {
        needs: actualNeeds,
        wants: actualWants,
        savings: actualSavings,
        total: totalSpent
      },
      percentages: {
        needsPercent,
        wantsPercent,
        savingsPercent
      },
      variance: {
        needsVariance,
        wantsVariance,
        savingsVariance
      },
      complianceScore,
      isCompliant,
      recommendations
    };
  }
}
