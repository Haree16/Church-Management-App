import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FollowUp,
  UserRole,
} from '@/types/database';
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUSES,
} from '@/services/followUpService';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

interface FollowUpRowCardProps {
  followUp: FollowUp;
  onView: (followUp: FollowUp) => void;
  onLogContact: (followUp: FollowUp) => void;
  onComplete: (followUp: FollowUp) => void;
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUpId: string) => Promise<void>;
  currentUserRole?: UserRole | null;
}

export function FollowUpRowCard({
  followUp,
  onView,
  onLogContact,
  onComplete,
  onEdit,
  onDelete,
  currentUserRole,
}: FollowUpRowCardProps) {
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

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Not set';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card
      onClick={() => onView(followUp)}
      className={`group cursor-pointer transition-all hover:shadow-md border ${
        isOverdue
          ? 'border-red-300 dark:border-red-900/80 bg-red-50/15 dark:bg-red-950/10'
          : isDueToday
          ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/15 dark:bg-amber-950/10'
          : followUp.status === 'completed'
          ? 'border-emerald-200 dark:border-emerald-900/50 bg-slate-50/40 dark:bg-slate-900/40'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <Badge variant={statusMeta.badgeVariant} className="text-[10px] px-1.5 py-0">
                {statusMeta.label}
              </Badge>
              <Badge variant={priorityMeta.badgeVariant} className="text-[10px] px-1.5 py-0">
                {priorityMeta.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {typeMeta.label}
              </Badge>

              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Overdue
                </Badge>
              )}
              {isDueToday && (
                <Badge variant="amber" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Due Today
                </Badge>
              )}
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-sky-600 transition-colors">
              {followUp.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {followUp.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 hidden sm:flex border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                onClick={() => onComplete(followUp)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Complete
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onView(followUp)}>
                  View Details & History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLogContact(followUp)}>
                  <MessageSquare className="h-3.5 w-3.5 mr-2 text-sky-600" />
                  Log Contact / History
                </DropdownMenuItem>
                {followUp.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onComplete(followUp)}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                    Complete Ticket
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(followUp)}>
                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm('Delete this follow-up ticket?')) {
                          onDelete(followUp.id);
                        }
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {followUp.notes && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {followUp.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <User className="h-3 w-3 text-slate-400" />
              {followUp.person_name || 'Contact'}
            </span>

            {followUp.person_phone && (
              <span className="hidden md:flex items-center gap-1 text-slate-500">
                <Phone className="h-3 w-3" />
                {followUp.person_phone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {followUp.history && followUp.history.length > 0 && (
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium" title="Contact history entries">
                <MessageSquare className="h-3 w-3" />
                {followUp.history.length} {followUp.history.length === 1 ? 'contact' : 'contacts'}
              </span>
            )}

            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-slate-400" />
              {followUp.assigned_profile?.first_name || 'Unassigned'}
            </span>

            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              <Calendar className="h-3 w-3" />
              Due: {formatDate(followUp.due_date)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
