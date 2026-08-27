/**
 * Daily Finance 2.5 - FIREViewModel
 * ViewModel for FIRE Planner Domain (TASK 4 & 5).
 * Exposes immutable FireUiState.
 * Communicates exclusively through Use Cases and Repositories.
 */

import {
  FireUiState,
  FireProfile,
  FireGoal,
  FireSummary,
  FireStatistics,
  FireForecast,
  FireScenario,
  FireProjection,
  FireMilestone,
  FireStrategy,
  FireRecommendation,
  FireRisk,
  FireAlert,
  FireWidgetState,
  ChartDataPoint,
  Language
} from '../types';
import { toSafeUserError } from '../utils/safeError';
import {
  CreateFireProfileUseCase,
  UpdateFireProfileUseCase,
  CalculateFireGoalUseCase,
  GenerateFireProjectionUseCase,
  GenerateFireForecastUseCase,
  GenerateFireScenarioUseCase,
  EvaluateFireRiskUseCase,
  GenerateFireRecommendationUseCase,
  GetFireSummaryUseCase,
  GetFireStatisticsUseCase
} from '../usecases/FIREUseCases';
import { GetWalletsUseCase } from '../usecases/WalletUseCases';
import { GetPortfolioUseCase } from '../usecases/InvestmentUseCases';
import { GetDebtsAndLoansUseCase } from '../usecases/DebtUseCases';
import { GetTransactionsUseCase } from '../usecases/TransactionUseCases';
import {
  WalletRepository,
  InvestmentRepository,
  LoanRepository,
  BudgetRepository,
  SavingRepository,
  TransactionRepository,
  SixJarsRepository
} from '../repositories/contracts';
import {
  LocalWalletRepository,
  LocalInvestmentRepository,
  LocalLoanRepository,
  LocalBudgetRepository,
  LocalSavingRepository,
  LocalTransactionRepository,
  LocalSixJarsRepository
} from '../repositories/implementations';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { FIREEngine } from '../domain/FIREEngine';
import { MoneyFormatter } from '../formatters';
import { IdGenerator } from '../services/IdGenerator';

import { RepositoriesContainer } from '../usecases/FinancialSnapshotUseCase';

export class FIREViewModel {
  private createUseCase: CreateFireProfileUseCase;
  private updateUseCase: UpdateFireProfileUseCase;
  private goalUseCase: CalculateFireGoalUseCase;
  private projectionUseCase: GenerateFireProjectionUseCase;
  private forecastUseCase: GenerateFireForecastUseCase;
  private scenarioUseCase: GenerateFireScenarioUseCase;
  private riskUseCase: EvaluateFireRiskUseCase;
  private recommendationUseCase: GenerateFireRecommendationUseCase;
  private summaryUseCase: GetFireSummaryUseCase;
  private statsUseCase: GetFireStatisticsUseCase;
  private getWalletsUseCase: GetWalletsUseCase;
  private getPortfolioUseCase: GetPortfolioUseCase;
  private getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase;
  private getTransactionsUseCase: GetTransactionsUseCase;

  constructor(
    createUseCase: CreateFireProfileUseCase,
    updateUseCase: UpdateFireProfileUseCase,
    goalUseCase: CalculateFireGoalUseCase,
    projectionUseCase: GenerateFireProjectionUseCase,
    forecastUseCase: GenerateFireForecastUseCase,
    scenarioUseCase: GenerateFireScenarioUseCase,
    riskUseCase: EvaluateFireRiskUseCase,
    recommendationUseCase: GenerateFireRecommendationUseCase,
    summaryUseCase: GetFireSummaryUseCase,
    statsUseCase: GetFireStatisticsUseCase,
    getWalletsUseCase: GetWalletsUseCase,
    getPortfolioUseCase: GetPortfolioUseCase,
    getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase,
    getTransactionsUseCase: GetTransactionsUseCase
  ) {
    if (
      !createUseCase ||
      !updateUseCase ||
      !goalUseCase ||
      !projectionUseCase ||
      !forecastUseCase ||
      !scenarioUseCase ||
      !riskUseCase ||
      !recommendationUseCase ||
      !summaryUseCase ||
      !statsUseCase ||
      !getWalletsUseCase ||
      !getPortfolioUseCase ||
      !getDebtsAndLoansUseCase ||
      !getTransactionsUseCase
    ) {
      throw new Error('[FIREViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.goalUseCase = goalUseCase;
    this.projectionUseCase = projectionUseCase;
    this.forecastUseCase = forecastUseCase;
    this.scenarioUseCase = scenarioUseCase;
    this.riskUseCase = riskUseCase;
    this.recommendationUseCase = recommendationUseCase;
    this.summaryUseCase = summaryUseCase;
    this.statsUseCase = statsUseCase;
    this.getWalletsUseCase = getWalletsUseCase;
    this.getPortfolioUseCase = getPortfolioUseCase;
    this.getDebtsAndLoansUseCase = getDebtsAndLoansUseCase;
    this.getTransactionsUseCase = getTransactionsUseCase;
  }

  /**
   * Produces the full immutable FireUiState aggregating cross-domain data (TASK 5 & 11).
   */
  async getFireUiState(
    profileInput?: Partial<FireProfile>,
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<FireUiState> {
    try {
      // TASK 11: Cross Domain Data Aggregation
      const wallets = await this.getWalletsUseCase.execute(spaceId);
      const investments = await this.getPortfolioUseCase.execute(spaceId);
      const debts = await this.getDebtsAndLoansUseCase.execute(spaceId);
      const txs = await this.getTransactionsUseCase.execute(spaceId);

      const netWorthFromTruth = FinancialTruthEngine.calculateNetWorth(wallets, investments, debts, []);
      const totalInvestments = investments.reduce(
        (sum, inv) => sum + (inv.quantity || 0) * (inv.currentPrice || 0),
        0
      );
      const totalDebt = debts
        .filter((d) => d.type === 'debt')
        .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

      const computedIncome = FinancialTruthEngine.calculateIncome(txs);
      const computedExpense = FinancialTruthEngine.calculateExpense(txs);

      const effectiveNetWorth = profileInput?.currentNetWorth !== undefined
        ? profileInput.currentNetWorth
        : Math.max(0, netWorthFromTruth);

      const effectiveIncome = profileInput?.monthlyIncome !== undefined
        ? profileInput.monthlyIncome
        : computedIncome > 0 ? computedIncome : 30000000;

      const effectiveExpense = profileInput?.monthlyExpenses !== undefined
        ? profileInput.monthlyExpenses
        : computedExpense > 0 ? computedExpense : 15000000;

      const effectiveSavings = profileInput?.monthlySavings !== undefined
        ? profileInput.monthlySavings
        : Math.max(0, effectiveIncome - effectiveExpense);

      const effectiveInvestment = profileInput?.monthlyInvestment !== undefined
        ? profileInput.monthlyInvestment
        : Math.round(effectiveSavings * 0.4);

      const profile: FireProfile = {
        id: profileInput?.id || 'fire_prof_active',
        spaceId,
        currentAge: profileInput?.currentAge || 30,
        targetRetirementAge: profileInput?.targetRetirementAge || 55,
        currentNetWorth: effectiveNetWorth,
        monthlyExpenses: effectiveExpense,
        monthlyIncome: effectiveIncome,
        monthlySavings: effectiveSavings,
        monthlyInvestment: effectiveInvestment,
        expectedAnnualReturn: profileInput?.expectedAnnualReturn || 7,
        safeWithdrawalRate: profileInput?.safeWithdrawalRate || 4,
        inflationRate: profileInput?.inflationRate || 3,
        fireType: profileInput?.fireType || 'regular_fire',
        customTargetNetWorth: profileInput?.customTargetNetWorth,
        createdAt: profileInput?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Execute Use Cases
      const rawGoal = await this.goalUseCase.execute(profile, language);
      const rawForecast = await this.forecastUseCase.execute(profile, language);
      const rawScenarios = await this.scenarioUseCase.execute(profile, language);
      const rawProjection = await this.projectionUseCase.execute(profile, 30, language);
      const recommendations = await this.recommendationUseCase.execute(profile, totalDebt, language);
      const risks = await this.riskUseCase.execute(profile, totalDebt, language);
      const rawSummary = await this.summaryUseCase.execute(profile, language);
      const statistics = await this.statsUseCase.execute(profile, totalDebt, totalInvestments);

      // Populate presentation formatting in ViewModel
      const goal: FireGoal = {
        ...rawGoal,
        formattedTargetNetWorth: MoneyFormatter.format(rawGoal.targetNetWorth, 'VND', language),
        formattedRequiredPassiveIncomeMonthly: MoneyFormatter.format(rawGoal.requiredPassiveIncomeMonthly, 'VND', language),
        formattedMonthlyExpenses: MoneyFormatter.format(rawGoal.monthlyExpenses, 'VND', language)
      };

      const forecast: FireForecast = {
        ...rawForecast,
        formattedRequiredMonthlySavings: MoneyFormatter.format(rawForecast.requiredMonthlySavings, 'VND', language),
        formattedRequiredPassiveIncome: MoneyFormatter.format(rawForecast.requiredPassiveIncome, 'VND', language)
      };

      const summary: FireSummary = {
        ...rawSummary,
        formattedCurrentNetWorth: MoneyFormatter.format(rawSummary.currentNetWorth, 'VND', language),
        formattedTargetNetWorth: MoneyFormatter.format(rawSummary.targetNetWorth, 'VND', language),
        formattedFireNumber: MoneyFormatter.format(rawSummary.fireNumber, 'VND', language),
        formattedMonthlyPassiveIncomeCurrent: MoneyFormatter.format(rawSummary.monthlyPassiveIncomeCurrent, 'VND', language),
        formattedMonthlyExpenses: MoneyFormatter.format(rawSummary.monthlyExpenses, 'VND', language)
      };

      const scenarios: FireScenario[] = rawScenarios.map((s) => ({
        ...s,
        formattedProjectedNetWorth: MoneyFormatter.format(s.projectedNetWorthAtRetirement, 'VND', language)
      }));

      const projection: FireProjection = {
        ...rawProjection,
        points: rawProjection.points.map((pt) => ({
          ...pt,
          formattedNetWorth: MoneyFormatter.format(pt.projectedNetWorth, 'VND', language)
        })),
        milestones: rawProjection.milestones.map((m) => ({
          ...m,
          formattedTargetNetWorth: MoneyFormatter.format(m.targetNetWorth, 'VND', language)
        }))
      };

      const fireNumber = goal.targetNetWorth;
      const alerts = FIREEngine.evaluateAlerts(profile, fireNumber, forecast.yearsRemaining, language);

      const chartData: ChartDataPoint[] = projection.points.map((pt) => ({
        label: `${pt.year} (${language === 'vi' ? 'Tuổi' : 'Age'} ${pt.age})`,
        value: pt.projectedNetWorth,
        color: pt.isFireAchieved ? '#10B981' : '#3B82F6'
      }));

      const strategies: FireStrategy[] = [
        {
          id: IdGenerator.generateId('str_sav'),
          title: language === 'vi' ? 'Tối Ưu Hóa Tỷ Lệ Tiết Kiệm' : 'Optimize Savings Rate',
          description: language === 'vi' ? 'Tự động trích 30% thu nhập vào các tài khoản tiết kiệm cố định.' : 'Automate 30% income savings allocation.',
          impactYears: 3,
          category: 'savings'
        },
        {
          id: IdGenerator.generateId('str_inv'),
          title: language === 'vi' ? 'Đầu Tư Định Kỳ Quỹ Chỉ Số' : 'Index Fund DCA Investment',
          description: language === 'vi' ? 'Đầu tư hàng tháng vào danh mục đa dạng hóa cổ phiếu/trái phiếu.' : 'Monthly DCA into low-cost index funds.',
          impactYears: 5,
          category: 'investment'
        }
      ];

      const widgets: FireWidgetState[] = [
        {
          widgetId: 'fire_planner_overview',
          title: language === 'vi' ? 'Tổng Quan FIRE Planner' : 'FIRE Planner Overview',
          isEnabled: true,
          precomputedData: {
            fireNumber,
            currentNetWorth: profile.currentNetWorth,
            yearsRemaining: forecast.yearsRemaining,
            progressPercent: goal.progressPercent
          }
        }
      ];

      return {
        profile,
        goal,
        summary,
        statistics,
        forecast,
        scenarios,
        projection,
        milestones: projection.milestones,
        strategies,
        recommendations,
        risks,
        alerts,
        history: [],
        widgets,
        chartData,
        isLoading: false
      };
    } catch (err: any) {
      const fallbackProfile: FireProfile = {
        id: 'fire_prof_fallback',
        currentAge: 30,
        targetRetirementAge: 55,
        currentNetWorth: 0,
        monthlyExpenses: 15000000,
        monthlyIncome: 30000000,
        monthlySavings: 15000000,
        monthlyInvestment: 5000000,
        expectedAnnualReturn: 7,
        safeWithdrawalRate: 4,
        inflationRate: 3,
        fireType: 'regular_fire'
      };

      return {
        profile: fallbackProfile,
        goal: {
          id: 'goal_err',
          profileId: fallbackProfile.id,
          fireType: 'regular_fire',
          targetNetWorth: 4500000000,
          formattedTargetNetWorth: '4,500,000,000 ₫',
          requiredPassiveIncomeMonthly: 15000000,
          formattedRequiredPassiveIncomeMonthly: '15,000,000 ₫',
          safeWithdrawalRate: 4,
          monthlyExpenses: 15000000,
          formattedMonthlyExpenses: '15,000,000 ₫',
          isReached: false,
          progressPercent: 0
        },
        summary: {
          currentNetWorth: 0,
          formattedCurrentNetWorth: '0 ₫',
          targetNetWorth: 4500000000,
          formattedTargetNetWorth: '4,500,000,000 ₫',
          fireNumber: 4500000000,
          formattedFireNumber: '4,500,000,000 ₫',
          savingsRatePercent: 50,
          investmentRatePercent: 16.7,
          monthlyPassiveIncomeCurrent: 0,
          formattedMonthlyPassiveIncomeCurrent: '0 ₫',
          monthlyExpenses: 15000000,
          formattedMonthlyExpenses: '15,000,000 ₫',
          yearsRemaining: 20,
          expectedFireDate: '2046-01',
          fireType: 'regular_fire'
        },
        statistics: {
          progressToFirePercent: 0,
          monthlyNetSavings: 15000000,
          savingsToIncomeRatio: 0.5,
          debtToNetWorthRatio: 0,
          investmentToNetWorthRatio: 0,
          financialIndependenceScore: 20
        },
        forecast: {
          expectedFireDate: '2046-01',
          yearsRemaining: 20,
          requiredMonthlySavings: 15000000,
          formattedRequiredMonthlySavings: '15,000,000 ₫',
          requiredPassiveIncome: 15000000,
          formattedRequiredPassiveIncome: '15,000,000 ₫',
          requiredInvestmentGrowthRate: 7,
          targetAchievementPercent: 0,
          status: 'on_track'
        },
        scenarios: [],
        projection: { profileId: fallbackProfile.id, points: [], milestones: [] },
        milestones: [],
        strategies: [],
        recommendations: [],
        risks: [],
        alerts: [],
        history: [],
        widgets: [],
        chartData: [],
        isLoading: false,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu FIRE. Vui lòng thử lại.',
          'Unable to load FIRE State. Please try again.',
          language
        )
      };
    }
  }

  async createProfile(data: Omit<FireProfile, 'id'>): Promise<FireProfile> {
    return this.createUseCase.execute(data);
  }

  async updateProfile(existing: FireProfile, updates: Partial<FireProfile>): Promise<FireProfile> {
    return this.updateUseCase.execute(existing, updates);
  }
}
