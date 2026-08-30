import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  ChurchMember,
  Profile,
  MemberStatus,
  Gender,
  MaritalStatus,
  UserRole,
  AttendanceRecord,
  Donation,
  PrayerRequest,
  FollowUp,
} from '@/types/database';
import {
  DEMO_MEMBERS,
  DEMO_ATTENDANCE,
  DEMO_DONATIONS,
  DEMO_PRAYER_REQUESTS,
  DEMO_FOLLOW_UPS,
  DEMO_FAMILIES,
  DEMO_MINISTRIES,
  DEMO_GROUPS,
} from '@/lib/mockData';
import { followUpService } from './followUpService';
import { prayerService } from './prayerService';

const LOCAL_STORAGE_MEMBERS_KEY = 'church_cms_members_data';

export interface CreateMemberPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  gender?: Gender;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  marital_status?: MaritalStatus;
  marriage_date?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  role?: UserRole;
  status?: MemberStatus;
  joined_date?: string;
  baptism_date?: string;
  salvation_date?: string;
  previous_church?: string;
  ministry_id?: string;
  group_id?: string;
  family_id?: string;
  notes?: string;
  create_welcome_follow_up?: boolean;
}

// In-memory/LocalStorage helper
function getLocalMembers(churchId: string): ChurchMember[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_MEMBERS_KEY}_${churchId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read local members:', e);
  }
  return DEMO_MEMBERS.filter((m) => m.church_id === churchId || !m.church_id);
}

function saveLocalMembers(churchId: string, members: ChurchMember[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_MEMBERS_KEY}_${churchId}`, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save local members:', e);
  }
}

export const memberService = {
  async getMembers(churchId: string): Promise<ChurchMember[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('church_members')
        .select(`
          *,
          profile:profiles(*),
          family:families(*),
          ministry:ministries(*),
          group:groups(*)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ChurchMember[];
      }
    }
    return getLocalMembers(churchId);
  },

  async getMemberById(churchId: string, memberId: string): Promise<{
    member: ChurchMember | null;
    attendance: AttendanceRecord[];
    donations: Donation[];
    prayerRequests: PrayerRequest[];
    followUps: FollowUp[];
  }> {
    let member: ChurchMember | null = null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('church_members')
        .select(`
          *,
          profile:profiles(*),
          family:families(*),
          ministry:ministries(*),
          group:groups(*)
        `)
        .eq('id', memberId)
        .single();

      if (!error && data) {
        member = data as ChurchMember;
      }
    }

    if (!member) {
      const local = getLocalMembers(churchId);
      member = local.find((m) => m.id === memberId || m.user_id === memberId) || null;
      if (member) {
        const currentMem = member;
        // Hydrate relations
        if (currentMem.family_id && !currentMem.family) {
          currentMem.family = DEMO_FAMILIES.find((f) => f.id === currentMem.family_id) || null;
        }
        if (currentMem.ministry_id && !currentMem.ministry) {
          currentMem.ministry = DEMO_MINISTRIES.find((min) => min.id === currentMem.ministry_id) || null;
        }
        if (currentMem.group_id && !currentMem.group) {
          currentMem.group = DEMO_GROUPS.find((g) => g.id === currentMem.group_id) || null;
        }
      }
    }

    // Related records from services
    const allPrayers = await prayerService.getPrayerRequests(churchId, 'super_admin');
    const allFollowUps = await followUpService.getFollowUps(churchId, 'super_admin');

    let attendance = DEMO_ATTENDANCE.filter((a) => a.member_id === memberId || a.member_id === 'cm-001');
    let donations = DEMO_DONATIONS.filter((d) => d.member_id === memberId || d.member_id === 'cm-001');
    let prayerRequests = allPrayers.filter((p) => p.member_id === memberId || p.member_id === member?.user_id || (memberId === 'cm-001' && p.member_id === 'cm-001'));
    let followUps = allFollowUps.filter((f) => f.member_id === memberId || f.member_id === member?.user_id || (memberId === 'cm-001' && f.member_id === 'cm-001'));

    if (isSupabaseConfigured() && member) {
      const [attRes, donRes] = await Promise.all([
        supabase.from('attendance_records').select('*').eq('member_id', memberId),
        supabase.from('donations').select('*').eq('member_id', memberId),
      ]);

      if (attRes.data && attRes.data.length > 0) attendance = attRes.data;
      if (donRes.data && donRes.data.length > 0) donations = donRes.data;
    }

    return { member, attendance, donations, prayerRequests, followUps };
  },

  async createMember(churchId: string, payload: CreateMemberPayload): Promise<ChurchMember> {
    const userId = `u-${Date.now()}`;
    const memberId = `cm-${Date.now()}`;
    const memberNumber = `GV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: Profile = {
      id: userId,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      display_name: `${payload.first_name} ${payload.last_name}`.trim(),
      phone: payload.phone || null,
      avatar_url: payload.avatar_url || null,
      gender: payload.gender || 'other',
      dob: payload.dob || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      postal_code: payload.postal_code || null,
      marital_status: payload.marital_status || 'single',
      marriage_date: payload.marriage_date || null,
      occupation: payload.occupation || null,
      emergency_contact_name: payload.emergency_contact_name || null,
      emergency_contact_phone: payload.emergency_contact_phone || null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newMember: ChurchMember = {
      id: memberId,
      church_id: churchId,
      user_id: userId,
      role: payload.role || 'member',
      status: payload.status || 'active',
      membership_number: memberNumber,
      membership_date: payload.joined_date || new Date().toISOString().split('T')[0],
      joined_date: payload.joined_date || new Date().toISOString().split('T')[0],
      baptism_date: payload.baptism_date || null,
      salvation_date: payload.salvation_date || null,
      previous_church: payload.previous_church || null,
      title: payload.role === 'pastor' ? 'Pastor' : payload.role === 'church_admin' ? 'Administrator' : 'Covenant Member',
      notes: payload.notes || null,
      ministry_id: payload.ministry_id || null,
      group_id: payload.group_id || null,
      family_id: payload.family_id || null,
      custom_fields: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: newProfile,
      ministry: DEMO_MINISTRIES.find((min) => min.id === payload.ministry_id) || null,
      group: DEMO_GROUPS.find((g) => g.id === payload.group_id) || null,
      family: DEMO_FAMILIES.find((f) => f.id === payload.family_id) || null,
    };

    if (isSupabaseConfigured()) {
      // 1. Create Profile
      await supabase.from('profiles').insert([newProfile]);
      // 2. Create Church Member
      const { data, error } = await supabase
        .from('church_members')
        .insert([{
          church_id: churchId,
          user_id: userId,
          role: newMember.role,
          status: newMember.status,
          membership_number: newMember.membership_number,
          membership_date: newMember.membership_date,
          joined_date: newMember.joined_date,
          baptism_date: newMember.baptism_date,
          salvation_date: newMember.salvation_date,
          previous_church: newMember.previous_church,
          title: newMember.title,
          notes: newMember.notes,
          ministry_id: newMember.ministry_id,
          group_id: newMember.group_id,
          family_id: newMember.family_id,
        }])
        .select('*, profile:profiles(*)')
        .single();

      if (!error && data) {
        return data as ChurchMember;
      }
    }

    // Save locally
    const current = getLocalMembers(churchId);
    const updated = [newMember, ...current];
    saveLocalMembers(churchId, updated);

    // Optionally create welcome follow-up task
    if (payload.create_welcome_follow_up) {
      try {
        await followUpService.createFollowUp(churchId, {
          title: `Welcome Orientation & Integration for ${newMember.profile?.first_name} ${newMember.profile?.last_name}`,
          type: 'new_member',
          priority: 'medium',
          due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
          status: 'pending',
          member_id: newMember.id,
          person_name: `${newMember.profile?.first_name} ${newMember.profile?.last_name}`,
          person_phone: newMember.profile?.phone || undefined,
          person_email: newMember.profile?.email || undefined,
          assigned_to: 'u0000000-0000-0000-0000-000000000003', // Pastoral/Administrative team
          notes: `New member covenant onboarding. Introduce to department leaders and schedule welcome gift delivery.`,
        });
      } catch (e) {
        console.error('Failed to create welcome follow-up:', e);
      }
    }

    return newMember;
  },

  async updateMember(
    churchId: string,
    memberId: string,
    payload: Partial<CreateMemberPayload>
  ): Promise<ChurchMember> {
    const local = getLocalMembers(churchId);
    const existingIndex = local.findIndex((m) => m.id === memberId);

    if (isSupabaseConfigured()) {
      if (payload.first_name || payload.last_name || payload.email || payload.phone || payload.dob || payload.address || payload.city || payload.state || payload.postal_code || payload.marital_status || payload.occupation || payload.emergency_contact_name || payload.emergency_contact_phone) {
        const existing = local[existingIndex];
        if (existing?.user_id) {
          await supabase.from('profiles').update({
            first_name: payload.first_name,
            last_name: payload.last_name,
            display_name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
            email: payload.email,
            phone: payload.phone,
            avatar_url: payload.avatar_url,
            gender: payload.gender,
            dob: payload.dob,
            address: payload.address,
            city: payload.city,
            state: payload.state,
            postal_code: payload.postal_code,
            marital_status: payload.marital_status,
            marriage_date: payload.marriage_date,
            occupation: payload.occupation,
            emergency_contact_name: payload.emergency_contact_name,
            emergency_contact_phone: payload.emergency_contact_phone,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.user_id);
        }
      }

      const { data, error } = await supabase
        .from('church_members')
        .update({
          role: payload.role,
          status: payload.status,
          joined_date: payload.joined_date,
          baptism_date: payload.baptism_date,
          salvation_date: payload.salvation_date,
          previous_church: payload.previous_church,
          ministry_id: payload.ministry_id,
          group_id: payload.group_id,
          family_id: payload.family_id,
          notes: payload.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select('*, profile:profiles(*)')
        .single();

      if (!error && data) {
        return data as ChurchMember;
      }
    }

    // Local update
    if (existingIndex >= 0) {
      const current = local[existingIndex];
      const updatedProfile: Profile = {
        ...current.profile!,
        first_name: payload.first_name ?? current.profile?.first_name ?? '',
        last_name: payload.last_name ?? current.profile?.last_name ?? '',
        display_name: `${payload.first_name ?? current.profile?.first_name ?? ''} ${payload.last_name ?? current.profile?.last_name ?? ''}`.trim(),
        email: payload.email ?? current.profile?.email ?? '',
        phone: payload.phone ?? current.profile?.phone ?? null,
        avatar_url: payload.avatar_url ?? current.profile?.avatar_url ?? null,
        gender: payload.gender ?? current.profile?.gender,
        dob: payload.dob ?? current.profile?.dob,
        address: payload.address ?? current.profile?.address,
        city: payload.city ?? current.profile?.city,
        state: payload.state ?? current.profile?.state,
        postal_code: payload.postal_code ?? current.profile?.postal_code,
        marital_status: payload.marital_status ?? current.profile?.marital_status,
        marriage_date: payload.marriage_date ?? current.profile?.marriage_date,
        occupation: payload.occupation ?? current.profile?.occupation,
        emergency_contact_name: payload.emergency_contact_name ?? current.profile?.emergency_contact_name,
        emergency_contact_phone: payload.emergency_contact_phone ?? current.profile?.emergency_contact_phone,
        updated_at: new Date().toISOString(),
      };

      const updatedMember: ChurchMember = {
        ...current,
        role: payload.role ?? current.role,
        status: payload.status ?? current.status,
        joined_date: payload.joined_date ?? current.joined_date,
        baptism_date: payload.baptism_date ?? current.baptism_date,
        salvation_date: payload.salvation_date ?? current.salvation_date,
        previous_church: payload.previous_church ?? current.previous_church,
        ministry_id: payload.ministry_id !== undefined ? payload.ministry_id : current.ministry_id,
        group_id: payload.group_id !== undefined ? payload.group_id : current.group_id,
        family_id: payload.family_id !== undefined ? payload.family_id : current.family_id,
        notes: payload.notes ?? current.notes,
        updated_at: new Date().toISOString(),
        profile: updatedProfile,
        ministry: DEMO_MINISTRIES.find((min) => min.id === (payload.ministry_id ?? current.ministry_id)) || null,
        group: DEMO_GROUPS.find((g) => g.id === (payload.group_id ?? current.group_id)) || null,
        family: DEMO_FAMILIES.find((f) => f.id === (payload.family_id ?? current.family_id)) || null,
      };

      local[existingIndex] = updatedMember;
      saveLocalMembers(churchId, local);
      return updatedMember;
    }

    throw new Error('Member not found');
  },

  async archiveMember(churchId: string, memberId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('church_members').update({ status: 'archived' }).eq('id', memberId);
    }
    const local = getLocalMembers(churchId);
    const updated = local.map((m) => (m.id === memberId ? { ...m, status: 'archived' as MemberStatus } : m));
    saveLocalMembers(churchId, updated);
  },

  async deleteMember(churchId: string, memberId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('church_members').delete().eq('id', memberId);
    }
    const local = getLocalMembers(churchId);
    const updated = local.filter((m) => m.id !== memberId);
    saveLocalMembers(churchId, updated);
  },
};
