/**
 * Daily Finance 3.0 - GetVoiceAssistantStateUseCase
 * Clean Architecture UseCase for Voice Assistant Domain.
 * Consumed strictly by VoiceAssistantViewModel and presentation layer.
 * Adheres strictly to S4-008 Widgets & Voice Assistant Architecture.
 */

import { GetFinancialSnapshotUseCase } from './FinancialSnapshotUseCase';
import { GetCoachSessionUseCase } from './GetCoachSessionUseCase';
import { GetDashboardStateUseCase } from './GetDashboardStateUseCase';
import { GetGoalPlannerStateUseCase } from './GetGoalPlannerStateUseCase';
import { GetNotificationCenterStateUseCase } from './GetNotificationCenterStateUseCase';
import { GetHabitEngineStateUseCase } from './GetHabitEngineStateUseCase';
import { GetAutomationCenterStateUseCase } from './GetAutomationCenterStateUseCase';
import { GetAIChatStateUseCase } from './GetAIChatStateUseCase';
import { GetAnalyticsStateUseCase } from './GetAnalyticsStateUseCase';

import { FinancialSnapshot } from '../domain/FinancialSnapshot';
import { CoachSession } from '../domain/AICoachSession';
import { DashboardState } from '../domain/DashboardState';
import { GoalPlannerState } from '../domain/GoalPlannerState';
import { NotificationCenterState } from '../domain/NotificationCenterState';
import { HabitEngineState } from '../domain/HabitEngineState';
import { AutomationCenterState } from '../domain/AutomationCenterState';
import { AIChatState } from '../domain/AIChatState';
import { AnalyticsState } from '../domain/AnalyticsState';
import {
  VoiceAssistantState,
  VoiceCommand,
  VoiceCommandResult,
  VoiceCommandIntent,
  VoiceCommandParameter
} from '../domain/VoiceAssistantState';
import { VoiceAssistantBuilder } from '../domain/VoiceAssistantBuilder';
import { VoiceCommandParser } from '../domain/VoiceCommandParser';
import { AddTransactionUseCase, TransferMoneyUseCase } from './TransactionUseCases';
import { WalletRepository } from '../repositories/contracts';
import { Language } from '../types';

export interface PendingVoiceCommandPayload {
  readonly type?: 'expense' | 'income' | 'transfer';
  readonly amount: number;
  readonly category?: string;
  readonly note: string;
  readonly fromWalletId?: string;
  readonly toWalletId?: string;
}

export interface PendingVoiceCommand {
  readonly id: string;
  readonly rawText: string;
  readonly intent: VoiceCommandIntent;
  readonly spaceId: string;
  readonly parameters: ReadonlyArray<VoiceCommandParameter>;
  readonly payload: PendingVoiceCommandPayload;
  readonly requiresConfirmation: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'EXECUTED' | 'CANCELLED';
  readonly createdAt: string;
}

export class GetVoiceAssistantStateUseCase {
  private readonly pendingCommands = new Map<string, PendingVoiceCommand>();

  constructor(
    private readonly getSnapshotUseCase: GetFinancialSnapshotUseCase,
    private readonly getCoachSessionUseCase: GetCoachSessionUseCase,
    private readonly getDashboardStateUseCase: GetDashboardStateUseCase,
    private readonly getGoalPlannerStateUseCase: GetGoalPlannerStateUseCase,
    private readonly getNotificationCenterStateUseCase: GetNotificationCenterStateUseCase,
    private readonly getHabitEngineStateUseCase: GetHabitEngineStateUseCase,
    private readonly getAutomationCenterStateUseCase: GetAutomationCenterStateUseCase,
    private readonly getAIChatStateUseCase: GetAIChatStateUseCase,
    private readonly getAnalyticsStateUseCase: GetAnalyticsStateUseCase,
    private readonly addTransactionUseCase: AddTransactionUseCase,
    private readonly transferMoneyUseCase: TransferMoneyUseCase,
    private readonly walletRepo: WalletRepository
  ) {
    if (
      !getSnapshotUseCase ||
      !getCoachSessionUseCase ||
      !getDashboardStateUseCase ||
      !getGoalPlannerStateUseCase ||
      !getNotificationCenterStateUseCase ||
      !getHabitEngineStateUseCase ||
      !getAutomationCenterStateUseCase ||
      !getAIChatStateUseCase ||
      !getAnalyticsStateUseCase ||
      !addTransactionUseCase ||
      !transferMoneyUseCase ||
      !walletRepo
    ) {
      throw new Error('[GetVoiceAssistantStateUseCase] Fail-Fast: All dependent UseCases and repositories are required');
    }
  }

  /**
   * Retrieves a pending command by ID for inspection or verification.
   */
  getPendingCommand(commandId: string): PendingVoiceCommand | undefined {
    return this.pendingCommands.get(commandId);
  }

  /**
   * Builds and retrieves full VoiceAssistantState for a spaceId.
   */
  async execute(
    spaceId: string = 'sp_personal',
    recentCommands: ReadonlyArray<VoiceCommand> = [],
    language: Language = 'vi'
  ): Promise<VoiceAssistantState> {
    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const coachSession = await this.getCoachSessionUseCase.execute(spaceId, language);
    const dashboardState = await this.getDashboardStateUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);
    const habitEngineState = await this.getHabitEngineStateUseCase.execute(spaceId, language);
    const automationCenterState = await this.getAutomationCenterStateUseCase.execute(spaceId, language);
    const aiChatState = await this.getAIChatStateUseCase.execute(spaceId, language);
    const analyticsState = await this.getAnalyticsStateUseCase.execute(spaceId, language);

    return VoiceAssistantBuilder.build({
      snapshot,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      aiChatState,
      analyticsState,
      recentCommands,
      language
    });
  }

  /**
   * Processes a raw voice command text in read-only mode, or creates an authoritative pending command.
   */
  async processVoiceCommand(
    rawText: string,
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<{ command: VoiceCommand; result: VoiceCommandResult }> {
    const isVi = language === 'vi';
    const command = VoiceCommandParser.parse(rawText, language);

    if (
      command.intent === 'add_expense' ||
      command.intent === 'add_income' ||
      command.intent === 'transfer_money'
    ) {
      const amountParam = command.parameters.find(p => p.name === 'amount');
      const amount = amountParam && typeof amountParam.value === 'number' && amountParam.value > 0
        ? amountParam.value
        : 100000;

      const fromWalletParam = command.parameters.find(p => p.name === 'fromWalletId');
      const toWalletParam = command.parameters.find(p => p.name === 'toWalletId');

      const isExpense = command.intent === 'add_expense';
      const isIncome = command.intent === 'add_income';

      const payload: PendingVoiceCommandPayload = Object.freeze({
        type: isExpense ? 'expense' : isIncome ? 'income' : 'transfer',
        amount,
        category: isExpense
          ? (isVi ? 'Chi Tiêu Voice' : 'Voice Expense')
          : isIncome
          ? (isVi ? 'Thu Nhập Voice' : 'Voice Income')
          : (isVi ? 'Chuyển Tiền Voice' : 'Voice Transfer'),
        note: `[Voice AI] ${command.rawText}`,
        fromWalletId: fromWalletParam && typeof fromWalletParam.value === 'string' ? fromWalletParam.value : undefined,
        toWalletId: toWalletParam && typeof toWalletParam.value === 'string' ? toWalletParam.value : undefined
      });

      const pendingCmd: PendingVoiceCommand = {
        id: command.id,
        rawText: command.rawText,
        intent: command.intent,
        spaceId,
        parameters: command.parameters,
        payload,
        requiresConfirmation: true,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      this.pendingCommands.set(command.id, pendingCmd);

      const actionName = isExpense
        ? (isVi ? 'thêm khoản chi' : 'add expense')
        : isIncome
        ? (isVi ? 'thêm thu nhập' : 'add income')
        : (isVi ? 'chuyển tiền' : 'transfer');

      const confirmationMsg = isVi
        ? `Xác nhận: Bạn có muốn ${actionName} ${amount.toLocaleString()} VND?`
        : `Confirmation required: Do you want to ${actionName} ${amount.toLocaleString()} VND?`;

      const result: VoiceCommandResult = Object.freeze({
        commandId: command.id,
        intent: command.intent,
        success: true,
        message: confirmationMsg,
        requiresConfirmation: true,
        confirmationMessage: confirmationMsg,
        navigationRoute: isExpense ? '/transactions/new?type=expense' : '/transactions/new'
      });

      return { command, result };
    }

    const snapshot = await this.getSnapshotUseCase.execute(spaceId, language);
    const goalPlannerState = await this.getGoalPlannerStateUseCase.execute(spaceId, language);
    const notificationCenterState = await this.getNotificationCenterStateUseCase.execute(spaceId, language);

    const result = VoiceCommandParser.executeReadOnly(
      command,
      {
        snapshot,
        goalPlannerState,
        notificationCenterState
      },
      language
    );

    return { command, result };
  }

  /**
   * Executes a confirmed state-changing voice command safely from its authoritative pending command record.
   */
  async executeConfirmedCommand(
    commandId: string,
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<{ command: VoiceCommand; result: VoiceCommandResult }> {
    const isVi = language === 'vi';
    const pendingCmd = this.pendingCommands.get(commandId);

    if (!pendingCmd) {
      throw new Error(
        isVi
          ? 'Không tìm thấy lệnh giọng nói hoặc lệnh không hợp lệ.'
          : 'Unknown or invalid command ID.'
      );
    }

    if (pendingCmd.spaceId !== spaceId) {
      throw new Error(
        isVi
          ? 'Không thể thực thi lệnh giọng nói từ không gian làm việc khác.'
          : 'Cannot execute voice command for a different space.'
      );
    }

    if (pendingCmd.status !== 'PENDING') {
      if (pendingCmd.status === 'EXECUTED') {
        throw new Error(
          isVi
            ? 'Lệnh giọng nói này đã được thực thi trước đó.'
            : 'Voice command has already been executed.'
        );
      }
      if (pendingCmd.status === 'CANCELLED') {
        throw new Error(
          isVi
            ? 'Lệnh giọng nói này đã bị hủy bỏ.'
            : 'Voice command was cancelled.'
        );
      }
      throw new Error(
        isVi
          ? 'Lệnh giọng nói không ở trạng thái chờ xác nhận.'
          : 'Voice command is not pending confirmation.'
      );
    }

    const { intent, payload } = pendingCmd;
    let success = false;
    let message = '';

    if (intent === 'add_expense' || intent === 'add_income') {
      const isExpense = intent === 'add_expense';
      try {
        await this.addTransactionUseCase.execute({
          type: isExpense ? 'expense' : 'income',
          amount: payload.amount,
          currency: 'VND',
          category: payload.category || (isExpense ? 'Voice Expense' : 'Voice Income'),
          spaceId: pendingCmd.spaceId,
          date: new Date().toISOString(),
          note: payload.note,
          method: 'cash'
        });
        pendingCmd.status = 'EXECUTED';
        success = true;
        message = isVi
          ? `Đã tạo giao dịch ${isExpense ? 'chi tiêu' : 'thu nhập'} ${payload.amount.toLocaleString()} VND thành công.`
          : `Successfully created ${isExpense ? 'expense' : 'income'} transaction of ${payload.amount.toLocaleString()} VND.`;
      } catch (err) {
        pendingCmd.status = 'PENDING';
        throw err;
      }
    } else if (intent === 'transfer_money') {
      const fromWalletId = payload.fromWalletId;
      const toWalletId = payload.toWalletId;

      if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
        pendingCmd.status = 'PENDING';
        throw new Error(
          isVi
            ? 'Ví nguồn hoặc ví đích không hợp lệ hoặc bị thiếu trong lệnh chuyển tiền.'
            : 'Missing or invalid source or target wallet in transfer command.'
        );
      }

      try {
        const transferRes = await this.transferMoneyUseCase.execute({
          fromWalletId,
          toWalletId,
          amount: payload.amount,
          spaceId: pendingCmd.spaceId,
          note: payload.note
        });

        if (!transferRes.success) {
          pendingCmd.status = 'PENDING';
          throw new Error(
            transferRes.error ||
              (isVi ? 'Thực thi chuyển tiền thất bại.' : 'Transfer money execution failed.')
          );
        }

        pendingCmd.status = 'EXECUTED';
        success = true;
        message = isVi
          ? `Đã chuyển thành công ${payload.amount.toLocaleString()} VND.`
          : `Successfully transferred ${payload.amount.toLocaleString()} VND.`;
      } catch (err) {
        pendingCmd.status = 'PENDING';
        throw err;
      }
    } else {
      pendingCmd.status = 'EXECUTED';
      success = true;
      message = isVi ? 'Đã thực thi lệnh giọng nói.' : 'Voice command executed successfully.';
    }

    const command: VoiceCommand = Object.freeze({
      id: pendingCmd.id,
      rawText: pendingCmd.rawText,
      intent: pendingCmd.intent,
      parameters: pendingCmd.parameters,
      confidence: 0.95,
      timestamp: new Date().toISOString()
    });

    const result: VoiceCommandResult = Object.freeze({
      commandId: pendingCmd.id,
      intent: pendingCmd.intent,
      success,
      message,
      requiresConfirmation: false,
      navigationRoute: intent === 'add_expense' ? '/transactions/new?type=expense' : '/transactions/new'
    });

    return { command, result };
  }

  /**
   * Cancels a pending state-changing voice command by ID.
   */
  async cancelPendingCommand(
    commandId: string,
    spaceId: string = 'sp_personal',
    language: Language = 'vi'
  ): Promise<boolean> {
    const isVi = language === 'vi';
    const pendingCmd = this.pendingCommands.get(commandId);

    if (!pendingCmd) {
      throw new Error(
        isVi
          ? 'Không tìm thấy lệnh giọng nói để hủy.'
          : 'Command ID not found to cancel.'
      );
    }

    if (pendingCmd.spaceId !== spaceId) {
      throw new Error(
        isVi
          ? 'Không thể hủy lệnh giọng nói từ không gian làm việc khác.'
          : 'Cannot cancel command for a different space.'
      );
    }

    if (pendingCmd.status === 'PENDING') {
      pendingCmd.status = 'CANCELLED';
      return true;
    }

    return false;
  }

  /**
   * Generates VoiceAssistantState directly from pre-built domain outputs.
   */
  executeFromDomainOutputs(
    snapshot?: FinancialSnapshot,
    coachSession?: CoachSession,
    dashboardState?: DashboardState,
    goalPlannerState?: GoalPlannerState,
    notificationCenterState?: NotificationCenterState,
    habitEngineState?: HabitEngineState,
    automationCenterState?: AutomationCenterState,
    aiChatState?: AIChatState,
    analyticsState?: AnalyticsState,
    recentCommands: ReadonlyArray<VoiceCommand> = [],
    language: Language = 'vi'
  ): VoiceAssistantState {
    return VoiceAssistantBuilder.build({
      snapshot,
      coachSession,
      dashboardState,
      goalPlannerState,
      notificationCenterState,
      habitEngineState,
      automationCenterState,
      aiChatState,
      analyticsState,
      recentCommands,
      language
    });
  }
}

