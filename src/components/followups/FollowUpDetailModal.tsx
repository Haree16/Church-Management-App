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
  FollowUp,
  FollowUpStatus,
  FollowUpPriority,
  ContactMethod,
  UserRole,
} from '@/types/database';
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUSES,
  CONTACT_METHODS,
  AddFollowUpHistoryPayload,
} from '@/services/followUpService';
import {
  MessageSquare,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Building,
  HeartPulse,
  Home,
  Video,
  FileText,
} from 'lucide-react';
import { FollowUpHistoryDialog } from './FollowUpHistoryDialog';
import { CompleteFollowUpDialog } from './CompleteFollowUpDialog';
import { Link } from 'react-router-dom';

interface FollowUpDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
  onAddHistory: (payload: AddFollowUpHistoryPayload) => Promise<void>;
  onComplete: (followUpId: string, outcome: string, notes?: string) => Promise<void>;
  onChangeStatus: (followUpId: string, status: FollowUpStatus) => Promise<void>;
  onChangePriority: (followUpId: string, priority: FollowUpPriority) => Promise<void>;
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUpId: string) => Promise<void>;
  currentUserRole?: UserRole | null;
  currentUserId?: string | null;
  currentUserName?: string;
}

export function FollowUpDetailModal({
  isOpen,
  onClose,
  followUp,
  onAddHistory,
  onComplete,
  onChangeStatus,
  onChangePriority,
  onEdit,
  onDelete,
  currentUserRole,
  currentUserId,
  currentUserName = 'Pastoral Staff',
}: FollowUpDetailModalProps) {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  if (!followUp) return null;

  const typeMeta = FOLLOW_UP_TYPES.find((t) => t.value === followUp.type) || FOLLOW_UP_TYPES[0];
  const priorityMeta = FOLLOW_UP_PRIORITIES.find((p) => p.value === followUp.priority) || FOLLOW_UP_PRIORITIES[0];
  const statusMeta = FOLLOW_UP_STATUSES.find((s) => s.value === followUp.status) || FOLLOW_UP_STATUSES[0];

  const today = new Date().toISOString().split('T')[0];
  const isOverdue =
    followUp.status !== 'completed' &&
    followUp.status !== 'cancelled' &&
    followUp.due_date &&
    followUp.due_date < today;

  const isDueToday =
    followUp.status !== 'completed' &&
    followUp.status !== 'cancelled' &&
    followUp.due_date === today;

  const canManage = ['super_admin', 'pastor', 'church_admin', 'ministry_leader'].includes(currentUserRole || '');

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone_call':
        return <Phone className="h-3.5 w-3.5 text-sky-600" />;
      case 'home_visit':
        return <Home className="h-3.5 w-3.5 text-amber-600" />;
      case 'hospital_visit':
        return <HeartPulse className="h-3.5 w-3.5 text-rose-600" />;
      case 'email':
        return <Mail className="h-3.5 w-3.5 text-purple-600" />;
      case 'text_sms':
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />;
      case 'video_call':
        return <Video className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return <User className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Not set';
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
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-50/50 via-slate-50 to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-950">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={statusMeta.badgeVariant} className="text-xs">
                {statusMeta.label}
              </Badge>
              <Badge variant={priorityMeta.badgeVariant} className="text-xs">
                {priorityMeta.label} Priority
              </Badge>
              <Badge variant="outline" className="text-xs">
                {typeMeta.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue Task
                </Badge>
              )}
              {isDueToday && (
                <Badge variant="amber" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due Today
                </Badge>
              )}
            </div>

            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {followUp.title}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Due: <strong className={`ml-0.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{formatDate(followUp.due_date)}</strong>
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                Assigned: <strong className="text-slate-700 dark:text-slate-300 ml-0.5">{followUp.assigned_profile?.display_name || 'Unassigned'}</strong>
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Person Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    {(followUp.person_name || 'P')[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {followUp.person_name || 'Individual Contact'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {followUp.member_id ? 'Church Member' : followUp.visitor_id ? 'Sunday Guest / Visitor' : 'Community Care Contact'}
                    </span>
                  </div>
                </div>

                {followUp.member_id && (
                  <Link
                    to={`/people/members/${followUp.member_id}`}
                    className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    View Member Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                {followUp.person_phone && (
                  <a
                    href={`tel:${followUp.person_phone}`}
                    className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {followUp.person_phone}
                  </a>
                )}
                {followUp.person_email && (
                  <a
                    href={`mailto:${followUp.person_email}`}
                    className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {followUp.person_email}
                  </a>
                )}
              </div>
            </div>

            {/* Completed Outcome Banner */}
            {followUp.status === 'completed' && followUp.outcome && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Resolved Pastoral Care Outcome</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                  {followUp.outcome}
                </p>
                {followUp.completed_at && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block pt-1">
                    Completed on {formatDateTime(followUp.completed_at)}
                  </span>
                )}
              </div>
            )}

            {/* Notes / Instructions */}
            {followUp.notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Care Objectives & Background Instructions
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                  {followUp.notes}
                </p>
              </div>
            )}

            {/* Interaction History Timeline */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pastoral Contact History ({followUp.history?.length || 0})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-sky-600 border-sky-200 hover:bg-sky-50"
                  onClick={() => setIsHistoryDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Contact / History
                </Button>
              </div>

              {(!followUp.history || followUp.history.length === 0) ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No contact history logged yet. Click "Log Contact / History" after calling, visiting, or meeting.
                </div>
              ) : (
                <div className="space-y-3">
                  {followUp.history.map((h) => {
                    const methodObj = CONTACT_METHODS.find((m) => m.value === h.contact_method);
                    return (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                            {getMethodIcon(h.contact_method)}
                            <span>{methodObj?.label || h.contact_method}</span>
                            <span className="text-slate-400 font-normal">with</span>
                            <span className="text-sky-600">{h.person_contacted}</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {formatDateTime(h.contact_date)}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {h.notes}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                          <span>Logged by: <strong className="text-slate-600 dark:text-slate-300">{h.user_name}</strong></span>
                          {h.next_action && (
                            <span className="text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              Next: {h.next_action}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workflow Action Bar */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ticket Actions & Resolution
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                {/* Complete Ticket */}
                {followUp.status !== 'completed' && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => setIsCompleteDialogOpen(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete Ticket
                  </Button>
                )}

                {/* In Progress Quick Action */}
                {followUp.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onChangeStatus(followUp.id, 'in_progress')}
                  >
                    Mark In Progress
                  </Button>
                )}

                {/* Edit & Delete */}
                {canManage && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => onEdit(followUp)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Task
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                      onClick={() => {
                        if (window.confirm('Delete this follow-up ticket?')) {
                          onDelete(followUp.id);
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
      <FollowUpHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        onSaveHistory={onAddHistory}
        followUpId={followUp.id}
        defaultPersonName={followUp.person_name || ''}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole || 'Pastor'}
        currentUserId={currentUserId || ''}
      />

      <CompleteFollowUpDialog
        isOpen={isCompleteDialogOpen}
        onClose={() => setIsCompleteDialogOpen(false)}
        onConfirm={async (outcome, notes) => {
          await onComplete(followUp.id, outcome, notes);
        }}
        ticketTitle={followUp.title}
      />
    </>
  );
}
