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
import { Calendar, Clock, MapPin } from 'lucide-react';
import { CreateGroupEventPayload } from '@/services/groupService';
import { toast } from 'sonner';

interface GroupMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  defaultLocation?: string;
  onSave: (payload: CreateGroupEventPayload) => Promise<void>;
}

export function GroupMeetingDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  defaultLocation = "Leader's Home",
  onSave,
}: GroupMeetingDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00 PM');
  const [endTime, setEndTime] = useState('08:45 PM');
  const [location, setLocation] = useState(defaultLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setEventDate(new Date().toISOString().split('T')[0]);
      setLocation(defaultLocation);
    }
  }, [isOpen, defaultLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !location.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        group_id: groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: location.trim(),
      });
      toast.success('Meeting scheduled successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule meeting');
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
              <Calendar className="h-5 w-5 text-sky-600" />
              Schedule Group Meeting / Social
            </DialogTitle>
            <DialogDescription className="text-xs">
              Plan the next Bible study session or fellowship night for <strong>{groupName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Meeting / Event Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Fellowship & Romans 9 Study"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date *
                </label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meeting Location *
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. David's House"
                  icon={<MapPin className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Start Time
                </label>
                <Input
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="07:00 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  End Time
                </label>
                <Input
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="08:45 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Session Agenda / Potluck Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Study passage, food assignments, childcare arrangements..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Schedule Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
