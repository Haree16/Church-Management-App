import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Child } from '@/types/database';
import {
  Baby,
  Shield,
  AlertTriangle,
  User,
  Calendar,
  Phone,
  Mail,
  Heart,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChildDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  onEdit: (child: Child) => void;
  onDelete: (id: string) => Promise<void>;
  onCheckIn?: (child: Child) => void;
  canManage?: boolean;
}

export function ChildDetailModal({
  isOpen,
  onClose,
  child,
  onEdit,
  onDelete,
  onCheckIn,
  canManage = false,
}: ChildDetailModalProps) {
  if (!child) return null;

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
        return `${Math.max(1, months)} months old`;
      }
      return `${years} years old`;
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="emerald" className="text-[10px] capitalize">
                {child.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {child.gender}
              </Badge>
            </div>

            <div className="flex items-center gap-1 font-mono font-bold text-xs bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>{child.security_pin || 'PIN-AUTO'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg">
              {child.first_name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {child.child_name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {calculateAge(child.date_of_birth)} • Born {child.date_of_birth}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Allergies & Medical Alert Banner */}
          {child.allergies_medical_notes && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Medical & Dietary Alert:</span>
                <p className="text-xs mt-0.5">{child.allergies_medical_notes}</p>
              </div>
            </div>
          )}

          {/* Assigned Class */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400">Class Room Assignment:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {child.class_name || 'Unassigned'}
            </span>
          </div>

          {/* Parent & Contact Grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Parent / Guardian & Emergency Information
            </span>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {child.parent_name || 'Primary Guardian'}
                </span>
                {child.parent_guardian_id && (
                  <Link
                    to={`/people/members/${child.parent_guardian_id}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    View Parent Profile
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                {child.parent_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {child.parent_phone}
                  </span>
                )}
                {child.parent_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {child.parent_email}
                  </span>
                )}
              </div>

              {child.emergency_contact_name && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 block">Secondary Emergency Contact:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {child.emergency_contact_name} ({child.emergency_contact_phone || 'No phone'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Notes */}
          {child.notes && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Teacher Notes & Preferences
              </span>
              <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {child.notes}
              </p>
            </div>
          )}

          {/* Action Footer */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-red-600 hover:bg-red-50 gap-1"
                onClick={() => {
                  if (window.confirm(`Delete record for ${child.child_name}?`)) {
                    onDelete(child.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                {onCheckIn && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                    onClick={() => {
                      onClose();
                      onCheckIn(child);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check-In
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => {
                    onClose();
                    onEdit(child);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
