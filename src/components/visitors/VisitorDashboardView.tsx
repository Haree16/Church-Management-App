import React, { useState } from 'react';
import { Visitor, FollowUp } from '@/types/database';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  PieChart,
  Filter,
  UserPlus,
} from 'lucide-react';

interface VisitorDashboardViewProps {
  visitors: Visitor[];
  followUps: FollowUp[];
  onSelectVisitor: (visitor: Visitor) => void;
  onOpenAddVisitor: () => void;
}

export function VisitorDashboardView({
  visitors,
  followUps,
  onSelectVisitor,
  onOpenAddVisitor,
}: VisitorDashboardViewProps) {
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365' | 'all'>('30');

  // Quantitative Metrics Calculation
  const totalVisitors = visitors.length;
  const firstTimeCount = visitors.filter((v) => (v.visit_count || 1) === 1).length;
  const returnCount = visitors.filter((v) => (v.visit_count || 1) > 1 || v.status === 'returned_visitor').length;

  const totalFollowUps = followUps.length;
  const completedFollowUps = followUps.filter((f) => f.status === 'completed').length;
  const followUpCompletionRate = totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 100;

  const convertedMembers = visitors.filter((v) => v.status === 'became_member' || v.converted_member_id).length;
  const conversionRate = totalVisitors > 0 ? Math.round((convertedMembers / totalVisitors) * 100) : 0;

  // Source Distribution Breakdown
  const sources: Record<string, number> = {};
  visitors.forEach((v) => {
    const src = v.heard_about || 'Friend / Family';
    sources[src] = (sources[src] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Overview Controls Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" /> Visitor Insights & Retention Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time metric breakdown of guest connections, follow-up effectiveness, and member conversions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            {(['30', '90', '365', 'all'] as const).map((r) => (
              <button
                key={r}
                className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
                  timeRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setTimeRange(r)}
              >
                {r === 'all' ? 'All Time' : `${r} Days`}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddVisitor}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Guest Card</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visitors */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Guests</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{totalVisitors}</div>
            <span className="text-xs text-slate-500 font-semibold">Recorded guest cards</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* First Time vs Return */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Return Guests</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{returnCount}</div>
            <span className="text-xs text-sky-600 font-bold">{firstTimeCount} First-time guests</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Follow-up Completion Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Follow-up Completion</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{followUpCompletionRate}%</div>
            <span className="text-xs text-slate-500 font-semibold">{completedFollowUps} of {totalFollowUps} Tasks Done</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Member Conversion</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">{conversionRate}%</div>
            <span className="text-xs text-violet-600 font-bold">{convertedMembers} Converted Members</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics & Referral Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Channels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-sky-600" /> Visitor Referral Sources
          </h3>
          <div className="space-y-3">
            {Object.keys(sources).length === 0 ? (
              <div className="text-xs text-slate-400 font-medium py-6 text-center">No source data recorded yet.</div>
            ) : (
              Object.entries(sources).map(([source, count]) => {
                const percentage = Math.round((count / totalVisitors) * 100);
                return (
                  <div key={source} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800">
                      <span>{source}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Guests List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" /> Recent Sunday Guests
          </h3>
          <div className="space-y-2">
            {visitors.length === 0 ? (
              <div className="text-xs text-slate-400 font-medium py-6 text-center">No recent guest cards.</div>
            ) : (
              visitors.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVisitor(v)}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      {v.first_name} {v.last_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Visited {v.visit_date} • {v.service_attended || 'Sunday Service'}
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-white text-slate-700 border border-slate-200">
                    {v.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
