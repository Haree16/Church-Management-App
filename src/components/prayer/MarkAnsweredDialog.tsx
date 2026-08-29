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
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MarkAnsweredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (praiseReport: string) => Promise<void>;
  prayerTitle: string;
}

export function MarkAnsweredDialog({
  isOpen,
  onClose,
  onConfirm,
  prayerTitle,
}: MarkAnsweredDialogProps) {
  const [praiseReport, setPraiseReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!praiseReport.trim()) {
      toast.error('Please share a praise testimony or answer note.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(praiseReport.trim());
      setPraiseReport('');
      onClose();
      toast.success('Praise the Lord! Prayer marked as answered.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as answered.');
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
              <Sparkles className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Mark Prayer as Answered</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Celebrate God's faithfulness! Record the praise testimony for <span className="font-semibold text-slate-900 dark:text-slate-100">"{prayerTitle}"</span> to encourage the church family.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Praise Report & Testimony *
            </label>
            <textarea
              value={praiseReport}
              onChange={(e) => setPraiseReport(e.target.value)}
              placeholder="e.g. God came through! The doctors confirmed full remission and our family is overflowing with gratitude..."
              rows={4}
              className="w-full rounded-md border border-slate-200 bg-transparent p-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
              autoFocus
            />
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
              Publish Praise Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
