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
import { Calendar, Clock, MapPin, ShieldCheck, UserCheck } from 'lucide-react';
import { Volunteer, Ministry, AssignmentStatus } from '@/types/database';
import {
  CreateAssignmentPayload,
  RESPONSIBILITY_OPTIONS,
} from '@/services/volunteerService';
import { toast } from 'sonner';

interface VolunteerAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateAssignmentPayload) => Promise<void>;
  availableVolunteers: Volunteer[];
  availableMinistries: Ministry[];
  defaultDate?: string;
  defaultMinistryId?: string;
  defaultVolunteerId?: string;
}

export function VolunteerAssignmentDialog({
  isOpen,
  onClose,
  onSave,
  availableVolunteers = [],
  availableMinistries = [],
  defaultDate,
  defaultMinistryId,
  defaultVolunteerId,
}: VolunteerAssignmentDialogProps) {
  const [volunteerId, setVolunteerId] = useState(defaultVolunteerId || '');
  const [ministryId, setMinistryId] = useState(defaultMinistryId || 'none');
  const [eventName, setEventName] = useState('Sunday Contemporary Service (11:15 AM)');
  const [assignmentDate, setAssignmentDate] = useState(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('10:15 AM');
  const [endTime, setEndTime] = useState('12:45 PM');
  const [location, setLocation] = useState('Main Sanctuary Stage');
  const [responsibility, setResponsibility] = useState(RESPONSIBILITY_OPTIONS[0]);
  const [customResponsibility, setCustomResponsibility] = useState('');
  const [status, setStatus] = useState<AssignmentStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultVolunteerId) setVolunteerId(defaultVolunteerId);
      if (defaultMinistryId) setMinistryId(defaultMinistryId);
      if (defaultDate) setAssignmentDate(defaultDate);
    }
  }, [isOpen, defaultVolunteerId, defaultMinistryId, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerId) {
      toast.error('Please select a volunteer to schedule');
      return;
    }

    const finalResponsibility = customResponsibility.trim() || responsibility;
    if (!finalResponsibility) {
      toast.error('Please assign a specific responsibility or position');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        volunteer_id: volunteerId,
        ministry_id: ministryId === 'none' ? undefined : ministryId,
        event_name: eventName,
        assignment_date: assignmentDate,
        start_time: startTime,
        end_time: endTime || undefined,
        location: location,
        responsibility: finalResponsibility,
        status: status,
        notes: notes.trim() || undefined,
      });
      toast.success('Volunteer shift scheduled successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              Schedule Volunteer Shift
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a qualified volunteer to a Sunday service, event, or ministry department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            {/* 1. Volunteer Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Volunteer Member *
              </label>
              <Select value={volunteerId} onValueChange={setVolunteerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a volunteer..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {availableVolunteers.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.profile?.display_name || v.profile?.email || 'Volunteer'} — (
                      {v.skills?.slice(0, 2).join(', ') || 'General'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Ministry Department */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ministry Department (Optional)
              </label>
              <Select value={ministryId} onValueChange={setMinistryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ministry department..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / All Church</SelectItem>
                  {availableMinistries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Service / Event Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Service / Event Name *
              </label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sunday Contemporary Service (11:15 AM)"
                required
              />
            </div>

            {/* 4. Date and Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Shift Date *
                </label>
                <Input
                  type="date"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Location / Station *
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Sanctuary Stage, Foyer"
                  icon={<MapPin className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            {/* 5. Start and End Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Call / Start Time *
                </label>
                <Input
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="10:15 AM"
                  icon={<Clock className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dismissal Time
                </label>
                <Input
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="12:45 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* 6. Responsibility / Role */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Service Responsibility / Position *
              </label>
              <Select value={responsibility} onValueChange={setResponsibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {RESPONSIBILITY_OPTIONS.map((resp) => (
                    <SelectItem key={resp} value={resp}>
                      {resp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 7. Status and Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as AssignmentStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled (Pending confirmation)</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Shift Notes / Soundcheck Info
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. In-ear monitor pack #4..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              Schedule Volunteer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
