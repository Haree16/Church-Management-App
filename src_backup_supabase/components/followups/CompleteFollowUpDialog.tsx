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
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CompleteFollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (outcome: string, notes?: string) => Promise<void>;
  ticketTitle: string;
}

export function CompleteFollowUpDialog({
  isOpen,
  onClose,
  onConfirm,
  ticketTitle,
}: CompleteFollowUpDialogProps) {
  const [outcome, setOutcome] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome.trim()) {
      toast.error('Please enter the follow-up outcome or resolution.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(outcome.trim(), closingNotes.trim() || undefined);
      setOutcome('');
      setClosingNotes('');
      onClose();
      toast.success('Follow-up ticket completed successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Complete Follow-up Ticket</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Mark <span className="font-semibold text-slate-900 dark:text-slate-100">"{ticketTitle}"</span> as completed by logging the final pastoral care outcome.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Care Outcome & Resolution *
              </label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. Completed new member orientation and integrated Emily into Children's ministry team. All questions resolved."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Final Closing Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Optional internal archive notes..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              isLoading={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Completed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
