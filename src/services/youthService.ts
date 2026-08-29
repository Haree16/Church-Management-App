import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  YouthProfile,
  YouthEvent,
  YouthStatus,
  ChildGender,
} from '@/types/database';
import {
  DEMO_YOUTH_PROFILES,
  DEMO_YOUTH_EVENTS,
  DEMO_GROUPS,
  DEMO_MEMBERS,
} from '@/lib/mockData';

const LOCAL_YOUTH_PROFILES_KEY = 'church_cms_youth_profiles';
const LOCAL_YOUTH_EVENTS_KEY = 'church_cms_youth_events';

export interface CreateYouthPayload {
  name: string;
  grade?: string;
  school_name?: string;
  date_of_birth?: string;
  gender: ChildGender;
  phone?: string;
  email?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  emergency_contact?: string;
  baptism_status?: string;
  mentor_id?: string | null;
  group_id?: string | null;
  status?: YouthStatus;
  notes?: string;
}

export interface UpdateYouthPayload {
  name?: string;
  grade?: string;
  school_name?: string;
  date_of_birth?: string;
  gender?: ChildGender;
  phone?: string;
  email?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  emergency_contact?: string;
  baptism_status?: string;
  mentor_id?: string | null;
  group_id?: string | null;
  status?: YouthStatus;
  notes?: string;
}

export interface CreateYouthEventPayload {
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  lead_leader_name?: string;
  target_grades?: string;
}

function getLocalYouth(churchId: string): YouthProfile[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_YOUTH_PROFILES_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local youth:', e);
  }
  return [];
}

function saveLocalYouth(churchId: string, list: YouthProfile[]) {
  try {
    localStorage.setItem(`${LOCAL_YOUTH_PROFILES_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local youth:', e);
  }
}

function getLocalYouthEvents(churchId: string): YouthEvent[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_YOUTH_EVENTS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local youth events:', e);
  }
  return [];
}

function saveLocalYouthEvents(churchId: string, list: YouthEvent[]) {
  try {
    localStorage.setItem(`${LOCAL_YOUTH_EVENTS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local youth events:', e);
  }
}

export const youthService = {
  async getYouthProfiles(churchId: string): Promise<YouthProfile[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('youth_profiles')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (!error && data) {
        return data as YouthProfile[];
      }
    }

    const list = getLocalYouth(churchId);
    return list.map((y) => {
      const group = y.group_id ? DEMO_GROUPS.find((g) => g.id === y.group_id) : null;
      const mentor = y.mentor_id ? DEMO_MEMBERS.find((m) => m.id === y.mentor_id) : null;
      return {
        ...y,
        group: group || null,
        mentor: mentor || null,
      };
    });
  },

  async createYouthProfile(churchId: string, payload: CreateYouthPayload): Promise<YouthProfile> {
    const mentor = payload.mentor_id ? DEMO_MEMBERS.find((m) => m.id === payload.mentor_id) : null;

    const newYouth: YouthProfile = {
      id: `yth-${Date.now()}`,
      church_id: churchId,
      name: payload.name.trim(),
      grade: payload.grade || null,
      school_name: payload.school_name || null,
      date_of_birth: payload.date_of_birth || null,
      gender: payload.gender,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      parent_name: payload.parent_name?.trim() || null,
      parent_phone: payload.parent_phone?.trim() || null,
      parent_email: payload.parent_email?.trim() || null,
      emergency_contact: payload.emergency_contact?.trim() || null,
      baptism_status: payload.baptism_status || 'not_baptized',
      mentor_id: payload.mentor_id || null,
      mentor_name: mentor ? `${mentor.profile?.first_name} ${mentor.profile?.last_name}` : null,
      group_id: payload.group_id || null,
      status: payload.status || 'active',
      notes: payload.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mentor: mentor || null,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('youth_profiles')
        .insert([{
          church_id: churchId,
          name: newYouth.name,
          grade: newYouth.grade,
          school_name: newYouth.school_name,
          date_of_birth: newYouth.date_of_birth,
          gender: newYouth.gender,
          phone: newYouth.phone,
          email: newYouth.email,
          parent_name: newYouth.parent_name,
          parent_phone: newYouth.parent_phone,
          parent_email: newYouth.parent_email,
          emergency_contact: newYouth.emergency_contact,
          baptism_status: newYouth.baptism_status,
          mentor_id: newYouth.mentor_id,
          mentor_name: newYouth.mentor_name,
          group_id: newYouth.group_id,
          status: newYouth.status,
          notes: newYouth.notes,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as YouthProfile;
      }
    }

    const current = getLocalYouth(churchId);
    const updated = [...current, newYouth];
    saveLocalYouth(churchId, updated);
    return newYouth;
  },

  async updateYouthProfile(churchId: string, id: string, payload: UpdateYouthPayload): Promise<YouthProfile> {
    const current = getLocalYouth(churchId);
    const existing = current.find((y) => y.id === id);
    if (!existing) throw new Error('Youth profile not found');

    const mentor = payload.mentor_id ? DEMO_MEMBERS.find((m) => m.id === payload.mentor_id) : null;

    const updatedYouth: YouthProfile = {
      ...existing,
      ...payload,
      mentor_name: payload.mentor_id ? (mentor ? `${mentor.profile?.first_name} ${mentor.profile?.last_name}` : existing.mentor_name) : existing.mentor_name,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('youth_profiles')
        .update({
          name: updatedYouth.name,
          grade: updatedYouth.grade,
          school_name: updatedYouth.school_name,
          date_of_birth: updatedYouth.date_of_birth,
          gender: updatedYouth.gender,
          phone: updatedYouth.phone,
          email: updatedYouth.email,
          parent_name: updatedYouth.parent_name,
          parent_phone: updatedYouth.parent_phone,
          parent_email: updatedYouth.parent_email,
          emergency_contact: updatedYouth.emergency_contact,
          baptism_status: updatedYouth.baptism_status,
          mentor_id: updatedYouth.mentor_id,
          mentor_name: updatedYouth.mentor_name,
          group_id: updatedYouth.group_id,
          status: updatedYouth.status,
          notes: updatedYouth.notes,
          updated_at: updatedYouth.updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as YouthProfile;
      }
    }

    const updatedList = current.map((y) => (y.id === id ? updatedYouth : y));
    saveLocalYouth(churchId, updatedList);
    return updatedYouth;
  },

  async deleteYouthProfile(churchId: string, id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('youth_profiles').delete().eq('id', id);
    }
    const current = getLocalYouth(churchId);
    const updated = current.filter((y) => y.id !== id);
    saveLocalYouth(churchId, updated);
  },

  // ==========================================
  // YOUTH EVENTS
  // ==========================================
  async getYouthEvents(churchId: string): Promise<YouthEvent[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('youth_events')
        .select('*')
        .eq('church_id', churchId)
        .order('start_time', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as YouthEvent[];
      }
    }
    return getLocalYouthEvents(churchId);
  },

  async createYouthEvent(churchId: string, payload: CreateYouthEventPayload): Promise<YouthEvent> {
    const newEvent: YouthEvent = {
      id: `yevt-${Date.now()}`,
      church_id: churchId,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      event_type: payload.event_type || 'Youth Night',
      start_time: payload.start_time,
      end_time: payload.end_time || null,
      location: payload.location || null,
      lead_leader_name: payload.lead_leader_name || 'Youth Leader',
      target_grades: payload.target_grades || '6th - 12th Grade',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const current = getLocalYouthEvents(churchId);
    const updated = [...current, newEvent];
    saveLocalYouthEvents(churchId, updated);
    return newEvent;
  },
};
