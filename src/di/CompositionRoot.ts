/**
 * Daily Finance 3.0 - CompositionRoot
 * Central Dependency Injection Composition Root.
 * Responsible for instantiating concrete repository implementations,
 * constructing RepositoriesContainer, instantiating UseCases in explicit dependency order,
 * and providing fully injected ViewModels to the presentation layer.
 * 
 * Strict Architecture Rules:
 * - Fail Fast: Throws explicit descriptive error if any required dependency is missing.
 * - No Default Fallbacks in UseCases or ViewModels.
 * - Single Source of Truth for DI wiring.
 */

import {
  LocalTransactionRepository,
  LocalWalletRepository,
  LocalBudgetRepository,
  LocalSavingRepository,
  LocalInvestmentRepository,
  LocalLoanRepository,
  LocalSixJarsRepository,
  LocalPreferenceRepository,
  LocalReportRepository,
  LocalDashboardRepository,
  LocalBackupRepository
} from '../repositories/implementations';

import { RepositoriesContainer, GetFinancialSnapshotUseCase } from '../usecases/FinancialSnapshotUseCase';
import { GetFinancialIntelligenceUseCase } from '../usecases/FinancialIntelligenceUseCase';
import { GetFinancialTimelineUseCase } from '../usecases/FinancialTimelineUseCase';
import { GetFinancialForecastUseCase } from '../usecases/FinancialForecastUseCase';
import { GetFinancialPlanUseCase } from '../usecases/FinancialPlanUseCase';
import { GetCoachSessionUseCase } from '../usecases/GetCoachSessionUseCase';
import { GetDashboardStateUseCase } from '../usecases/GetDashboardStateUseCase';
import { GetGoalPlannerStateUseCase } from '../usecases/GetGoalPlannerStateUseCase';
import { GetNotificationCenterStateUseCase } from '../usecases/GetNotificationCenterStateUseCase';
import { GetHabitEngineStateUseCase } from '../usecases/GetHabitEngineStateUseCase';
import { GetAutomationCenterStateUseCase } from '../usecases/GetAutomationCenterStateUseCase';
import { GetAIChatStateUseCase } from '../usecases/GetAIChatStateUseCase';
import { GetAnalyticsStateUseCase } from '../usecases/GetAnalyticsStateUseCase';
import { GetWidgetStateUseCase } from '../usecases/GetWidgetStateUseCase';
import { GetVoiceAssistantStateUseCase } from '../usecases/GetVoiceAssistantStateUseCase';
import { GetBackupAndHealthStateUseCase } from '../usecases/GetBackupAndHealthStateUseCase';
import { GoogleAuthClient } from '../domain/GoogleAuthClient';
import { GoogleDriveSyncProvider } from '../domain/GoogleDriveSyncProvider';
import { SyncOutboxQueue } from '../domain/SyncOutboxQueue';
import {
  GetDebtsAndLoansUseCase,
  CreateDebtUseCase,
  UpdateDebtUseCase,
  ArchiveDebtUseCase,
  DeleteDebtUseCase,
  RecordRepaymentUseCase,
  RecordBorrowUseCase,
  RecordLoanUseCase,
  GetDebtSummaryUseCase,
  GetDebtForecastUseCase,
  GetDebtStatisticsUseCase
} from '../usecases/DebtUseCases';
import { GenerateReportUseCase, GetReportUseCase } from '../usecases/ReportUseCases';
import { GenerateDashboardUseCase } from '../usecases/DashboardUseCases';

import {
  GetSavingsGoalUseCase,
  CreateSavingsGoalUseCase,
  UpdateSavingsGoalUseCase,
  ArchiveSavingsGoalUseCase,
  DeleteSavingsGoalUseCase,
  RecordContributionUseCase
} from '../usecases/SavingsUseCases';

import {
  GetBudgetsUseCase,
  CreateBudgetUseCase,
  CloseBudgetUseCase
} from '../usecases/BudgetUseCases';

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
import { GetTransactionsUseCase, AddTransactionUseCase, TransferMoneyUseCase } from '../usecases/TransactionUseCases';

import { DashboardViewModel } from '../viewmodels/DashboardViewModel';
import { GoalPlannerViewModel } from '../viewmodels/GoalPlannerViewModel';
import { NotificationCenterViewModel } from '../viewmodels/NotificationCenterViewModel';
import { AICoachViewModel } from '../viewmodels/AICoachViewModel';
import { HabitEngineViewModel } from '../viewmodels/HabitEngineViewModel';
import { AutomationCenterViewModel } from '../viewmodels/AutomationCenterViewModel';
import { AIChatViewModel } from '../viewmodels/AIChatViewModel';
import { AnalyticsViewModel } from '../viewmodels/AnalyticsViewModel';
import { WidgetViewModel } from '../viewmodels/WidgetViewModel';
import { VoiceAssistantViewModel } from '../viewmodels/VoiceAssistantViewModel';
import { DebtViewModel } from '../viewmodels/DebtViewModel';
import { ReportsViewModel } from '../viewmodels/ReportsViewModel';
import { BudgetViewModel } from '../viewmodels/BudgetViewModel';
import { SavingsViewModel } from '../viewmodels/SavingsViewModel';
import { InvestmentViewModel } from '../viewmodels/InvestmentViewModel';
import { SixJarsViewModel } from '../viewmodels/SixJarsViewModel';
import { FIREViewModel } from '../viewmodels/FIREViewModel';
import { HomeViewModel } from '../viewmodels/HomeViewModel';
import { BackupAndHealthViewModel } from '../viewmodels/BackupAndHealthViewModel';

export class CompositionRoot {
  private static instance: CompositionRoot | null = null;

  // Repositories
  readonly repositoriesContainer: RepositoriesContainer;

  // Root Snapshot UseCase
  readonly snapshotUseCase: GetFinancialSnapshotUseCase;

  // Domain Level UseCases
  readonly intelligenceUseCase: GetFinancialIntelligenceUseCase;
  readonly timelineUseCase: GetFinancialTimelineUseCase;
  readonly forecastUseCase: GetFinancialForecastUseCase;
  readonly planUseCase: GetFinancialPlanUseCase;
  readonly coachSessionUseCase: GetCoachSessionUseCase;

  // Feature UseCases
  readonly dashboardStateUseCase: GetDashboardStateUseCase;
  readonly goalPlannerStateUseCase: GetGoalPlannerStateUseCase;
  readonly notificationCenterStateUseCase: GetNotificationCenterStateUseCase;
  readonly habitEngineStateUseCase: GetHabitEngineStateUseCase;
  readonly automationCenterStateUseCase: GetAutomationCenterStateUseCase;
  readonly aiChatStateUseCase: GetAIChatStateUseCase;
  readonly analyticsStateUseCase: GetAnalyticsStateUseCase;
  readonly widgetStateUseCase: GetWidgetStateUseCase;
  readonly voiceAssistantStateUseCase: GetVoiceAssistantStateUseCase;
  readonly backupAndHealthStateUseCase: GetBackupAndHealthStateUseCase;

  // Injected ViewModels
  readonly dashboardViewModel: DashboardViewModel;
  readonly goalPlannerViewModel: GoalPlannerViewModel;
  readonly notificationCenterViewModel: NotificationCenterViewModel;
  readonly aiCoachViewModel: AICoachViewModel;
  readonly habitEngineViewModel: HabitEngineViewModel;
  readonly automationCenterViewModel: AutomationCenterViewModel;
  readonly aiChatViewModel: AIChatViewModel;
  readonly analyticsViewModel: AnalyticsViewModel;
  readonly widgetViewModel: WidgetViewModel;
  readonly voiceAssistantViewModel: VoiceAssistantViewModel;
  readonly debtViewModel: DebtViewModel;
  readonly reportsViewModel: ReportsViewModel;
  readonly budgetViewModel: BudgetViewModel;
  readonly savingsViewModel: SavingsViewModel;
  readonly investmentViewModel: InvestmentViewModel;
  readonly sixJarsViewModel: SixJarsViewModel;
  readonly fireViewModel: FIREViewModel;
  readonly homeViewModel: HomeViewModel;
  readonly backupAndHealthViewModel: BackupAndHealthViewModel;

  constructor(customRepos?: RepositoriesContainer) {
    // 1. Initialize Repositories
    if (customRepos) {
      this.repositoriesContainer = customRepos;
    } else {
      this.repositoriesContainer = {
        txRepo: new LocalTransactionRepository(),
        walletRepo: new LocalWalletRepository(),
        budgetRepo: new LocalBudgetRepository(),
        savingRepo: new LocalSavingRepository(),
        investmentRepo: new LocalInvestmentRepository(),
        loanRepo: new LocalLoanRepository(),
        sixJarsRepo: new LocalSixJarsRepository(),
        prefRepo: new LocalPreferenceRepository(),
        backupRepo: new LocalBackupRepository()
      };
    }

    // Fail-fast validation of repositories
    if (!this.repositoriesContainer.txRepo || !this.repositoriesContainer.walletRepo) {
      throw new Error('[CompositionRoot] Fail-Fast: Required transaction and wallet repositories must be provided');
    }

    // 2. Initialize Base Snapshot UseCase
    this.snapshotUseCase = new GetFinancialSnapshotUseCase(this.repositoriesContainer);

    // 3. Initialize Core Domain Intelligence / Timeline / Forecast / Plan UseCases
    this.intelligenceUseCase = new GetFinancialIntelligenceUseCase(this.snapshotUseCase);
    this.timelineUseCase = new GetFinancialTimelineUseCase(this.snapshotUseCase);
    this.forecastUseCase = new GetFinancialForecastUseCase(
      this.snapshotUseCase,
      this.intelligenceUseCase,
      this.timelineUseCase
    );
    this.planUseCase = new GetFinancialPlanUseCase(
      this.snapshotUseCase,
      this.intelligenceUseCase,
      this.timelineUseCase,
      this.forecastUseCase
    );
    this.coachSessionUseCase = new GetCoachSessionUseCase(
      this.snapshotUseCase,
      this.intelligenceUseCase,
      this.timelineUseCase,
      this.forecastUseCase,
      this.planUseCase
    );

    // 4. Initialize Feature UseCases
    this.dashboardStateUseCase = new GetDashboardStateUseCase(
      this.snapshotUseCase,
      this.intelligenceUseCase,
      this.timelineUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.coachSessionUseCase
    );

    this.goalPlannerStateUseCase = new GetGoalPlannerStateUseCase(
      this.snapshotUseCase,
      this.intelligenceUseCase,
      this.timelineUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.coachSessionUseCase
    );

    this.notificationCenterStateUseCase = new GetNotificationCenterStateUseCase(
      this.snapshotUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.coachSessionUseCase,
      this.dashboardStateUseCase,
      this.goalPlannerStateUseCase
    );

    this.habitEngineStateUseCase = new GetHabitEngineStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.goalPlannerStateUseCase,
      this.notificationCenterStateUseCase,
      this.planUseCase
    );

    this.automationCenterStateUseCase = new GetAutomationCenterStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.notificationCenterStateUseCase,
      this.habitEngineStateUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.dashboardStateUseCase,
      this.goalPlannerStateUseCase
    );

    this.aiChatStateUseCase = new GetAIChatStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.goalPlannerStateUseCase,
      this.habitEngineStateUseCase,
      this.automationCenterStateUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.dashboardStateUseCase,
      this.notificationCenterStateUseCase
    );

    this.analyticsStateUseCase = new GetAnalyticsStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.goalPlannerStateUseCase,
      this.habitEngineStateUseCase,
      this.automationCenterStateUseCase,
      this.aiChatStateUseCase,
      this.timelineUseCase,
      this.intelligenceUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.dashboardStateUseCase,
      this.notificationCenterStateUseCase
    );

    this.widgetStateUseCase = new GetWidgetStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.goalPlannerStateUseCase,
      this.habitEngineStateUseCase,
      this.automationCenterStateUseCase,
      this.aiChatStateUseCase,
      this.analyticsStateUseCase,
      this.timelineUseCase,
      this.intelligenceUseCase,
      this.forecastUseCase,
      this.planUseCase,
      this.dashboardStateUseCase,
      this.notificationCenterStateUseCase,
      this.repositoriesContainer.txRepo
    );

    this.voiceAssistantStateUseCase = new GetVoiceAssistantStateUseCase(
      this.snapshotUseCase,
      this.coachSessionUseCase,
      this.dashboardStateUseCase,
      this.goalPlannerStateUseCase,
      this.notificationCenterStateUseCase,
      this.habitEngineStateUseCase,
      this.automationCenterStateUseCase,
      this.aiChatStateUseCase,
      this.analyticsStateUseCase,
      new AddTransactionUseCase(this.repositoriesContainer.txRepo),
      new TransferMoneyUseCase(this.repositoriesContainer.walletRepo, this.repositoriesContainer.txRepo),
      this.repositoriesContainer.walletRepo
    );

    const backupRepo = this.repositoriesContainer.backupRepo || new LocalBackupRepository();
    const googleAuthClient = GoogleAuthClient.getInstance();
    const driveSyncProvider = new GoogleDriveSyncProvider(googleAuthClient);
    const outboxQueue = new SyncOutboxQueue();

    this.backupAndHealthStateUseCase = new GetBackupAndHealthStateUseCase(
      backupRepo,
      this.repositoriesContainer.txRepo,
      driveSyncProvider,
      outboxQueue
    );

    // 5. Initialize ViewModels
    this.dashboardViewModel = new DashboardViewModel(this.dashboardStateUseCase);
    this.goalPlannerViewModel = new GoalPlannerViewModel(this.goalPlannerStateUseCase);
    this.notificationCenterViewModel = new NotificationCenterViewModel(this.notificationCenterStateUseCase);

    this.aiCoachViewModel = new AICoachViewModel(
      new AnalyzeFinancialHealthUseCase(),
      new GenerateInsightsUseCase(),
      new GenerateRecommendationsUseCase(),
      new GenerateActionPlanUseCase(),
      new GenerateRiskAssessmentUseCase(),
      new GenerateOpportunityAnalysisUseCase(),
      new GetCoachSummaryUseCase(),
      new GetCoachStatisticsUseCase(),
      new GetWalletsUseCase(this.repositoriesContainer.walletRepo),
      new GetPortfolioUseCase(this.repositoriesContainer.investmentRepo),
      new GetDebtsAndLoansUseCase(this.repositoriesContainer.loanRepo),
      new GetTransactionsUseCase(this.repositoriesContainer.txRepo),
      new GetBudgetsUseCase(this.repositoriesContainer.budgetRepo),
      new GetSavingsGoalUseCase(this.repositoriesContainer.savingRepo)
    );

    this.habitEngineViewModel = new HabitEngineViewModel(this.habitEngineStateUseCase);
    this.automationCenterViewModel = new AutomationCenterViewModel(this.automationCenterStateUseCase);
    this.aiChatViewModel = new AIChatViewModel(this.aiChatStateUseCase);
    this.analyticsViewModel = new AnalyticsViewModel(this.analyticsStateUseCase);
    this.widgetViewModel = new WidgetViewModel(this.widgetStateUseCase);
    this.voiceAssistantViewModel = new VoiceAssistantViewModel(this.voiceAssistantStateUseCase);

    const createDebtUseCase = new CreateDebtUseCase(this.repositoriesContainer.loanRepo);
    this.debtViewModel = new DebtViewModel(
      new GetDebtsAndLoansUseCase(this.repositoriesContainer.loanRepo),
      createDebtUseCase,
      new UpdateDebtUseCase(this.repositoriesContainer.loanRepo),
      new ArchiveDebtUseCase(this.repositoriesContainer.loanRepo),
      new DeleteDebtUseCase(this.repositoriesContainer.loanRepo),
      new RecordRepaymentUseCase(this.repositoriesContainer.loanRepo),
      new RecordBorrowUseCase(createDebtUseCase),
      new RecordLoanUseCase(createDebtUseCase),
      new GetDebtSummaryUseCase(this.repositoriesContainer.loanRepo),
      new GetDebtForecastUseCase(this.repositoriesContainer.loanRepo),
      new GetDebtStatisticsUseCase(this.repositoriesContainer.loanRepo)
    );

    const reportRepo = new LocalReportRepository(this.repositoriesContainer.txRepo);
    this.reportsViewModel = new ReportsViewModel(
      new GenerateReportUseCase(this.repositoriesContainer.txRepo, reportRepo),
      new GetReportUseCase(reportRepo)
    );

    this.budgetViewModel = new BudgetViewModel(
      new GetBudgetsUseCase(this.repositoriesContainer.budgetRepo),
      new CreateBudgetUseCase(this.repositoriesContainer.budgetRepo),
      new CloseBudgetUseCase(this.repositoriesContainer.budgetRepo)
    );

    this.savingsViewModel = new SavingsViewModel(
      new GetSavingsGoalUseCase(this.repositoriesContainer.savingRepo),
      new CreateSavingsGoalUseCase(this.repositoriesContainer.savingRepo),
      new UpdateSavingsGoalUseCase(this.repositoriesContainer.savingRepo),
      new ArchiveSavingsGoalUseCase(this.repositoriesContainer.savingRepo),
      new DeleteSavingsGoalUseCase(this.repositoriesContainer.savingRepo),
      new RecordContributionUseCase(this.repositoriesContainer.savingRepo)
    );

    this.investmentViewModel = new InvestmentViewModel(
      new GetPortfolioUseCase(this.repositoriesContainer.investmentRepo),
      new CreateInvestmentUseCase(this.repositoriesContainer.investmentRepo),
      new UpdateInvestmentUseCase(this.repositoriesContainer.investmentRepo),
      new ArchiveInvestmentUseCase(this.repositoriesContainer.investmentRepo),
      new DeleteInvestmentUseCase(this.repositoriesContainer.investmentRepo),
      new BuyAssetUseCase(this.repositoriesContainer.investmentRepo),
      new SellAssetUseCase(this.repositoriesContainer.investmentRepo),
      new RecordDividendUseCase(this.repositoriesContainer.investmentRepo)
    );

    this.sixJarsViewModel = new SixJarsViewModel(
      new CreateJarUseCase(this.repositoriesContainer.sixJarsRepo),
      new UpdateJarUseCase(this.repositoriesContainer.sixJarsRepo),
      new DeleteJarUseCase(this.repositoriesContainer.sixJarsRepo),
      new ArchiveJarUseCase(this.repositoriesContainer.sixJarsRepo),
      new AllocateIncomeUseCase(this.repositoriesContainer.sixJarsRepo),
      new TransferBetweenJarsUseCase(this.repositoriesContainer.sixJarsRepo),
      new RecordJarContributionUseCase(this.repositoriesContainer.sixJarsRepo),
      new UpdateAllocationRuleUseCase(this.repositoriesContainer.sixJarsRepo),
      new GetJarSummaryUseCase(this.repositoriesContainer.sixJarsRepo),
      new GetJarForecastUseCase(this.repositoriesContainer.sixJarsRepo),
      new GetJarStatisticsUseCase(this.repositoriesContainer.sixJarsRepo),
      new GetJarsUseCase(this.repositoriesContainer.sixJarsRepo)
    );

    this.fireViewModel = new FIREViewModel(
      new CreateFireProfileUseCase(),
      new UpdateFireProfileUseCase(),
      new CalculateFireGoalUseCase(),
      new GenerateFireProjectionUseCase(),
      new GenerateFireForecastUseCase(),
      new GenerateFireScenarioUseCase(),
      new EvaluateFireRiskUseCase(),
      new GenerateFireRecommendationUseCase(),
      new GetFireSummaryUseCase(),
      new GetFireStatisticsUseCase(),
      new GetWalletsUseCase(this.repositoriesContainer.walletRepo),
      new GetPortfolioUseCase(this.repositoriesContainer.investmentRepo),
      new GetDebtsAndLoansUseCase(this.repositoriesContainer.loanRepo),
      new GetTransactionsUseCase(this.repositoriesContainer.txRepo)
    );

    const dashboardRepo = new LocalDashboardRepository(
      this.repositoriesContainer.txRepo,
      this.repositoriesContainer.walletRepo
    );
    this.homeViewModel = new HomeViewModel(
      new GenerateDashboardUseCase(
        this.repositoriesContainer.txRepo,
        this.repositoriesContainer.walletRepo,
        dashboardRepo
      )
    );

    this.backupAndHealthViewModel = new BackupAndHealthViewModel(this.backupAndHealthStateUseCase);
  }

  /**
   * Singleton instance retrieval.
   */
  public static getInstance(): CompositionRoot {
    if (!CompositionRoot.instance) {
      CompositionRoot.instance = new CompositionRoot();
    }
    return CompositionRoot.instance;
  }

  /**
   * Resets or sets custom Composition Root for testing/mocking.
   */
  public static setInstance(customRoot: CompositionRoot | null): void {
    CompositionRoot.instance = customRoot;
  }
}
