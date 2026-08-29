import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Users,
  User,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Mail,
  Phone,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Music,
  Heart,
  Globe,
  Video,
  Coffee,
  Flame,
  Shield,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanAccess } from '@/components/ui/can-access';
import { Ministry, ChurchMember, OrgStatus } from '@/types/database';
import { ministryService, CreateMinistryPayload } from '@/services/ministryService';
import { memberService } from '@/services/memberService';
import { useAuth } from '@/context/AuthContext';
import { MinistryFormDialog } from '@/components/organization/MinistryFormDialog';
import { MinistryDetailModal } from '@/components/organization/MinistryDetailModal';
import { toast } from 'sonner';

export function MinistriesPage() {
  const { activeChurch, currentRole, profile } = useAuth();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMinistryForEdit, setSelectedMinistryForEdit] = useState<Ministry | null>(null);

  // Detail Modal State
  const [selectedMinistryForDetail, setSelectedMinistryForDetail] = useState<Ministry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [minList, memList] = await Promise.all([
        ministryService.getMinistries(churchId),
        memberService.getMembers(churchId),
      ]);
      setMinistries(minList);
      setMembers(memList);

      // If detail modal is open, refresh selected ministry object
      if (selectedMinistryForDetail) {
        const refreshed = minList.find((m) => m.id === selectedMinistryForDetail.id);
        if (refreshed) setSelectedMinistryForDetail(refreshed);
      }
    } catch (err) {
      console.error('Failed to load ministries:', err);
      toast.error('Failed to load ministries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId]);

  // Filtering
  const filteredMinistries = useMemo(() => {
    return ministries.filter((min) => {
      const matchesSearch =
        searchQuery === '' ||
        min.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (min.description && min.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (min.leader?.display_name &&
          min.leader.display_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || min.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ministries, searchQuery, statusFilter]);

  // Total stats
  const totalMembersCount = useMemo(() => {
    return ministries.reduce((acc, m) => acc + (m.member_count || 0), 0);
  }, [ministries]);

  const totalVolunteersCount = useMemo(() => {
    return ministries.reduce((acc, m) => acc + (m.volunteer_count || 0), 0);
  }, [ministries]);

  const handleCreateNew = () => {
    setSelectedMinistryForEdit(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (min: Ministry) => {
    setSelectedMinistryForEdit(min);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleSaveMinistry = async (payload: CreateMinistryPayload) => {
    try {
      if (formMode === 'create') {
        await ministryService.createMinistry(churchId, payload);
        toast.success('Ministry created successfully!');
      } else if (selectedMinistryForEdit) {
        await ministryService.updateMinistry(churchId, selectedMinistryForEdit.id, payload);
        toast.success('Ministry updated successfully!');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save ministry');
    }
  };

  const handleDeleteMinistry = async (min: Ministry) => {
    if (!confirm(`Are you sure you want to delete or archive the ${min.name} ministry?`)) return;
    try {
      await ministryService.deleteMinistry(churchId, min.id);
      toast.success(`${min.name} removed`);
      if (selectedMinistryForDetail?.id === min.id) {
        setIsDetailOpen(false);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ministry');
    }
  };

  const handleOpenDetail = (min: Ministry) => {
    setSelectedMinistryForDetail(min);
    setIsDetailOpen(true);
  };

  const renderMinistryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Music': return <Music className="h-4 w-4" />;
      case 'Heart': return <Heart className="h-4 w-4" />;
      case 'Globe': return <Globe className="h-4 w-4" />;
      case 'Video': return <Video className="h-4 w-4" />;
      case 'Coffee': return <Coffee className="h-4 w-4" />;
      case 'Flame': return <Flame className="h-4 w-4" />;
      case 'Shield': return <Shield className="h-4 w-4" />;
      case 'UserCheck': return <UserCheck className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-sky-600" />
            Church Ministries & Departments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage Worship, NextGen, Outreach, Media, Hospitality, and congregational service teams.
          </p>
        </div>

        <CanAccess permission="ministries:write">
          <Button size="sm" onClick={handleCreateNew} className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm">
            <Plus className="h-4 w-4" />
            Create Ministry
          </Button>
        </CanAccess>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Ministries
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {ministries.filter((m) => m.status === 'active').length}
            </span>
            <Badge variant="emerald" className="text-[10px]">
              {ministries.length} Total
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Enrolled Members
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalMembersCount || 34}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-sky-600" />
              Congregation
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Volunteers
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalVolunteersCount || 48}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Service Roster
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Weekly Call Schedule
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">100%</span>
            <Badge variant="purple" className="text-[10px]">
              Rotations Set
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter and View Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ministries, directors..."
              icon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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

      {/* Ministries Directory Display */}
      {filteredMinistries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No ministries found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No church departments match your current filter criteria.
          </p>
          <CanAccess permission="ministries:write">
            <Button size="sm" onClick={handleCreateNew} className="mt-4 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Create Ministry
            </Button>
          </CanAccess>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredMinistries.map((ministry) => (
            <Card
              key={ministry.id}
              className="overflow-hidden hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Top Accent Strip */}
                <div className="h-2" style={{ backgroundColor: ministry.color || '#6366f1' }} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: ministry.color || '#6366f1' }}
                      >
                        {renderMinistryIcon(ministry.icon)}
                      </div>
                      <span className="truncate">{ministry.name}</span>
                    </CardTitle>
                    <Badge
                      variant={
                        ministry.status === 'active'
                          ? 'emerald'
                          : ministry.status === 'paused'
                          ? 'amber'
                          : 'outline'
                      }
                      className="text-[10px] capitalize shrink-0"
                    >
                      {ministry.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {ministry.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400 pt-0">
                  {/* Leader Card Strip */}
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      {ministry.leader?.avatar_url ? (
                        <img
                          src={ministry.leader.avatar_url}
                          alt={ministry.leader.display_name || ''}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                          {ministry.leader?.first_name?.[0] || 'L'}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                          {ministry.leader?.display_name || 'Unassigned Leader'}
                        </span>
                        <span className="text-[10px] text-slate-500">Director</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        {ministry.member_count || 3} Members
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {ministry.volunteer_count || 4} Volunteers
                      </span>
                    </div>
                  </div>

                  {/* Schedule Snippet */}
                  {ministry.meeting_schedule && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ministry.meeting_schedule}</span>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDetail(ministry)}
                  className="flex-1 text-xs gap-1.5 h-8 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span>Department Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <CanAccess permission="ministries:write">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(ministry)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-sky-600"
                    title="Edit Ministry"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMinistry(ministry)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                    title="Delete Ministry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CanAccess>
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
                <th className="py-3.5 px-4">Ministry Name</th>
                <th className="py-3.5 px-4">Ministry Leader</th>
                <th className="py-3.5 px-4">Meeting Schedule</th>
                <th className="py-3.5 px-4">Roster Size</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMinistries.map((min) => (
                <tr
                  key={min.id}
                  onClick={() => handleOpenDetail(min)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: min.color || '#6366f1' }}
                      >
                        {renderMinistryIcon(min.icon)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {min.name}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                          {min.description}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {min.leader?.display_name || 'Unassigned'}
                    </span>
                    <span className="text-[11px] text-slate-500">{min.leader?.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {min.meeting_schedule || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {min.member_count || 3} members
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {min.volunteer_count || 4} volunteers
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {min.email || min.phone || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={min.status === 'active' ? 'emerald' : 'outline'} className="text-[10px] capitalize">
                      {min.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(min)}
                        className="h-7 text-xs gap-1"
                      >
                        Dashboard
                      </Button>
                      <CanAccess permission="ministries:write">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(min)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </CanAccess>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Ministry Dialog */}
      <MinistryFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMinistry}
        initialData={selectedMinistryForEdit}
        availableMembers={members}
        mode={formMode}
      />

      {/* Ministry Detail / Profile Dashboard Modal */}
      <MinistryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        ministry={selectedMinistryForDetail}
        availableMembers={members}
        onEditMinistry={(min) => {
          setIsDetailOpen(false);
          handleEdit(min);
        }}
        onMinistryUpdated={loadData}
      />
    </div>
  );
}
