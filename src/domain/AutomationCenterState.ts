/**
 * Daily Finance 3.0 - AutomationCenterState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-005 Automation Center Architecture.
 */

export type AutomationCategory =
  | 'auto_categorization'
  | 'auto_budget'
  | 'auto_savings'
  | 'recurring_transactions'
  | 'rebalancing'
  | 'debt_repayment'
  | 'smart_notifications'
  | 'goal_automation'
  | 'ai_rule'
  | 'integration';

export type AutomationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AutomationStatus = 'active' | 'paused' | 'suggested' | 'disabled';

export interface AutomationQuickAction {
  readonly id: string;
  readonly label: string;
  readonly actionType: string;
  readonly targetRoute?: string;
  readonly payload?: Record<string, any>;
}

export interface AutomationFutureSupportFlags {
  readonly supportsAutoCategorization: boolean;
  readonly supportsAutoBudgetCreation: boolean;
  readonly supportsAutoSavingsTransfer: boolean;
  readonly supportsRecurringTransactions: boolean;
  readonly supportsInvestmentRebalancing: boolean;
  readonly supportsDebtRepaymentAutomation: boolean;
  readonly supportsSmartNotifications: boolean;
  readonly supportsGoalAutomation: boolean;
  readonly supportsAISuggestedRules: boolean;
  readonly supportsIFTTT: boolean;
  readonly supportsGoogleCalendar: boolean;
  readonly supportsAndroidWorkManager: boolean;
}

export interface AutomationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AutomationCategory;
  readonly trigger: string;
  readonly condition: string;
  readonly action: string;
  readonly priority: AutomationPriority;
  readonly status: AutomationStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly quickActions: ReadonlyArray<AutomationQuickAction>;
  readonly futureSupportFlags: AutomationFutureSupportFlags;
}

export interface AutomationSuggestion {
  readonly id: string;
  readonly reason: string;
  readonly recommendation: string;
  readonly confidence: number; // 0..100
  readonly source: string;
  readonly priority: AutomationPriority;
  readonly category: AutomationCategory;
  readonly suggestedRule?: AutomationRule;
}

export interface AutomationHistoryItem {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly result: 'success' | 'failed' | 'skipped' | 'simulated';
  readonly timestamp: string;
  readonly reason: string;
}

export interface AutomationStatistics {
  readonly totalRules: number;
  readonly activeRulesCount: number;
  readonly pausedRulesCount: number;
  readonly suggestionsCount: number;
  readonly historyItemsCount: number;
  readonly executionSuccessRatePercent: number;
}

export interface AutomationSummary {
  readonly headline: string;
  readonly description: string;
  readonly topSuggestedRuleName?: string;
  readonly lastExecutedRuleName?: string;
  readonly lastExecutedTimestamp?: string;
}

export interface AutomationCenterState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly automationRules: ReadonlyArray<AutomationRule>;
  readonly suggestedAutomations: ReadonlyArray<AutomationSuggestion>;
  readonly activeAutomations: ReadonlyArray<AutomationRule>;
  readonly pausedAutomations: ReadonlyArray<AutomationRule>;
  readonly automationHistory: ReadonlyArray<AutomationHistoryItem>;
  readonly statistics: AutomationStatistics;
  readonly summary: AutomationSummary;

  // Global Future Extension Support Flags
  readonly futureSupportFlags: AutomationFutureSupportFlags;
}

export interface AutomationCenterUiState {
  readonly isLoading: boolean;
  readonly state: AutomationCenterState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: AutomationCategory | 'all';
}
