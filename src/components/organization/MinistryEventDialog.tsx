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
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { CreateMinistryEventPayload } from '@/services/ministryService';
import { toast } from 'sonner';

interface MinistryEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ministryId: string;
  ministryName: string;
  onSave: (payload: CreateMinistryEventPayload) => Promise<void>;
}

export function MinistryEventDialog({
  isOpen,
  onClose,
  ministryId,
  ministryName,
  onSave,
}: MinistryEventDialogProps) {
  const [formData, setFormData] = useState<CreateMinistryEventPayload>({
    ministry_id: ministryId,
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '06:30 PM',
    end_time: '08:30 PM',
    location: 'Main Sanctuary Stage',
    type: 'rehearsal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ministry_id: ministryId,
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '06:30 PM',
      end_time: '08:30 PM',
      location: 'Main Sanctuary Stage',
      type: 'rehearsal',
    }));
    setErrors({});
  }, [ministryId, isOpen]);

  const handleChange = (field: keyof CreateMinistryEventPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.title.trim()) err.title = 'Event title is required';
    if (!formData.event_date) err.event_date = 'Date is required';
    if (!formData.location.trim()) err.location = 'Location is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success('Ministry event scheduled successfully!');
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              Schedule Event / Rehearsal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Schedule team rehearsals, workshops, or meetings for <strong className="text-slate-800 dark:text-slate-200">{ministryName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event / Session Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Thursday Band & Vocals Rehearsal"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <span className="text-[10px] text-red-500">{errors.title}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Event Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => handleChange('type', val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rehearsal">Rehearsal / Practice</SelectItem>
                    <SelectItem value="meeting">Team Meeting</SelectItem>
                    <SelectItem value="workshop">Workshop / Training</SelectItem>
                    <SelectItem value="service">Church Service</SelectItem>
                    <SelectItem value="outreach">Community Outreach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                  className={errors.event_date ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Start Time
                </label>
                <Input
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  placeholder="06:30 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  End Time
                </label>
                <Input
                  value={formData.end_time || ''}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  placeholder="08:30 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Location / Room *
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Main Sanctuary Stage, Room 204"
                icon={<MapPin className="h-4 w-4" />}
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && <span className="text-[10px] text-red-500">{errors.location}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Setlist / Agenda
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Details, worship set songs, training goals, materials to bring..."
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
              Schedule Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
