import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Volunteer,
  VolunteerAssignment,
  VolunteerStatus,
  AssignmentStatus,
  ChurchMember,
} from '@/types/database';
import { DEMO_MEMBERS, DEMO_MINISTRIES } from '@/lib/mockData';

const LOCAL_STORAGE_VOLUNTEERS_KEY = 'church_cms_volunteers_data';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'church_cms_assignments_data';

export interface CreateVolunteerPayload {
  member_id: string;
  skills: string[];
  availability: string[];
  preferred_service?: string;
  status?: VolunteerStatus;
  background_check_status?: string;
  notes?: string;
}

export interface CreateAssignmentPayload {
  volunteer_id: string;
  ministry_id?: string;
  service_timing_id?: string;
  event_name: string;
  assignment_date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  responsibility: string;
  status?: AssignmentStatus;
  notes?: string;
}

export const SKILL_OPTIONS = [
  'Singing / Vocals',
  'Acoustic Guitar',
  'Electric Guitar',
  'Bass Guitar',
  'Drums & Percussion',
  'Keyboard / Piano',
  'Sound & Audio Engineering',
  'Live Streaming / Multicam',
  'Lighting & Stage Production',
  'ProPresenter Slides / Lyrics',
  'Greeting & Welcome Team',
  'Sanctuary Ushering',
  'Coffee Bar & Hospitality',
  'First Aid & Safety Response',
  'Parking Team & Traffic',
  'Infants & Nursery Care',
  'Elementary Sunday School',
  'Youth Small Group Leader',
  'Event Setup & Teardown',
  'Community Outreach & Pantry',
  'Spanish Translation',
];

export const AVAILABILITY_OPTIONS = [
  'Sunday Morning 09:00 AM (Traditional)',
  'Sunday Morning 11:15 AM (Contemporary)',
  'Wednesday Evening 07:00 PM (Midweek/Youth)',
  'Thursday Evening Rehearsal',
  'Saturday Morning Outreach & Setup',
  'On-Call / Special Holiday Conferences',
];

export const PREFERRED_SERVICES = [
  'Sunday Morning Traditional (09:00 AM)',
  'Sunday Contemporary Service (11:15 AM)',
  'Wednesday Midweek & Youth (07:00 PM)',
  'Any Service / Flexible',
];

export const RESPONSIBILITY_OPTIONS = [
  'Lead Vocals',
  'Backup Vocals (Alto/Tenor)',
  'Acoustic Guitar Rhythm',
  'Electric Guitar Lead',
  'Bass Guitarist',
  'Drums & Percussionist',
  'Keys / Piano Lead',
  'Front of House Audio Engineer',
  'Broadcast Stream Video Mixer',
  'Camera 1 Operator (Center)',
  'Camera 2 Operator (Stage Left)',
  'Lyric & Scripture Projection Tech',
  'Stage Lighting Tech',
  'Main Entrance Door Greeter',
  'Welcome Desk Host & Visitor Liaison',
  'Foyer Coffee Bar Barista',
  'Main Sanctuary Usher Lead',
  'Offering & Tithes Collector',
  'Communion Cup Server',
  'Medical & Emergency Responder',
  'Parking Lot Traffic Coordinator',
  'Kids Kingdom Elementary Teacher',
  'Nursery Infant Caregiver',
  'Toddler Room Assistant',
  'Check-in Kiosk & Security Helper',
  'Youth Student Mentor',
];

const INITIAL_DEMO_VOLUNTEERS: Volunteer[] = [];
const INITIAL_DEMO_ASSIGNMENTS: VolunteerAssignment[] = [];

function getLocalVolunteers(churchId: string): Volunteer[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VOLUNTEERS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local volunteers:', e);
  }
  return [];
}

function saveLocalVolunteers(churchId: string, list: Volunteer[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_VOLUNTEERS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local volunteers:', e);
  }
}

function getLocalAssignments(churchId: string): VolunteerAssignment[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ASSIGNMENTS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local assignments:', e);
  }
  return [];
}

function saveLocalAssignments(churchId: string, list: VolunteerAssignment[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_ASSIGNMENTS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local assignments:', e);
  }
}

export const volunteerService = {
  async getVolunteers(churchId: string): Promise<Volunteer[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('volunteers')
        .select(`
          *,
          profile:profiles(*),
          church_member:church_members(*)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Volunteer[];
      }
    }

    const local = getLocalVolunteers(churchId);
    return local.map((v) => {
      const mem = DEMO_MEMBERS.find((m) => m.id === v.member_id || m.user_id === v.user_id);
      return {
        ...v,
        profile: mem?.profile,
        church_member: mem,
      };
    });
  },

  async createVolunteer(churchId: string, payload: CreateVolunteerPayload): Promise<Volunteer> {
    const member = DEMO_MEMBERS.find((m) => m.id === payload.member_id);
    const newVolunteer: Volunteer = {
      id: `vol-${Date.now()}`,
      church_id: churchId,
      user_id: member?.user_id || `u-${Date.now()}`,
      member_id: payload.member_id,
      skills: payload.skills || [],
      availability: payload.availability || ['Sunday Morning'],
      preferred_service: payload.preferred_service || 'Sunday Morning',
      status: payload.status || 'active',
      background_check_status: payload.background_check_status || 'approved',
      background_check_date: new Date().toISOString().split('T')[0],
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: member?.profile,
      church_member: member,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('volunteers')
        .insert([newVolunteer])
        .select('*')
        .single();
      if (!error && data) return data as Volunteer;
    }

    const local = getLocalVolunteers(churchId);
    const updated = [newVolunteer, ...local];
    saveLocalVolunteers(churchId, updated);
    return newVolunteer;
  },

  async updateVolunteer(
    churchId: string,
    volunteerId: string,
    payload: Partial<CreateVolunteerPayload>
  ): Promise<Volunteer> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('volunteers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', volunteerId)
        .select('*')
        .single();
      if (!error && data) return data as Volunteer;
    }

    const local = getLocalVolunteers(churchId);
    const idx = local.findIndex((v) => v.id === volunteerId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalVolunteers(churchId, local);
      return local[idx];
    }
    throw new Error('Volunteer not found');
  },

  async deleteVolunteer(churchId: string, volunteerId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('volunteers').delete().eq('id', volunteerId);
    }
    const local = getLocalVolunteers(churchId);
    saveLocalVolunteers(churchId, local.filter((v) => v.id !== volunteerId));
  },

  async getAssignments(
    churchId: string,
    filters?: {
      date?: string;
      ministryId?: string;
      volunteerId?: string;
      status?: string;
    }
  ): Promise<VolunteerAssignment[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('volunteer_assignments')
        .select(`
          *,
          volunteer:volunteers(
            *,
            profile:profiles(*)
          ),
          ministry:ministries(*)
        `)
        .eq('church_id', churchId)
        .order('assignment_date', { ascending: true });

      if (filters?.date) query = query.eq('assignment_date', filters.date);
      if (filters?.ministryId && filters.ministryId !== 'all') query = query.eq('ministry_id', filters.ministryId);
      if (filters?.volunteerId && filters.volunteerId !== 'all') query = query.eq('volunteer_id', filters.volunteerId);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as VolunteerAssignment[];
      }
    }

    const localVolunteers = await this.getVolunteers(churchId);
    let localAssignments = getLocalAssignments(churchId);

    if (filters?.date) {
      localAssignments = localAssignments.filter((a) => a.assignment_date === filters.date);
    }
    if (filters?.ministryId && filters.ministryId !== 'all') {
      localAssignments = localAssignments.filter((a) => a.ministry_id === filters.ministryId);
    }
    if (filters?.volunteerId && filters.volunteerId !== 'all') {
      localAssignments = localAssignments.filter((a) => a.volunteer_id === filters.volunteerId);
    }
    if (filters?.status && filters.status !== 'all') {
      localAssignments = localAssignments.filter((a) => a.status === filters.status);
    }

    return localAssignments.map((a) => ({
      ...a,
      volunteer: localVolunteers.find((v) => v.id === a.volunteer_id),
      ministry: DEMO_MINISTRIES.find((m) => m.id === a.ministry_id) || null,
    }));
  },

  async createAssignment(
    churchId: string,
    payload: CreateAssignmentPayload
  ): Promise<VolunteerAssignment> {
    const newAsgn: VolunteerAssignment = {
      id: `asgn-${Date.now()}`,
      church_id: churchId,
      volunteer_id: payload.volunteer_id,
      ministry_id: payload.ministry_id || null,
      service_timing_id: payload.service_timing_id || null,
      event_name: payload.event_name,
      assignment_date: payload.assignment_date,
      start_time: payload.start_time,
      end_time: payload.end_time || null,
      location: payload.location || 'Main Sanctuary',
      responsibility: payload.responsibility,
      status: payload.status || 'scheduled',
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('volunteer_assignments')
        .insert([newAsgn])
        .select('*')
        .single();
      if (!error && data) return data as VolunteerAssignment;
    }

    const local = getLocalAssignments(churchId);
    const updated = [newAsgn, ...local];
    saveLocalAssignments(churchId, updated);
    return newAsgn;
  },

  async updateAssignmentStatus(
    churchId: string,
    assignmentId: string,
    status: AssignmentStatus
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase
        .from('volunteer_assignments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);
    }
    const local = getLocalAssignments(churchId);
    const idx = local.findIndex((a) => a.id === assignmentId);
    if (idx >= 0) {
      local[idx].status = status;
      saveLocalAssignments(churchId, local);
    }
  },

  async deleteAssignment(churchId: string, assignmentId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('volunteer_assignments').delete().eq('id', assignmentId);
    }
    const local = getLocalAssignments(churchId);
    saveLocalAssignments(churchId, local.filter((a) => a.id !== assignmentId));
  },

  async getVolunteerStats(churchId: string) {
    const volunteers = await this.getVolunteers(churchId);
    const assignments = await this.getAssignments(churchId);

    const activeVolunteers = volunteers.filter((v) => v.status === 'active');
    const scheduledShifts = assignments.filter((a) => a.status === 'scheduled');
    const confirmedShifts = assignments.filter((a) => a.status === 'confirmed');
    const completedShifts = assignments.filter((a) => a.status === 'completed');

    const confirmedPercent = assignments.length > 0
      ? Math.round(((confirmedShifts.length + completedShifts.length) / assignments.length) * 100)
      : 100;

    return {
      totalVolunteers: volunteers.length,
      activeVolunteers: activeVolunteers.length,
      pendingVolunteers: volunteers.filter((v) => v.status === 'pending').length,
      totalAssignments: assignments.length,
      scheduledCount: scheduledShifts.length,
      confirmedCount: confirmedShifts.length,
      confirmedPercent,
    };
  },
};

