import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  ChurchEvent,
  EventRegistration,
  EventType,
  EventStatus,
  RegistrationStatus,
  ChurchMember,
  Profile,
} from '@/types/database';
import { DEMO_CHURCH, DEMO_MEMBERS, DEMO_MINISTRIES, DEMO_GROUPS } from '@/lib/mockData';

const LOCAL_STORAGE_EVENTS_KEY = 'church_cms_events_data';
const LOCAL_STORAGE_REGISTRATIONS_KEY = 'church_cms_registrations_data';

export interface CreateEventPayload {
  name: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string;
  address?: string;
  organizer_id?: string;
  ministry_id?: string;
  group_id?: string;
  capacity?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  status?: EventStatus;
  banner_url?: string;
  is_featured?: boolean;
}

export interface RegisterEventPayload {
  event_id: string;
  member_id?: string;
  visitor_id?: string;
  attendee_name: string;
  attendee_email?: string;
  attendee_phone?: string;
  ticket_count?: number;
  status?: RegistrationStatus;
  notes?: string;
}

export const EVENT_TYPES: EventType[] = [
  'Sunday Service',
  'Conference',
  'Prayer Meeting',
  'Bible Study',
  'Youth Event',
  "Children's Event",
  'Outreach',
  'Retreat',
  'Meeting',
  'Other',
];

const INITIAL_DEMO_EVENTS: ChurchEvent[] = [];
const INITIAL_DEMO_REGISTRATIONS: EventRegistration[] = [];

function getLocalEvents(churchId: string): ChurchEvent[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_EVENTS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local events:', e);
  }
  return [];
}

function saveLocalEvents(churchId: string, list: ChurchEvent[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_EVENTS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local events:', e);
  }
}

function getLocalRegistrations(churchId: string): EventRegistration[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_REGISTRATIONS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local registrations:', e);
  }
  return [];
}

function saveLocalRegistrations(churchId: string, list: EventRegistration[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_REGISTRATIONS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local registrations:', e);
  }
}

export const eventService = {
  async getEvents(
    churchId: string,
    filters?: {
      eventType?: string;
      status?: string;
      ministryId?: string;
      searchQuery?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ChurchEvent[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles(*),
          ministry:ministries(*),
          group:groups(*)
        `)
        .eq('church_id', churchId)
        .order('start_date', { ascending: true });

      if (filters?.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.ministryId && filters.ministryId !== 'all') {
        query = query.eq('ministry_id', filters.ministryId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as ChurchEvent[];
      }
    }

    const local = getLocalEvents(churchId);
    const regs = getLocalRegistrations(churchId);

    let filtered = local.map((e) => {
      const eventRegs = regs.filter((r) => r.event_id === e.id);
      const totalTickets = eventRegs.reduce((acc, r) => acc + (r.ticket_count || 1), 0);
      return {
        ...e,
        organizer: DEMO_MEMBERS.find((m) => m.user_id === e.organizer_id)?.profile || null,
        ministry: DEMO_MINISTRIES.find((m) => m.id === e.ministry_id) || null,
        group: DEMO_GROUPS.find((g) => g.id === e.group_id) || null,
        registration_count: totalTickets,
        attendee_count: eventRegs.filter((r) => r.status === 'checked_in' || r.status === 'confirmed').length,
      };
    });

    if (filters?.eventType && filters.eventType !== 'all') {
      filtered = filtered.filter((e) => e.event_type === filters.eventType);
    }
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((e) => e.status === filters.status);
    }
    if (filters?.ministryId && filters.ministryId !== 'all') {
      filtered = filtered.filter((e) => e.ministry_id === filters.ministryId);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.location.toLowerCase().includes(q)
      );
    }

    return filtered.sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  },

  async getEventById(churchId: string, eventId: string): Promise<ChurchEvent> {
    const events = await this.getEvents(churchId);
    const event = events.find((e) => e.id === eventId);
    if (!event) throw new Error('Event not found');

    const registrations = await this.getRegistrations(churchId, eventId);
    return {
      ...event,
      registrations,
    };
  },

  async createEvent(churchId: string, payload: CreateEventPayload): Promise<ChurchEvent> {
    const newEvent: ChurchEvent = {
      id: `evt-${Date.now()}`,
      church_id: churchId,
      name: payload.name,
      description: payload.description || null,
      event_type: payload.event_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      location: payload.location,
      address: payload.address || null,
      organizer_id: payload.organizer_id || null,
      ministry_id: payload.ministry_id || null,
      group_id: payload.group_id || null,
      capacity: payload.capacity || null,
      registration_required: payload.registration_required ?? false,
      registration_deadline: payload.registration_deadline || null,
      status: payload.status || 'published',
      banner_url: payload.banner_url || null,
      qr_code_identifier: `QR-GV-EVT-${Date.now().toString().slice(-6)}`,
      is_featured: payload.is_featured ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select('*')
        .single();
      if (!error && data) return data as ChurchEvent;
    }

    const local = getLocalEvents(churchId);
    const updated = [newEvent, ...local];
    saveLocalEvents(churchId, updated);
    return newEvent;
  },

  async updateEvent(
    churchId: string,
    eventId: string,
    payload: Partial<CreateEventPayload>
  ): Promise<ChurchEvent> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('events')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', eventId)
        .select('*')
        .single();
      if (!error && data) return data as ChurchEvent;
    }

    const local = getLocalEvents(churchId);
    const idx = local.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      saveLocalEvents(churchId, local);
      return local[idx];
    }
    throw new Error('Event not found');
  },

  async deleteEvent(churchId: string, eventId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('events').delete().eq('id', eventId);
    }
    const local = getLocalEvents(churchId);
    saveLocalEvents(churchId, local.filter((e) => e.id !== eventId));
  },

  async getRegistrations(churchId: string, eventId?: string): Promise<EventRegistration[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('event_registrations')
        .select(`
          *,
          event:events(*),
          member:church_members(*),
          visitor:visitors(*)
        `)
        .eq('church_id', churchId)
        .order('registered_at', { ascending: false });

      if (eventId) query = query.eq('event_id', eventId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as EventRegistration[];
      }
    }

    let local = getLocalRegistrations(churchId);
    if (eventId) {
      local = local.filter((r) => r.event_id === eventId);
    }

    return local.map((r) => ({
      ...r,
      member: DEMO_MEMBERS.find((m) => m.id === r.member_id) || null,
    }));
  },

  async createRegistration(
    churchId: string,
    payload: RegisterEventPayload
  ): Promise<EventRegistration> {
    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      church_id: churchId,
      event_id: payload.event_id,
      member_id: payload.member_id || null,
      visitor_id: payload.visitor_id || null,
      attendee_name: payload.attendee_name,
      attendee_email: payload.attendee_email || null,
      attendee_phone: payload.attendee_phone || null,
      ticket_count: payload.ticket_count || 1,
      status: payload.status || 'confirmed',
      notes: payload.notes || null,
      registered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert([newReg])
        .select('*')
        .single();
      if (!error && data) return data as EventRegistration;
    }

    const local = getLocalRegistrations(churchId);
    const updated = [newReg, ...local];
    saveLocalRegistrations(churchId, updated);
    return newReg;
  },

  async updateRegistrationStatus(
    churchId: string,
    registrationId: string,
    status: RegistrationStatus
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase
        .from('event_registrations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', registrationId);
    }
    const local = getLocalRegistrations(churchId);
    const idx = local.findIndex((r) => r.id === registrationId);
    if (idx >= 0) {
      local[idx].status = status;
      saveLocalRegistrations(churchId, local);
    }
  },

  async deleteRegistration(churchId: string, registrationId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('event_registrations').delete().eq('id', registrationId);
    }
    const local = getLocalRegistrations(churchId);
    saveLocalRegistrations(churchId, local.filter((r) => r.id !== registrationId));
  },

  async getEventStats(churchId: string) {
    const events = await this.getEvents(churchId);
    const registrations = await this.getRegistrations(churchId);

    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.end_date) >= now && e.status === 'published');
    const completedEvents = events.filter((e) => new Date(e.end_date) < now || e.status === 'completed');

    const totalRegistrations = registrations.reduce((acc, r) => acc + (r.ticket_count || 1), 0);
    const totalCapacity = upcomingEvents.reduce((acc, e) => acc + (e.capacity || 0), 0);

    const averageFill = totalCapacity > 0
      ? Math.min(Math.round((totalRegistrations / totalCapacity) * 100), 100)
      : 75;

    return {
      totalEvents: events.length,
      upcomingCount: upcomingEvents.length,
      completedCount: completedEvents.length,
      totalRegistrations,
      averageFill,
    };
  },
};
