import React from 'react';
import { ActiveTab, Language } from '../../types';
import { 
  FileText, 
  Compass, 
  Palette, 
  Layers, 
  Grid, 
  BookOpen, 
  Layout, 
  Code,
  CheckCircle,
  Smartphone,
  Shield,
  Zap,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

interface DesignBlueprintWorkspaceProps {
  activeTab: ActiveTab;
  language: Language;
}

export const DesignBlueprintWorkspace: React.FC<DesignBlueprintWorkspaceProps> = ({
  activeTab,
  language
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 text-slate-100">
      {/* 1. PRD TAB */}
      {activeTab === 'blueprint-prd' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Deliverable #1
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              <span>Product Requirement Document (PRD) - Daily Finance 2.0</span>
            </h1>
          </div>

          {/* Core Objectives */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">1. Executive Overview & Target Product Goals</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Daily Finance 2.0</strong> is a premier, offline-first personal and family financial management application designed specifically for Android (API 26+). The product fuses the seamless card physics of Apple Wallet, the Material You clean transactions of Google Wallet, and the fluid motion and tonal expressiveness of Material 3 Expressive.
            </p>
          </div>

          {/* Target Personas */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">2. Target User Personas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <span className="font-bold text-emerald-400 block">Single Professionals</span>
                <p className="text-slate-300 text-[11px]">Track personal cashflow, credit card billing cycles, FIRE retirement targets, and 6 Jars wealth distribution.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <span className="font-bold text-indigo-400 block">Families & Couples</span>
                <p className="text-slate-300 text-[11px]">Manage shared Family Funds, budget envelopes, home maintenance savings, and debt payoff strategies.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <span className="font-bold text-amber-400 block">Group & Fund Managers</span>
                <p className="text-slate-300 text-[11px]">Control Class Funds, Startup Company petty cash, trip pools, and multi-space fund transfers with transparency.</p>
              </div>
            </div>
          </div>

          {/* 10 Architectural Principles */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">3. The 10 Core Product & Architectural Principles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                "1. Clean Architecture (Data, Domain, UI layer separation)",
                "2. Modular Design (Dynamic Feature Toggles for every module)",
                "3. MVVM + Hilt + Room + Navigation Compose stack",
                "4. Material 3 Expressive UI & Custom Physics",
                "5. Adaptive layouts (Phone, Foldables, Tablets)",
                "6. Accessibility First (WCAG AA, High contrast, TalkBack)",
                "7. Offline-First Architecture (Room DB + Google Drive Sync)",
                "8. Google Play Production Quality & Vitals compliance",
                "9. Sub-100ms High Performance Render Loops",
                "10. 100% Optional Modular Features"
              ].map((p, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. INFORMATION ARCHITECTURE TAB */}
      {activeTab === 'blueprint-ia' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
              Deliverable #2
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-400" />
              <span>Information Architecture (IA) & Database Schema</span>
            </h1>
          </div>

          {/* Navigation Structure */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">1. App Navigation Graph</h2>
            <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800 overflow-x-auto">
              <pre>{`RootNavHost
├── DashboardNavGraph (Main Wallet & Multi-Space Carousel)
│   ├── SpaceDetailsScreen(spaceId)
│   └── SpaceTransferBottomSheet(sourceId, targetId)
├── TransactionNavGraph
│   ├── TransactionListScreen
│   ├── QuickAddTransactionSheet
│   ├── VoiceInputModal (Gemini AI)
│   └── OCRReceiptScannerScreen (Camera Vision)
├── WealthAndDebtNavGraph
│   ├── SavingsGoalsScreen
│   ├── CreditCardsAndInstallmentsScreen
│   └── DebtPayoffOptimizerScreen (Snowball / Avalanche)
├── BudgetMethodsNavGraph
│   ├── SixJarsScreen
│   ├── EnvelopeBudgetingScreen
│   ├── KakeiboReflectionJournalScreen
│   └── FireIndependenceCalculatorScreen
├── AiInsightsNavGraph
│   └── AiCoachDashboardScreen (Gemini 3.6 Flash)
└── SettingsNavGraph
    ├── FeatureModuleTogglesScreen
    └── GoogleDriveBackupSyncScreen`}</pre>
            </div>
          </div>

          {/* Room DB Entity Schemas */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">2. Room Database Entities (Kotlin Spec)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono text-slate-300">
                <span className="text-emerald-400 font-bold block mb-1">@Entity(tableName = "financial_spaces")</span>
                <p>data class SpaceEntity(</p>
                <p className="pl-4">@PrimaryKey val id: String,</p>
                <p className="pl-4">val name: String,</p>
                <p className="pl-4">val type: SpaceType,</p>
                <p className="pl-4">val balance: Double,</p>
                <p className="pl-4">val currency: String,</p>
                <p className="pl-4">val cardColorGradient: String</p>
                <p>)</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono text-slate-300">
                <span className="text-indigo-400 font-bold block mb-1">@Entity(tableName = "transactions")</span>
                <p>data class TransactionEntity(</p>
                <p className="pl-4">@PrimaryKey val id: String,</p>
                <p className="pl-4">val type: TransactionType,</p>
                <p className="pl-4">val amount: Double,</p>
                <p className="pl-4">val category: String,</p>
                <p className="pl-4">val spaceId: String,</p>
                <p className="pl-4">val dateEpochMs: Long</p>
                <p>)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DESIGN SYSTEM TAB */}
      {activeTab === 'blueprint-ds' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Deliverable #3
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-amber-400" />
              <span>Design System Specification (Apple x Google x M3 Expressive)</span>
            </h1>
          </div>

          {/* Color Tokens */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">1. Dynamic Tonal Color Palettes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white font-bold">
                Primary Emerald #10B981
              </div>
              <div className="p-3 rounded-2xl bg-indigo-600 text-white font-bold">
                Secondary Indigo #6366F1
              </div>
              <div className="p-3 rounded-2xl bg-amber-600 text-white font-bold">
                Tertiary Amber #F59E0B
              </div>
              <div className="p-3 rounded-2xl bg-rose-600 text-white font-bold">
                Error / Expense Rose #F43F5E
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-200">2. Typography Scale (Google Sans Flex / Plus Jakarta Sans)</h2>
            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xl font-black text-white">
                <span>Display Large</span>
                <span className="font-mono text-xs text-slate-500">32sp / Regular / Tracking 0.0</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-200">
                <span>Headline Medium</span>
                <span className="font-mono text-xs text-slate-500">24sp / Bold / Tracking +0.1</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-slate-300">
                <span>Body Medium</span>
                <span className="font-mono text-xs text-slate-500">14sp / Medium / Tracking +0.25</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. USER FLOWS TAB */}
      {activeTab === 'blueprint-flows' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">
              Deliverable #4
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-purple-400" />
              <span>Key User Flow Diagrams</span>
            </h1>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-emerald-400 text-sm">Flow 1: Space-to-Space Transfer (Ví cá nhân ➔ Ví Gia đình)</h3>
              <p className="text-slate-300">
                Tap Active Wallet Card ➔ Select "Space Transfer" ➔ Choose Destination Space ➔ Input Amount & Note ➔ Validate Room DB Transaction ➔ Trigger Smooth Haptic & Card Elevation Transition.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-amber-400 text-sm">Flow 2: OCR Camera Receipt Scan</h3>
              <p className="text-slate-300">
                Tap OCR Camera Floating Action ➔ Capture Photo ➔ Post Base64 to Gemini 3.6 Flash Server ➔ Extract Merchant & Total ➔ Auto-select Category ➔ Confirm & Save to Room DB.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. SCREEN LIST TAB */}
      {activeTab === 'blueprint-screens' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">
              Deliverable #5
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Grid className="w-6 h-6 text-teal-400" />
              <span>Complete Screen Inventory</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              "1. Wallet Overview & Space Stack Screen",
              "2. Space Details & Member Management Screen",
              "3. Space Transfer Bottom Sheet Screen",
              "4. Transaction Feed & History Screen",
              "5. Quick Add Transaction Sheet Screen",
              "6. Voice Command AI Modal Screen",
              "7. OCR Receipt Scanner Camera View Screen",
              "8. Goal Savings & Emergency Fund Screen",
              "9. Credit Card & Installment Manager Screen",
              "10. Debt Payoff Optimizer Screen (Snowball/Avalanche)",
              "11. Six Jars Method Allocation Screen",
              "12. Envelope Budgeting Fill Level Screen",
              "13. Kakeibo Mindful Journaling Screen",
              "14. FIRE Retirement Independence Calculator Screen",
              "15. Gemini AI Coach Dashboard Screen",
              "16. Financial Analytics & Cashflow Reports Screen",
              "17. Feature Module Control Panel Screen",
              "18. Google Drive Backup & Sync Status Screen"
            ].map((scr, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{scr}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. COMPONENT LIBRARY TAB */}
      {activeTab === 'blueprint-components' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
              Deliverable #6
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <span>Jetpack Compose Custom Component Library Specification</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-emerald-400">@Composable WalletCard()</h3>
              <p className="text-slate-300">Custom gradient pass container with spring physics, layered card depth, and active haptic press animation.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-indigo-400">@Composable SixJarProgressCard()</h3>
              <p className="text-slate-300">M3 Expressive tonal container showing percentage allocation, current balance, and color-coded progress indicator.</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. WIREFRAMES TAB */}
      {activeTab === 'blueprint-wireframes' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
              Deliverable #7
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Layout className="w-6 h-6 text-rose-400" />
              <span>ASCII Layout Schematics & Wireframes</span>
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-rose-300 border border-slate-800 overflow-x-auto">
            <pre>{`=================================================================
             PHONE VIEWPORT WIREFRAME (PIXEL 9 PRO)
=================================================================
+---------------------------------------------------------------+
| 09:41                             5G  [Wifi]  [Battery 92%]   |
+---------------------------------------------------------------+
| [DF 2.0]  Ví Cá Nhân                      [Profile / Settings]|
| ------------------------------------------------------------- |
| TỔNG TÀI SẢN TẤT CẢ QUỸ                                      |
| 531,700,000 VND                           [Eye Toggle]        |
| +8.4% so với tháng trước                 4 Không Gian         |
+---------------------------------------------------------------+
| KHÔNG GIAN TÀI CHÍNH (WALLET STACK CARDS)                     |
| +-----------------------------------------------------------+ |
| | [User] Ví Cá Nhân (Nguyễn Văn Hùng)     [Active Badge]    | |
| | 48,500,000 VND                          1 Thành Viên      | |
| +-----------------------------------------------------------+ |
| | [Home] Quỹ Gia Đình (Hùng & Trang)                        | |
| | 125,000,000 VND                         4 Thành Viên      | |
| +-----------------------------------------------------------+ |
+---------------------------------------------------------------+
| [Thêm Giao Dịch]      [Giọng Nói AI]      [Quét Hóa Đơn OCR]  |
+---------------------------------------------------------------+
| [Ví & Quỹ]  [Giao Dịch]  [Tài Sản & Nợ]  [Hũ & FIRE]  [AI Coach]|
+---------------------------------------------------------------+`}</pre>
          </div>
        </div>
      )}

      {/* 8. KOTLIN ARCHITECTURE CODE TAB */}
      {activeTab === 'blueprint-architecture' && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Deliverable #8
            </span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-emerald-400" />
              <span>Jetpack Compose + MVVM + Hilt Architecture Code Reference</span>
            </h1>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
              <span className="text-slate-400 block mb-2">// MainViewModel.kt - Hilt Injectable State Manager</span>
              <pre>{`@HiltViewModel
class MainViewModel @Inject constructor(
    private val spaceRepository: SpaceRepository,
    private val transactionRepository: TransactionRepository,
    private val geminiAiClient: GeminiAiClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    fun transferBetweenSpaces(sourceId: String, targetId: String, amount: Double, note: String) {
        viewModelScope.launch {
            spaceRepository.executeSpaceTransfer(sourceId, targetId, amount, note)
        }
    }
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
