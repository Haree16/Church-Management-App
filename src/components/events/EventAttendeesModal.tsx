import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChurchEvent, EventRegistration, RegistrationStatus } from '@/types/database';
import { eventService } from '@/services/eventService';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Trash2,
  Check,
  AlertCircle,
  Ticket,
  Mail,
  Phone,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ChurchEvent | null;
  churchId: string;
  onAddAttendee: () => void;
  onRefreshEvent?: () => void;
}

export function EventAttendeesModal({
  isOpen,
  onClose,
  event,
  churchId,
  onAddAttendee,
  onRefreshEvent,
}: EventAttendeesModalProps) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadRegistrations = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const data = await eventService.getRegistrations(churchId, event.id);
      setRegistrations(data);
    } catch (err: any) {
      toast.error('Failed to load attendee registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      loadRegistrations();
      setSearchTerm('');
      setStatusFilter('all');
    }
  }, [isOpen, event]);

  if (!event) return null;

  const handleStatusChange = async (regId: string, newStatus: RegistrationStatus) => {
    try {
      await eventService.updateRegistrationStatus(churchId, regId, newStatus);
      toast.success(`Attendee status updated to ${newStatus}`);
      await loadRegistrations();
      onRefreshEvent?.();
    } catch (err: any) {
      toast.error('Failed to update registration status');
    }
  };

  const handleDelete = async (regId: string, attendeeName: string) => {
    if (!confirm(`Are you sure you want to remove registration for ${attendeeName}?`)) return;
    try {
      await eventService.deleteRegistration(churchId, regId);
      toast.success(`Removed registration for ${attendeeName}`);
      await loadRegistrations();
      onRefreshEvent?.();
    } catch (err: any) {
      toast.error('Failed to remove registration');
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.attendee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.attendee_email && r.attendee_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.attendee_phone && r.attendee_phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTickets = registrations.reduce((sum, r) => sum + (r.ticket_count || 1), 0);
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;
  const checkedInCount = registrations.filter((r) => r.status === 'checked_in').length;
  const waitlistCount = registrations.filter((r) => r.status === 'waitlist').length;

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'checked_in':
        return (
          <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" /> Checked In
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 gap-1 text-[10px]">
            <Check className="h-3 w-3" /> Confirmed
          </Badge>
        );
      case 'waitlist':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 gap-1 text-[10px]">
            <Clock className="h-3 w-3" /> Waitlist
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Event Attendees & Roster
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {event.name} • {event.location}
              </DialogDescription>
            </div>

            <Button size="sm" onClick={onAddAttendee} className="h-8 gap-1 text-xs shrink-0">
              <UserPlus className="h-3.5 w-3.5" />
              Register Attendee
            </Button>
          </div>
        </DialogHeader>

        {/* Metric summary banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">Total Registrations</span>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {registrations.length} ({totalTickets} tickets)
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">Confirmed</span>
            <span className="font-bold text-sm text-sky-600 dark:text-sky-400">
              {confirmedCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">Checked In</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {checkedInCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">On Waitlist</span>
            <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
              {waitlistCount}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'confirmed', 'checked_in', 'waitlist', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Attendee list */}
        <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[360px] space-y-2 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading registrations...</div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">No registrations found for current filter.</p>
            </div>
          ) : (
            filteredRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {reg.attendee_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {reg.attendee_name}
                      </span>
                      {reg.member_id ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-300 text-sky-700 dark:text-sky-400">
                          Member
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400">
                          Visitor
                        </Badge>
                      )}
                      {getStatusBadge(reg.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      {reg.attendee_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {reg.attendee_email}
                        </span>
                      )}
                      {reg.attendee_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {reg.attendee_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" /> {reg.ticket_count} ticket{reg.ticket_count > 1 ? 's' : ''}
                      </span>
                    </div>

                    {reg.notes && (
                      <p className="text-[10px] text-slate-400 italic">Notes: {reg.notes}</p>
                    )}
                  </div>
                </div>

                {/* Quick actions for this attendee */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {reg.status !== 'checked_in' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200"
                      onClick={() => handleStatusChange(reg.id, 'checked_in')}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Check In
                    </Button>
                  )}

                  {reg.status === 'waitlist' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 text-sky-600 border-sky-200 hover:bg-sky-50"
                      onClick={() => handleStatusChange(reg.id, 'confirmed')}
                    >
                      Confirm Spot
                    </Button>
                  )}

                  {reg.status === 'checked_in' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-slate-500"
                      onClick={() => handleStatusChange(reg.id, 'confirmed')}
                    >
                      Undo Check-in
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => handleDelete(reg.id, reg.attendee_name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
