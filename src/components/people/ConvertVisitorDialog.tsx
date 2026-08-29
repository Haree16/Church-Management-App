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
import { Visitor, UserRole } from '@/types/database';
import { DEMO_MINISTRIES, DEMO_GROUPS, DEMO_FAMILIES } from '@/lib/mockData';
import { UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConvertVisitorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: Visitor | null;
  onConvert: (visitorId: string, memberPayload: any) => Promise<void>;
}

export function ConvertVisitorDialog({
  isOpen,
  onClose,
  visitor,
  onConvert,
}: ConvertVisitorDialogProps) {
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState<UserRole>('member');
  const [ministryId, setMinistryId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visitor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConvert(visitor.id, {
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email || `${visitor.first_name.toLowerCase()}.${visitor.last_name.toLowerCase()}@gracevalley.org`,
        phone: visitor.phone,
        address: visitor.address,
        city: visitor.city,
        state: visitor.state,
        postal_code: visitor.postal_code,
        joined_date: joinedDate,
        role: role,
        ministry_id: ministryId || null,
        group_id: groupId || null,
        family_id: familyId || null,
        notes: `Converted to covenant member from visitor record (First visited: ${visitor.visit_date}). ${notes}`.trim(),
      });
      toast.success(`${visitor.first_name} ${visitor.last_name} successfully converted to church member!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert visitor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle>Convert Visitor to Church Member</DialogTitle>
            <DialogDescription className="text-xs">
              This will create a new Covenant Member record for <strong>{visitor.first_name} {visitor.last_name}</strong> while preserving their original visitor history and attendance timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {visitor.first_name} {visitor.last_name}
              </div>
              <div className="text-slate-500">First Visit: {visitor.visit_date} ({visitor.service_attended || 'Sunday Service'})</div>
              <div className="text-slate-500">Email: {visitor.email || 'Not provided'} • Phone: {visitor.phone || 'Not provided'}</div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Church Joining Date *
              </label>
              <Input
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Membership Role
              </label>
              <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="group_leader">Group Leader</SelectItem>
                  <SelectItem value="ministry_leader">Ministry Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Assign Small Group
              </label>
              <Select value={groupId || 'none'} onValueChange={(val) => setGroupId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select small group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {DEMO_GROUPS.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Assign Ministry Department
              </label>
              <Select value={ministryId || 'none'} onValueChange={(val) => setMinistryId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ministry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {DEMO_MINISTRIES.map((min) => (
                    <SelectItem key={min.id} value={min.id}>
                      {min.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Pastoral Confirmation Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Completed membership covenant track..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Complete Conversion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
