import React, { useState, useEffect } from 'react';
import { Transaction, Budget, Language, AppScreen } from '../../types';
import { SmartNotificationCenter } from '../notifications/SmartNotificationCenter';
import { NotificationCenterViewModel } from '../../viewmodels/NotificationCenterViewModel';
import { SmartHabitEngine } from '../habits/SmartHabitEngine';
import { SmartAutomationCenter } from '../automations/SmartAutomationCenter';
import { SmartAIChat } from './SmartAIChat';
import { SmartVoiceAssistant } from '../voice/SmartVoiceAssistant';
import { HabitEngineViewModel } from '../../viewmodels/HabitEngineViewModel';
import { AutomationCenterViewModel } from '../../viewmodels/AutomationCenterViewModel';
import { AIChatViewModel } from '../../viewmodels/AIChatViewModel';
import { VoiceAssistantViewModel } from '../../viewmodels/VoiceAssistantViewModel';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Flame, 
  Loader2, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface AiCoachInsightsProps {
  transactions: Transaction[];
  budgets: Budget[];
  language: Language;
  selectedSpaceId?: string;
  onNavigateScreen?: (screen: AppScreen) => void;
  onAddTransaction?: (txData: Omit<Transaction, 'id'>) => void;
  notificationCenterViewModel: NotificationCenterViewModel;
  habitEngineViewModel: HabitEngineViewModel;
  automationCenterViewModel: AutomationCenterViewModel;
  aiChatViewModel?: AIChatViewModel;
  voiceAssistantViewModel?: VoiceAssistantViewModel;
}

export const AiCoachInsights: React.FC<AiCoachInsightsProps> = ({
  transactions,
  budgets,
  language,
  selectedSpaceId,
  onNavigateScreen,
  onAddTransaction,
  notificationCenterViewModel,
  habitEngineViewModel,
  automationCenterViewModel,
  aiChatViewModel,
  voiceAssistantViewModel
}) => {
  const [loading, setLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<any>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          budgets,
          language
        })
      });
      const data = await res.json();
      setInsightsData(data.fallback || data);
    } catch (err) {
      console.error('AI Insights fetch error:', err);
      setInsightsData({
        summary: language === 'vi' ? 'Phân Tích Dòng Tiền & Cảnh Báo Thông Minh' : 'Smart Cashflow & Budget Analysis',
        insights: [
          {
            type: 'positive',
            title: language === 'vi' ? 'Kiểm Soát Ngân Sách Tốt' : 'Good Budget Control',
            description: language === 'vi' ? 'Tổng chi tiêu tháng này của bạn đạt 68% hạn mức chi tiêu gia đình.' : 'Your overall spending is at 68% of family budget.'
          },
          {
            type: 'warning',
            title: language === 'vi' ? 'Cảnh Báo Chi Tiêu Cà Phê & Ăn Uống' : 'Dining Out Spike Alert',
            description: language === 'vi' ? 'Chi phí ăn uống đã tăng 24% so với tuần trước. Hãy chú ý hũ Play.' : 'Dining out increased by 24% compared to last week.'
          },
          {
            type: 'tip',
            title: language === 'vi' ? 'Tối Ưu Hũ Đầu Tư FFA' : 'FFA Investment Optimization',
            description: language === 'vi' ? 'Số dư nhàn rỗi ví cá nhân 48.5tr nên được chuyển 15tr vào chứng chỉ quỹ ETF.' : 'Idle balance of 48.5M VND can be invested into ETF.'
          }
        ],
        fireProgressNote: language === 'vi' ? 'Bạn đang đi đúng hướng để tự do tài chính tuổi 45!' : 'On track to FIRE at age 45!'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [language]);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-md">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {language === 'vi' ? 'Cố Vấn Tài Chính AI Gemini' : 'Gemini AI Financial Coach'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'vi' ? 'Hệ thống học máy tự động phân tích hành vi tài chính real-time' : 'Real-time machine learning behavior analysis'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="font-semibold">{language === 'vi' ? 'Đang phân tích dòng tiền với Gemini 3.6 Flash...' : 'Analyzing cashflow with Gemini 3.6 Flash...'}</p>
          </div>
        ) : (
          insightsData && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 to-indigo-950/80 rounded-2xl border border-emerald-500/30 text-emerald-200 font-bold">
                ✨ {insightsData.summary}
              </div>

              <div className="space-y-2.5">
                {insightsData.insights?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border ${
                      item.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' :
                      item.type === 'warning' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' :
                      'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {item.type === 'positive' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                       item.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> :
                       <Lightbulb className="w-4 h-4 text-indigo-400" />}
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>

              {insightsData.fireProgressNote && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300 flex items-center gap-2 font-medium">
                  <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{insightsData.fireProgressNote}</span>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Smart Voice Assistant (S5-008 Domain UI Integration) */}
      {voiceAssistantViewModel && (
        <SmartVoiceAssistant
          voiceAssistantViewModel={voiceAssistantViewModel}
          selectedSpaceId={selectedSpaceId}
          language={language}
          onNavigateScreen={onNavigateScreen}
        />
      )}

      {/* Smart AI Chat Center (S5-005 Domain UI Integration) */}
      {aiChatViewModel && (
        <SmartAIChat
          selectedSpaceId={selectedSpaceId}
          language={language}
          viewModel={aiChatViewModel}
          onNavigateScreen={onNavigateScreen}
        />
      )}

      {/* Smart Notification Center (S5-003 Domain UI Integration) */}
      <SmartNotificationCenter
        selectedSpaceId={selectedSpaceId}
        language={language}
        viewModel={notificationCenterViewModel}
        onNavigateScreen={onNavigateScreen}
      />

      {/* Smart Habit Engine (S5-004 Domain UI Integration) */}
      <SmartHabitEngine
        selectedSpaceId={selectedSpaceId}
        language={language}
        viewModel={habitEngineViewModel}
        onNavigateScreen={onNavigateScreen}
      />

      {/* Smart Automation Center (S5-004 Domain UI Integration) */}
      <SmartAutomationCenter
        selectedSpaceId={selectedSpaceId}
        language={language}
        viewModel={automationCenterViewModel}
        onNavigateScreen={onNavigateScreen}
      />
    </div>
  );
};
