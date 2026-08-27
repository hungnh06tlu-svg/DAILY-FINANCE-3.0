/**
 * Daily Finance 2.5 - DebtViewModel
 * ViewModel for Debt & Loan Domain (TASK 4 & 5).
 * Exposes immutable DebtUiState.
 * Communicates exclusively through Use Cases. Never accesses Repository directly.
 */

import {
  DebtUiState,
  DebtItem,
  DebtUiItem,
  Repayment,
  Language
} from '../types';
import { toSafeUserError } from '../utils/safeError';
import {
  CreateDebtUseCase,
  UpdateDebtUseCase,
  ArchiveDebtUseCase,
  DeleteDebtUseCase,
  RecordRepaymentUseCase,
  RecordBorrowUseCase,
  RecordLoanUseCase,
  GetDebtSummaryUseCase,
  GetDebtForecastUseCase,
  GetDebtStatisticsUseCase,
  GetDebtsAndLoansUseCase
} from '../usecases/DebtUseCases';
import { DebtEngine } from '../domain/DebtEngine';
import { DebtMapper } from '../domain/DebtMapper';

export class DebtViewModel {
  private getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase;
  private createUseCase: CreateDebtUseCase;
  private updateUseCase: UpdateDebtUseCase;
  private archiveUseCase: ArchiveDebtUseCase;
  private deleteUseCase: DeleteDebtUseCase;
  private repaymentUseCase: RecordRepaymentUseCase;
  private borrowUseCase: RecordBorrowUseCase;
  private loanUseCase: RecordLoanUseCase;
  private summaryUseCase: GetDebtSummaryUseCase;
  private forecastUseCase: GetDebtForecastUseCase;
  private statsUseCase: GetDebtStatisticsUseCase;

  constructor(
    getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase,
    createUseCase: CreateDebtUseCase,
    updateUseCase: UpdateDebtUseCase,
    archiveUseCase: ArchiveDebtUseCase,
    deleteUseCase: DeleteDebtUseCase,
    repaymentUseCase: RecordRepaymentUseCase,
    borrowUseCase: RecordBorrowUseCase,
    loanUseCase: RecordLoanUseCase,
    summaryUseCase: GetDebtSummaryUseCase,
    forecastUseCase: GetDebtForecastUseCase,
    statsUseCase: GetDebtStatisticsUseCase
  ) {
    if (
      !getDebtsAndLoansUseCase ||
      !createUseCase ||
      !updateUseCase ||
      !archiveUseCase ||
      !deleteUseCase ||
      !repaymentUseCase ||
      !borrowUseCase ||
      !loanUseCase ||
      !summaryUseCase ||
      !forecastUseCase ||
      !statsUseCase
    ) {
      throw new Error('[DebtViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.getDebtsAndLoansUseCase = getDebtsAndLoansUseCase;
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.archiveUseCase = archiveUseCase;
    this.deleteUseCase = deleteUseCase;
    this.repaymentUseCase = repaymentUseCase;
    this.borrowUseCase = borrowUseCase;
    this.loanUseCase = loanUseCase;
    this.summaryUseCase = summaryUseCase;
    this.forecastUseCase = forecastUseCase;
    this.statsUseCase = statsUseCase;
  }

  /**
   * Produces the full immutable DebtUiState presentation state.
   */
  async getDebtUiState(
    spaceId?: string,
    repayments: Repayment[] = [],
    language: Language = 'vi'
  ): Promise<DebtUiState> {
    try {
      const rawItems = await this.getDebtsAndLoansUseCase.execute(spaceId);
      const activeItems = rawItems.filter((i) => !i.isSoftDeleted);

      const summary = await this.summaryUseCase.execute(spaceId, repayments, language);
      const statistics = await this.statsUseCase.execute(spaceId);
      const forecast = await this.forecastUseCase.execute(spaceId, repayments, language);

      const items: DebtUiItem[] = activeItems.map((item) => {
        const uiItem = DebtMapper.toPresentationItem(item, language);
        uiItem.schedule = DebtEngine.generateSchedule(item, repayments, language);
        uiItem.alerts = DebtEngine.evaluateAlerts([item], language);
        return uiItem;
      });

      const alerts = DebtEngine.evaluateAlerts(activeItems, language);
      const { upcoming, overdue } = DebtEngine.evaluateReminders(activeItems, language);

      const insights: string[] = [
        `Tổng nợ hiện tại: ${summary.formattedTotalDebt}, Tổng cho vay: ${summary.formattedTotalLoan}.`,
        `Lãi suất trung bình danh mục: ${statistics.averageInterestRate}%.`,
        `Dự kiến hoàn tất thanh toán toàn bộ nợ vào ${forecast.forecastCompletionDate}.`
      ];

      const chartData = [
        { label: 'Tiền vay (Owed)', value: summary.totalDebt, color: '#EF4444' },
        { label: 'Cho vay (Lent)', value: summary.totalLoan, color: '#10B981' }
      ];

      return {
        summary,
        statistics,
        forecast,
        items,
        upcomingPayments: upcoming,
        overduePayments: overdue,
        repayments,
        alerts,
        reminders: [...upcoming, ...overdue],
        history: [],
        insights,
        widgets: [
          {
            widgetId: 'debt_summary',
            title: 'Tóm tắt Nợ & Cho vay',
            isEnabled: true,
            precomputedData: summary as any
          }
        ],
        chartData,
        isLoading: false,
        error: null
      };
    } catch (err: any) {
      return {
        summary: {
          totalDebt: 0,
          formattedTotalDebt: '0 ₫',
          totalLoan: 0,
          formattedTotalLoan: '0 ₫',
          netDebtBalance: 0,
          formattedNetDebtBalance: '0 ₫',
          totalOutstandingBalance: 0,
          formattedOutstandingBalance: '0 ₫',
          totalPaidAmount: 0,
          formattedTotalPaidAmount: '0 ₫',
          totalRemainingAmount: 0,
          formattedTotalRemainingAmount: '0 ₫',
          totalInterestPaid: 0,
          formattedTotalInterestPaid: '0 ₫',
          totalInterestRemaining: 0,
          formattedTotalInterestRemaining: '0 ₫',
          activeDebtsCount: 0,
          activeLoansCount: 0
        },
        statistics: {
          highestInterestRate: 0,
          averageInterestRate: 0
        },
        forecast: {
          forecastCompletionDate: '',
          projectedMonthsToClear: 0,
          totalProjectedInterest: 0,
          formattedTotalProjectedInterest: '0 ₫',
          forecastStatus: 'on_track'
        },
        items: [],
        upcomingPayments: [],
        overduePayments: [],
        repayments: [],
        alerts: [],
        reminders: [],
        history: [],
        insights: [],
        widgets: [],
        chartData: [],
        isLoading: false,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu nợ và khoản vay. Vui lòng thử lại.',
          'Unable to load Debt UI State. Please try again.',
          language
        )
      };
    }
  }

  async createDebt(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
    return this.createUseCase.execute(item);
  }

  async updateDebt(item: DebtItem): Promise<DebtItem> {
    return this.updateUseCase.execute(item);
  }

  async archiveDebt(id: string, spaceId?: string): Promise<DebtItem | null> {
    return this.archiveUseCase.execute(id, spaceId);
  }

  async deleteDebt(id: string, hardDelete?: boolean, spaceId?: string): Promise<boolean> {
    return this.deleteUseCase.execute(id, hardDelete, spaceId);
  }

  async recordRepayment(
    debtId: string,
    amount: number,
    note?: string,
    spaceId?: string
  ): Promise<{ updatedItem: DebtItem; repayment: Repayment } | null> {
    return this.repaymentUseCase.execute(debtId, amount, note, spaceId);
  }

  async recordBorrow(params: {
    title: string;
    counterparty: string;
    amount: number;
    interestRate?: number;
    dueDate: string;
    spaceId?: string;
  }): Promise<DebtItem> {
    return this.borrowUseCase.execute(params);
  }

  async recordLoan(params: {
    title: string;
    counterparty: string;
    amount: number;
    interestRate?: number;
    dueDate: string;
    spaceId?: string;
  }): Promise<DebtItem> {
    return this.loanUseCase.execute(params);
  }
}
