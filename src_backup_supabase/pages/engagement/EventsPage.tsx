import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Users,
  MapPin,
  Clock,
  Ticket,
  Sparkles,
  QrCode,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { CanAccess } from '@/components/ui/can-access';
import { useAuth } from '@/context/AuthContext';
import { eventService, EVENT_TYPES, CreateEventPayload, RegisterEventPayload } from '@/services/eventService';
import { DEMO_MEMBERS, DEMO_MINISTRIES, DEMO_GROUPS, DEMO_USERS } from '@/lib/mockData';
import { ChurchEvent, EventType, EventStatus, Profile } from '@/types/database';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { EventDetailModal } from '@/components/events/EventDetailModal';
import { EventRegisterDialog } from '@/components/events/EventRegisterDialog';
import { EventAttendeesModal } from '@/components/events/EventAttendeesModal';
import { toast } from 'sonner';

export function EventsPage() {
  const navigate = useNavigate();
  const { activeChurch } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  // State
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'all' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);

  // Available metadata for dropdowns
  const availableMinistries = DEMO_MINISTRIES;
  const availableGroups = DEMO_GROUPS;
  const availableMembers = DEMO_MEMBERS;
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

  // Fetch events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents(churchId);
      setEvents(data);
    } catch (err: any) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [churchId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = events.length;
    const now = new Date();
    const upcoming = events.filter(
      (e) => new Date(e.end_date) >= now && e.status !== 'cancelled'
    ).length;
    const totalRegistrations = events.reduce(
      (sum, e) => sum + (e.registration_count || 0),
      0
    );
    const capacityEvents = events.filter((e) => (e.capacity || 0) > 0);
    const avgCapacity =
      capacityEvents.length > 0
        ? Math.round(
            (capacityEvents.reduce(
              (sum, e) => sum + ((e.registration_count || 0) / (e.capacity || 1)),
              0
            ) /
              capacityEvents.length) *
              100
          )
        : 0;

    return { total, upcoming, totalRegistrations, avgCapacity };
  }, [events]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      // Search
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        e.name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.location.toLowerCase().includes(q);

      // Type
      const matchesType = selectedType === 'all' || e.event_type === selectedType;

      // Status
      const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;

      // Ministry
      const matchesMinistry =
        selectedMinistry === 'all' || e.ministry_id === selectedMinistry;

      // Timeframe
      let matchesTime = true;
      if (timeframe === 'upcoming') {
        matchesTime = new Date(e.end_date) >= now;
      } else if (timeframe === 'past') {
        matchesTime = new Date(e.end_date) < now;
      }

      return matchesSearch && matchesType && matchesStatus && matchesMinistry && matchesTime;
    });
  }, [events, searchTerm, selectedType, selectedStatus, selectedMinistry, timeframe]);

  // Actions
  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setFormMode('edit');
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveEvent = async (payload: CreateEventPayload) => {
    if (formMode === 'create') {
      await eventService.createEvent(churchId, payload);
    } else if (selectedEvent) {
      await eventService.updateEvent(churchId, selectedEvent.id, payload);
    }
    await loadEvents();
  };

  const handleDeleteEvent = async (event: ChurchEvent) => {
    if (!confirm(`Are you sure you want to delete event "${event.name}"?`)) return;
    try {
      await eventService.deleteEvent(churchId, event.id);
      toast.success('Event deleted successfully');
      setIsDetailOpen(false);
      await loadEvents();
    } catch (err: any) {
      toast.error('Failed to delete event');
    }
  };

  const handleOpenRegister = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(false);
    setIsRegisterOpen(true);
  };

  const handleSaveRegistration = async (payload: RegisterEventPayload) => {
    await eventService.createRegistration(churchId, payload);
    await loadEvents();
  };

  const handleOpenAttendees = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(false);
    setIsAttendeesOpen(true);
  };

  const handleViewDetail = (event: ChurchEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
            Published
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">
            Draft
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]">
            Completed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Event Management & Registrations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize services, conferences, retreats, camps, and manage attendee tickets & QR check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => navigate('/engagement/calendar')}
          >
            <Calendar className="h-4 w-4" /> Calendar View
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => navigate('/engagement/attendance')}
          >
            <QrCode className="h-4 w-4" /> Attendance & QR
          </Button>

          <CanAccess permission="events:manage">
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </CanAccess>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Total Events</span>
              <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Upcoming Gatherings</span>
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.upcoming}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled on master calendar</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Total Registrations</span>
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalRegistrations}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Members and registered guests</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Avg Capacity Filled</span>
              <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.avgCapacity}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Capacity utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Controls Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search events by name, location, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
              {(['all', 'upcoming', 'past'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    timeframe === t
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-md p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${
                  viewMode === 'table'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types ({EVENT_TYPES.length})</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Ministries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Host Ministries</SelectItem>
                  {availableMinistries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Presentation (Grid or Table) */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading church events...</div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10 text-sky-600" />}
          title="No events found"
          description="Try adjusting your search criteria or create a new church event."
          actionLabel="Create New Event"
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const startDate = new Date(event.start_date);
            const regCount = event.registration_count || 0;
            const cap = event.capacity || 0;
            const pct = cap > 0 ? Math.min(100, Math.round((regCount / cap) * 100)) : 0;
            const isFull = cap > 0 && regCount >= cap;

            return (
              <Card
                key={event.id}
                className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col group"
              >
                {/* Banner image or top gradient */}
                {event.banner_url ? (
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={event.banner_url}
                      alt={event.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <Badge className="bg-sky-500 hover:bg-sky-600 text-white font-medium text-[10px]">
                        {event.event_type}
                      </Badge>
                      {event.is_featured && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> Featured
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 text-white text-xs font-mono">
                      {startDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}{' '}
                      • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-r from-sky-600 to-indigo-700 p-3 flex items-center justify-between text-white relative">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-white/20 text-white hover:bg-white/30 border-none text-[10px]">
                        {event.event_type}
                      </Badge>
                      {event.is_featured && (
                        <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> Featured
                        </Badge>
                      )}
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                )}

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {!event.banner_url && (
                      <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        {startDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}{' '}
                        • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    <h3
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors cursor-pointer line-clamp-1"
                      onClick={() => handleViewDetail(event)}
                    >
                      {event.name}
                    </h3>

                    {event.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-1 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      {event.ministry && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.ministry.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity bar & Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Ticket className="h-3 w-3" /> Registrations
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {regCount} {cap > 0 ? `/ ${cap}` : ''}
                        </span>
                      </div>
                      {cap > 0 && (
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 gap-1"
                          onClick={() => handleViewDetail(event)}
                        >
                          <Eye className="h-3 w-3" /> Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 gap-1"
                          onClick={() => handleOpenAttendees(event)}
                        >
                          <Users className="h-3 w-3" /> Roster ({regCount})
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1"
                          onClick={() => handleOpenRegister(event)}
                        >
                          <UserPlus className="h-3 w-3" /> Register
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(event)} className="text-xs gap-2">
                              <Edit className="h-3.5 w-3.5" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(event.qr_code_identifier);
                                toast.success('Copied QR: ' + event.qr_code_identifier);
                              }}
                              className="text-xs gap-2"
                            >
                              <QrCode className="h-3.5 w-3.5" /> Copy QR Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteEvent(event)}
                              className="text-xs gap-2 text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Event Name & Type</th>
                  <th className="p-3 font-semibold">Schedule</th>
                  <th className="p-3 font-semibold">Location</th>
                  <th className="p-3 font-semibold">Affiliation</th>
                  <th className="p-3 font-semibold">Capacity</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.map((event) => {
                  const startDate = new Date(event.start_date);
                  const regCount = event.registration_count || 0;
                  const cap = event.capacity || 0;

                  return (
                    <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {event.name}
                          {event.is_featured && <Sparkles className="h-3 w-3 text-amber-500" />}
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {event.event_type}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{startDate.toLocaleDateString()}</div>
                        <div className="text-slate-400">
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{event.location}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {event.ministry?.name || event.group?.name || 'All Church'}
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-semibold">
                          {regCount} {cap > 0 ? `/ ${cap}` : ''}
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(event.status)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleViewDetail(event)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleOpenRegister(event)}
                          >
                            Register
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals and Dialogs */}
      <EventFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEvent}
        initialData={selectedEvent}
        mode={formMode}
        availableMinistries={availableMinistries}
        availableGroups={availableGroups}
        availableProfiles={availableProfiles}
      />

      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
        onEdit={() => selectedEvent && handleOpenEdit(selectedEvent)}
        onDelete={() => selectedEvent && handleDeleteEvent(selectedEvent)}
        onRegister={() => selectedEvent && handleOpenRegister(selectedEvent)}
        onViewAttendees={() => selectedEvent && handleOpenAttendees(selectedEvent)}
      />

      <EventRegisterDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleSaveRegistration}
        event={selectedEvent}
        availableMembers={availableMembers}
      />

      <EventAttendeesModal
        isOpen={isAttendeesOpen}
        onClose={() => setIsAttendeesOpen(false)}
        event={selectedEvent}
        churchId={churchId}
        onAddAttendee={() => selectedEvent && handleOpenRegister(selectedEvent)}
        onRefreshEvent={loadEvents}
      />
    </div>
  );
}
export default EventsPage;
