/**
 * Daily Finance 3.0 - VoiceCommandParser
 * Pure Deterministic Voice Command Parser & Read-Only Command Handler
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Zero speech recognition APIs, zero microphone APIs, zero LLM calls, zero side-effects.
 */

import { IdGenerator } from '../services/IdGenerator';
import {
  VoiceCommand,
  VoiceCommandIntent,
  VoiceCommandParameter,
  VoiceCommandResult,
  VoiceAssistantContext
} from './VoiceAssistantState';

export class VoiceCommandParser {
  /**
   * Deterministically parses raw string text into a VoiceCommand model.
   */
  public static parse(rawText: string, language: string = 'vi'): VoiceCommand {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const isVi = language === 'vi';

    let intent: VoiceCommandIntent = 'unknown';
    let confidence = 0.5;
    const parameters: VoiceCommandParameter[] = [];

    // Parse amount parameter if present
    const amountMatch = lower.match(/(\d+[\d.,]*)\s*(k|nghìn|ngan|triệu|trieu|tr|m)?/);
    if (amountMatch) {
      let num = parseFloat(amountMatch[1].replace(/,/g, ''));
      const unit = amountMatch[2];
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngan') {
        num *= 1000;
      } else if (unit === 'triệu' || unit === 'trieu' || unit === 'tr' || unit === 'm') {
        num *= 1000000;
      }
      parameters.push({
        name: 'amount',
        value: num,
        type: 'number'
      });
    }

    // Parse currency parameter if present
    const currencyMatch = text.match(/\b(VND|USD|EUR|JPY)\b/i);
    if (currencyMatch) {
      parameters.push({
        name: 'currency',
        value: currencyMatch[1].toUpperCase(),
        type: 'string'
      });
    }

    // Parse explicit wallet IDs if present in text
    const walletIdMatches = text.match(/w_[a-zA-Z0-9_]+/g);
    if (walletIdMatches && walletIdMatches.length >= 2) {
      parameters.push({ name: 'fromWalletId', value: walletIdMatches[0], type: 'string' });
      parameters.push({ name: 'toWalletId', value: walletIdMatches[1], type: 'string' });
    }

    // Intent detection based on keywords
    if (
      lower.includes('thêm khoản chi') ||
      lower.includes('chi tiêu') ||
      lower.includes('chi ') ||
      lower.includes('tiêu ') ||
      lower.includes('tiêu hết') ||
      lower.includes('mua ') ||
      lower.includes('add expense') ||
      lower.startsWith('chi')
    ) {
      intent = 'add_expense';
      confidence = 0.95;
    } else if (
      lower.includes('thêm thu nhập') ||
      lower.includes('nhận lương') ||
      lower.includes('thu nhập') ||
      lower.includes('add income')
    ) {
      intent = 'add_income';
      confidence = 0.95;
    } else if (
      lower.includes('chuyển') ||
      lower.includes('chuyển tiền') ||
      lower.includes('transfer')
    ) {
      intent = 'transfer_money';
      confidence = 0.95;
    } else if (
      lower.includes('ví') ||
      lower.includes('số dư') ||
      lower.includes('bao nhiêu tiền') ||
      lower.includes('balance')
    ) {
      intent = 'check_balance';
      confidence = 0.92;
    } else if (
      lower.includes('tài sản ròng') ||
      lower.includes('net worth')
    ) {
      intent = 'check_net_worth';
      confidence = 0.92;
    } else if (
      lower.includes('ngân sách') ||
      lower.includes('budget')
    ) {
      intent = 'check_budget';
      confidence = 0.92;
    } else if (
      lower.includes('tiết kiệm') ||
      lower.includes('savings')
    ) {
      intent = 'check_savings';
      confidence = 0.92;
    } else if (
      lower.includes('đầu tư') ||
      lower.includes('investments')
    ) {
      intent = 'check_investments';
      confidence = 0.92;
    } else if (
      lower.includes('trả khoản vay') ||
      lower.includes('nợ') ||
      lower.includes('debt')
    ) {
      intent = lower.includes('trả') ? 'check_debt' : 'check_debt';
      confidence = 0.9;
    } else if (
      lower.includes('fire') ||
      lower.includes('tự do tài chính')
    ) {
      intent = 'check_fire_progress';
      confidence = 0.95;
    } else if (
      lower.includes('mục tiêu') ||
      lower.includes('goals')
    ) {
      intent = lower.includes('mở') ? 'open_goals' : 'check_goals';
      confidence = 0.9;
    } else if (
      lower.includes('thông báo') ||
      lower.includes('notifications')
    ) {
      intent = 'check_notifications';
      confidence = 0.9;
    } else if (
      lower.includes('thói quen') ||
      lower.includes('habits')
    ) {
      intent = 'check_habits';
      confidence = 0.9;
    } else if (
      lower.includes('trang chủ') ||
      lower.includes('dashboard')
    ) {
      intent = 'open_dashboard';
      confidence = 0.95;
    } else if (
      lower.includes('báo cáo') ||
      lower.includes('phân tích') ||
      lower.includes('analytics')
    ) {
      intent = 'open_analytics';
      confidence = 0.95;
    } else if (
      lower.includes('trợ lý') ||
      lower.includes('coach')
    ) {
      intent = 'open_ai_coach';
      confidence = 0.95;
    }

    const command: VoiceCommand = {
      id: IdGenerator.generateId('cmd'),
      rawText: text,
      intent,
      parameters: Object.freeze(parameters),
      confidence,
      timestamp: new Date().toISOString()
    };

    return Object.freeze(command);
  }

  /**
   * Executes a VoiceCommand safely in read-only foundation mode.
   * Enforces requiresConfirmation = true for state-modifying actions.
   */
  public static executeReadOnly(
    command: VoiceCommand,
    context: VoiceAssistantContext,
    language: string = 'vi'
  ): VoiceCommandResult {
    const isVi = language === 'vi';
    const snapshot = context.snapshot;

    // Modifying commands require confirmation and MUST NOT execute directly
    if (
      command.intent === 'add_income' ||
      command.intent === 'add_expense' ||
      command.intent === 'transfer_money'
    ) {
      const amountParam = command.parameters.find(p => p.name === 'amount');
      const amountFormatted = amountParam ? `${amountParam.value.toLocaleString()} VND` : '';
      const actionName =
        command.intent === 'add_expense'
          ? (isVi ? 'thêm khoản chi' : 'add expense')
          : command.intent === 'add_income'
          ? (isVi ? 'thêm thu nhập' : 'add income')
          : (isVi ? 'chuyển tiền' : 'transfer');

      const confirmationMsg = isVi
        ? `Xác nhận: Bạn có muốn ${actionName} ${amountFormatted}?`
        : `Confirmation required: Do you want to ${actionName} ${amountFormatted}?`;

      return Object.freeze({
        commandId: command.id,
        intent: command.intent,
        success: true,
        message: confirmationMsg,
        requiresConfirmation: true,
        confirmationMessage: confirmationMsg,
        navigationRoute: command.intent === 'add_expense' ? '/transactions/new?type=expense' : '/transactions/new'
      });
    }

    // Read-only queries
    switch (command.intent) {
      case 'check_balance': {
        const balance = snapshot?.cashBalance || 0;
        const msg = isVi
          ? `Số dư ví khả dụng hiện tại của bạn là ${balance.toLocaleString()} VND.`
          : `Your current available balance is ${balance.toLocaleString()} VND.`;
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: msg,
          requiresConfirmation: false,
          dataPayload: { balance }
        });
      }

      case 'check_net_worth': {
        const netWorth = snapshot?.netWorth || 0;
        const msg = isVi
          ? `Tổng tài sản ròng hiện tại của bạn là ${netWorth.toLocaleString()} VND.`
          : `Your total net worth is ${netWorth.toLocaleString()} VND.`;
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: msg,
          requiresConfirmation: false,
          dataPayload: { netWorth }
        });
      }

      case 'check_fire_progress': {
        const progress = snapshot?.fireProgress?.progressPercent || 0;
        const msg = isVi
          ? `Tiến độ Tự do Tài chính (FIRE) của bạn hiện đạt ${progress}%.`
          : `Your FIRE progress is currently at ${progress}%.`;
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: msg,
          requiresConfirmation: false,
          dataPayload: { progress }
        });
      }

      case 'check_goals': {
        const goalsCount = context.goalPlannerState?.goals?.length || 0;
        const msg = isVi
          ? `Bạn đang theo đuổi ${goalsCount} mục tiêu tài chính.`
          : `You currently have ${goalsCount} active financial goals.`;
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: msg,
          requiresConfirmation: false,
          navigationRoute: '/goals',
          dataPayload: { goalsCount }
        });
      }

      case 'check_notifications': {
        const unread = context.notificationCenterState?.statistics?.unreadCount || 0;
        const msg = isVi
          ? `Bạn có ${unread} thông báo tài chính chưa đọc.`
          : `You have ${unread} unread financial notifications.`;
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: msg,
          requiresConfirmation: false,
          navigationRoute: '/notifications',
          dataPayload: { unread }
        });
      }

      case 'open_dashboard':
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: isVi ? 'Đang mở Trang chủ...' : 'Opening Dashboard...',
          requiresConfirmation: false,
          navigationRoute: '/dashboard'
        });

      case 'open_goals':
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: isVi ? 'Đang mở Mục tiêu...' : 'Opening Goals...',
          requiresConfirmation: false,
          navigationRoute: '/goals'
        });

      case 'open_analytics':
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: isVi ? 'Đang mở Phân tích Báo cáo...' : 'Opening Analytics...',
          requiresConfirmation: false,
          navigationRoute: '/analytics'
        });

      case 'open_ai_coach':
        return Object.freeze({
          commandId: command.id,
          intent: command.intent,
          success: true,
          message: isVi ? 'Đang kết nối Trợ lý AI Coach...' : 'Opening AI Coach...',
          requiresConfirmation: false,
          navigationRoute: '/coach'
        });

      case 'unknown':
      default: {
        const msg = isVi
          ? 'Xin lỗi, tôi chưa hiểu rõ lệnh voice này. Bạn có thể thử các câu lệnh mẫu bên dưới.'
          : 'Sorry, I did not recognize this voice command. You can try the suggested commands below.';
        return Object.freeze({
          commandId: command.id,
          intent: 'unknown',
          success: false,
          message: msg,
          requiresConfirmation: false
        });
      }
    }
  }
}
