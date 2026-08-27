/**
 * Daily Finance 2.5 - AICoachViewModel
 * ViewModel for AI Coach Domain (TASK 4, 5 & 7).
 * Exposes immutable CoachUiState by reading cross-domain repositories read-only.
 * Communicates exclusively through Use Cases. AICoachScreen never accesses Repository directly.
 */

import {
  CoachUiState,
  CoachHealth,
  CoachSummary,
  CoachStatistics,
  CoachPriority,
  CoachRisk,
  CoachOpportunity,
  CoachInsight,
  CoachRecommendation,
  CoachActionPlan,
  CoachAchievement,
  CoachNotification,
  CoachHistory,
  CoachWidget,
  ChartDataPoint,
  Language
} from '../types';
import { toSafeUserError } from '../utils/safeError';
import {
  AnalyzeFinancialHealthUseCase,
  GenerateInsightsUseCase,
  GenerateRecommendationsUseCase,
  GenerateActionPlanUseCase,
  GenerateRiskAssessmentUseCase,
  GenerateOpportunityAnalysisUseCase,
  GetCoachSummaryUseCase,
  GetCoachStatisticsUseCase
} from '../usecases/AICoachUseCases';
import { GetWalletsUseCase } from '../usecases/WalletUseCases';
import { GetPortfolioUseCase } from '../usecases/InvestmentUseCases';
import { GetDebtsAndLoansUseCase } from '../usecases/DebtUseCases';
import { GetTransactionsUseCase } from '../usecases/TransactionUseCases';
import { GetBudgetsUseCase } from '../usecases/BudgetUseCases';
import { GetSavingsGoalUseCase } from '../usecases/SavingsUseCases';
import {
  WalletRepository,
  InvestmentRepository,
  LoanRepository,
  BudgetRepository,
  SavingRepository,
  TransactionRepository,
  SixJarsRepository
} from '../repositories/contracts';
import { FinancialTruthEngine } from '../domain/FinancialTruthEngine';
import { FIREEngine } from '../domain/FIREEngine';
import { AICoachEngine, FinancialSnapshotInput } from '../domain/AICoachEngine';
import { RepositoriesContainer } from '../usecases/FinancialSnapshotUseCase';

export class AICoachViewModel {
  private healthUseCase: AnalyzeFinancialHealthUseCase;
  private insightsUseCase: GenerateInsightsUseCase;
  private recsUseCase: GenerateRecommendationsUseCase;
  private planUseCase: GenerateActionPlanUseCase;
  private riskUseCase: GenerateRiskAssessmentUseCase;
  private oppUseCase: GenerateOpportunityAnalysisUseCase;
  private summaryUseCase: GetCoachSummaryUseCase;
  private statsUseCase: GetCoachStatisticsUseCase;
  private getWalletsUseCase: GetWalletsUseCase;
  private getPortfolioUseCase: GetPortfolioUseCase;
  private getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase;
  private getTransactionsUseCase: GetTransactionsUseCase;
  private getBudgetsUseCase: GetBudgetsUseCase;
  private getSavingsGoalUseCase: GetSavingsGoalUseCase;

  constructor(
    healthUseCase: AnalyzeFinancialHealthUseCase,
    insightsUseCase: GenerateInsightsUseCase,
    recsUseCase: GenerateRecommendationsUseCase,
    planUseCase: GenerateActionPlanUseCase,
    riskUseCase: GenerateRiskAssessmentUseCase,
    oppUseCase: GenerateOpportunityAnalysisUseCase,
    summaryUseCase: GetCoachSummaryUseCase,
    statsUseCase: GetCoachStatisticsUseCase,
    getWalletsUseCase: GetWalletsUseCase,
    getPortfolioUseCase: GetPortfolioUseCase,
    getDebtsAndLoansUseCase: GetDebtsAndLoansUseCase,
    getTransactionsUseCase: GetTransactionsUseCase,
    getBudgetsUseCase: GetBudgetsUseCase,
    getSavingsGoalUseCase: GetSavingsGoalUseCase
  ) {
    if (
      !healthUseCase ||
      !insightsUseCase ||
      !recsUseCase ||
      !planUseCase ||
      !riskUseCase ||
      !oppUseCase ||
      !summaryUseCase ||
      !statsUseCase ||
      !getWalletsUseCase ||
      !getPortfolioUseCase ||
      !getDebtsAndLoansUseCase ||
      !getTransactionsUseCase ||
      !getBudgetsUseCase ||
      !getSavingsGoalUseCase
    ) {
      throw new Error('[AICoachViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.healthUseCase = healthUseCase;
    this.insightsUseCase = insightsUseCase;
    this.recsUseCase = recsUseCase;
    this.planUseCase = planUseCase;
    this.riskUseCase = riskUseCase;
    this.oppUseCase = oppUseCase;
    this.summaryUseCase = summaryUseCase;
    this.statsUseCase = statsUseCase;
    this.getWalletsUseCase = getWalletsUseCase;
    this.getPortfolioUseCase = getPortfolioUseCase;
    this.getDebtsAndLoansUseCase = getDebtsAndLoansUseCase;
    this.getTransactionsUseCase = getTransactionsUseCase;
    this.getBudgetsUseCase = getBudgetsUseCase;
    this.getSavingsGoalUseCase = getSavingsGoalUseCase;
  }

  /**
   * TASK 5 & 7: Produces immutable CoachUiState by reading cross-domain data (Read-Only).
   */
  async getCoachUiState(spaceId: string = 'sp_personal', language: Language = 'vi'): Promise<CoachUiState> {
    try {
      // TASK 7: Cross Domain Read-Only
      const wallets = await this.getWalletsUseCase.execute(spaceId);
      const investments = await this.getPortfolioUseCase.execute(spaceId);
      const debts = await this.getDebtsAndLoansUseCase.execute(spaceId);
      const txs = await this.getTransactionsUseCase.execute(spaceId);
      const budgets = await this.getBudgetsUseCase.execute(spaceId);
      const savings = await this.getSavingsGoalUseCase.execute(spaceId);

      // Delegate financial truth math strictly to FinancialTruthEngine
      const netWorth = FinancialTruthEngine.calculateNetWorth(wallets, investments, debts, []);
      const monthlyIncome = FinancialTruthEngine.calculateIncome(txs);
      const monthlyExpense = FinancialTruthEngine.calculateExpense(txs);
      const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);
      const monthlyInvestment = Math.round(monthlySavings * 0.3);

      const totalDebt = debts
        .filter((d) => d.type === 'debt')
        .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

      const totalAssets = wallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0) +
        investments.reduce((sum, i) => sum + (i.quantity || 0) * (i.currentPrice || 0), 0);

      const totalSavingsBalance = savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);

      const activeBudgetsCount = budgets.length;
      const overspentBudgetsCount = budgets.filter((b) => (b.spentAmount || 0) > (b.allocatedAmount || 0)).length;

      // Read FIRE progress
      const fireNumber = FIREEngine.calculateFireNumber(monthlyExpense > 0 ? monthlyExpense : 15000000, 4, 'regular_fire');
      const fireProgressPercent = fireNumber > 0 ? Math.min(100, Math.round((Math.max(0, netWorth) / fireNumber) * 100)) : 0;
      const fireTimeline = FinancialTruthEngine.calculateForecast(Math.max(0, netWorth), monthlySavings, 7, 360);
      const hitPoint = fireTimeline.find((pt) => pt.estimatedNetWorth >= fireNumber);
      const fireYearsRemaining = hitPoint ? parseFloat((hitPoint.month / 12).toFixed(1)) : 30;

      const snapshot: FinancialSnapshotInput = {
        netWorth: Math.max(0, netWorth),
        monthlyIncome: monthlyIncome > 0 ? monthlyIncome : 30000000,
        monthlyExpense: monthlyExpense > 0 ? monthlyExpense : 15000000,
        monthlySavings,
        monthlyInvestment,
        totalDebt,
        totalAssets,
        totalSavingsBalance,
        activeBudgetsCount,
        overspentBudgetsCount,
        fireProgressPercent,
        fireYearsRemaining,
        sixJarsCompliant: true,
        recentTransactionCount: txs.length
      };

      // Execute Use Cases
      const health = await this.healthUseCase.execute(snapshot, language);
      const insights = await this.insightsUseCase.execute(snapshot, health, language);
      const recommendations = await this.recsUseCase.execute(snapshot, health, language);
      const risks = await this.riskUseCase.execute(snapshot, health, language);
      const opportunities = await this.oppUseCase.execute(snapshot, health, language);

      const priorities = AICoachEngine.prioritize(recommendations, risks, language);
      const actionPlan = await this.planUseCase.execute(recommendations, risks, language);
      const achievements = AICoachEngine.generateAchievements(snapshot, health, language);
      const notifications = AICoachEngine.generateNotifications(health, risks, language);

      const summary = await this.summaryUseCase.execute(health, risks, opportunities, recommendations, language);
      const statistics = await this.statsUseCase.execute(health, risks, opportunities, recommendations, language);

      const chartData: ChartDataPoint[] = Object.values(health.categories).map((cat) => ({
        label: cat.category.replace('_', ' ').toUpperCase(),
        value: cat.score,
        color: cat.score >= 80 ? '#10B981' : cat.score >= 60 ? '#3B82F6' : '#EF4444'
      }));

      const widgets: CoachWidget[] = [
        {
          widgetId: 'ai_coach_health_card',
          title: language === 'vi' ? 'Thẻ Sức Khỏe Tài Chính AI Coach' : 'AI Coach Financial Health Card',
          isEnabled: true,
          precomputedData: {
            overallScore: health.overallScore,
            grade: health.grade,
            status: health.status
          }
        }
      ];

      const history: CoachHistory[] = [
        {
          id: 'hist_latest',
          date: new Date().toISOString().split('T')[0],
          healthScore: health.overallScore,
          insightsCount: insights.length,
          actionsCompletedCount: summary.completedActionsCount,
          note: language === 'vi' ? 'Đánh giá tự động hệ thống' : 'System automated assessment'
        }
      ];

      return {
        health,
        summary,
        statistics,
        priorities,
        risks,
        opportunities,
        insights,
        recommendations,
        actionPlan,
        achievements,
        notifications,
        history,
        widgets,
        chartData,
        isLoading: false
      };
    } catch (err: any) {
      const fallbackSnapshot: FinancialSnapshotInput = {
        netWorth: 0,
        monthlyIncome: 30000000,
        monthlyExpense: 15000000,
        monthlySavings: 15000000,
        monthlyInvestment: 5000000,
        totalDebt: 0,
        totalAssets: 0,
        totalSavingsBalance: 0,
        activeBudgetsCount: 0,
        overspentBudgetsCount: 0,
        fireProgressPercent: 0,
        fireYearsRemaining: 20,
        sixJarsCompliant: true,
        recentTransactionCount: 0
      };

      const health = AICoachEngine.analyzeHealth(fallbackSnapshot, language);

      return {
        health,
        summary: {
          healthScore: health.overallScore,
          formattedHealthScore: `${health.overallScore}/100`,
          topPriorityCount: 0,
          activeRisksCount: 0,
          activeOpportunitiesCount: 0,
          pendingActionsCount: 0,
          completedActionsCount: 0,
          primaryAdvice: 'Maintain system health',
          healthGrade: health.grade
        },
        statistics: {
          totalActionsCount: 0,
          completionRatePercent: 100,
          healthScoreTrend: 'stable',
          riskIndex: 0,
          opportunityIndex: 0,
          financialDisciplineScore: 70
        },
        priorities: [],
        risks: [],
        opportunities: [],
        insights: [],
        recommendations: [],
        actionPlan: { today: [], thisWeek: [], thisMonth: [], nextMonth: [], longTerm: [] },
        achievements: [],
        notifications: [],
        history: [],
        widgets: [],
        chartData: [],
        isLoading: false,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu Huấn Luyện Viên AI. Vui lòng thử lại.',
          'Unable to load AI Coach State. Please try again.',
          language
        )
      };
    }
  }
}
