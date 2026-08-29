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
import { Megaphone, Pin } from 'lucide-react';
import { CreateGroupAnnouncementPayload } from '@/services/groupService';
import { toast } from 'sonner';

interface GroupAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  authorId: string;
  authorName: string;
  onSave: (payload: CreateGroupAnnouncementPayload) => Promise<void>;
}

export function GroupAnnouncementDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  authorId,
  authorName,
  onSave,
}: GroupAnnouncementDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and message content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        group_id: groupId,
        author_id: authorId,
        author_name: authorName,
        title: title.trim(),
        content: content.trim(),
        is_pinned: isPinned,
      });
      toast.success('Announcement published to group');
      setTitle('');
      setContent('');
      setIsPinned(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post announcement');
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
              <Megaphone className="h-5 w-5 text-sky-600" />
              Post Group Announcement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Share updates, devotional reflections, or dinner plans with <strong>{groupName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Announcement Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next Tuesday Potluck Dinner & Study Topic"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement or discussion notes here..."
                rows={4}
                required
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="isPinned" className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                <Pin className="h-3.5 w-3.5 text-amber-500" />
                Pin to top of group notice board
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Publish Notice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
