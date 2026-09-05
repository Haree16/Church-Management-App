import React from 'react';
import { Users, UserPlus, UserCheck, Calendar, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

export interface KPICardData {
  totalMembers: number;
  membersPrevMonth: number;
  activeMembers: number;
  newMembersThisMonth: number;
  newMembersPrevMonth: number;
  totalVisitors: number;
  visitorsThisMonth: number;
  visitorsPrevMonth: number;
  latestAttendance: number;
  avgAttendanceMonth: number;
  attendanceRate: number;
  upcomingEventsCount: number;
}

interface ChurchOverviewKPICardsProps {
  data: KPICardData | null;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onNavigateTab: (tab: string, deepLinkId?: string) => void;
}

export const ChurchOverviewKPICards: React.FC<ChurchOverviewKPICardsProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  onNavigateTab,
}) => {
  // Skeleton Loader State
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded pt-1" />
          </div>
        ))}
      </div>
    );
  }

  // Error State with Retry Button
  if (isError || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="font-bold text-sm text-rose-900">Unable to load KPI Overview metrics</h4>
        <p className="text-xs text-rose-700">Check your network connection or try refreshing the dashboard stats.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        )}
      </div>
    );
  }

  // Member Trend calculation
  const memberDiff = data.newMembersThisMonth - data.newMembersPrevMonth;
  const memberTrendUp = memberDiff >= 0;

  // Visitor Trend calculation
  const visitorDiff = data.visitorsThisMonth - data.visitorsPrevMonth;
  const visitorTrendUp = visitorDiff >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Members Card */}
      <div
        onClick={() => onNavigateTab('reports', 'members')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-amber-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="View Member Directory & Growth"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Users className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {data.totalMembers.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">Total Members</div>
        </div>
        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>Active: {data.activeMembers}</span>
          <span className="flex items-center gap-0.5">
            {memberTrendUp ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
            {memberDiff >= 0 ? `+${memberDiff}` : memberDiff}
          </span>
        </div>
      </div>

      {/* 2. Active Members Card */}
      <div
        onClick={() => onNavigateTab('directory')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="View Active Congregation"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {data.activeMembers.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">Active Members</div>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
          {data.totalMembers > 0 ? `${Math.round((data.activeMembers / data.totalMembers) * 100)}% of Directory` : '0%'}
        </div>
      </div>

      {/* 3. New Members Card */}
      <div
        onClick={() => onNavigateTab('reports', 'growth')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-sky-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="View New Member Join Trend"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <UserPlus className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            +{data.newMembersThisMonth}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">New Members</div>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>This Month</span>
          <span className="text-slate-400 font-mono text-[9.5px]">Prev: {data.newMembersPrevMonth}</span>
        </div>
      </div>

      {/* 4. Visitors Card */}
      <div
        onClick={() => onNavigateTab('reports', 'visitors')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="View Visitor Pipeline"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserPlus className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {data.visitorsThisMonth}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">Visitors (Month)</div>
        </div>
        <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>Total: {data.totalVisitors}</span>
          <span className="flex items-center gap-0.5 font-mono text-[9.5px]">
            {visitorTrendUp ? '▲' : '▼'} {visitorDiff >= 0 ? `+${visitorDiff}` : visitorDiff} vs Last M
          </span>
        </div>
      </div>

      {/* 5. Attendance Card */}
      <div
        onClick={() => onNavigateTab('reports', 'attendance')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="View Full Attendance Analytics"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {data.latestAttendance}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">Latest Attendance</div>
        </div>
        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>Avg: {data.avgAttendanceMonth}</span>
          <span>{data.attendanceRate}% Rate</span>
        </div>
      </div>

      {/* 6. Upcoming Events Card */}
      <div
        onClick={() => onNavigateTab('calendar')}
        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 hover:border-rose-400/80 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2 group"
        title="Open Church Events Calendar"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {data.upcomingEventsCount}
          </div>
          <div className="text-[11px] font-bold uppercase text-slate-400">Upcoming Events</div>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
          Scheduled in Calendar
        </div>
      </div>
    </div>
  );
};
