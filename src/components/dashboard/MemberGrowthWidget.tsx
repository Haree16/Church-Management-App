import React, { useState, useMemo } from 'react';
import { Member } from '@/types';
import { TrendingUp, Users, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

interface MemberGrowthWidgetProps {
  members: Member[];
  onNavigateTab: (tab: string, deepLinkId?: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export type GrowthPeriodOption = '30d' | '3m' | '6m' | '12m';

export const MemberGrowthWidget: React.FC<MemberGrowthWidgetProps> = ({
  members,
  onNavigateTab,
  isLoading,
  isError,
  onRetry,
}) => {
  const [period, setPeriod] = useState<GrowthPeriodOption>('6m');

  // Compute total members, active count, and visitors
  const totalMembers = members.length;
  const activeMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.status === 'Member' ||
        m.status === 'Leader' ||
        m.status === 'Pastor' ||
        m.status === 'Regular Attender' ||
        m.status === 'Clergy/Staff' ||
        (m as any).status === 'active'
    ).length;
  }, [members]);

  const totalVisitors = useMemo(() => {
    return members.filter((m) => m.status === 'Visitor').length;
  }, [members]);

  // Compute period growth data points
  const growthBreakdown = useMemo(() => {
    if (members.length === 0) return [];

    const monthsCount = period === '30d' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const result = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const year = d.getFullYear();
      const monthLabel = monthsNames[d.getMonth()];
      const yearMonthPrefix = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Members joined in this month
      const newInMonth = members.filter((m) => {
        const jDate = m.joinedDate || m.createdAt || '';
        return jDate.startsWith(yearMonthPrefix);
      }).length;

      const visitorsInMonth = members.filter((m) => {
        if (m.status !== 'Visitor') return false;
        const jDate = m.joinedDate || m.createdAt || '';
        return jDate.startsWith(yearMonthPrefix);
      }).length;

      result.push({
        label: monthLabel,
        yearMonth: yearMonthPrefix,
        newMembers: newInMonth,
        newVisitors: visitorsInMonth,
      });
    }

    return result;
  }, [members, period]);

  // Period totals summary
  const periodSummary = useMemo(() => {
    const newMembersSum = growthBreakdown.reduce((sum, item) => sum + item.newMembers, 0);
    const visitorsSum = growthBreakdown.reduce((sum, item) => sum + item.newVisitors, 0);
    const netGrowth = newMembersSum;

    return { newMembersSum, visitorsSum, netGrowth };
  }, [growthBreakdown]);

  const maxPeriodVal = useMemo(() => {
    const vals = growthBreakdown.map((b) => Math.max(b.newMembers, b.newVisitors, 1));
    return Math.max(...vals, 5);
  }, [growthBreakdown]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-36 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="font-bold text-sm text-rose-900">Unable to load Member Growth</h4>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  const hasData = growthBreakdown.some((b) => b.newMembers > 0 || b.newVisitors > 0) || members.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      {/* Header & Period Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Member & Visitor Growth Trajectory</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Net congregation expansion over selected timeframe.
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-bold">
          <button
            onClick={() => setPeriod('30d')}
            className={`px-2.5 py-1 rounded-lg transition ${
              period === '30d' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('3m')}
            className={`px-2.5 py-1 rounded-lg transition ${
              period === '3m' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setPeriod('6m')}
            className={`px-2.5 py-1 rounded-lg transition ${
              period === '6m' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setPeriod('12m')}
            className={`px-2.5 py-1 rounded-lg transition ${
              period === '12m' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">New Members</span>
          <div className="text-lg font-black text-amber-700 dark:text-amber-400">+{periodSummary.newMembersSum}</div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">New Visitors</span>
          <div className="text-lg font-black text-indigo-700 dark:text-indigo-400">+{periodSummary.visitorsSum}</div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Directory</span>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">{totalMembers}</div>
        </div>
      </div>

      {/* Visual Bars Breakdown */}
      {hasData && growthBreakdown.length > 0 ? (
        <div className="space-y-3 pt-1">
          {growthBreakdown.map((item) => {
            const memberPercent = Math.min(100, Math.round((item.newMembers / maxPeriodVal) * 100));
            const visitorPercent = Math.min(100, Math.round((item.newVisitors / maxPeriodVal) * 100));

            return (
              <div key={item.label} className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{item.label}</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">+{item.newMembers} Members</span>
                    {item.newVisitors > 0 && <span className="text-indigo-600 dark:text-indigo-400">+{item.newVisitors} Guests</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.max(4, memberPercent)}%` }}
                    title={`${item.newMembers} New Members`}
                  />
                  {item.newVisitors > 0 && (
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${Math.max(4, visitorPercent)}%` }}
                      title={`${item.newVisitors} Visitors`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No historical data available yet</h4>
          <p className="text-xs text-slate-400">
            As new members and visitors are added, growth trends will populate automatically.
          </p>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Active Directory: <strong className="text-slate-900 dark:text-slate-100">{activeMembers}</strong></span>
        <button
          onClick={() => onNavigateTab('reports', 'growth')}
          className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
        >
          View Growth Analytics &rarr;
        </button>
      </div>
    </div>
  );
};
