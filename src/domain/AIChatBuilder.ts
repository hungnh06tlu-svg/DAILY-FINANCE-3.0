/**
 * Daily Finance 3.0 - AIChatBuilder
 * Pure AI Chat State Builder
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero calculations, zero LLM/API calls, zero persistence, zero repository access.
 * Consumes ONLY existing domain outputs to construct structured immutable conversation states.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialPlan } from './FinancialPlan';
import { FinancialForecast } from './FinancialForecast';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialIntelligence } from './FinancialIntelligence';
import { CoachSession } from './AICoachSession';
import { DashboardState } from './DashboardState';
import { GoalPlannerState } from './GoalPlannerState';
import { NotificationCenterState } from './NotificationCenterState';
import { HabitEngineState } from './HabitEngineState';
import { AutomationCenterState } from './AutomationCenterState';
import {
  AIChatState,
  ChatSession,
  ChatMessage,
  ConversationContext,
  ConversationSummary,
  ConversationStatistics,
  ChatFutureSupportFlags,
  ChatRole,
  ChatCategory,
  ChatPriority,
  ChatSessionStatus
} from './AIChatState';

export interface AIChatBuilderInputs {
  snapshot?: FinancialSnapshot;
  plan?: FinancialPlan;
  forecast?: FinancialForecast;
  timeline?: FinancialTimeline;
  intelligence?: FinancialIntelligence;
  coachSession?: CoachSession;
  dashboardState?: DashboardState;
  goalPlannerState?: GoalPlannerState;
  notificationCenterState?: NotificationCenterState;
  habitEngineState?: HabitEngineState;
  automationCenterState?: AutomationCenterState;
  language?: Language;
  filterCategory?: ChatCategory | 'all';
}

export class AIChatBuilder {
  /**
   * Transforms existing domain outputs into an immutable AIChatState.
   */
  public static build(inputs: AIChatBuilderInputs): AIChatState {
    const {
      snapshot,
      plan,
      forecast,
      timeline,
      intelligence,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      language = 'vi',
      filterCategory = 'all'
    } = inputs;

    const isVi = language === 'vi';
    const spaceId = snapshot?.spaceId || dashboardState?.spaceId || 'sp_personal';
    const nowIso = new Date().toISOString();

    const futureSupportFlags: ChatFutureSupportFlags = Object.freeze({
      supportsOpenAI: true,
      supportsGemini: true,
      supportsClaude: true,
      supportsDeepSeek: true,
      supportsOfflineAI: true,
      supportsRAG: true,
      supportsPromptTemplates: true,
      supportsVoiceConversation: true,
      supportsStreamingResponses: true,
      supportsMemory: true,
      supportsConversationSearch: true
    });

    const context: ConversationContext = Object.freeze({
      snapshot,
      plan,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState
    });

    // 1. Build Default Session
    const sessions: ChatSession[] = [];
    const sessionId = 'session_coaching_primary';

    sessions.push(Object.freeze({
      id: sessionId,
      title: coachSession ? coachSession.primaryConversation.headline : (isVi ? 'Tư vấn Tài chính Tổng quan' : 'General Financial Consultation'),
      createdAt: coachSession?.timestamp || nowIso,
      updatedAt: nowIso,
      status: 'active' as ChatSessionStatus,
      pinned: true,
      archived: false,
      tags: Object.freeze(['coaching', 'financial_health', 'daily_finance_3.0'])
    }));

    // 2. Build Messages based on Domain Outputs
    const messages: ChatMessage[] = [];

    // Welcome System Message
    messages.push(Object.freeze({
      id: 'msg_sys_welcome',
      sessionId,
      role: 'system' as ChatRole,
      content: isVi
        ? 'Khởi tạo phiên hội thoại Trợ lý Tài chính AI (Read-Only Context Loaded).'
        : 'Initialized AI Financial Assistant conversation session (Read-Only Context Loaded).',
      timestamp: nowIso,
      category: 'general' as ChatCategory,
      priority: 'low' as ChatPriority,
      evidence: Object.freeze([`SpaceId: ${spaceId}`]),
      references: Object.freeze(['FinancialSnapshot', 'AICoachSession']),
      suggestions: Object.freeze([])
    }));

    // User prompt derived from Coach Session or Dashboard
    messages.push(Object.freeze({
      id: 'msg_user_1',
      sessionId,
      role: 'user' as ChatRole,
      content: isVi
        ? 'Tôi nên tập trung vào mục tiêu tài chính nào quan trọng nhất lúc này?'
        : 'Which financial goal should I focus on most urgently right now?',
      timestamp: nowIso,
      category: 'coaching' as ChatCategory,
      priority: 'high' as ChatPriority,
      evidence: Object.freeze([]),
      references: Object.freeze(['AICoachSession']),
      suggestions: Object.freeze([])
    }));

    // Assistant response transformed from Coach Session & Plan
    const assistantContent = coachSession
      ? coachSession.primaryConversation.mainDialogue
      : (isVi
        ? 'Dựa trên phân tích bức tranh tài chính hiện tại, bạn nên duy trì kỷ luật ngân sách hàng tháng và nạp đầy quỹ dự phòng khẩn cấp.'
        : 'Based on your financial picture, you should maintain monthly budget discipline and top up your emergency fund.');

    messages.push(Object.freeze({
      id: 'msg_assistant_1',
      sessionId,
      role: 'assistant' as ChatRole,
      content: assistantContent,
      timestamp: nowIso,
      category: 'coaching' as ChatCategory,
      priority: 'high' as ChatPriority,
      evidence: Object.freeze(
        coachSession && coachSession.primaryConversation.messages.length > 0
          ? coachSession.primaryConversation.messages.map(m => m.evidence)
          : [isVi ? 'Sức khỏe tài chính ở mức ổn định' : 'Financial health is stable']
      ),
      references: Object.freeze([
        coachSession ? `CoachSession:${coachSession.id}` : 'Snapshot',
        plan ? `Plan:${plan.id}` : 'Plan'
      ]),
      suggestions: Object.freeze(
        coachSession?.primaryConversation.suggestedUserReplies || [
          isVi ? 'Làm sao để gia tăng tiết kiệm?' : 'How can I boost my savings?',
          isVi ? 'Kế hoạch hưu trí FIRE của tôi thế nào?' : 'How is my FIRE retirement plan?'
        ]
      )
    }));

    // 3. Suggested Questions & Suggested Replies
    const suggestedQuestions: ReadonlyArray<string> = Object.freeze([
      isVi ? 'Làm sao để cắt giảm chi tiêu mua sắm mà không ảnh hưởng cuộc sống?' : 'How can I trim shopping expenses without impacting my lifestyle?',
      isVi ? 'Bao lâu nữa tôi có thể đạt mục tiêu Tự do Tài chính (FIRE)?' : 'How long until I reach Financial Independence (FIRE)?',
      isVi ? 'Tôi nên phân bổ dòng tiền tiết kiệm vào đâu tháng này?' : 'Where should I allocate my savings cash flow this month?',
      isVi ? 'Tình hình thực thi quy tắc tự động hóa thế nào?' : 'What is the status of my automation rules?'
    ]);

    const suggestedReplies: ReadonlyArray<string> = Object.freeze([
      isVi ? 'Tôi muốn tạo ngay quy tắc tự động trích tiết kiệm.' : 'I want to set up an auto-savings transfer rule.',
      isVi ? 'Giải thích thêm cho tôi về lộ trình đạt mốc FIRE.' : 'Explain more about my FIRE milestone roadmap.',
      isVi ? 'Xem danh sách thói quen cần duy trì hôm nay.' : 'Show my habit streak list for today.'
    ]);

    // Apply category filtering if specified and not 'all'
    const filteredMessages = filterCategory === 'all'
      ? messages
      : messages.filter(m => m.category === filterCategory || m.role === 'system');

    // 4. Statistics
    const userMsgs = filteredMessages.filter(m => m.role === 'user').length;
    const assistantMsgs = filteredMessages.filter(m => m.role === 'assistant').length;

    const statistics: ConversationStatistics = Object.freeze({
      totalSessions: sessions.length,
      activeSessionsCount: sessions.filter(s => s.status === 'active').length,
      pinnedSessionsCount: sessions.filter(s => s.pinned).length,
      archivedSessionsCount: sessions.filter(s => s.archived).length,
      totalMessages: filteredMessages.length,
      userMessagesCount: userMsgs,
      assistantMessagesCount: assistantMsgs
    });

    // 5. Summary
    const summary: ConversationSummary = Object.freeze({
      headline: isVi
        ? `Trợ lý Hội thoại AI với ${sessions.length} phiên trò chuyện`
        : `AI Conversation Assistant with ${sessions.length} sessions`,
      description: isVi
        ? 'Chuyển đổi các phân tích tài chính phức tạp thành hội thoại tư vấn dạng cấu trúc, hỗ trợ sẵn sàng cho Gemini & LLMs.'
        : 'Transforms complex financial analytics into structured conversations ready for Gemini & LLMs.',
      topQuestion: suggestedQuestions[0],
      lastActiveSessionTitle: sessions[0]?.title
    });

    const state: AIChatState = {
      timestamp: nowIso,
      spaceId,
      language,
      sessions: Object.freeze(sessions),
      messages: Object.freeze(filteredMessages),
      context,
      suggestedQuestions,
      suggestedReplies,
      summary,
      statistics,
      futureSupportFlags
    };

    return Object.freeze(state);
  }
}
