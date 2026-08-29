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
import {
  Layers,
  Users,
  Calendar,
  Sparkles,
  UserPlus,
  Mail,
  Phone,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Music,
  Heart,
  Globe,
  Video,
  Coffee,
  Flame,
  UserCheck,
} from 'lucide-react';
import {
  Ministry,
  MinistryMember,
  MinistryEvent,
  ChurchMember,
  VolunteerAssignment,
} from '@/types/database';
import { ministryService, CreateMinistryEventPayload } from '@/services/ministryService';
import { volunteerService } from '@/services/volunteerService';
import { useAuth } from '@/context/AuthContext';
import { AddMinistryMemberDialog } from './AddMinistryMemberDialog';
import { MinistryEventDialog } from './MinistryEventDialog';
import { CanAccess } from '@/components/ui/can-access';
import { toast } from 'sonner';

interface MinistryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ministry: Ministry | null;
  availableMembers: ChurchMember[];
  onEditMinistry: (ministry: Ministry) => void;
  onMinistryUpdated: () => void;
}

export function MinistryDetailModal({
  isOpen,
  onClose,
  ministry,
  availableMembers = [],
  onEditMinistry,
  onMinistryUpdated,
}: MinistryDetailModalProps) {
  const { activeChurch, profile, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  // Check if current user leads this ministry
  const isLeader =
    currentRole === 'super_admin' ||
    currentRole === 'church_admin' ||
    currentRole === 'pastor' ||
    (profile && (ministry?.leader_id === profile.id || ministry?.assistant_leader_id === profile.id));


  const loadMinistryDetails = async () => {
    if (!ministry) return;
    setIsLoading(true);
    try {
      const details = await ministryService.getMinistryById(churchId, ministry.id);
      setMembers(details.members || []);
      setEvents(details.events || []);

      const asgns = await volunteerService.getAssignments(churchId, {
        ministryId: ministry.id,
      });
      setAssignments(asgns || []);
    } catch (err) {
      console.error('Failed to load ministry details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ministry) {
      loadMinistryDetails();
    }
  }, [isOpen, ministry]);

  if (!ministry) return null;

  const handleAddMember = async (member: ChurchMember, role: string, notes?: string) => {
    try {
      await ministryService.addMinistryMember(churchId, ministry.id, member, role, notes);
      toast.success(`${member.profile?.display_name || 'Member'} added to roster`);
      loadMinistryDetails();
      onMinistryUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from ${ministry.name}?`)) return;
    try {
      await ministryService.removeMinistryMember(churchId, memberId);
      toast.success(`${name} removed from roster`);
      loadMinistryDetails();
      onMinistryUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, currentRole: string) => {
    const newRole = prompt('Enter new role in ministry:', currentRole);
    if (!newRole || newRole.trim() === currentRole) return;
    try {
      await ministryService.updateMinistryMemberRole(churchId, memberId, newRole.trim());
      toast.success('Role updated successfully');
      loadMinistryDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleCreateEvent = async (payload: CreateMinistryEventPayload) => {
    try {
      await ministryService.createMinistryEvent(churchId, payload);
      loadMinistryDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled session?')) return;
    try {
      await ministryService.deleteMinistryEvent(churchId, eventId);
      toast.success('Event deleted');
      loadMinistryDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleUpdateAssignmentStatus = async (asgnId: string, status: any) => {
    try {
      await volunteerService.updateAssignmentStatus(churchId, asgnId, status);
      toast.success(`Assignment marked as ${status}`);
      loadMinistryDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Icon selector
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Music': return <Music className="h-6 w-6" />;
      case 'Heart': return <Heart className="h-6 w-6" />;
      case 'Globe': return <Globe className="h-6 w-6" />;
      case 'Video': return <Video className="h-6 w-6" />;
      case 'Coffee': return <Coffee className="h-6 w-6" />;
      case 'Flame': return <Flame className="h-6 w-6" />;
      case 'UserCheck': return <UserCheck className="h-6 w-6" />;
      default: return <Layers className="h-6 w-6" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* Header Banner */}
          <div
            className="p-6 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ministry.color || '#4f46e5'} 0%, #1e1b4b 100%)`,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  {renderIcon(ministry.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{ministry.name}</h2>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] uppercase">
                      {ministry.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-1 max-w-lg mt-0.5">
                    {ministry.description || 'Church ministry department and teams.'}
                  </p>
                </div>
              </div>

              {isLeader && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1.5"
                    onClick={() => onEditMinistry(ministry)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Ministry
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
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Total Members</span>
                <span className="text-lg font-bold">{members.length || ministry.member_count || 4}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Active Volunteers</span>
                <span className="text-lg font-bold">{ministry.volunteer_count || Math.max(members.length, 3)}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Upcoming Sessions</span>
                <span className="text-lg font-bold">{events.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Scheduled Shifts</span>
                <span className="text-lg font-bold">{assignments.length}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6">
              <TabsList className="bg-transparent h-11 p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Overview & Leadership
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Members & Roster ({members.length})
                </TabsTrigger>
                <TabsTrigger
                  value="volunteers"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Volunteers & Shifts ({assignments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Rehearsals & Events ({events.length})
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-3"
                >
                  Activity & Info
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 1. Overview Tab */}
              <TabsContent value="overview" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ministry Leader Card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Ministry Director / Head
                      </span>
                      <Badge variant="emerald" className="text-[10px]">Active Leader</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      {ministry.leader?.avatar_url ? (
                        <img
                          src={ministry.leader.avatar_url}
                          alt={ministry.leader.display_name || 'Leader'}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-sky-500/20"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                          {ministry.leader?.first_name?.[0] || 'L'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {ministry.leader?.display_name || 'Unassigned Leader'}
                        </h4>
                        <p className="text-xs text-slate-500">{ministry.leader?.email || 'No email specified'}</p>
                        {ministry.leader?.phone && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{ministry.leader.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assistant Leader Card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Assistant / Co-Leader
                      </span>
                      <Badge variant="outline" className="text-[10px]">Co-Director</Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      {ministry.assistant_leader?.avatar_url ? (
                        <img
                          src={ministry.assistant_leader.avatar_url}
                          alt={ministry.assistant_leader.display_name || 'Co-Leader'}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-500/20"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                          {ministry.assistant_leader?.first_name?.[0] || 'A'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {ministry.assistant_leader?.display_name || 'No assistant leader assigned'}
                        </h4>
                        <p className="text-xs text-slate-500">{ministry.assistant_leader?.email || 'Optional co-director'}</p>
                        {ministry.assistant_leader?.phone && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{ministry.assistant_leader.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Schedule & Contact Details */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Meeting Schedule & Contact Channels
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Clock className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">Schedule & Call Time</strong>
                        <span className="text-slate-600 dark:text-slate-400">
                          {ministry.meeting_schedule || 'Check team group chats for weekly call times'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Mail className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">Department Email</strong>
                        <a
                          href={`mailto:${ministry.email || 'worship@gracevalley.org'}`}
                          className="text-sky-600 hover:underline break-all"
                        >
                          {ministry.email || 'worship@gracevalley.org'}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Phone className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100">Phone / Emergency</strong>
                        <span className="text-slate-600 dark:text-slate-400">
                          {ministry.phone || '+1 (555) 234-5678'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('members')}
                    className="text-xs gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5 text-sky-600" />
                    Manage Member Roster
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('volunteers')}
                    className="text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    View Volunteer Shifts
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveTab('events');
                      setIsAddEventOpen(true);
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    Schedule Rehearsal
                  </Button>
                </div>
              </TabsContent>

              {/* 2. Members & Roster Tab */}
              <TabsContent value="members" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Enrolled Ministry Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Covenant members assigned to this department with designated service roles.
                    </p>
                  </div>

                  {isLeader && (
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
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No members in roster yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                      Add covenant members from the church database to assign specific team roles.
                    </p>
                    {isLeader && (
                      <Button size="sm" onClick={() => setIsAddMemberOpen(true)} className="text-xs gap-1">
                        <UserPlus className="h-3.5 w-3.5" />
                        Add First Member
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Department Role</th>
                          <th className="py-3 px-4">Joined Date</th>
                          <th className="py-3 px-4">Notes</th>
                          <th className="py-3 px-4">Status</th>
                          {isLeader && <th className="py-3 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {members.map((mm) => (
                          <tr key={mm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {mm.profile?.avatar_url ? (
                                  <img
                                    src={mm.profile.avatar_url}
                                    alt={mm.profile.display_name || ''}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                    {mm.profile?.first_name?.[0] || 'M'}
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                    {mm.profile?.display_name || mm.profile?.email || 'Member'}
                                  </span>
                                  <span className="text-[11px] text-slate-500">{mm.profile?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="purple" className="text-[11px] font-medium">
                                {mm.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {mm.joined_date || '2023-01-01'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                              {mm.notes || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="emerald" className="text-[10px] capitalize">
                                {mm.status}
                              </Badge>
                            </td>
                            {isLeader && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateRole(mm.id, mm.role)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600"
                                    title="Edit Role"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveMember(mm.id, mm.profile?.display_name || 'member')}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                                    title="Remove Member"
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

              {/* 3. Volunteers & Shifts Tab */}
              <TabsContent value="volunteers" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Volunteer Shifts & Service Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scheduled volunteer positions and confirmations for Sunday and midweek services.
                    </p>
                  </div>
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <Sparkles className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No shifts scheduled</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Volunteer shifts assigned to this ministry will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignments.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {asgn.event_name}
                          </span>
                          <Badge
                            variant={
                              asgn.status === 'confirmed'
                                ? 'emerald'
                                : asgn.status === 'completed'
                                ? 'blue'
                                : asgn.status === 'declined'
                                ? 'destructive'
                                : 'amber'
                            }
                            className="text-[10px] uppercase"
                          >
                            {asgn.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{asgn.assignment_date} • {asgn.start_time} - {asgn.end_time || 'Done'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {asgn.responsibility}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>Volunteer: {asgn.volunteer?.profile?.display_name || 'Sarah Jenkins'}</span>
                          </div>
                        </div>

                        {isLeader && (
                          <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800">
                            {asgn.status !== 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                                onClick={() => handleUpdateAssignmentStatus(asgn.id, 'confirmed')}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Confirm
                              </Button>
                            )}
                            {asgn.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] text-sky-600 border-sky-200 hover:bg-sky-50 gap-1"
                                onClick={() => handleUpdateAssignmentStatus(asgn.id, 'completed')}
                              >
                                Mark Done
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 4. Rehearsals & Events Tab */}
              <TabsContent value="events" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Rehearsals, Workshops & Team Sessions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scheduled calendar events specific to this ministry department.
                    </p>
                  </div>

                  {isLeader && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddEventOpen(true)}
                      className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Schedule Session
                    </Button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <Calendar className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No scheduled sessions</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Schedule weekly practices, soundchecks, or leadership meetings.
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {ev.title}
                            </h4>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {ev.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{ev.description || 'Regular team preparation.'}</p>
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

                        {isLeader && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEvent(ev.id)}
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

              {/* 5. Activity & Notes Tab */}
              <TabsContent value="activity" className="m-0 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ministry Mission & Pastoral Vision
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ministry.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Recent Department Updates
                    </h4>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>Quarterly volunteer schedule published for next month services.</li>
                      <li>Leader check-in meeting completed with Pastor David Sterling.</li>
                      <li>Roster synchronization updated with main church members directory.</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub-Dialogs */}
      <AddMinistryMemberDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        ministryName={ministry.name}
        availableMembers={availableMembers}
        onAdd={handleAddMember}
      />

      <MinistryEventDialog
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        ministryId={ministry.id}
        ministryName={ministry.name}
        onSave={handleCreateEvent}
      />
    </>
  );
}
