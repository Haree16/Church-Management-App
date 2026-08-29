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
import { ChurchEvent, EventType, EventStatus, Ministry, Group, Profile } from '@/types/database';
import { CreateEventPayload, EVENT_TYPES } from '@/services/eventService';
import { Calendar, Clock, MapPin, Users, Sparkles, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateEventPayload) => Promise<void>;
  initialData?: ChurchEvent | null;
  availableMinistries?: Ministry[];
  availableGroups?: Group[];
  availableProfiles?: Profile[];
  mode?: 'create' | 'edit';
}

const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: 'published', label: 'Published (Active & Visible)' },
  { value: 'draft', label: 'Draft (Internal Only)' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

export function EventFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableMinistries = [],
  availableGroups = [],
  availableProfiles = [],
  mode = 'create',
}: EventFormDialogProps) {
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<CreateEventPayload>({
    name: '',
    description: '',
    event_type: 'Sunday Service',
    start_date: getDefaultStartDate(),
    end_date: getDefaultEndDate(),
    location: '',
    address: '',
    organizer_id: '',
    ministry_id: '',
    group_id: '',
    capacity: 100,
    registration_required: false,
    registration_deadline: '',
    status: 'published',
    banner_url: '',
    is_featured: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      const formatDateForInput = (iso?: string | null) => {
        if (!iso) return '';
        try {
          return new Date(iso).toISOString().slice(0, 16);
        } catch {
          return '';
        }
      };

      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        event_type: initialData.event_type || 'Sunday Service',
        start_date: formatDateForInput(initialData.start_date) || getDefaultStartDate(),
        end_date: formatDateForInput(initialData.end_date) || getDefaultEndDate(),
        location: initialData.location || '',
        address: initialData.address || '',
        organizer_id: initialData.organizer_id || '',
        ministry_id: initialData.ministry_id || '',
        group_id: initialData.group_id || '',
        capacity: initialData.capacity || 100,
        registration_required: initialData.registration_required || false,
        registration_deadline: formatDateForInput(initialData.registration_deadline) || '',
        status: initialData.status || 'published',
        banner_url: initialData.banner_url || '',
        is_featured: initialData.is_featured || false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        event_type: 'Sunday Service',
        start_date: getDefaultStartDate(),
        end_date: getDefaultEndDate(),
        location: 'Main Sanctuary',
        address: '',
        organizer_id: availableProfiles[0]?.id || '',
        ministry_id: '',
        group_id: '',
        capacity: 100,
        registration_required: false,
        registration_deadline: '',
        status: 'published',
        banner_url: '',
        is_featured: false,
      });
    }
    setErrors({});
  }, [initialData, mode, isOpen, availableProfiles]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Event name is required';
    if (!formData.location.trim()) errs.location = 'Location / Room is required';
    if (!formData.start_date) errs.start_date = 'Start date & time is required';
    if (!formData.end_date) errs.end_date = 'End date & time is required';

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        errs.end_date = 'End date & time must be after start date & time';
      }
    }

    if (formData.capacity && formData.capacity < 1) {
      errs.capacity = 'Capacity must be at least 1';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve the highlighted form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      // Normalize dates to ISO strings
      const payload: CreateEventPayload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        registration_deadline: formData.registration_deadline
          ? new Date(formData.registration_deadline).toISOString()
          : undefined,
        organizer_id: formData.organizer_id || undefined,
        ministry_id: formData.ministry_id || undefined,
        group_id: formData.group_id || undefined,
      };

      await onSave(payload);
      toast.success(
        mode === 'create'
          ? 'Event successfully created!'
          : 'Event updated successfully!'
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            {mode === 'create' ? 'Create New Event' : 'Edit Event Details'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Configure schedule, location, capacity, registration, and affiliations for this event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g., Annual Leadership Summit 2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-rose-500' : ''}
              />
              {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Type <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.event_type}
                onValueChange={(val) => setFormData({ ...formData, event_type: val as EventType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event Type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as EventStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description & Schedule Highlights
            </label>
            <textarea
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-[70px]"
              placeholder="Provide event details, themes, what attendees should bring, or guest speaker info..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-600" /> Start Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`text-xs ${errors.start_date ? 'border-rose-500' : ''}`}
              />
              {errors.start_date && <p className="text-[11px] text-rose-500">{errors.start_date}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-600" /> End Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={`text-xs ${errors.end_date ? 'border-rose-500' : ''}`}
              />
              {errors.end_date && <p className="text-[11px] text-rose-500">{errors.end_date}</p>}
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-sky-600" /> Venue / Room Location <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g., Main Sanctuary, Fellowship Hall, Youth Room"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={errors.location ? 'border-rose-500' : ''}
              />
              {errors.location && <p className="text-[11px] text-rose-500">{errors.location}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Street Address (Optional)
              </label>
              <Input
                placeholder="e.g., No. 12, Mount Road, Anna Salai, Chennai"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Organizer, Ministry, Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-sky-600" /> Lead Organizer
              </label>
              <Select
                value={formData.organizer_id || 'none'}
                onValueChange={(val) => setFormData({ ...formData, organizer_id: val === 'none' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Organizer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Specific Organizer</SelectItem>
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Host Ministry (Optional)
              </label>
              <Select
                value={formData.ministry_id || 'none'}
                onValueChange={(val) => setFormData({ ...formData, ministry_id: val === 'none' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None / All Church" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (All Church)</SelectItem>
                  {availableMinistries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Host Group (Optional)
              </label>
              <Select
                value={formData.group_id || 'none'}
                onValueChange={(val) => setFormData({ ...formData, group_id: val === 'none' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Registration & Capacity Controls */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Registration & Capacity
                </p>
                <p className="text-[11px] text-slate-500">
                  Manage ticket capacities and attendee registration deadlines.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.registration_required}
                  onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Require Registration
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Venue / Ticket Capacity
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 250"
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="text-xs"
                />
              </div>

              {formData.registration_required && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Registration Cutoff Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.registration_deadline || ''}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Banner & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-sky-600" /> Event Banner URL (Optional)
              </label>
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.banner_url || ''}
                onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              />
            </div>

            <div className="pt-5 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 w-full hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured Event
                  </span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
