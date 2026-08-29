import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Filter,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  ListOrdered,
  Eye,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { eventService, CreateEventPayload } from '@/services/eventService';
import { DEMO_SETTINGS, DEMO_GROUPS, DEMO_MINISTRIES, DEMO_MEMBERS, DEMO_USERS } from '@/lib/mockData';
import { ChurchEvent, EventType, Profile } from '@/types/database';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { EventDetailModal } from '@/components/events/EventDetailModal';
import { EventRegisterDialog } from '@/components/events/EventRegisterDialog';
import { toast } from 'sonner';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

interface UnifiedCalendarItem {
  id: string;
  title: string;
  category: 'church_event' | 'service_timing' | 'group_meeting' | 'ministry';
  startDate: Date;
  endDate: Date;
  location: string;
  color: string;
  eventType?: EventType | string;
  originalEvent?: ChurchEvent;
  organizer?: string;
  details?: string | null;
}

export function CalendarPage() {
  const { activeChurch } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  // Navigation date
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 21)); // August 2026
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Filters
  const [showEvents, setShowEvents] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showGroups, setShowGroups] = useState(true);

  // Events from service
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const availableProfiles: Profile[] = useMemo(() => {
    return DEMO_USERS.map((u) => {
      const parts = u.name.split(' ');
      return {
        id: u.id,
        email: u.email,
        first_name: parts[0] || u.name,
        last_name: parts.slice(1).join(' ') || '',
        display_name: u.name,
        phone: u.phone,
        avatar_url: u.avatar,
        is_super_admin: u.role === 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents(churchId);
      setEvents(data);
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [churchId]);

  // Aggregate unified calendar items
  const calendarItems = useMemo<UnifiedCalendarItem[]>(() => {
    const items: UnifiedCalendarItem[] = [];

    // 1. Church Events
    if (showEvents) {
      events.forEach((e) => {
        const start = new Date(e.start_date);
        const end = new Date(e.end_date);
        items.push({
          id: `evt-${e.id}`,
          title: e.name,
          category: 'church_event',
          startDate: start,
          endDate: end,
          location: e.location || 'Church Campus',
          color:
            e.event_type === 'Conference'
              ? 'bg-purple-600 text-white'
              : e.event_type === 'Youth Event'
              ? 'bg-amber-600 text-white'
              : e.event_type === 'Prayer Meeting'
              ? 'bg-sky-600 text-white'
              : 'bg-indigo-600 text-white',
          eventType: e.event_type,
          originalEvent: e,
          organizer: e.organizer?.display_name || undefined,
          details: e.description || null,
        });
      });
    }

    // 2. Weekly Recurring Services (projected across the current month)
    if (showServices && DEMO_SETTINGS.service_timings) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        DEMO_SETTINGS.service_timings.forEach((timing) => {
          if (dayMap[timing.day] === dayOfWeek) {
            const [timeStr, ampm] = timing.time.split(' ');
            let [hours, minutes] = (timeStr || '10:00').split(':').map(Number);
            if (ampm?.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (ampm?.toUpperCase() === 'AM' && hours === 12) hours = 0;

            const serviceStart = new Date(year, month, day, hours || 10, minutes || 0);
            const serviceEnd = new Date(year, month, day, (hours || 10) + 1, (minutes || 0) + 30);

            items.push({
              id: `service-${timing.id}-${day}`,
              title: timing.name,
              category: 'service_timing',
              startDate: serviceStart,
              endDate: serviceEnd,
              location: 'Main Sanctuary',
              color: 'bg-emerald-600 text-white',
              eventType: timing.type,
              details: `Weekly ${timing.name} Service (${timing.time})`,
            });
          }
        });
      }
    }

    // 3. Small Group Gatherings
    if (showGroups) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      DEMO_GROUPS.forEach((g) => {
        if (g.meeting_day && dayMap[g.meeting_day] !== undefined) {
          const targetDay = dayMap[g.meeting_day];
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === targetDay) {
              const start = new Date(year, month, day, 19, 0);
              const end = new Date(year, month, day, 20, 30);
              items.push({
                id: `grp-${g.id}-${day}`,
                title: `${g.name} (Small Group)`,
                category: 'group_meeting',
                startDate: start,
                endDate: end,
                location: g.location || "Leader's Home",
                color: 'bg-teal-600 text-white',
                eventType: 'Small Group',
                organizer: g.leader?.display_name || undefined,
                details: g.description || null,
              });
            }
          }
        }
      });
    }

    return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, showEvents, showServices, showGroups, currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleItemClick = (item: UnifiedCalendarItem) => {
    if (item.originalEvent) {
      setSelectedEvent(item.originalEvent);
      setIsDetailOpen(true);
    } else {
      toast.info(item.title, {
        description: `${item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${
          item.location
        }`,
      });
    }
  };

  const handleSaveEvent = async (payload: CreateEventPayload) => {
    await eventService.createEvent(churchId, payload);
    await loadEvents();
  };

  // Month Grid Calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; items: UnifiedCalendarItem[] }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, isCurrentMonth: false, items: [] });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayItems = calendarItems.filter(
        (item) =>
          item.startDate.getFullYear() === year &&
          item.startDate.getMonth() === month &&
          item.startDate.getDate() === d
      );
      days.push({ date, isCurrentMonth: true, items: dayItems });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, items: [] });
    }

    return days;
  }, [currentDate, calendarItems]);

  // Week View Calculation
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const days: { date: Date; items: UnifiedCalendarItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayItems = calendarItems.filter(
        (item) =>
          item.startDate.getFullYear() === d.getFullYear() &&
          item.startDate.getMonth() === d.getMonth() &&
          item.startDate.getDate() === d.getDate()
      );
      days.push({ date: d, items: dayItems });
    }
    return days;
  }, [currentDate, calendarItems]);

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Church Master Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unified schedule of worship services, conferences, retreats, small group gatherings, and ministry programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => {
              setSelectedEvent(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add New Event
          </Button>
        </div>
      </div>

      {/* Control Bar: View Switcher, Navigation, and Category Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 min-w-[160px] text-center">
                {monthTitle}
              </h2>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={handleToday}>
                Today
              </Button>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

          {/* Category Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-medium text-[11px] mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Categories:
            </span>

            <button
              onClick={() => setShowEvents(!showEvents)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium ${
                showEvents
                  ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Church Events
            </button>

            <button
              onClick={() => setShowServices(!showServices)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium ${
                showServices
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sunday & Midweek Services
            </button>

            <button
              onClick={() => setShowGroups(!showGroups)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-medium ${
                showGroups
                  ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Small Groups
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {monthData.map((dayObj, index) => {
              const isToday =
                new Date().toDateString() === dayObj.date.toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors ${
                    dayObj.isCurrentMonth
                      ? 'bg-white dark:bg-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-sky-600 text-white font-bold'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>

                    {dayObj.items.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        +{dayObj.items.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Items for this day */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayObj.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer shadow-xs transition-opacity hover:opacity-90 ${item.color}`}
                        title={`${item.title} (${item.startDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })})`}
                      >
                        {item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {viewMode === 'week' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 min-h-[480px]">
            {weekData.map((dayObj, i) => {
              const isToday =
                new Date().toDateString() === dayObj.date.toDateString();

              return (
                <div key={i} className="flex flex-col">
                  {/* Header */}
                  <div
                    className={`p-2.5 text-center border-b border-slate-200 dark:border-slate-800 ${
                      isToday
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="text-[11px] font-medium text-slate-500 uppercase">
                      {dayObj.date.toLocaleDateString([], { weekday: 'short' })}
                    </p>
                    <p className={`text-base font-bold ${isToday ? 'text-sky-600' : ''}`}>
                      {dayObj.date.getDate()}
                    </p>
                  </div>

                  {/* Day events stack */}
                  <div className="p-2 flex-1 space-y-2 bg-white dark:bg-slate-950">
                    {dayObj.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`p-2 rounded-lg text-xs cursor-pointer shadow-xs hover:opacity-90 transition-all ${item.color}`}
                      >
                        <p className="font-bold truncate">{item.title}</p>
                        <p className="text-[10px] opacity-90 font-mono mt-0.5">
                          {item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] opacity-80 truncate mt-0.5">📍 {item.location}</p>
                      </div>
                    ))}
                    {dayObj.items.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-6">No scheduled events</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {viewMode === 'day' && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">
              {currentDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {(() => {
              const dayItems = calendarItems.filter(
                (item) =>
                  item.startDate.getFullYear() === currentDate.getFullYear() &&
                  item.startDate.getMonth() === currentDate.getMonth() &&
                  item.startDate.getDate() === currentDate.getDate()
              );

              if (dayItems.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CalendarIcon className="h-8 w-8 text-slate-300" />
                    <p className="text-xs">No church gatherings or events on this date.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer bg-white dark:bg-slate-900/60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {item.eventType || item.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {item.startDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {item.endDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> {item.location}
                          </p>
                        </div>
                      </div>

                      {item.originalEvent && (
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 self-end sm:self-center mt-2 sm:mt-0">
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {viewMode === 'agenda' && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-sky-600" />
              Monthly Agenda Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {calendarItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No events found.</div>
            ) : (
              calendarItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 text-center shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        {item.startDate.toLocaleDateString([], { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
                        {item.startDate.getDate()}
                      </span>
                    </div>

                    <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.eventType || item.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px] font-medium hidden sm:inline-flex">
                    {item.category.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <EventFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEvent}
        availableMinistries={DEMO_MINISTRIES}
        availableGroups={DEMO_GROUPS}
        availableProfiles={availableProfiles}
      />

      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
        onEdit={() => {
          setIsDetailOpen(false);
          setIsFormOpen(true);
        }}
        onDelete={async () => {
          if (!selectedEvent) return;
          await eventService.deleteEvent(churchId, selectedEvent.id);
          setIsDetailOpen(false);
          await loadEvents();
        }}
        onRegister={() => {
          setIsDetailOpen(false);
          setIsRegisterOpen(true);
        }}
        onViewAttendees={() => {
          setIsDetailOpen(false);
          toast.info(`View attendees in Event Management page`);
        }}
      />

      <EventRegisterDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={async (payload) => {
          await eventService.createRegistration(churchId, payload);
          await loadEvents();
        }}
        event={selectedEvent}
        availableMembers={DEMO_MEMBERS}
      />
    </div>
  );
}
export default CalendarPage;
