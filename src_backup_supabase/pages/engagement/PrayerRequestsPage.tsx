import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  PrayerRequest,
  PrayerPrivacy,
  PrayerStatus,
  PrayerCategory,
} from '@/types/database';
import {
  prayerService,
  CreatePrayerPayload,
  UpdatePrayerPayload,
  PRAYER_CATEGORIES,
  PRAYER_PRIVACY_LEVELS,
  PRAYER_STATUSES,
} from '@/services/prayerService';
import { PrayerCard } from '@/components/prayer/PrayerCard';
import { PrayerFormDialog } from '@/components/prayer/PrayerFormDialog';
import { PrayerDetailModal } from '@/components/prayer/PrayerDetailModal';
import { PrayerNoteDialog } from '@/components/prayer/PrayerNoteDialog';
import { MarkAnsweredDialog } from '@/components/prayer/MarkAnsweredDialog';
import { AssignPrayerDialog } from '@/components/prayer/AssignPrayerDialog';
import { FollowUpFormDialog } from '@/components/followups/FollowUpFormDialog';
import { followUpService, CreateFollowUpPayload } from '@/services/followUpService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Heart,
  Plus,
  Search,
  Sparkles,
  Shield,
  Lock,
  Users,
  Globe,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function PrayerRequestsPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerRequest | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedPrayerDetail, setSelectedPrayerDetail] = useState<PrayerRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [notePrayer, setNotePrayer] = useState<PrayerRequest | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const [answeredPrayer, setAnsweredPrayer] = useState<PrayerRequest | null>(null);
  const [isAnsweredDialogOpen, setIsAnsweredDialogOpen] = useState(false);

  const [assignPrayer, setAssignPrayer] = useState<PrayerRequest | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Follow-up creation from prayer
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [linkedPrayerForFollowUp, setLinkedPrayerForFollowUp] = useState<PrayerRequest | null>(null);

  // Load prayers
  const loadPrayers = async () => {
    setIsLoading(true);
    try {
      const data = await prayerService.getPrayerRequests(churchId, currentRole, user?.id);
      setPrayers(data);

      // If detailed modal is open, refresh its content
      if (selectedPrayerDetail) {
        const refreshed = data.find((p) => p.id === selectedPrayerDetail.id);
        if (refreshed) setSelectedPrayerDetail(refreshed);
      }
    } catch (err) {
      console.error('Failed to load prayer requests:', err);
      toast.error('Failed to fetch prayer requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrayers();
  }, [churchId, currentRole, user?.id]);

  // Handle Handlers
  const handleCreateOrUpdate = async (payload: CreatePrayerPayload | UpdatePrayerPayload) => {
    if (formMode === 'create') {
      await prayerService.createPrayerRequest(churchId, payload as CreatePrayerPayload);
    } else if (editingPrayer) {
      await prayerService.updatePrayerRequest(churchId, editingPrayer.id, payload as UpdatePrayerPayload);
    }
    await loadPrayers();
  };

  const handleTogglePray = async (prayerId: string) => {
    try {
      await prayerService.togglePray(churchId, prayerId, user?.id);
      await loadPrayers();
    } catch (err) {
      toast.error('Failed to update prayer count.');
    }
  };

  const handleAddNote = async (prayerId: string, noteText: string) => {
    await prayerService.addPrayerNote(churchId, {
      prayer_request_id: prayerId,
      note: noteText,
      author_id: user?.id,
      author_name: profile?.display_name || user?.email?.split('@')[0] || 'Prayer Warrior',
      author_role: currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'Prayer Team',
    });
    await loadPrayers();
  };

  const handleMarkAnswered = async (prayerId: string, praiseReport: string) => {
    await prayerService.markAnswered(churchId, prayerId, praiseReport);
    await loadPrayers();
  };

  const handleAssign = async (prayerId: string, assignedTo: string | null, assignedTeamId: string | null) => {
    await prayerService.assignPrayerRequest(churchId, prayerId, { assigned_to: assignedTo, assigned_team_id: assignedTeamId });
    await loadPrayers();
  };

  const handleChangeStatus = async (prayerId: string, status: PrayerStatus) => {
    await prayerService.changeStatus(churchId, prayerId, status);
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
    await loadPrayers();
  };

  const handleChangePrivacy = async (prayerId: string, privacy: PrayerPrivacy) => {
    await prayerService.updatePrayerRequest(churchId, prayerId, { privacy });
    toast.success(`Privacy updated to ${privacy.replace('_', ' ')}`);
    await loadPrayers();
  };

  const handleDelete = async (prayerId: string) => {
    await prayerService.deletePrayerRequest(churchId, prayerId);
    toast.info('Prayer request removed.');
    if (selectedPrayerDetail?.id === prayerId) {
      setIsDetailModalOpen(false);
      setSelectedPrayerDetail(null);
    }
    await loadPrayers();
  };

  const handleCreateFollowUpFromPrayer = (prayer: PrayerRequest) => {
    setLinkedPrayerForFollowUp(prayer);
    setIsFollowUpDialogOpen(true);
  };

  // KPIs
  const stats = useMemo(() => {
    const totalNew = prayers.filter((p) => p.status === 'new').length;
    const totalActive = prayers.filter((p) => p.status === 'new' || p.status === 'praying').length;
    const totalAnswered = prayers.filter((p) => p.status === 'answered' || p.is_answered).length;
    const assignedToMe = prayers.filter((p) => user?.id && p.assigned_to === user.id).length;
    const totalPrayersCount = prayers.reduce((acc, p) => acc + (p.prayer_count || 0), 0);

    return { totalNew, totalActive, totalAnswered, assignedToMe, totalPrayersCount };
  }, [prayers, user?.id]);

  // Filtered List
  const filteredPrayers = useMemo(() => {
    return prayers.filter((p) => {
      // 1. Tab Filter
      if (activeTab === 'assigned' && (!user?.id || p.assigned_to !== user.id)) {
        return false;
      }
      if (activeTab === 'active' && (p.status === 'answered' || p.status === 'closed')) {
        return false;
      }
      if (activeTab === 'answered' && (!p.is_answered && p.status !== 'answered')) {
        return false;
      }
      if (activeTab === 'my_requests' && user?.id && p.member_id !== user.id && !p.author_name?.toLowerCase().includes(user.id.toLowerCase())) {
        return false;
      }

      // 2. Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(term);
        const matchesAuthor = p.author_name.toLowerCase().includes(term);
        const matchesDesc = (p.description || p.request || '').toLowerCase().includes(term);
        const matchesPraise = (p.praise_report || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesAuthor && !matchesDesc && !matchesPraise) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // 4. Privacy Filter
      if (selectedPrivacy !== 'all' && p.privacy !== selectedPrivacy) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [prayers, activeTab, searchTerm, selectedCategory, selectedPrivacy, selectedStatus, user?.id]);

  const getPrivacyAccessLabel = () => {
    if (['super_admin', 'pastor', 'church_admin'].includes(currentRole || '')) {
      return {
        label: 'Full Pastoral Oversight',
        desc: 'You have full access to Church-wide, Prayer Team, Pastor Only, and Private prayers.',
        badgeVariant: 'emerald' as const,
      };
    }
    if (currentRole === 'ministry_leader' || currentRole === 'volunteer') {
      return {
        label: 'Prayer Team & Ministry Access',
        desc: 'You have access to Church-wide, Prayer Team, and requests assigned to your team.',
        badgeVariant: 'purple' as const,
      };
    }
    return {
      label: 'Congregational Access',
      desc: 'You have access to public Church-wide prayers and your own submitted requests.',
      badgeVariant: 'secondary' as const,
    };
  };

  const privacyAccess = getPrivacyAccessLabel();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-600 fill-rose-600" />
            Prayer Wall & Spiritual Care
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intercessory prayer requests, answered praise reports, and pastoral care prayer chains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadPrayers}
            className="h-9 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingPrayer(null);
              setFormMode('create');
              setIsFormDialogOpen(true);
            }}
            className="h-9 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Submit Prayer Request
          </Button>
        </div>
      </div>

      {/* Role & Privacy Access Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-sky-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {privacyAccess.label}:
            </span>{' '}
            <span className="text-slate-500 dark:text-slate-400">
              {privacyAccess.desc}
            </span>
          </div>
        </div>
        <Badge variant={privacyAccess.badgeVariant} className="text-[10px] w-fit">
          Role: {currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'MEMBER'}
        </Badge>
      </div>

      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card
          onClick={() => {
            setActiveTab('active');
            setSelectedStatus('new');
          }}
          className="cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-all border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">New Requests</span>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalNew}</p>
            <span className="text-[10px] text-slate-400">Pending review / prayer</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('active')}
          className="cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Active Prayers</span>
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalActive}</p>
            <span className="text-[10px] text-slate-400">In prayer chain</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('answered')}
          className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition-all border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Answered Prayers</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalAnswered}</p>
            <span className="text-[10px] text-slate-400">Praise reports & testimonies</span>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('assigned')}
          className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition-all"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Assigned to Me</span>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.assignedToMe}</p>
            <span className="text-[10px] text-slate-400">Pastoral care / intercession</span>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1 border-rose-100 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Prayers Offered</span>
              <Heart className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.totalPrayersCount}</p>
            <span className="text-[10px] text-slate-400">Total congregation intercessions</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="grid grid-cols-5 w-full md:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">All ({prayers.length})</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Active ({stats.totalActive})</TabsTrigger>
              <TabsTrigger value="answered" className="text-xs">Answered ({stats.totalAnswered})</TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs">Assigned to Me ({stats.assignedToMe})</TabsTrigger>
              <TabsTrigger value="my_requests" className="text-xs">My Requests</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1.5 self-end">
              <Button
                size="icon"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'table' ? 'default' : 'outline'}
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Tabs>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Search input */}
          <div className="sm:col-span-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, or keyword..."
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Category: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRAYER_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Filter */}
          <div className="sm:col-span-3">
            <Select value={selectedPrivacy} onValueChange={setSelectedPrivacy}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Privacy: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Privacy Tiers</SelectItem>
                {PRAYER_PRIVACY_LEVELS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PRAYER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-rose-600" />
          Loading prayer requests...
        </div>
      ) : filteredPrayers.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-10 w-10 text-rose-500" />}
          title={
            searchTerm || selectedCategory !== 'all' || selectedPrivacy !== 'all' || selectedStatus !== 'all'
              ? 'No matching prayer requests found'
              : 'No prayer requests recorded yet'
          }
          description="Submit a request to mobilize the congregation and intercessory prayer network."
          actionLabel="Submit Prayer Request"
          onAction={() => {
            setEditingPrayer(null);
            setFormMode('create');
            setIsFormDialogOpen(true);
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onView={(p) => {
                setSelectedPrayerDetail(p);
                setIsDetailModalOpen(true);
              }}
              onTogglePray={handleTogglePray}
              onAddNote={(p) => {
                setNotePrayer(p);
                setIsNoteDialogOpen(true);
              }}
              onMarkAnswered={(p) => {
                setAnsweredPrayer(p);
                setIsAnsweredDialogOpen(true);
              }}
              onAssign={(p) => {
                setAssignPrayer(p);
                setIsAssignDialogOpen(true);
              }}
              onEdit={(p) => {
                setEditingPrayer(p);
                setFormMode('edit');
                setIsFormDialogOpen(true);
              }}
              onDelete={handleDelete}
              currentUserRole={currentRole}
              currentUserId={user?.id}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3 pl-4">Title & Topic</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Privacy</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted by</th>
                  <th className="p-3">Assigned to</th>
                  <th className="p-3">Prayers</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPrayers.map((prayer) => {
                  const statusMeta = PRAYER_STATUSES.find((s) => s.value === prayer.status) || PRAYER_STATUSES[0];
                  const privacyMeta = PRAYER_PRIVACY_LEVELS.find((p) => p.value === prayer.privacy) || PRAYER_PRIVACY_LEVELS[0];
                  const hasPrayed = user?.id && prayer.prayed_user_ids?.includes(user.id);

                  return (
                    <tr
                      key={prayer.id}
                      onClick={() => {
                        setSelectedPrayerDetail(prayer);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {prayer.title}
                      </td>
                      <td className="p-3 text-slate-500 capitalize">{prayer.category.replace('_', ' ')}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {privacyMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusMeta.badgeVariant} className="text-[10px]">
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{prayer.author_name}</td>
                      <td className="p-3 text-slate-500">
                        {prayer.assigned_profile?.display_name || prayer.assigned_ministry?.name || 'Unassigned'}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePray(prayer.id);
                          }}
                          className={`h-6 px-1.5 text-xs gap-1 ${hasPrayed ? 'text-rose-600 font-bold' : 'text-slate-600'}`}
                        >
                          <Heart className={`h-3 w-3 ${hasPrayed ? 'fill-rose-600' : ''}`} />
                          {prayer.prayer_count || 0}
                        </Button>
                      </td>
                      <td className="p-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-sky-600"
                          onClick={() => {
                            setSelectedPrayerDetail(prayer);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Prayer Form Dialog */}
      <PrayerFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingPrayer}
        mode={formMode}
        currentUserName={profile?.display_name || ''}
        currentUserEmail={profile?.email || ''}
        currentUserId={user?.id}
      />

      {/* Detailed Prayer Modal */}
      <PrayerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPrayerDetail(null);
        }}
        prayer={selectedPrayerDetail}
        onTogglePray={handleTogglePray}
        onAddNote={handleAddNote}
        onMarkAnswered={handleMarkAnswered}
        onAssign={handleAssign}
        onChangeStatus={handleChangeStatus}
        onChangePrivacy={handleChangePrivacy}
        onEdit={(p) => {
          setIsDetailModalOpen(false);
          setEditingPrayer(p);
          setFormMode('edit');
          setIsFormDialogOpen(true);
        }}
        onDelete={handleDelete}
        onCreateFollowUp={handleCreateFollowUpFromPrayer}
        currentUserRole={currentRole}
        currentUserId={user?.id}
      />

      {/* Quick Add Note Dialog */}
      {notePrayer && (
        <PrayerNoteDialog
          isOpen={isNoteDialogOpen}
          onClose={() => {
            setIsNoteDialogOpen(false);
            setNotePrayer(null);
          }}
          onAddNote={async (noteText) => {
            await handleAddNote(notePrayer.id, noteText);
          }}
          prayerTitle={notePrayer.title}
        />
      )}

      {/* Quick Mark Answered Dialog */}
      {answeredPrayer && (
        <MarkAnsweredDialog
          isOpen={isAnsweredDialogOpen}
          onClose={() => {
            setIsAnsweredDialogOpen(false);
            setAnsweredPrayer(null);
          }}
          onConfirm={async (praiseText) => {
            await handleMarkAnswered(answeredPrayer.id, praiseText);
          }}
          prayerTitle={answeredPrayer.title}
        />
      )}

      {/* Quick Assign Dialog */}
      {assignPrayer && (
        <AssignPrayerDialog
          isOpen={isAssignDialogOpen}
          onClose={() => {
            setIsAssignDialogOpen(false);
            setAssignPrayer(null);
          }}
          onAssign={async (assignedTo, assignedTeamId) => {
            await handleAssign(assignPrayer.id, assignedTo, assignedTeamId);
          }}
          prayerTitle={assignPrayer.title}
          initialAssignedTo={assignPrayer.assigned_to}
          initialAssignedTeamId={assignPrayer.assigned_team_id}
        />
      )}

      {/* Linked Follow-up Creation Dialog */}
      {isFollowUpDialogOpen && (
        <FollowUpFormDialog
          isOpen={isFollowUpDialogOpen}
          onClose={() => {
            setIsFollowUpDialogOpen(false);
            setLinkedPrayerForFollowUp(null);
          }}
          onSave={async (fuPayload) => {
            await followUpService.createFollowUp(churchId, fuPayload as CreateFollowUpPayload);
            toast.success('Pastoral care follow-up ticket created from prayer request.');
          }}
          mode="create"
          currentUserId={user?.id}
          defaultMemberId={linkedPrayerForFollowUp?.member_id || undefined}
          defaultPrayerRequestId={linkedPrayerForFollowUp?.id || undefined}
        />
      )}
    </div>
  );
}
export default PrayerRequestsPage;
