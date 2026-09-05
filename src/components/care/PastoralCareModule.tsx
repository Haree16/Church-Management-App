import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  PastoralCare,
  PastoralCareLog,
  PastoralCareType,
  PastoralCareStage,
  PastoralCareConfidentiality,
  FollowUpPriority,
} from '@/types/database';
import {
  pastoralCareService,
  PASTORAL_CARE_TYPES,
  PASTORAL_STAGES,
  CONFIDENTIALITY_LEVELS,
  CreatePastoralCarePayload,
  UpdatePastoralCarePayload,
} from '@/services/pastoralCareService';
import { PastoralCareFormModal } from './PastoralCareFormModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HeartHandshake,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Lock,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Filter,
  Trash2,
  Edit3,
  Phone,
  Mail,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface PastoralCareModuleProps {
  personId?: string | null;
  personName?: string | null;
}

export const PastoralCareModule: React.FC<PastoralCareModuleProps> = ({ personId, personName }) => {
  const { activeChurch, currentRole, user } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [cases, setCases] = useState<PastoralCare[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<PastoralCare | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Log Addition Drawer/Modal State
  const [activeLogCaseId, setActiveLogCaseId] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState('');
  const [logMethod, setLogMethod] = useState<string>('in_person');
  const [logNextAction, setLogNextAction] = useState('');
  const [logNextActionDate, setLogNextActionDate] = useState('');

  // Selected Detail Case
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await pastoralCareService.getPastoralCareCases(churchId, currentRole, user?.id, personId);
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load pastoral care cases:', err);
      toast.error('Failed to load pastoral care records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [churchId, currentRole, user?.id, personId]);

  const handleCreateOrUpdateCase = async (payload: CreatePastoralCarePayload | UpdatePastoralCarePayload) => {
    if (modalMode === 'create') {
      await pastoralCareService.createPastoralCareCase(churchId, payload as CreatePastoralCarePayload);
    } else if (editingCase) {
      await pastoralCareService.updatePastoralCareCase(churchId, editingCase.id, payload as UpdatePastoralCarePayload);
    }
    await loadCases();
  };

  const handleAddLogSubmit = async (caseId: string) => {
    if (!logNotes.trim()) {
      toast.error('Please enter interaction notes.');
      return;
    }

    try {
      await pastoralCareService.addPastoralLog(churchId, {
        pastoral_care_id: caseId,
        contact_method: logMethod,
        notes: logNotes.trim(),
        author_id: user?.id,
        author_name: user?.email?.split('@')[0] || 'Pastoral Caregiver',
        author_role: currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'Pastoral Care',
        next_action: logNextAction.trim() || null,
        next_action_date: logNextActionDate || null,
      });
      toast.success('Pastoral care interaction logged.');
      setLogNotes('');
      setLogNextAction('');
      setLogNextActionDate('');
      setActiveLogCaseId(null);
      await loadCases();
    } catch (err) {
      console.error('Failed to add log:', err);
      toast.error('Failed to save interaction note.');
    }
  };

  const handleCloseCase = async (caseId: string) => {
    try {
      await pastoralCareService.closePastoralCareCase(churchId, caseId);
      toast.success('Pastoral care record marked as completed/resolved.');
      await loadCases();
    } catch (err) {
      toast.error('Failed to close record.');
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('Are you sure you want to remove this confidential pastoral record?')) {
      await pastoralCareService.deletePastoralCareCase(churchId, caseId);
      toast.info('Record deleted.');
      if (selectedCaseId === caseId) setSelectedCaseId(null);
      await loadCases();
    }
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (selectedType !== 'all' && c.care_type !== selectedType) return false;
      if (selectedStage !== 'all' && c.stage !== selectedStage) return false;
      if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = c.person_name.toLowerCase().includes(term);
        const matchesSummary = c.summary.toLowerCase().includes(term);
        const matchesAssigned = (c.assigned_to_name || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSummary && !matchesAssigned) return false;
      }

      return true;
    });
  }, [cases, selectedType, selectedStage, selectedPriority, searchTerm]);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || filteredCases[0] || null;
  }, [cases, selectedCaseId, filteredCases]);

  const stats = useMemo(() => {
    const totalActive = cases.filter((c) => c.stage !== 'resolved' && c.stage !== 'referred').length;
    const totalUrgent = cases.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;
    const totalSafeguarding = cases.filter((c) => c.safeguarding_flag).length;
    const totalResolved = cases.filter((c) => c.stage === 'resolved').length;
    return { totalActive, totalUrgent, totalSafeguarding, totalResolved };
  }, [cases]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Confidential Warning */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Pastoral Care & Support</h2>
              <Badge variant="outline" className="bg-purple-950 text-purple-300 border-purple-700 text-[10px]">
                <Lock className="w-3 h-3 mr-1 text-purple-400" /> Confidential
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Compassionate, secure pastoral oversight for church members, hospital visits, counseling & care.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setModalMode('create');
            setEditingCase(null);
            setIsModalOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-900/30 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Open Pastoral Case
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Active Care Cases</p>
              <p className="text-xl font-extrabold text-purple-400 mt-0.5">{stats.totalActive}</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">High / Urgent Priority</p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">{stats.totalUrgent}</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Safeguarding Flags</p>
              <p className="text-xl font-extrabold text-rose-400 mt-0.5">{stats.totalSafeguarding}</p>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Resolved Cases</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats.totalResolved}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by person name, summary, caregiver..."
            className="pl-9 bg-slate-800 border-slate-700 text-white text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue placeholder="Care Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
              <SelectItem value="all">All Care Types</SelectItem>
              {PASTORAL_CARE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
              <SelectItem value="all">All Stages</SelectItem>
              {PASTORAL_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[130px] bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Split Content View */}
      {filteredCases.length === 0 ? (
        <Card className="bg-slate-900 border-dashed border-slate-800 text-center p-8 text-slate-400">
          <HeartHandshake className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="font-bold text-white text-sm">No Pastoral Care Records Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'No cases match your active filters.' : 'Click "Open Pastoral Case" to create a new confidential care record.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Case Cards List */}
          <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = activeCase?.id === c.id;
              const confObj = CONFIDENTIALITY_LEVELS.find((cl) => cl.value === c.confidentiality_level);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-purple-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{c.person_name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                          {c.person_type === 'visitor' ? 'Visitor' : 'Member'}
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-300 font-semibold mt-0.5 capitalize">
                        {c.care_type.replace('_', ' ')}
                      </p>
                    </div>

                    <Badge
                      className={`text-[9px] px-2 py-0.5 ${
                        c.priority === 'urgent'
                          ? 'bg-rose-500 text-white'
                          : c.priority === 'high'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">{c.summary}</p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                      {c.assigned_to_name || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {c.safeguarding_flag && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-500/20 text-rose-300 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/30">
                      <ShieldAlert className="w-3 h-3 text-rose-400" /> Safeguarding
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Case Details & Timeline Logs */}
          <div className="lg:col-span-7">
            {activeCase ? (
              <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden">
                {/* Detail Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{activeCase.person_name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-purple-950 text-purple-300 border-purple-800">
                          <Lock className="w-3 h-3 mr-1" /> {activeCase.confidentiality_level.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-400 font-semibold mt-0.5">
                        {PASTORAL_CARE_TYPES.find((t) => t.value === activeCase.care_type)?.label || activeCase.care_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCase(activeCase);
                          setModalMode('edit');
                          setIsModalOpen(true);
                        }}
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs h-8"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCase(activeCase.id)}
                        className="h-8 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Summary & Contact */}
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-200">Pastoral Summary:</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeCase.summary}</p>
                  </div>

                  {/* Private Notes (Pastoral Staff Only) */}
                  {activeCase.private_notes && (
                    <div className="bg-purple-950/30 border border-purple-900/50 p-3 rounded-xl space-y-1">
                      <p className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-purple-400" /> Confidential Pastoral Notes:
                      </p>
                      <p className="text-xs text-purple-100 whitespace-pre-wrap leading-relaxed">{activeCase.private_notes}</p>
                    </div>
                  )}

                  {/* Safeguarding Alert */}
                  {activeCase.safeguarding_flag && (
                    <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-300">Safeguarding Flag Activated</p>
                        <p className="text-[11px] text-rose-200/90 mt-0.5">{activeCase.safeguarding_notes || 'High risk awareness protocol active.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Meta Details Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Assigned Caregiver:</span>
                      <strong className="text-white">{activeCase.assigned_to_name || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Current Stage:</span>
                      <strong className="text-purple-300 capitalize">{activeCase.stage.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Scheduled Follow-up:</span>
                      <strong className="text-amber-300">{activeCase.due_date || 'None set'}</strong>
                    </div>
                  </div>
                </div>

                {/* Timeline Interaction History */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Pastoral Care Interaction History ({activeCase.logs?.length || 0})
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => setActiveLogCaseId(activeCase.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold h-7 px-3 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Log Note
                    </Button>
                  </div>

                  {/* Log Addition Form (Inlined) */}
                  {activeLogCaseId === activeCase.id && (
                    <div className="p-4 bg-slate-800 rounded-2xl border border-purple-500/40 space-y-3 animate-in fade-in">
                      <h5 className="text-xs font-bold text-purple-300">Record New Pastoral Interaction</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Select value={logMethod} onValueChange={setLogMethod}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs">
                            <SelectValue placeholder="Contact Method" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            <SelectItem value="in_person">In-Person Visit</SelectItem>
                            <SelectItem value="phone_call">Phone Call</SelectItem>
                            <SelectItem value="hospital_visit">Hospital Visit</SelectItem>
                            <SelectItem value="home_visit">Home Visit</SelectItem>
                            <SelectItem value="video_call">Video Call</SelectItem>
                            <SelectItem value="text_sms">Text / Messaging</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="date"
                          value={logNextActionDate}
                          onChange={(e) => setLogNextActionDate(e.target.value)}
                          placeholder="Next Action Date"
                          className="bg-slate-900 border-slate-700 text-white text-xs"
                        />
                      </div>

                      <textarea
                        value={logNotes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLogNotes(e.target.value)}
                        placeholder="Detail the pastoral conversation, intercessory prayer offered, and outcome..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 rounded-xl outline-none"
                      />

                      <Input
                        value={logNextAction}
                        onChange={(e) => setLogNextAction(e.target.value)}
                        placeholder="Next pastoral action item (e.g. Follow-up phone call next week)"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveLogCaseId(null)}
                          className="text-slate-400 hover:text-white text-xs h-7"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddLogSubmit(activeCase.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold h-7"
                        >
                          Save Log Entry
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Logs list */}
                  {(!activeCase.logs || activeCase.logs.length === 0) ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      No pastoral interactions recorded yet. Click "Add Log Note" above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeCase.logs.map((log) => (
                        <div key={log.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-300 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                              {log.author_name} ({log.author_role || 'Pastoral Team'})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.contact_date).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{log.notes}</p>
                          {log.next_action && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center gap-2 text-[11px] text-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Next Action: <strong>{log.next_action}</strong></span>
                              {log.next_action_date && <span className="text-slate-500">({log.next_action_date})</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Close Case Button */}
                  {activeCase.stage !== 'resolved' && (
                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleCloseCase(activeCase.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Pastoral Care Completed
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-500">
                Select a pastoral care case to view full interaction details.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Pastoral Care Form Modal */}
      <PastoralCareFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateCase}
        initialData={editingCase}
        mode={modalMode}
        prefilledPerson={personName ? { name: personName, id: personId || undefined } : null}
      />
    </div>
  );
};
