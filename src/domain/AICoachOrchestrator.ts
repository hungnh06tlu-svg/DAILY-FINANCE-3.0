/**
 * Daily Finance 3.0 - AICoachOrchestrator
 * Pure Orchestration Layer for AI Coach v2
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero financial analysis, zero planning, zero forecasting, zero calculations performed in this orchestrator.
 * Consumes ONLY outputs from existing domain engines (FinancialSnapshot, FinancialTimeline, FinancialIntelligence, FinancialForecast, FinancialPlan)
 * and transforms them into user-facing coaching decisions, messages, conversations, and sessions.
 */

import { Language } from '../types';
import { FinancialSnapshot } from './FinancialSnapshot';
import { FinancialTimeline } from './FinancialTimeline';
import { FinancialIntelligence } from './FinancialIntelligence';
import { FinancialForecast } from './FinancialForecast';
import { FinancialPlan } from './FinancialPlan';
import {
  CoachSession,
  CoachMessage,
  CoachConversation,
  CoachDecision,
  CoachDecisionCategory,
  ConversationTopic
} from './AICoachSession';

export interface AICoachOrchestratorInputs {
  snapshot: FinancialSnapshot;
  timeline?: FinancialTimeline;
  intelligence?: FinancialIntelligence;
  forecast?: FinancialForecast;
  plan?: FinancialPlan;
  language?: Language;
}

export class AICoachOrchestrator {
  /**
   * Orchestrates an AI Coach v2 session from existing domain outputs.
   */
  public static orchestrate(inputs: AICoachOrchestratorInputs): CoachSession {
    const { snapshot, intelligence, forecast, plan, language = 'vi' } = inputs;
    const isVi = language === 'vi';

    const decisions: CoachDecision[] = [];
    const messages: CoachMessage[] = [];
    const conversations: CoachConversation[] = [];

    // --- 1. Evaluate Decisions & Messages from Intelligence (Risks, Opportunities, Insights) ---
    if (intelligence) {
      // Evaluate Risks -> Warning / Escalation Decisions
      intelligence.risks.forEach((risk, idx) => {
        const category: CoachDecisionCategory = risk.severity === 'critical' ? 'escalate' : 'warn';
        const priority = risk.severity === 'critical' ? 'urgent' : risk.severity === 'high' ? 'high' : 'medium';

        decisions.push({
          id: `dec_risk_${risk.id}`,
          category,
          priority,
          rationale: risk.description,
          targetDomain: risk.type,
          triggerEvent: 'risk_detected'
        });

        messages.push({
          id: `msg_risk_${risk.id}`,
          type: 'warning',
          priority,
          title: risk.title,
          message: risk.description,
          reason: isVi ? 'Phát hiện rủi ro từ bộ phân tích trí tuệ tài chính.' : 'Risk detected by Financial Intelligence Engine.',
          evidence: `Risk Type: ${risk.type}, Severity: ${risk.severity}`,
          recommendedAction: risk.mitigationPlan[0] || (isVi ? 'Thắt chặt kiểm soát tài chính.' : 'Tighten financial control.'),
          relatedInsight: risk.id
        });
      });

      // Evaluate Opportunities -> Recommendations / Encouragement
      intelligence.opportunities.forEach((opp) => {
        const priority = opp.priority === 'urgent' ? 'urgent' : opp.priority === 'high' ? 'high' : 'medium';

        decisions.push({
          id: `dec_opp_${opp.id}`,
          category: 'recommend',
          priority,
          rationale: opp.description,
          targetDomain: opp.type,
          triggerEvent: 'opportunity_identified'
        });

        messages.push({
          id: `msg_opp_${opp.id}`,
          type: 'recommendation',
          priority,
          title: opp.title,
          message: opp.description,
          reason: isVi ? 'Cơ hội tối ưu hóa dòng tiền và tài sản.' : 'Cash flow & asset optimization opportunity.',
          evidence: opp.impactAmount ? `Potential Impact: ${opp.impactAmount.toLocaleString()} ${snapshot.currency}` : 'Identified by Intelligence Engine',
          recommendedAction: opp.actionPlan[0] || (isVi ? 'Thực hiện kế hoạch tối ưu.' : 'Execute optimization plan.')
        });
      });

      // Evaluate Insights -> Remind / Encourage / Celebrate
      intelligence.insights.forEach((ins) => {
        decisions.push({
          id: `dec_ins_${ins.id}`,
          category: ins.category === 'budget' ? 'celebrate' : 'encourage',
          priority: ins.priority === 'urgent' ? 'urgent' : ins.priority === 'high' ? 'high' : 'medium',
          rationale: ins.description,
          targetDomain: ins.category,
          triggerEvent: 'insight_generated'
        });

        messages.push({
          id: `msg_ins_${ins.id}`,
          type: ins.category === 'budget' ? 'achievement' : 'motivation',
          priority: ins.priority === 'urgent' ? 'urgent' : ins.priority === 'high' ? 'high' : 'medium',
          title: ins.title,
          message: ins.description,
          reason: ins.recommendation,
          evidence: ins.evidence,
          recommendedAction: ins.recommendation,
          relatedInsight: ins.id
        });
      });
    }

    // --- 2. Evaluate Decisions & Messages from Forecast ---
    if (forecast) {
      forecast.insights.forEach((fcIns) => {
        if (fcIns.type === 'on_track' || fcIns.type === 'target_reachable') {
          decisions.push({
            id: `dec_fc_${fcIns.id}`,
            category: 'celebrate',
            priority: 'medium',
            rationale: fcIns.description,
            targetDomain: fcIns.targetMetric,
            triggerEvent: 'forecast_on_track'
          });

          messages.push({
            id: `msg_fc_${fcIns.id}`,
            type: 'achievement',
            priority: 'medium',
            title: fcIns.title,
            message: fcIns.description,
            reason: isVi ? 'Dự báo xu hướng tài chính tích cực.' : 'Positive financial forecast projection.',
            evidence: `Forecast Horizon: ${forecast.horizonDays} days, Confidence: ${(fcIns.confidence * 100).toFixed(0)}%`,
            recommendedAction: isVi ? 'Tiếp tục duy trì lộ trình hiện tại.' : 'Maintain current financial trajectory.'
          });
        } else if (fcIns.type === 'high_risk' || fcIns.type === 'delayed') {
          decisions.push({
            id: `dec_fc_${fcIns.id}`,
            category: 'warn',
            priority: 'high',
            rationale: fcIns.description,
            targetDomain: fcIns.targetMetric,
            triggerEvent: 'forecast_risk'
          });

          messages.push({
            id: `msg_fc_${fcIns.id}`,
            type: 'warning',
            priority: 'high',
            title: fcIns.title,
            message: fcIns.description,
            reason: isVi ? 'Dự báo xu hướng tài chính có nguy cơ chệch mục tiêu.' : 'Forecast indicates potential goal deviation.',
            evidence: `Forecast Horizon: ${forecast.horizonDays} days`,
            recommendedAction: isVi ? 'Điều chỉnh kế hoạch chi tiêu/tiết kiệm.' : 'Adjust spending or savings plan.'
          });
        }
      });
    }

    // --- 3. Evaluate Decisions & Messages from Plan ---
    if (plan) {
      plan.actions.forEach((act) => {
        if (!act.isCompleted && (act.priority === 'urgent' || act.priority === 'high')) {
          decisions.push({
            id: `dec_plan_act_${act.id}`,
            category: 'remind',
            priority: act.priority,
            rationale: act.description,
            triggerEvent: 'action_pending'
          });

          messages.push({
            id: `msg_plan_act_${act.id}`,
            type: 'reminder',
            priority: act.priority,
            title: act.title,
            message: act.description,
            reason: isVi ? 'Hành động ưu tiên trong Kế hoạch Tài chính chưa hoàn thành.' : 'High priority action item in Financial Plan remains pending.',
            evidence: `Estimated Impact: ${act.estimatedImpact.toLocaleString()} ${snapshot.currency}, Duration: ${act.estimatedDuration}`,
            recommendedAction: act.description,
            relatedGoal: act.id
          });
        }
      });
    }

    // Default decision if none generated
    if (decisions.length === 0) {
      decisions.push({
        id: 'dec_default',
        category: 'encourage',
        priority: 'low',
        rationale: isVi ? 'Tài chính ổn định, duy trì thói quen hiện tại.' : 'Financial state stable, maintain current habits.',
        triggerEvent: 'routine_check'
      });
    }

    // Default message if none generated
    if (messages.length === 0) {
      messages.push({
        id: 'msg_default',
        type: 'summary',
        priority: 'low',
        title: isVi ? 'Tổng quan Tài chính Lành mạnh' : 'Healthy Financial Overview',
        message: isVi ? 'Mọi chỉ số tài chính của bạn đang nằm trong tầm kiểm soát.' : 'All your financial indicators are in good shape.',
        reason: isVi ? 'Dữ liệu giao dịch và ngân sách đạt chuẩn.' : 'Transaction and budget data within parameters.',
        evidence: `Net Worth: ${snapshot.netWorth.toLocaleString()} ${snapshot.currency}`,
        recommendedAction: isVi ? 'Tiếp tục duy trì việc ghi chép giao dịch.' : 'Continue logging daily transactions.'
      });
    }

    // --- 4. Build Conversations ---
    // Primary Daily Summary Conversation
    const summaryMsg = messages.find(m => m.type === 'summary') || messages[0];
    const dailyConv: CoachConversation = {
      id: 'conv_daily_summary',
      topic: 'daily_summary',
      headline: isVi ? 'Báo cáo Điều hành Tài chính Hàng ngày' : 'Daily Financial Briefing',
      greeting: isVi ? `Xin chào! Tôi là AI Coach của bạn.` : `Hello! I am your AI Financial Coach.`,
      mainDialogue: isVi
        ? `Hôm nay tài sản ròng của bạn là ${snapshot.netWorth.toLocaleString()} ${snapshot.currency}. Chi tiêu tháng này: ${snapshot.monthlyExpense.toLocaleString()} ${snapshot.currency}.`
        : `Your current net worth is ${snapshot.netWorth.toLocaleString()} ${snapshot.currency}. Monthly expenses: ${snapshot.monthlyExpense.toLocaleString()} ${snapshot.currency}.`,
      closingThought: isVi ? 'Hãy luôn giữ kỷ luật tài chính!' : 'Stay disciplined with your financial plan!',
      messages: Object.freeze([summaryMsg]),
      suggestedUserReplies: isVi
        ? ['Tôi nên ưu tiên hành động nào?', 'Phân tích kỹ hơn về rủi ro', 'Xem lộ trình FIRE']
        : ['What action should I prioritize?', 'Analyze my risks in detail', 'Show my FIRE path']
    };
    conversations.push(dailyConv);

    // Warning Conversation if high risk exists
    const warningMsgs = messages.filter(m => m.type === 'warning');
    if (warningMsgs.length > 0) {
      conversations.push({
        id: 'conv_warning',
        topic: 'warning',
        headline: isVi ? 'Cảnh báo Rủi ro Cần Chú ý' : 'Risk Alerts & Warnings',
        greeting: isVi ? 'Chú ý: Tôi phát hiện một số điểm nguy cơ tài chính.' : 'Attention: Critical financial risks identified.',
        mainDialogue: warningMsgs[0].message,
        closingThought: isVi ? 'Cần thực hiện ngay biện pháp khắc phục.' : 'Immediate mitigation action recommended.',
        messages: Object.freeze(warningMsgs),
        suggestedUserReplies: isVi
          ? ['Cách khắc phục rủi ro này?', 'Điều chỉnh ngân sách ngay']
          : ['How to mitigate this risk?', 'Adjust budget now']
      });
    }

    // Suggestion Conversation if recommendations exist
    const recMsgs = messages.filter(m => m.type === 'recommendation');
    if (recMsgs.length > 0) {
      conversations.push({
        id: 'conv_suggestion',
        topic: 'suggestion',
        headline: isVi ? 'Gợi ý Tối ưu Tài chính' : 'Financial Optimization Suggestions',
        greeting: isVi ? 'Tôi có một số đề xuất giúp gia tăng tài sản.' : 'I have recommendations to boost your financial growth.',
        mainDialogue: recMsgs[0].message,
        closingThought: isVi ? 'Tận dụng các cơ hội này để đẩy nhanh mục tiêu.' : 'Leverage these opportunities to reach goals faster.',
        messages: Object.freeze(recMsgs),
        suggestedUserReplies: isVi
          ? ['Thêm vào kế hoạch tài chính', 'Xem chi tiết gợi ý']
          : ['Add to financial plan', 'View suggestion details']
      });
    }

    // Determine Primary Decision & Conversation
    const primaryDecision = decisions.find(d => d.priority === 'urgent') || decisions.find(d => d.priority === 'high') || decisions[0];
    const primaryConversation = conversations.find(c => c.topic === 'warning') || conversations[0];

    // Determine Overall Tone
    let overallTone: 'celebratory' | 'cautious' | 'encouraging' | 'urgent' | 'informative' = 'informative';
    if (primaryDecision.category === 'escalate' || primaryDecision.priority === 'urgent') {
      overallTone = 'urgent';
    } else if (primaryDecision.category === 'warn') {
      overallTone = 'cautious';
    } else if (primaryDecision.category === 'celebrate') {
      overallTone = 'celebratory';
    } else if (primaryDecision.category === 'encourage' || primaryDecision.category === 'recommend') {
      overallTone = 'encouraging';
    }

    const sessionText = isVi
      ? `AI Coach Session [${overallTone.toUpperCase()}]: ${primaryDecision.rationale}`
      : `AI Coach Session [${overallTone.toUpperCase()}]: ${primaryDecision.rationale}`;

    const session: CoachSession = {
      id: `session_${snapshot.spaceId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      spaceId: snapshot.spaceId,
      overallTone,
      primaryDecision: Object.freeze(primaryDecision),
      decisions: Object.freeze(decisions),
      primaryConversation: Object.freeze(primaryConversation),
      conversations: Object.freeze(conversations),
      messages: Object.freeze(messages),
      summaryText: sessionText
    };

    return Object.freeze(session);
  }
}
