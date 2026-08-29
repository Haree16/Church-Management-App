import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Visitor, VisitorStatus } from '@/types/database';
import { DEMO_VISITORS, DEMO_USERS } from '@/lib/mockData';
import { memberService, CreateMemberPayload } from './memberService';
import { followUpService } from './followUpService';

const LOCAL_STORAGE_VISITORS_KEY = 'church_cms_visitors_data';
const LOCAL_STORAGE_FOLLOWUPS_KEY = 'church_cms_followups_data';

export interface CreateVisitorPayload {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  visit_date: string;
  service_attended?: string;
  invited_by?: string;
  heard_about?: string;
  family_size?: number;
  prayer_request?: string;
  notes?: string;
  status?: VisitorStatus;
  assigned_to?: string;
  create_follow_up?: boolean;
  follow_up_title?: string;
  follow_up_due_date?: string;
}

function getLocalVisitors(churchId: string): Visitor[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VISITORS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local visitors:', e);
  }
  return [];
}

function saveLocalVisitors(churchId: string, visitors: Visitor[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_VISITORS_KEY}_${churchId}`, JSON.stringify(visitors));
  } catch (e) {
    console.error('Failed to save local visitors:', e);
  }
}

export const visitorService = {
  async getVisitors(churchId: string): Promise<Visitor[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('visitors')
        .select('*, assigned_leader:profiles(*)')
        .eq('church_id', churchId)
        .order('visit_date', { ascending: false });

      if (!error && data) {
        return data as Visitor[];
      }
    }

    const local = getLocalVisitors(churchId);
    return local.map((v) => ({
      ...v,
      assigned_leader: DEMO_USERS.find((u) => u.id === v.assigned_to)
        ? {
            id: v.assigned_to!,
            email: DEMO_USERS.find((u) => u.id === v.assigned_to)!.email,
            first_name: DEMO_USERS.find((u) => u.id === v.assigned_to)!.name.split(' ')[0],
            last_name: DEMO_USERS.find((u) => u.id === v.assigned_to)!.name.split(' ').slice(1).join(' '),
            display_name: DEMO_USERS.find((u) => u.id === v.assigned_to)!.name,
            phone: DEMO_USERS.find((u) => u.id === v.assigned_to)!.phone,
            avatar_url: DEMO_USERS.find((u) => u.id === v.assigned_to)!.avatar,
            is_super_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : null,
    }));
  },

  async getVisitorById(churchId: string, visitorId: string): Promise<Visitor | null> {
    const visitors = await this.getVisitors(churchId);
    return visitors.find((v) => v.id === visitorId) || null;
  },

  async createVisitor(churchId: string, payload: CreateVisitorPayload): Promise<Visitor> {
    const visitorId = `v-${Date.now()}`;
    const newVisitor: Visitor = {
      id: visitorId,
      church_id: churchId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      postal_code: payload.postal_code || null,
      visit_date: payload.visit_date || new Date().toISOString().split('T')[0],
      service_attended: payload.service_attended || 'Sunday Contemporary Service',
      invited_by: payload.invited_by || null,
      heard_about: payload.heard_about || 'Friend / Family',
      family_size: payload.family_size || 1,
      prayer_request: payload.prayer_request || null,
      notes: payload.notes || null,
      status: payload.status || 'new',
      assigned_to: payload.assigned_to || null,
      converted_member_id: null,
      converted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('visitors')
        .insert([newVisitor])
        .select('*')
        .single();
      if (!error && data) {
        // If follow up is required, create follow up task in database
        if (payload.create_follow_up || payload.status === 'follow_up_required') {
          await supabase.from('follow_ups').insert([{
            church_id: churchId,
            visitor_id: data.id,
            assigned_to: payload.assigned_to || null,
            title: payload.follow_up_title || `Follow up with ${payload.first_name} ${payload.last_name}`,
            notes: payload.notes || payload.prayer_request || 'First-time visitor welcome check-in',
            due_date: payload.follow_up_due_date || new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
            priority: 'high',
            status: 'pending',
          }]);
        }
        return data as Visitor;
      }
    }

    // Save locally
    const local = getLocalVisitors(churchId);
    const updated = [newVisitor, ...local];
    saveLocalVisitors(churchId, updated);

    // If follow-up is required or requested, automatically create follow-up task
    if (payload.create_follow_up || payload.status === 'follow_up_required') {
      try {
        await followUpService.createFollowUp(churchId, {
          title: payload.follow_up_title || `Follow up with ${payload.first_name} ${payload.last_name}`,
          type: 'new_visitor',
          priority: 'high',
          due_date: payload.follow_up_due_date || new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
          status: 'pending',
          visitor_id: newVisitor.id,
          person_name: `${newVisitor.first_name} ${newVisitor.last_name}`,
          person_phone: newVisitor.phone,
          person_email: newVisitor.email,
          assigned_to: payload.assigned_to || null,
          notes: payload.notes || payload.prayer_request || 'First-time guest follow-up & small group connection card.',
        });
      } catch (err) {
        console.error('Failed to automatically create visitor follow-up:', err);
      }
    }

    return newVisitor;
  },

  async updateVisitor(
    churchId: string,
    visitorId: string,
    payload: Partial<CreateVisitorPayload>
  ): Promise<Visitor> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('visitors')
        .update({
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          postal_code: payload.postal_code,
          visit_date: payload.visit_date,
          service_attended: payload.service_attended,
          invited_by: payload.invited_by,
          heard_about: payload.heard_about,
          family_size: payload.family_size,
          prayer_request: payload.prayer_request,
          notes: payload.notes,
          status: payload.status,
          assigned_to: payload.assigned_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', visitorId)
        .select('*')
        .single();
      if (!error && data) return data as Visitor;
    }

    const local = getLocalVisitors(churchId);
    const idx = local.findIndex((v) => v.id === visitorId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalVisitors(churchId, local);
      return local[idx];
    }
    throw new Error('Visitor not found');
  },

  async convertVisitorToMember(
    churchId: string,
    visitorId: string,
    memberData: Partial<CreateMemberPayload>
  ) {
    const visitor = await this.getVisitorById(churchId, visitorId);
    if (!visitor) throw new Error('Visitor record not found');

    // 1. Create the new member record
    const newMember = await memberService.createMember(churchId, {
      first_name: memberData.first_name || visitor.first_name,
      last_name: memberData.last_name || visitor.last_name,
      email: memberData.email || visitor.email || `${visitor.first_name.toLowerCase()}.${visitor.last_name.toLowerCase()}@gracevalley.org`,
      phone: memberData.phone || visitor.phone || undefined,
      address: memberData.address || visitor.address || undefined,
      city: memberData.city || visitor.city || undefined,
      state: memberData.state || visitor.state || undefined,
      postal_code: memberData.postal_code || visitor.postal_code || undefined,
      gender: memberData.gender || 'other',
      marital_status: memberData.marital_status || 'single',
      occupation: memberData.occupation || undefined,
      role: memberData.role || 'member',
      status: 'active',
      joined_date: new Date().toISOString().split('T')[0],
      notes: `Converted from guest visitor (First visited on ${visitor.visit_date}). ${visitor.notes || ''}`.trim(),
    });

    // 2. Update visitor status to 'became_member' and link member_id, preserving history!
    if (isSupabaseConfigured()) {
      await supabase
        .from('visitors')
        .update({
          status: 'became_member',
          converted_member_id: newMember.id,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', visitorId);
    }

    const local = getLocalVisitors(churchId);
    const idx = local.findIndex((v) => v.id === visitorId);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        status: 'became_member',
        converted_member_id: newMember.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalVisitors(churchId, local);
    }

    return newMember;
  },

  async deleteVisitor(churchId: string, visitorId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('visitors').delete().eq('id', visitorId);
    }
    const local = getLocalVisitors(churchId);
    const updated = local.filter((v) => v.id !== visitorId);
    saveLocalVisitors(churchId, updated);
  },
};
