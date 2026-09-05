import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Visitor, VisitorStatus, VisitorVisit, ChurchMember } from '@/types/database';
import { DEMO_USERS } from '@/lib/mockData';
import { memberService, CreateMemberPayload } from './memberService';
import { followUpService } from './followUpService';

const LOCAL_STORAGE_VISITORS_KEY = 'church_cms_visitors_data';
const LOCAL_STORAGE_VISITOR_VISITS_KEY = 'church_cms_visitor_visits_data';

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
  first_visit_date?: string;
  last_visit_date?: string;
  visit_count?: number;
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

function getLocalVisitorVisits(churchId: string, visitorId?: string): VisitorVisit[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VISITOR_VISITS_KEY}_${churchId}`);
    if (raw) {
      const parsed: VisitorVisit[] = JSON.parse(raw);
      if (visitorId) return parsed.filter((v) => v.visitor_id === visitorId);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to read local visitor visits:', e);
  }
  return [];
}

function saveLocalVisitorVisit(churchId: string, visit: VisitorVisit) {
  try {
    const all = getLocalVisitorVisits(churchId);
    localStorage.setItem(`${LOCAL_STORAGE_VISITOR_VISITS_KEY}_${churchId}`, JSON.stringify([visit, ...all]));
  } catch (e) {
    console.error('Failed to save local visitor visit:', e);
  }
}

export const visitorService = {
  async getVisitors(churchId: string): Promise<Visitor[]> {
    let cloudVisitors: Visitor[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('visitors')
          .select('*, assigned_leader:profiles(*)')
          .eq('church_id', churchId)
          .order('visit_date', { ascending: false });

        if (!error && data) {
          cloudVisitors = data as Visitor[];
        }
      } catch (e) {}
    }

    const local = getLocalVisitors(churchId);
    const map = new Map<string, Visitor>();
    cloudVisitors.forEach((v) => map.set(v.id, v));
    local.forEach((v) => {
      if (!map.has(v.id)) map.set(v.id, v);
    });

    const combined = Array.from(map.values());
    return combined.map((v) => ({
      ...v,
      assigned_leader: v.assigned_leader || (DEMO_USERS.find((u) => u.id === v.assigned_to)
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
        : null),
    }));
  },

  async getVisitorById(churchId: string, visitorId: string): Promise<Visitor | null> {
    const visitors = await this.getVisitors(churchId);
    const visitor = visitors.find((v) => v.id === visitorId) || null;
    if (visitor) {
      const visits = await this.getVisitorVisits(churchId, visitorId);
      visitor.visits = visits;
    }
    return visitor;
  },

  async getVisitorVisits(churchId: string, visitorId: string): Promise<VisitorVisit[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('visitor_visits')
        .select('*')
        .eq('church_id', churchId)
        .eq('visitor_id', visitorId)
        .order('visit_date', { ascending: false });

      if (!error && data) {
        return data as VisitorVisit[];
      }
    }
    return getLocalVisitorVisits(churchId, visitorId);
  },

  async recordVisitorVisit(
    churchId: string,
    visitorId: string,
    visitPayload: {
      visit_date: string;
      service_attended?: string;
      notes?: string;
      invited_by?: string;
      source?: string;
    }
  ): Promise<VisitorVisit> {
    const newVisit: VisitorVisit = {
      id: `visit-${Date.now()}`,
      church_id: churchId,
      visitor_id: visitorId,
      visit_date: visitPayload.visit_date || new Date().toISOString().split('T')[0],
      service_attended: visitPayload.service_attended || null,
      notes: visitPayload.notes || null,
      invited_by: visitPayload.invited_by || null,
      source: visitPayload.source || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('visitor_visits')
        .insert([newVisit])
        .select('*')
        .single();
      if (!error && data) {
        const visits = await this.getVisitorVisits(churchId, visitorId);
        const count = visits.length;
        const visitor = await this.getVisitorById(churchId, visitorId);
        const newStatus = (visitor?.status === 'new' || visitor?.status === 'contact_pending' || visitor?.status === 'contacted') ? 'returned_visitor' : (visitor?.status || 'returned_visitor');
        await supabase
          .from('visitors')
          .update({
            last_visit_date: newVisit.visit_date,
            visit_count: count,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', visitorId);

        return data as VisitorVisit;
      }
    }

    saveLocalVisitorVisit(churchId, newVisit);
    const visits = getLocalVisitorVisits(churchId, visitorId);
    const local = getLocalVisitors(churchId);
    const idx = local.findIndex((v) => v.id === visitorId);
    if (idx >= 0) {
      const v = local[idx];
      const newStatus = (v.status === 'new' || v.status === 'contact_pending' || v.status === 'contacted') ? 'returned_visitor' : (v.status || 'returned_visitor');
      local[idx] = {
        ...v,
        last_visit_date: newVisit.visit_date,
        visit_count: visits.length,
        status: newStatus as VisitorStatus,
        updated_at: new Date().toISOString(),
      };
      saveLocalVisitors(churchId, local);
    }

    return newVisit;
  },

  async checkPossibleDuplicates(
    churchId: string,
    query: { phone?: string; email?: string; first_name?: string; last_name?: string }
  ): Promise<{ visitors: Visitor[]; members: ChurchMember[] }> {
    const visitors = await this.getVisitors(churchId);
    const members = await memberService.getMembers(churchId);

    const cleanPhone = query.phone ? query.phone.replace(/\D/g, '') : '';
    const cleanEmail = query.email ? query.email.trim().toLowerCase() : '';
    const cleanFirst = query.first_name ? query.first_name.trim().toLowerCase() : '';
    const cleanLast = query.last_name ? query.last_name.trim().toLowerCase() : '';

    const matchedVisitors = visitors.filter((v) => {
      if (cleanPhone && cleanPhone.length > 5 && v.phone && v.phone.replace(/\D/g, '').includes(cleanPhone)) return true;
      if (cleanEmail && v.email && v.email.toLowerCase() === cleanEmail) return true;
      if (cleanFirst && cleanLast && v.first_name.toLowerCase() === cleanFirst && v.last_name.toLowerCase() === cleanLast) return true;
      return false;
    });

    const matchedMembers = members.filter((m) => {
      const phone = m.profile?.phone || '';
      const email = m.profile?.email || '';
      const first = m.profile?.first_name || '';
      const last = m.profile?.last_name || '';

      if (cleanPhone && cleanPhone.length > 5 && phone && phone.replace(/\D/g, '').includes(cleanPhone)) return true;
      if (cleanEmail && email && email.toLowerCase() === cleanEmail) return true;
      if (cleanFirst && cleanLast && first.toLowerCase() === cleanFirst && last.toLowerCase() === cleanLast) return true;
      return false;
    });

    return { visitors: matchedVisitors, members: matchedMembers };
  },

  async createVisitor(churchId: string, payload: CreateVisitorPayload): Promise<Visitor> {
    const visitorId = `v-${Date.now()}`;
    const visitDate = payload.visit_date || new Date().toISOString().split('T')[0];
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
      visit_date: visitDate,
      first_visit_date: payload.first_visit_date || visitDate,
      last_visit_date: payload.last_visit_date || visitDate,
      visit_count: payload.visit_count || 1,
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
      try {
        const { data, error } = await supabase
          .from('visitors')
          .insert([newVisitor])
          .select('*')
          .single();
        if (!error && data) {
          // Record initial visit in visitor_visits
          await supabase.from('visitor_visits').insert([{
            id: `visit-${Date.now()}`,
            church_id: churchId,
            visitor_id: data.id,
            visit_date: visitDate,
            service_attended: payload.service_attended || 'Sunday Contemporary Service',
            invited_by: payload.invited_by || null,
            notes: payload.notes || 'First visit recorded',
            created_at: new Date().toISOString(),
          }]);

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
          const local = getLocalVisitors(churchId);
          saveLocalVisitors(churchId, [data as Visitor, ...local.filter(v => v.id !== data.id)]);
          return data as Visitor;
        }
      } catch (e) {
        console.warn('Supabase visitor insert warning, falling back to local storage:', e);
      }
    }

    // Save locally
    const local = getLocalVisitors(churchId);
    const updated = [newVisitor, ...local];
    saveLocalVisitors(churchId, updated);

    // Initial visit locally
    saveLocalVisitorVisit(churchId, {
      id: `visit-${Date.now()}`,
      church_id: churchId,
      visitor_id: newVisitor.id,
      visit_date: visitDate,
      service_attended: payload.service_attended || 'Sunday Contemporary Service',
      invited_by: payload.invited_by || null,
      notes: payload.notes || 'First visit recorded',
      created_at: new Date().toISOString(),
    });

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
          first_visit_date: payload.first_visit_date,
          last_visit_date: payload.last_visit_date,
          visit_count: payload.visit_count,
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
      notes: `Converted from guest visitor (First visited on ${visitor.visit_date || visitor.first_visit_date}). ${visitor.notes || ''}`.trim(),
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

