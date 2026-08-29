import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Group,
  GroupMember,
  OrgStatus,
  ChurchMember,
  GroupAttendanceRecord,
  GroupAnnouncement,
  PrayerRequest,
  MinistryEvent,
} from '@/types/database';
import { DEMO_GROUPS, DEMO_MEMBERS, DEMO_USERS, DEMO_MINISTRIES, DEMO_PRAYER_REQUESTS } from '@/lib/mockData';

const LOCAL_STORAGE_GROUPS_KEY = 'church_cms_groups_data';
const LOCAL_STORAGE_GROUP_MEMBERS_KEY = 'church_cms_group_members_data';
const LOCAL_STORAGE_GROUP_ATTENDANCE_KEY = 'church_cms_group_attendance_data';
const LOCAL_STORAGE_GROUP_ANNOUNCEMENTS_KEY = 'church_cms_group_announcements_data';
const LOCAL_STORAGE_GROUP_PRAYERS_KEY = 'church_cms_group_prayers_data';
const LOCAL_STORAGE_GROUP_EVENTS_KEY = 'church_cms_group_events_data';

export interface CreateGroupPayload {
  name: string;
  ministry_id?: string;
  description?: string;
  leader_id?: string;
  co_leader_id?: string;
  category?: string;
  meeting_day?: string;
  meeting_time?: string;
  frequency?: string;
  location?: string;
  address?: string;
  capacity?: number;
  status?: OrgStatus;
}

export interface CreateGroupAnnouncementPayload {
  group_id: string;
  author_id: string;
  author_name?: string;
  title: string;
  content: string;
  is_pinned?: boolean;
}

export interface CreateGroupPrayerPayload {
  group_id: string;
  author_name: string;
  title: string;
  request: string;
}

export interface CreateGroupEventPayload {
  group_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  location: string;
}

const INITIAL_DEMO_GROUP_ATTENDANCE: GroupAttendanceRecord[] = [
  {
    id: 'ga-01',
    church_id: 'a0000000-0000-0000-0000-000000000001',
    group_id: 'g0000000-0000-0000-0000-000000000001',
    session_date: '2026-08-18',
    topic: 'Romans 8: Life in the Spirit & No Condemnation',
    notes: 'Great fellowship and active discussion. 3 first-time visitors attended.',
    attendee_ids: ['cm-001', 'cm-005', 'cm-006', 'cm-007'],
    total_present: 4,
    created_at: '2026-08-18T20:30:00Z',
  },
  {
    id: 'ga-02',
    church_id: 'a0000000-0000-0000-0000-000000000001',
    group_id: 'g0000000-0000-0000-0000-000000000001',
    session_date: '2026-08-11',
    topic: 'Romans 7: The Inner Conflict & God\'s Grace',
    notes: 'Small group study and potluck dinner tacos.',
    attendee_ids: ['cm-001', 'cm-005', 'cm-006'],
    total_present: 3,
    created_at: '2026-08-11T20:30:00Z',
  },
];

const INITIAL_DEMO_GROUP_ANNOUNCEMENTS: GroupAnnouncement[] = [
  {
    id: 'gan-01',
    church_id: 'a0000000-0000-0000-0000-000000000001',
    group_id: 'g0000000-0000-0000-0000-000000000001',
    author_id: 'u0000000-0000-0000-0000-000000000005',
    author_name: 'Elena Reyes',
    title: 'Next Week Potluck Dinner & Romans 9 Study',
    content: 'Hi everyone! Next Tuesday we will do a homemade Mexican potluck before diving into Romans chapter 9. Please comment below what side or dessert you are bringing!',
    is_pinned: true,
    created_at: '2026-08-19T14:00:00Z',
  },
  {
    id: 'gan-02',
    church_id: 'a0000000-0000-0000-0000-000000000001',
    group_id: 'g0000000-0000-0000-0000-000000000001',
    author_id: 'u0000000-0000-0000-0000-000000000007',
    author_name: 'Sarah Jenkins',
    title: 'Weekend Outreach Volunteering at Central Food Bank',
    content: 'Our group will be serving together at the Austin Food Bank this Saturday 9:00 AM - 12:00 PM. Meet in the church parking lot to carpool!',
    is_pinned: false,
    created_at: '2026-08-16T11:30:00Z',
  },
];

const INITIAL_DEMO_GROUP_MEMBERS: GroupMember[] = [];


function getLocalGroups(churchId: string): Group[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUPS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local groups:', e);
  }
  return [];
}

function saveLocalGroups(churchId: string, list: Group[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUPS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local groups:', e);
  }
}

function getLocalGroupMembers(churchId: string): GroupMember[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUP_MEMBERS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local group members:', e);
  }
  return [];
}

function saveLocalGroupMembers(churchId: string, list: GroupMember[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUP_MEMBERS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local group members:', e);
  }
}

function getLocalGroupAttendance(churchId: string): GroupAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUP_ATTENDANCE_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local group attendance:', e);
  }
  return [];
}

function saveLocalGroupAttendance(churchId: string, list: GroupAttendanceRecord[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUP_ATTENDANCE_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local group attendance:', e);
  }
}

function getLocalGroupAnnouncements(churchId: string): GroupAnnouncement[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUP_ANNOUNCEMENTS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local group announcements:', e);
  }
  return [];
}

function saveLocalGroupAnnouncements(churchId: string, list: GroupAnnouncement[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUP_ANNOUNCEMENTS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local group announcements:', e);
  }
}

function getLocalGroupPrayers(churchId: string): PrayerRequest[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUP_PRAYERS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local group prayers:', e);
  }
  return [];
}

function saveLocalGroupPrayers(churchId: string, list: PrayerRequest[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUP_PRAYERS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local group prayers:', e);
  }
}

function getLocalGroupEvents(churchId: string): MinistryEvent[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_GROUP_EVENTS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local group events:', e);
  }
  return [];
}

function saveLocalGroupEvents(churchId: string, list: MinistryEvent[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_GROUP_EVENTS_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local group events:', e);
  }
}

export const groupService = {
  async getGroups(churchId: string, userLeaderFilter?: string): Promise<Group[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('groups')
        .select(`
          *,
          leader:profiles!groups_leader_id_fkey(*),
          assistant_leader:profiles!groups_co_leader_id_fkey(*),
          ministry:ministries(*)
        `)
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (userLeaderFilter) {
        query = query.or(`leader_id.eq.${userLeaderFilter},co_leader_id.eq.${userLeaderFilter}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Group[];
      }
    }

    let local = getLocalGroups(churchId);
    if (userLeaderFilter) {
      local = local.filter((g) => g.leader_id === userLeaderFilter || g.co_leader_id === userLeaderFilter);
    }

    const members = getLocalGroupMembers(churchId);

    return local.map((g) => {
      const gMembers = members.filter((gm) => gm.group_id === g.id);
      return {
        ...g,
        leader: DEMO_USERS.find((u) => u.id === g.leader_id)
          ? {
              id: g.leader_id!,
              email: DEMO_USERS.find((u) => u.id === g.leader_id)!.email,
              first_name: DEMO_USERS.find((u) => u.id === g.leader_id)!.name.split(' ')[0],
              last_name: DEMO_USERS.find((u) => u.id === g.leader_id)!.name.split(' ').slice(1).join(' '),
              display_name: DEMO_USERS.find((u) => u.id === g.leader_id)!.name,
              phone: DEMO_USERS.find((u) => u.id === g.leader_id)!.phone,
              avatar_url: DEMO_USERS.find((u) => u.id === g.leader_id)!.avatar,
              is_super_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null,
        assistant_leader: DEMO_USERS.find((u) => u.id === g.co_leader_id)
          ? {
              id: g.co_leader_id!,
              email: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.email,
              first_name: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.name.split(' ')[0],
              last_name: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.name.split(' ').slice(1).join(' '),
              display_name: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.name,
              phone: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.phone,
              avatar_url: DEMO_USERS.find((u) => u.id === g.co_leader_id)!.avatar,
              is_super_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null,
        ministry: DEMO_MINISTRIES.find((m) => m.id === g.ministry_id) || null,
        member_count: gMembers.length,
      };
    });
  },

  async getGroupById(churchId: string, groupId: string): Promise<{
    group: Group | null;
    members: GroupMember[];
    attendance: GroupAttendanceRecord[];
    announcements: GroupAnnouncement[];
    prayers: PrayerRequest[];
    events: MinistryEvent[];
  }> {
    const groups = await this.getGroups(churchId);
    const group = groups.find((g) => g.id === groupId) || null;

    let members: GroupMember[] = [];
    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*), church_member:church_members(*)')
        .eq('group_id', groupId);
      if (data && data.length > 0) members = data;
    }

    if (members.length === 0) {
      const localMembers = getLocalGroupMembers(churchId).filter((gm) => gm.group_id === groupId);
      members = localMembers.map((gm) => {
        const mem = DEMO_MEMBERS.find((m) => m.id === gm.member_id || m.user_id === gm.user_id);
        return {
          ...gm,
          profile: mem?.profile,
          church_member: mem,
        };
      });
    }

    const attendance = await this.getGroupAttendance(churchId, groupId);
    const announcements = await this.getGroupAnnouncements(churchId, groupId);
    const prayers = await this.getGroupPrayers(churchId, groupId);
    const events = await this.getGroupEvents(churchId, groupId);

    return { group, members, attendance, announcements, prayers, events };
  },

  async createGroup(churchId: string, payload: CreateGroupPayload): Promise<Group> {
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      church_id: churchId,
      name: payload.name,
      ministry_id: payload.ministry_id || null,
      description: payload.description || null,
      leader_id: payload.leader_id || null,
      co_leader_id: payload.co_leader_id || null,
      category: payload.category || 'General',
      status: payload.status || 'active',
      meeting_day: payload.meeting_day || 'Tuesday',
      meeting_time: payload.meeting_time || '07:00 PM',
      frequency: payload.frequency || 'Weekly',
      location: payload.location || "Host Home",
      address: payload.address || null,
      capacity: payload.capacity || 20,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 0,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('groups')
        .insert([newGroup])
        .select('*')
        .single();
      if (!error && data) return data as Group;
    }

    const local = getLocalGroups(churchId);
    const updated = [newGroup, ...local];
    saveLocalGroups(churchId, updated);
    return newGroup;
  },

  async updateGroup(
    churchId: string,
    groupId: string,
    payload: Partial<CreateGroupPayload>
  ): Promise<Group> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('groups')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .select('*')
        .single();
      if (!error && data) return data as Group;
    }

    const local = getLocalGroups(churchId);
    const idx = local.findIndex((g) => g.id === groupId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalGroups(churchId, local);
      return local[idx];
    }
    throw new Error('Group not found');
  },

  async deleteGroup(churchId: string, groupId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('groups').delete().eq('id', groupId);
    }
    const local = getLocalGroups(churchId);
    saveLocalGroups(churchId, local.filter((g) => g.id !== groupId));
  },

  async addGroupMember(
    churchId: string,
    groupId: string,
    member: ChurchMember,
    role: string = 'Member',
    notes?: string
  ): Promise<GroupMember> {
    const newGM: GroupMember = {
      id: `gm-${Date.now()}`,
      church_id: churchId,
      group_id: groupId,
      user_id: member.user_id,
      member_id: member.id,
      role: role || 'Member',
      status: 'active',
      joined_date: new Date().toISOString().split('T')[0],
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: member.profile,
      church_member: member,
    };

    if (isSupabaseConfigured()) {
      await supabase.from('group_members').insert([{
        church_id: churchId,
        group_id: groupId,
        user_id: member.user_id,
        member_id: member.id,
        role: newGM.role,
        status: newGM.status,
        joined_date: newGM.joined_date,
        notes: newGM.notes,
      }]);
    }

    const local = getLocalGroupMembers(churchId);
    const updated = [newGM, ...local];
    saveLocalGroupMembers(churchId, updated);
    return newGM;
  },

  async updateGroupMemberRole(
    churchId: string,
    groupMemberId: string,
    role: string
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase
        .from('group_members')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', groupMemberId);
    }
    const local = getLocalGroupMembers(churchId);
    const idx = local.findIndex((gm) => gm.id === groupMemberId);
    if (idx >= 0) {
      local[idx].role = role;
      saveLocalGroupMembers(churchId, local);
    }
  },

  async removeGroupMember(churchId: string, groupMemberId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('group_members').delete().eq('id', groupMemberId);
    }
    const local = getLocalGroupMembers(churchId);
    saveLocalGroupMembers(churchId, local.filter((gm) => gm.id !== groupMemberId));
  },

  // Attendance
  async getGroupAttendance(churchId: string, groupId: string): Promise<GroupAttendanceRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('group_attendance')
        .select('*')
        .eq('church_id', churchId)
        .eq('group_id', groupId)
        .order('session_date', { ascending: false });
      if (!error && data && data.length > 0) return data as GroupAttendanceRecord[];
    }
    const local = getLocalGroupAttendance(churchId);
    return local.filter((a) => a.group_id === groupId);
  },

  async logGroupAttendance(
    churchId: string,
    groupId: string,
    sessionDate: string,
    attendeeIds: string[],
    topic?: string,
    notes?: string
  ): Promise<GroupAttendanceRecord> {
    const record: GroupAttendanceRecord = {
      id: `ga-${Date.now()}`,
      church_id: churchId,
      group_id: groupId,
      session_date: sessionDate,
      topic: topic || null,
      notes: notes || null,
      attendee_ids: attendeeIds,
      total_present: attendeeIds.length,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('group_attendance').insert([record]);
    }

    const local = getLocalGroupAttendance(churchId);
    const updated = [record, ...local];
    saveLocalGroupAttendance(churchId, updated);
    return record;
  },

  // Announcements
  async getGroupAnnouncements(churchId: string, groupId: string): Promise<GroupAnnouncement[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('group_announcements')
        .select('*')
        .eq('church_id', churchId)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as GroupAnnouncement[];
    }
    const local = getLocalGroupAnnouncements(churchId);
    return local.filter((a) => a.group_id === groupId);
  },

  async createGroupAnnouncement(
    churchId: string,
    payload: CreateGroupAnnouncementPayload
  ): Promise<GroupAnnouncement> {
    const newAnn: GroupAnnouncement = {
      id: `gan-${Date.now()}`,
      church_id: churchId,
      group_id: payload.group_id,
      author_id: payload.author_id,
      author_name: payload.author_name || 'Group Leader',
      title: payload.title,
      content: payload.content,
      is_pinned: payload.is_pinned ?? false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('group_announcements').insert([newAnn]);
    }

    const local = getLocalGroupAnnouncements(churchId);
    const updated = [newAnn, ...local];
    saveLocalGroupAnnouncements(churchId, updated);
    return newAnn;
  },

  async deleteGroupAnnouncement(churchId: string, announcementId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('group_announcements').delete().eq('id', announcementId);
    }
    const local = getLocalGroupAnnouncements(churchId);
    saveLocalGroupAnnouncements(churchId, local.filter((a) => a.id !== announcementId));
  },

  // Prayer Requests
  async getGroupPrayers(churchId: string, groupId: string): Promise<PrayerRequest[]> {
    const local = getLocalGroupPrayers(churchId);
    return local.filter((p) => p.category === 'family' || p.category === 'general' || p.category === 'healing');
  },

  async createGroupPrayer(
    churchId: string,
    payload: CreateGroupPrayerPayload
  ): Promise<PrayerRequest> {
    const newPrayer: PrayerRequest = {
      id: `pr-${Date.now()}`,
      church_id: churchId,
      member_id: null,
      author_name: payload.author_name,
      title: payload.title,
      request: payload.request,
      description: payload.request,
      category: 'general',
      privacy: 'church_wide',
      status: 'new',
      assigned_team_id: null,
      assigned_to: null,
      notes: null,
      is_confidential: false,
      is_answered: false,
      praise_report: null,
      prayer_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const local = getLocalGroupPrayers(churchId);
    const updated = [newPrayer, ...local];
    saveLocalGroupPrayers(churchId, updated);
    return newPrayer;
  },

  async toggleGroupPrayerAnswered(
    churchId: string,
    prayerId: string,
    praiseReport?: string
  ): Promise<void> {
    const local = getLocalGroupPrayers(churchId);
    const idx = local.findIndex((p) => p.id === prayerId);
    if (idx >= 0) {
      local[idx].is_answered = !local[idx].is_answered;
      if (praiseReport) local[idx].praise_report = praiseReport;
      local[idx].updated_at = new Date().toISOString();
      saveLocalGroupPrayers(churchId, local);
    }
  },

  // Events & Meetings
  async getGroupEvents(churchId: string, groupId: string): Promise<MinistryEvent[]> {
    const local = getLocalGroupEvents(churchId);
    return local.filter((e) => e.ministry_id === groupId || e.ministry_id === 'g0000000-0000-0000-0000-000000000001');
  },

  async createGroupEvent(
    churchId: string,
    payload: CreateGroupEventPayload
  ): Promise<MinistryEvent> {
    const newEvent: MinistryEvent = {
      id: `ge-${Date.now()}`,
      church_id: churchId,
      ministry_id: payload.group_id,
      title: payload.title,
      description: payload.description || null,
      event_date: payload.event_date,
      start_time: payload.start_time,
      end_time: payload.end_time || null,
      location: payload.location,
      type: 'meeting',
      attendee_count: 0,
      created_at: new Date().toISOString(),
    };

    const local = getLocalGroupEvents(churchId);
    const updated = [newEvent, ...local];
    saveLocalGroupEvents(churchId, updated);
    return newEvent;
  },

  async deleteGroupEvent(churchId: string, eventId: string): Promise<void> {
    const local = getLocalGroupEvents(churchId);
    saveLocalGroupEvents(churchId, local.filter((e) => e.id !== eventId));
  },
};

