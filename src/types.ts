export type Language = 'vi' | 'en';

export type DeviceViewport = 'phone' | 'foldable' | 'tablet';

export type ThemeStyle = 'm3-expressive' | 'apple-wallet' | 'google-wallet';

export type ActiveTab = 
  | 'prototype' 
  | 'sprint2-domain'
  | 'blueprint-prd' 
  | 'blueprint-ia' 
  | 'blueprint-ds' 
  | 'blueprint-flows' 
  | 'blueprint-screens' 
  | 'blueprint-components' 
  | 'blueprint-wireframes' 
  | 'blueprint-architecture';

export type AppScreen = 
  | 'dashboard' 
  | 'transactions' 
  | 'wealth_debts' 
  | 'methods_fire' 
  | 'methods_advanced'
  | 'ai_insights' 
  | 'reports' 
  | 'settings_modules';

export interface NavigationContext {
  transactionType?: TransactionType;
  category?: string;
  goalId?: string;
  budgetId?: string;
  analyticsCategory?: string;
  reportPeriod?: string;
  fromScreen?: AppScreen;
}

export interface NavigationTarget {
  screen: AppScreen;
  context?: NavigationContext;
}

export type SpaceType = 'personal' | 'family' | 'company' | 'class' | 'other';

export interface FinancialSpace {
  id: string;
  name: string;
  type: SpaceType;
  balance: number;
  currency: string;
  cardColor: string; // Hex or gradient
  iconName: string;
  ownerName: string;
  membersCount: number;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

// Sprint 2: Core Immutable Domain Models
export interface Money {
  readonly amount: number;
  readonly currency: string;
  readonly scale?: number;
}

export interface Currency {
  readonly code: string;
  readonly symbol: string;
  readonly name: string;
  readonly decimalDigits: number;
}

export interface ExchangeRate {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly timestamp: number;
}

export interface Wallet {
  id: string;
  spaceId: string;
  name: string;
  type: 'cash' | 'bank' | 'e_wallet' | 'credit_card' | 'investment';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  status: 'active' | 'archived';
  cardColor?: string;
  iconName?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
  isDeleted?: boolean;
}

export interface Account {
  id: string;
  walletId: string;
  spaceId: string;
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  accountNumber?: string;
  bankName?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;
  isDeleted?: boolean;
}

export type CategoryType = 
  | 'income' 
  | 'expense' 
  | 'transfer' 
  | 'saving' 
  | 'investment' 
  | 'loan' 
  | 'debt' 
  | 'adjustment' 
  | 'opening_balance' 
  | 'compensation';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string;
  icon: string;
  color: string;
  spaceId?: string;
  subcategories?: Category[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'archived';
  version?: number;
}

export interface Merchant {
  id: string;
  spaceId: string;
  name: string;
  logoUrl?: string;
  defaultCategoryId?: string;
}

export type TransactionType = 
  | 'income'
  | 'expense'
  | 'transfer'
  | 'saving'
  | 'investment'
  | 'debt'
  | 'debt_payment'
  | 'compensation'
  | 'adjustment'
  | 'opening_balance'
  | 'initial_balance';

export type TransactionStatus = 
  | 'draft' 
  | 'validated' 
  | 'confirmed' 
  | 'soft_deleted' 
  | 'restored' 
  | 'archived';

export interface AuditTrailEntry {
  action: 'create' | 'validate' | 'confirm' | 'soft_delete' | 'restore' | 'archive' | 'update';
  timestamp: string;
  actor: string;
  previousState?: Partial<Transaction>;
  newState?: Partial<Transaction>;
  details?: string;
}

export interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  categoryId?: string; // Canonical category identifier alias
  spaceId: string;
  walletId?: string;
  accountId?: string;
  targetSpaceId?: string; // For transfers
  targetWalletId?: string;
  date: string;
  note?: string;
  description?: string; // Canonical description / note alias
  merchant?: string;
  method?: 'cash' | 'credit_card' | 'bank' | 'e_wallet';
  receiptUrl?: string;
  tags?: string[];
  splits?: TransactionSplit[];

  // Production Lifecycle & Orchestration (SPR1-T003)
  status?: TransactionStatus;
  isDeleted?: boolean;
  deletedAt?: string;
  archivedAt?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  auditTrail?: AuditTrailEntry[];
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  deviceId?: string;
}

export interface RecurringTransaction {
  id: string;
  spaceId: string;
  title: string;
  amount: number;
  currency: string;
  categoryId: string;
  walletId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isAutoExecute: boolean;
}

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type BudgetScopeType = 'category' | 'multiple_categories' | 'financial_space' | 'merchant' | 'tag' | 'payment_method' | 'space_group';
export type BudgetStatus = 'draft' | 'active' | 'exceeded' | 'completed' | 'archived';
export type BudgetStrategy = 'hard_budget' | 'soft_budget' | 'rolling_budget' | 'carry_over';
export type BudgetAlertLevel = '50%' | '75%' | '90%' | '100%' | 'exceeded' | 'normal';

export interface BudgetScope {
  scopeType: BudgetScopeType;
  targetValues: string[];
  spaceId?: string;
}

export interface BudgetProgressResult {
  used: number;
  formattedUsed: string;
  remaining: number;
  formattedRemaining: string;
  percentage: number;
  forecast: number;
  formattedForecast: string;
  remainingDays: number;
  dailyAllowance: number;
  formattedDailyAllowance: string;
}

export interface Budget {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  currency: string;
  period: BudgetPeriod;
  warningThreshold: number; // e.g. 80%
  spaceId?: string;
  // Extended SPR2-T001 Budget Engine fields
  status?: BudgetStatus;
  strategy?: BudgetStrategy;
  scopeType?: BudgetScopeType;
  targetCategories?: string[];
  merchant?: string;
  tag?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  carryOverAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface BudgetUiItem {
  id: string;
  category: string;
  allocatedAmount: number;
  formattedAllocated: string;
  spentAmount: number;
  formattedSpent: string;
  remainingAmount: number;
  formattedRemaining: string;
  usagePercent: number;
  currency: string;
  period: BudgetPeriod;
  status: BudgetStatus;
  strategy: BudgetStrategy;
  scopeType: BudgetScopeType;
  alertLevel: BudgetAlertLevel;
  isWarning: boolean;
  isExceeded: boolean;
  progress: BudgetProgressResult;
}

export interface BudgetWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface BudgetUiState {
  budgets: BudgetUiItem[];
  activeBudgetsCount: number;
  exceededBudgetsCount: number;
  totalAllocated: number;
  formattedTotalAllocated: string;
  totalSpent: number;
  formattedTotalSpent: string;
  totalRemaining: number;
  formattedTotalRemaining: string;
  overallUsagePercent: number;
  alerts: { id: string; message: string; level: BudgetAlertLevel }[];
  selectedPeriod: BudgetPeriod;
  widgets: BudgetWidgetState[];
  isLoading: boolean;
  error?: string | null;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'emergency' | 'house' | 'car' | 'travel' | 'investment' | string;
  icon: string;
  spaceId?: string;
  // Extended SPR2-T002 Savings Engine fields
  status?: SavingsStatus;
  type?: SavingsType;
  policy?: SavingsPolicyType;
  startDate?: string;
  currency?: string;
  autoSaveAmount?: number;
  roundUpMultiplier?: number;
  isSoftDeleted?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SavingsStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'soft_deleted';

export type SavingsType =
  | 'target_amount'
  | 'recurring'
  | 'automatic'
  | 'manual'
  | 'round_up'
  | 'percentage'
  | 'emergency_fund'
  | 'vacation_fund'
  | 'education_fund'
  | 'custom_goal';

export type SavingsPolicyType = 'flexible' | 'locked' | 'recurring' | 'auto_extend' | 'manual_close';

export type SavingsAlertLevel =
  | 'goal_started'
  | '50%'
  | '75%'
  | '90%'
  | '100%'
  | 'completed'
  | 'behind_schedule'
  | 'ahead_of_schedule'
  | 'no_contribution'
  | 'info';

export interface SavingsProgress {
  goalId: string;
  currentAmount: number;
  formattedCurrent: string;
  targetAmount: number;
  formattedTarget: string;
  remainingAmount: number;
  formattedRemaining: string;
  percentage: number;
  remainingDays: number;
  averageMonthlySaving: number;
  formattedAvgMonthly: string;
  averageDailySaving: number;
  formattedAvgDaily: string;
  isCompleted: boolean;
  isBehindSchedule: boolean;
}

export interface SavingsForecast {
  goalId: string;
  estimatedCompletionDate: string;
  projectedAmountAtDeadline: number;
  formattedProjectedAmount: string;
  requiredMonthlyContribution: number;
  formattedRequiredMonthly: string;
  requiredDailyContribution: number;
  formattedRequiredDaily: string;
  forecastStatus: 'on_track' | 'ahead' | 'behind';
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  formattedAmount: string;
  date: string;
  note?: string;
  transactionId?: string;
}

export interface SavingsPolicy {
  policyType: SavingsPolicyType;
  isLocked: boolean;
  autoExtendOnMissed: boolean;
  minMonthlyAmount?: number;
}

export interface SavingsMilestone {
  percentage: number;
  title: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface SavingsSummary {
  totalGoalsCount: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalTargetAmount: number;
  formattedTotalTarget: string;
  totalCurrentAmount: number;
  formattedTotalCurrent: string;
  totalRemainingAmount: number;
  formattedTotalRemaining: string;
  overallPercentage: number;
}

export interface SavingsStatistics {
  monthlyAverage: number;
  formattedMonthlyAverage: string;
  topContributingGoalTitle?: string;
  streakMonths: number;
}

export interface SavingsWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface SavingsUiGoalItem {
  goal: SavingsGoal;
  progress: SavingsProgress;
  forecast: SavingsForecast;
  milestones: SavingsMilestone[];
  alerts: { id: string; message: string; level: SavingsAlertLevel }[];
  policy: SavingsPolicy;
}

export interface SavingsUiState {
  summary: SavingsSummary;
  statistics: SavingsStatistics;
  goals: SavingsUiGoalItem[];
  recentContributions: SavingsContribution[];
  alerts: { id: string; message: string; level: SavingsAlertLevel; goalId?: string }[];
  insights: string[];
  widgets: SavingsWidgetState[];
  chartData: { label: string; value: number; date: string }[];
  isLoading: boolean;
  error?: string | null;
}

export type InvestmentType =
  | 'stock'
  | 'etf'
  | 'bond'
  | 'gold'
  | 'crypto'
  | 'fund'
  | 'savings_certificate'
  | 'real_estate'
  | 'business_capital'
  | 'custom'
  | 'other';

export type InvestmentStatus = 'draft' | 'active' | 'paused' | 'closed' | 'archived' | 'soft_deleted';

export type InvestmentPolicyType = 'long_term' | 'short_term' | 'dividend' | 'growth' | 'balanced' | 'income' | 'custom';

export type InvestmentAlertLevel =
  | 'target_profit'
  | 'stop_loss'
  | 'portfolio_allocation'
  | 'asset_concentration'
  | 'dividend_received'
  | 'market_event'
  | 'info'
  | 'warning'
  | 'danger';

export interface Investment {
  id: string;
  spaceId: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: string;
  symbol?: string;
  // Extended SPR2-T003 Investment Engine fields
  status?: InvestmentStatus;
  policy?: InvestmentPolicyType;
  isSoftDeleted?: boolean;
  targetProfitPercent?: number;
  stopLossPercent?: number;
  annualReturn?: number;
  monthlyReturn?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentAsset {
  symbol: string;
  name: string;
  type: InvestmentType;
  currentPrice: number;
  currency: string;
  spaceId?: string;
}

export interface InvestmentHolding {
  symbol: string;
  name: string;
  type: InvestmentType;
  totalQuantity: number;
  averageCostBasis: number;
  totalCostBasis: number;
  formattedCostBasis: string;
  currentPrice: number;
  currentValue: number;
  formattedCurrentValue: string;
  profitLoss: number;
  formattedProfitLoss: string;
  profitLossPercent: number;
  allocationPercent: number;
}

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend' | 'fee';
  quantity: number;
  price: number;
  amount: number;
  formattedAmount: string;
  date: string;
  note?: string;
  transactionId?: string;
}

export interface InvestmentPerformance {
  totalPortfolioValue: number;
  formattedPortfolioValue: string;
  totalCostBasis: number;
  formattedCostBasis: string;
  totalProfit: number;
  formattedTotalProfit: string;
  totalLoss: number;
  formattedTotalLoss: string;
  netProfit: number;
  formattedNetProfit: string;
  roi: number;
  annualReturn: number;
  monthlyReturn: number;
}

export interface InvestmentAllocation {
  type: InvestmentType | string;
  label: string;
  value: number;
  formattedValue: string;
  percentage: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface InvestmentForecast {
  expectedAnnualReturnPercent: number;
  projectedValue1Year: number;
  formattedProjectedValue1Y: string;
  projectedValue3Years: number;
  formattedProjectedValue3Y: string;
  projectedValue5Years: number;
  formattedProjectedValue5Y: string;
  forecastStatus: 'growth' | 'stable' | 'declining';
}

export interface InvestmentSummary {
  totalPortfolioValue: number;
  formattedPortfolioValue: string;
  totalInvested: number;
  formattedTotalInvested: string;
  totalNetProfit: number;
  formattedNetProfit: string;
  overallRoi: number;
  totalAssetsCount: number;
  activeAssetsCount: number;
}

export interface InvestmentStatistics {
  bestPerformerSymbol?: string;
  bestPerformerRoi?: number;
  worstPerformerSymbol?: string;
  worstPerformerRoi?: number;
  topAllocationType?: string;
  portfolioRiskProfile: 'low' | 'moderate' | 'high';
}

export interface InvestmentPolicy {
  policyType: InvestmentPolicyType;
  isLongTerm: boolean;
  targetDividendYield?: number;
  rebalanceFrequency?: 'monthly' | 'quarterly' | 'annually';
}

export interface InvestmentAlert {
  id: string;
  message: string;
  level: InvestmentAlertLevel;
  investmentId?: string;
}

export interface InvestmentWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface InvestmentUiItem {
  investment: Investment;
  holding: InvestmentHolding;
  alerts: InvestmentAlert[];
  policy: InvestmentPolicy;
}

export interface InvestmentUiState {
  summary: InvestmentSummary;
  statistics: InvestmentStatistics;
  performance: InvestmentPerformance;
  allocation: InvestmentAllocation[];
  forecast: InvestmentForecast;
  items: InvestmentUiItem[];
  recentTransactions: InvestmentTransaction[];
  alerts: InvestmentAlert[];
  insights: string[];
  widgets: InvestmentWidgetState[];
  chartData: { label: string; value: number; color?: string }[];
  isLoading: boolean;
  error?: string | null;
}

export type DebtType =
  | 'borrowed_money'
  | 'money_lent'
  | 'installment'
  | 'mortgage'
  | 'credit_card'
  | 'personal_loan'
  | 'business_loan'
  | 'family_loan'
  | 'interest_free'
  | 'custom'
  | 'debt'
  | 'loan';

export type DebtStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'soft_deleted';

export type InterestPolicyType = 'no_interest' | 'fixed_interest' | 'reducing_balance' | 'custom';

export type RepaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type DebtAlertLevel =
  | 'upcoming_payment'
  | 'payment_due_today'
  | 'overdue'
  | 'completed'
  | 'early_settlement'
  | 'high_interest'
  | 'large_debt_exposure'
  | 'info'
  | 'warning'
  | 'danger';

export interface InterestPolicy {
  policyType: InterestPolicyType;
  annualRate: number;
  customCalculationRule?: string;
}

export interface Repayment {
  id: string;
  debtId: string;
  amount: number;
  formattedAmount: string;
  principalAmount: number;
  interestAmount: number;
  date: string;
  note?: string;
  paymentMethod?: string;
}

export interface DebtSchedule {
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  formattedAmountDue: string;
  principalPortion: number;
  interestPortion: number;
  remainingBalanceAfter: number;
  isPaid: boolean;
}

export interface DebtSummary {
  totalDebt: number;
  formattedTotalDebt: string;
  totalLoan: number;
  formattedTotalLoan: string;
  netDebtBalance: number;
  formattedNetDebtBalance: string;
  totalOutstandingBalance: number;
  formattedOutstandingBalance: string;
  totalPaidAmount: number;
  formattedTotalPaidAmount: string;
  totalRemainingAmount: number;
  formattedTotalRemainingAmount: string;
  totalInterestPaid: number;
  formattedTotalInterestPaid: string;
  totalInterestRemaining: number;
  formattedTotalInterestRemaining: string;
  activeDebtsCount: number;
  activeLoansCount: number;
}

export interface DebtStatistics {
  highestInterestRate: number;
  highestInterestDebtTitle?: string;
  largestDebtTitle?: string;
  largestDebtAmount?: number;
  averageInterestRate: number;
  debtToAssetRatio?: number;
}

export interface DebtForecast {
  forecastCompletionDate: string;
  projectedMonthsToClear: number;
  totalProjectedInterest: number;
  formattedTotalProjectedInterest: string;
  forecastStatus: 'on_track' | 'delayed' | 'accelerated';
}

export interface DebtAlert {
  id: string;
  message: string;
  level: DebtAlertLevel;
  debtId?: string;
  dueDate?: string;
}

export interface DebtReminder {
  id: string;
  debtId: string;
  title: string;
  dueDate: string;
  amountDue: number;
  formattedAmountDue: string;
  isOverdue: boolean;
  daysRemaining: number;
}

export interface DebtHistory {
  id: string;
  debtId: string;
  action: 'created' | 'repayment' | 'updated' | 'archived' | 'status_change';
  date: string;
  description: string;
  amount?: number;
}

export interface DebtWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface DebtUiItem {
  debtItem: DebtItem;
  status: DebtStatus;
  outstandingBalance: number;
  formattedOutstanding: string;
  paidAmount: number;
  formattedPaidAmount: string;
  remainingAmount: number;
  formattedRemaining: string;
  interestPaid: number;
  interestRemaining: number;
  progressPercent: number;
  nextPaymentDate: string;
  schedule: DebtSchedule[];
  alerts: DebtAlert[];
}

export interface DebtUiState {
  summary: DebtSummary;
  statistics: DebtStatistics;
  forecast: DebtForecast;
  items: DebtUiItem[];
  upcomingPayments: DebtReminder[];
  overduePayments: DebtReminder[];
  repayments: Repayment[];
  alerts: DebtAlert[];
  reminders: DebtReminder[];
  history: DebtHistory[];
  insights: string[];
  widgets: DebtWidgetState[];
  chartData: ChartDataPoint[];
  isLoading: boolean;
  error?: string | null;
}

export interface Loan {
  id: string;
  spaceId: string;
  title: string;
  borrowerName: string;
  amount: number;
  remainingAmount: number;
  interestRate: number;
  dueDate: string;
  isLentOut: boolean;
}

export interface Debt {
  id: string;
  spaceId: string;
  title: string;
  lenderName: string;
  amount: number;
  remainingAmount: number;
  interestRate: number;
  dueDate: string;
}

export interface CreditCard {
  id: string;
  cardName: string;
  bankName: string;
  creditLimit: number;
  currentBalance: number;
  statementDate: number; // day of month
  dueDate: number; // day of month
  cashbackPercent: number;
  cardColor: string;
  spaceId?: string;
}

export interface DebtItem {
  id: string;
  title: string;
  type: 'debt' | 'loan'; // debt = money you owe, loan = money owed to you
  originalAmount: number;
  remainingAmount: number;
  interestRate: number; // % annual
  minimumMonthlyPayment: number;
  counterparty: string;
  dueDate: string;
  spaceId?: string;
  // SPR2-T004 Extended Fields
  debtType?: DebtType;
  status?: DebtStatus;
  interestPolicy?: InterestPolicyType;
  frequency?: RepaymentFrequency;
  isSoftDeleted?: boolean;
  startDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAmount?: number;
}

export interface Installment {
  id: string;
  itemTitle: string;
  totalAmount: number;
  monthlyAmount: number;
  paidMonths: number;
  totalMonths: number;
  nextDueDate: string;
  creditCardId?: string;
  spaceId?: string;
}

export interface Reminder {
  id: string;
  spaceId: string;
  title: string;
  amount?: number;
  currency?: string;
  dueDate: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'weekly' | 'once';
  status: 'pending' | 'completed' | 'snoozed';
}

export interface Tag {
  id: string;
  spaceId: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  transactionId: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Report {
  id: string;
  spaceId: string;
  period: string;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  topExpenseCategories: { category: string; amount: number; percent: number }[];
}

export interface Dashboard {
  spaceId: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netWorth: number;
  budgetProgress: number;
  recentTransactions: Transaction[];
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  action: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

export interface WidgetUiState {
  widgetId: 'ai_coach' | 'savings' | 'investments' | 'debts' | 'fire' | 'six_jars';
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface DashboardUiState {
  spaceId: string;
  totalBalance: number;
  formattedTotalBalance: string;
  monthlyIncome: number;
  monthlyExpense: number;
  cashFlow: number;
  netWorth: number;
  budgetProgress: number;
  savingsProgress: number;
  recentTransactions: Transaction[];
  spaces: FinancialSpace[];
  activeSpace?: FinancialSpace;
  quickActions: QuickActionItem[];
  chartData: ChartDataPoint[];
  alerts: string[];
  insights: string[];
  widgets: WidgetUiState[];
  isLoading: boolean;
  error?: string | null;
}

export type ReportPeriod = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface ReportFilterState {
  period: ReportPeriod;
  spaceId?: string;
  category?: string;
  transactionType?: TransactionType;
  currency?: string;
  startDate?: string;
  endDate?: string;
}

export interface CategoryDistributionItem {
  name: string;
  amount: number;
  formattedAmount: string;
  percent: number;
  color: string;
}

export interface ReportWidgetState {
  widgetId: 'savings' | 'investments' | 'loans' | 'six_jars' | 'fire' | 'ai_coach' | 'forecasting';
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface ReportUiState {
  reportPeriod: ReportPeriod;
  totalIncome: number;
  formattedTotalIncome: string;
  totalExpense: number;
  formattedTotalExpense: string;
  cashFlow: number;
  formattedCashFlow: string;
  openingBalance: number;
  closingBalance: number;
  budgetProgress: number;
  savingsProgress: number;
  investmentSummary: {
    totalValue: number;
    formattedTotalValue: string;
    gainLoss: number;
    formattedGainLoss: string;
  };
  debtSummary: {
    totalDebt: number;
    formattedTotalDebt: string;
    remaining: number;
    formattedRemaining: string;
  };
  topExpenseCategories: CategoryDistributionItem[];
  topIncomeCategories: CategoryDistributionItem[];
  monthlyTrend: ChartDataPoint[];
  dailyTrend: ChartDataPoint[];
  categoryDistribution: CategoryDistributionItem[];
  spaceDistribution: { spaceName: string; amount: number; formattedAmount: string; percent: number }[];
  paymentMethodDistribution: { method: string; amount: number; formattedAmount: string; percent: number }[];
  recentHighlights: string[];
  alerts: string[];
  insights: string[];
  chartData: ChartDataPoint[];
  widgets: ReportWidgetState[];
  filters: ReportFilterState;
  isLoading: boolean;
  error?: string | null;
}

export interface UserPreference {
  userId: string;
  language: Language;
  theme: ThemeStyle;
  baseCurrency: string;
  defaultSpaceId: string;
  biometricEnabled: boolean;
  notificationEnabled: boolean;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  sizeBytes: number;
  version: string;
  location: 'local' | 'google_drive';
  filename: string;
}

export type JarKey = 'NEC' | 'FFA' | 'LTSS' | 'LTS' | 'EDU' | 'PLAY' | 'GIVE' | 'CUSTOM' | string;

export type JarStatus = 'active' | 'paused' | 'archived' | 'soft_deleted';

export type JarAllocationRuleType =
  | 'manual'
  | 'automatic'
  | 'percentage'
  | 'fixed_amount'
  | 'income_trigger'
  | 'recurring';

export type JarAlertLevel =
  | 'target_reached'
  | 'low_balance'
  | 'no_contribution'
  | 'allocation_changed'
  | 'transfer_completed'
  | 'forecast_warning'
  | 'invalid_total_percentage'
  | 'info'
  | 'warning'
  | 'danger';

export interface Jar {
  id: string;
  key: JarKey;
  nameVi: string;
  nameEn: string;
  percent: number;
  currentBalance: number;
  color: string;
  descriptionVi?: string;
  descriptionEn?: string;
  spaceId?: string;
  targetAmount?: number;
  status?: JarStatus;
  ruleType?: JarAllocationRuleType;
  fixedAllocationAmount?: number;
  isEnabled?: boolean;
  isCustom?: boolean;
  isSoftDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SixJar = Jar;

export interface JarAllocation {
  id: string;
  jarId: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  incomeAmount: number;
  allocatedAt: string;
  note?: string;
}

export interface JarContribution {
  id: string;
  jarId: string;
  amount: number;
  formattedAmount: string;
  date: string;
  type: 'income_allocation' | 'manual_contribution' | 'transfer_in';
  note?: string;
}

export interface JarTransfer {
  id: string;
  fromJarId: string;
  toJarId: string;
  amount: number;
  formattedAmount: string;
  date: string;
  note?: string;
}

export interface JarRule {
  id: string;
  jarId: string;
  ruleType: JarAllocationRuleType;
  percentage: number;
  fixedAmount?: number;
  triggerMinIncome?: number;
  isEnabled: boolean;
}

export interface JarTarget {
  id: string;
  jarId: string;
  targetAmount: number;
  formattedTargetAmount: string;
  currentBalance: number;
  progressPercent: number;
  isReached: boolean;
  targetDate?: string;
}

export interface JarSummary {
  totalBalance: number;
  formattedTotalBalance: string;
  totalAllocatedPercent: number;
  activeJarsCount: number;
  totalContributionsThisMonth: number;
  formattedTotalContributionsThisMonth: string;
  totalTransfersThisMonth: number;
  formattedTotalTransfersThisMonth: string;
}

export interface JarStatistics {
  largestJarName?: string;
  largestJarBalance?: number;
  topAllocatedJarName?: string;
  topAllocatedPercent?: number;
  averageJarBalance: number;
  complianceScore: number;
}

export interface JarForecast {
  projectedBalances3Months: Record<string, number>;
  projectedBalances6Months: Record<string, number>;
  projectedBalances12Months: Record<string, number>;
  formattedProjectedBalances: Record<string, string>;
  monthsToReachTargets: Record<string, number>;
  status: 'on_track' | 'lagging' | 'exceeding';
}

export interface JarAlert {
  id: string;
  message: string;
  level: JarAlertLevel;
  jarId?: string;
}

export interface JarHistory {
  id: string;
  jarId: string;
  action: 'created' | 'allocated' | 'transferred' | 'contributed' | 'rule_updated' | 'status_changed';
  date: string;
  description: string;
  amount?: number;
}

export interface JarUiItem {
  jar: Jar;
  formattedBalance: string;
  formattedTarget: string;
  progressPercent: number;
  remainingToTarget: number;
  formattedRemainingToTarget: string;
  monthlyContribution: number;
  formattedMonthlyContribution: string;
  forecastBalance3Months: number;
  formattedForecastBalance3Months: string;
  alerts: JarAlert[];
}

export interface JarWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface SixJarsUiState {
  summary: JarSummary;
  statistics: JarStatistics;
  forecast: JarForecast;
  jars: JarUiItem[];
  contributions: JarContribution[];
  transfers: JarTransfer[];
  allocations: JarAllocation[];
  rules: JarRule[];
  targets: JarTarget[];
  alerts: JarAlert[];
  history: JarHistory[];
  insights: string[];
  widgets: JarWidgetState[];
  chartData: ChartDataPoint[];
  totalPercentage: number;
  isTotal100Percent: boolean;
  isLoading: boolean;
  error?: string | null;
}


export type FireType = 'lean_fire' | 'regular_fire' | 'fat_fire' | 'coast_fire' | 'barista_fire' | 'custom_fire';

export type FireScenarioType = 'current' | 'optimistic' | 'conservative' | 'aggressive' | 'custom';

export interface FireProfile {
  id: string;
  spaceId?: string;
  currentAge: number;
  targetRetirementAge: number;
  currentNetWorth: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  monthlySavings: number;
  monthlyInvestment: number;
  expectedAnnualReturn: number;
  safeWithdrawalRate: number;
  inflationRate: number;
  fireType: FireType;
  customTargetNetWorth?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FireGoal {
  id: string;
  profileId: string;
  fireType: FireType;
  targetNetWorth: number;
  formattedTargetNetWorth: string;
  requiredPassiveIncomeMonthly: number;
  formattedRequiredPassiveIncomeMonthly: string;
  safeWithdrawalRate: number;
  monthlyExpenses: number;
  formattedMonthlyExpenses: string;
  isReached: boolean;
  progressPercent: number;
}

export interface FireScenario {
  id: string;
  scenarioType: FireScenarioType;
  name: string;
  annualReturnRate: number;
  monthlySavings: number;
  monthlyExpenses: number;
  projectedFireAge: number;
  projectedYearsRemaining: number;
  projectedNetWorthAtRetirement: number;
  formattedProjectedNetWorth: string;
  projectedFireDate: string;
  probabilityOfSuccessPercent: number;
}

export interface FireProjectionPoint {
  year: number;
  age: number;
  projectedNetWorth: number;
  formattedNetWorth: string;
  savingsContributionTotal: number;
  investmentGrowthTotal: number;
  passiveIncomeMonthly: number;
  isFireAchieved: boolean;
}

export interface FireMilestone {
  id: string;
  title: string;
  targetNetWorth: number;
  formattedTargetNetWorth: string;
  expectedAge: number;
  expectedYear: number;
  isAchieved: boolean;
  achievedDate?: string;
}

export interface FireProjection {
  profileId: string;
  points: FireProjectionPoint[];
  milestones: FireMilestone[];
}

export interface FireForecast {
  expectedFireDate: string;
  yearsRemaining: number;
  requiredMonthlySavings: number;
  formattedRequiredMonthlySavings: string;
  requiredPassiveIncome: number;
  formattedRequiredPassiveIncome: string;
  requiredInvestmentGrowthRate: number;
  targetAchievementPercent: number;
  status: 'on_track' | 'ahead' | 'behind' | 'at_risk';
}

export interface FireStrategy {
  id: string;
  title: string;
  description: string;
  impactYears: number;
  category: 'savings' | 'expense' | 'investment' | 'debt' | 'income';
}

export interface FireRecommendation {
  id: string;
  code: 'increase_savings' | 'reduce_expenses' | 'increase_investments' | 'pay_off_debt' | 'adjust_goal' | 'risk_warning';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionableStep: string;
  potentialYearsSaved: number;
}

export interface FireRisk {
  id: string;
  code: 'low_savings_rate' | 'high_debt' | 'high_expenses' | 'insufficient_investment' | 'delayed_retirement' | 'market_downturn';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  mitigation: string;
}

export interface FireSummary {
  currentNetWorth: number;
  formattedCurrentNetWorth: string;
  targetNetWorth: number;
  formattedTargetNetWorth: string;
  fireNumber: number;
  formattedFireNumber: string;
  savingsRatePercent: number;
  investmentRatePercent: number;
  monthlyPassiveIncomeCurrent: number;
  formattedMonthlyPassiveIncomeCurrent: string;
  monthlyExpenses: number;
  formattedMonthlyExpenses: string;
  yearsRemaining: number;
  expectedFireDate: string;
  fireType: FireType;
}

export interface FireStatistics {
  progressToFirePercent: number;
  monthlyNetSavings: number;
  savingsToIncomeRatio: number;
  debtToNetWorthRatio: number;
  investmentToNetWorthRatio: number;
  financialIndependenceScore: number;
}

export interface FireHistory {
  id: string;
  date: string;
  netWorth: number;
  monthlySavings: number;
  fireNumberTarget: number;
  note?: string;
}

export interface FireAlert {
  id: string;
  message: string;
  level: 'info' | 'warning' | 'danger' | 'success';
  code?: string;
}

export interface FireWidgetState {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface FireUiState {
  profile: FireProfile;
  goal: FireGoal;
  summary: FireSummary;
  statistics: FireStatistics;
  forecast: FireForecast;
  scenarios: FireScenario[];
  projection: FireProjection;
  milestones: FireMilestone[];
  strategies: FireStrategy[];
  recommendations: FireRecommendation[];
  risks: FireRisk[];
  alerts: FireAlert[];
  history: FireHistory[];
  widgets: FireWidgetState[];
  chartData: ChartDataPoint[];
  isLoading: boolean;
  error?: string | null;
}

export interface FireConfig {
  currentAge: number;
  targetRetirementAge: number;
  currentNetWorth: number;
  monthlyExpense: number;
  expectedAnnualReturn: number; // e.g., 7%
  safeWithdrawalRate: number; // e.g. 4%
  inflationRate: number; // e.g., 3%
}

export interface FeatureConfig {
  incomeExpense: boolean;
  transfers: boolean;
  savingsGoals: boolean;
  investments: boolean;
  loansDebts: boolean;
  creditCards: boolean;
  installments: boolean;
  budgetsForecasting: boolean;
  sixJars: boolean;
  envelopeBudgeting: boolean;
  kakeiboJournal: boolean;
  snowballAvalanche: boolean;
  fireTracking: boolean;
  multiSpaces: boolean;
  aiInsights: boolean;
  voiceInput: boolean;
  ocrReceipt: boolean;
  googleDriveBackup: boolean;
  // D2-003 Financial Methods Extended Feature Flags
  advancedFire?: boolean;
  fiftyThirtyTwenty?: boolean;
  ruleOf72?: boolean;
  zeroBasedBudget?: boolean;
  dca?: boolean;
  advancedJar?: boolean;
  advancedDebtStrategy?: boolean;
  sinkingFunds?: boolean;
  payYourselfFirst?: boolean;
  fiftyTwoWeekChallenge?: boolean;
  // D2-003S5 UI Feature Flags
  advancedJarUI?: boolean;
  advancedFireUI?: boolean;
  fiftyThirtyTwentyUI?: boolean;
  ruleOf72UI?: boolean;
  advancedDebtUI?: boolean;
  zeroBasedBudgetUI?: boolean;
  sinkingFundUI?: boolean;
  payYourselfFirstUI?: boolean;
  fiftyTwoWeekUI?: boolean;
  dcaUI?: boolean;
}

export type FeatureModulesState = FeatureConfig;

// ==========================================
// AI COACH FOUNDATION DOMAIN MODELS (SPR2-T007)
// ==========================================

export type CoachHealthCategory =
  | 'cash_flow'
  | 'emergency_fund'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'budget'
  | 'financial_discipline'
  | 'fire_progress';

export type CoachRecommendationType =
  | 'increase_savings'
  | 'reduce_spending'
  | 'pay_debt'
  | 'increase_investment'
  | 'emergency_fund'
  | 'optimize_six_jars'
  | 'improve_budget'
  | 'accelerate_fire'
  | 'custom_recommendation';

export type CoachPriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'future';

export type CoachRiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export type CoachActionTimeframe = 'today' | 'this_week' | 'this_month' | 'next_month' | 'long_term';

export type CoachAchievementCategory =
  | 'savings_goal'
  | 'debt_free'
  | 'investment_milestone'
  | 'budget_success'
  | 'fire_milestone'
  | 'custom_achievement';

export interface CoachProfile {
  id: string;
  spaceId?: string;
  primaryFocus?: CoachHealthCategory;
  riskTolerance?: 'low' | 'moderate' | 'high';
  monthlyIncomeTarget?: number;
  monthlySavingsTarget?: number;
  updatedAt?: string;
}

export interface CoachInsight {
  id: string;
  category: CoachHealthCategory;
  title: string;
  description: string;
  impactScore: number; // 0 - 100
  code: string;
  actionLinkDomain?: string;
  createdAt?: string;
}

export interface CoachRecommendation {
  id: string;
  type: CoachRecommendationType;
  category: CoachHealthCategory;
  title: string;
  description: string;
  rationale: string;
  actionableStep: string;
  priority: CoachPriorityLevel;
  potentialImpactAmount?: number;
  formattedPotentialImpact?: string;
}

export interface CoachAction {
  id: string;
  timeframe: CoachActionTimeframe;
  title: string;
  description: string;
  category: CoachHealthCategory;
  isCompleted: boolean;
  dueDate?: string;
  priority: CoachPriorityLevel;
  relatedDomain?: string;
}

export interface CoachPriority {
  id: string;
  level: CoachPriorityLevel;
  domain: CoachHealthCategory;
  title: string;
  description: string;
  impact: string;
  actionRequired: string;
}

export interface CoachRisk {
  id: string;
  severity: CoachRiskSeverity;
  domain: CoachHealthCategory;
  title: string;
  description: string;
  mitigationStrategy: string;
  riskScore: number; // 0 - 100
}

export interface CoachOpportunity {
  id: string;
  domain: CoachHealthCategory;
  title: string;
  description: string;
  potentialGain: number;
  formattedPotentialGain: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CoachCategoryHealthDetail {
  category: CoachHealthCategory;
  score: number; // 0 - 100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  summary: string;
}

export interface CoachHealth {
  overallScore: number; // 0 - 100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  grade: string; // e.g. 'A+', 'B', 'C', 'D'
  categories: Record<CoachHealthCategory, CoachCategoryHealthDetail>;
}

export interface CoachHistory {
  id: string;
  date: string;
  healthScore: number;
  insightsCount: number;
  actionsCompletedCount: number;
  note?: string;
}

export interface CoachNotification {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'success' | 'critical';
  isRead: boolean;
  createdAt: string;
  linkDomain?: string;
}

export interface CoachWidget {
  widgetId: string;
  title: string;
  isEnabled: boolean;
  precomputedData: Record<string, any>;
}

export interface CoachSummary {
  healthScore: number;
  formattedHealthScore: string;
  topPriorityCount: number;
  activeRisksCount: number;
  activeOpportunitiesCount: number;
  pendingActionsCount: number;
  completedActionsCount: number;
  primaryAdvice: string;
  healthGrade: string;
}

export interface CoachStatistics {
  totalActionsCount: number;
  completionRatePercent: number;
  healthScoreTrend: 'upward' | 'stable' | 'downward';
  riskIndex: number; // 0 - 100
  opportunityIndex: number; // 0 - 100
  financialDisciplineScore: number; // 0 - 100
}

export interface CoachAchievement {
  id: string;
  title: string;
  description: string;
  category: CoachAchievementCategory;
  iconName: string;
  unlockedAt?: string;
  progressPercent: number;
  isUnlocked: boolean;
}

export interface CoachActionPlan {
  today: CoachAction[];
  thisWeek: CoachAction[];
  thisMonth: CoachAction[];
  nextMonth: CoachAction[];
  longTerm: CoachAction[];
}

export interface CoachUiState {
  health: CoachHealth;
  summary: CoachSummary;
  statistics: CoachStatistics;
  priorities: CoachPriority[];
  risks: CoachRisk[];
  opportunities: CoachOpportunity[];
  insights: CoachInsight[];
  recommendations: CoachRecommendation[];
  actionPlan: CoachActionPlan;
  achievements: CoachAchievement[];
  notifications: CoachNotification[];
  history: CoachHistory[];
  widgets: CoachWidget[];
  chartData: ChartDataPoint[];
  isLoading: boolean;
  error?: string | null;
}


