import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  FollowUp,
  FollowUpHistory,
  FollowUpType,
  FollowUpStatus,
  FollowUpPriority,
  ContactMethod,
  UserRole,
} from '@/types/database';
import { DEMO_FOLLOW_UPS, DEMO_USERS, DEMO_MEMBERS, DEMO_VISITORS } from '@/lib/mockData';

const LOCAL_STORAGE_FOLLOWUPS_KEY = 'church_cms_followups_data';

export interface CreateFollowUpPayload {
  title: string;
  type: FollowUpType;
  priority: FollowUpPriority;
  due_date?: string | null;
  status?: FollowUpStatus;
  notes?: string | null;
  assigned_to?: string | null;
  visitor_id?: string | null;
  member_id?: string | null;
  prayer_request_id?: string | null;
  person_name?: string | null;
  person_phone?: string | null;
  person_email?: string | null;
  created_by?: string | null;
}

export interface UpdateFollowUpPayload {
  title?: string;
  type?: FollowUpType;
  priority?: FollowUpPriority;
  status?: FollowUpStatus;
  due_date?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  outcome?: string | null;
  completed_at?: string | null;
  person_name?: string | null;
  person_phone?: string | null;
  person_email?: string | null;
}

export interface AddFollowUpHistoryPayload {
  follow_up_id: string;
  contact_date?: string;
  person_contacted: string;
  contact_method: ContactMethod | string;
  notes: string;
  user_id?: string | null;
  user_name: string;
  user_role?: string | null;
  next_action?: string | null;
}

export const FOLLOW_UP_TYPES: {
  value: FollowUpType;
  label: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'purple' | 'emerald' | 'amber' | 'destructive' | 'outline';
}[] = [
  { value: 'new_visitor', label: 'New Visitor', description: 'First-time guest follow-up & connection card welcome', badgeVariant: 'purple' },
  { value: 'new_member', label: 'New Member', description: 'New covenant member onboarding & ministry orientation', badgeVariant: 'emerald' },
  { value: 'baptism', label: 'Baptism', description: 'Water baptism class, interview, & testimony preparation', badgeVariant: 'default' },
  { value: 'counseling', label: 'Pastoral Counseling', description: 'Pre-marital, grief, crisis, or spiritual counseling', badgeVariant: 'amber' },
  { value: 'hospital_visit', label: 'Hospital Visit', description: 'In-patient hospital visit, surgery recovery, prayer shawl', badgeVariant: 'destructive' },
  { value: 'home_visit', label: 'Home Visit', description: 'Homebound senior visitation & monthly communion delivery', badgeVariant: 'secondary' },
  { value: 'prayer_request', label: 'Prayer Request Care', description: 'Pastoral check-in regarding specific prayer burden', badgeVariant: 'default' },
  { value: 'missing_member', label: 'Missing Member', description: 'Care check-in for members absent 3+ weeks', badgeVariant: 'amber' },
  { value: 'new_family', label: 'New Family', description: 'Family household onboarding & kids check-in setup', badgeVariant: 'emerald' },
  { value: 'other', label: 'Other Care Need', description: 'General pastoral care or community outreach follow-up', badgeVariant: 'outline' },
];

export const FOLLOW_UP_PRIORITIES: {
  value: FollowUpPriority;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'emerald' | 'amber' | 'destructive';
}[] = [
  { value: 'low', label: 'Low', badgeVariant: 'secondary' },
  { value: 'medium', label: 'Medium', badgeVariant: 'default' },
  { value: 'high', label: 'High', badgeVariant: 'amber' },
  { value: 'urgent', label: 'Urgent', badgeVariant: 'destructive' },
];

export const FOLLOW_UP_STATUSES: {
  value: FollowUpStatus;
  label: string;
  badgeVariant: 'default' | 'secondary' | 'purple' | 'emerald' | 'amber' | 'destructive' | 'outline';
}[] = [
  { value: 'pending', label: 'Pending', badgeVariant: 'amber' },
  { value: 'in_progress', label: 'In Progress', badgeVariant: 'purple' },
  { value: 'completed', label: 'Completed', badgeVariant: 'emerald' },
  { value: 'cancelled', label: 'Cancelled', badgeVariant: 'secondary' },
];

export const CONTACT_METHODS: {
  value: ContactMethod;
  label: string;
  iconName: string;
}[] = [
  { value: 'phone_call', label: 'Phone Call', iconName: 'Phone' },
  { value: 'in_person', label: 'In-Person Conversation', iconName: 'User' },
  { value: 'home_visit', label: 'Home Visit', iconName: 'Home' },
  { value: 'hospital_visit', label: 'Hospital Visit', iconName: 'HeartPulse' },
  { value: 'email', label: 'Email', iconName: 'Mail' },
  { value: 'text_sms', label: 'Text / SMS Message', iconName: 'MessageSquare' },
  { value: 'video_call', label: 'Video Call (Zoom/FaceTime)', iconName: 'Video' },
  { value: 'meeting', label: 'Scheduled Office Meeting', iconName: 'Calendar' },
  { value: 'other', label: 'Other Contact Method', iconName: 'MoreHorizontal' },
];

function getLocalFollowUps(churchId: string): FollowUp[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_FOLLOWUPS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local follow-ups:', e);
  }
  return [];
}

function saveLocalFollowUps(churchId: string, followUps: FollowUp[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_FOLLOWUPS_KEY}_${churchId}`, JSON.stringify(followUps));
  } catch (e) {
    console.error('Failed to save local follow-ups:', e);
  }
}

function hydrateFollowUp(f: FollowUp): FollowUp {
  return f;
}

export const followUpService = {
  async getFollowUps(
    churchId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null
  ): Promise<FollowUp[]> {
    let list: FollowUp[] = [];

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          assigned_profile:profiles!follow_ups_assigned_to_fkey(*),
          visitor:visitors!follow_ups_visitor_id_fkey(*),
          member:church_members!follow_ups_member_id_fkey(*),
          history:follow_up_history(*)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        list = data as FollowUp[];
      }
    } else {
      list = getLocalFollowUps(churchId);
    }

    // Role filtering:
    // Pastors & Admins see all follow-ups across the church.
    // Leaders see their assigned follow-ups or their group/ministry follow-ups.
    // Staff/Volunteers see their assigned follow-ups.
    if (!currentUserRole) return list;

    const isPastorOrAdmin = ['super_admin', 'pastor', 'church_admin'].includes(currentUserRole);
    if (isPastorOrAdmin) return list;

    return list.filter((f) => {
      if (currentUserId && f.assigned_to === currentUserId) return true;
      if (['ministry_leader', 'group_leader'].includes(currentUserRole)) {
        return true;
      }
      return false;
    });
  },

  async getFollowUpById(
    churchId: string,
    followUpId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null
  ): Promise<FollowUp | null> {
    const list = await this.getFollowUps(churchId, currentUserRole, currentUserId);
    return list.find((f) => f.id === followUpId) || null;
  },

  async createFollowUp(churchId: string, payload: CreateFollowUpPayload): Promise<FollowUp> {
    const followUpId = `fu-${Date.now()}`;
    const newFollowUp: FollowUp = {
      id: followUpId,
      church_id: churchId,
      visitor_id: payload.visitor_id || null,
      member_id: payload.member_id || null,
      prayer_request_id: payload.prayer_request_id || null,
      person_name: payload.person_name || null,
      person_phone: payload.person_phone || null,
      person_email: payload.person_email || null,
      assigned_to: payload.assigned_to || null,
      type: payload.type || 'other',
      title: payload.title,
      notes: payload.notes || null,
      due_date: payload.due_date || new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
      completed_at: null,
      priority: payload.priority || 'medium',
      status: payload.status || 'pending',
      outcome: null,
      created_by: payload.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      history: [],
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('follow_ups')
        .insert([{
          church_id: churchId,
          visitor_id: newFollowUp.visitor_id,
          member_id: newFollowUp.member_id,
          prayer_request_id: newFollowUp.prayer_request_id,
          person_name: newFollowUp.person_name,
          person_phone: newFollowUp.person_phone,
          person_email: newFollowUp.person_email,
          assigned_to: newFollowUp.assigned_to,
          type: newFollowUp.type,
          title: newFollowUp.title,
          notes: newFollowUp.notes,
          due_date: newFollowUp.due_date,
          priority: newFollowUp.priority,
          status: newFollowUp.status,
          created_by: newFollowUp.created_by,
        }])
        .select('*')
        .single();

      if (!error && data) {
        return hydrateFollowUp(data as FollowUp);
      }
    }

    const local = getLocalFollowUps(churchId);
    const updated = [newFollowUp, ...local];
    saveLocalFollowUps(churchId, updated);
    return hydrateFollowUp(newFollowUp);
  },

  async updateFollowUp(
    churchId: string,
    followUpId: string,
    payload: UpdateFollowUpPayload
  ): Promise<FollowUp> {
    const isCompleted = payload.status === 'completed' || !!payload.outcome;
    const completedAt = isCompleted ? (payload.completed_at || new Date().toISOString()) : null;

    if (isSupabaseConfigured()) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.type !== undefined) updateData.type = payload.type;
      if (payload.priority !== undefined) updateData.priority = payload.priority;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.due_date !== undefined) updateData.due_date = payload.due_date;
      if (payload.notes !== undefined) updateData.notes = payload.notes;
      if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to;
      if (payload.outcome !== undefined) updateData.outcome = payload.outcome;
      if (payload.person_name !== undefined) updateData.person_name = payload.person_name;
      if (payload.person_phone !== undefined) updateData.person_phone = payload.person_phone;
      if (payload.person_email !== undefined) updateData.person_email = payload.person_email;
      if (isCompleted) updateData.completed_at = completedAt;

      const { data, error } = await supabase
        .from('follow_ups')
        .update(updateData)
        .eq('id', followUpId)
        .select('*')
        .single();

      if (!error && data) {
        return hydrateFollowUp(data as FollowUp);
      }
    }

    const local = getLocalFollowUps(churchId);
    const idx = local.findIndex((f) => f.id === followUpId);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...payload,
        completed_at: isCompleted ? (completedAt || local[idx].completed_at) : local[idx].completed_at,
        updated_at: new Date().toISOString(),
      };
      saveLocalFollowUps(churchId, local);
      return hydrateFollowUp(local[idx]);
    }

    throw new Error('Follow-up ticket not found');
  },

  async assignFollowUp(churchId: string, followUpId: string, assignedToUserId: string | null): Promise<FollowUp> {
    return this.updateFollowUp(churchId, followUpId, {
      assigned_to: assignedToUserId,
    });
  },

  async addFollowUpHistory(
    churchId: string,
    payload: AddFollowUpHistoryPayload
  ): Promise<FollowUpHistory> {
    const historyId = `fuh-${Date.now()}`;
    const newHistory: FollowUpHistory = {
      id: historyId,
      church_id: churchId,
      follow_up_id: payload.follow_up_id,
      contact_date: payload.contact_date || new Date().toISOString(),
      person_contacted: payload.person_contacted,
      contact_method: payload.contact_method,
      notes: payload.notes,
      user_id: payload.user_id || null,
      user_name: payload.user_name,
      user_role: payload.user_role || 'Pastoral Care Team',
      next_action: payload.next_action || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('follow_up_history')
        .insert([{
          church_id: churchId,
          follow_up_id: payload.follow_up_id,
          contact_date: newHistory.contact_date,
          person_contacted: newHistory.person_contacted,
          contact_method: newHistory.contact_method,
          notes: newHistory.notes,
          user_id: newHistory.user_id,
          user_name: newHistory.user_name,
          user_role: newHistory.user_role,
          next_action: newHistory.next_action,
        }])
        .select('*')
        .single();

      if (!error && data) {
        return data as FollowUpHistory;
      }
    }

    const local = getLocalFollowUps(churchId);
    const idx = local.findIndex((f) => f.id === payload.follow_up_id);
    if (idx >= 0) {
      const history = local[idx].history || [];
      local[idx].history = [newHistory, ...history];
      if (local[idx].status === 'pending') {
        local[idx].status = 'in_progress';
      }
      local[idx].updated_at = new Date().toISOString();
      saveLocalFollowUps(churchId, local);
    }

    return newHistory;
  },

  async completeFollowUp(
    churchId: string,
    followUpId: string,
    outcome: string,
    notes?: string
  ): Promise<FollowUp> {
    return this.updateFollowUp(churchId, followUpId, {
      status: 'completed',
      outcome,
      notes: notes || undefined,
      completed_at: new Date().toISOString(),
    });
  },

  async cancelFollowUp(churchId: string, followUpId: string, reason?: string): Promise<FollowUp> {
    return this.updateFollowUp(churchId, followUpId, {
      status: 'cancelled',
      outcome: reason ? `Cancelled: ${reason}` : 'Cancelled',
    });
  },

  async deleteFollowUp(churchId: string, followUpId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('follow_ups').delete().eq('id', followUpId);
    }
    const local = getLocalFollowUps(churchId);
    const updated = local.filter((f) => f.id !== followUpId);
    saveLocalFollowUps(churchId, updated);
  },

  // Helper dashboard metrics computation
  computeDashboardMetrics(followUps: FollowUp[], currentUserId?: string | null) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

    const myPending = followUps.filter(
      (f) =>
        f.status !== 'completed' &&
        f.status !== 'cancelled' &&
        currentUserId &&
        f.assigned_to === currentUserId
    );

    const overdue = followUps.filter((f) => {
      if (f.status === 'completed' || f.status === 'cancelled') return false;
      if (!f.due_date) return false;
      return f.due_date < today;
    });

    const dueToday = followUps.filter((f) => {
      if (f.status === 'completed' || f.status === 'cancelled') return false;
      return f.due_date === today;
    });

    const highPriority = followUps.filter(
      (f) =>
        (f.status === 'pending' || f.status === 'in_progress') &&
        (f.priority === 'high' || f.priority === 'urgent')
    );

    const completedThisWeek = followUps.filter(
      (f) => f.status === 'completed' && f.completed_at && f.completed_at >= sevenDaysAgo
    );

    return {
      myPendingCount: myPending.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      highPriorityCount: highPriority.length,
      completedThisWeekCount: completedThisWeek.length,
      totalActiveCount: followUps.filter((f) => f.status === 'pending' || f.status === 'in_progress').length,
    };
  },
};
