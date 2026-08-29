import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementAudience,
} from '@/types/database';
import {
  announcementService,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '@/services/announcementService';
import { AnnouncementFormDialog } from '@/components/communication/AnnouncementFormDialog';
import { AnnouncementDetailModal } from '@/components/communication/AnnouncementDetailModal';
import { CommunicationComposerDialog } from '@/components/communication/CommunicationComposerDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Megaphone,
  Plus,
  Search,
  Calendar,
  Users,
  Eye,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  RefreshCw,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';

export function AnnouncementsPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'expired'>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState<Announcement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const canCreate = ['super_admin', 'church_admin', 'pastor', 'ministry_leader'].includes(currentRole || '');
  const canManage = ['super_admin', 'church_admin', 'pastor'].includes(currentRole || '');

  const currentUserName = profile?.display_name || user?.email?.split('@')[0] || 'Church Staff';
  const currentUserRole = currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'Staff';

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getAnnouncements(churchId, 'all', 'all', currentRole);
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to load announcements:', e);
      toast.error('Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [churchId]);

  const handleSaveAnnouncement = async (payload: CreateAnnouncementPayload | UpdateAnnouncementPayload) => {
    if (formMode === 'create') {
      await announcementService.createAnnouncement(churchId, payload as CreateAnnouncementPayload);
    } else if (editingAnnouncement) {
      await announcementService.updateAnnouncement(churchId, editingAnnouncement.id, payload as UpdateAnnouncementPayload);
    }
    await loadAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await announcementService.deleteAnnouncement(churchId, id);
    toast.info('Announcement removed.');
    if (selectedAnnouncementDetail?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedAnnouncementDetail(null);
    }
    await loadAnnouncements();
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      // Tab filter
      if (activeTab !== 'all' && a.status !== activeTab) {
        return false;
      }

      // Audience filter
      if (audienceFilter !== 'all' && a.audience !== audienceFilter) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(t);
        const matchesMsg = (a.message || a.content || '').toLowerCase().includes(t);
        const matchesAuthor = a.author_name.toLowerCase().includes(t);
        if (!matchesTitle && !matchesMsg && !matchesAuthor) return false;
      }

      return true;
    });
  }, [announcements, activeTab, audienceFilter, searchTerm]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: announcements.length,
      published: announcements.filter((a) => a.status === 'published').length,
      scheduled: announcements.filter((a) => a.status === 'scheduled').length,
      draft: announcements.filter((a) => a.status === 'draft').length,
      expired: announcements.filter((a) => a.status === 'expired').length,
    };
  }, [announcements]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-sky-600" />
            Church Announcements & Bulletins
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish weekly bulletins, audience-targeted notices, parent briefs, and multi-channel broadcasts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsComposerOpen(true)}
            className="h-9 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 bg-emerald-50/40"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            Send Multi-Channel Message
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditingAnnouncement(null);
                setFormMode('create');
                setIsFormDialogOpen(true);
              }}
              className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Multi-Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="h-9 bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="all" className="text-xs gap-1.5">
                All
                <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0">{tabCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="published" className="text-xs gap-1.5">
                Published
                <Badge variant="emerald" className="text-[10px] h-4 px-1 py-0">{tabCounts.published}</Badge>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs gap-1.5">
                Scheduled
                <Badge variant="blue" className="text-[10px] h-4 px-1 py-0">{tabCounts.scheduled}</Badge>
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs gap-1.5">
                Drafts
                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">{tabCounts.draft}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expired" className="text-xs gap-1.5">
                Expired
                <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0">{tabCounts.expired}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search & Audience Selector */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bulletins..."
                className="pl-8 h-8 text-xs bg-white dark:bg-slate-900"
              />
            </div>

            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="h-8 text-xs w-40 bg-white dark:bg-slate-900">
                <SelectValue placeholder="Audience: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
                <SelectItem value="volunteers">Volunteers</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="new_members">New Members</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="ghost"
              onClick={loadAnnouncements}
              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Announcements List Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
            Loading announcements...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-10 w-10 text-sky-600" />}
            title="No announcements found"
            description="Create weekly bulletins, ministry updates, or schedule upcoming announcements."
            actionLabel={canCreate ? 'Create First Announcement' : undefined}
            onAction={canCreate ? () => {
              setEditingAnnouncement(null);
              setFormMode('create');
              setIsFormDialogOpen(true);
            } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((item) => (
              <Card
                key={item.id}
                onClick={() => {
                  announcementService.incrementViews(churchId, item.id);
                  setSelectedAnnouncementDetail(item);
                  setIsDetailModalOpen(true);
                }}
                className={`transition-all hover:shadow-md cursor-pointer border relative overflow-hidden ${
                  item.priority === 'urgent'
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/10'
                    : item.priority === 'important'
                    ? 'border-amber-300 dark:border-amber-900 bg-amber-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {item.priority === 'urgent' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                )}
                {item.priority === 'important' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={
                          item.status === 'published'
                            ? 'emerald'
                            : item.status === 'scheduled'
                            ? 'blue'
                            : item.status === 'draft'
                            ? 'outline'
                            : 'destructive'
                        }
                        className="text-[9px] capitalize px-1.5 py-0"
                      >
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0">
                        {item.audience.replace('_', ' ')}
                      </Badge>
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.views_count || 0}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {item.message || item.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[150px]">By: {item.author_name}</span>
                    <span>{formatDate(item.publish_date)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <AnnouncementFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleSaveAnnouncement}
        initialData={editingAnnouncement}
        mode={formMode}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      <AnnouncementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAnnouncementDetail(null);
        }}
        announcement={selectedAnnouncementDetail}
        onEdit={(a) => {
          setIsDetailModalOpen(false);
          setEditingAnnouncement(a);
          setFormMode('edit');
          setIsFormDialogOpen(true);
        }}
        onDelete={handleDeleteAnnouncement}
        canManage={canManage}
      />

      <CommunicationComposerDialog
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        churchId={churchId}
        currentUserName={currentUserName}
        onCampaignSent={loadAnnouncements}
      />
    </div>
  );
}
export default AnnouncementsPage;
