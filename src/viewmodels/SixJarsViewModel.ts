/**
 * Daily Finance 2.5 - SixJarsViewModel
 * ViewModel for Six Jars Domain (TASK 4 & 5).
 * Exposes immutable SixJarsUiState.
 * Communicates exclusively through Use Cases. Never accesses Repository directly.
 */

import {
  SixJarsUiState,
  Jar,
  JarUiItem,
  JarContribution,
  JarTransfer,
  JarAllocation,
  JarRule,
  Language,
  ChartDataPoint
} from '../types';
import {
  CreateJarUseCase,
  UpdateJarUseCase,
  DeleteJarUseCase,
  ArchiveJarUseCase,
  AllocateIncomeUseCase,
  TransferBetweenJarsUseCase,
  RecordJarContributionUseCase,
  UpdateAllocationRuleUseCase,
  GetJarSummaryUseCase,
  GetJarForecastUseCase,
  GetJarStatisticsUseCase,
  GetJarsUseCase
} from '../usecases/SixJarsUseCases';
import { SixJarsEngine } from '../domain/SixJarsEngine';
import { SixJarsMapper } from '../domain/SixJarsMapper';
import { MoneyFormatter } from '../formatters';
import { toSafeUserError } from '../utils/safeError';

export class SixJarsViewModel {
  private createUseCase: CreateJarUseCase;
  private updateUseCase: UpdateJarUseCase;
  private deleteUseCase: DeleteJarUseCase;
  private archiveUseCase: ArchiveJarUseCase;
  private allocateUseCase: AllocateIncomeUseCase;
  private transferUseCase: TransferBetweenJarsUseCase;
  private contributionUseCase: RecordJarContributionUseCase;
  private ruleUseCase: UpdateAllocationRuleUseCase;
  private summaryUseCase: GetJarSummaryUseCase;
  private forecastUseCase: GetJarForecastUseCase;
  private statsUseCase: GetJarStatisticsUseCase;
  private getJarsUseCase: GetJarsUseCase;

  constructor(
    createUseCase: CreateJarUseCase,
    updateUseCase: UpdateJarUseCase,
    deleteUseCase: DeleteJarUseCase,
    archiveUseCase: ArchiveJarUseCase,
    allocateUseCase: AllocateIncomeUseCase,
    transferUseCase: TransferBetweenJarsUseCase,
    contributionUseCase: RecordJarContributionUseCase,
    ruleUseCase: UpdateAllocationRuleUseCase,
    summaryUseCase: GetJarSummaryUseCase,
    forecastUseCase: GetJarForecastUseCase,
    statsUseCase: GetJarStatisticsUseCase,
    getJarsUseCase: GetJarsUseCase
  ) {
    if (
      !createUseCase ||
      !updateUseCase ||
      !deleteUseCase ||
      !archiveUseCase ||
      !allocateUseCase ||
      !transferUseCase ||
      !contributionUseCase ||
      !ruleUseCase ||
      !summaryUseCase ||
      !forecastUseCase ||
      !statsUseCase ||
      !getJarsUseCase
    ) {
      throw new Error('[SixJarsViewModel] Fail-Fast: All dependent UseCases are required');
    }
    this.createUseCase = createUseCase;
    this.updateUseCase = updateUseCase;
    this.deleteUseCase = deleteUseCase;
    this.archiveUseCase = archiveUseCase;
    this.allocateUseCase = allocateUseCase;
    this.transferUseCase = transferUseCase;
    this.contributionUseCase = contributionUseCase;
    this.ruleUseCase = ruleUseCase;
    this.summaryUseCase = summaryUseCase;
    this.forecastUseCase = forecastUseCase;
    this.statsUseCase = statsUseCase;
    this.getJarsUseCase = getJarsUseCase;
  }

  /**
   * Produces the full immutable SixJarsUiState.
   */
  async getSixJarsUiState(
    spaceId?: string,
    contributions: JarContribution[] = [],
    transfers: JarTransfer[] = [],
    allocations: JarAllocation[] = [],
    language: Language = 'vi'
  ): Promise<SixJarsUiState> {
    try {
      const allJars = await this.getJarsUseCase.execute(spaceId);
      const activeJars = allJars.filter((j) => !j.isSoftDeleted && j.status !== 'archived' && j.isEnabled !== false);

      const rawSummary = await this.summaryUseCase.execute(contributions, transfers, spaceId, language);
      const summary = {
        ...rawSummary,
        formattedTotalBalance: MoneyFormatter.format(rawSummary.totalBalance, 'VND', language),
        formattedTotalContributionsThisMonth: MoneyFormatter.format(rawSummary.totalContributionsThisMonth, 'VND', language),
        formattedTotalTransfersThisMonth: MoneyFormatter.format(rawSummary.totalTransfersThisMonth, 'VND', language)
      };

      const statistics = await this.statsUseCase.execute(spaceId);
      const forecast = await this.forecastUseCase.execute(30000000, spaceId, language);
      const targets = SixJarsEngine.evaluateTargets(activeJars, language);
      const alerts = SixJarsEngine.evaluateAlerts(activeJars, language);

      const totalPercentage = activeJars.reduce((sum, j) => sum + (j.percent || 0), 0);
      const isTotal100Percent = Math.abs(totalPercentage - 100) < 0.01;

      const jarUiItems: JarUiItem[] = activeJars.map((jar) => {
        const item = SixJarsMapper.toPresentationItem(jar, language);
        const jarAlerts = alerts.filter((a) => a.jarId === jar.id);
        const forecast3M = forecast.projectedBalances3Months[jar.id] || jar.currentBalance;

        return {
          ...item,
          formattedBalance: MoneyFormatter.format(item.jar.currentBalance || 0, 'VND', language),
          formattedTarget: MoneyFormatter.format(item.jar.targetAmount || 0, 'VND', language),
          formattedRemainingToTarget: MoneyFormatter.format(item.remainingToTarget || 0, 'VND', language),
          formattedMonthlyContribution: MoneyFormatter.format(item.monthlyContribution || 0, 'VND', language),
          formattedForecastBalance3Months: MoneyFormatter.format(forecast3M, 'VND', language),
          forecastBalance3Months: forecast3M,
          alerts: jarAlerts
        };
      });

      const chartData: ChartDataPoint[] = activeJars.map((j) => ({
        label: j.nameVi,
        value: j.currentBalance || 0,
        color: j.color
      }));

      const rules: JarRule[] = activeJars.map((j) => ({
        id: `rule_${j.id}`,
        jarId: j.id,
        ruleType: j.ruleType || 'percentage',
        percentage: j.percent || 0,
        fixedAmount: j.fixedAllocationAmount || 0,
        isEnabled: j.isEnabled !== false
      }));

      const insights: string[] = [];
      if (!isTotal100Percent) {
        insights.push(
          language === 'vi'
            ? `Tổng tỷ lệ hũ hiện tại là ${totalPercentage}%. Vui lòng điều chỉnh về 100% để phân bổ thu nhập chính xác.`
            : `Current jar ratio is ${totalPercentage}%. Adjust to 100% for accurate allocation.`
        );
      }
      if (statistics.largestJarName) {
        insights.push(
          language === 'vi'
            ? `Hũ chiếm tỷ trọng số dư lớn nhất là '${statistics.largestJarName}'.`
            : `Largest balance jar is '${statistics.largestJarName}'.`
        );
      }

      return {
        summary,
        statistics,
        forecast,
        jars: jarUiItems,
        contributions,
        transfers,
        allocations,
        rules,
        targets,
        alerts,
        history: [],
        insights,
        widgets: [
          {
            widgetId: 'six_jars_overview',
            title: language === 'vi' ? 'Tổng Quan 6 Hũ' : '6 Jars Overview',
            isEnabled: true,
            precomputedData: { totalBalance: summary.totalBalance, totalPercentage }
          }
        ],
        chartData,
        totalPercentage,
        isTotal100Percent,
        isLoading: false
      };
    } catch (err: any) {
      return {
        summary: {
          totalBalance: 0,
          formattedTotalBalance: '0 ₫',
          totalAllocatedPercent: 0,
          activeJarsCount: 0,
          totalContributionsThisMonth: 0,
          formattedTotalContributionsThisMonth: '0 ₫',
          totalTransfersThisMonth: 0,
          formattedTotalTransfersThisMonth: '0 ₫'
        },
        statistics: { averageJarBalance: 0, complianceScore: 0 },
        forecast: {
          projectedBalances3Months: {},
          projectedBalances6Months: {},
          projectedBalances12Months: {},
          formattedProjectedBalances: {},
          monthsToReachTargets: {},
          status: 'on_track'
        },
        jars: [],
        contributions: [],
        transfers: [],
        allocations: [],
        rules: [],
        targets: [],
        alerts: [],
        history: [],
        insights: [],
        widgets: [],
        chartData: [],
        totalPercentage: 0,
        isTotal100Percent: false,
        isLoading: false,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu quy tắc 6 Hũ. Vui lòng thử lại.',
          'Unable to load 6 Jars State. Please try again.',
          language
        )
      };
    }
  }

  async createJar(jarData: Omit<Jar, 'id'>): Promise<Jar> {
    return this.createUseCase.execute(jarData);
  }

  async updateJar(jar: Jar): Promise<Jar> {
    return this.updateUseCase.execute(jar);
  }

  async deleteJar(id: string, spaceId?: string): Promise<boolean> {
    return this.deleteUseCase.execute(id, spaceId);
  }

  async archiveJar(id: string, spaceId?: string): Promise<Jar> {
    return this.archiveUseCase.execute(id, spaceId);
  }

  async allocateIncome(incomeAmount: number, spaceId?: string, language: Language = 'vi') {
    return this.allocateUseCase.execute(incomeAmount, spaceId, language);
  }

  async transferBetweenJars(fromJarId: string, toJarId: string, amount: number, spaceId?: string, language: Language = 'vi') {
    return this.transferUseCase.execute(fromJarId, toJarId, amount, spaceId, language);
  }

  async recordContribution(jarId: string, amount: number, note?: string, spaceId?: string, language: Language = 'vi') {
    return this.contributionUseCase.execute(jarId, amount, note, spaceId, language);
  }

  async updateAllocationRule(jarId: string, rule: JarRule, spaceId?: string) {
    return this.ruleUseCase.execute(jarId, rule, spaceId);
  }
}
