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
import { Archive, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ArchiveDonationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  donationInfo: {
    donor: string;
    amount: number;
    fund: string;
    refNumber?: string | null;
  } | null;
}

export function ArchiveDonationDialog({
  isOpen,
  onClose,
  onConfirm,
  donationInfo,
}: ArchiveDonationDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donationInfo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter an audit reason for archiving this donation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
      toast.success('Donation archived and audit log updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Archive className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Archive Financial Transaction</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Archive <span className="font-semibold text-slate-900 dark:text-slate-100">${donationInfo.amount.toFixed(2)}</span> from <span className="font-semibold text-slate-900 dark:text-slate-100">{donationInfo.donor}</span> ({donationInfo.fund}).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Archiving removes this contribution from active annual reports while preserving complete audit trail records.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Reason for Archiving / Voiding *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Check returned for NSF, duplicate batch entry, or donor requested refund..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-800"
                autoFocus
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
              isLoading={isSubmitting}
            >
              Confirm Archive
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
