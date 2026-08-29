import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { YouthProfile } from '@/types/database';
import {
  Sparkles,
  User,
  GraduationCap,
  Phone,
  Mail,
  Heart,
  Users,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface YouthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  youth: YouthProfile | null;
  onEdit: (youth: YouthProfile) => void;
  onDelete: (id: string) => Promise<void>;
  canManage?: boolean;
}

export function YouthDetailModal({
  isOpen,
  onClose,
  youth,
  onEdit,
  onDelete,
  canManage = false,
}: YouthDetailModalProps) {
  if (!youth) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="purple" className="text-[10px] capitalize">
                {youth.status}
              </Badge>
              {youth.baptism_status === 'baptized' ? (
                <Badge variant="emerald" className="text-[10px]">
                  Baptized
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {youth.baptism_status?.replace('_', ' ')}
                </Badge>
              )}
            </div>

            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              {youth.grade || 'Student'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
              {youth.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {youth.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {youth.school_name || 'Grace Valley Youth'} {youth.date_of_birth ? `• Born ${youth.date_of_birth}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Contact Information Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Student Contact Information
            </span>
            <div className="flex flex-wrap items-center gap-3 text-slate-700 dark:text-slate-300">
              {youth.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-purple-600" />
                  {youth.phone}
                </span>
              )}
              {youth.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-purple-600" />
                  {youth.email}
                </span>
              )}
              {!youth.phone && !youth.email && (
                <span className="text-slate-400 italic">No direct student phone/email provided.</span>
              )}
            </div>
          </div>

          {/* Mentorship & Small Group */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Youth Mentor
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {youth.mentor_name || 'None Assigned'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Small Group / Crew
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {youth.group ? youth.group.name : 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Parent & Emergency Info */}
          {(youth.parent_name || youth.emergency_contact) && (
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Parent & Emergency Guardian
              </span>
              {youth.parent_name && (
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <span className="font-bold">{youth.parent_name}</span>
                  <span className="text-slate-500">{youth.parent_phone || youth.parent_email}</span>
                </div>
              )}
              {youth.emergency_contact && (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Secondary: <strong>{youth.emergency_contact}</strong>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {youth.notes && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Leader Notes & Ministry Involvement
              </span>
              <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {youth.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-red-600 hover:bg-red-50 gap-1"
                onClick={() => {
                  if (window.confirm(`Delete youth profile for ${youth.name}?`)) {
                    onDelete(youth.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={() => {
                  onClose();
                  onEdit(youth);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
