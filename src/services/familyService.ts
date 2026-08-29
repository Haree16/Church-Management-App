import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Family, FamilyMember, FamilyRelationship } from '@/types/database';
import { DEMO_FAMILIES, DEMO_MEMBERS } from '@/lib/mockData';

const LOCAL_STORAGE_FAMILIES_KEY = 'church_cms_families_data';

export interface CreateFamilyPayload {
  family_name: string;
  primary_contact_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  notes?: string;
}

function getLocalFamilies(churchId: string): Family[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_FAMILIES_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local families:', e);
  }
  return [];
}

function saveLocalFamilies(churchId: string, families: Family[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_FAMILIES_KEY}_${churchId}`, JSON.stringify(families));
  } catch (e) {
    console.error('Failed to save local families:', e);
  }
}

export const familyService = {
  async getFamilies(churchId: string): Promise<Family[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          primary_contact:profiles(*),
          members:family_members(
            *,
            profile:profiles(*),
            church_member:church_members(*)
          )
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Family[];
      }
    }

    const local = getLocalFamilies(churchId);
    // Enrich local members
    return local.map((f) => {
      const members = DEMO_MEMBERS.filter((m) => m.family_id === f.id).map((m) => ({
        id: `fm-${m.id}`,
        church_id: churchId,
        family_id: f.id,
        user_id: m.user_id,
        relationship: (m.user_id === f.primary_contact_id ? 'head' : 'spouse') as FamilyRelationship,
        is_emergency_contact: true,
        created_at: m.created_at,
        updated_at: m.updated_at,
        profile: m.profile,
        church_member: m,
      }));
      return {
        ...f,
        members: members.length > 0 ? members : [
          {
            id: `fm-${f.primary_contact_id || '1'}`,
            church_id: churchId,
            family_id: f.id,
            user_id: f.primary_contact_id || 'u0000000-0000-0000-0000-000000000007',
            relationship: 'head' as FamilyRelationship,
            is_emergency_contact: true,
            created_at: f.created_at,
            updated_at: f.updated_at,
            profile: DEMO_MEMBERS.find((m) => m.user_id === f.primary_contact_id)?.profile,
            church_member: DEMO_MEMBERS.find((m) => m.user_id === f.primary_contact_id),
          },
        ],
        primary_contact: DEMO_MEMBERS.find((m) => m.user_id === f.primary_contact_id)?.profile || null,
      };
    });
  },

  async getFamilyById(churchId: string, familyId: string): Promise<Family | null> {
    const families = await this.getFamilies(churchId);
    return families.find((f) => f.id === familyId) || null;
  },

  async createFamily(churchId: string, payload: CreateFamilyPayload): Promise<Family> {
    const newFamily: Family = {
      id: `f-${Date.now()}`,
      church_id: churchId,
      family_name: payload.family_name,
      primary_contact_id: payload.primary_contact_id || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      postal_code: payload.postal_code || null,
      phone: payload.phone || null,
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [],
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('families')
        .insert([newFamily])
        .select('*')
        .single();
      if (!error && data) return data as Family;
    }

    const local = getLocalFamilies(churchId);
    const updated = [newFamily, ...local];
    saveLocalFamilies(churchId, updated);
    return newFamily;
  },

  async updateFamily(churchId: string, familyId: string, payload: Partial<CreateFamilyPayload>): Promise<Family> {
    if (isSupabaseConfigured()) {
      await supabase.from('families').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', familyId);
    }
    const local = getLocalFamilies(churchId);
    const idx = local.findIndex((f) => f.id === familyId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      saveLocalFamilies(churchId, local);
      return local[idx];
    }
    throw new Error('Family not found');
  },

  async addFamilyMember(
    churchId: string,
    familyId: string,
    memberId: string,
    relationship: FamilyRelationship
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: member } = await supabase.from('church_members').select('user_id').eq('id', memberId).single();
      if (member) {
        await supabase.from('family_members').insert([{
          church_id: churchId,
          family_id: familyId,
          user_id: member.user_id,
          relationship,
        }]);
        await supabase.from('church_members').update({ family_id: familyId }).eq('id', memberId);
      }
    }
  },

  async removeFamilyMember(churchId: string, familyId: string, memberId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: member } = await supabase.from('church_members').select('user_id').eq('id', memberId).single();
      if (member) {
        await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', member.user_id);
        await supabase.from('church_members').update({ family_id: null }).eq('id', memberId);
      }
    }
  },

  async deleteFamily(churchId: string, familyId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('families').delete().eq('id', familyId);
    }
    const local = getLocalFamilies(churchId);
    const updated = local.filter((f) => f.id !== familyId);
    saveLocalFamilies(churchId, updated);
  },
};
