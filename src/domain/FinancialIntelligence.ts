/**
 * Daily Finance 3.0 - FinancialIntelligence Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-003 Analysis Read-Model Architecture.
 */

export type InsightCategory =
  | 'cash_flow'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'six_jars'
  | 'fire'
  | 'emergency_fund'
  | 'financial_health';

export type InsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type InsightPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface FinancialInsight {
  readonly id: string;
  readonly category: InsightCategory;
  readonly severity: InsightSeverity;
  readonly priority: InsightPriority;
  readonly title: string;
  readonly description: string;
  readonly evidence: string;
  readonly recommendation: string;
  readonly confidence: number;
}

export type OpportunityType =
  | 'increase_savings'
  | 'reduce_debt'
  | 'improve_budget'
  | 'optimize_investment'
  | 'improve_cash_flow'
  | 'increase_emergency_fund';

export interface FinancialOpportunity {
  readonly id: string;
  readonly type: OpportunityType;
  readonly title: string;
  readonly description: string;
  readonly impactAmount?: number;
  readonly actionPlan: ReadonlyArray<string>;
  readonly priority: InsightPriority;
}

export type RiskType =
  | 'low_cash'
  | 'overspending'
  | 'debt_growth'
  | 'negative_cash_flow'
  | 'emergency_fund_risk'
  | 'fire_delay';

export interface FinancialRisk {
  readonly id: string;
  readonly type: RiskType;
  readonly title: string;
  readonly description: string;
  readonly severity: InsightSeverity;
  readonly mitigationPlan: ReadonlyArray<string>;
}

export interface IntelligenceAnalysisSummary {
  readonly financialHealthRating: string;
  readonly cashFlowQuality: 'strong' | 'stable' | 'vulnerable' | 'critical';
  readonly incomeStability: 'stable' | 'variable' | 'unknown';
  readonly expenseStability: 'controlled' | 'volatile' | 'high';
  readonly savingsTrend: 'growing' | 'stagnant' | 'declining';
  readonly investmentTrend: 'expanding' | 'moderate' | 'inactive';
  readonly debtRiskLevel: 'low' | 'moderate' | 'high' | 'severe';
  readonly budgetDiscipline: 'excellent' | 'adequate' | 'needs_improvement';
  readonly emergencyFundStatus: 'sufficient' | 'partial' | 'critical_shortage';
  readonly sixJarsCompliance: boolean;
  readonly fireProgressStatus: 'on_track' | 'lagging' | 'not_started';
}

export interface FinancialIntelligence {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly snapshotTimestamp: string;
  readonly summary: IntelligenceAnalysisSummary;
  readonly insights: ReadonlyArray<FinancialInsight>;
  readonly opportunities: ReadonlyArray<FinancialOpportunity>;
  readonly risks: ReadonlyArray<FinancialRisk>;
}

export interface IntelligenceUiState {
  readonly isLoading: boolean;
  readonly intelligence: FinancialIntelligence | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}
