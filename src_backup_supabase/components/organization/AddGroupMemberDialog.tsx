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
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AddGroupMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  availableMembers: ChurchMember[];
  onAdd: (member: ChurchMember, role: string, notes?: string) => Promise<void>;
}

export function AddGroupMemberDialog({
  isOpen,
  onClose,
  groupName,
  availableMembers,
  onAdd,
}: AddGroupMemberDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [role, setRole] = useState('Member');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please choose a member.');
      return;
    }

    const member = availableMembers.find((m) => m.id === selectedMemberId);
    if (!member) return;

    setIsSubmitting(true);
    try {
      await onAdd(member, role, notes);
      toast.success(`${member.profile?.display_name} added to ${groupName}!`);
      onClose();
      setSelectedMemberId('');
      setRole('Member');
      setNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member to group.');
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
              Add Member to {groupName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enroll a covenant member into this small group circle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Member *
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
                Group Role
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Host">Host</SelectItem>
                  <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                  <SelectItem value="Leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Hosting next session dinner..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Add to Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
