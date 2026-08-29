import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { YouthProfile, YouthEvent } from '@/types/database';
import {
  youthService,
  CreateYouthPayload,
  UpdateYouthPayload,
  CreateYouthEventPayload,
} from '@/services/youthService';
import { YouthFormDialog } from '@/components/youth/YouthFormDialog';
import { YouthDetailModal } from '@/components/youth/YouthDetailModal';
import { YouthEventDialog } from '@/components/youth/YouthEventDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sparkles,
  Plus,
  Search,
  Users,
  GraduationCap,
  Calendar,
  Heart,
  Phone,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export function YouthPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [youthList, setYouthList] = useState<YouthProfile[]>([]);
  const [youthEvents, setYouthEvents] = useState<YouthEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'events' | 'mentors'>('students');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingYouth, setEditingYouth] = useState<YouthProfile | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedYouthDetail, setSelectedYouthDetail] = useState<YouthProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  const canManage = ['super_admin', 'church_admin', 'pastor', 'ministry_leader'].includes(currentRole || '');
  const currentUserName = profile?.display_name || user?.email?.split('@')[0] || 'Youth Leader';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [students, evts] = await Promise.all([
        youthService.getYouthProfiles(churchId),
        youthService.getYouthEvents(churchId),
      ]);
      setYouthList(students);
      setYouthEvents(evts);

      if (selectedYouthDetail) {
        const refreshed = students.find((s) => s.id === selectedYouthDetail.id);
        if (refreshed) setSelectedYouthDetail(refreshed);
      }
    } catch (e) {
      console.error('Failed to load youth records:', e);
      toast.error('Failed to load youth records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId]);

  const handleSaveYouth = async (payload: CreateYouthPayload | UpdateYouthPayload) => {
    if (formMode === 'create') {
      await youthService.createYouthProfile(churchId, payload as CreateYouthPayload);
    } else if (editingYouth) {
      await youthService.updateYouthProfile(churchId, editingYouth.id, payload as UpdateYouthPayload);
    }
    await loadData();
  };

  const handleDeleteYouth = async (id: string) => {
    await youthService.deleteYouthProfile(churchId, id);
    toast.info('Youth profile removed.');
    if (selectedYouthDetail?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedYouthDetail(null);
    }
    await loadData();
  };

  const handleSaveEvent = async (payload: CreateYouthEventPayload) => {
    await youthService.createYouthEvent(churchId, payload);
    await loadData();
  };

  const filteredYouth = useMemo(() => {
    return youthList.filter((y) => {
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const matchesName = y.name.toLowerCase().includes(t);
        const matchesGrade = (y.grade || '').toLowerCase().includes(t);
        const matchesSchool = (y.school_name || '').toLowerCase().includes(t);
        const matchesMentor = (y.mentor_name || '').toLowerCase().includes(t);
        if (!matchesName && !matchesGrade && !matchesSchool && !matchesMentor) return false;
      }
      return true;
    });
  }, [youthList, searchTerm]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Youth Ministry (Encounter Students)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Middle & high school discipleship, small group crews, mentorship pairings, retreats, and student leadership.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEventDialogOpen(true)}
                className="h-9 gap-1.5 text-xs text-purple-700 dark:text-purple-300 border-purple-200 bg-purple-50/40"
              >
                <Calendar className="h-4 w-4 text-purple-600" />
                Schedule Youth Event
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingYouth(null);
                  setFormMode('create');
                  setIsFormDialogOpen(true);
                }}
                className="h-9 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Register Student
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Encounter Students</span>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {youthList.length}
            </p>
            <span className="text-[10px] text-slate-400">6th - 12th grade active youth</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Water Baptized</span>
              <Heart className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 font-bold mt-1">
              {youthList.filter((y) => y.baptism_status === 'baptized').length}
            </p>
            <span className="text-[10px] text-slate-400">Spiritual milestone achieved</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Mentorship</span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {youthList.filter((y) => y.mentor_id).length}
            </p>
            <span className="text-[10px] text-slate-400">Paired with youth leaders</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upcoming Events</span>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {youthEvents.length}
            </p>
            <span className="text-[10px] text-slate-400">Services, retreats & camps</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <TabsList className="h-9 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="students" className="text-xs gap-1.5">
              Students Roster ({youthList.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs gap-1.5">
              Youth Events & Retreats ({youthEvents.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === 'students' && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, school, grade, mentor..."
                className="pl-8 h-8 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Students Roster */}
        <TabsContent value="students" className="pt-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
              Loading youth roster...
            </div>
          ) : filteredYouth.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-10 w-10 text-purple-600" />}
              title="No youth students registered"
              description="Add student profiles, grade levels, and mentor pairings."
              actionLabel={canManage ? 'Register Student' : undefined}
              onAction={canManage ? () => {
                setEditingYouth(null);
                setFormMode('create');
                setIsFormDialogOpen(true);
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredYouth.map((youth) => (
                <Card
                  key={youth.id}
                  onClick={() => {
                    setSelectedYouthDetail(youth);
                    setIsDetailModalOpen(true);
                  }}
                  className="transition-all hover:shadow-md cursor-pointer border border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                          {youth.name[0]}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {youth.name}
                          </CardTitle>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {youth.grade || 'Student'} {youth.school_name ? `• ${youth.school_name}` : ''}
                          </span>
                        </div>
                      </div>

                      {youth.baptism_status === 'baptized' && (
                        <Badge variant="emerald" className="text-[9px]">
                          Baptized
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs">
                    {/* Mentor pairing */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Mentor / Leader:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {youth.mentor_name || 'Unassigned'}
                      </span>
                    </div>

                    {/* Small Group */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Small Group:</span>
                      <Badge variant="purple" className="text-[10px]">
                        {youth.group ? youth.group.name : 'Crew 1'}
                      </Badge>
                    </div>

                    {/* Parent contact */}
                    {youth.parent_name && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Parent: <strong>{youth.parent_name}</strong> {youth.parent_phone ? `(${youth.parent_phone})` : ''}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Youth Events & Retreats */}
        <TabsContent value="events" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {youthEvents.map((evt) => (
              <Card key={evt.id} className="border border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="purple" className="text-[10px]">
                      {evt.event_type}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {evt.target_grades || '6th-12th'}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {evt.description && (
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {evt.description}
                    </p>
                  )}

                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span>{formatDate(evt.start_time)}</span>
                    </div>

                    {evt.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      <YouthFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleSaveYouth}
        initialData={editingYouth}
        mode={formMode}
      />

      <YouthDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedYouthDetail(null);
        }}
        youth={selectedYouthDetail}
        onEdit={(y) => {
          setIsDetailModalOpen(false);
          setEditingYouth(y);
          setFormMode('edit');
          setIsFormDialogOpen(true);
        }}
        onDelete={handleDeleteYouth}
        canManage={canManage}
      />

      <YouthEventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSave={handleSaveEvent}
        currentUserName={currentUserName}
      />
    </div>
  );
}
export default YouthPage;
