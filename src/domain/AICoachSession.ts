/**
 * Daily Finance 3.0 - AICoachSession Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to DF3-007 AI Coach v2 Orchestration Architecture.
 */

export type CoachDecisionCategory =
  | 'celebrate'
  | 'warn'
  | 'recommend'
  | 'encourage'
  | 'remind'
  | 'escalate';

export interface CoachDecision {
  readonly id: string;
  readonly category: CoachDecisionCategory;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly rationale: string;
  readonly targetDomain?: string;
  readonly triggerEvent?: string;
}

export type CoachMessageType =
  | 'summary'
  | 'warning'
  | 'recommendation'
  | 'achievement'
  | 'motivation'
  | 'reminder';

export interface CoachMessage {
  readonly id: string;
  readonly type: CoachMessageType;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly title: string;
  readonly message: string;
  readonly reason: string;
  readonly evidence: string;
  readonly recommendedAction: string;
  readonly relatedGoal?: string;
  readonly relatedInsight?: string;
}

export type ConversationTopic =
  | 'daily_summary'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'achievement'
  | 'warning'
  | 'suggestion'
  | 'motivation';

export interface CoachConversation {
  readonly id: string;
  readonly topic: ConversationTopic;
  readonly headline: string;
  readonly greeting: string;
  readonly mainDialogue: string;
  readonly closingThought: string;
  readonly messages: ReadonlyArray<CoachMessage>;
  readonly suggestedUserReplies: ReadonlyArray<string>;
}

export interface CoachSession {
  readonly id: string;
  readonly timestamp: string;
  readonly spaceId: string;
  readonly overallTone: 'celebratory' | 'cautious' | 'encouraging' | 'urgent' | 'informative';
  readonly primaryDecision: CoachDecision;
  readonly decisions: ReadonlyArray<CoachDecision>;
  readonly primaryConversation: CoachConversation;
  readonly conversations: ReadonlyArray<CoachConversation>;
  readonly messages: ReadonlyArray<CoachMessage>;
  readonly summaryText: string;
}

export interface CoachUiState {
  readonly isLoading: boolean;
  readonly session: CoachSession | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
}
