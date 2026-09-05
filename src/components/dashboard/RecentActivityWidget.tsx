import React, { useState, useEffect } from 'react';
import { Member, PrayerRequest, AttendanceRecord, ChurchEvent } from '@/types';
import { Clock, UserPlus, UserCheck, Heart, Calendar, RefreshCw, Activity } from 'lucide-react';
import { auditService } from '@/services/auditService';
import { AuditLog } from '@/types/database';

interface RecentActivityWidgetProps {
  churchId: string;
  members: Member[];
  prayers: PrayerRequest[];
  attendance: AttendanceRecord[];
  events: ChurchEvent[];
  isLoading?: boolean;
}

export interface CombinedActivityItem {
  id: string;
  type: 'member_added' | 'visitor_added' | 'attendance_recorded' | 'prayer_submitted' | 'event_created' | 'system_audit';
  title: string;
  description: string;
  actorName: string;
  timestamp: string;
  relativeTime: string;
  iconType: 'user' | 'visitor' | 'attendance' | 'prayer' | 'event' | 'system';
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  churchId,
  members,
  prayers,
  attendance,
  events,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAuditLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const logs = await auditService.getAuditLogs(churchId);
        if (isMounted) {
          setAuditLogs(logs.slice(0, 10));
        }
      } catch (err) {
        console.warn('Could not load audit logs for dashboard activity widget:', err);
      } finally {
        if (isMounted) setIsLoadingLogs(false);
      }
    };
    fetchAuditLogs();
    return () => {
      isMounted = false;
    };
  }, [churchId]);

  // Relative time helper
  const getRelativeTime = (isoDateStr?: string) => {
    if (!isoDateStr) return 'Recently';
    try {
      const date = new Date(isoDateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Combine audit logs and live database entities into a clean activity timeline
  const activities = React.useMemo(() => {
    const list: CombinedActivityItem[] = [];

    // 1. Audit logs
    auditLogs.forEach((log) => {
      list.push({
        id: log.id,
        type: 'system_audit',
        title: log.action ? log.action.replace('_', ' ').replace('.', ' ') : 'System Action',
        description: log.details?.name || log.details?.member || log.details?.title || `${log.resource_type} operation`,
        actorName: log.user_id || 'System Admin',
        timestamp: log.created_at,
        relativeTime: getRelativeTime(log.created_at),
        iconType: 'system',
      });
    });

    // 2. Members added
    members.slice(0, 5).forEach((m) => {
      const dateStr = m.createdAt || m.joinedDate || new Date().toISOString();
      const isVisitor = m.status === 'Visitor';
      list.push({
        id: `act-mem-${m.id}`,
        type: isVisitor ? 'visitor_added' : 'member_added',
        title: isVisitor ? 'Visitor Registered' : 'New Member Added',
        description: `${m.firstName} ${m.lastName} (${m.status}) joined directory`,
        actorName: 'Church Admin',
        timestamp: dateStr,
        relativeTime: getRelativeTime(dateStr),
        iconType: isVisitor ? 'visitor' : 'user',
      });
    });

    // 3. Attendance records
    attendance.slice(0, 3).forEach((att) => {
      const dateStr = (att as any).createdAt || att.date || new Date().toISOString();
      const total = (att.presentMemberIds?.length || 0) + (att.guestCount || 0);
      list.push({
        id: `act-att-${att.id}`,
        type: 'attendance_recorded',
        title: 'Attendance Recorded',
        description: `${total} present for ${att.serviceName}`,
        actorName: 'Attendance Team',
        timestamp: dateStr,
        relativeTime: getRelativeTime(dateStr),
        iconType: 'attendance',
      });
    });

    // 4. Prayer requests
    prayers.slice(0, 3).forEach((p) => {
      const dateStr = p.dateSubmitted || new Date().toISOString();
      list.push({
        id: `act-pray-${p.id}`,
        type: 'prayer_submitted',
        title: 'Prayer Request Submitted',
        description: `"${p.title}" requested by ${p.memberName}`,
        actorName: p.memberName || 'Member',
        timestamp: dateStr,
        relativeTime: getRelativeTime(dateStr),
        iconType: 'prayer',
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  }, [auditLogs, members, attendance, prayers]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-slate-600 dark:text-slate-400" />
            <span>Recent Church Activity Feed</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time operations log across members, attendance, and care.
          </p>
        </div>
        {isLoadingLogs && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 ? (
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0 shadow-xs">
                  {act.iconType === 'user' && <UserPlus className="w-4 h-4 text-sky-600" />}
                  {act.iconType === 'visitor' && <UserCheck className="w-4 h-4 text-indigo-600" />}
                  {act.iconType === 'attendance' && <Activity className="w-4 h-4 text-emerald-600" />}
                  {act.iconType === 'prayer' && <Heart className="w-4 h-4 text-rose-500" />}
                  {act.iconType === 'system' && <Clock className="w-4 h-4 text-amber-500" />}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {act.description} • <span className="font-medium text-slate-700 dark:text-slate-300">{act.actorName}</span>
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0 whitespace-nowrap bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                {act.relativeTime}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
          <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No activity recorded yet</h4>
          <p className="text-xs text-slate-400">
            Operational activity will automatically record as actions occur.
          </p>
        </div>
      )}
    </div>
  );
};
