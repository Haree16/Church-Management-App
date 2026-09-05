import React, { useMemo } from 'react';
import { ChurchEvent } from '@/types';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

interface UpcomingEventsWidgetProps {
  events: ChurchEvent[];
  onNavigateTab: (tab: string, deepLinkId?: string) => void;
  isLoading?: boolean;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  events,
  onNavigateTab,
  isLoading,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter next 5 upcoming events sorted by date
  const upcomingList = useMemo(() => {
    return events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events, todayStr]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-3">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>Upcoming Church Events</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Next scheduled services, seminars & outreach.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('calendar')}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          View All Events &rarr;
        </button>
      </div>

      {/* Events List */}
      {upcomingList.length > 0 ? (
        <div className="space-y-2.5">
          {upcomingList.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onNavigateTab('calendar', evt.id)}
              className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition cursor-pointer space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {evt.category || 'Church Service'}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                  {evt.date}
                </span>
              </div>

              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                {evt.title}
              </h4>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {evt.time}
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {evt.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No upcoming events</h4>
          <p className="text-xs text-slate-400">
            Check back later or schedule new services in the Events Calendar.
          </p>
        </div>
      )}
    </div>
  );
};
