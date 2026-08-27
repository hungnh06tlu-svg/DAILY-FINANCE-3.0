/**
 * Daily Finance 3.0 - Platform Integration Contracts (Abstractions Only)
 * Standard: Modern Android Clean Architecture / Domain Layer
 * Pure platform-independent interfaces for future platform extension (Android Widgets, Wear OS, Google Assistant, etc.)
 * DO NOT IMPLEMENT REAL PLATFORM INTEGRATION HERE.
 */

import { WidgetState, WidgetItem } from './WidgetState';
import { VoiceCommand, VoiceCommandResult, VoiceAssistantState } from './VoiceAssistantState';

export interface WidgetRenderer {
  renderWidget(item: WidgetItem): Promise<boolean>;
  updateAllWidgets(state: WidgetState): Promise<boolean>;
}

export interface WidgetRefreshScheduler {
  scheduleRefresh(widgetId: string, policy: string): Promise<void>;
  cancelRefresh(widgetId: string): Promise<void>;
}

export interface VoiceInputProvider {
  startListening(): Promise<string>;
  stopListening(): Promise<void>;
  isListening(): boolean;
}

export interface SpeechRecognitionProvider {
  recognizeSpeech(): Promise<{ text: string; confidence: number }>;
}

export interface TextToSpeechProvider {
  speak(text: string, language?: string): Promise<void>;
  stop(): Promise<void>;
}

export interface VoiceCommandExecutor {
  executeCommand(command: VoiceCommand, contextState?: VoiceAssistantState): Promise<VoiceCommandResult>;
}

export interface VoicePlatformAdapter {
  initialize(): Promise<boolean>;
  getPlatformName(): string;
  isSupported(): boolean;
}
