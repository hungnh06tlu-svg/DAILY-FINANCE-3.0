/**
 * Daily Finance 3.0 - VoiceAssistantState Domain Models
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Adheres strictly to S4-008 Voice Assistant Architecture.
 */

import { FinancialSnapshot } from './FinancialSnapshot';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import { AutomationCenterState } from './AutomationCenterState';
import { CoachSession } from './AICoachSession';
import { AIChatState } from './AIChatState';
import { AnalyticsState } from './AnalyticsState';

export type VoiceCommandIntent =
  | 'add_income'
  | 'add_expense'
  | 'transfer_money'
  | 'check_balance'
  | 'check_net_worth'
  | 'check_budget'
  | 'check_savings'
  | 'check_investments'
  | 'check_debt'
  | 'check_fire_progress'
  | 'check_goals'
  | 'check_notifications'
  | 'check_habits'
  | 'open_dashboard'
  | 'open_goals'
  | 'open_analytics'
  | 'open_ai_coach'
  | 'unknown';

export interface VoiceCommandParameter {
  readonly name: string;
  readonly value: any;
  readonly type: 'string' | 'number' | 'date' | 'category' | 'account';
}

export interface VoiceCommand {
  readonly id: string;
  readonly rawText: string;
  readonly intent: VoiceCommandIntent;
  readonly parameters: ReadonlyArray<VoiceCommandParameter>;
  readonly confidence: number;
  readonly timestamp: string;
}

export interface VoiceCommandResult {
  readonly commandId: string;
  readonly intent: VoiceCommandIntent;
  readonly success: boolean;
  readonly message: string;
  readonly requiresConfirmation: boolean;
  readonly confirmationMessage?: string;
  readonly navigationRoute?: string;
  readonly dataPayload?: Record<string, any>;
}

export interface VoiceAssistantContext {
  readonly snapshot?: FinancialSnapshot;
  readonly dashboardState?: DashboardState;
  readonly goalPlannerState?: GoalPlannerState;
  readonly notificationCenterState?: NotificationCenterState;
  readonly habitEngineState?: HabitEngineState;
  readonly automationCenterState?: AutomationCenterState;
  readonly coachSession?: CoachSession;
  readonly aiChatState?: AIChatState;
  readonly analyticsState?: AnalyticsState;
}

export interface VoiceSuggestion {
  readonly id: string;
  readonly phrase: string;
  readonly category: string;
  readonly description: string;
}

export interface VoiceAssistantStatistics {
  readonly totalCommandsProcessed: number;
  readonly recognizedCommandsCount: number;
  readonly unknownCommandsCount: number;
  readonly confirmedCommandsCount: number;
}

export interface VoiceAssistantFutureSupportFlags {
  readonly supportsGoogleAssistant: boolean;
  readonly supportsGemini: boolean;
  readonly supportsOpenAI: boolean;
  readonly supportsOfflineSpeechRecognition: boolean;
  readonly supportsAndroidSpeechRecognizer: boolean;
  readonly supportsTextToSpeech: boolean;
  readonly supportsVoiceWakeWord: boolean;
  readonly supportsWearOSVoice: boolean;
  readonly supportsAndroidAutoVoice: boolean;
  readonly supportsMultilingualVoice: boolean;
}

export interface VoiceAssistantState {
  readonly timestamp: string;
  readonly spaceId: string;
  readonly language: string;
  readonly recentCommands: ReadonlyArray<VoiceCommand>;
  readonly suggestions: ReadonlyArray<VoiceSuggestion>;
  readonly context: VoiceAssistantContext;
  readonly statistics: VoiceAssistantStatistics;
  readonly futureSupportFlags: VoiceAssistantFutureSupportFlags;
}

export interface VoiceAssistantUiState {
  readonly isLoading: boolean;
  readonly state: VoiceAssistantState | null;
  readonly error: string | null;
  readonly lastUpdated: string | null;
  readonly lastResult?: VoiceCommandResult;
}
