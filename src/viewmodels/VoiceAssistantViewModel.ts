/**
 * Daily Finance 3.0 - VoiceAssistantViewModel
 * ViewModel for Voice Assistant Domain (S4-008).
 * Communicates EXCLUSIVELY through GetVoiceAssistantStateUseCase.
 * Performs zero business calculations, zero repository queries, zero speech/microphone API calls.
 * Exposes immutable VoiceAssistantUiState.
 */

import { Language } from '../types';
import { GetVoiceAssistantStateUseCase } from '../usecases/GetVoiceAssistantStateUseCase';
import { VoiceAssistantUiState, VoiceCommand } from '../domain/VoiceAssistantState';
import { toSafeUserError } from '../utils/safeError';

export class VoiceAssistantViewModel {
  constructor(private readonly getVoiceAssistantStateUseCase: GetVoiceAssistantStateUseCase) {
    if (!getVoiceAssistantStateUseCase) {
      throw new Error('[VoiceAssistantViewModel] Fail-Fast: GetVoiceAssistantStateUseCase is required');
    }
  }

  /**
   * Fetches and exposes immutable VoiceAssistantUiState via GetVoiceAssistantStateUseCase.
   */
  async getVoiceAssistantUiState(
    spaceId: string = 'sp_personal',
    recentCommands: ReadonlyArray<VoiceCommand> = [],
    language: Language = 'vi'
  ): Promise<VoiceAssistantUiState> {
    try {
      const state = await this.getVoiceAssistantStateUseCase.execute(spaceId, recentCommands, language);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể tải dữ liệu Trợ Lý Giọng Nói. Vui lòng thử lại.',
          'Unable to load Voice Assistant UI State. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Processes a voice command through the UseCase in read-only mode and returns updated UiState.
   */
  async processVoiceCommand(
    rawText: string,
    spaceId: string = 'sp_personal',
    existingCommands: ReadonlyArray<VoiceCommand> = [],
    language: Language = 'vi'
  ): Promise<VoiceAssistantUiState> {
    try {
      const { command, result } = await this.getVoiceAssistantStateUseCase.processVoiceCommand(rawText, spaceId, language);
      const updatedCommands = Object.freeze([command, ...existingCommands]);
      const state = await this.getVoiceAssistantStateUseCase.execute(spaceId, updatedCommands, language);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString(),
        lastResult: result
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể xử lý lệnh giọng nói. Vui lòng thử lại.',
          'Unable to process voice command. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Confirms and executes an authoritative pending state-changing voice command by commandId.
   */
  async confirmAction(
    commandId: string,
    arg2?: string | ReadonlyArray<VoiceCommand>,
    arg3?: string | ReadonlyArray<VoiceCommand>,
    arg4?: string | ReadonlyArray<VoiceCommand>,
    arg5?: ReadonlyArray<VoiceCommand> | Language,
    arg6?: Language
  ): Promise<VoiceAssistantUiState> {
    let spaceId = 'sp_personal';
    let existingCommands: ReadonlyArray<VoiceCommand> = [];
    let language: Language = 'vi';

    if (typeof arg2 === 'string' && (arg2.startsWith('sp_') || arg2 === 'personal' || arg2 === 'business')) {
      spaceId = arg2;
      existingCommands = Array.isArray(arg3) ? (arg3 as ReadonlyArray<VoiceCommand>) : [];
      language = (arg4 as Language) || 'vi';
    } else if (typeof arg4 === 'string' && arg4.startsWith('sp_')) {
      spaceId = arg4;
      existingCommands = Array.isArray(arg5) ? (arg5 as ReadonlyArray<VoiceCommand>) : [];
      language = arg6 || 'vi';
    } else if (typeof arg2 === 'string') {
      if (typeof arg4 === 'string') spaceId = arg4;
      if (Array.isArray(arg5)) existingCommands = arg5;
      if (typeof arg6 === 'string') language = arg6 as Language;
    }

    try {
      const { command, result } = await this.getVoiceAssistantStateUseCase.executeConfirmedCommand(
        commandId,
        spaceId,
        language
      );
      const updatedCommands = Object.freeze([command, ...existingCommands]);
      const state = await this.getVoiceAssistantStateUseCase.execute(spaceId, updatedCommands, language);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString(),
        lastResult: result
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể thực thi lệnh giọng nói. Vui lòng thử lại.',
          'Unable to execute voice command. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Cancels a pending state-changing voice command.
   */
  async cancelAction(
    commandId: string,
    spaceId: string = 'sp_personal',
    existingCommands: ReadonlyArray<VoiceCommand> = [],
    language: Language = 'vi'
  ): Promise<VoiceAssistantUiState> {
    try {
      await this.getVoiceAssistantStateUseCase.cancelPendingCommand(commandId, spaceId, language);
      const state = await this.getVoiceAssistantStateUseCase.execute(spaceId, existingCommands, language);

      return Object.freeze({
        isLoading: false,
        state,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      return Object.freeze({
        isLoading: false,
        state: null,
        error: toSafeUserError(
          err,
          'Không thể hủy lệnh giọng nói. Vui lòng thử lại.',
          'Unable to cancel voice command. Please try again.',
          language
        ),
        lastUpdated: new Date().toISOString()
      });
    }
  }
}
