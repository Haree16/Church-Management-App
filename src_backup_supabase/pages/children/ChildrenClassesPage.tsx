import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChildrenClass, Child, ChildAttendance } from '@/types/database';
import { childrenService, CreateClassPayload, UpdateClassPayload } from '@/services/childrenService';
import { ChildClassFormDialog } from '@/components/children/ChildClassFormDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import {
  School,
  Plus,
  Users,
  DoorOpen,
  Calendar,
  UserCheck,
  Edit2,
  RefreshCw,
  Baby,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export function ChildrenClassesPage() {
  const { activeChurch, currentRole } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [classes, setClasses] = useState<ChildrenClass[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<ChildAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ChildrenClass | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const canManage = ['super_admin', 'church_admin', 'pastor', 'ministry_leader'].includes(currentRole || '');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cls, kids, att] = await Promise.all([
        childrenService.getClasses(churchId),
        childrenService.getChildren(churchId, 'super_admin'),
        childrenService.getTodayAttendance(churchId),
      ]);
      setClasses(cls);
      setChildren(kids);
      setAttendance(att);
    } catch (e) {
      console.error('Failed to load classrooms data:', e);
      toast.error('Failed to load classrooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId]);

  const handleSaveClass = async (payload: CreateClassPayload | UpdateClassPayload) => {
    if (formMode === 'create') {
      await childrenService.createClass(churchId, payload as CreateClassPayload);
    } else if (editingClass) {
      await childrenService.updateClass(churchId, editingClass.id, payload as UpdateClassPayload);
    }
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/children" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <School className="h-6 w-6 text-emerald-600" />
              Children's Ministry Classrooms & Roster
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-7">
            Configure Nursery, Toddlers, Kingdom Kids, and Junior Champions age groups and teaching staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/children">
            <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
              <Baby className="h-4 w-4" />
              All Children ({children.length})
            </Button>
          </Link>

          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditingClass(null);
                setFormMode('create');
                setIsFormDialogOpen(true);
              }}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          )}
        </div>
      </div>

      {/* Classrooms Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Loading classrooms...
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<School className="h-10 w-10 text-emerald-600" />}
          title="No classrooms configured"
          description="Create your first classroom (e.g. Nursery, Toddlers, Kingdom Kids)."
          actionLabel={canManage ? 'Add Class' : undefined}
          onAction={canManage ? () => {
            setEditingClass(null);
            setFormMode('create');
            setIsFormDialogOpen(true);
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {classes.map((cls) => {
            const enrolled = children.filter((c) => c.class_id === cls.id);
            const capacity = cls.max_capacity || 20;
            const percent = Math.min(100, Math.round((enrolled.length / capacity) * 100));

            return (
              <Card key={cls.id} className="border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: cls.color || '#10b981' }} />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-bold"
                      style={{ borderColor: cls.color || '#10b981', color: cls.color || '#10b981' }}
                    >
                      Ages {cls.age_range_min} - {cls.age_range_max} Years
                    </Badge>

                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        onClick={() => {
                          setEditingClass(cls);
                          setFormMode('edit');
                          setIsFormDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {cls.name}
                  </CardTitle>

                  {cls.description && (
                    <CardDescription className="text-xs line-clamp-2">
                      {cls.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  {/* Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-slate-500">Student Capacity:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {enrolled.length} / {capacity} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>

                  {/* Room & Teacher Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <DoorOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cls.room_number || 'Room TBD'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{cls.lead_teacher_name || 'Staff Rotation'}</span>
                    </div>
                  </div>

                  {/* Enrolled Students preview */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Class Roster ({enrolled.length})
                    </span>
                    {enrolled.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">No students assigned yet.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {enrolled.slice(0, 6).map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                          >
                            {c.first_name} {c.last_name[0]}.
                          </span>
                        ))}
                        {enrolled.length > 6 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                            +{enrolled.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Class Form Dialog */}
      <ChildClassFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleSaveClass}
        initialData={editingClass}
        mode={formMode}
      />
    </div>
  );
}
export default ChildrenClassesPage;
