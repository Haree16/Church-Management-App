import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChurchEvent } from '@/types/database';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Ticket,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ChurchEvent | null;
  onEdit: () => void;
  onDelete: () => void;
  onRegister: () => void;
  onViewAttendees: () => void;
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onRegister,
  onViewAttendees,
}: EventDetailModalProps) {
  if (!event) return null;

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedStartTime = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedEndTime = endDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const registrationCount = event.registration_count || 0;
  const capacity = event.capacity || 0;
  const percentageFilled = capacity > 0 ? Math.min(100, Math.round((registrationCount / capacity) * 100)) : 0;
  const isFull = capacity > 0 && registrationCount >= capacity;

  const copyQR = () => {
    navigator.clipboard.writeText(event.qr_code_identifier);
    toast.success('QR Identifier copied to clipboard: ' + event.qr_code_identifier);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 overflow-hidden">
        {/* Event Banner */}
        {event.banner_url ? (
          <div className="relative h-44 w-full overflow-hidden bg-slate-900">
            <img
              src={event.banner_url}
              alt={event.name}
              className="h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs">
                  {event.event_type}
                </Badge>
                {event.is_featured && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1">
                    <Sparkles className="h-3 w-3" /> Featured
                  </Badge>
                )}
              </div>
              <Badge
                variant={event.status === 'published' ? 'default' : 'secondary'}
                className="capitalize text-xs font-semibold"
              >
                {event.status}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-sky-600 to-indigo-700 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none text-xs">
                {event.event_type}
              </Badge>
              {event.is_featured && (
                <Badge className="bg-amber-400 text-slate-950 font-bold text-xs gap-1">
                  <Sparkles className="h-3 w-3" /> Featured
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {event.status}
            </Badge>
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {event.name}
            </h2>
            {event.description && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Key Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Date & Time */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="h-8 w-8 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-500">Date & Schedule</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{formattedDate}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {formattedStartTime} – {formattedEndTime}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="h-8 w-8 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-500">Location / Venue</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{event.location}</p>
                {event.address && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{event.address}</p>
                )}
              </div>
            </div>

            {/* Host Ministry / Organizer */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-500">Host & Organizer</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {event.ministry?.name || event.group?.name || 'Grace Valley Church'}
                </p>
                {event.organizer && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Lead: {event.organizer.display_name}
                  </p>
                )}
              </div>
            </div>

            {/* Capacity & Attendance */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                <Ticket className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-500">Capacity & Registrations</p>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {registrationCount} {capacity > 0 ? `/ ${capacity}` : 'registered'}
                  </span>
                </div>
                {capacity > 0 && (
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isFull ? 'bg-rose-500' : percentageFilled > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentageFilled}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Identification Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-lg border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/30 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Event QR Check-in Identifier
                </p>
                <p className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                  {event.qr_code_identifier}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs bg-white dark:bg-slate-900 shrink-0"
              onClick={copyQR}
            >
              <Copy className="h-3.5 w-3.5" /> Copy Identifier
            </Button>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={onEdit}
              >
                <Edit className="h-3.5 w-3.5" /> Edit Event
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 flex-1 sm:flex-none"
                onClick={onViewAttendees}
              >
                <Users className="h-3.5 w-3.5" /> View Attendees ({registrationCount})
              </Button>
              <Button
                size="sm"
                className="text-xs gap-1.5 flex-1 sm:flex-none"
                onClick={onRegister}
              >
                <Ticket className="h-3.5 w-3.5" /> Register Attendee
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
