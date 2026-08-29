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
import { Badge } from '@/components/ui/badge';
import { ChurchEvent, ChurchMember, RegistrationStatus } from '@/types/database';
import { RegisterEventPayload } from '@/services/eventService';
import { UserCheck, UserPlus, Users, Ticket, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface EventRegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (payload: RegisterEventPayload) => Promise<void>;
  event: ChurchEvent | null;
  availableMembers?: ChurchMember[];
}

export function EventRegisterDialog({
  isOpen,
  onClose,
  onRegister,
  event,
  availableMembers = [],
}: EventRegisterDialogProps) {
  const [attendeeType, setAttendeeType] = useState<'member' | 'guest'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<RegistrationStatus>('confirmed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAttendeeType('member');
      setSelectedMemberId(availableMembers[0]?.id || '');
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setTicketCount(1);
      setNotes('');
      setStatus('confirmed');
      setErrors({});
    }
  }, [isOpen, availableMembers]);

  if (!event) return null;

  const currentCount = event.registration_count || 0;
  const capacity = event.capacity || 0;
  const isAtCapacity = capacity > 0 && currentCount >= capacity;
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - currentCount) : null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (attendeeType === 'member') {
      if (!selectedMemberId) errs.member = 'Please select a church member';
    } else {
      if (!guestName.trim()) errs.guestName = 'Guest name is required';
    }
    if (ticketCount < 1) errs.ticketCount = 'Must reserve at least 1 ticket';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let attendee_name = '';
      let attendee_email = '';
      let attendee_phone = '';
      let member_id: string | undefined = undefined;

      if (attendeeType === 'member') {
        const member = availableMembers.find((m) => m.id === selectedMemberId);
        if (!member) throw new Error('Selected member not found');
        attendee_name = member.profile?.display_name || 'Member';
        attendee_email = member.profile?.email || '';
        attendee_phone = member.profile?.phone || '';
        member_id = member.id;
      } else {
        attendee_name = guestName.trim();
        attendee_email = guestEmail.trim() || undefined as any;
        attendee_phone = guestPhone.trim() || undefined as any;
      }

      await onRegister({
        event_id: event.id,
        member_id,
        attendee_name,
        attendee_email,
        attendee_phone,
        ticket_count: ticketCount,
        status: isAtCapacity && status === 'confirmed' ? 'waitlist' : status,
        notes: notes.trim() || undefined,
      });

      toast.success(
        isAtCapacity
          ? `${attendee_name} placed on Event Waitlist`
          : `Registration confirmed for ${attendee_name}!`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Ticket className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            Register Attendee
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {event.name}
          </DialogDescription>
        </DialogHeader>

        {/* Capacity summary banner */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Capacity Status:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span>{currentCount}</span>
            {capacity > 0 && <span>/ {capacity}</span>}
            {isAtCapacity ? (
              <Badge variant="destructive" className="text-[10px] ml-1 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> FULL (Waitlist)
              </Badge>
            ) : spotsLeft !== null ? (
              <Badge variant="secondary" className="text-[10px] ml-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
                {spotsLeft} spots left
              </Badge>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Attendee Type Switch */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAttendeeType('member')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                attendeeType === 'member'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" /> Church Member
            </button>
            <button
              type="button"
              onClick={() => setAttendeeType('guest')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                attendeeType === 'guest'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Guest / Visitor
            </button>
          </div>

          {attendeeType === 'member' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Member <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.profile?.display_name || 'Member'} ({m.membership_number}) - {m.role}
                  </option>
                ))}
              </select>
              {errors.member && <p className="text-[11px] text-rose-500">{errors.member}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Guest Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Jonathan Brooks"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={errors.guestName ? 'border-rose-500' : ''}
                />
                {errors.guestName && <p className="text-[11px] text-rose-500">{errors.guestName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="jonathan@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ticket Count & Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ticket Count
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={ticketCount}
                onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                className="text-xs"
              />
              {errors.ticketCount && <p className="text-[11px] text-rose-500">{errors.ticketCount}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registration Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RegistrationStatus)}
                className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="confirmed">Confirmed</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Special Notes / Dietary / Accommodations
            </label>
            <Input
              placeholder="e.g., Vegetarian meal, wheelchair access"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Registering...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
