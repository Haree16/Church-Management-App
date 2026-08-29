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
import { HeartHandshake } from 'lucide-react';
import { CreateGroupPrayerPayload } from '@/services/groupService';
import { toast } from 'sonner';

interface GroupPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  defaultAuthorName?: string;
  onSave: (payload: CreateGroupPrayerPayload) => Promise<void>;
}

export function GroupPrayerDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  defaultAuthorName = '',
  onSave,
}: GroupPrayerDialogProps) {
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAuthorName(defaultAuthorName);
      setTitle('');
      setRequest('');
    }
  }, [isOpen, defaultAuthorName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) {
      toast.error('Title and prayer request are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        group_id: groupId,
        author_name: authorName.trim() || 'Anonymous Member',
        title: title.trim(),
        request: request.trim(),
      });
      toast.success('Prayer request shared with group');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit prayer');
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
              <HeartHandshake className="h-5 w-5 text-sky-600" />
              Submit Group Prayer Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Share a prayer need or praise report with <strong>{groupName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Name
              </label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your Name (or Leave blank for anonymous)"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Prayer Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Healing for Aunt Mary / Job Search Guidance"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Prayer Description / Details *
              </label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Explain the prayer need and how the group can pray specifically..."
                rows={3}
                required
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Post Prayer Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
