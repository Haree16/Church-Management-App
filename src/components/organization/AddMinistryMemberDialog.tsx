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
import { ChurchMember } from '@/types/database';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AddMinistryMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ministryName: string;
  availableMembers: ChurchMember[];
  onAdd: (member: ChurchMember, role: string, notes?: string) => Promise<void>;
}

export function AddMinistryMemberDialog({
  isOpen,
  onClose,
  ministryName,
  availableMembers,
  onAdd,
}: AddMinistryMemberDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [role, setRole] = useState('Member');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please select a member to add.');
      return;
    }

    const member = availableMembers.find((m) => m.id === selectedMemberId);
    if (!member) return;

    setIsSubmitting(true);
    try {
      await onAdd(member, role, notes);
      toast.success(`${member.profile?.display_name} added to ${ministryName}!`);
      onClose();
      setSelectedMemberId('');
      setRole('Member');
      setNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add ministry member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-600" />
              Add Member to {ministryName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a covenant member to this ministry roster with their specific role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Congregation Member *
              </label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {availableMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.profile?.display_name || m.profile?.email} ({m.membership_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Role / Responsibility in Ministry
              </label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead Vocalist, Sound Tech, Teacher, Host"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes / Team Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Alto vocal range, completed safety check..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Add to Roster
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
