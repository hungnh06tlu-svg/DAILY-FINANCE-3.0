/**
 * Daily Finance 3.0 — D2-003: Financial Methods Engine Types
 * Safe domain extensions for 10 financial management methodologies.
 * Pure TypeScript interfaces — Zero mutation of core D1/D2 types.
 */

import { Jar, JarTarget, DebtItem, Transaction } from '../../types';

// ============================================================================
// 1. ADVANCED JAR ENGINE TYPES
// ============================================================================

export interface MultiSpaceIncome {
  spaceId: string;
  amount: number;
}

export interface JarAllocationRule {
  jarKey: string;
  percent: number;
}

export interface SpaceJarAllocation {
  spaceId: string;
  jarKey: string;
  jarName: string;
  allocatedAmount: number;
  percent: number;
}

export interface MultiSpaceAllocationResult {
  totalIncome: number;
  spaceBreakdown: Record<string, number>;
  allocations: SpaceJarAllocation[];
  allocatedByJarKey: Record<string, number>;
}

export interface JarTargetProgressResult {
  jarId: string;
  targetAmount: number;
  currentBalance: number;
  remainingAmount: number;
  progressPercent: number;
  isReached: boolean;
  status: 'achieved' | 'on_track' | 'lagging' | 'critical';
}

export interface JarAutoTransferRule {
  fromJarId: string;
  toJarId: string;
  thresholdBalance: number;
  transferAmount: number;
  description?: string;
}

export interface JarAutoTransferAction {
  fromJarId: string;
  toJarId: string;
  amount: number;
  reason: string;
  executedAt: string;
}

export interface JarRebalanceAction {
  jarId: string;
  currentBalance: number;
  targetBalance: number;
  delta: number; // positive = add, negative = remove
  action: 'deposit' | 'withdraw' | 'hold';
}

// ============================================================================
// 2. ADVANCED FIRE ENGINE TYPES
// ============================================================================

export interface FireVariantResult {
  variant: 'lean_fire' | 'regular_fire' | 'fat_fire' | 'coast_fire' | 'barista_fire';
  nameVi: string;
  nameEn: string;
  targetNetWorth: number;
  monthlyExpensesAssumed: number;
  monthlyPassiveIncomeTarget: number;
  safeWithdrawalRate: number;
  multiplier: number;
  progressPercent: number;
  isAchieved: boolean;
}

export interface CoastFireResult extends FireVariantResult {
  currentAge: number;
  retirementAge: number;
  yearsToCompound: number;
  assumedAnnualReturn: number;
  requiredInvestedToday: number;
  currentInvestments: number;
  hasCoasted: boolean;
  surplusDeficit: number;
}

export interface BaristaFireResult extends FireVariantResult {
  partTimeMonthlyIncome: number;
  gapCoveredByPortfolioMonthly: number;
  fullTimeMonthlyExpense: number;
}

export interface AdvancedFireProfileInput {
  currentAge: number;
  targetRetirementAge: number;
  currentNetWorth: number;
  monthlyExpenses: number;
  expectedAnnualReturn?: number;
  safeWithdrawalRate?: number;
  inflationRate?: number;
  partTimeBaristaIncome?: number;
  leanMultiplier?: number;
  fatMultiplier?: number;
}

export interface AdvancedFireComprehensiveReport {
  leanFire: FireVariantResult;
  regularFire: FireVariantResult;
  fatFire: FireVariantResult;
  coastFire: CoastFireResult;
  baristaFire: BaristaFireResult;
  summary: {
    currentNetWorth: number;
    baselineMonthlyExpenses: number;
    safeWithdrawalRate: number;
    expectedAnnualReturn: number;
    fastestFireType: string;
    yearsToFastestFire: number;
  };
}

// ============================================================================
// 3. 50/30/20 BUDGET ENGINE TYPES
// ============================================================================

export interface FiftyThirtyTwentyRatio {
  needsPercent: number;    // default 50
  wantsPercent: number;    // default 30
  savingsPercent: number;  // default 20
}

export interface FiftyThirtyTwentyResult {
  monthlyIncome: number;
  needsBudget: number;
  wantsBudget: number;
  savingsBudget: number;
  ratio: FiftyThirtyTwentyRatio;
}

export interface FiftyThirtyTwentyEvaluation {
  income: number;
  budget: FiftyThirtyTwentyResult;
  actual: {
    needs: number;
    wants: number;
    savings: number;
    total: number;
  };
  percentages: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  };
  variance: {
    needsVariance: number; // positive = within budget, negative = overspent
    wantsVariance: number;
    savingsVariance: number;
  };
  complianceScore: number; // 0 to 100
  isCompliant: boolean;
  recommendations: string[];
}

// ============================================================================
// 4. RULE OF 72 ENGINE TYPES
// ============================================================================

export interface RuleOf72Result {
  annualInterestRate: number;
  yearsToDoubleApproximation: number; // 72 / r
  yearsToDoubleExact: number;         // ln(2) / ln(1 + r/100)
  approximationErrorYears: number;
  yearsToTripleApproximation: number; // 114 / r
  yearsToQuadrupleApproximation: number; // 144 / r
}

export interface InflationHalvingResult {
  inflationRate: number;
  yearsToHalvePurchasingPower: number; // 72 / inflationRate
  halvingFactor20Years: number;        // Purchasing power left after 20 years
}

export interface DoublingMilestone {
  step: number;
  milestoneName: string;
  projectedYear: number;
  value: number;
  doublingCount: number;
}

// ============================================================================
// 5. ADVANCED DEBT STRATEGY ENGINE TYPES (SNOWBALL VS AVALANCHE)
// ============================================================================

export interface DebtMonthlyPaymentSchedule {
  month: number;
  remainingBalances: Record<string, number>;
  totalRemainingBalance: number;
  interestPaidThisMonth: number;
  principalPaidThisMonth: number;
  totalPaidThisMonth: number;
  clearedDebtIds: string[];
}

export interface DebtStrategySimulationResult {
  strategy: 'snowball' | 'avalanche';
  nameVi: string;
  totalMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalAmountPaid: number;
  debtPayoffOrder: string[];
  schedule: DebtMonthlyPaymentSchedule[];
}

export interface DebtStrategyComparisonResult {
  snowball: DebtStrategySimulationResult;
  avalanche: DebtStrategySimulationResult;
  interestSavingsWithAvalanche: number;
  monthsSavedWithAvalanche: number;
  recommendedStrategy: 'snowball' | 'avalanche';
  recommendationReason: string;
}

// ============================================================================
// 6. ZERO-BASED BUDGET ENGINE TYPES
// ============================================================================

export interface ZeroBasedEnvelope {
  id: string;
  name: string;
  category: string;
  allocatedAmount: number;
  type: 'necessity' | 'discretionary' | 'savings' | 'debt';
}

export interface ZeroBasedPlanResult {
  totalIncome: number;
  totalAllocated: number;
  leftoverToAssign: number;
  isBalancedToZero: boolean;
  envelopes: ZeroBasedEnvelope[];
  categoryTotals: Record<string, number>;
}

export interface ZeroBasedReconciliationResult {
  plan: ZeroBasedPlanResult;
  envelopesReconciled: {
    envelopeId: string;
    name: string;
    allocated: number;
    actualSpent: number;
    remaining: number;
    status: 'under_budget' | 'exact' | 'over_budget';
  }[];
  totalSpent: number;
  totalRemaining: number;
  overallHealth: 'excellent' | 'fair' | 'overspent';
}

// ============================================================================
// 7. SINKING FUND ENGINE TYPES
// ============================================================================

export interface SinkingFund {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date string (YYYY-MM-DD)
  startDate: string;
  spaceId?: string;
  category?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface SinkingFundContributionResult {
  fundId: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  monthsRemaining: number;
  recommendedMonthlyContribution: number;
  targetDate: string;
  isAchieved: boolean;
}

export interface SinkingFundMonthSchedule {
  monthIndex: number;
  date: string;
  monthlyDeposit: number;
  accumulatedBalance: number;
  targetProgressPercent: number;
}

// ============================================================================
// 8. PAY YOURSELF FIRST ENGINE TYPES
// ============================================================================

export interface PayYourselfFirstBucketConfig {
  key: string;
  nameVi: string;
  nameEn: string;
  percentageOfSavings: number; // e.g. 50% of savings to emergency fund
}

export interface PayYourselfFirstBucketAllocation {
  key: string;
  nameVi: string;
  nameEn: string;
  amount: number;
  percentageOfSavings: number;
  percentageOfTotalIncome: number;
}

export interface PayYourselfFirstResult {
  totalIncome: number;
  savingsRatePercent: number;
  totalSavingsAllocated: number;
  remainderForLivingExpenses: number;
  bucketAllocations: PayYourselfFirstBucketAllocation[];
}

export interface PayYourselfFirstFeasibility {
  isFeasible: boolean;
  totalIncome: number;
  savingsAllocated: number;
  remainderForLiving: number;
  fixedExpenses: number;
  surplusDeficit: number;
  advice: string;
}

// ============================================================================
// 9. 52-WEEK MONEY CHALLENGE ENGINE TYPES
// ============================================================================

export type FiftyTwoWeekMode = 'standard' | 'reverse' | 'flexible' | 'flat';

export interface FiftyTwoWeekItem {
  weekNumber: number;
  scheduledAmount: number;
  targetCumulativeAmount: number;
  isCompleted: boolean;
  completedAt?: string;
  actualAmountDeposited?: number;
}

export interface FiftyTwoWeekSchedule {
  id: string;
  title: string;
  mode: FiftyTwoWeekMode;
  baseIncrement: number;
  totalGoal: number;
  startDate: string;
  items: FiftyTwoWeekItem[];
}

export interface FiftyTwoWeekProgress {
  totalGoal: number;
  totalSaved: number;
  remainingGoal: number;
  completedWeeksCount: number;
  totalWeeksCount: number;
  progressPercent: number;
  currentStreak: number;
  status: 'on_track' | 'ahead' | 'behind' | 'completed';
}

// ============================================================================
// 10. DOLLAR-COST AVERAGING (DCA) ENGINE TYPES
// ============================================================================

export interface DCAPeriodEntry {
  period: number;
  date?: string;
  assetPrice: number;
  amountInvested: number;
  unitsPurchased: number;
  cumulativeUnits: number;
  cumulativeInvested: number;
  portfolioValue: number;
}

export interface DCASimulationResult {
  totalCapitalInvested: number;
  totalUnitsAccumulated: number;
  averageCostBasis: number;
  currentAssetPrice: number;
  finalPortfolioValue: number;
  totalReturnAmount: number;
  totalReturnPercent: number;
  periods: DCAPeriodEntry[];
}

export interface DCAvsLumpSumComparison {
  dca: DCASimulationResult;
  lumpSum: {
    initialPrice: number;
    totalCapitalInvested: number;
    unitsPurchased: number;
    finalPortfolioValue: number;
    totalReturnAmount: number;
    totalReturnPercent: number;
  };
  winner: 'dca' | 'lump_sum' | 'tie';
  outperformanceAmount: number;
  outperformancePercent: number;
  dcaAverageCost: number;
  lumpSumCost: number;
  volatilityBufferPercent: number;
}
