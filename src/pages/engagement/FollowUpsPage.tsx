import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FollowUp,
  FollowUpType,
  FollowUpStatus,
  FollowUpPriority,
} from '@/types/database';
import {
  followUpService,
  CreateFollowUpPayload,
  UpdateFollowUpPayload,
  AddFollowUpHistoryPayload,
  FOLLOW_UP_TYPES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUSES,
} from '@/services/followUpService';
import { FollowUpRowCard } from '@/components/followups/FollowUpRowCard';
import { FollowUpFormDialog } from '@/components/followups/FollowUpFormDialog';
import { FollowUpDetailModal } from '@/components/followups/FollowUpDetailModal';
import { FollowUpHistoryDialog } from '@/components/followups/FollowUpHistoryDialog';
import { CompleteFollowUpDialog } from '@/components/followups/CompleteFollowUpDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { DEMO_USERS } from '@/lib/mockData';
import {
  MessageSquare,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  UserCheck,
  RefreshCw,
  Download,
  Filter,
  Users,
  LayoutGrid,
  List as ListIcon,
  Shield,
  HeartPulse,
} from 'lucide-react';
import { toast } from 'sonner';

export function FollowUpsPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedFollowUpDetail, setSelectedFollowUpDetail] = useState<FollowUp | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [historyFollowUp, setHistoryFollowUp] = useState<FollowUp | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const data = await followUpService.getFollowUps(churchId, currentRole, user?.id);
      setFollowUps(data);

      if (selectedFollowUpDetail) {
        const refreshed = data.find((f) => f.id === selectedFollowUpDetail.id);
        if (refreshed) setSelectedFollowUpDetail(refreshed);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      toast.error('Failed to fetch pastoral care follow-ups.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [churchId, currentRole, user?.id]);

  // Handlers
  const handleCreateOrUpdate = async (payload: CreateFollowUpPayload | UpdateFollowUpPayload) => {
    if (formMode === 'create') {
      await followUpService.createFollowUp(churchId, payload as CreateFollowUpPayload);
    } else if (editingFollowUp) {
      await followUpService.updateFollowUp(churchId, editingFollowUp.id, payload as UpdateFollowUpPayload);
    }
    await loadFollowUps();
  };

  const handleAddHistory = async (historyPayload: AddFollowUpHistoryPayload) => {
    await followUpService.addFollowUpHistory(churchId, historyPayload);
    await loadFollowUps();
  };

  const handleComplete = async (followUpId: string, outcome: string, notes?: string) => {
    await followUpService.completeFollowUp(churchId, followUpId, outcome, notes);
    await loadFollowUps();
  };

  const handleChangeStatus = async (followUpId: string, status: FollowUpStatus) => {
    await followUpService.updateFollowUp(churchId, followUpId, { status });
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
    await loadFollowUps();
  };

  const handleChangePriority = async (followUpId: string, priority: FollowUpPriority) => {
    await followUpService.updateFollowUp(churchId, followUpId, { priority });
    toast.success(`Priority updated to ${priority}`);
    await loadFollowUps();
  };

  const handleDelete = async (followUpId: string) => {
    await followUpService.deleteFollowUp(churchId, followUpId);
    toast.info('Follow-up ticket deleted.');
    if (selectedFollowUpDetail?.id === followUpId) {
      setIsDetailModalOpen(false);
      setSelectedFollowUpDetail(null);
    }
    await loadFollowUps();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredFollowUps.length === 0) {
      toast.error('No follow-up records to export.');
      return;
    }

    const headers = ['Title', 'Person', 'Type', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Completed At', 'Outcome'];
    const rows = filteredFollowUps.map((f) => [
      `"${(f.title || '').replace(/"/g, '""')}"`,
      `"${(f.person_name || '').replace(/"/g, '""')}"`,
      `"${f.type}"`,
      `"${f.priority}"`,
      `"${f.status}"`,
      `"${f.due_date || ''}"`,
      `"${f.assigned_profile?.display_name || ''}"`,
      `"${f.completed_at || ''}"`,
      `"${(f.outcome || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pastoral_care_followups_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Pastoral care report exported as CSV.');
  };

  // KPIs
  const metrics = useMemo(() => {
    return followUpService.computeDashboardMetrics(followUps, user?.id);
  }, [followUps, user?.id]);

  const today = new Date().toISOString().split('T')[0];

  // Filtered list
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      // 1. Tab Filter
      if (activeTab === 'my_pending' && (!user?.id || f.assigned_to !== user.id || f.status === 'completed' || f.status === 'cancelled')) {
        return false;
      }
      if (activeTab === 'overdue' && (f.status === 'completed' || f.status === 'cancelled' || !f.due_date || f.due_date >= today)) {
        return false;
      }
      if (activeTab === 'due_today' && (f.status === 'completed' || f.status === 'cancelled' || f.due_date !== today)) {
        return false;
      }
      if (activeTab === 'high_priority' && (f.priority !== 'high' && f.priority !== 'urgent')) {
        return false;
      }
      if (activeTab === 'completed' && f.status !== 'completed') {
        return false;
      }

      // 2. Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = (f.title || '').toLowerCase().includes(term);
        const matchesPerson = (f.person_name || '').toLowerCase().includes(term);
        const matchesNotes = (f.notes || '').toLowerCase().includes(term);
        const matchesOutcome = (f.outcome || '').toLowerCase().includes(term);
        if (!matchesTitle && !matchesPerson && !matchesNotes && !matchesOutcome) return false;
      }

      // 3. Type Filter
      if (selectedType !== 'all' && f.type !== selectedType) {
        return false;
      }

      // 4. Priority Filter
      if (selectedPriority !== 'all' && f.priority !== selectedPriority) {
        return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'all' && f.status !== selectedStatus) {
        return false;
      }

      // 6. Assignee Filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned' && f.assigned_to) return false;
        if (selectedAssignee !== 'unassigned' && f.assigned_to !== selectedAssignee) return false;
      }

      return true;
    });
  }, [followUps, activeTab, searchTerm, selectedType, selectedPriority, selectedStatus, selectedAssignee, user?.id, today]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-sky-600" />
            Pastoral Follow-ups & Care Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visitor integration, hospital visits, counseling appointments, member milestones, and pastoral care history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadFollowUps}
            className="h-9 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingFollowUp(null);
              setFormMode('create');
              setIsFormDialogOpen(true);
            }}
            className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Follow-up Task
          </Button>
        </div>
      </div>

      {/* Top 5 Dashboard Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* 1. My Pending Follow-ups */}
        <Card
          onClick={() => setActiveTab('my_pending')}
          className="cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">My Pending</span>
              <UserCheck className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.myPendingCount}
            </p>
            <span className="text-[10px] text-slate-400">Assigned to my queue</span>
          </CardContent>
        </Card>

        {/* 2. Overdue Follow-ups */}
        <Card
          onClick={() => setActiveTab('overdue')}
          className={`cursor-pointer transition-all border ${
            metrics.overdueCount > 0
              ? 'border-red-300 dark:border-red-900 bg-red-50/20 dark:bg-red-950/20 hover:border-red-400'
              : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                Overdue
                {metrics.overdueCount > 0 && <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />}
              </span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {metrics.overdueCount}
            </p>
            <span className="text-[10px] text-slate-400">Past target due date</span>
          </CardContent>
        </Card>

        {/* 3. Due Today */}
        <Card
          onClick={() => setActiveTab('due_today')}
          className="cursor-pointer hover:border-amber-300 dark:hover:border-amber-800 transition-all border-amber-100 dark:border-amber-950 bg-amber-50/20 dark:bg-amber-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Due Today</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.dueTodayCount}
            </p>
            <span className="text-[10px] text-slate-400">Scheduled for today</span>
          </CardContent>
        </Card>

        {/* 4. High-priority & Urgent */}
        <Card
          onClick={() => setActiveTab('high_priority')}
          className="cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-all border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">High & Urgent</span>
              <AlertTriangle className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.highPriorityCount}
            </p>
            <span className="text-[10px] text-slate-400">Requires swift care</span>
          </CardContent>
        </Card>

        {/* 5. Completed This Week */}
        <Card
          onClick={() => setActiveTab('completed')}
          className="col-span-2 sm:col-span-1 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition-all border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10"
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Completed This Week</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metrics.completedThisWeekCount}
            </p>
            <span className="text-[10px] text-slate-400">Care outcomes resolved</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="grid grid-cols-6 w-full md:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">All ({followUps.length})</TabsTrigger>
              <TabsTrigger value="my_pending" className="text-xs">My Pending ({metrics.myPendingCount})</TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs">Overdue ({metrics.overdueCount})</TabsTrigger>
              <TabsTrigger value="due_today" className="text-xs">Due Today ({metrics.dueTodayCount})</TabsTrigger>
              <TabsTrigger value="high_priority" className="text-xs">High Priority ({metrics.highPriorityCount})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1.5 self-end">
              <Button
                size="icon"
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                className="h-8 w-8"
                onClick={() => setViewMode('cards')}
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

        {/* Filter Controls */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Search */}
          <div className="sm:col-span-3 relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search person, title, notes..."
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Care Types</SelectItem>
                {FOLLOW_UP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Priority: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {FOLLOW_UP_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label} Priority
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
                {FOLLOW_UP_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="sm:col-span-2">
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                <SelectValue placeholder="Assignee: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {DEMO_USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
          Loading pastoral care tickets...
        </div>
      ) : filteredFollowUps.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10 text-sky-600" />}
          title={
            searchTerm || selectedType !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all'
              ? 'No matching pastoral follow-ups found'
              : 'No follow-up tasks recorded yet'
          }
          description="Create follow-up tasks to ensure hospital visits, visitors, counseling, and spiritual milestones are tended to."
          actionLabel="Create Follow-up Task"
          onAction={() => {
            setEditingFollowUp(null);
            setFormMode('create');
            setIsFormDialogOpen(true);
          }}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFollowUps.map((followUp) => (
            <FollowUpRowCard
              key={followUp.id}
              followUp={followUp}
              onView={(f) => {
                setSelectedFollowUpDetail(f);
                setIsDetailModalOpen(true);
              }}
              onLogContact={(f) => {
                setHistoryFollowUp(f);
                setIsHistoryDialogOpen(true);
              }}
              onComplete={(f) => {
                setCompletingFollowUp(f);
                setIsCompleteDialogOpen(true);
              }}
              onEdit={(f) => {
                setEditingFollowUp(f);
                setFormMode('edit');
                setIsFormDialogOpen(true);
              }}
              onDelete={handleDelete}
              currentUserRole={currentRole}
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
                  <th className="p-3 pl-4">Task & Subject</th>
                  <th className="p-3">Person</th>
                  <th className="p-3">Care Type</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Staff</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFollowUps.map((followUp) => {
                  const typeMeta = FOLLOW_UP_TYPES.find((t) => t.value === followUp.type) || FOLLOW_UP_TYPES[0];
                  const priorityMeta = FOLLOW_UP_PRIORITIES.find((p) => p.value === followUp.priority) || FOLLOW_UP_PRIORITIES[0];
                  const statusMeta = FOLLOW_UP_STATUSES.find((s) => s.value === followUp.status) || FOLLOW_UP_STATUSES[0];
                  const isOverdue =
                    followUp.status !== 'completed' &&
                    followUp.status !== 'cancelled' &&
                    followUp.due_date &&
                    followUp.due_date < today;

                  return (
                    <tr
                      key={followUp.id}
                      onClick={() => {
                        setSelectedFollowUpDetail(followUp);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {followUp.title}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {followUp.person_name || 'Contact'}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {typeMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={priorityMeta.badgeVariant} className="text-[10px]">
                          {priorityMeta.label}
                        </Badge>
                      </td>
                      <td className={`p-3 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                        {followUp.due_date || 'Not set'}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusMeta.badgeVariant} className="text-[10px]">
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500">
                        {followUp.assigned_profile?.display_name || 'Unassigned'}
                      </td>
                      <td className="p-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {followUp.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              onClick={() => {
                                setCompletingFollowUp(followUp);
                                setIsCompleteDialogOpen(true);
                              }}
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-sky-600"
                            onClick={() => {
                              setSelectedFollowUpDetail(followUp);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Follow-up Create/Edit Dialog */}
      <FollowUpFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleCreateOrUpdate}
        initialData={editingFollowUp}
        mode={formMode}
        currentUserId={user?.id}
      />

      {/* Detailed Modal */}
      <FollowUpDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFollowUpDetail(null);
        }}
        followUp={selectedFollowUpDetail}
        onAddHistory={handleAddHistory}
        onComplete={handleComplete}
        onChangeStatus={handleChangeStatus}
        onChangePriority={handleChangePriority}
        onEdit={(f) => {
          setIsDetailModalOpen(false);
          setEditingFollowUp(f);
          setFormMode('edit');
          setIsFormDialogOpen(true);
        }}
        onDelete={handleDelete}
        currentUserRole={currentRole}
        currentUserId={user?.id}
        currentUserName={profile?.display_name || user?.email?.split('@')[0]}
      />

      {/* History Log Dialog */}
      {historyFollowUp && (
        <FollowUpHistoryDialog
          isOpen={isHistoryDialogOpen}
          onClose={() => {
            setIsHistoryDialogOpen(false);
            setHistoryFollowUp(null);
          }}
          onSaveHistory={handleAddHistory}
          followUpId={historyFollowUp.id}
          defaultPersonName={historyFollowUp.person_name || ''}
          currentUserName={profile?.display_name || user?.email?.split('@')[0]}
          currentUserRole={currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'Pastor'}
          currentUserId={user?.id}
        />
      )}

      {/* Complete Dialog */}
      {completingFollowUp && (
        <CompleteFollowUpDialog
          isOpen={isCompleteDialogOpen}
          onClose={() => {
            setIsCompleteDialogOpen(false);
            setCompletingFollowUp(null);
          }}
          onConfirm={async (outcome, notes) => {
            await handleComplete(completingFollowUp.id, outcome, notes);
          }}
          ticketTitle={completingFollowUp.title}
        />
      )}
    </div>
  );
}
export default FollowUpsPage;
