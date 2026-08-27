import React, { useState, useEffect } from 'react';
import { Language, AppScreen, NavigationTarget } from '../../types';
import { VoiceAssistantViewModel } from '../../viewmodels/VoiceAssistantViewModel';
import { VoiceAssistantUiState, VoiceCommand } from '../../domain/VoiceAssistantState';
import { resolveWidgetRoute } from '../widgets/SmartWidgets';
import {
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  Loader2,
  HelpCircle,
  Compass,
  ShieldCheck,
  CornerDownRight,
  Volume2,
  Bot
} from 'lucide-react';

export interface SmartVoiceAssistantProps {
  voiceAssistantViewModel: VoiceAssistantViewModel;
  selectedSpaceId?: string;
  language?: Language;
  onNavigateScreen?: (target: AppScreen | NavigationTarget | string) => void;
}

export const SmartVoiceAssistant: React.FC<SmartVoiceAssistantProps> = ({
  voiceAssistantViewModel,
  selectedSpaceId = 'sp_personal',
  language = 'vi',
  onNavigateScreen
}) => {
  const isVi = language === 'vi';
  const [uiState, setUiState] = useState<VoiceAssistantUiState>({
    isLoading: true,
    state: null,
    error: null,
    lastUpdated: null
  });

  const [inputSpeech, setInputSpeech] = useState('');
  const [voiceMode, setVoiceMode] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [recentCommands, setRecentCommands] = useState<ReadonlyArray<VoiceCommand>>([]);
  
  // Pending state-changing command confirmation state
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    commandId: string;
    intent: string;
    message: string;
    rawText: string;
    navigationRoute?: string;
  } | null>(null);

  const [confirmationFeedback, setConfirmationFeedback] = useState<string | null>(null);

  // Load initial Voice Assistant state from ViewModel
  const loadVoiceAssistantState = async () => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    const result = await voiceAssistantViewModel.getVoiceAssistantUiState(
      selectedSpaceId,
      recentCommands,
      language
    );
    setUiState(result);
  };

  useEffect(() => {
    loadVoiceAssistantState();
  }, [selectedSpaceId, language]);

  // Handle command submission through ViewModel
  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setVoiceMode('processing');
    setConfirmationFeedback(null);
    setPendingConfirmation(null);

    try {
      const updatedUiState = await voiceAssistantViewModel.processVoiceCommand(
        commandText,
        selectedSpaceId,
        recentCommands,
        language
      );

      setUiState(updatedUiState);

      if (updatedUiState.state?.recentCommands) {
        setRecentCommands(updatedUiState.state.recentCommands);
      }

      if (updatedUiState.lastResult) {
        const res = updatedUiState.lastResult;
        if (res.requiresConfirmation) {
          setPendingConfirmation({
            commandId: res.commandId,
            intent: res.intent,
            message: res.confirmationMessage || res.message,
            rawText: commandText,
            navigationRoute: res.navigationRoute
          });
        }
      }
    } catch {
      // Safe error is already captured inside ViewModel
    } finally {
      setVoiceMode('idle');
      setInputSpeech('');
    }
  };

  // Confirm state-changing voice action
  const handleConfirmCommand = async () => {
    if (!pendingConfirmation) return;

    setVoiceMode('processing');
    try {
      const updatedUiState = await voiceAssistantViewModel.confirmAction(
        pendingConfirmation.commandId,
        selectedSpaceId,
        recentCommands,
        language
      );

      setUiState(updatedUiState);

      if (updatedUiState.state?.recentCommands) {
        setRecentCommands(updatedUiState.state.recentCommands);
      }

      // Route navigation if applicable
      if (pendingConfirmation.navigationRoute && onNavigateScreen) {
        onNavigateScreen(pendingConfirmation.navigationRoute);
      }

      const successMsg = isVi
        ? '✓ Đã xác nhận và thực thi lệnh giọng nói thành công!'
        : '✓ Voice command confirmed and executed successfully!';

      setConfirmationFeedback(successMsg);
      setPendingConfirmation(null);
    } catch {
      // Safe error is already captured inside ViewModel
    } finally {
      setVoiceMode('idle');
    }
  };

  // Cancel pending state-changing voice action
  const handleCancelCommand = async () => {
    if (!pendingConfirmation) return;

    try {
      const updatedUiState = await voiceAssistantViewModel.cancelAction(
        pendingConfirmation.commandId,
        selectedSpaceId,
        recentCommands,
        language
      );
      setUiState(updatedUiState);
    } catch {
      // Safe error is already captured inside ViewModel
    } finally {
      const cancelMsg = isVi
        ? '✕ Đã hủy lệnh giọng nói. Không có thay đổi nào được thực hiện.'
        : '✕ Voice command cancelled. No financial changes were made.';

      setConfirmationFeedback(cancelMsg);
      setPendingConfirmation(null);
    }
  };

  // Simulate speaking microphone toggle
  const handleToggleListening = () => {
    if (voiceMode === 'idle') {
      setVoiceMode('listening');
      // Simulate speech recognition result after 2.5s
      setTimeout(() => {
        const samplePhrases = [
          isVi ? 'Ví của tôi còn bao nhiêu tiền?' : 'How much money is in my wallet?',
          isVi ? 'Tiến độ FIRE của tôi thế nào?' : 'What is my FIRE progress?',
          isVi ? 'Thêm khoản chi 150 nghìn ăn uống' : 'Add expense 150k food'
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setInputSpeech(randomPhrase);
        setVoiceMode('idle');
      }, 2000);
    } else {
      setVoiceMode('idle');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5 text-slate-100">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/20">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                {isVi ? 'Trợ Lý Giọng Nói AI (Voice Assistant)' : 'AI Voice Assistant'}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {selectedSpaceId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isVi
                ? 'Điều khiển tài chính cá nhân bằng lệnh thoại tự nhiên & an toàn'
                : 'Control personal finance with natural voice commands & multi-layer safety'}
            </p>
          </div>
        </div>

        <button
          onClick={loadVoiceAssistantState}
          disabled={uiState.isLoading}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          title={isVi ? 'Tải lại dữ liệu' : 'Reload state'}
        >
          <RefreshCw className={`w-4 h-4 ${uiState.isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Safe Error Box */}
      {uiState.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="font-medium">{uiState.error}</p>
          </div>
          <button
            onClick={loadVoiceAssistantState}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shrink-0"
          >
            {isVi ? 'Thử Lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Interactive Microphone Stage */}
      <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          {voiceMode === 'listening' && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping" />
          )}
          <button
            onClick={handleToggleListening}
            disabled={voiceMode === 'processing' || uiState.isLoading}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
              voiceMode === 'listening'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 scale-105 shadow-emerald-500/40'
                : voiceMode === 'processing'
                ? 'bg-indigo-600 text-white animate-spin'
                : 'bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-slate-700 hover:border-emerald-500'
            }`}
          >
            {voiceMode === 'processing' ? (
              <Loader2 className="w-8 h-8" />
            ) : voiceMode === 'listening' ? (
              <Mic className="w-8 h-8 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-200">
            {voiceMode === 'listening'
              ? isVi
                ? '🎙️ Đang lắng nghe... Hãy nói câu lệnh của bạn'
                : '🎙️ Listening... Speak your financial command'
              : voiceMode === 'processing'
              ? isVi
                ? '⚡ Đang xử lý câu lệnh giọng nói...'
                : '⚡ Processing voice command...'
              : isVi
              ? 'Nhấn nút micrô để thu âm hoặc chọn câu lệnh mẫu bên dưới'
              : 'Tap mic button to speak or pick a suggested query below'}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isVi
              ? 'Xác nhận 2 lớp cho lệnh sửa đổi số dư & giao dịch'
              : 'Two-step confirmation required for balance-modifying actions'}
          </span>
        </div>

        {/* Command Input Bar */}
        <div className="w-full max-w-lg flex items-center gap-2 mt-2">
          <input
            type="text"
            value={inputSpeech}
            onChange={e => setInputSpeech(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleProcessCommand(inputSpeech)}
            placeholder={
              isVi
                ? 'Nhập hoặc nói: "Ví của tôi còn bao nhiêu tiền?"'
                : 'Type or speak: "How much money is in my wallet?"'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleProcessCommand(inputSpeech)}
            disabled={!inputSpeech.trim() || voiceMode === 'processing'}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isVi ? 'Gửi' : 'Send'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Voice Phrases */}
      {uiState.state?.suggestions && uiState.state.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{isVi ? 'Gợi Ý Câu Lệnh Mẫu' : 'Suggested Voice Queries'}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {uiState.state.suggestions.map(sug => (
              <button
                key={sug.id}
                onClick={() => handleProcessCommand(sug.phrase)}
                disabled={voiceMode === 'processing'}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-200 text-left transition-all flex items-center gap-2 group"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                <span>"{sug.phrase}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Feedback Banner */}
      {confirmationFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between gap-2 ${
            confirmationFeedback.startsWith('✓')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          <span>{confirmationFeedback}</span>
          <button
            onClick={() => setConfirmationFeedback(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* State-Modifying Command Confirmation Box */}
      {pendingConfirmation && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{isVi ? '🚨 Yêu Cầu Xác Nhận Lệnh Giọng Nói' : '🚨 Voice Command Confirmation Required'}</span>
          </div>

          <p className="text-amber-100 font-medium">{pendingConfirmation.message}</p>

          <div className="p-3 bg-slate-950/60 rounded-xl text-slate-300 space-y-1 text-[11px]">
            <div>
              <span className="text-slate-400">{isVi ? 'Lệnh thoại: ' : 'Raw text: '}</span>
              <span className="font-semibold text-white">"{pendingConfirmation.rawText}"</span>
            </div>
            <div>
              <span className="text-slate-400">{isVi ? 'Hành động: ' : 'Intent: '}</span>
              <span className="font-semibold text-emerald-400">{pendingConfirmation.intent}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleConfirmCommand}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVi ? 'Xác Nhận Thực Hiện' : 'Confirm & Execute'}</span>
            </button>
            <button
              onClick={handleCancelCommand}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{isVi ? 'Hủy Lệnh' : 'Cancel Command'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Last Result & Assistant Response */}
      {uiState.lastResult && !pendingConfirmation && (
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>{isVi ? 'Phản Hồi Trợ Lý Voice' : 'Voice Assistant Response'}</span>
            </div>
            <span className="text-[10px] text-slate-500">{uiState.lastUpdated?.substring(11, 19)}</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {uiState.lastResult.message}
          </p>

          {uiState.lastResult.navigationRoute && onNavigateScreen && (
            <button
              onClick={() => {
                if (uiState.lastResult?.navigationRoute && onNavigateScreen) {
                  onNavigateScreen(uiState.lastResult.navigationRoute);
                }
              }}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isVi ? 'Chuyển Đến Trang Tương Ứng' : 'Navigate to Target View'}</span>
            </button>
          )}
        </div>
      )}

      {/* Voice Assistant Statistics & Capabilities */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <span className="text-slate-400 block">{isVi ? 'Tổng lệnh' : 'Total Commands'}</span>
          <span className="text-sm font-bold text-slate-100">
            {uiState.state?.statistics?.totalCommandsProcessed || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <span className="text-slate-400 block">{isVi ? 'Đã nhận dạng' : 'Recognized'}</span>
          <span className="text-sm font-bold text-emerald-400">
            {uiState.state?.statistics?.recognizedCommandsCount || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <span className="text-slate-400 block">{isVi ? 'Chưa nhận dạng' : 'Unrecognized'}</span>
          <span className="text-sm font-bold text-amber-400">
            {uiState.state?.statistics?.unknownCommandsCount || 0}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <span className="text-slate-400 block">{isVi ? 'Google & Gemini' : 'Google & Gemini'}</span>
          <span className="text-sm font-bold text-indigo-400">
            {uiState.state?.futureSupportFlags?.supportsGemini ? 'Sẵn sàng' : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
