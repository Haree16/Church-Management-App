import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Users } from 'lucide-react';
import { DEMO_USERS, DEMO_MINISTRIES } from '@/lib/mockData';
import { toast } from 'sonner';

interface AssignPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignedTo: string | null, assignedTeamId: string | null) => Promise<void>;
  prayerTitle: string;
  initialAssignedTo?: string | null;
  initialAssignedTeamId?: string | null;
}

export function AssignPrayerDialog({
  isOpen,
  onClose,
  onAssign,
  prayerTitle,
  initialAssignedTo,
  initialAssignedTeamId,
}: AssignPrayerDialogProps) {
  const [assignedTo, setAssignedTo] = useState<string | null>(initialAssignedTo || null);
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(initialAssignedTeamId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAssignedTo(initialAssignedTo || null);
    setAssignedTeamId(initialAssignedTeamId || null);
  }, [initialAssignedTo, initialAssignedTeamId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAssign(assignedTo, assignedTeamId);
      onClose();
      toast.success('Prayer request assignment updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <UserCheck className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Assign Prayer Request</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Assign an intercessory prayer team or pastoral leader for <span className="font-semibold text-slate-900 dark:text-slate-100">"{prayerTitle}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Prayer Team / Ministry
              </label>
              <Select
                value={assignedTeamId || 'none'}
                onValueChange={(val) => setAssignedTeamId(val === 'none' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prayer team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team Assigned</SelectItem>
                  {DEMO_MINISTRIES.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Pastor / Caregiver
              </label>
              <Select
                value={assignedTo || 'none'}
                onValueChange={(val) => setAssignedTo(val === 'none' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pastor/staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {DEMO_USERS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
