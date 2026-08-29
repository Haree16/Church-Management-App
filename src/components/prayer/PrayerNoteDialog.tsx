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
import { Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface PrayerNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (note: string) => Promise<void>;
  prayerTitle: string;
}

export function PrayerNoteDialog({
  isOpen,
  onClose,
  onAddNote,
  prayerTitle,
}: PrayerNoteDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error('Please enter prayer note content.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddNote(note.trim());
      setNote('');
      onClose();
      toast.success('Prayer note logged successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add prayer note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <MessageSquare className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Add Prayer Note</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Log an intercession update, encouragement, or scripture for <span className="font-semibold text-slate-900 dark:text-slate-100">"{prayerTitle}"</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Prayed with the family during morning devotions. Claiming Isaiah 41:10 for peace and strength..."
              rows={4}
              className="w-full rounded-md border border-slate-200 bg-transparent p-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800"
              autoFocus
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={isSubmitting}>
              Save Prayer Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
