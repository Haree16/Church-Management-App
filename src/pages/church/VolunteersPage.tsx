import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  Users,
  ShieldCheck,
  UserCheck,
  Filter,
  Layers,
  Edit2,
  Trash2,
  ArrowRight,
  LayoutGrid,
  List,
  Check,
  CalendarDays,
  Flame,
  Shield,
  Coffee,
  Music,
  Video,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanAccess } from '@/components/ui/can-access';
import {
  Volunteer,
  VolunteerAssignment,
  ChurchMember,
  Ministry,
  VolunteerStatus,
  AssignmentStatus,
} from '@/types/database';
import {
  volunteerService,
  CreateVolunteerPayload,
  CreateAssignmentPayload,
  SKILL_OPTIONS,
} from '@/services/volunteerService';
import { memberService } from '@/services/memberService';
import { ministryService } from '@/services/ministryService';
import { useAuth } from '@/context/AuthContext';
import { VolunteerFormDialog } from '@/components/organization/VolunteerFormDialog';
import { VolunteerAssignmentDialog } from '@/components/organization/VolunteerAssignmentDialog';
import { toast } from 'sonner';

export function VolunteersPage() {
  const { activeChurch } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'schedule' | 'teams'>('directory');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters for Schedule
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>('all');
  const [scheduleMinistryFilter, setScheduleMinistryFilter] = useState<string>('all');
  const [scheduleVolunteerFilter, setScheduleVolunteerFilter] = useState<string>('all');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>('all');
  const [scheduleViewMode, setScheduleViewMode] = useState<'list' | 'calendar'>('list');

  // Dialog State
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);
  const [volunteerFormMode, setVolunteerFormMode] = useState<'create' | 'edit'>('create');
  const [selectedVolunteerForEdit, setSelectedVolunteerForEdit] = useState<Volunteer | null>(null);

  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [defaultMinistryForAssignment, setDefaultMinistryForAssignment] = useState<string | undefined>(undefined);
  const [defaultVolunteerForAssignment, setDefaultVolunteerForAssignment] = useState<string | undefined>(undefined);

  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vols, asgns, mems, mins] = await Promise.all([
        volunteerService.getVolunteers(churchId),
        volunteerService.getAssignments(churchId),
        memberService.getMembers(churchId),
        ministryService.getMinistries(churchId),
      ]);
      setVolunteers(vols);
      setAssignments(asgns);
      setMembers(mems);
      setMinistries(mins);
    } catch (err) {
      console.error('Failed to load volunteer data:', err);
      toast.error('Failed to load volunteer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId]);

  // Filtered Volunteers for Directory
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((v) => {
      const matchesSearch =
        searchQuery === '' ||
        (v.profile?.display_name &&
          v.profile.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.profile?.email &&
          v.profile.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesSkill = skillFilter === 'all' || v.skills.includes(skillFilter);

      return matchesSearch && matchesStatus && matchesSkill;
    });
  }, [volunteers, searchQuery, statusFilter, skillFilter]);

  // Filtered Assignments for Schedule
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesDate =
        scheduleDateFilter === 'all' ||
        a.assignment_date === scheduleDateFilter;

      const matchesMinistry =
        scheduleMinistryFilter === 'all' ||
        a.ministry_id === scheduleMinistryFilter;

      const matchesVolunteer =
        scheduleVolunteerFilter === 'all' ||
        a.volunteer_id === scheduleVolunteerFilter;

      const matchesStatus =
        scheduleStatusFilter === 'all' ||
        a.status === scheduleStatusFilter;

      return matchesDate && matchesMinistry && matchesVolunteer && matchesStatus;
    });
  }, [assignments, scheduleDateFilter, scheduleMinistryFilter, scheduleVolunteerFilter, scheduleStatusFilter]);

  // Unique dates for schedule filter
  const scheduleDates = useMemo(() => {
    const dates = new Set<string>();
    assignments.forEach((a) => dates.add(a.assignment_date));
    return Array.from(dates).sort();
  }, [assignments]);

  // Stats Calculations
  const stats = useMemo(() => {
    const activeVols = volunteers.filter((v) => v.status === 'active').length;
    const pendingVols = volunteers.filter((v) => v.status === 'pending').length;
    const totalShifts = assignments.length;
    const confirmedShifts = assignments.filter((a) => a.status === 'confirmed').length;
    const scheduledShifts = assignments.filter((a) => a.status === 'scheduled').length;

    const confirmedPercent = totalShifts > 0 ? Math.round((confirmedShifts / totalShifts) * 100) : 100;

    return {
      totalVolunteers: volunteers.length,
      activeVols,
      pendingVols,
      totalShifts,
      confirmedShifts,
      scheduledShifts,
      confirmedPercent,
    };
  }, [volunteers, assignments]);

  // Handlers for Volunteers
  const handleCreateVolunteer = () => {
    setSelectedVolunteerForEdit(null);
    setVolunteerFormMode('create');
    setIsVolunteerFormOpen(true);
  };

  const handleEditVolunteer = (v: Volunteer) => {
    setSelectedVolunteerForEdit(v);
    setVolunteerFormMode('edit');
    setIsVolunteerFormOpen(true);
  };

  const handleSaveVolunteer = async (payload: CreateVolunteerPayload) => {
    try {
      if (volunteerFormMode === 'create') {
        await volunteerService.createVolunteer(churchId, payload);
        toast.success('Volunteer onboarded successfully!');
      } else if (selectedVolunteerForEdit) {
        await volunteerService.updateVolunteer(churchId, selectedVolunteerForEdit.id, payload);
        toast.success('Volunteer profile updated!');
      }
      setIsVolunteerFormOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save volunteer');
    }
  };

  const handleDeleteVolunteer = async (v: Volunteer) => {
    if (!confirm(`Are you sure you want to delete ${v.profile?.display_name || 'this volunteer'} from roster?`)) return;
    try {
      await volunteerService.deleteVolunteer(churchId, v.id);
      toast.success('Volunteer removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove volunteer');
    }
  };

  // Handlers for Assignments
  const handleCreateAssignment = (ministryId?: string, volunteerId?: string) => {
    setDefaultMinistryForAssignment(ministryId);
    setDefaultVolunteerForAssignment(volunteerId);
    setIsAssignmentFormOpen(true);
  };

  const handleSaveAssignment = async (payload: CreateAssignmentPayload) => {
    try {
      await volunteerService.createAssignment(churchId, payload);
      toast.success('Volunteer shift scheduled successfully!');
      setIsAssignmentFormOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule assignment');
    }
  };

  const handleUpdateAssignmentStatus = async (asgnId: string, newStatus: AssignmentStatus) => {
    try {
      await volunteerService.updateAssignmentStatus(churchId, asgnId, newStatus);
      toast.success(`Shift marked as ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shift status');
    }
  };

  const handleDeleteAssignment = async (asgnId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled shift?')) return;
    try {
      await volunteerService.deleteAssignment(churchId, asgnId);
      toast.success('Shift cancelled');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel shift');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-sky-600" />
            Volunteer Management & Service Rosters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Onboard qualified volunteers, schedule Sunday service shifts, and coordinate ministry rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CanAccess permission="volunteers:schedule">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateAssignment()}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              Schedule Shift
            </Button>
          </CanAccess>

          <CanAccess permission="volunteers:schedule">
            <Button
              size="sm"
              onClick={handleCreateVolunteer}
              className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Onboard Volunteer
            </Button>
          </CanAccess>
        </div>
      </div>

      {/* Top KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Volunteers
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalVolunteers}
            </span>
            <Badge variant="emerald" className="text-[10px]">
              {stats.activeVols} Active
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Shifts Scheduled
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalShifts}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <CalendarIcon className="h-3.5 w-3.5 text-sky-600" />
              Services
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Confirmation Rate
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.confirmedPercent}%
            </span>
            <Badge variant="purple" className="text-[10px]">
              {stats.confirmedShifts} Confirmed
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pending Shifts
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.scheduledShifts}
            </span>
            <span className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
              <Clock3 className="h-3.5 w-3.5" /> Awaiting RSVP
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800">
          <TabsList className="bg-transparent h-10 p-0 gap-6">
            <TabsTrigger
              value="directory"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-2.5"
            >
              Volunteer Directory ({volunteers.length})
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-2.5"
            >
              Shift Schedule & Calendar ({assignments.length})
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-sky-600 data-[state=active]:shadow-none rounded-none text-xs font-semibold px-1 py-2.5"
            >
              Ministry Teams & Positions ({ministries.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: VOLUNTEER DIRECTORY */}
        {/* ========================================================================= */}
        <TabsContent value="directory" className="space-y-4 m-0">
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search volunteers, skills, notes..."
                  icon={<Search className="h-4 w-4" />}
                  className="h-9 text-xs"
                />
              </div>

              <div className="w-full sm:w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active Roster</SelectItem>
                    <SelectItem value="pending">Pending Onboarding</SelectItem>
                    <SelectItem value="inactive">Inactive / On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-48">
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="all">All Service Skills</SelectItem>
                    {SKILL_OPTIONS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 self-end sm:self-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Volunteer List / Grid */}
          {filteredVolunteers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
              <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No volunteers found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No volunteers match your current search and filter settings.
              </p>
              <Button size="sm" onClick={handleCreateVolunteer} className="mt-4 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                Onboard Volunteer
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVolunteers.map((vol) => (
                <Card
                  key={vol.id}
                  className="hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {vol.profile?.avatar_url ? (
                          <img
                            src={vol.profile.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-sky-500/20"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                            {vol.profile?.first_name?.[0] || 'V'}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {vol.profile?.display_name || vol.profile?.email || 'Volunteer'}
                          </CardTitle>
                          <span className="text-[11px] text-slate-500 block">{vol.profile?.email}</span>
                        </div>
                      </div>

                      <Badge
                        variant={
                          vol.status === 'active'
                            ? 'emerald'
                            : vol.status === 'pending'
                            ? 'amber'
                            : 'outline'
                        }
                        className="text-[10px] capitalize shrink-0"
                      >
                        {vol.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 pt-0">
                    {/* Skills Tags */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Service Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {vol.skills.slice(0, 4).map((s) => (
                          <Badge key={s} variant="purple" className="text-[10px] font-normal">
                            {s}
                          </Badge>
                        ))}
                        {vol.skills.length > 4 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{vol.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preferred Service & Background Check */}
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Preferred Service:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {vol.preferred_service || 'Sunday Morning'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Background Check:
                        </span>
                        <Badge
                          variant={vol.background_check_status === 'approved' ? 'emerald' : 'outline'}
                          className="text-[9px] capitalize"
                        >
                          {vol.background_check_status || 'Approved'}
                        </Badge>
                      </div>
                    </div>

                    {vol.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        "{vol.notes}"
                      </p>
                    )}
                  </CardContent>

                  {/* Actions Footer */}
                  <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateAssignment(undefined, vol.id)}
                      className="text-xs h-7 gap-1 flex-1 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <CalendarIcon className="h-3 w-3 text-sky-600" />
                      Schedule Shift
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditVolunteer(vol)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600"
                      title="Edit Volunteer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVolunteer(vol)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                      title="Delete Volunteer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Volunteer</th>
                    <th className="py-3.5 px-4">Skills & Gifts</th>
                    <th className="py-3.5 px-4">Preferred Service</th>
                    <th className="py-3.5 px-4">Availability</th>
                    <th className="py-3.5 px-4">Background Check</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredVolunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {vol.profile?.avatar_url ? (
                            <img
                              src={vol.profile.avatar_url}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                              {vol.profile?.first_name?.[0] || 'V'}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {vol.profile?.display_name || vol.profile?.email || 'Volunteer'}
                            </span>
                            <span className="text-[11px] text-slate-500">{vol.profile?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {vol.skills.slice(0, 3).map((s) => (
                            <Badge key={s} variant="purple" className="text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {vol.preferred_service || 'Sunday Morning'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {vol.availability?.join(', ') || 'Flexible'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={vol.background_check_status === 'approved' ? 'emerald' : 'outline'}
                          className="text-[10px] capitalize"
                        >
                          {vol.background_check_status || 'Approved'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={vol.status === 'active' ? 'emerald' : 'outline'} className="text-[10px] capitalize">
                          {vol.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateAssignment(undefined, vol.id)}
                            className="h-7 text-xs gap-1"
                          >
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditVolunteer(vol)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: SHIFT SCHEDULE & CALENDAR */}
        {/* ========================================================================= */}
        <TabsContent value="schedule" className="space-y-4 m-0">
          {/* Schedule Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Filter by Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Filter by Date
              </label>
              <Select value={scheduleDateFilter} onValueChange={setScheduleDateFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates / Sundays</SelectItem>
                  {scheduleDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Ministry */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Department
              </label>
              <Select value={scheduleMinistryFilter} onValueChange={setScheduleMinistryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Ministries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministries</SelectItem>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Volunteer */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Volunteer Member
              </label>
              <Select value={scheduleVolunteerFilter} onValueChange={setScheduleVolunteerFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Volunteers" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Volunteers</SelectItem>
                  {volunteers.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.profile?.display_name || v.profile?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Confirmation Status
              </label>
              <Select value={scheduleStatusFilter} onValueChange={setScheduleStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled (Pending)</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignments List Display */}
          {filteredAssignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
              <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No shifts match filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No volunteer shifts scheduled for the selected date range or department.
              </p>
              <Button size="sm" onClick={() => handleCreateAssignment()} className="mt-4 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" />
                Schedule New Shift
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((asgn) => {
                const vol = volunteers.find((v) => v.id === asgn.volunteer_id);
                const min = ministries.find((m) => m.id === asgn.ministry_id);

                return (
                  <div
                    key={asgn.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {asgn.event_name}
                        </span>
                        {min && (
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{ borderColor: min.color || '#6366f1' }}
                          >
                            {min.name}
                          </Badge>
                        )}
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
                          className="text-[10px] uppercase font-semibold"
                        >
                          {asgn.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                          {asgn.responsibility}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-purple-600" />
                          {vol?.profile?.display_name || asgn.volunteer?.profile?.display_name || 'Volunteer'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                          {asgn.assignment_date} • {asgn.start_time} - {asgn.end_time || 'Done'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {asgn.location}
                        </span>
                      </div>

                      {asgn.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded max-w-2xl">
                          Note: {asgn.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick Status Action Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {asgn.status !== 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateAssignmentStatus(asgn.id, 'confirmed')}
                          className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm
                        </Button>
                      )}

                      {asgn.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateAssignmentStatus(asgn.id, 'completed')}
                          className="h-8 text-xs text-sky-600 border-sky-200 hover:bg-sky-50 gap-1"
                        >
                          Mark Done
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAssignment(asgn.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        title="Cancel Shift"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: MINISTRY TEAMS & POSITIONS */}
        {/* ========================================================================= */}
        <TabsContent value="teams" className="space-y-4 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ministries.map((min) => {
              const minVolunteers = volunteers.filter((v) =>
                v.skills.some((s) => min.name.toLowerCase().includes(s.toLowerCase()) || s.includes('Team'))
              );
              const minAssignments = assignments.filter((a) => a.ministry_id === min.id);

              return (
                <Card key={min.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="h-1.5" style={{ backgroundColor: min.color || '#6366f1' }} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded flex items-center justify-center text-white text-xs shrink-0"
                          style={{ backgroundColor: min.color || '#6366f1' }}
                        >
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                        {min.name}
                      </CardTitle>
                      <Badge variant="emerald" className="text-[10px]">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-1 mt-0.5">
                      Director: {min.leader?.display_name || 'Unassigned'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-[11px]">
                      <span>Roster Pool:</span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {minVolunteers.length || 3} Qualified Volunteers
                      </strong>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-[11px]">
                      <span>Shifts Scheduled:</span>
                      <strong className="text-slate-900 dark:text-slate-100">
                        {minAssignments.length} Shifts Set
                      </strong>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateAssignment(min.id)}
                      className="w-full text-xs h-8 gap-1.5 mt-1"
                    >
                      <Plus className="h-3.5 w-3.5 text-sky-600" />
                      Schedule Volunteer for {min.name.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Volunteer Form Dialog */}
      <VolunteerFormDialog
        isOpen={isVolunteerFormOpen}
        onClose={() => setIsVolunteerFormOpen(false)}
        onSave={handleSaveVolunteer}
        initialData={selectedVolunteerForEdit}
        availableMembers={members}
        mode={volunteerFormMode}
      />

      {/* Volunteer Assignment Dialog */}
      <VolunteerAssignmentDialog
        isOpen={isAssignmentFormOpen}
        onClose={() => setIsAssignmentFormOpen(false)}
        onSave={handleSaveAssignment}
        availableVolunteers={volunteers}
        availableMinistries={ministries}
        defaultMinistryId={defaultMinistryForAssignment}
        defaultVolunteerId={defaultVolunteerForAssignment}
      />
    </div>
  );
}
