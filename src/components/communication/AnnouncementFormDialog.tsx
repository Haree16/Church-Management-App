import React, { useState, useEffect } from 'react';
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
import {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
  AnnouncementPriority,
} from '@/types/database';
import { CreateAnnouncementPayload, UpdateAnnouncementPayload } from '@/services/announcementService';
import { DEMO_MINISTRIES, DEMO_GROUPS } from '@/lib/mockData';
import { Megaphone, Calendar, Users, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AnnouncementFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateAnnouncementPayload | UpdateAnnouncementPayload) => Promise<void>;
  initialData?: Announcement | null;
  mode?: 'create' | 'edit';
  currentUserName?: string;
  currentUserRole?: string;
}

export function AnnouncementFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
  currentUserName = 'Church Staff',
  currentUserRole = 'Staff',
}: AnnouncementFormDialogProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('everyone');
  const [targetMinistryId, setTargetMinistryId] = useState<string>('none');
  const [targetGroupId, setTargetGroupId] = useState<string>('none');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [channels, setChannels] = useState<string[]>(['in_app']);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<AnnouncementStatus>('published');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title || '');
      setMessage(initialData.message || initialData.content || '');
      setAudience(initialData.audience || 'everyone');
      setTargetMinistryId(initialData.target_ministry_id || 'none');
      setTargetGroupId(initialData.target_group_id || 'none');
      setPriority(initialData.priority || 'normal');
      setChannels(initialData.channels || ['in_app']);
      setPublishDate(initialData.publish_date ? initialData.publish_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setExpiryDate(initialData.expiry_date ? initialData.expiry_date.split('T')[0] : '');
      setStatus(initialData.status || 'published');
    } else {
      setTitle('');
      setMessage('');
      setAudience('everyone');
      setTargetMinistryId('none');
      setTargetGroupId('none');
      setPriority('normal');
      setChannels(['in_app']);
      setPublishDate(new Date().toISOString().split('T')[0]);
      setExpiryDate('');
      setStatus('published');
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!message.trim()) newErrors.message = 'Announcement message content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAnnouncementPayload | UpdateAnnouncementPayload = {
        title: title.trim(),
        message: message.trim(),
        author_name: currentUserName,
        author_role: currentUserRole,
        audience,
        target_ministry_id: targetMinistryId !== 'none' ? targetMinistryId : null,
        target_group_id: targetGroupId !== 'none' ? targetGroupId : null,
        priority,
        channels,
        publish_date: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        status,
      };

      await onSave(payload);
      toast.success(mode === 'create' ? 'Announcement created.' : 'Announcement updated.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Megaphone className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">
                {mode === 'create' ? 'Broadcast Announcement' : 'Edit Announcement'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Publish congregation bulletins, ministry notices, parent updates, and mobile alerts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Announcement Title *
              </label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g. Fall Small Groups Semester Kickoff & Signups"
                className={errors.title ? 'border-red-500' : ''}
                autoFocus
              />
              {errors.title && <span className="text-[10px] text-red-500">{errors.title}</span>}
            </div>

            {/* Audience & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Audience *
                </label>
                <Select value={audience} onValueChange={(val: any) => setAudience(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone (All Congregation)</SelectItem>
                    <SelectItem value="members">Church Members Only</SelectItem>
                    <SelectItem value="ministry">Specific Ministry</SelectItem>
                    <SelectItem value="group">Specific Small Group</SelectItem>
                    <SelectItem value="volunteers">Volunteers & Rosters</SelectItem>
                    <SelectItem value="youth">Youth (Students)</SelectItem>
                    <SelectItem value="parents">Parents & Guardians</SelectItem>
                    <SelectItem value="new_members">New Members / Visitors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Priority / Urgency
                </label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Information</SelectItem>
                    <SelectItem value="important">Important Bulletin</SelectItem>
                    <SelectItem value="urgent">Urgent / Time-Sensitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* If Ministry or Group selected */}
            {audience === 'ministry' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Specific Ministry
                </label>
                <Select value={targetMinistryId} onValueChange={setTargetMinistryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Ministry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Choose a ministry...</SelectItem>
                    {DEMO_MINISTRIES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {audience === 'group' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Specific Small Group
                </label>
                <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Small Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Choose a group...</SelectItem>
                    {DEMO_GROUPS.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Body */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Announcement Message / Bulletin Content *
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                }}
                placeholder="Write the full announcement text, event details, instructions, or hyperlinks..."
                rows={4}
                className={`w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800 ${
                  errors.message ? 'border-red-500' : ''
                }`}
              />
              {errors.message && <span className="text-[10px] text-red-500">{errors.message}</span>}
            </div>

            {/* Dates & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Publish Date
                </label>
                <Input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Expiry Date (Optional)
                </label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Publication Status
                </label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published (Live)</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Channels Broadcast */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Broadcast Distribution Channels
              </label>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes('in_app')}
                    onChange={() => toggleChannel('in_app')}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span>In-App / Web Portal</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes('email')}
                    onChange={() => toggleChannel('email')}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span>Email Bulletin</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes('sms')}
                    onChange={() => toggleChannel('sms')}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span>SMS Alert</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes('push')}
                    onChange={() => toggleChannel('push')}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                  />
                  <span>Mobile Push</span>
                </label>
              </div>
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
              {mode === 'create' ? 'Publish Announcement' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
