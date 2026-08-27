import React from 'react';
import { DeviceViewport, Language } from '../types';
import { Wifi, Signal, Battery, Camera } from 'lucide-react';

interface DeviceFrameProps {
  viewport: DeviceViewport;
  language: Language;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  viewport,
  language,
  children
}) => {
  // Format current simulated time
  const timeString = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  if (viewport === 'tablet') {
    return (
      <div className="w-full max-w-6xl mx-auto my-6 p-4">
        <div className="bg-slate-900 rounded-[32px] p-3 shadow-2xl border-4 border-slate-700/80 relative">
          {/* Tablet Frame Top Bar */}
          <div className="bg-slate-950 text-slate-300 px-6 py-2 rounded-t-[24px] flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2 font-semibold">
              <span>{timeString}</span>
              <span className="text-[10px] text-slate-400 font-mono">Pixel Tablet OS 15</span>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <Signal className="w-3.5 h-3.5 text-slate-300" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono">92%</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
              </div>
            </div>
          </div>

          {/* Screen Content Canvas */}
          <div className="bg-slate-950 rounded-b-[24px] min-h-[640px] max-h-[800px] overflow-y-auto overflow-x-hidden text-slate-100 relative">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="bg-slate-950 py-2.5 rounded-b-[28px] flex justify-center items-center">
            <div className="w-36 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (viewport === 'foldable') {
    return (
      <div className="w-full max-w-4xl mx-auto my-6 p-4">
        <div className="bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-700 relative">
          {/* Center Hinge Line indicator */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-800/80 z-20 pointer-events-none hidden sm:block" />

          {/* Foldable Header */}
          <div className="bg-slate-950 text-slate-300 px-6 py-2 rounded-t-[28px] flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2 font-semibold">
              <span>{timeString}</span>
              <span className="text-[10px] text-slate-400 font-mono">Galaxy Z Fold 6 (Unfolded Dual-Pane)</span>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <Signal className="w-3.5 h-3.5 text-slate-300" />
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Foldable Main Content */}
          <div className="bg-slate-950 rounded-b-[28px] min-h-[620px] max-h-[760px] overflow-y-auto text-slate-100 relative">
            {children}
          </div>

          {/* Android Navigation Gesture Bar */}
          <div className="bg-slate-950 py-2.5 rounded-b-[30px] flex justify-center items-center">
            <div className="w-32 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Phone Viewport (Pixel 9 Pro Aspect Ratio)
  return (
    <div className="w-full max-w-[420px] mx-auto my-6 p-2 sm:p-4">
      <div className="bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800/90 relative">
        {/* Camera Punchhole */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-slate-800 z-30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
        </div>

        {/* Phone Top Status Bar */}
        <div className="bg-slate-950 text-slate-300 px-6 pt-3 pb-2 rounded-t-[40px] flex items-center justify-between text-xs select-none relative z-20">
          <span className="font-semibold text-slate-200">{timeString}</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
          </div>
        </div>

        {/* Mobile Screen Content */}
        <div className="bg-slate-950 rounded-b-[36px] min-h-[720px] max-h-[820px] overflow-y-auto text-slate-100 relative scrollbar-none">
          {children}
        </div>

        {/* Android Gesture Navigation Bar */}
        <div className="bg-slate-950 py-3 rounded-b-[42px] flex justify-center items-center">
          <div className="w-28 h-1 bg-slate-500/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
