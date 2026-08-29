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
import { CreateYouthEventPayload } from '@/services/youthService';
import { Calendar, MapPin, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface YouthEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateYouthEventPayload) => Promise<void>;
  currentUserName?: string;
}

export function YouthEventDialog({
  isOpen,
  onClose,
  onSave,
  currentUserName = 'James Anderson',
}: YouthEventDialogProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Youth Night');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [targetGrades, setTargetGrades] = useState('6th - 12th Grade');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      toast.error('Please enter event title and start date/time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        location: location.trim() || undefined,
        lead_leader_name: currentUserName,
        target_grades: targetGrades,
      });
      toast.success('Youth event scheduled.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Calendar className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Schedule Youth Event</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Plan youth services, camps, lock-ins, and student outreach activities.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Event Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Youth Encounter Night Live"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Event Category
                </label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly Youth Service">Weekly Youth Service</SelectItem>
                    <SelectItem value="Annual Retreat">Annual Retreat / Camp</SelectItem>
                    <SelectItem value="Leadership Discipleship">Leadership Discipleship</SelectItem>
                    <SelectItem value="Outreach / Mission">Outreach / Mission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Grades
                </label>
                <Input
                  value={targetGrades}
                  onChange={(e) => setTargetGrades(e.target.value)}
                  placeholder="6th - 12th Grade"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Start Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  End Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Location / Venue
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Youth Auditorium & Gym"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Event Description & Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the youth band worship, message theme, pizza, and games..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-800"
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              isLoading={isSubmitting}
            >
              Schedule Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
