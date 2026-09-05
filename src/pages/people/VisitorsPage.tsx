import React, { useState, useEffect, useMemo } from 'react';
import { visitorService, CreateVisitorPayload } from '@/services/visitorService';
import { followUpService } from '@/services/followUpService';
import { Visitor, VisitorStatus, FollowUp } from '@/types/database';
import { VisitorFormDialog } from '@/components/people/VisitorFormDialog';
import { ConvertVisitorDialog } from '@/components/people/ConvertVisitorDialog';
import { DuplicatePersonCheckModal } from '@/components/people/DuplicatePersonCheckModal';
import { Visitor360Profile } from '@/components/visitors/Visitor360Profile';
import { VisitorPipelineWidget } from '@/components/visitors/VisitorPipelineWidget';
import { FollowUpQueueView } from '@/components/visitors/FollowUpQueueView';
import { VisitorDashboardView } from '@/components/visitors/VisitorDashboardView';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  AlertTriangle,
  Users,
  LayoutGrid,
  List,
  BarChart2,
  CheckSquare,
  Filter,
  X,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';

type VisitorViewMode = 'dashboard' | 'pipeline' | 'directory' | 'followups';

interface VisitorsPageProps {
  currentChurch?: any;
  currentUser?: any;
}

export function VisitorsPage({ currentChurch: propChurch, currentUser: propUser }: VisitorsPageProps = {}) {
  const auth = useAuth();
  const activeChurch = propChurch || auth?.activeChurch;
  const user = propUser || auth?.user;

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [viewMode, setViewMode] = useState<VisitorViewMode>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Visitor 360 State
  const [selectedVisitor360, setSelectedVisitor360] = useState<Visitor | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [convertingVisitor, setConvertingVisitor] = useState<Visitor | null>(null);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);

  // Duplicate Check Modal State
  const [duplicateMatches, setDuplicateMatches] = useState<{ visitors: Visitor[]; members: any[] } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateVisitorPayload | null>(null);

  const loadData = async () => {
    if (!activeChurch) return;
    setIsLoading(true);
    setError(null);
    try {
      const visitorsData = await visitorService.getVisitors(activeChurch.id);
      const followUpsData = await followUpService.getFollowUps(activeChurch.id);
      setVisitors(visitorsData);
      setFollowUps(followUpsData);
    } catch (err: any) {
      console.error('Failed to load visitor data:', err);
      setError(err.message || 'Failed to load guest records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeChurch]);

  const handleCreateVisitorRequest = async (payload: CreateVisitorPayload) => {
    if (!activeChurch) return;

    // Perform duplicate check
    const matches = await visitorService.checkPossibleDuplicates(activeChurch.id, {
      phone: payload.phone,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
    });

    if (matches.visitors.length > 0 || matches.members.length > 0) {
      setPendingPayload(payload);
      setDuplicateMatches(matches);
      return;
    }

    await proceedWithVisitorCreation(payload);
  };

  const proceedWithVisitorCreation = async (payload: CreateVisitorPayload) => {
    if (!activeChurch) return;
    const created = await visitorService.createVisitor(activeChurch.id, payload);
    setVisitors((prev) => [created, ...prev]);
    toast.success(`Sunday Guest "${payload.first_name} ${payload.last_name}" recorded successfully!`);
    setDuplicateMatches(null);
    setPendingPayload(null);
    loadData();
  };

  const handleUpdateVisitor = async (payload: CreateVisitorPayload) => {
    if (!activeChurch || !editingVisitor) return;
    const updated = await visitorService.updateVisitor(activeChurch.id, editingVisitor.id, payload);
    setVisitors((prev) => prev.map((v) => (v.id === editingVisitor.id ? updated : v)));
    toast.success('Visitor record updated.');
    setEditingVisitor(null);
    if (selectedVisitor360?.id === editingVisitor.id) {
      setSelectedVisitor360(updated);
    }
  };

  const handleStatusChange = async (visitorId: string, newStatus: VisitorStatus) => {
    if (!activeChurch) return;
    try {
      const updated = await visitorService.updateVisitor(activeChurch.id, visitorId, { status: newStatus });
      setVisitors((prev) => prev.map((v) => (v.id === visitorId ? updated : v)));
      toast.success(`Visitor stage updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error('Failed to update stage.');
    }
  };

  const handleConvertVisitor = async (visitorId: string, memberPayload: any) => {
    if (!activeChurch) return;
    await visitorService.convertVisitorToMember(activeChurch.id, visitorId, memberPayload);
    toast.success('Visitor successfully converted to Member!');
    setConvertingVisitor(null);
    loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!activeChurch || !visitorToDelete) return;
    try {
      await visitorService.deleteVisitor(activeChurch.id, visitorToDelete.id);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorToDelete.id));
      toast.success('Visitor record deleted.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete visitor.');
    } finally {
      setVisitorToDelete(null);
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const name = `${v.first_name} ${v.last_name}`.toLowerCase();
      const email = (v.email || '').toLowerCase();
      const phone = (v.phone || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = term === '' || name.includes(term) || email.includes(term) || phone.includes(term);
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchTerm, statusFilter]);

  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">New Guest</span>;
      case 'contact_pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Contact Pending</span>;
      case 'contacted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Contacted</span>;
      case 'follow_up_scheduled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Follow-up Scheduled</span>;
      case 'follow_up_completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Follow-up Completed</span>;
      case 'returned_visitor':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">Returned Visitor</span>;
      case 'regular_attendee':
      case 'regular_attender':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">Regular Attendee</span>;
      case 'became_member':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">Became Member</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header matching ShepherdHub design */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Visitor Management & Follow-up
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Capture Sunday guest cards, automate pastoral care follow-ups, track return visits, and convert guests into covenant members.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>+ Record Sunday Guest</span>
        </button>
      </div>

      {/* Main View Switcher Tabs matching ShepherdHub modules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none max-w-full pb-0.5">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewMode === 'dashboard'
                ? 'bg-slate-900 text-sky-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span>Dashboard & Analytics</span>
          </button>

          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewMode === 'pipeline'
                ? 'bg-slate-900 text-sky-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>Stage Pipeline</span>
          </button>

          <button
            onClick={() => setViewMode('directory')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewMode === 'directory'
                ? 'bg-slate-900 text-sky-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4 shrink-0" />
            <span>Guest Directory ({visitors.length})</span>
          </button>

          <button
            onClick={() => setViewMode('followups')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewMode === 'followups'
                ? 'bg-slate-900 text-sky-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>Follow-ups Queue ({followUps.length})</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {viewMode === 'dashboard' && (
        <VisitorDashboardView
          visitors={visitors}
          followUps={followUps}
          onSelectVisitor={(v) => setSelectedVisitor360(v)}
          onOpenAddVisitor={() => setIsAddOpen(true)}
        />
      )}

      {viewMode === 'pipeline' && (
        <VisitorPipelineWidget
          visitors={visitors}
          onSelectVisitor={(v) => setSelectedVisitor360(v)}
          onStatusChange={handleStatusChange}
        />
      )}

      {viewMode === 'followups' && (
        <FollowUpQueueView
          churchId={activeChurch?.id || ''}
          currentUserId={user?.id}
          onSelectVisitor={(visitorId) => {
            const v = visitors.find((x) => x.id === visitorId);
            if (v) setSelectedVisitor360(v);
          }}
        />
      )}

      {viewMode === 'directory' && (
        <div className="space-y-4">
          {/* Search & Action Bar */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by visitor name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scrollbar-none text-xs -mx-0.5 px-0.5">
              <span className="text-slate-400 font-medium px-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Stage:
              </span>
              {[
                { key: 'ALL', label: 'All Guests' },
                { key: 'new', label: 'New Guest' },
                { key: 'contact_pending', label: 'Contact Pending' },
                { key: 'contacted', label: 'Contacted' },
                { key: 'follow_up_scheduled', label: 'Follow-up Scheduled' },
                { key: 'returned_visitor', label: 'Returned Visitor' },
                { key: 'became_member', label: 'Became Member' },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition ${
                    statusFilter === st.key
                      ? 'bg-slate-900 text-sky-400 border-slate-900 shadow-sm font-extrabold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                Showing <strong className="text-slate-900">{filteredVisitors.length}</strong> of{' '}
                <strong className="text-slate-900">{visitors.length}</strong> recorded guest cards
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading guest records...</div>
            ) : filteredVisitors.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm space-y-3">
                <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No visitors found.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'No visitor records match your selected search or filters.'
                    : 'Get started by recording your first Sunday guest connection!'}
                </p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-4 py-2 bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow hover:bg-sky-700 transition"
                >
                  + Add Visitor Card
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredVisitors.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVisitor360(v)}
                    className="p-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                        {v.first_name?.[0]}
                        {v.last_name?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {v.first_name} {v.last_name}
                          </span>
                          {getStatusBadge(v.status)}
                          {(v.visit_count || 1) > 1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                              🔁 {v.visit_count} Visits
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          {v.phone && <span>📞 {v.phone}</span>}
                          {v.email && <span>✉️ {v.email}</span>}
                          <span>📅 First visit: {v.first_visit_date || v.visit_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedVisitor360(v)}
                        className="px-3 py-1.5 text-xs font-extrabold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition"
                      >
                        View 360° Profile
                      </button>

                      {v.status !== 'became_member' && (
                        <button
                          onClick={() => setConvertingVisitor(v)}
                          className="px-3 py-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Convert
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visitor 360° Modal */}
      {selectedVisitor360 && (
        <Visitor360Profile
          visitor={selectedVisitor360}
          isOpen={!!selectedVisitor360}
          onClose={() => setSelectedVisitor360(null)}
          onUpdate={loadData}
          onConvert={(v) => {
            setSelectedVisitor360(null);
            setConvertingVisitor(v);
          }}
          onEdit={(v) => {
            setSelectedVisitor360(null);
            setEditingVisitor(v);
          }}
        />
      )}

      {/* Add Guest Dialog */}
      <VisitorFormDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleCreateVisitorRequest}
        mode="create"
      />

      {/* Edit Guest Dialog */}
      {editingVisitor && (
        <VisitorFormDialog
          isOpen={!!editingVisitor}
          onClose={() => setEditingVisitor(null)}
          onSave={handleUpdateVisitor}
          initialData={editingVisitor}
          mode="edit"
        />
      )}

      {/* Convert Visitor Dialog */}
      {convertingVisitor && (
        <ConvertVisitorDialog
          isOpen={!!convertingVisitor}
          onClose={() => setConvertingVisitor(null)}
          visitor={convertingVisitor}
          onConvert={handleConvertVisitor}
        />
      )}

      {/* Duplicate Check Modal */}
      {duplicateMatches && (
        <DuplicatePersonCheckModal
          isOpen={!!duplicateMatches}
          onClose={() => {
            setDuplicateMatches(null);
            setPendingPayload(null);
          }}
          duplicates={duplicateMatches}
          onProceedAnyway={() => {
            if (pendingPayload) proceedWithVisitorCreation(pendingPayload);
          }}
          onSelectExistingVisitor={(v) => {
            setDuplicateMatches(null);
            setPendingPayload(null);
            setIsAddOpen(false);
            setSelectedVisitor360(v);
          }}
        />
      )}
    </div>
  );
}
