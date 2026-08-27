/**
 * Daily Finance 3.0 - SmartAIChat Component
 * Standard: Modern Clean Architecture / Presentation Integration (S5-005)
 * Consumes strictly immutable AIChatUiState provided by AIChatViewModel.
 * Performs zero business calculations, zero direct repository or AI SDK queries.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Language, AppScreen } from '../../types';
import { AIChatViewModel } from '../../viewmodels/AIChatViewModel';
import {
  AIChatUiState,
  ChatCategory,
  ChatMessage,
  PendingCommand
} from '../../domain/AIChatState';
import {
  Bot,
  User,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Filter,
  ShieldAlert,
  Zap,
  TrendingUp,
  Target,
  PiggyBank,
  Briefcase,
  Layers,
  Flame,
  XCircle,
  Clock
} from 'lucide-react';

interface SmartAIChatProps {
  selectedSpaceId?: string;
  language: Language;
  viewModel: AIChatViewModel;
  onNavigateScreen?: (screen: AppScreen) => void;
}

export const SmartAIChat: React.FC<SmartAIChatProps> = React.memo(({
  selectedSpaceId = 'sp_personal',
  language,
  viewModel,
  onNavigateScreen
}) => {
  const isVi = language === 'vi';
  const [uiState, setUiState] = useState<AIChatUiState>({
    isLoading: true,
    state: null,
    error: null,
    lastUpdated: null,
    filterCategory: 'all'
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ChatCategory | 'all'>('all');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load UI State via ViewModel pipeline
  const loadUiState = useCallback(async (cat: ChatCategory | 'all' = activeCategory) => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    const result = await viewModel.getAIChatUiState(selectedSpaceId, language, cat);
    setUiState(result);
  }, [selectedSpaceId, language, viewModel, activeCategory]);

  useEffect(() => {
    loadUiState(activeCategory);
  }, [selectedSpaceId, language, activeCategory, loadUiState]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiState.state?.messages]);

  // Send Message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputMessage;
    if (!text || !text.trim() || isSending) return;

    setInputMessage('');
    setIsSending(true);

    const updatedState = await viewModel.sendMessage(
      text,
      selectedSpaceId,
      language,
      activeCategory
    );

    setUiState(updatedState);
    setIsSending(false);
  };

  // Keyboard Enter handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Confirm state-changing command
  const handleConfirmCommand = async (command: PendingCommand) => {
    setIsSending(true);
    const updatedState = await viewModel.confirmAction(
      command.id,
      selectedSpaceId,
      language,
      activeCategory
    );
    setUiState(updatedState);
    setIsSending(false);
  };

  // Category filter items
  const categories: { id: ChatCategory | 'all'; labelVi: string; labelEn: string; icon: any }[] = [
    { id: 'all', labelVi: 'Tất cả', labelEn: 'All', icon: Layers },
    { id: 'general', labelVi: 'Tổng quan', labelEn: 'General', icon: Sparkles },
    { id: 'budget', labelVi: 'Ngân sách', labelEn: 'Budget', icon: Target },
    { id: 'savings', labelVi: 'Tiết kiệm', labelEn: 'Savings', icon: PiggyBank },
    { id: 'investment', labelVi: 'Đầu tư', labelEn: 'Investment', icon: TrendingUp },
    { id: 'debt', labelVi: 'Nợ & Vay', labelEn: 'Debt', icon: Briefcase },
    { id: 'fire', labelVi: 'Độc lập TC (FIRE)', labelEn: 'FIRE Progress', icon: Flame },
    { id: 'coaching', labelVi: 'Cố vấn AI', labelEn: 'AI Coaching', icon: Bot },
    { id: 'automation', labelVi: 'Tự động hóa', labelEn: 'Automation', icon: Zap }
  ];

  const messages = uiState.state?.messages || [];
  const suggestedQuestions = uiState.state?.suggestedQuestions || [];
  const statistics = uiState.state?.statistics;

  return (
    <div id="smart-ai-chat-container" className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isVi ? 'Trợ Lý Trò Chuyện Tài Chính AI' : 'AI Financial Chat Assistant'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                S5-005 Integrated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isVi 
                ? `Không gian: ${selectedSpaceId} • Môi trường Clean Architecture` 
                : `Space: ${selectedSpaceId} • Clean Architecture Pipeline`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statistics && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 mr-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>{isVi ? 'Tổng tin:' : 'Messages:'} <strong className="text-white">{statistics.totalMessages}</strong></span>
              <span>•</span>
              <span>{isVi ? 'Người dùng:' : 'User:'} <strong className="text-indigo-400">{statistics.userMessagesCount}</strong></span>
            </div>
          )}

          <button
            onClick={() => loadUiState(activeCategory)}
            disabled={uiState.isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            title={isVi ? 'Tải lại trò chuyện' : 'Reload chat'}
          >
            <RefreshCw className={`w-4 h-4 ${uiState.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filters Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                loadUiState(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isVi ? cat.labelVi : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Safe Error Alert if present */}
      {uiState.error && (
        <div id="ai-chat-error-alert" className="mx-4 mt-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isVi ? 'Thông báo lỗi hệ thống' : 'System Error Notice'}</p>
              <p className="mt-0.5 text-rose-300/90">{uiState.error}</p>
            </div>
          </div>
          <button
            onClick={() => loadUiState(activeCategory)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors shrink-0"
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[360px] max-h-[520px]">
        {uiState.isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 text-xs space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <p>{isVi ? 'Đang kết nối hội thoại tài chính AI...' : 'Loading AI financial conversation...'}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 space-y-3">
            <div className="p-4 rounded-full bg-slate-800/80 text-slate-500">
              <Bot className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {isVi ? 'Chưa có tin nhắn nào trong danh mục này' : 'No messages in this category yet'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              {isVi 
                ? 'Hãy chọn một câu hỏi gợi ý bên dưới hoặc nhập thắc mắc tài chính để bắt đầu hội thoại với AI Coach.' 
                : 'Select a suggested question below or type your financial query to start chatting.'}
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-xs space-y-2 shadow-md ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-medium pb-1 border-b border-white/10">
                    <span className="capitalize flex items-center gap-1">
                      {isUser ? (
                        <>
                          <User className="w-3 h-3" />
                          {isVi ? 'Bạn' : 'You'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          Daily Finance AI Coach
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>

                  {/* Evidence & References Badges for Assistant */}
                  {!isUser && msg.evidence && msg.evidence.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5 text-[10px]">
                      {msg.evidence.map((ev, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-700/50 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Explicit Confirmation Banner for State-Changing Pending Commands */}
                  {!isUser && msg.requiresConfirmation && msg.pendingCommand && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-amber-200">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>{isVi ? 'Xác nhận hành động thay đổi dữ liệu' : 'Confirm Data Modification'}</span>
                      </div>
                      <p className="text-[11px] text-amber-300/90">{msg.pendingCommand.details}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmCommand(msg.pendingCommand!)}
                          disabled={isSending}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isVi ? 'Xác nhận thực hiện' : 'Confirm Action'}
                        </button>
                        <button
                          onClick={() => loadUiState(activeCategory)}
                          disabled={isSending}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs transition-colors"
                        >
                          {isVi ? 'Hủy bỏ' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggestions Chips */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && !msg.requiresConfirmation && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(sug)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Questions Bar */}
      {suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
              {isVi ? 'Gợi ý câu hỏi:' : 'Suggestions:'}
            </span>
            {suggestedQuestions.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-950/80 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 border border-slate-700/60 text-[11px] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Form */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder={
              isVi 
                ? 'Nhập câu hỏi tài chính hoặc yêu cầu phân tích...' 
                : 'Type a financial question or analysis request...'
            }
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all"
          >
            {isSending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isVi ? 'Gửi' : 'Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

SmartAIChat.displayName = 'SmartAIChat';
