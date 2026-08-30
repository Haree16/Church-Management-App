import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '../common/UserAvatar';
import {
  Users,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  UserPlus,
  CheckSquare,
  Megaphone,
  HeartHandshake,
  Pin,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  ArrowRight,
  BookOpen,
  Church as ChurchIcon,
} from 'lucide-react';
import {
  Group,
  GroupMember,
  GroupAttendanceRecord,
  GroupAnnouncement,
  PrayerRequest,
  MinistryEvent,
  ChurchMember,
} from '@/types/database';
import {
  groupService,
  CreateGroupAnnouncementPayload,
  CreateGroupPrayerPayload,
  CreateGroupEventPayload,
} from '@/services/groupService';
import { useAuth } from '@/context/AuthContext';
import { AddGroupMemberDialog } from './AddGroupMemberDialog';
import { GroupAttendanceDialog } from './GroupAttendanceDialog';
import { GroupAnnouncementDialog } from './GroupAnnouncementDialog';
import { GroupPrayerDialog } from './GroupPrayerDialog';
import { GroupMeetingDialog } from './GroupMeetingDialog';
import { toast } from 'sonner';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  availableMembers: ChurchMember[];
  onEditGroup: (group: Group) => void;
  onGroupUpdated: () => void;
}

export function GroupDetailModal({
  isOpen,
  onClose,
  group,
  availableMembers = [],
  onEditGroup,
  onGroupUpdated,
}: GroupDetailModalProps) {
  const { activeChurch, profile, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [attendance, setAttendance] = useState<GroupAttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub dialog states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);

  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  // Permission check: only assigned leaders or admins/pastors can edit/manage
  const canManageGroup =
    currentRole === 'super_admin' ||
    currentRole === 'church_admin' ||
    currentRole === 'pastor' ||
    (profile && (group?.leader_id === profile.id || group?.co_leader_id === profile.id));


  const loadGroupData = async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      const data = await groupService.getGroupById(churchId, group.id);
      setMembers(data.members || []);
      setAttendance(data.attendance || []);
      setAnnouncements(data.announcements || []);
      setPrayers(data.prayers || []);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && group) {
      loadGroupData();
    }
  }, [isOpen, group]);

  if (!group) return null;

  const handleAddMember = async (member: ChurchMember, role: string, notes?: string) => {
    try {
      await groupService.addGroupMember(churchId, group.id, member, role, notes);
      toast.success(`${member.profile?.display_name || 'Member'} added to ${group.name}`);
      loadGroupData();
      onGroupUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this group?`)) return;
    try {
      await groupService.removeGroupMember(churchId, memberId);
      toast.success(`${name} removed`);
      loadGroupData();
      onGroupUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = prompt('Enter group role (Leader, Co-Leader, Host, Member):', currentRole);
    if (!newRole || newRole.trim() === currentRole) return;
    try {
      await groupService.updateGroupMemberRole(churchId, memberId, newRole.trim());
      toast.success('Member role updated');
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleLogAttendance = async (
    sessionDate: string,
    attendeeIds: string[],
    topic?: string,
    notes?: string
  ) => {
    try {
      await groupService.logGroupAttendance(churchId, group.id, sessionDate, attendeeIds, topic, notes);
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log attendance');
    }
  };

  const handleCreateAnnouncement = async (payload: CreateGroupAnnouncementPayload) => {
    try {
      await groupService.createGroupAnnouncement(churchId, payload);
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post announcement');
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    try {
      await groupService.deleteGroupAnnouncement(churchId, annId);
      toast.success('Announcement removed');
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove announcement');
    }
  };

  const handleCreatePrayer = async (payload: CreateGroupPrayerPayload) => {
    try {
      await groupService.createGroupPrayer(churchId, payload);
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post prayer');
    }
  };

  const handleTogglePrayerAnswered = async (prayerId: string) => {
    try {
      await groupService.toggleGroupPrayerAnswered(churchId, prayerId);
      toast.success('Prayer status updated!');
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update prayer status');
    }
  };

  const handleCreateMeeting = async (payload: CreateGroupEventPayload) => {
    try {
      await groupService.createGroupEvent(churchId, payload);
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule meeting');
    }
  };

  const handleDeleteMeeting = async (eventId: string) => {
    try {
      await groupService.deleteGroupEvent(churchId, eventId);
      toast.success('Meeting deleted');
      loadGroupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete meeting');
    }
  };

  const capacityCount = group.capacity || 20;
  const fillPercent = Math.min(Math.round((members.length / capacityCount) * 100), 100);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-900 p-6 text-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{group.name}</h2>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] uppercase">
                      {group.category || 'Small Group'}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-1 max-w-lg mt-0.5">
                    {group.description || 'Weekly discipleship cohort and Bible study.'}
                  </p>
                </div>
              </div>

              {canManageGroup && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1.5"
                    onClick={() => onEditGroup(group)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Group
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-white text-slate-900 hover:bg-slate-100 gap-1.5 font-semibold"
                    onClick={() => setIsAddMemberOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Member
                  </Button>
                </div>
              )}
            </div>

            {/* Quick KPI Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/15 text-white/90">
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Enrolled Members</span>
                <span className="text-lg font-bold">{members.length} / {capacityCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Capacity Fill</span>
                <span className="text-lg font-bold">{fillPercent}%</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Meeting Day</span>
                <span className="text-lg font-bold">{group.meeting_day}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Attendance Logged</span>
                <span className="text-lg font-bold">{attendance.length} sessions</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6">
              <TabsList className="bg-transparent h-11 p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Overview & Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Roster / Members ({members.length})
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Attendance Tracker ({attendance.length})
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Meetings & Events ({events.length})
                </TabsTrigger>
                <TabsTrigger
                  value="prayers"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Prayer & Notices ({announcements.length + prayers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 1. Overview Tab */}
              <TabsContent value="overview" className="m-0 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Leader Card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Group Leader</span>
                      <Badge variant="amber" className="text-[10px]">Leader</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={group.leader?.display_name || `${group.leader?.first_name || ''} ${group.leader?.last_name || ''}`}
                        avatarUrl={group.leader?.avatar_url}
                        size="lg"
                        shape="circle"
                        border="border-2 border-white shadow-xs"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {group.leader?.display_name || 'Assigned Leader'}
                        </h4>
                        <p className="text-xs text-slate-500">{group.leader?.email || 'No email'}</p>
                        {group.leader?.phone && (
                          <p className="text-[11px] text-slate-500">{group.leader.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Co-Leader / Assistant */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Co-Leader / Host</span>
                      <Badge variant="outline" className="text-[10px]">Co-Lead</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={group.assistant_leader?.display_name || `${group.assistant_leader?.first_name || ''} ${group.assistant_leader?.last_name || ''}`}
                        avatarUrl={group.assistant_leader?.avatar_url}
                        size="lg"
                        shape="circle"
                        border="border-2 border-white shadow-xs"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {group.assistant_leader?.display_name || 'None assigned'}
                        </h4>
                        <p className="text-xs text-slate-500">{group.assistant_leader?.email || 'Co-leader / host contact'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Logistics */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Meeting Details & Location
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">When We Meet</strong>
                        <span className="text-slate-600 dark:text-slate-400">
                          Every {group.meeting_day} at {group.meeting_time} ({group.frequency})
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">Host Location</strong>
                        <span className="text-slate-600 dark:text-slate-400">
                          {group.location}
                        </span>
                        {group.address && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{group.address}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start gap-2.5">
                      <Users className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">Capacity & Size</strong>
                        <span className="text-slate-600 dark:text-slate-400">
                          {members.length} members enrolled (Max {capacityCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                {canManageGroup && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsAttendanceOpen(true)}
                      className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Log Weekly Attendance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAnnouncementOpen(true)}
                      className="text-xs gap-1.5"
                    >
                      <Megaphone className="h-3.5 w-3.5 text-sky-600" />
                      Post Announcement
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsMeetingOpen(true)}
                      className="text-xs gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-purple-600" />
                      Schedule Meeting
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPrayerOpen(true)}
                      className="text-xs gap-1.5"
                    >
                      <HeartHandshake className="h-3.5 w-3.5 text-pink-600" />
                      Share Prayer Need
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* 2. Roster / Members Tab */}
              <TabsContent value="members" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Group Member Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enrolled covenant members in this discipleship circle.
                    </p>
                  </div>

                  {canManageGroup && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddMemberOpen(true)}
                      className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add Member
                    </Button>
                  )}
                </div>

                {members.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No members enrolled yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                      Add members from the congregation to build your small group community.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Member Name</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Joined Date</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Status</th>
                          {canManageGroup && <th className="py-3 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {members.map((gm) => (
                          <tr key={gm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar
                                  name={gm.profile?.display_name || `${gm.profile?.first_name || ''} ${gm.profile?.last_name || ''}` || gm.profile?.email || 'Member'}
                                  avatarUrl={gm.profile?.avatar_url}
                                  size="sm"
                                  shape="circle"
                                />
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                    {gm.profile?.display_name || gm.profile?.email || 'Member'}
                                  </span>
                                  <span className="text-[11px] text-slate-500">{gm.profile?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  gm.role === 'Leader'
                                    ? 'amber'
                                    : gm.role === 'Co-Leader'
                                    ? 'purple'
                                    : gm.role === 'Host'
                                    ? 'blue'
                                    : 'outline'
                                }
                                className="text-[11px] font-medium"
                              >
                                {gm.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {gm.joined_date || '2023-01-01'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {gm.profile?.phone || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="emerald" className="text-[10px] capitalize">
                                {gm.status}
                              </Badge>
                            </td>
                            {canManageGroup && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateMemberRole(gm.id, gm.role)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600"
                                    title="Edit Role"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveMember(gm.id, gm.profile?.display_name || 'member')}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                                    title="Remove from group"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* 3. Attendance Tab */}
              <TabsContent value="attendance" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Attendance Sessions & Headcount Log
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track weekly Bible study attendance and fellowship participation.
                    </p>
                  </div>

                  {canManageGroup && (
                    <Button
                      size="sm"
                      onClick={() => setIsAttendanceOpen(true)}
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Log Attendance
                    </Button>
                  )}
                </div>

                {attendance.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <CheckSquare className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attendance logged yet</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Log your first weekly meeting to see participation trends.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              Meeting on {att.session_date}
                            </span>
                          </div>
                          <Badge variant="emerald" className="text-[10px]">
                            {att.total_present} Present
                          </Badge>
                        </div>

                        {att.topic && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-sky-600" />
                            <span>Topic: <strong>{att.topic}</strong></span>
                          </div>
                        )}

                        {att.notes && (
                          <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            {att.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 4. Meetings & Events Tab */}
              <TabsContent value="events" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Upcoming Group Meetings & Socials
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scheduled Bible studies, cookouts, and community service days.
                    </p>
                  </div>

                  {canManageGroup && (
                    <Button
                      size="sm"
                      onClick={() => setIsMeetingOpen(true)}
                      className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Schedule Meeting
                    </Button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <Calendar className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No meetings scheduled</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Schedule upcoming session times for group members.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {ev.title}
                          </h4>
                          <p className="text-xs text-slate-500">{ev.description || 'Weekly group fellowship.'}</p>
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-sky-600" />
                              {ev.event_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-sky-600" />
                              {ev.start_time} - {ev.end_time || 'Finish'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {ev.location}
                            </span>
                          </div>
                        </div>

                        {canManageGroup && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMeeting(ev.id)}
                            className="h-8 text-xs text-slate-400 hover:text-red-600 self-end sm:self-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 5. Prayer & Announcements Tab */}
              <TabsContent value="prayers" className="m-0 space-y-6">
                {/* Announcements Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-sky-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Group Announcements ({announcements.length})
                      </h3>
                    </div>

                    {canManageGroup && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAnnouncementOpen(true)}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Post Notice
                      </Button>
                    )}
                  </div>

                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                      No announcements posted yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className={`rounded-xl border p-3.5 text-xs shadow-sm space-y-1.5 ${
                            ann.is_pinned
                              ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50'
                              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                              {ann.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />}
                              <span>{ann.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              By {ann.author_name || 'Leader'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{ann.content}</p>

                          {canManageGroup && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="text-[10px] text-slate-400 hover:text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prayer Wall Section */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-pink-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Group Prayer Wall ({prayers.length})
                      </h3>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPrayerOpen(true)}
                      className="h-7 text-xs gap-1 text-pink-600 border-pink-200 hover:bg-pink-50"
                    >
                      <Plus className="h-3 w-3" />
                      Add Prayer
                    </Button>
                  </div>

                  {prayers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                      No prayer requests posted yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {prayers.map((pr) => (
                        <div
                          key={pr.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{pr.title}</span>
                            <Badge
                              variant={pr.is_answered ? 'emerald' : 'outline'}
                              className="text-[10px] cursor-pointer"
                              onClick={() => handleTogglePrayerAnswered(pr.id)}
                            >
                              {pr.is_answered ? '✓ Praise / Answered' : 'Praying'}
                            </Badge>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{pr.request}</p>
                          {pr.praise_report && (
                            <p className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded text-[11px]">
                              Praise: {pr.praise_report}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                            <span>Requested by {pr.author_name}</span>
                            <span>{pr.prayer_count || 1} praying</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub Dialogs */}
      <AddGroupMemberDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupName={group.name}
        availableMembers={availableMembers}
        onAdd={handleAddMember}
      />

      <GroupAttendanceDialog
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        groupId={group.id}
        groupName={group.name}
        members={members}
        onSave={handleLogAttendance}
      />

      <GroupAnnouncementDialog
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        groupId={group.id}
        groupName={group.name}
        authorId={profile?.id || 'u-leader'}
        authorName={profile?.display_name || 'Group Leader'}
        onSave={handleCreateAnnouncement}
      />

      <GroupPrayerDialog
        isOpen={isPrayerOpen}
        onClose={() => setIsPrayerOpen(false)}
        groupId={group.id}
        groupName={group.name}
        defaultAuthorName={profile?.display_name || ''}
        onSave={handleCreatePrayer}
      />

      <GroupMeetingDialog
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
        groupId={group.id}
        groupName={group.name}
        defaultLocation={group.location || "Leader's Home"}
        onSave={handleCreateMeeting}
      />
    </>
  );
}
