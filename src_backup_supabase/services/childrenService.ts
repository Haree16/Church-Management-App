import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Child,
  ChildrenClass,
  ChildAttendance,
  ChildGender,
  ChildStatus,
  ChildAttendanceStatus,
  UserRole,
} from '@/types/database';
import {
  DEMO_CHILDREN,
  DEMO_CHILDREN_CLASSES,
  DEMO_CHILDREN_ATTENDANCE,
  DEMO_MEMBERS,
} from '@/lib/mockData';

const LOCAL_CHILDREN_KEY = 'church_cms_children_data';
const LOCAL_CLASSES_KEY = 'church_cms_children_classes_data';
const LOCAL_ATTENDANCE_KEY = 'church_cms_children_attendance_data';

export interface CreateChildPayload {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: ChildGender;
  parent_guardian_id?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  class_id?: string | null;
  allergies_medical_notes?: string | null;
  security_pin?: string | null;
  status?: ChildStatus;
  notes?: string | null;
}

export interface UpdateChildPayload {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: ChildGender;
  parent_guardian_id?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  class_id?: string | null;
  allergies_medical_notes?: string | null;
  security_pin?: string | null;
  status?: ChildStatus;
  notes?: string | null;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  age_range_min: number;
  age_range_max: number;
  room_number?: string;
  max_capacity?: number | null;
  lead_teacher_id?: string | null;
  color?: string;
  is_active?: boolean;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  age_range_min?: number;
  age_range_max?: number;
  room_number?: string;
  max_capacity?: number | null;
  lead_teacher_id?: string | null;
  color?: string;
  is_active?: boolean;
}

function getLocalChildren(churchId: string): Child[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_CHILDREN_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local children:', e);
  }
  return [];
}

function saveLocalChildren(churchId: string, list: Child[]) {
  try {
    localStorage.setItem(`${LOCAL_CHILDREN_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local children:', e);
  }
}

function getLocalClasses(churchId: string): ChildrenClass[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_CLASSES_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local classes:', e);
  }
  return [];
}

function saveLocalClasses(churchId: string, list: ChildrenClass[]) {
  try {
    localStorage.setItem(`${LOCAL_CLASSES_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local classes:', e);
  }
}

function getLocalAttendance(churchId: string): ChildAttendance[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_ATTENDANCE_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local child attendance:', e);
  }
  return [];
}

function saveLocalAttendance(churchId: string, list: ChildAttendance[]) {
  try {
    localStorage.setItem(`${LOCAL_ATTENDANCE_KEY}_${churchId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local child attendance:', e);
  }
}

export const childrenService = {
  // ==========================================
  // 1. CLASSES MANAGEMENT
  // ==========================================
  async getClasses(churchId: string): Promise<ChildrenClass[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('children_classes')
        .select('*')
        .eq('church_id', churchId)
        .order('age_range_min', { ascending: true });

      if (!error && data) {
        return data as ChildrenClass[];
      }
    }

    const classes = getLocalClasses(churchId);
    const children = getLocalChildren(churchId);

    // Compute live student count
    return classes.map((c) => ({
      ...c,
      students_count: children.filter((ch) => ch.class_id === c.id && ch.status === 'active').length,
    }));
  },

  async createClass(churchId: string, payload: CreateClassPayload): Promise<ChildrenClass> {
    const leadTeacher = payload.lead_teacher_id
      ? DEMO_MEMBERS.find((m) => m.id === payload.lead_teacher_id)
      : null;

    const newClass: ChildrenClass = {
      id: `cls-${Date.now()}`,
      church_id: churchId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      age_range_min: Number(payload.age_range_min),
      age_range_max: Number(payload.age_range_max),
      room_number: payload.room_number?.trim() || null,
      max_capacity: payload.max_capacity ? Number(payload.max_capacity) : null,
      lead_teacher_id: payload.lead_teacher_id || null,
      lead_teacher_name: leadTeacher ? `${leadTeacher.profile?.first_name} ${leadTeacher.profile?.last_name}` : null,
      color: payload.color || '#10b981',
      is_active: payload.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      students_count: 0,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('children_classes')
        .insert([{
          church_id: churchId,
          name: newClass.name,
          description: newClass.description,
          age_range_min: newClass.age_range_min,
          age_range_max: newClass.age_range_max,
          room_number: newClass.room_number,
          max_capacity: newClass.max_capacity,
          lead_teacher_id: newClass.lead_teacher_id,
          lead_teacher_name: newClass.lead_teacher_name,
          color: newClass.color,
          is_active: newClass.is_active,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as ChildrenClass;
      }
    }

    const current = getLocalClasses(churchId);
    const updated = [...current, newClass];
    saveLocalClasses(churchId, updated);
    return newClass;
  },

  async updateClass(churchId: string, id: string, payload: UpdateClassPayload): Promise<ChildrenClass> {
    const current = getLocalClasses(churchId);
    const existing = current.find((c) => c.id === id);
    if (!existing) throw new Error('Class not found');

    const leadTeacher = payload.lead_teacher_id
      ? DEMO_MEMBERS.find((m) => m.id === payload.lead_teacher_id)
      : null;

    const updatedClass: ChildrenClass = {
      ...existing,
      ...payload,
      lead_teacher_name: payload.lead_teacher_id ? (leadTeacher ? `${leadTeacher.profile?.first_name} ${leadTeacher.profile?.last_name}` : existing.lead_teacher_name) : existing.lead_teacher_name,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('children_classes')
        .update({
          name: updatedClass.name,
          description: updatedClass.description,
          age_range_min: updatedClass.age_range_min,
          age_range_max: updatedClass.age_range_max,
          room_number: updatedClass.room_number,
          max_capacity: updatedClass.max_capacity,
          lead_teacher_id: updatedClass.lead_teacher_id,
          lead_teacher_name: updatedClass.lead_teacher_name,
          color: updatedClass.color,
          is_active: updatedClass.is_active,
          updated_at: updatedClass.updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as ChildrenClass;
      }
    }

    const updatedList = current.map((c) => (c.id === id ? updatedClass : c));
    saveLocalClasses(churchId, updatedList);
    return updatedClass;
  },

  // ==========================================
  // 2. CHILDREN PROFILES & STRICT PRIVACY
  // ==========================================
  async getChildren(
    churchId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null,
    currentMemberId?: string | null
  ): Promise<Child[]> {
    const canManageAll = ['super_admin', 'church_admin', 'pastor', 'ministry_leader'].includes(currentUserRole || '');

    let list: Child[] = [];

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('children')
        .select('*, parent_guardian:members(*), class:children_classes(*)')
        .eq('church_id', churchId)
        .order('first_name', { ascending: true });

      if (!canManageAll && currentMemberId) {
        // Strict privacy: Parents can ONLY view their own children
        query = query.eq('parent_guardian_id', currentMemberId);
      }

      const { data, error } = await query;
      if (!error && data) {
        list = data as Child[];
      }
    } else {
      list = getLocalChildren(churchId);
    }

    // Hydrate relations
    const classes = getLocalClasses(churchId);
    list = list.map((ch) => {
      const cls = classes.find((c) => c.id === ch.class_id);
      return {
        ...ch,
        class_name: cls ? cls.name : ch.class_name,
        class: cls || null,
      };
    });

    if (canManageAll) {
      return list;
    }

    // If user is regular parent / member, restrict to only their children
    if (currentMemberId) {
      return list.filter((ch) => ch.parent_guardian_id === currentMemberId);
    }

    return [];
  },

  async getChildById(churchId: string, id: string): Promise<Child | null> {
    const list = await this.getChildren(churchId, 'super_admin');
    return list.find((ch) => ch.id === id) || null;
  },

  async createChild(churchId: string, payload: CreateChildPayload): Promise<Child> {
    const classes = getLocalClasses(churchId);
    const cls = payload.class_id ? classes.find((c) => c.id === payload.class_id) : null;
    const parent = payload.parent_guardian_id ? DEMO_MEMBERS.find((m) => m.id === payload.parent_guardian_id) : null;

    const newChild: Child = {
      id: `ch-${Date.now()}`,
      church_id: churchId,
      child_name: `${payload.first_name.trim()} ${payload.last_name.trim()}`,
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      date_of_birth: payload.date_of_birth,
      gender: payload.gender,
      parent_guardian_id: payload.parent_guardian_id || null,
      parent_name: parent ? `${parent.profile?.first_name} ${parent.profile?.last_name}` : payload.parent_name || null,
      parent_phone: parent?.profile?.phone || payload.parent_phone || null,
      parent_email: parent?.profile?.email || payload.parent_email || null,
      emergency_contact_name: payload.emergency_contact_name?.trim() || null,
      emergency_contact_phone: payload.emergency_contact_phone?.trim() || null,
      class_id: payload.class_id || null,
      class_name: cls ? cls.name : null,
      allergies_medical_notes: payload.allergies_medical_notes?.trim() || null,
      security_pin: payload.security_pin?.trim() || `PIN-${Math.floor(1000 + Math.random() * 9000)}`,
      photo_url: null,
      status: payload.status || 'active',
      notes: payload.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      class: cls || null,
      parent_guardian: parent || null,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('children')
        .insert([{
          church_id: churchId,
          child_name: newChild.child_name,
          first_name: newChild.first_name,
          last_name: newChild.last_name,
          date_of_birth: newChild.date_of_birth,
          gender: newChild.gender,
          parent_guardian_id: newChild.parent_guardian_id,
          parent_name: newChild.parent_name,
          parent_phone: newChild.parent_phone,
          parent_email: newChild.parent_email,
          emergency_contact_name: newChild.emergency_contact_name,
          emergency_contact_phone: newChild.emergency_contact_phone,
          class_id: newChild.class_id,
          class_name: newChild.class_name,
          allergies_medical_notes: newChild.allergies_medical_notes,
          security_pin: newChild.security_pin,
          status: newChild.status,
          notes: newChild.notes,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as Child;
      }
    }

    const current = getLocalChildren(churchId);
    const updated = [newChild, ...current];
    saveLocalChildren(churchId, updated);
    return newChild;
  },

  async updateChild(churchId: string, id: string, payload: UpdateChildPayload): Promise<Child> {
    const current = getLocalChildren(churchId);
    const existing = current.find((c) => c.id === id);
    if (!existing) throw new Error('Child profile not found');

    const classes = getLocalClasses(churchId);
    const cls = payload.class_id ? classes.find((c) => c.id === payload.class_id) : existing.class;

    const updatedChild: Child = {
      ...existing,
      ...payload,
      child_name: payload.first_name || payload.last_name
        ? `${(payload.first_name || existing.first_name).trim()} ${(payload.last_name || existing.last_name).trim()}`
        : existing.child_name,
      class_name: cls ? cls.name : existing.class_name,
      class: cls || null,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('children')
        .update({
          child_name: updatedChild.child_name,
          first_name: updatedChild.first_name,
          last_name: updatedChild.last_name,
          date_of_birth: updatedChild.date_of_birth,
          gender: updatedChild.gender,
          parent_guardian_id: updatedChild.parent_guardian_id,
          parent_name: updatedChild.parent_name,
          parent_phone: updatedChild.parent_phone,
          parent_email: updatedChild.parent_email,
          emergency_contact_name: updatedChild.emergency_contact_name,
          emergency_contact_phone: updatedChild.emergency_contact_phone,
          class_id: updatedChild.class_id,
          class_name: updatedChild.class_name,
          allergies_medical_notes: updatedChild.allergies_medical_notes,
          security_pin: updatedChild.security_pin,
          status: updatedChild.status,
          notes: updatedChild.notes,
          updated_at: updatedChild.updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Child;
      }
    }

    const updatedList = current.map((c) => (c.id === id ? updatedChild : c));
    saveLocalChildren(churchId, updatedList);
    return updatedChild;
  },

  async deleteChild(churchId: string, id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('children').delete().eq('id', id);
    }
    const current = getLocalChildren(churchId);
    const updated = current.filter((c) => c.id !== id);
    saveLocalChildren(churchId, updated);
  },

  // ==========================================
  // 3. ATTENDANCE & SECURITY CHECK-IN
  // ==========================================
  async getTodayAttendance(churchId: string, sessionDate?: string): Promise<ChildAttendance[]> {
    const targetDate = sessionDate || new Date().toISOString().split('T')[0];
    const list = getLocalAttendance(churchId);
    const children = getLocalChildren(churchId);
    const classes = getLocalClasses(churchId);

    return list
      .filter((a) => a.session_date === targetDate)
      .map((a) => ({
        ...a,
        child: children.find((c) => c.id === a.child_id) || null,
        class: classes.find((c) => c.id === a.class_id) || null,
      }));
  },

  async checkInChild(
    churchId: string,
    childId: string,
    classId: string,
    checkedInBy: string,
    notes?: string
  ): Promise<ChildAttendance> {
    const children = getLocalChildren(churchId);
    const child = children.find((c) => c.id === childId);
    const classes = getLocalClasses(churchId);
    const cls = classes.find((c) => c.id === classId);

    const newRecord: ChildAttendance = {
      id: `catt-${Date.now()}`,
      church_id: churchId,
      child_id: childId,
      class_id: classId,
      session_date: new Date().toISOString().split('T')[0],
      check_in_time: new Date().toISOString(),
      checked_in_by: checkedInBy,
      status: 'checked_in',
      security_code: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes || null,
      created_at: new Date().toISOString(),
      child: child || null,
      class: cls || null,
    };

    const current = getLocalAttendance(churchId);
    const updated = [newRecord, ...current];
    saveLocalAttendance(churchId, updated);

    return newRecord;
  },

  async checkOutChild(
    churchId: string,
    attendanceId: string,
    checkedOutBy: string
  ): Promise<ChildAttendance> {
    const current = getLocalAttendance(churchId);
    const existing = current.find((a) => a.id === attendanceId);
    if (!existing) throw new Error('Attendance record not found');

    const updatedRecord: ChildAttendance = {
      ...existing,
      status: 'checked_out',
      check_out_time: new Date().toISOString(),
      checked_out_by: checkedOutBy,
    };

    const updatedList = current.map((a) => (a.id === attendanceId ? updatedRecord : a));
    saveLocalAttendance(churchId, updatedList);
    return updatedRecord;
  },
};
