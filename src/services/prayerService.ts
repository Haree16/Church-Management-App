import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PrayerRequest,
  PrayerNote,
  PrayerPrivacy,
  PrayerStatus,
  PrayerCategory,
  UserRole,
} from '@/types/database';
import { DEMO_PRAYER_REQUESTS, DEMO_USERS, DEMO_MINISTRIES, DEMO_MEMBERS } from '@/lib/mockData';

const LOCAL_STORAGE_PRAYERS_KEY = 'church_cms_prayers_data';

export interface CreatePrayerPayload {
  title: string;
  description: string;
  author_name: string;
  author_email?: string | null;
  author_phone?: string | null;
  member_id?: string | null;
  category: PrayerCategory | string;
  privacy: PrayerPrivacy;
  assigned_team_id?: string | null;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface UpdatePrayerPayload {
  title?: string;
  request?: string;
  description?: string;
  category?: string;
  privacy?: PrayerPrivacy;
  status?: PrayerStatus;
  assigned_team_id?: string | null;
  assigned_to?: string | null;
  notes?: string | null;
  praise_report?: string | null;
  is_answered?: boolean;
}

export interface AddPrayerNotePayload {
  prayer_request_id: string;
  note: string;
  author_id?: string | null;
  author_name: string;
  author_role?: string;
}

export const PRAYER_CATEGORIES: { value: PrayerCategory; label: string; iconName?: string }[] = [
  { value: 'healing', label: 'Physical & Emotional Healing' },
  { value: 'family', label: 'Family & Relationships' },
  { value: 'spiritual_growth', label: 'Spiritual Growth & Discernment' },
  { value: 'guidance', label: 'Guidance & Direction' },
  { value: 'financial', label: 'Financial Provision & Career' },
  { value: 'salvation', label: 'Salvation of Loved Ones' },
  { value: 'grief', label: 'Comfort & Bereavement' },
  { value: 'praise', label: 'Praise & Thanksgiving' },
  { value: 'general', label: 'General Prayer' },
  { value: 'other', label: 'Other Special Need' },
];

export const PRAYER_PRIVACY_LEVELS: {
  value: PrayerPrivacy;
  label: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'purple' | 'emerald' | 'amber' | 'destructive' | 'outline';
}[] = [
  {
    value: 'church_wide',
    label: 'Church-wide',
    description: 'Visible to the entire church congregation on the Prayer Wall.',
    badgeVariant: 'emerald',
  },
  {
    value: 'prayer_team',
    label: 'Prayer Team',
    description: 'Shared only with designated Intercessory Prayer Team members & Pastors.',
    badgeVariant: 'purple',
  },
  {
    value: 'pastor_only',
    label: 'Pastor Only',
    description: 'Confidential request visible exclusively to Senior Pastors and Administrators.',
    badgeVariant: 'amber',
  },
  {
    value: 'private',
    label: 'Private (Personal)',
    description: 'Completely private to the author and assigned pastoral caregiver.',
    badgeVariant: 'destructive',
  },
];

export const PRAYER_STATUSES: {
  value: PrayerStatus;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'purple' | 'emerald' | 'amber' | 'outline';
}[] = [
  { value: 'new', label: 'New Request', badgeVariant: 'purple' },
  { value: 'praying', label: 'Actively Praying', badgeVariant: 'default' },
  { value: 'answered', label: 'Answered Praise', badgeVariant: 'emerald' },
  { value: 'closed', label: 'Closed / Archived', badgeVariant: 'secondary' },
];

function getLocalPrayers(churchId: string): PrayerRequest[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PRAYERS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local prayers:', e);
  }
  return [];
}

function saveLocalPrayers(churchId: string, prayers: PrayerRequest[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PRAYERS_KEY}_${churchId}`, JSON.stringify(prayers));
  } catch (e) {
    console.error('Failed to save local prayers:', e);
  }
}

// Hydrate relation objects for UI display
function hydratePrayer(p: PrayerRequest): PrayerRequest {
  return p;
}

export const prayerService = {
  async getPrayerRequests(
    churchId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null
  ): Promise<PrayerRequest[]> {
    let list: PrayerRequest[] = [];

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select(`
          *,
          assigned_leader:profiles!prayer_requests_assigned_to_fkey(*),
          member:church_members(*)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        list = data as PrayerRequest[];
      }
    } else {
      list = getLocalPrayers(churchId);
    }

    // Role-based privacy filtering
    if (!currentUserRole) return list.filter((p) => p.privacy === 'church_wide');

    const isPastorOrAdmin = ['super_admin', 'pastor', 'church_admin'].includes(currentUserRole);

    return list.filter((p) => {
      // 1. Pastors and Admins have full pastoral oversight
      if (isPastorOrAdmin) return true;

      // 2. Author can ALWAYS see their own requests (including private & pastor_only)
      if (currentUserId && (p.member_id === currentUserId || p.author_name?.toLowerCase().includes(currentUserId.toLowerCase()))) {
        return true;
      }

      // 3. User is explicitly assigned to this prayer request
      if (currentUserId && p.assigned_to === currentUserId) return true;

      // 4. Church-wide requests are visible to all authenticated members
      if (p.privacy === 'church_wide') return true;

      // 5. Prayer team requests visible to ministry leaders & prayer team volunteers
      if (p.privacy === 'prayer_team' && ['ministry_leader', 'volunteer'].includes(currentUserRole)) {
        return true;
      }

      return false;
    });
  },

  async getPrayerById(
    churchId: string,
    prayerId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null
  ): Promise<PrayerRequest | null> {
    const list = await this.getPrayerRequests(churchId, currentUserRole, currentUserId);
    return list.find((p) => p.id === prayerId) || null;
  },

  async createPrayerRequest(churchId: string, payload: CreatePrayerPayload): Promise<PrayerRequest> {
    const prayerId = `pr-${Date.now()}`;
    const newPrayer: PrayerRequest = {
      id: prayerId,
      church_id: churchId,
      member_id: payload.member_id || null,
      author_name: payload.author_name,
      author_email: payload.author_email || null,
      author_phone: payload.author_phone || null,
      title: payload.title,
      request: payload.description,
      description: payload.description,
      category: payload.category || 'general',
      privacy: payload.privacy || 'church_wide',
      is_confidential: payload.privacy === 'pastor_only' || payload.privacy === 'private',
      status: 'new',
      is_answered: false,
      assigned_team_id: payload.assigned_team_id || null,
      assigned_to: payload.assigned_to || null,
      notes: payload.notes || null,
      praise_report: null,
      prayer_count: 1,
      prayed_user_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      prayer_notes: [],
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('prayer_requests')
        .insert([{
          church_id: churchId,
          member_id: newPrayer.member_id,
          author_name: newPrayer.author_name,
          author_email: newPrayer.author_email,
          author_phone: newPrayer.author_phone,
          title: newPrayer.title,
          request: newPrayer.request,
          category: newPrayer.category,
          privacy: newPrayer.privacy,
          is_confidential: newPrayer.is_confidential,
          status: newPrayer.status,
          is_answered: false,
          assigned_team_id: newPrayer.assigned_team_id,
          assigned_to: newPrayer.assigned_to,
          notes: newPrayer.notes,
          prayer_count: 1,
        }])
        .select('*')
        .single();

      if (!error && data) {
        return hydratePrayer(data as PrayerRequest);
      }
    }

    const local = getLocalPrayers(churchId);
    const updated = [newPrayer, ...local];
    saveLocalPrayers(churchId, updated);
    return hydratePrayer(newPrayer);
  },

  async updatePrayerRequest(
    churchId: string,
    prayerId: string,
    payload: UpdatePrayerPayload
  ): Promise<PrayerRequest> {
    const isAnswered = payload.status === 'answered' || !!payload.praise_report || payload.is_answered;

    if (isSupabaseConfigured()) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.request !== undefined) updateData.request = payload.request;
      if (payload.description !== undefined) updateData.request = payload.description;
      if (payload.category !== undefined) updateData.category = payload.category;
      if (payload.privacy !== undefined) {
        updateData.privacy = payload.privacy;
        updateData.is_confidential = payload.privacy === 'pastor_only' || payload.privacy === 'private';
      }
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.assigned_team_id !== undefined) updateData.assigned_team_id = payload.assigned_team_id;
      if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to;
      if (payload.notes !== undefined) updateData.notes = payload.notes;
      if (payload.praise_report !== undefined) updateData.praise_report = payload.praise_report;
      if (isAnswered) updateData.is_answered = true;

      const { data, error } = await supabase
        .from('prayer_requests')
        .update(updateData)
        .eq('id', prayerId)
        .select('*')
        .single();

      if (!error && data) {
        return hydratePrayer(data as PrayerRequest);
      }
    }

    const local = getLocalPrayers(churchId);
    const idx = local.findIndex((p) => p.id === prayerId);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...payload,
        request: payload.description || payload.request || local[idx].request,
        description: payload.description || payload.request || local[idx].description,
        is_answered: isAnswered ? true : local[idx].is_answered,
        is_confidential: payload.privacy
          ? payload.privacy === 'pastor_only' || payload.privacy === 'private'
          : local[idx].is_confidential,
        updated_at: new Date().toISOString(),
      };
      saveLocalPrayers(churchId, local);
      return hydratePrayer(local[idx]);
    }

    throw new Error('Prayer request not found');
  },

  async assignPrayerRequest(
    churchId: string,
    prayerId: string,
    assignment: { assigned_to?: string | null; assigned_team_id?: string | null }
  ): Promise<PrayerRequest> {
    return this.updatePrayerRequest(churchId, prayerId, {
      assigned_to: assignment.assigned_to,
      assigned_team_id: assignment.assigned_team_id,
      status: 'praying',
    });
  },

  async changeStatus(
    churchId: string,
    prayerId: string,
    status: PrayerStatus,
    praise_report?: string | null
  ): Promise<PrayerRequest> {
    return this.updatePrayerRequest(churchId, prayerId, {
      status,
      praise_report: praise_report || undefined,
      is_answered: status === 'answered',
    });
  },

  async markAnswered(
    churchId: string,
    prayerId: string,
    praise_report: string
  ): Promise<PrayerRequest> {
    return this.updatePrayerRequest(churchId, prayerId, {
      status: 'answered',
      is_answered: true,
      praise_report,
    });
  },

  async closeRequest(churchId: string, prayerId: string, closingNotes?: string): Promise<PrayerRequest> {
    return this.updatePrayerRequest(churchId, prayerId, {
      status: 'closed',
      notes: closingNotes,
    });
  },

  async addPrayerNote(churchId: string, payload: AddPrayerNotePayload): Promise<PrayerNote> {
    const noteId = `pn-${Date.now()}`;
    const newNote: PrayerNote = {
      id: noteId,
      church_id: churchId,
      prayer_request_id: payload.prayer_request_id,
      author_id: payload.author_id || null,
      author_name: payload.author_name,
      author_role: payload.author_role || 'Prayer Warrior',
      note: payload.note,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('prayer_notes')
        .insert([{
          church_id: churchId,
          prayer_request_id: payload.prayer_request_id,
          author_id: payload.author_id || null,
          author_name: payload.author_name,
          author_role: payload.author_role || 'Prayer Warrior',
          note: payload.note,
        }])
        .select('*')
        .single();

      if (!error && data) {
        return data as PrayerNote;
      }
    }

    const local = getLocalPrayers(churchId);
    const idx = local.findIndex((p) => p.id === payload.prayer_request_id);
    if (idx >= 0) {
      const notes = local[idx].prayer_notes || [];
      local[idx].prayer_notes = [...notes, newNote];
      local[idx].updated_at = new Date().toISOString();
      saveLocalPrayers(churchId, local);
    }

    return newNote;
  },

  async togglePray(churchId: string, prayerId: string, userId?: string): Promise<{ prayer_count: number; hasPrayed: boolean }> {
    const local = getLocalPrayers(churchId);
    const idx = local.findIndex((p) => p.id === prayerId);
    if (idx >= 0) {
      const current = local[idx];
      const prayedUserIds = current.prayed_user_ids || [];
      const userKey = userId || 'demo-active-user';
      const hasPrayed = prayedUserIds.includes(userKey);

      let newCount = current.prayer_count || 0;
      let newUsers = [...prayedUserIds];

      if (hasPrayed) {
        newCount = Math.max(1, newCount - 1);
        newUsers = newUsers.filter((id) => id !== userKey);
      } else {
        newCount += 1;
        newUsers.push(userKey);
      }

      local[idx].prayer_count = newCount;
      local[idx].prayed_user_ids = newUsers;
      saveLocalPrayers(churchId, local);

      if (isSupabaseConfigured()) {
        await supabase
          .from('prayer_requests')
          .update({ prayer_count: newCount, prayed_user_ids: newUsers })
          .eq('id', prayerId);
      }

      return { prayer_count: newCount, hasPrayed: !hasPrayed };
    }
    throw new Error('Prayer request not found');
  },

  async deletePrayerRequest(churchId: string, prayerId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('prayer_requests').delete().eq('id', prayerId);
    }
    const local = getLocalPrayers(churchId);
    const updated = local.filter((p) => p.id !== prayerId);
    saveLocalPrayers(churchId, updated);
  },
};
