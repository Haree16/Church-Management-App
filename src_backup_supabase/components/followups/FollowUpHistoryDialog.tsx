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
import { ContactMethod } from '@/types/database';
import { CONTACT_METHODS, AddFollowUpHistoryPayload } from '@/services/followUpService';
import { PhoneCall, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveHistory: (payload: AddFollowUpHistoryPayload) => Promise<void>;
  followUpId: string;
  defaultPersonName?: string;
  currentUserName?: string;
  currentUserRole?: string;
  currentUserId?: string;
}

export function FollowUpHistoryDialog({
  isOpen,
  onClose,
  onSaveHistory,
  followUpId,
  defaultPersonName = '',
  currentUserName = 'Pastoral Staff',
  currentUserRole = 'Pastor',
  currentUserId = '',
}: FollowUpHistoryDialogProps) {
  const [contactDate, setContactDate] = useState(new Date().toISOString().slice(0, 16));
  const [personContacted, setPersonContacted] = useState(defaultPersonName || '');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('phone_call');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setContactDate(new Date().toISOString().slice(0, 16));
      setPersonContacted(defaultPersonName || '');
      setContactMethod('phone_call');
      setNotes('');
      setNextAction('');
      setErrors({});
    }
  }, [isOpen, defaultPersonName]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!personContacted.trim()) newErrors.personContacted = 'Person contacted is required';
    if (!notes.trim()) newErrors.notes = 'Conversation & care notes are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete required history fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveHistory({
        follow_up_id: followUpId,
        contact_date: new Date(contactDate).toISOString(),
        person_contacted: personContacted.trim(),
        contact_method: contactMethod,
        notes: notes.trim(),
        user_id: currentUserId || null,
        user_name: currentUserName,
        user_role: currentUserRole,
        next_action: nextAction.trim() || null,
      });
      onClose();
      toast.success('Pastoral contact history logged successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to log contact history.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <PhoneCall className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Log Pastoral Care Contact</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Record details of the pastoral conversation, visitation, counseling session, or message.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            {/* Person & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Person Contacted *
                </label>
                <Input
                  value={personContacted}
                  onChange={(e) => {
                    setPersonContacted(e.target.value);
                    if (errors.personContacted) setErrors((prev) => ({ ...prev, personContacted: '' }));
                  }}
                  placeholder="e.g. Michael Taylor"
                  className={errors.personContacted ? 'border-red-500' : ''}
                />
                {errors.personContacted && <span className="text-[10px] text-red-500">{errors.personContacted}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Contact Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                />
              </div>
            </div>

            {/* Contact Method */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Contact Method *
              </label>
              <Select value={contactMethod} onValueChange={(val) => setContactMethod(val as ContactMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Contact Method" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Pastoral Notes & Discussion Summary *
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
                }}
                placeholder="Detail what was discussed, scriptures shared, prayer burdens, emotional state, or family feedback..."
                rows={4}
                className={`w-full rounded-md border bg-transparent p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800 ${
                  errors.notes ? 'border-red-500' : 'border-slate-200'
                }`}
                autoFocus
              />
              {errors.notes && <span className="text-[10px] text-red-500">{errors.notes}</span>}
            </div>

            {/* Next Action */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Next Action / Follow-up Step (Optional)
              </label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Schedule second counseling visit on next Tuesday at 3 PM"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white"
              isLoading={isSubmitting}
            >
              Save History Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
