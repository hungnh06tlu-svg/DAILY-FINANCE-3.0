/**
 * Daily Finance 3.0 - AIChatState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-006 AI Chat Architecture.
 */

import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialPlan } from './FinancialPlan';
import { CoachSession } from './AICoachSession';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import { AutomationCenterState } from './AutomationCenterState';

export type ChatRole = 'user' | 'assistant' | 'system' | 'function';
export type ChatCategory =
  | 'general'
  | 'budget'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'fire'
  | 'coaching'
  | 'automation';

export type ChatPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ChatSessionStatus = 'active' | 'closed' | 'archived';

export interface PendingCommand {
  readonly id: string;
  readonly actionName: string;
  readonly details: string;
  readonly commandType: string;
  readonly payload?: any;
}

export interface ChatMessage {
  readonly id: string;
  readonly sessionId: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly timestamp: string;
  readonly category: ChatCategory;
  readonly priority: ChatPriority;
  readonly evidence: ReadonlyArray<string>;
  readonly references: ReadonlyArray<string>;
  readonly suggestions: ReadonlyArray<string>;
  readonly requiresConfirmation?: boolean;
  readonly pendingCommand?: PendingCommand;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: ChatSessionStatus;
  readonly pinned: boolean;
  readonly archived: boolean;
  readonly tags: ReadonlyArray<string>;
}

export interface ConversationContext {
  readonly snapshot?: FinancialSnapshot;
  readonly plan?: FinancialPlan;
  readonly coachSession?: CoachSession;
  readonly dashboardState?: DashboardState;
  readonly goalPlannerState?: GoalPlannerState;
  readonly notificationCenterState?: NotificationCenterState;
  readonly habitEngineState?: HabitEngineState;
  readonly automationCenterState?: AutomationCenterState;
}

export interface ChatFutureSupportFlags {
  readonly supportsOpenAI: boolean;
  readonly supportsGemini: boolean;
  readonly supportsClaude: boolean;
  readonly supportsDeepSeek: boolean;
  readonly supportsOfflineAI: boolean;
  readonly supportsRAG: boolean;
  readonly supportsPromptTemplates: boolean;
  readonly supportsVoiceConversation: boolean;
  readonly supportsStreamingResponses: boolean;
  readonly supportsMemory: boolean;
  readonly supportsConversationSearch: boolean;
}

export interface ConversationStatistics {
  readonly totalSessions: number;
  readonly activeSessionsCount: number;
  readonly pinnedSessionsCount: number;
  readonly archivedSessionsCount: number;
  readonly totalMessages: number;
  readonly userMessagesCount: number;
  readonly assistantMessagesCount: number;
}

export interface ConversationSummary {
  readonly headline: string;
  readonly description: string;
  readonly topQuestion: string;
  readonly lastActiveSessionTitle?: string;
}

export interface AIChatState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly sessions: ReadonlyArray<ChatSession>;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly context: ConversationContext;
  readonly suggestedQuestions: ReadonlyArray<string>;
  readonly suggestedReplies: ReadonlyArray<string>;
  readonly summary: ConversationSummary;
  readonly statistics: ConversationStatistics;

  // Global Future Extension Flags
  readonly futureSupportFlags: ChatFutureSupportFlags;
}

export interface AIChatUiState {
  readonly isLoading: boolean;
  readonly state: AIChatState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly filterCategory?: ChatCategory | 'all';
}
