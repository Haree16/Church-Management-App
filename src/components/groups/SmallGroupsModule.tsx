import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Group,
  GroupMember,
  GroupAttendanceRecord,
  GroupAnnouncement,
  OrgStatus,
  ChurchMember,
  Profile,
} from '@/types/database';
import { groupService, CreateGroupPayload } from '@/services/groupService';
import { pastoralCareService } from '@/services/pastoralCareService';
import { GroupFormModal } from './GroupFormModal';
import { QuickGroupAttendanceModal } from './QuickGroupAttendanceModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  BookOpen,
  Heart,
  HeartHandshake,
  MessageSquare,
  ChevronRight,
  UserCheck,
  Edit3,
  Trash2,
  Lock,
  Flame,
  FileText,
  UserPlus,
  Filter,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Member } from '@/types';
import { memberService } from '@/services/memberService';
import { getStoredMembers } from '@/utils/storage';

interface SmallGroupsModuleProps {
  initialGroupId?: string | null;
  members?: Member[];
}

export const SmallGroupsModule: React.FC<SmallGroupsModuleProps> = ({ initialGroupId = null, members: propMembers }) => {
  const { activeChurch, currentRole, user } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [isLoading, setIsLoading] = useState(true);

  // Group Details Sub-state
  const [groupDetails, setGroupDetails] = useState<{
    group: Group | null;
    members: GroupMember[];
    attendance: GroupAttendanceRecord[];
    announcements: GroupAnnouncement[];
  } | null>(null);

  // Active Detail Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'attendance' | 'meetings' | 'prayers' | 'announcements'>('overview');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTerminology, setSelectedTerminology] = useState<string>('all');

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'edit'>('create');

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [allChurchMembers, setAllChurchMembers] = useState<ChurchMember[]>([]);
  const [selectedMemberIdToAdd, setSelectedMemberIdToAdd] = useState('');
  const [memberRoleToAdd, setMemberRoleToAdd] = useState('Member');

  // Create Pastoral Care Pathway Modal State
  const [isPastoralCareModalOpen, setIsPastoralCareModalOpen] = useState(false);
  const [pastoralPersonName, setPastoralPersonName] = useState('');
  const [pastoralSummary, setPastoralSummary] = useState('');

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      // If user is Group Leader, filter by leader
      const isLeaderOnly = currentRole === 'group_leader';
      const data = await groupService.getGroups(churchId, isLeaderOnly && user?.id ? user.id : undefined);
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
      toast.error('Failed to load small groups.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const details = await groupService.getGroupById(churchId, groupId);
      setGroupDetails(details);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  useEffect(() => {
    loadGroups();
    memberService.getMembers(churchId).then((mList) => {
      if (mList && mList.length > 0) {
        setAllChurchMembers(mList);
      }
    }).catch(() => {});
  }, [churchId, currentRole, user?.id]);

  const availableLeaders: Profile[] = useMemo(() => {
    if (allChurchMembers.length > 0) {
      return allChurchMembers.map((m) => ({
        id: m.id || (m as any).profile_id || m.profile?.id || '',
        first_name: m.profile?.first_name || (m as any).firstName || (m as any).first_name || '',
        last_name: m.profile?.last_name || (m as any).lastName || (m as any).last_name || '',
        display_name: m.profile?.display_name || `${(m as any).firstName || m.profile?.first_name || ''} ${(m as any).lastName || m.profile?.last_name || ''}`.trim() || (m as any).name || m.profile?.email || m.id,
        email: m.profile?.email || (m as any).email || '',
        phone: m.profile?.phone || (m as any).phone || '',
        avatar_url: m.profile?.avatar_url || (m as any).avatarUrl || '',
        is_super_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }
    const memberList = (propMembers && propMembers.length > 0) ? propMembers : getStoredMembers();
    return memberList.map((m) => ({
      id: m.id,
      first_name: m.firstName,
      last_name: m.lastName,
      display_name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || m.id,
      email: m.email || '',
      phone: m.phone || '',
      avatar_url: m.avatarUrl || '',
      is_super_admin: false,
      created_at: m.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }, [allChurchMembers, propMembers]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId, churchId]);

  const handleCreateOrUpdateGroup = async (payload: CreateGroupPayload) => {
    if (groupModalMode === 'create') {
      await groupService.createGroup(churchId, payload);
    } else if (editingGroup) {
      await groupService.updateGroup(churchId, editingGroup.id, payload);
    }
    await loadGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to remove this group record?')) {
      await groupService.deleteGroup(churchId, groupId);
      toast.info('Group removed.');
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      await loadGroups();
    }
  };

  const handleAddMemberToGroup = async () => {
    if (!selectedGroupId || !selectedMemberIdToAdd) {
      toast.error('Please select a member to add.');
      return;
    }
    try {
      const memObj = allChurchMembers.find((m) => m.id === selectedMemberIdToAdd);
      if (memObj) {
        await groupService.addGroupMember(churchId, selectedGroupId, memObj, memberRoleToAdd);
        toast.success('Member added to group!');
        setIsAddMemberModalOpen(false);
        setSelectedMemberIdToAdd('');
        await loadGroupDetails(selectedGroupId);
        await loadGroups();
      }
    } catch (err) {
      toast.error('Failed to add member to group.');
    }
  };

  const handleRemoveMemberFromGroup = async (groupMemberId: string) => {
    if (confirm('Remove this member from group? Historical records will be preserved.')) {
      if (!selectedGroupId) return;
      await groupService.removeGroupMember(churchId, groupMemberId);
      toast.info('Member removed from group.');
      await loadGroupDetails(selectedGroupId);
      await loadGroups();
    }
  };

  const handleCreatePastoralPathway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastoralPersonName.trim() || !pastoralSummary.trim()) {
      toast.error('Please fill in person name and care summary.');
      return;
    }
    try {
      await pastoralCareService.createPastoralCareCase(churchId, {
        person_name: pastoralPersonName.trim(),
        care_type: 'general_checkin',
        stage: 'initial_contact',
        priority: 'medium',
        confidentiality_level: 'pastor_only',
        summary: pastoralSummary.trim(),
      });
      toast.success('Pastoral care follow-up request created for pastoral team!');
      setIsPastoralCareModalOpen(false);
      setPastoralPersonName('');
      setPastoralSummary('');
    } catch (err) {
      toast.error('Failed to submit pastoral follow-up request.');
    }
  };

  // Filtered Groups List
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (selectedStatus !== 'all' && g.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
      if (selectedTerminology !== 'all' && (g.terminology || 'Small Group') !== selectedTerminology) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(term);
        const matchesLocation = (g.location || '').toLowerCase().includes(term);
        const matchesDay = (g.meeting_day || '').toLowerCase().includes(term);
        if (!matchesName && !matchesLocation && !matchesDay) return false;
      }

      return true;
    });
  }, [groups, selectedStatus, selectedCategory, selectedTerminology, searchTerm]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || filteredGroups[0] || null;
  }, [groups, selectedGroupId, filteredGroups]);

  // Overall Group Engagement / Activity Stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const activeGroups = groups.filter((g) => g.status === 'active').length;
    const totalMembers = groups.reduce((acc, g) => acc + (g.member_count || 0), 0);
    const totalLeaders = groups.filter((g) => g.leader_id || g.leader_name).length;
    return { totalGroups, activeGroups, totalMembers, totalLeaders };
  }, [groups]);

  // Neutral operational attendance pattern calculation
  const attendancePattern = useMemo(() => {
    if (!groupDetails?.attendance || groupDetails.attendance.length === 0) return null;
    const records = groupDetails.attendance;
    const totalSessions = records.length;
    const avgPresent = Math.round(records.reduce((acc, r) => acc + (r.total_present || 0), 0) / totalSessions);
    const latestSession = records[0];

    return { totalSessions, avgPresent, latestSession };
  }, [groupDetails?.attendance]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Small Groups & Cell Groups
              <Badge variant="outline" className="bg-amber-950 text-amber-300 border-amber-800 text-[10px]">
                Phase 5 Active
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cell groups, home fellowships, discipleship circles, fast mobile attendance & member care.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setGroupModalMode('create');
            setEditingGroup(null);
            setIsGroupModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Create Group
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Groups</p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">{stats.totalGroups}</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Active Groups</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats.activeGroups}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Group Participants</p>
              <p className="text-xl font-extrabold text-purple-400 mt-0.5">{stats.totalMembers}</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Group Leaders</p>
              <p className="text-xl font-extrabold text-sky-400 mt-0.5">{stats.totalLeaders}</p>
            </div>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups by name, location, or day..."
            className="pl-9 bg-slate-800 border-slate-700 text-white text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedTerminology} onValueChange={setSelectedTerminology}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue placeholder="Terminology" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
              <SelectItem value="all">All Terminology</SelectItem>
              <SelectItem value="Small Group">Small Group</SelectItem>
              <SelectItem value="Cell Group">Cell Group</SelectItem>
              <SelectItem value="Home Group">Home Group</SelectItem>
              <SelectItem value="Life Group">Life Group</SelectItem>
              <SelectItem value="Bible Study Group">Bible Study</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Split Content */}
      {filteredGroups.length === 0 ? (
        <Card className="bg-slate-900 border-dashed border-slate-800 text-center p-8 text-slate-400">
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="font-bold text-white text-sm">No Small Groups Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'No groups match your active filters.' : 'Click "Create Group" above to start your first cell group.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Group Cards List */}
          <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filteredGroups.map((g) => {
              const isSelected = activeGroup?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{g.name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-amber-300 border-slate-700">
                          {g.terminology || 'Small Group'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {g.meeting_day}s @ {g.meeting_time || '07:00 PM'} • {g.location || 'Host Home'}
                      </p>
                    </div>

                    <Badge
                      className={`text-[9px] px-2 py-0.5 ${
                        g.status === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {g.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      Leader: <strong>{g.leader?.display_name || g.leader_name || 'Assigned Leader'}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-300">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      {g.member_count || 0} Members
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Group Detail Dashboard */}
          <div className="lg:col-span-7">
            {activeGroup ? (
              <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden">
                {/* Group Dashboard Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{activeGroup.name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-amber-950 text-amber-300 border-amber-800">
                          {activeGroup.terminology || 'Small Group'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeGroup.description || 'Spiritual fellowship, Bible study, and prayer support group.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsAttendanceModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 px-3"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1" /> Quick Attendance
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingGroup(activeGroup);
                          setGroupModalMode('edit');
                          setIsGroupModalOpen(true);
                        }}
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs h-8"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-[11px] text-slate-400">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="text-slate-500 block">Schedule:</span>
                      <strong className="text-white">{activeGroup.meeting_day}s @ {activeGroup.meeting_time}</strong>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="text-slate-500 block">Location:</span>
                      <strong className="text-white">{activeGroup.location || 'Host Home'}</strong>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                      <span className="text-slate-500 block">Group Capacity:</span>
                      <strong className="text-amber-300">
                        {activeGroup.member_count || 0} / {activeGroup.capacity || 15} Capacity
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex items-center space-x-1 border-b border-slate-800 px-4 pt-2 text-xs font-bold overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Group Overview' },
                    { id: 'members', label: `Members (${groupDetails?.members?.length || 0})` },
                    { id: 'attendance', label: `Attendance (${groupDetails?.attendance?.length || 0})` },
                    { id: 'announcements', label: `Bulletins (${groupDetails?.announcements?.length || 0})` },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-3 py-2 border-b-2 transition font-bold whitespace-nowrap ${
                        activeTab === t.id
                          ? 'border-amber-500 text-amber-400'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Dashboard Body Content */}
                <div className="p-5 space-y-4">
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Operational Attendance Pattern Summary */}
                      {attendancePattern ? (
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-amber-300 block">Group Activity Rate:</span>
                            <p className="text-slate-300 mt-0.5">
                              Average <strong>{attendancePattern.avgPresent} members present</strong> per meeting across {attendancePattern.totalSessions} sessions logged.
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-emerald-950 text-emerald-300 border-emerald-800">
                            Active Attendance Pattern
                          </Badge>
                        </div>
                      ) : (
                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                          No attendance sessions logged yet. Tap "Quick Attendance" to record meeting checklist.
                        </div>
                      )}

                      {/* Leadership Card */}
                      <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Group Leadership</h4>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Primary Group Leader:</span>
                          <strong className="text-white">
                            {activeGroup.leader?.display_name || activeGroup.leader_name || 'Assigned Leader'}
                          </strong>
                        </div>
                        {activeGroup.co_leader_id && (
                          <div className="flex items-center justify-between text-xs border-t border-slate-700/50 pt-2">
                            <span className="text-slate-400">Assistant Co-Leader:</span>
                            <strong className="text-white">
                              {activeGroup.assistant_leader?.display_name || activeGroup.assistant_leader_name || 'Co-Leader'}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Pastoral Care Pathway Banner */}
                      <div className="p-4 bg-purple-950/30 border border-purple-900/50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-purple-300">Need Pastoral Support for a Group Member?</p>
                          <p className="text-purple-200/80 text-[11px] mt-0.5">
                            Submit a confidential pastoral check-in request to the senior pastoral care team.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setPastoralPersonName('');
                            setPastoralSummary('');
                            setIsPastoralCareModalOpen(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0"
                        >
                          Request Pastoral Care
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* MEMBERS TAB */}
                  {activeTab === 'members' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Group Roster & Participation
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => setIsAddMemberModalOpen(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold h-7"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Member
                        </Button>
                      </div>

                      {(!groupDetails?.members || groupDetails.members.length === 0) ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">No members assigned to this group yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupDetails.members.map((gm) => {
                            const name = gm.church_member
                              ? `${gm.church_member.profile?.first_name || ''} ${gm.church_member.profile?.last_name || ''}`.trim()
                              : gm.profile?.display_name || 'Group Member';

                            return (
                              <div
                                key={gm.id}
                                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-white block">{name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    Role: <strong className="text-amber-300">{gm.role}</strong> • Joined: {gm.joined_date}
                                  </span>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveMemberFromGroup(gm.id)}
                                  className="text-slate-400 hover:text-rose-400 h-7"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ATTENDANCE TAB */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Attendance Session Records
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => setIsAttendanceModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-7"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" /> Quick Attendance
                        </Button>
                      </div>

                      {(!groupDetails?.attendance || groupDetails.attendance.length === 0) ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">No attendance sessions recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupDetails.attendance.map((att) => (
                            <div key={att.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-400">{att.session_date}</span>
                                <Badge variant="outline" className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                                  {att.total_present} Present
                                </Badge>
                              </div>
                              {att.topic && <p className="text-slate-300 font-semibold">{att.topic}</p>}
                              {att.notes && <p className="text-[11px] text-slate-400">{att.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BULLETINS TAB */}
                  {activeTab === 'announcements' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Group Bulletins</h4>
                      {(!groupDetails?.announcements || groupDetails.announcements.length === 0) ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">No group announcements posted yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupDetails.announcements.map((ann) => (
                            <div key={ann.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-300">{ann.title}</span>
                                <span className="text-[10px] text-slate-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed">{ann.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500">
                Select a group to view detailed dashboard and attendance checklist.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Group Form Modal */}
      <GroupFormModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleCreateOrUpdateGroup}
        initialData={editingGroup}
        mode={groupModalMode}
        availableLeaders={availableLeaders}
      />

      {/* Quick Attendance Modal */}
      {activeGroup && (
        <QuickGroupAttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          group={activeGroup}
          groupMembers={groupDetails?.members || []}
          onAttendanceSaved={() => {
            if (selectedGroupId) loadGroupDetails(selectedGroupId);
          }}
        />
      )}

      {/* Pastoral Care Pathway Modal */}
      <Dialog open={isPastoralCareModalOpen} onOpenChange={setIsPastoralCareModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 text-white border-slate-800 p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-purple-400" />
              Request Pastoral Care Follow-up
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Submit a non-confidential follow-up request to senior pastors.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePastoralPathway} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">Person Name *</label>
              <Input
                value={pastoralPersonName}
                onChange={(e) => setPastoralPersonName(e.target.value)}
                placeholder="e.g. Member John Doe"
                className="bg-slate-800 border-slate-700 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold block">Care Request Summary *</label>
              <textarea
                value={pastoralSummary}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPastoralSummary(e.target.value)}
                placeholder="Describe reason for pastoral visit or check-in request..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs p-2.5 rounded-xl outline-none"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPastoralCareModalOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
