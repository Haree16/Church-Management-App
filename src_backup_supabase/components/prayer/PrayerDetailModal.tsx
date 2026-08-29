import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PrayerRequest,
  PrayerPrivacy,
  PrayerStatus,
  UserRole,
} from '@/types/database';
import {
  PRAYER_PRIVACY_LEVELS,
  PRAYER_STATUSES,
  PRAYER_CATEGORIES,
} from '@/services/prayerService';
import {
  Heart,
  Shield,
  Lock,
  Users,
  Globe,
  Sparkles,
  Calendar,
  User,
  Clock,
  MessageSquare,
  CheckCircle2,
  Share2,
  Edit2,
  Trash2,
  UserCheck,
  ArrowRightCircle,
  Plus,
} from 'lucide-react';
import { PrayerNoteDialog } from './PrayerNoteDialog';
import { MarkAnsweredDialog } from './MarkAnsweredDialog';
import { AssignPrayerDialog } from './AssignPrayerDialog';
import { toast } from 'sonner';

interface PrayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayer: PrayerRequest | null;
  onTogglePray: (prayerId: string) => Promise<void>;
  onAddNote: (prayerId: string, note: string) => Promise<void>;
  onMarkAnswered: (prayerId: string, praiseReport: string) => Promise<void>;
  onAssign: (prayerId: string, assignedTo: string | null, assignedTeamId: string | null) => Promise<void>;
  onChangeStatus: (prayerId: string, status: PrayerStatus) => Promise<void>;
  onChangePrivacy: (prayerId: string, privacy: PrayerPrivacy) => Promise<void>;
  onEdit: (prayer: PrayerRequest) => void;
  onDelete: (prayerId: string) => Promise<void>;
  onCreateFollowUp?: (prayer: PrayerRequest) => void;
  currentUserRole?: UserRole | null;
  currentUserId?: string | null;
}

export function PrayerDetailModal({
  isOpen,
  onClose,
  prayer,
  onTogglePray,
  onAddNote,
  onMarkAnswered,
  onAssign,
  onChangeStatus,
  onChangePrivacy,
  onEdit,
  onDelete,
  onCreateFollowUp,
  currentUserRole,
  currentUserId,
}: PrayerDetailModalProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPrayingAnim, setIsPrayingAnim] = useState(false);

  if (!prayer) return null;

  const privacyMeta = PRAYER_PRIVACY_LEVELS.find((p) => p.value === prayer.privacy) || PRAYER_PRIVACY_LEVELS[0];
  const statusMeta = PRAYER_STATUSES.find((s) => s.value === prayer.status) || PRAYER_STATUSES[0];
  const categoryMeta = PRAYER_CATEGORIES.find((c) => c.value === prayer.category) || PRAYER_CATEGORIES[0];

  const hasPrayed = currentUserId && prayer.prayed_user_ids?.includes(currentUserId);
  const canManage = ['super_admin', 'pastor', 'church_admin', 'ministry_leader'].includes(currentUserRole || '');
  const isAuthor = currentUserId && prayer.member_id === currentUserId;

  const handlePrayClick = async () => {
    setIsPrayingAnim(true);
    await onTogglePray(prayer.id);
    setTimeout(() => setIsPrayingAnim(false), 600);
  };

  const getPrivacyIcon = (level: PrayerPrivacy) => {
    switch (level) {
      case 'church_wide':
        return <Globe className="h-3.5 w-3.5 text-emerald-500" />;
      case 'prayer_team':
        return <Users className="h-3.5 w-3.5 text-purple-500" />;
      case 'pastor_only':
        return <Shield className="h-3.5 w-3.5 text-amber-500" />;
      case 'private':
        return <Lock className="h-3.5 w-3.5 text-rose-500" />;
    }
  };

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

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', {
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
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Header Banner */}
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50/50 via-slate-50 to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-950">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={statusMeta.badgeVariant} className="text-xs">
                {statusMeta.label}
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                {getPrivacyIcon(prayer.privacy)}
                {privacyMeta.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {categoryMeta.label}
              </Badge>
            </div>

            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {prayer.title}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Submitted by: <strong className="text-slate-700 dark:text-slate-300 ml-0.5">{prayer.author_name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(prayer.created_at)}
              </span>
              {prayer.assigned_profile && (
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  Assigned: {prayer.assigned_profile.display_name}
                </span>
              )}
              {prayer.assigned_ministry && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                  <Users className="h-3.5 w-3.5" />
                  Team: {prayer.assigned_ministry.name}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Answered Praise Report Banner */}
            {prayer.is_answered && prayer.praise_report && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                  <span>Answered Prayer Praise Testimony</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                  "{prayer.praise_report}"
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prayer Petition & Situation
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {prayer.description || prayer.request}
              </p>
            </div>

            {/* Internal Staff Notes if present */}
            {prayer.notes && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Pastoral Care Notes:</span>
                <p className="text-slate-600 dark:text-slate-400">{prayer.notes}</p>
              </div>
            )}

            {/* Interactive "I Prayed" Button & Counter Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Heart className={`h-4 w-4 ${hasPrayed ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
                  {prayer.prayer_count} {prayer.prayer_count === 1 ? 'Prayer Offered' : 'Prayers Offered'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {hasPrayed ? 'You are actively standing in prayer for this request.' : 'Join the church family in lifting this need to Heaven.'}
                </p>
              </div>

              <Button
                onClick={handlePrayClick}
                size="sm"
                className={`gap-1.5 transition-all ${
                  hasPrayed
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow'
                } ${isPrayingAnim ? 'scale-105 ring-4 ring-rose-200' : ''}`}
              >
                <Heart className={`h-4 w-4 ${hasPrayed ? 'fill-rose-600' : ''}`} />
                {hasPrayed ? 'Prayed' : 'I Prayed'}
              </Button>
            </div>

            {/* Prayer Notes / Updates Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Intercessory Notes & Updates ({prayer.prayer_notes?.length || 0})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setIsNoteDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 text-rose-600" />
                  Add Note
                </Button>
              </div>

              {(!prayer.prayer_notes || prayer.prayer_notes.length === 0) ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No prayer notes logged yet. Be the first to leave an encouraging word or scripture.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {prayer.prayer_notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                          <span>{note.author_name}</span>
                          {note.author_role && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                              {note.author_role}
                            </Badge>
                          )}
                        </div>
                        <span className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(note.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {note.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pastoral Care & Workflow Actions Toolbar */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prayer Workflow & Pastoral Actions
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                {/* Mark Answered */}
                {!prayer.is_answered && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => setIsAnswerDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Answered
                  </Button>
                )}

                {/* Assign */}
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setIsAssignDialogOpen(true)}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                    Assign Team / Pastor
                  </Button>
                )}

                {/* Status Transitions */}
                {canManage && prayer.status !== 'praying' && prayer.status !== 'answered' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onChangeStatus(prayer.id, 'praying')}
                  >
                    Set Actively Praying
                  </Button>
                )}

                {canManage && prayer.status !== 'closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onChangeStatus(prayer.id, 'closed')}
                  >
                    Close Request
                  </Button>
                )}

                {/* Create Follow-up */}
                {onCreateFollowUp && (canManage || isAuthor) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 gap-1.5"
                    onClick={() => onCreateFollowUp(prayer)}
                  >
                    <ArrowRightCircle className="h-3.5 w-3.5 text-sky-600" />
                    Create Care Follow-up
                  </Button>
                )}

                {/* Edit & Delete */}
                {(canManage || isAuthor) && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => onEdit(prayer)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this prayer request?')) {
                          onDelete(prayer.id);
                          onClose();
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Dialogs */}
      <PrayerNoteDialog
        isOpen={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        onAddNote={async (noteText) => {
          await onAddNote(prayer.id, noteText);
        }}
        prayerTitle={prayer.title}
      />

      <MarkAnsweredDialog
        isOpen={isAnswerDialogOpen}
        onClose={() => setIsAnswerDialogOpen(false)}
        onConfirm={async (praiseText) => {
          await onMarkAnswered(prayer.id, praiseText);
        }}
        prayerTitle={prayer.title}
      />

      <AssignPrayerDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        onAssign={async (assignedTo, assignedTeamId) => {
          await onAssign(prayer.id, assignedTo, assignedTeamId);
        }}
        prayerTitle={prayer.title}
        initialAssignedTo={prayer.assigned_to}
        initialAssignedTeamId={prayer.assigned_team_id}
      />
    </>
  );
}
