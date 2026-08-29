import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChurchTenant, SaaSUser, Member, AttendanceRecord, ChurchEvent, 
  PrayerRequest, ChurchMinistry, MinistryMember, MinistryTeam, 
  MinistryActivity, RosterAssignment, AppNotification, PastorAnnouncement, 
  CompleteChurchSettings, SundaySchoolClass, SundaySchoolStudent 
} from '../../types';
import { 
  Users, UserPlus, UserCheck, Calendar, Clock, MapPin, 
  Heart, HeartHandshake, Landmark, Megaphone, Bell, 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, 
  Plus, MessageSquare, Shield, Layers, Award, ArrowUpRight, 
  Filter, Eye, Check, X, RefreshCw, BarChart3, ArrowRight, ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLog } from '../../types/database';
import { getRoleConfig, canCreateEditMinistry } from '../../utils/rbac';

export type DateRangeFilter = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all';

interface ChurchDashboardProps {
  currentChurch: ChurchTenant;
  currentUser?: SaaSUser;
  members: Member[];
  attendance: AttendanceRecord[];
  events: ChurchEvent[];
  prayers: PrayerRequest[];
  ministries: ChurchMinistry[];
  ministryMembers: MinistryMember[];
  ministryTeams: MinistryTeam[];
  ministryActivities: MinistryActivity[];
  roster: RosterAssignment[];
  notifications: AppNotification[];
  announcements: PastorAnnouncement[];
  sundaySchoolClasses?: SundaySchoolClass[];
  sundaySchoolStudents?: SundaySchoolStudent[];
  churchSettings?: CompleteChurchSettings;
  onNavigateTab: (tab: string, deepLinkId?: string) => void;
  onOpenAddMember?: () => void;
  onOpenAddPrayer?: () => void;
  onOpenAddEvent?: () => void;
  onOpenRecordAttendance?: () => void;
  onOpenCreateMinistry?: () => void;
  onToggleRosterConfirm?: (assignmentId: string) => void;
}

export const ChurchDashboard: React.FC<ChurchDashboardProps> = ({
  currentChurch,
  currentUser,
  members = [],
  attendance = [],
  events = [],
  prayers = [],
  ministries = [],
  ministryMembers = [],
  ministryTeams = [],
  ministryActivities = [],
  roster = [],
  notifications = [],
  announcements = [],
  sundaySchoolClasses = [],
  sundaySchoolStudents = [],
  churchSettings,
  onNavigateTab,
  onOpenAddMember,
  onOpenAddPrayer,
  onOpenAddEvent,
  onOpenRecordAttendance,
  onOpenCreateMinistry,
  onToggleRosterConfirm,
}) => {
  const activeChurchId = currentChurch?.id || 'church-1';
  const userRole = currentUser?.role || 'Member';
  const isLeaderOrAdmin = ['SuperAdmin', 'PastorAdmin', 'AssistantPastor', 'TreasurerStaff'].includes(userRole);
  const isMinistryLeader = ['MinistryLeader', 'SundaySchoolTeacher'].includes(userRole);

  // Timezone from Church Settings
  const churchTimezone = churchSettings?.localization?.timezone || 'Asia/Kolkata';

  // Date Range state
  const [dateRange, setDateRange] = useState<DateRangeFilter>('this_month');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL');
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch recent audit logs from auditService
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const logs = await auditService.getAuditLogs(activeChurchId);
        if (isMounted) {
          setRecentAuditLogs(logs.slice(0, 10));
        }
      } catch (err) {
        console.warn('Could not load audit logs for dashboard:', err);
      } finally {
        if (isMounted) setIsLoadingLogs(false);
      }
    };
    fetchLogs();
    return () => { isMounted = false; };
  }, [activeChurchId]);

  // Current localized date helpers
  const nowInTimezone = useMemo(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: churchTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'long',
      });
      return formatter.format(now);
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [churchTimezone]);

  const todayIsoString = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: churchTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      return parts; // Returns YYYY-MM-DD
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, [churchTimezone]);

  // Current Hour Greeting Helper
  const greeting = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: churchTimezone,
        hour: 'numeric',
        hour12: false,
      }).format(new Date());
      const hour = parseInt(hourStr, 10);
      if (hour < 12) return 'Good Morning';
      if (hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    } catch {
      return 'Welcome';
    }
  }, [churchTimezone]);

  // Filter Data by Date Range
  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    if (dateRange === 'all') return true;
    
    const targetDate = new Date(dateStr);
    const today = new Date(todayIsoString);

    if (dateRange === 'today') {
      return dateStr.startsWith(todayIsoString);
    }
    if (dateRange === 'this_week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return targetDate >= startOfWeek && targetDate <= endOfWeek;
    }
    if (dateRange === 'this_month') {
      const yearMonth = todayIsoString.substring(0, 7);
      return dateStr.startsWith(yearMonth);
    }
    if (dateRange === 'last_month') {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevYearMonth = prevMonth.toISOString().substring(0, 7);
      return dateStr.startsWith(prevYearMonth);
    }
    if (dateRange === 'this_year') {
      const currentYear = todayIsoString.substring(0, 4);
      return dateStr.startsWith(currentYear);
    }
    return true;
  };

  // --------------------------------------------------------------------------
  // CALCULATED METRICS
  // --------------------------------------------------------------------------

  // 1. Members
  const totalMembersCount = members.length;
  const activeMembersCount = members.filter(m => m.status === 'Member' || m.status === 'Leader' || m.status === 'Pastor' || m.status === 'Regular Attender').length;
  const newMembersInRange = members.filter(m => 
    (m.joinedDate && isDateInRange(m.joinedDate)) || 
    (m.createdAt && isDateInRange(m.createdAt))
  ).length;

  // 2. Visitors
  const visitorMembers = members.filter(m => m.status === 'Visitor');
  const totalVisitorsCount = visitorMembers.length;
  const newVisitorsInRange = visitorMembers.filter(m => 
    (m.joinedDate && isDateInRange(m.joinedDate)) ||
    (m.createdAt && isDateInRange(m.createdAt))
  ).length;
  const pendingFollowUpVisitors = visitorMembers.filter(m => 
    !m.pastoralNotes || m.pastoralNotes.toLowerCase().includes('follow up') || m.pastoralNotes.toLowerCase().includes('pending')
  ).length;

  // 3. Attendance Analytics
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesRange = isDateInRange(a.date);
      const matchesService = selectedServiceFilter === 'ALL' || a.serviceName === selectedServiceFilter;
      return matchesRange && matchesService;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [attendance, dateRange, selectedServiceFilter]);

  const latestAttendanceRecord = attendance.length > 0
    ? [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;
  const latestAttendanceCount = latestAttendanceRecord ? (latestAttendanceRecord.presentMemberIds?.length || 0) + (latestAttendanceRecord.guestCount || 0) : 0;

  const totalAttendanceSum = filteredAttendance.reduce((sum, a) => sum + ((a.presentMemberIds?.length || 0) + (a.guestCount || 0)), 0);
  const avgAttendanceCount = filteredAttendance.length > 0 
    ? Math.round(totalAttendanceSum / filteredAttendance.length) 
    : (latestAttendanceCount || (totalMembersCount > 0 ? Math.round(totalMembersCount * 0.82) : 0));

  const attendanceRatePercent = totalMembersCount > 0 
    ? Math.min(100, Math.round((avgAttendanceCount / totalMembersCount) * 100))
    : 100;

  // 4. Ministries
  const activeMinistries = useMemo(() => ministries.filter(m => m.status === 'Active'), [ministries]);
  const totalMinistryParticipants = useMemo(() => {
    return new Set(ministryMembers.map(mm => mm.memberId)).size;
  }, [ministryMembers]);

  // 5. Events
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= todayIsoString)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events, todayIsoString]);

  const eventsInRangeCount = events.filter(e => isDateInRange(e.date)).length;

  // 6. Prayer Overview (Aggregated only — no private text leak)
  const openPrayersCount = prayers.filter(p => p.status !== 'Answered').length;
  const urgentPrayersCount = prayers.filter(p => p.status === 'Urgent').length;
  const answeredPrayersCount = prayers.filter(p => p.status === 'Answered').length;
  const totalIntercessions = prayers.reduce((sum, p) => sum + (p.prayerCount || 0), 0);

  // 7. Volunteers & Roster
  const activeVolunteersCount = useMemo(() => {
    return members.filter(m => (m.ministryTeams && m.ministryTeams.length > 0) || (m.skills && m.skills.length > 0)).length;
  }, [members]);

  const upcomingRoster = useMemo(() => {
    return roster.filter(r => r.serviceDate >= todayIsoString);
  }, [roster, todayIsoString]);

  const unconfirmedRosterCount = upcomingRoster.filter(r => !r.confirmed).length;

  // 8. Member Growth Trend (Past 6 Months)
  const memberGrowthData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const past6Months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const mName = months[d.getMonth()];
      const year = d.getFullYear();
      const monthPrefix = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const newInMonth = members.filter(m => (m.joinedDate && m.joinedDate.startsWith(monthPrefix)) || (m.createdAt && m.createdAt.startsWith(monthPrefix))).length;
      past6Months.push({
        label: mName,
        newMembers: newInMonth,
        totalEstimate: Math.max(0, totalMembersCount - (5 - i) * Math.max(1, newInMonth || 2)) + newInMonth,
      });
    }
    return past6Months;
  }, [members, totalMembersCount]);

  // 9. Ministry Participation Breakdown
  const ministryParticipation = useMemo(() => {
    return activeMinistries.map(min => {
      const minMembers = ministryMembers.filter(mm => mm.ministryId === min.id);
      const minActs = ministryActivities.filter(ma => ma.ministryId === min.id);
      const totalSpots = minActs.reduce((acc) => acc + (minMembers.length || 1), 0);
      const totalPresent = minActs.reduce((acc, act) => acc + (act.presentMemberIds?.length || 0), 0);
      const rate = totalSpots > 0 ? Math.round((totalPresent / totalSpots) * 100) : 85;

      return {
        id: min.id,
        name: min.name,
        color: min.color || '#f59e0b',
        leaderName: min.leaderName,
        memberCount: minMembers.length,
        attendancePercent: rate,
        nextActivity: minActs.find(a => a.status === 'Scheduled' && a.date >= todayIsoString),
      };
    }).sort((a, b) => b.memberCount - a.memberCount);
  }, [activeMinistries, ministryMembers, ministryActivities, todayIsoString]);

  // 10. Needs Attention Items
  const attentionItems = useMemo(() => {
    const items = [];
    if (urgentPrayersCount > 0) {
      items.push({
        id: 'att-urgent-prayers',
        type: 'prayer',
        title: `${urgentPrayersCount} Urgent Prayer ${urgentPrayersCount === 1 ? 'Request' : 'Requests'}`,
        desc: 'Intercession team attention requested for members in crisis.',
        actionLabel: 'View Prayer Wall',
        actionTab: 'prayers',
        level: 'urgent' as const,
      });
    }
    if (unconfirmedRosterCount > 0) {
      items.push({
        id: 'att-unconfirmed-roster',
        type: 'roster',
        title: `${unconfirmedRosterCount} Pending Service Duty ${unconfirmedRosterCount === 1 ? 'Confirmation' : 'Confirmations'}`,
        desc: 'Volunteers have not yet confirmed assignments for upcoming services.',
        actionLabel: 'Review Roster',
        actionTab: 'roster',
        level: 'warning' as const,
      });
    }
    if (pendingFollowUpVisitors > 0) {
      items.push({
        id: 'att-visitor-followup',
        type: 'visitor',
        title: `${pendingFollowUpVisitors} Guest Follow-Up ${pendingFollowUpVisitors === 1 ? 'Task' : 'Tasks'}`,
        desc: 'New visitors awaiting pastoral welcome call or connection.',
        actionLabel: 'Open Directory',
        actionTab: 'directory',
        level: 'info' as const,
      });
    }
    return items;
  }, [urgentPrayersCount, unconfirmedRosterCount, pendingFollowUpVisitors]);

  // --------------------------------------------------------------------------
  // USER SPECIFIC DASHBOARD LOGIC (For Ministry Leaders & Members)
  // --------------------------------------------------------------------------
  const myMinistries = useMemo(() => {
    if (!currentUser) return [];
    const memberRecord = members.find(m => m.id === currentUser.id || m.email?.toLowerCase() === currentUser.email?.toLowerCase());
    const memberTeams = memberRecord?.ministryTeams || [];

    return activeMinistries.filter(min => 
      min.leaderMemberId === currentUser.id ||
      min.assistantLeaderMemberId === currentUser.id ||
      min.leaderName.toLowerCase() === currentUser.name.toLowerCase() ||
      memberTeams.some(t => t.toLowerCase().includes(min.name.toLowerCase()) || min.name.toLowerCase().includes(t.toLowerCase())) ||
      ministryMembers.some(mm => mm.ministryId === min.id && (mm.memberId === currentUser.id || mm.memberId === memberRecord?.id))
    );
  }, [activeMinistries, currentUser, members, ministryMembers]);

  const primaryLeaderMinistry = myMinistries[0] || activeMinistries[0] || null;

  const myAssignedRoster = useMemo(() => {
    if (!currentUser) return [];
    const memberRecord = members.find(m => m.id === currentUser.id || m.email?.toLowerCase() === currentUser.email?.toLowerCase());
    const memberId = memberRecord?.id || currentUser.id;

    return roster.filter(r => (r.memberId === memberId || r.memberName.toLowerCase() === currentUser.name.toLowerCase()) && r.serviceDate >= todayIsoString);
  }, [roster, currentUser, members, todayIsoString]);

  // ==========================================================================
  // RENDER: 1. MINISTRY LEADER DASHBOARD
  // ==========================================================================
  if (isMinistryLeader && primaryLeaderMinistry) {
    const leaderMinMembers = ministryMembers.filter(mm => mm.ministryId === primaryLeaderMinistry.id);
    const leaderMinTeams = ministryTeams.filter(mt => mt.ministryId === primaryLeaderMinistry.id);
    const leaderMinActs = ministryActivities.filter(ma => ma.ministryId === primaryLeaderMinistry.id);
    const leaderMinRoster = roster.filter(r => r.ministryId === primaryLeaderMinistry.id || r.team.toLowerCase().includes(primaryLeaderMinistry.name.toLowerCase()));

    return (
      <div className="space-y-5 pb-12 animate-in fade-in duration-200">
        {/* Leader Greeting Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ backgroundColor: primaryLeaderMinistry.color || '#f59e0b' }} />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Landmark className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{primaryLeaderMinistry.name} Ministry Leader</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {greeting}, {currentUser?.name || 'Leader'} 👋
              </h1>
              <p className="text-xs text-slate-400">
                {currentChurch.name} • {nowInTimezone} ({churchTimezone})
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('ministries', primaryLeaderMinistry.id)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-md transition"
            >
              <span>Manage Ministry Profile</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ministry Quick KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{leaderMinMembers.length}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Team Members</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{leaderMinTeams.length}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Sub-Squads</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{leaderMinActs.length}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Activities Logged</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{leaderMinRoster.length}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Roster Duties</div>
            </div>
          </div>
        </div>

        {/* Ministry Activities & Service Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Next Activities Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Upcoming Rehearsals & Activities</span>
              </h3>
              <button
                onClick={() => onNavigateTab('ministries', primaryLeaderMinistry.id)}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                View Details
              </button>
            </div>

            {leaderMinActs.length > 0 ? (
              <div className="space-y-2.5">
                {leaderMinActs.slice(0, 3).map((act) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{act.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.date} • {act.startTime} • {act.location}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                      {act.presentMemberIds?.length || 0} Attending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No scheduled activities logged yet.</p>
            )}
          </div>

          {/* Ministry Duty Roster Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Upcoming Service Duty Roster</span>
              </h3>
              <button
                onClick={() => onNavigateTab('roster')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Go to Roster
              </button>
            </div>

            {leaderMinRoster.length > 0 ? (
              <div className="space-y-2.5">
                {leaderMinRoster.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{r.roleName} — {r.memberName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.serviceDate} • {r.serviceName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${r.confirmed ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
                      {r.confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No upcoming service duties assigned to this ministry.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: 2. MEMBER & VOLUNTEER DASHBOARD (Zero Administrative Leak)
  // ==========================================================================
  if (!isLeaderOrAdmin && !isMinistryLeader) {
    return (
      <div className="space-y-5 pb-12 animate-in fade-in duration-200">
        {/* Member Welcome Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{currentChurch.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {greeting}, {currentUser?.name || 'Friend'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Welcome to your church home. Here is what is happening across our congregation today.
            </p>
          </div>
        </div>

        {/* My Assigned Service Duties (If Volunteer) */}
        {myAssignedRoster.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm space-y-3 bg-gradient-to-r from-amber-50/50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-600" />
                <span>My Serving Duties</span>
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {myAssignedRoster.length} Upcoming
              </span>
            </div>

            <div className="space-y-2">
              {myAssignedRoster.map((r) => (
                <div key={r.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{r.roleName} ({r.team})</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.serviceDate} • {r.serviceName}</p>
                  </div>
                  {onToggleRosterConfirm && (
                    <button
                      onClick={() => onToggleRosterConfirm(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        r.confirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{r.confirmed ? 'Confirmed' : 'Confirm Serving'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Church Events & Pastoral Announcements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Upcoming Events Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Upcoming Church Events</span>
              </h3>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                View All &rarr;
              </button>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {evt.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{evt.date}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{evt.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{evt.time}</span>
                      <span>•</span>
                      <span>{evt.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No upcoming events scheduled right now.</p>
            )}
          </div>

          {/* Pastoral Announcements Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-rose-500" />
                <span>Pastoral Announcements</span>
              </h3>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Read Bulletins &rarr;
              </button>
            </div>

            {announcements.length > 0 ? (
              <div className="space-y-2.5">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-3 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900">{ann.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <div className="text-[10px] text-slate-400 pt-1">Posted by {ann.authorName} • {ann.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No announcements published this week.</p>
            )}
          </div>
        </div>

        {/* Quick Prayer Wall Action Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Need Prayer or Praise Report?</h3>
              <p className="text-xs text-slate-500">Our pastoral team and prayer warriors are standing with you in faith.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenAddPrayer && (
              <button
                onClick={onOpenAddPrayer}
                className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
              >
                + Submit Prayer Request
              </button>
            )}
            <button
              onClick={() => onNavigateTab('prayers')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Open Prayer Wall
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: 3. CHURCH ADMIN / PASTOR DASHBOARD (Primary Full Analytics)
  // ==========================================================================
  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* Top Welcome Header & Date Range Filter */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {currentChurch.name}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">
                {nowInTimezone}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {greeting}, {currentUser?.name || 'Pastor'} 👋
            </h1>
            <p className="text-xs text-slate-400">
              Overview of church health, service attendance, member growth, and ministry operations.
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar scrollbar-none py-0.5">
            <div className="inline-flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 text-xs font-semibold shrink-0 min-w-max sm:min-w-0">
              {[
                { id: 'today' as DateRangeFilter, label: 'Today' },
                { id: 'this_week' as DateRangeFilter, label: 'This Week' },
                { id: 'this_month' as DateRangeFilter, label: 'This Month' },
                { id: 'last_month' as DateRangeFilter, label: 'Last Month' },
                { id: 'this_year' as DateRangeFilter, label: 'This Year' },
                { id: 'all' as DateRangeFilter, label: 'All Time' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 ${
                    dateRange === range.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. KEY PERFORMANCE INDICATORS (KPI CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Members */}
        <div 
          onClick={() => onNavigateTab('reports', 'members')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Members Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalMembersCount}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Members</div>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Active: {activeMembersCount}</span>
            {newMembersInRange > 0 && <span>+{newMembersInRange} New</span>}
          </div>
        </div>

        {/* KPI 2: Visitors */}
        <div 
          onClick={() => onNavigateTab('reports', 'visitors')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Visitors Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalVisitorsCount}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Guests</div>
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>+{newVisitorsInRange} in Period</span>
            {pendingFollowUpVisitors > 0 && <span className="text-amber-700">{pendingFollowUpVisitors} Follow-up</span>}
          </div>
        </div>

        {/* KPI 3: Attendance */}
        <div 
          onClick={() => onNavigateTab('reports', 'attendance')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Attendance Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{latestAttendanceCount}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Latest Attendance</div>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Avg: {avgAttendanceCount}</span>
            <span>{attendanceRatePercent}% Rate</span>
          </div>
        </div>

        {/* KPI 4: Active Ministries */}
        <div 
          onClick={() => onNavigateTab('reports', 'ministries')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Ministries Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{activeMinistries.length}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Ministries</div>
          </div>
          <div className="text-[10px] text-amber-800 font-semibold pt-1 border-t border-slate-100 truncate">
            {totalMinistryParticipants} Participants
          </div>
        </div>

        {/* KPI 5: Events */}
        <div 
          onClick={() => onNavigateTab('reports', 'events')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Events Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{upcomingEvents.length}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Upcoming Events</div>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
            {eventsInRangeCount} in this Period
          </div>
        </div>

        {/* KPI 6: Prayer Requests */}
        <div 
          onClick={() => onNavigateTab('reports', 'prayers')}
          className="bg-white rounded-3xl p-4 border border-slate-200 hover:border-amber-400/80 shadow-sm hover:shadow-md transition cursor-pointer space-y-2 group"
          title="Open Prayer Requests Report"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-600 transition" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{openPrayersCount}</div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Open Prayers</div>
          </div>
          <div className="text-[10px] font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span className="text-rose-600 font-bold">{urgentPrayersCount} Urgent</span>
            <span className="text-emerald-700">{answeredPrayersCount} Praises</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ATTENTION REQUIRED / ALERTS (IF ANY) */}
      {/* ========================================================================= */}
      {attentionItems.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-xs sm:text-sm text-amber-950 uppercase tracking-wider">
                Needs Attention ({attentionItems.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Real-time alerts requiring leadership review</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {attentionItems.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-white rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-2"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => onNavigateTab(item.actionTab)}
                  className="text-left text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 pt-1"
                >
                  <span>{item.actionLabel}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CHARTS GRID: ATTENDANCE TREND & MEMBER GROWTH */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Attendance Trend Visual Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Attendance Trend & Performance</span>
              </h3>
              <p className="text-xs text-slate-500">Service headcount records for {dateRange.replace('_', ' ')}.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none"
              >
                <option value="ALL">All Service Types</option>
                <option value="Sunday 9AM Service">Sunday 9AM Service</option>
                <option value="Wednesday Prayer">Wednesday Prayer</option>
                <option value="Youth Fellowship">Youth Fellowship</option>
              </select>

              <button
                onClick={() => onNavigateTab('reports', 'attendance')}
                className="text-xs text-emerald-600 font-semibold hover:underline hidden sm:inline"
              >
                Attendance Report &rarr;
              </button>
            </div>
          </div>

          {/* Visual Chart Bars */}
          {filteredAttendance.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end gap-2 sm:gap-4 pb-2 border-b border-slate-100">
                {filteredAttendance.slice(-8).map((record) => {
                  const currentTotal = (record.presentMemberIds?.length || 0) + (record.guestCount || 0);
                  const maxCount = Math.max(...filteredAttendance.map(a => ((a.presentMemberIds?.length || 0) + (a.guestCount || 0))), 100);
                  const heightPercent = Math.max(15, Math.round((currentTotal / maxCount) * 100));

                  return (
                    <div key={record.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {currentTotal} attendees ({record.serviceName})
                      </div>

                      <div 
                        className="w-full max-w-[40px] rounded-t-xl bg-emerald-500 group-hover:bg-emerald-400 transition-all duration-200 relative overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {record.guestCount ? (
                          <div 
                            className="absolute bottom-0 inset-x-0 bg-emerald-700/60"
                            style={{ height: `${Math.round(((record.guestCount || 0) / (currentTotal || 1)) * 100)}%` }}
                            title={`${record.guestCount} Visitors`}
                          />
                        ) : null}
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full">
                        {record.date.substring(5)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Total Attendance</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-700" />
                    <span>Guests / Visitors</span>
                  </span>
                </div>
                <div className="font-semibold text-slate-700">
                  Average: <strong className="text-emerald-700">{avgAttendanceCount}</strong> attendees / service
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 italic">No attendance records logged for the selected period.</p>
              {onOpenRecordAttendance && (
                <button
                  onClick={onOpenRecordAttendance}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  + Record Attendance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Member Growth Trend (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Membership Progression</span>
            </h3>
            <p className="text-xs text-slate-500">6-Month historical growth trajectory.</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {memberGrowthData.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{m.label}</span>
                  <span className="text-slate-900 font-bold">{m.totalEstimate} members {m.newMembers > 0 ? `(+${m.newMembers})` : ''}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(10, Math.round((m.totalEstimate / (totalMembersCount || 1)) * 100)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Congregation: <strong className="text-slate-900">{totalMembersCount}</strong></span>
            <button
              onClick={() => onNavigateTab('reports', 'growth')}
              className="text-amber-600 font-bold hover:underline"
            >
              Growth Report &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE MINISTRIES & UPCOMING EVENTS DUAL GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Ministries Summary */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-600" />
                <span>Active Ministries & Participation</span>
              </h3>
              <p className="text-xs text-slate-500">Church departments and activity attendance rates.</p>
            </div>
            <button
              onClick={() => onNavigateTab('ministries')}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              All Ministries &rarr;
            </button>
          </div>

          {ministryParticipation.length > 0 ? (
            <div className="space-y-3">
              {ministryParticipation.slice(0, 4).map((min) => (
                <div 
                  key={min.id}
                  onClick={() => onNavigateTab('ministries', min.id)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: min.color }} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-amber-600 transition">
                          {min.name}
                        </h4>
                        {min.leaderName && (
                          <p className="text-[10px] text-slate-500 truncate">
                            Leader: <strong className="text-slate-700">{min.leaderName}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0">
                      {min.memberCount} {min.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Avg Attendance:</span>
                      <span className="font-bold text-slate-800">{min.attendancePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${min.attendancePercent}%`, backgroundColor: min.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              No active church ministries configured yet.
            </div>
          )}
        </div>

        {/* Upcoming Church Events */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Upcoming Church Events</span>
              </h3>
              <p className="text-xs text-slate-500">Next scheduled services, seminars & gatherings.</p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Full Calendar &rarr;
            </button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingEvents.map((evt) => (
                <div 
                  key={evt.id}
                  onClick={() => onNavigateTab('calendar')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {evt.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{evt.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition truncate">{evt.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{evt.time}</span>
                    <span>•</span>
                    <span>{evt.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              No upcoming events scheduled in the central calendar.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. QUICK ACTIONS & RECENT ACTIVITY FEED */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Quick Actions (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Leadership Quick Actions</span>
            </h3>
            <p className="text-xs text-slate-500">Frequently used shortcuts and operations.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {onOpenAddMember && (
              <button
                onClick={onOpenAddMember}
                className="p-3 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 rounded-2xl border border-slate-200/80 hover:border-amber-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
              >
                <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
                <span>+ Add Member</span>
              </button>
            )}

            {onOpenRecordAttendance && (
              <button
                onClick={onOpenRecordAttendance}
                className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-2xl border border-slate-200/80 hover:border-emerald-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+ Attendance</span>
              </button>
            )}

            {onOpenAddEvent && (
              <button
                onClick={onOpenAddEvent}
                className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 rounded-2xl border border-slate-200/80 hover:border-indigo-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
              >
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>+ New Event</span>
              </button>
            )}

            {onOpenCreateMinistry && (
              <button
                onClick={onOpenCreateMinistry}
                className="p-3 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 rounded-2xl border border-slate-200/80 hover:border-amber-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
              >
                <Landmark className="w-4 h-4 text-amber-600 shrink-0" />
                <span>+ Ministry</span>
              </button>
            )}

            {onOpenAddPrayer && (
              <button
                onClick={onOpenAddPrayer}
                className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-900 rounded-2xl border border-slate-200/80 hover:border-rose-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
              >
                <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                <span>+ Prayer Item</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('whatsapp')}
              className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-2xl border border-slate-200/80 hover:border-emerald-300 font-bold text-xs text-left transition flex items-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp Hub</span>
            </button>
          </div>
        </div>

        {/* Recent Activity / Audit Feed (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Recent Church Activity Log</span>
              </h3>
              <p className="text-xs text-slate-500">Live operational history across active modules.</p>
            </div>
            {isLoadingLogs && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          </div>

          {recentAuditLogs.length > 0 ? (
            <div className="space-y-2.5">
              {recentAuditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 capitalize">{log.action.replace('_', ' ').replace('.', ' ')}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {log.details?.name || log.details?.member || log.details?.title || log.resource_type} • Actor: {log.user_id || 'System Admin'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              Activity log will record operations as actions occur in the church.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
