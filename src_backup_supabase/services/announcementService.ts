import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
  AnnouncementPriority,
  UserRole,
} from '@/types/database';
import { DEMO_ANNOUNCEMENTS } from '@/lib/mockData';

const LOCAL_STORAGE_KEY = 'church_cms_announcements_data';

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  author_id?: string | null;
  author_name: string;
  author_role?: string | null;
  audience: AnnouncementAudience;
  target_ministry_id?: string | null;
  target_group_id?: string | null;
  priority?: AnnouncementPriority;
  channels?: string[];
  publish_date?: string;
  expiry_date?: string | null;
  status?: AnnouncementStatus;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  message?: string;
  author_name?: string;
  author_role?: string | null;
  audience?: AnnouncementAudience;
  target_ministry_id?: string | null;
  target_group_id?: string | null;
  priority?: AnnouncementPriority;
  channels?: string[];
  publish_date?: string;
  expiry_date?: string | null;
  status?: AnnouncementStatus;
}

function getLocalAnnouncements(churchId: string): Announcement[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local announcements:', e);
  }
  return [];
}

function saveLocalAnnouncements(churchId: string, announcements: Announcement[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${churchId}`, JSON.stringify(announcements));
  } catch (e) {
    console.error('Error writing local announcements:', e);
  }
}

export const announcementService = {
  async getAnnouncements(
    churchId: string,
    statusFilter?: AnnouncementStatus | 'all',
    audienceFilter?: AnnouncementAudience | 'all',
    currentUserRole?: UserRole | null
  ): Promise<Announcement[]> {
    let list: Announcement[] = [];

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('church_id', churchId)
        .order('publish_date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (audienceFilter && audienceFilter !== 'all') {
        query = query.eq('audience', audienceFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        list = data as Announcement[];
      }
    } else {
      list = getLocalAnnouncements(churchId);
    }

    // Auto-update expired status based on date
    const now = new Date().toISOString();
    list = list.map((a) => {
      if (a.status === 'published' && a.expiry_date && a.expiry_date < now) {
        return { ...a, status: 'expired' as AnnouncementStatus };
      }
      return a;
    });

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (audienceFilter && audienceFilter !== 'all') {
      list = list.filter((a) => a.audience === audienceFilter);
    }

    return list;
  },

  async getAnnouncementById(churchId: string, id: string): Promise<Announcement | null> {
    const list = await this.getAnnouncements(churchId, 'all');
    return list.find((a) => a.id === id) || null;
  },

  async createAnnouncement(
    churchId: string,
    payload: CreateAnnouncementPayload
  ): Promise<Announcement> {
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      church_id: churchId,
      title: payload.title.trim(),
      message: payload.message.trim(),
      content: payload.message.trim(),
      author_id: payload.author_id || null,
      author_name: payload.author_name || 'Church Staff',
      author_role: payload.author_role || 'Staff',
      audience: payload.audience || 'everyone',
      target_ministry_id: payload.target_ministry_id || null,
      target_group_id: payload.target_group_id || null,
      priority: payload.priority || 'normal',
      channels: payload.channels || ['in_app'],
      publish_date: payload.publish_date || new Date().toISOString(),
      expiry_date: payload.expiry_date || null,
      status: payload.status || 'published',
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          church_id: churchId,
          title: newAnc.title,
          message: newAnc.message,
          author_id: newAnc.author_id,
          author_name: newAnc.author_name,
          author_role: newAnc.author_role,
          audience: newAnc.audience,
          target_ministry_id: newAnc.target_ministry_id,
          target_group_id: newAnc.target_group_id,
          priority: newAnc.priority,
          channels: newAnc.channels,
          publish_date: newAnc.publish_date,
          expiry_date: newAnc.expiry_date,
          status: newAnc.status,
          views_count: 0,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as Announcement;
      }
    }

    const current = getLocalAnnouncements(churchId);
    const updated = [newAnc, ...current];
    saveLocalAnnouncements(churchId, updated);
    return newAnc;
  },

  async updateAnnouncement(
    churchId: string,
    id: string,
    payload: UpdateAnnouncementPayload
  ): Promise<Announcement> {
    const current = getLocalAnnouncements(churchId);
    const existing = current.find((a) => a.id === id);
    if (!existing) throw new Error('Announcement not found');

    const updatedAnc: Announcement = {
      ...existing,
      ...payload,
      content: payload.message !== undefined ? payload.message : existing.content,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          title: updatedAnc.title,
          message: updatedAnc.message,
          author_name: updatedAnc.author_name,
          author_role: updatedAnc.author_role,
          audience: updatedAnc.audience,
          target_ministry_id: updatedAnc.target_ministry_id,
          target_group_id: updatedAnc.target_group_id,
          priority: updatedAnc.priority,
          channels: updatedAnc.channels,
          publish_date: updatedAnc.publish_date,
          expiry_date: updatedAnc.expiry_date,
          status: updatedAnc.status,
          updated_at: updatedAnc.updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Announcement;
      }
    }

    const updatedList = current.map((a) => (a.id === id ? updatedAnc : a));
    saveLocalAnnouncements(churchId, updatedList);
    return updatedAnc;
  },

  async incrementViews(churchId: string, id: string): Promise<void> {
    const current = getLocalAnnouncements(churchId);
    const updatedList = current.map((a) => (a.id === id ? { ...a, views_count: (a.views_count || 0) + 1 } : a));
    saveLocalAnnouncements(churchId, updatedList);

    if (isSupabaseConfigured()) {
      await supabase.rpc('increment_announcement_views', { announcement_id: id });
    }
  },

  async deleteAnnouncement(churchId: string, id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('announcements').delete().eq('id', id);
    }
    const current = getLocalAnnouncements(churchId);
    const updated = current.filter((a) => a.id !== id);
    saveLocalAnnouncements(churchId, updated);
  },
};
