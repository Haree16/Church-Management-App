import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Child,
  ChildrenClass,
} from '@/types/database';
import {
  childrenService,
  CreateChildPayload,
  UpdateChildPayload,
} from '@/services/childrenService';
import { ChildFormDialog } from '@/components/children/ChildFormDialog';
import { ChildDetailModal } from '@/components/children/ChildDetailModal';
import { ChildCheckInDialog } from '@/components/children/ChildCheckInDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import {
  Baby,
  Plus,
  Search,
  Shield,
  AlertTriangle,
  School,
  UserCheck,
  Phone,
  RefreshCw,
  Lock,
  User,
  Heart,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export function ChildrenPage() {
  const { activeChurch, currentRole, user } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [classes, setClasses] = useState<ChildrenClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedChildDetail, setSelectedChildDetail] = useState<Child | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [checkInChildTarget, setCheckInChildTarget] = useState<Child | null>(null);

  const canManage = ['super_admin', 'church_admin', 'pastor', 'ministry_leader'].includes(currentRole || '');
  const canAccessChildren = ['super_admin', 'church_admin', 'pastor', 'ministry_leader', 'group_leader', 'volunteer'].includes(currentRole || '');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kids, cls] = await Promise.all([
        childrenService.getChildren(churchId, currentRole, user?.id),
        childrenService.getClasses(churchId),
      ]);
      setChildrenList(kids);
      setClasses(cls);

      if (selectedChildDetail) {
        const refreshed = kids.find((k) => k.id === selectedChildDetail.id);
        if (refreshed) setSelectedChildDetail(refreshed);
      }
    } catch (e) {
      console.error('Failed to load children data:', e);
      toast.error('Failed to load children records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId, currentRole, user?.id]);

  const handleSaveChild = async (payload: CreateChildPayload | UpdateChildPayload) => {
    if (formMode === 'create') {
      await childrenService.createChild(churchId, payload as CreateChildPayload);
    } else if (editingChild) {
      await childrenService.updateChild(churchId, editingChild.id, payload as UpdateChildPayload);
    }
    await loadData();
  };

  const handleDeleteChild = async (id: string) => {
    await childrenService.deleteChild(churchId, id);
    toast.info('Child record deleted.');
    if (selectedChildDetail?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedChildDetail(null);
    }
    await loadData();
  };

  const handleConfirmCheckIn = async (childId: string, classId: string, checkedInBy: string, notes?: string) => {
    await childrenService.checkInChild(churchId, childId, classId, checkedInBy, notes);
    await loadData();
  };

  const calculateAge = (dob: string) => {
    try {
      const birth = new Date(dob);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        years--;
      }
      if (years === 0) {
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        return `${Math.max(1, months)} mos`;
      }
      return `${years} yrs`;
    } catch {
      return '';
    }
  };

  const filteredChildren = useMemo(() => {
    return childrenList.filter((c) => {
      if (selectedClassId !== 'all' && c.class_id !== selectedClassId) {
        return false;
      }

      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const matchesName = c.child_name.toLowerCase().includes(t);
        const matchesParent = (c.parent_name || '').toLowerCase().includes(t);
        const matchesAllergies = (c.allergies_medical_notes || '').toLowerCase().includes(t);
        const matchesPin = (c.security_pin || '').toLowerCase().includes(t);
        if (!matchesName && !matchesParent && !matchesAllergies && !matchesPin) return false;
      }

      return true;
    });
  }, [childrenList, selectedClassId, searchTerm]);

  // Strict Privacy Notice for unauthorized members
  if (!canAccessChildren && childrenList.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-12 text-center space-y-3">
          <Lock className="h-10 w-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Protected Children Ministry Records
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Child and youth safety records are strictly protected under church child-protection policies. Only verified parents and authorized ministry leaders may access roster details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Baby className="h-6 w-6 text-emerald-600" />
            Children's Ministry (Kids Kingdom)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure child registration, security check-in PIN badges, classroom rosters, and medical/allergy safety tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/children/classes">
            <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
              <School className="h-4 w-4" />
              Manage Classrooms ({classes.length})
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCheckInChildTarget(null);
              setIsCheckInDialogOpen(true);
            }}
            className="h-9 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 bg-emerald-50/40 font-semibold"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Check-In Station
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditingChild(null);
                setFormMode('create');
                setIsFormDialogOpen(true);
              }}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Register Child
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Enrolled Children</span>
              <Baby className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {childrenList.length}
            </p>
            <span className="text-[10px] text-slate-400">Registered Kids Kingdom members</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Classrooms</span>
              <School className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {classes.length}
            </p>
            <span className="text-[10px] text-slate-400">Nursery, Toddlers, Pre-K, Champions</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medical / Allergy Alerts</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
              {childrenList.filter((c) => c.allergies_medical_notes).length}
            </p>
            <span className="text-[10px] text-slate-400">Children with active alerts</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Protected Security PINs</span>
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {childrenList.filter((c) => c.security_pin).length}
            </p>
            <span className="text-[10px] text-slate-400">100% Encrypted pickup tags</span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search child name, parent, allergy, or security PIN..."
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-800"
            />
          </div>

          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="h-8 text-xs w-48 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Classroom: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classrooms</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={loadData}
          className="h-8 text-xs gap-1 self-end sm:self-center"
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Children Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Loading children records...
        </div>
      ) : filteredChildren.length === 0 ? (
        <EmptyState
          icon={<Baby className="h-10 w-10 text-emerald-600" />}
          title="No children found"
          description="Register children to manage classrooms, security pickup codes, and allergy tags."
          actionLabel={canManage ? 'Register Child' : undefined}
          onAction={canManage ? () => {
            setEditingChild(null);
            setFormMode('create');
            setIsFormDialogOpen(true);
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child) => (
            <Card
              key={child.id}
              onClick={() => {
                setSelectedChildDetail(child);
                setIsDetailModalOpen(true);
              }}
              className="transition-all hover:shadow-md cursor-pointer border border-slate-200 dark:border-slate-800 relative overflow-hidden"
            >
              {child.allergies_medical_notes && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {child.first_name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {child.child_name}
                      </CardTitle>
                      <span className="text-[10px] text-slate-400">
                        {calculateAge(child.date_of_birth)} • {child.gender}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800">
                    {child.security_pin || 'PIN'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* Classroom badge */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500 font-medium">Class:</span>
                  <Badge variant="emerald" className="text-[10px]">
                    {child.class_name || 'Unassigned'}
                  </Badge>
                </div>

                {/* Parent info */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Parent:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                    {child.parent_name || 'Guardian'}
                  </span>
                </div>

                {/* Allergy alert pill if present */}
                {child.allergies_medical_notes && (
                  <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-[10px] flex items-center gap-1.5 truncate">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
                    <span className="truncate">{child.allergies_medical_notes}</span>
                  </div>
                )}

                {/* Action Footer */}
                <div
                  className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-500 hover:text-slate-900"
                    onClick={() => {
                      setSelectedChildDetail(child);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                    onClick={() => {
                      setCheckInChildTarget(child);
                      setIsCheckInDialogOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Check-In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Modals */}
      <ChildFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleSaveChild}
        classes={classes}
        initialData={editingChild}
        mode={formMode}
      />

      <ChildDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedChildDetail(null);
        }}
        child={selectedChildDetail}
        onEdit={(ch) => {
          setIsDetailModalOpen(false);
          setEditingChild(ch);
          setFormMode('edit');
          setIsFormDialogOpen(true);
        }}
        onDelete={handleDeleteChild}
        onCheckIn={(ch) => {
          setCheckInChildTarget(ch);
          setIsCheckInDialogOpen(true);
        }}
        canManage={canManage}
      />

      <ChildCheckInDialog
        isOpen={isCheckInDialogOpen}
        onClose={() => {
          setIsCheckInDialogOpen(false);
          setCheckInChildTarget(null);
        }}
        childrenList={childrenList}
        classes={classes}
        onConfirmCheckIn={handleConfirmCheckIn}
        preselectedChild={checkInChildTarget}
      />
    </div>
  );
}
export default ChildrenPage;
