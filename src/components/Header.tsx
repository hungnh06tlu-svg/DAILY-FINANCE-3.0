import React from 'react';
import { Language, DeviceViewport, ThemeStyle, ActiveTab } from '../types';
import { UI_STRINGS } from '../data/initialData';
import { 
  Smartphone, 
  Tablet, 
  Globe, 
  Palette, 
  Sliders, 
  FileText, 
  Layout, 
  Code, 
  Compass, 
  Layers, 
  Grid, 
  BookOpen,
  Sparkles,
  Smartphone as PhoneIcon
} from 'lucide-react';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  viewport: DeviceViewport;
  setViewport: (vp: DeviceViewport) => void;
  themeStyle: ThemeStyle;
  setThemeStyle: (ts: ThemeStyle) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenFeatureCustomizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  viewport,
  setViewport,
  themeStyle,
  setThemeStyle,
  activeTab,
  setActiveTab,
  onOpenFeatureCustomizer
}) => {
  const strings = UI_STRINGS[language];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-lg">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20 text-lg">
            DF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {strings.appName}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v2.0 Android
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {strings.tagline}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setLanguage('vi')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                language === 'vi' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Tiếng Việt
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                language === 'en' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Theme Philosophy */}
          <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setThemeStyle('m3-expressive')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                themeStyle === 'm3-expressive' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              M3 Expressive
            </button>
            <button
              onClick={() => setThemeStyle('apple-wallet')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                themeStyle === 'apple-wallet' 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Apple Wallet
            </button>
            <button
              onClick={() => setThemeStyle('google-wallet')}
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                themeStyle === 'google-wallet' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Google Wallet
            </button>
          </div>

          {/* Viewport Frame Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setViewport('phone')}
              title={strings.phoneView}
              className={`p-1.5 rounded-md transition-all ${
                viewport === 'phone' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('foldable')}
              title={strings.foldableView}
              className={`p-1.5 rounded-md transition-all ${
                viewport === 'foldable' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PhoneIcon className="w-4 h-4 rotate-90" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              title={strings.tabletView}
              className={`p-1.5 rounded-md transition-all ${
                viewport === 'tablet' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
          </div>

          {/* Modular Feature Toggles Modal Launcher */}
          <button
            onClick={onOpenFeatureCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 font-medium transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{strings.featureCustomizer}</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 text-xs font-medium min-w-max">
          {/* Main App Prototype View */}
          <button
            onClick={() => setActiveTab('prototype')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'prototype'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{strings.prototypeTab}</span>
          </button>

          {/* Sprint 2 Domain Engine Inspector Tab */}
          <button
            onClick={() => setActiveTab('sprint2-domain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sprint2-domain'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-semibold'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/30'
            }`}
          >
            <Code className="w-4 h-4 text-purple-300" />
            <span>Sprint 2: Domain Engine</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-2" />

          {/* Design & Architectural Specification Tabs */}
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mr-1">
            Design & Tech Blueprint:
          </span>

          <button
            onClick={() => setActiveTab('blueprint-prd')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-prd'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. PRD</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-ia')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-ia'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. IA</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-ds')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-ds'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>3. Design System</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-flows')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-flows'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. User Flows</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-screens')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-screens'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>5. Screen List</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-components')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-components'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>6. Components</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-wireframes')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-wireframes'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>7. Wireframes</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint-architecture')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'blueprint-architecture'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>8. Kotlin Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
