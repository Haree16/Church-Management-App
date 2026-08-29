import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Child, ChildrenClass } from '@/types/database';
import { CheckCircle2, Shield, AlertTriangle, Baby, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ChildCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
  classes: ChildrenClass[];
  onConfirmCheckIn: (childId: string, classId: string, checkedInBy: string, notes?: string) => Promise<void>;
  preselectedChild?: Child | null;
}

export function ChildCheckInDialog({
  isOpen,
  onClose,
  childrenList,
  classes,
  onConfirmCheckIn,
  preselectedChild,
}: ChildCheckInDialogProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(preselectedChild?.id || (childrenList[0]?.id || ''));
  const [selectedClassId, setSelectedClassId] = useState<string>(
    preselectedChild?.class_id || (classes[0]?.id || '')
  );
  const [checkedInBy, setCheckedInBy] = useState<string>(preselectedChild?.parent_name || 'Parent');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId);

  const handleChildSelect = (cId: string) => {
    setSelectedChildId(cId);
    const ch = childrenList.find((c) => c.id === cId);
    if (ch) {
      if (ch.class_id) setSelectedClassId(ch.class_id);
      if (ch.parent_name) setCheckedInBy(`${ch.parent_name} (Parent)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !selectedClassId || !checkedInBy.trim()) {
      toast.error('Please select child, class, and authorized check-in person.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmCheckIn(selectedChildId, selectedClassId, checkedInBy.trim(), notes.trim() || undefined);
      toast.success(`Check-in security badge printed for ${selectedChild?.child_name || 'Child'}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to check in child.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Kids Ministry Check-In Station</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Check in child for Sunday service and print matching security pickup tag.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            {/* Child Selector */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Child *
              </label>
              <Select value={selectedChildId} onValueChange={handleChildSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.child_name} {c.class_name ? `(${c.class_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medical Alert Warning if child has allergies */}
            {selectedChild?.allergies_medical_notes && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Medical / Allergy Alert:</span>
                  <span>{selectedChild.allergies_medical_notes}</span>
                </div>
              </div>
            )}

            {/* Class Assignment */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Classroom *
              </label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.room_number ? `— ${c.room_number}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checked in by */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Authorized Drop-Off Person *
              </label>
              <Input
                value={checkedInBy}
                onChange={(e) => setCheckedInBy(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Mother)"
              />
            </div>

            {/* Session Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Check-in Memo / Diaper Bag Tag #
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Blue bag with bottle, pickup by 11:30 AM"
              />
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Security PIN: <strong>{selectedChild?.security_pin || 'PIN-AUTO'}</strong></span>
              </div>
              <span className="text-[10px] text-slate-500">Pickup verified</span>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              isLoading={isSubmitting}
            >
              Complete Check-In
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
