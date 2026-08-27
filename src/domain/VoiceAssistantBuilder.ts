/**
 * Daily Finance 3.0 - VoiceAssistantBuilder
 * Pure Voice Assistant State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero speech recognition APIs, zero microphone APIs, zero network calls, zero platform SDKs.
 * Consumes ONLY existing immutable read models to construct presentation-ready voice assistant state.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import { AutomationCenterState } from './AutomationCenterState';
import { CoachSession } from './AICoachSession';
import { AIChatState } from './AIChatState';
import { AnalyticsState } from './AnalyticsState';
import {
  VoiceAssistantState,
  VoiceAssistantContext,
  VoiceSuggestion,
  VoiceAssistantStatistics,
  VoiceAssistantFutureSupportFlags,
  VoiceCommand
} from './VoiceAssistantState';

export interface VoiceAssistantBuilderInputs {
  snapshot?: FinancialSnapshot;
  dashboardState?: DashboardState;
  goalPlannerState?: GoalPlannerState;
  notificationCenterState?: NotificationCenterState;
  habitEngineState?: HabitEngineState;
  automationCenterState?: AutomationCenterState;
  coachSession?: CoachSession;
  aiChatState?: AIChatState;
  analyticsState?: AnalyticsState;
  recentCommands?: ReadonlyArray<VoiceCommand>;
  language?: Language;
}

export class VoiceAssistantBuilder {
  /**
   * Transforms existing domain read models into an immutable VoiceAssistantState.
   */
  public static build(inputs: VoiceAssistantBuilderInputs): VoiceAssistantState {
    const {
      snapshot,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      coachSession,
      aiChatState,
      analyticsState,
      recentCommands = [],
      language = 'vi'
    } = inputs;

    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || dashboardState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    const futureSupportFlags: VoiceAssistantFutureSupportFlags = Object.freeze({
      supportsGoogleAssistant: true,
      supportsGemini: true,
      supportsOpenAI: true,
      supportsOfflineSpeechRecognition: true,
      supportsAndroidSpeechRecognizer: true,
      supportsTextToSpeech: true,
      supportsVoiceWakeWord: true,
      supportsWearOSVoice: true,
      supportsAndroidAutoVoice: true,
      supportsMultilingualVoice: true
    });

    const suggestions: VoiceSuggestion[] = [
      Object.freeze({
        id: 'sug_balance',
        phrase: isVi ? 'Ví của tôi còn bao nhiêu tiền?' : 'How much money is in my wallet?',
        category: 'query',
        description: isVi ? 'Tra cứu số dư ví khả dụng hiện tại' : 'Check current available wallet balance'
      }),
      Object.freeze({
        id: 'sug_expense',
        phrase: isVi ? 'Tháng này tôi đã chi bao nhiêu?' : 'How much have I spent this month?',
        category: 'query',
        description: isVi ? 'Tổng hợp chi tiêu tháng hiện tại' : 'Total current month expenditure'
      }),
      Object.freeze({
        id: 'sug_fire',
        phrase: isVi ? 'Tiến độ FIRE của tôi thế nào?' : 'What is my FIRE progress?',
        category: 'query',
        description: isVi ? 'Báo cáo tiến độ tự do tài chính' : 'FIRE financial freedom progress report'
      }),
      Object.freeze({
        id: 'sug_goals',
        phrase: isVi ? 'Mục tiêu nào đang gần hoàn thành?' : 'Which goals are close to completion?',
        category: 'goals',
        description: isVi ? 'Rà soát tiến độ các mục tiêu tiết kiệm' : 'Review progress on active savings goals'
      }),
      Object.freeze({
        id: 'sug_notifications',
        phrase: isVi ? 'Có thông báo tài chính nào quan trọng không?' : 'Are there any important financial notifications?',
        category: 'notifications',
        description: isVi ? 'Cảnh báo nợ, quá hạn ngân sách & nhắc nhở' : 'Alerts for debt, budget overspend & reminders'
      })
    ];

    const context: VoiceAssistantContext = Object.freeze({
      snapshot,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      coachSession,
      aiChatState,
      analyticsState
    });

    const totalCmds = recentCommands.length;
    const unknownCmds = recentCommands.filter(c => c.intent === 'unknown').length;
    const recognizedCmds = totalCmds - unknownCmds;

    const statistics: VoiceAssistantStatistics = Object.freeze({
      totalCommandsProcessed: totalCmds,
      recognizedCommandsCount: recognizedCmds,
      unknownCommandsCount: unknownCmds,
      confirmedCommandsCount: 0
    });

    const state: VoiceAssistantState = {
      timestamp: nowIso,
      spaceId,
      language,
      recentCommands: Object.freeze([...recentCommands]),
      suggestions: Object.freeze(suggestions),
      context,
      statistics,
      futureSupportFlags
    };

    return Object.freeze(state);
  }
}
