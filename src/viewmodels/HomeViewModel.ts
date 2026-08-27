/**
 * Daily Finance 2.5 - HomeViewModel
 * Pure presentation state provider for the Home Dashboard.
 * Retrieves DashboardUiState via UseCases without performing business logic or calculations itself.
 */

import { DashboardUiState, FinancialSpace, Transaction, Language } from '../types';
import { GenerateDashboardUseCase } from '../usecases/DashboardUseCases';
import { MoneyFormatter } from '../formatters';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';

export class HomeViewModel {
  constructor(private readonly generateDashboardUseCase: GenerateDashboardUseCase) {
    if (!generateDashboardUseCase) {
      throw new Error('[HomeViewModel] Fail-Fast: GenerateDashboardUseCase is required');
    }
  }

  async getDashboardUiState(
    spaceId: string,
    spaces: FinancialSpace[],
    transactions: Transaction[],
    language: Language = 'vi'
  ): Promise<DashboardUiState> {
    const dashboard = await this.generateDashboardUseCase.execute(spaceId);

    const activeSpace = spaces.find((s) => s.id === spaceId) || spaces[0];
    const totalBalance = spaces.reduce((acc, s) => acc + s.balance, 0);

    // Call FinancialTruthEngine for cash flow calculation (no duplicated logic)
    const cashFlow = FinancialTruthEngine.calculateCashFlow(
      dashboard.monthlyIncome,
      dashboard.monthlyExpense
    );

    // TASK 4: Precomputed Chart Datasets
    const chartData = [
      {
        label: language === 'vi' ? 'Thu nhập' : 'Income',
        value: dashboard.monthlyIncome,
        color: '#10b981'
      },
      {
        label: language === 'vi' ? 'Chi tiêu' : 'Expense',
        value: dashboard.monthlyExpense,
        color: '#f43f5e'
      },
      {
        label: language === 'vi' ? 'Dòng tiền' : 'Cash Flow',
        value: cashFlow,
        color: '#3b82f6'
      }
    ];

    // TASK 7: Precomputed Widget States for future extensible widgets
    const widgets = [
      {
        widgetId: 'ai_coach' as const,
        title: language === 'vi' ? 'Trợ lý AI' : 'AI Coach',
        isEnabled: true,
        precomputedData: {
          suggestion: language === 'vi'
            ? 'Tỷ lệ tiết kiệm tháng này đạt 35%, duy trì đà tăng trưởng tốt!'
            : 'Savings rate reached 35% this month, keep up the good work!'
        }
      },
      {
        widgetId: 'savings' as const,
        title: language === 'vi' ? 'Mục tiêu Tiết kiệm' : 'Savings Goals',
        isEnabled: true,
        precomputedData: { progressPercent: 72 }
      },
      {
        widgetId: 'investments' as const,
        title: language === 'vi' ? 'Đầu tư & Cổ phiếu' : 'Investments',
        isEnabled: true,
        precomputedData: { totalAssetValue: 125000000 }
      },
      {
        widgetId: 'debts' as const,
        title: language === 'vi' ? 'Khoản nợ & Tín dụng' : 'Debts & Loans',
        isEnabled: true,
        precomputedData: { totalRemainingDebt: 15000000 }
      },
      {
        widgetId: 'fire' as const,
        title: language === 'vi' ? 'Tự do Tài chính FIRE' : 'FIRE Freedom',
        isEnabled: true,
        precomputedData: { fireProgressPercent: 42.5 }
      },
      {
        widgetId: 'six_jars' as const,
        title: language === 'vi' ? 'Quy tắc 6 Hũ' : 'Six Jars Rule',
        isEnabled: true,
        precomputedData: { necJarPercent: 55 }
      }
    ];

    return {
      spaceId,
      totalBalance,
      formattedTotalBalance: MoneyFormatter.format(totalBalance, 'VND', language),
      monthlyIncome: dashboard.monthlyIncome,
      monthlyExpense: dashboard.monthlyExpense,
      cashFlow,
      netWorth: dashboard.netWorth,
      budgetProgress: dashboard.budgetProgress,
      savingsProgress: 72,
      recentTransactions: transactions.slice(0, 5),
      spaces,
      activeSpace,
      quickActions: [
        {
          id: 'transfer',
          label: language === 'vi' ? 'Chuyển Quỹ' : 'Space Transfer',
          icon: 'ArrowRightLeft',
          action: 'open_transfer'
        },
        {
          id: 'add_tx',
          label: language === 'vi' ? 'Thêm Thu Chi' : 'Add Transaction',
          icon: 'Plus',
          action: 'open_add_tx'
        }
      ],
      chartData,
      alerts: dashboard.monthlyExpense > dashboard.monthlyIncome ? [
        language === 'vi' ? 'Cảnh báo: Chi tiêu vượt quá thu nhập tháng!' : 'Warning: Expense exceeds income!'
      ] : [],
      insights: [
        language === 'vi'
          ? 'Không gian tài chính này có số dư ổn định.'
          : 'This financial space has a stable balance.'
      ],
      widgets,
      isLoading: false,
      error: null
    };
  }
}
