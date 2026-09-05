import React from 'react';
import { Sparkles, Brain, ArrowRight } from 'lucide-react';

interface AIInsightsPlaceholderWidgetProps {
  onExplore?: () => void;
}

export const AIInsightsPlaceholderWidget: React.FC<AIInsightsPlaceholderWidgetProps> = ({ onExplore }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 border border-indigo-900/60 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30 uppercase tracking-wider">
                Phase 3 Architecture Ready
              </span>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-white tracking-tight mt-0.5">
              ShepherdHub AI Church Intelligence Engine
            </h4>
            <p className="text-xs text-slate-300/80 max-w-xl">
              Automated member drop-off prediction, pastoral care alerts, and smart attendance forecasting will integrate seamlessly into this container.
            </p>
          </div>
        </div>

        {onExplore && (
          <button
            onClick={onExplore}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>Learn Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
