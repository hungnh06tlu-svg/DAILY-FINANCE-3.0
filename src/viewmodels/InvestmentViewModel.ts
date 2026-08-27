/**
 * Daily Finance 2.5 - InvestmentViewModel
 * Pure presentation state provider for Investment Engine.
 * Retrieves investment data via Investment Use Cases, producing precomputed,
 * presentation-ready InvestmentUiState without UI calculations.
 */

import {
  Investment,
  InvestmentTransaction,
  InvestmentUiState,
  InvestmentUiItem,
  InvestmentWidgetState,
  Language
} from '../types';
import {
  GetPortfolioUseCase,
  CreateInvestmentUseCase,
  UpdateInvestmentUseCase,
  ArchiveInvestmentUseCase,
  DeleteInvestmentUseCase,
  BuyAssetUseCase,
  SellAssetUseCase,
  RecordDividendUseCase
} from '../usecases/InvestmentUseCases';
import { InvestmentEngine } from '../domain/InvestmentEngine';
import { LocalInvestmentRepository } from '../repositories/implementations';
import { InvestmentRepository } from '../repositories/contracts';
import { InvestmentMapper } from '../domain/InvestmentMapper';

export class InvestmentViewModel {
  private getPortfolioUseCase: GetPortfolioUseCase;
  private createInvestmentUseCase: CreateInvestmentUseCase;
  private updateInvestmentUseCase: UpdateInvestmentUseCase;
  private archiveInvestmentUseCase: ArchiveInvestmentUseCase;
  private deleteInvestmentUseCase: DeleteInvestmentUseCase;
  private buyAssetUseCase: BuyAssetUseCase;
  private sellAssetUseCase: SellAssetUseCase;
  private recordDividendUseCase: RecordDividendUseCase;

  constructor(
    getPortfolioUseCase: GetPortfolioUseCase,
    createInvestmentUseCase: CreateInvestmentUseCase,
    updateInvestmentUseCase: UpdateInvestmentUseCase,
    archiveInvestmentUseCase: ArchiveInvestmentUseCase,
    deleteInvestmentUseCase: DeleteInvestmentUseCase,
    buyAssetUseCase: BuyAssetUseCase,
    sellAssetUseCase: SellAssetUseCase,
    recordDividendUseCase: RecordDividendUseCase
  ) {
    if (
      !getPortfolioUseCase ||
      !createInvestmentUseCase ||
      !updateInvestmentUseCase ||
      !archiveInvestmentUseCase ||
      !deleteInvestmentUseCase ||
      !buyAssetUseCase ||
      !sellAssetUseCase ||
      !recordDividendUseCase
    ) {
      throw new Error('[InvestmentViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.getPortfolioUseCase = getPortfolioUseCase;
    this.createInvestmentUseCase = createInvestmentUseCase;
    this.updateInvestmentUseCase = updateInvestmentUseCase;
    this.archiveInvestmentUseCase = archiveInvestmentUseCase;
    this.deleteInvestmentUseCase = deleteInvestmentUseCase;
    this.buyAssetUseCase = buyAssetUseCase;
    this.sellAssetUseCase = sellAssetUseCase;
    this.recordDividendUseCase = recordDividendUseCase;
  }

  /**
   * Produces complete, precomputed InvestmentUiState.
   */
  async getInvestmentUiState(
    spaceId?: string,
    transactions: InvestmentTransaction[] = [],
    language: Language = 'vi'
  ): Promise<InvestmentUiState> {
    const rawInvestments = await this.getPortfolioUseCase.execute(spaceId);

    const summary = InvestmentEngine.calculateSummary(rawInvestments, language);
    const performance = InvestmentEngine.evaluatePortfolio(rawInvestments, language);
    const holdings = InvestmentEngine.calculateHoldings(rawInvestments, language);
    const allocation = InvestmentEngine.calculateAllocation(rawInvestments, language);
    const forecast = InvestmentEngine.calculateForecast(rawInvestments, 0.08, language);
    const statistics = InvestmentEngine.calculateStatistics(rawInvestments, language);
    const alerts = InvestmentEngine.evaluateAlerts(rawInvestments, language);

    const uiItems: InvestmentUiItem[] = rawInvestments.map((inv) => {
      const holding = holdings.find((h) => h.symbol === (inv.symbol || inv.name)) || InvestmentMapper.toHolding(inv, language);
      const itemAlerts = alerts.filter((alt) => alt.investmentId === inv.id);
      const policy = InvestmentEngine.evaluatePolicy(inv);

      return {
        investment: inv,
        holding,
        alerts: itemAlerts,
        policy
      };
    });

    // Insights generation
    const insights: string[] = [];
    if (summary.overallRoi > 0) {
      insights.push(
        language === 'vi'
          ? `Tỷ suất sinh lời tổng thể đạt +${summary.overallRoi}%.`
          : `Overall portfolio ROI is +${summary.overallRoi}%.`
      );
    }
    if (statistics.topAllocationType) {
      insights.push(
        language === 'vi'
          ? `Tài sản chiếm tỷ trọng lớn nhất: ${statistics.topAllocationType}.`
          : `Highest allocated asset type: ${statistics.topAllocationType}.`
      );
    }
    if (alerts.length > 0) {
      insights.push(
        language === 'vi'
          ? `Có ${alerts.length} cảnh báo về danh mục đầu tư cần xem xét.`
          : `There are ${alerts.length} investment alerts requiring review.`
      );
    }

    // Extensible Widget States (TASK 11 & TASK 3)
    const widgets: InvestmentWidgetState[] = [
      {
        widgetId: 'asset_allocation',
        title: language === 'vi' ? 'Phân Bổ Danh Mục' : 'Asset Allocation',
        isEnabled: true,
        precomputedData: { allocation }
      },
      {
        widgetId: 'portfolio_forecast',
        title: language === 'vi' ? 'Dự Báo Tăng Trưởng' : 'Portfolio Growth Forecast',
        isEnabled: true,
        precomputedData: { forecast }
      },
      {
        widgetId: 'risk_profile',
        title: language === 'vi' ? 'Đánh Giá Rủi Ro' : 'Risk Profile Evaluation',
        isEnabled: true,
        precomputedData: { riskProfile: statistics.portfolioRiskProfile }
      }
    ];

    // Precomputed Chart Dataset
    const chartData = allocation.map((a) => ({
      label: a.label,
      value: a.value
    }));

    return {
      summary,
      statistics,
      performance,
      allocation,
      forecast,
      items: uiItems,
      recentTransactions: transactions.slice(0, 10),
      alerts,
      insights,
      widgets,
      chartData,
      isLoading: false,
      error: null
    };
  }

  async createInvestment(inv: Omit<Investment, 'id'>): Promise<Investment> {
    return this.createInvestmentUseCase.execute(inv);
  }

  async updateInvestment(inv: Investment): Promise<Investment> {
    return this.updateInvestmentUseCase.execute(inv);
  }

  async archiveInvestment(investmentId: string): Promise<Investment | null> {
    return this.archiveInvestmentUseCase.execute(investmentId);
  }

  async deleteInvestment(investmentId: string): Promise<boolean> {
    return this.deleteInvestmentUseCase.execute(investmentId);
  }

  async buyAsset(
    investmentId: string,
    quantity: number,
    buyPrice: number
  ): Promise<{ updatedInvestment: Investment; transaction: InvestmentTransaction } | null> {
    return this.buyAssetUseCase.execute(investmentId, quantity, buyPrice);
  }

  async sellAsset(
    investmentId: string,
    quantity: number,
    sellPrice: number
  ): Promise<{ updatedInvestment: Investment; transaction: InvestmentTransaction } | null> {
    return this.sellAssetUseCase.execute(investmentId, quantity, sellPrice);
  }

  async recordDividend(
    investmentId: string,
    amount: number,
    note?: string
  ): Promise<InvestmentTransaction | null> {
    return this.recordDividendUseCase.execute(investmentId, amount, note);
  }
}
