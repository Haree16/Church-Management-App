import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Donation,
  DonationFund,
  FinanceAuditLog,
  PaymentMethod,
  DonationStatus,
  UserRole,
  ChurchMember,
} from '@/types/database';
import { DEMO_DONATIONS, DEMO_FUNDS, DEMO_FINANCE_AUDIT_LOGS, DEMO_MEMBERS, DEMO_CHURCH } from '@/lib/mockData';

const LOCAL_FUNDS_KEY = 'church_cms_donation_funds';
const LOCAL_DONATIONS_KEY = 'church_cms_donations_data';
const LOCAL_AUDIT_LOGS_KEY = 'church_cms_finance_audit_logs';

export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: 'cash', label: 'Cash / Envelope', description: 'Physical cash or designated offering envelope' },
  { value: 'bank_transfer', label: 'Bank Transfer (ACH / Wire)', description: 'Direct bank account ACH or wire transfer' },
  { value: 'cheque', label: 'Cheque / Check', description: 'Personal or business physical cheque' },
  { value: 'card', label: 'Debit / Credit Card', description: 'Visa, MasterCard, Amex, or debit card' },
  { value: 'online', label: 'Online Giving', description: 'Website, giving portal, or app contribution' },
  { value: 'other', label: 'Other / In-Kind', description: 'Stock transfer, in-kind gift, or special asset' },
];

export interface AuditAuthorInfo {
  userId?: string | null;
  userName: string;
  userRole?: string | null;
  ipAddress?: string | null;
}

export interface CreateFundPayload {
  name: string;
  code: string;
  description?: string;
  target_amount?: number | null;
  is_default?: boolean;
  is_active?: boolean;
  is_tax_deductible?: boolean;
  color?: string;
}

export interface UpdateFundPayload {
  name?: string;
  code?: string;
  description?: string;
  target_amount?: number | null;
  is_default?: boolean;
  is_active?: boolean;
  is_tax_deductible?: boolean;
  color?: string;
}

export interface CreateDonationPayload {
  member_id?: string | null;
  fund_id?: string | null;
  donor_name: string;
  donor_email?: string | null;
  donor_phone?: string | null;
  amount: number;
  currency?: string;
  fund_name: string;
  payment_method: PaymentMethod | string;
  reference_number?: string | null;
  donation_date: string;
  status?: DonationStatus | string;
  is_tax_deductible?: boolean;
  notes?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
}

export interface UpdateDonationPayload {
  member_id?: string | null;
  fund_id?: string | null;
  donor_name?: string;
  donor_email?: string | null;
  donor_phone?: string | null;
  amount?: number;
  fund_name?: string;
  payment_method?: PaymentMethod | string;
  reference_number?: string | null;
  donation_date?: string;
  status?: DonationStatus | string;
  is_tax_deductible?: boolean;
  notes?: string | null;
}

export interface MemberGivingStatement {
  church: typeof DEMO_CHURCH;
  member: ChurchMember | { id: string; profile: { display_name: string; email: string; phone: string; address_street?: string; city?: string; state?: string; postal_code?: string } };
  startDate: string;
  endDate: string;
  generatedDate: string;
  statementNumber: string;
  donations: Donation[];
  totalAmount: number;
  taxDeductibleAmount: number;
  nonTaxDeductibleAmount: number;
  fundBreakdown: Array<{ fund_name: string; amount: number; percentage: number }>;
}

export interface GivingDashboardMetrics {
  totalThisMonth: number;
  totalThisYear: number;
  totalAllTime: number;
  donorsCount: number;
  averageDonation: number;
  givingByFund: Array<{ fund_id: string; fund_name: string; amount: number; percentage: number; color: string }>;
  givingByMethod: Array<{ method: string; count: number; amount: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; amount: number; donors: number }>;
}

function getLocalFunds(churchId: string): DonationFund[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_FUNDS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local funds:', e);
  }
  return DEMO_FUNDS;
}

function saveLocalFunds(churchId: string, funds: DonationFund[]) {
  try {
    localStorage.setItem(`${LOCAL_FUNDS_KEY}_${churchId}`, JSON.stringify(funds));
  } catch (e) {
    console.error('Error writing local funds:', e);
  }
}

function getLocalDonations(churchId: string): Donation[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_DONATIONS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local donations:', e);
  }
  return DEMO_DONATIONS;
}

function saveLocalDonations(churchId: string, donations: Donation[]) {
  try {
    localStorage.setItem(`${LOCAL_DONATIONS_KEY}_${churchId}`, JSON.stringify(donations));
  } catch (e) {
    console.error('Error writing local donations:', e);
  }
}

function getLocalAuditLogs(churchId: string): FinanceAuditLog[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_AUDIT_LOGS_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local finance audit logs:', e);
  }
  return DEMO_FINANCE_AUDIT_LOGS;
}

function saveLocalAuditLogs(churchId: string, logs: FinanceAuditLog[]) {
  try {
    localStorage.setItem(`${LOCAL_AUDIT_LOGS_KEY}_${churchId}`, JSON.stringify(logs));
  } catch (e) {
    console.error('Error writing local finance audit logs:', e);
  }
}

export const financeService = {
  // ==========================================
  // 1. FUNDS MANAGEMENT
  // ==========================================
  async getFunds(churchId: string, includeInactive = false): Promise<DonationFund[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('donation_funds')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DonationFund[];
      }
    }

    const funds = getLocalFunds(churchId);
    return includeInactive ? funds : funds.filter((f) => f.is_active);
  },

  async getFundById(churchId: string, fundId: string): Promise<DonationFund | null> {
    const funds = await this.getFunds(churchId, true);
    return funds.find((f) => f.id === fundId) || null;
  },

  async createFund(churchId: string, payload: CreateFundPayload, authorInfo: AuditAuthorInfo): Promise<DonationFund> {
    const newFund: DonationFund = {
      id: `fund-${Date.now()}`,
      church_id: churchId,
      name: payload.name,
      code: payload.code.toUpperCase().replace(/\s+/g, '_'),
      description: payload.description || null,
      target_amount: payload.target_amount ? Number(payload.target_amount) : null,
      current_balance: 0.0,
      is_default: !!payload.is_default,
      is_active: payload.is_active !== false,
      is_tax_deductible: payload.is_tax_deductible !== false,
      color: payload.color || '#0284c7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('donation_funds')
        .insert([{
          church_id: churchId,
          name: newFund.name,
          code: newFund.code,
          description: newFund.description,
          target_amount: newFund.target_amount,
          current_balance: 0.0,
          is_default: newFund.is_default,
          is_active: newFund.is_active,
          is_tax_deductible: newFund.is_tax_deductible,
          color: newFund.color,
        }])
        .select()
        .single();

      if (!error && data) {
        await this.logAuditEvent(churchId, {
          church_id: churchId,
          entity_type: 'fund',
          entity_id: data.id,
          action: 'created',
          user_id: authorInfo.userId || null,
          user_name: authorInfo.userName,
          user_role: authorInfo.userRole || null,
          previous_value: null,
          new_value: data,
          notes: `Created new designated fund "${data.name}" (${data.code})`,
          ip_address: authorInfo.ipAddress || null,
        });
        return data as DonationFund;
      }
    }

    const current = getLocalFunds(churchId);
    // If setting as default, clear others
    const updated = payload.is_default
      ? current.map((f) => ({ ...f, is_default: false })).concat(newFund)
      : [...current, newFund];

    saveLocalFunds(churchId, updated);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'fund',
      entity_id: newFund.id,
      action: 'created',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: null,
      new_value: newFund,
      notes: `Created new designated fund "${newFund.name}" (${newFund.code})`,
      ip_address: authorInfo.ipAddress || null,
    });

    return newFund;
  },

  async updateFund(churchId: string, fundId: string, payload: UpdateFundPayload, authorInfo: AuditAuthorInfo): Promise<DonationFund> {
    const current = getLocalFunds(churchId);
    const existingIndex = current.findIndex((f) => f.id === fundId);
    const existing = existingIndex !== -1 ? current[existingIndex] : null;

    if (!existing) {
      throw new Error(`Fund with ID ${fundId} not found.`);
    }

    const updatedFund: DonationFund = {
      ...existing,
      ...payload,
      code: payload.code ? payload.code.toUpperCase().replace(/\s+/g, '_') : existing.code,
      target_amount: payload.target_amount !== undefined ? (payload.target_amount ? Number(payload.target_amount) : null) : existing.target_amount,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('donation_funds')
        .update({
          name: updatedFund.name,
          code: updatedFund.code,
          description: updatedFund.description,
          target_amount: updatedFund.target_amount,
          is_default: updatedFund.is_default,
          is_active: updatedFund.is_active,
          is_tax_deductible: updatedFund.is_tax_deductible,
          color: updatedFund.color,
          updated_at: updatedFund.updated_at,
        })
        .eq('id', fundId)
        .select()
        .single();

      if (!error && data) {
        await this.logAuditEvent(churchId, {
          church_id: churchId,
          entity_type: 'fund',
          entity_id: fundId,
          action: 'updated',
          user_id: authorInfo.userId || null,
          user_name: authorInfo.userName,
          user_role: authorInfo.userRole || null,
          previous_value: existing,
          new_value: data,
          notes: `Updated fund details for "${data.name}"`,
          ip_address: authorInfo.ipAddress || null,
        });
        return data as DonationFund;
      }
    }

    let updatedList = current.map((f) => (f.id === fundId ? updatedFund : f));
    if (payload.is_default) {
      updatedList = updatedList.map((f) => (f.id === fundId ? f : { ...f, is_default: false }));
    }
    saveLocalFunds(churchId, updatedList);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'fund',
      entity_id: fundId,
      action: 'updated',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: existing,
      new_value: updatedFund,
      notes: `Updated fund details for "${updatedFund.name}"`,
      ip_address: authorInfo.ipAddress || null,
    });

    return updatedFund;
  },

  async deleteFund(churchId: string, fundId: string, authorInfo: AuditAuthorInfo): Promise<void> {
    const current = getLocalFunds(churchId);
    const existing = current.find((f) => f.id === fundId);

    if (!existing) return;

    if (isSupabaseConfigured()) {
      await supabase.from('donation_funds').delete().eq('id', fundId);
    }

    const updated = current.filter((f) => f.id !== fundId);
    saveLocalFunds(churchId, updated);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'fund',
      entity_id: fundId,
      action: 'deleted',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: existing,
      new_value: null,
      notes: `Deleted accounting fund "${existing.name}" (${existing.code})`,
      ip_address: authorInfo.ipAddress || null,
    });
  },

  // ==========================================
  // 2. DONATIONS MANAGEMENT & STRICT PRIVACY
  // ==========================================
  async getDonations(
    churchId: string,
    currentUserRole?: UserRole | null,
    currentUserId?: string | null,
    currentMemberId?: string | null
  ): Promise<Donation[]> {
    const canViewAll = ['super_admin', 'church_admin'].includes(currentUserRole || '');
    const isPastor = currentUserRole === 'pastor';

    let list: Donation[] = [];

    if (isSupabaseConfigured()) {
      let query = supabase
        .from('donations')
        .select('*, member:members(*, profile:profiles(*)), fund:donation_funds(*), recorded_profile:profiles!recorded_by(*)')
        .eq('church_id', churchId)
        .order('donation_date', { ascending: false });

      if (!canViewAll && !isPastor) {
        // Members or restricted roles can only see their own donations
        if (currentMemberId) {
          query = query.eq('member_id', currentMemberId);
        } else if (currentUserId) {
          query = query.eq('recorded_by', currentUserId);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data as Donation[];
      }
    }

    if (list.length === 0) {
      list = getLocalDonations(churchId);
    }

    // Hydrate local relations
    const funds = getLocalFunds(churchId);
    list = list.map((d) => {
      const fund = d.fund_id ? funds.find((f) => f.id === d.fund_id) : funds.find((f) => f.name.toLowerCase() === d.fund_name.toLowerCase());
      const member = d.member_id ? DEMO_MEMBERS.find((m) => m.id === d.member_id) : null;
      return {
        ...d,
        fund: fund || null,
        member: member || null,
      };
    });

    // Enforce strict authorization hierarchy
    if (canViewAll || isPastor) {
      return list;
    }

    // Regular members only see their own transactions
    return list.filter(
      (d) =>
        (currentMemberId && d.member_id === currentMemberId) ||
        (currentUserId && (d.member_id === currentUserId || d.recorded_by === currentUserId))
    );
  },

  async getDonationById(churchId: string, donationId: string): Promise<Donation | null> {
    const donations = await this.getDonations(churchId, 'super_admin');
    return donations.find((d) => d.id === donationId) || null;
  },

  async createDonation(
    churchId: string,
    payload: CreateDonationPayload,
    authorInfo: AuditAuthorInfo
  ): Promise<Donation> {
    const funds = await this.getFunds(churchId, true);
    const fund = payload.fund_id
      ? funds.find((f) => f.id === payload.fund_id)
      : funds.find((f) => f.name.toLowerCase() === payload.fund_name.toLowerCase());

    const newDonation: Donation = {
      id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      church_id: churchId,
      member_id: payload.member_id || null,
      fund_id: fund?.id || payload.fund_id || null,
      donor_name: payload.donor_name.trim(),
      donor_email: payload.donor_email?.trim() || null,
      donor_phone: payload.donor_phone?.trim() || null,
      amount: Number(payload.amount),
      currency: payload.currency || 'USD',
      fund_name: fund?.name || payload.fund_name,
      payment_method: payload.payment_method,
      reference_number: payload.reference_number?.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      donation_date: payload.donation_date || new Date().toISOString().split('T')[0],
      status: payload.status || 'completed',
      is_tax_deductible: payload.is_tax_deductible !== false,
      notes: payload.notes?.trim() || null,
      recorded_by: payload.recorded_by || authorInfo.userId || null,
      recorded_by_name: payload.recorded_by_name || authorInfo.userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fund: fund || null,
      member: payload.member_id ? DEMO_MEMBERS.find((m) => m.id === payload.member_id) : null,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('donations')
        .insert([{
          church_id: churchId,
          member_id: newDonation.member_id,
          fund_id: newDonation.fund_id,
          donor_name: newDonation.donor_name,
          donor_email: newDonation.donor_email,
          donor_phone: newDonation.donor_phone,
          amount: newDonation.amount,
          currency: newDonation.currency,
          fund_name: newDonation.fund_name,
          payment_method: newDonation.payment_method,
          reference_number: newDonation.reference_number,
          donation_date: newDonation.donation_date,
          status: newDonation.status,
          is_tax_deductible: newDonation.is_tax_deductible,
          notes: newDonation.notes,
          recorded_by: newDonation.recorded_by,
        }])
        .select('*, member:members(*), fund:donation_funds(*)')
        .single();

      if (!error && data) {
        await this.logAuditEvent(churchId, {
          church_id: churchId,
          entity_type: 'donation',
          entity_id: data.id,
          action: 'created',
          user_id: authorInfo.userId || null,
          user_name: authorInfo.userName,
          user_role: authorInfo.userRole || null,
          previous_value: null,
          new_value: data,
          notes: `Recorded donation of $${data.amount} from ${data.donor_name} to ${data.fund_name} (${data.payment_method})`,
          ip_address: authorInfo.ipAddress || null,
        });
        return data as Donation;
      }
    }

    const current = getLocalDonations(churchId);
    const updated = [newDonation, ...current];
    saveLocalDonations(churchId, updated);

    // Update fund balance
    if (newDonation.fund_id) {
      const fundIndex = funds.findIndex((f) => f.id === newDonation.fund_id);
      if (fundIndex !== -1) {
        funds[fundIndex].current_balance += newDonation.amount;
        saveLocalFunds(churchId, funds);
      }
    }

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'donation',
      entity_id: newDonation.id,
      action: 'created',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: null,
      new_value: newDonation,
      notes: `Recorded donation of $${newDonation.amount} from ${newDonation.donor_name} to ${newDonation.fund_name} (${newDonation.payment_method})`,
      ip_address: authorInfo.ipAddress || null,
    });

    return newDonation;
  },

  async createBatchDonations(
    churchId: string,
    payloads: CreateDonationPayload[],
    authorInfo: AuditAuthorInfo
  ): Promise<Donation[]> {
    const created: Donation[] = [];
    for (const p of payloads) {
      const don = await this.createDonation(churchId, p, authorInfo);
      created.push(don);
    }
    return created;
  },

  async updateDonation(
    churchId: string,
    donationId: string,
    payload: UpdateDonationPayload,
    authorInfo: AuditAuthorInfo
  ): Promise<Donation> {
    const current = getLocalDonations(churchId);
    const existingIndex = current.findIndex((d) => d.id === donationId);
    const existing = existingIndex !== -1 ? current[existingIndex] : null;

    if (!existing) {
      throw new Error(`Donation with ID ${donationId} not found.`);
    }

    const updatedDonation: Donation = {
      ...existing,
      ...payload,
      amount: payload.amount !== undefined ? Number(payload.amount) : existing.amount,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('donations')
        .update({
          member_id: updatedDonation.member_id,
          fund_id: updatedDonation.fund_id,
          donor_name: updatedDonation.donor_name,
          donor_email: updatedDonation.donor_email,
          donor_phone: updatedDonation.donor_phone,
          amount: updatedDonation.amount,
          fund_name: updatedDonation.fund_name,
          payment_method: updatedDonation.payment_method,
          reference_number: updatedDonation.reference_number,
          donation_date: updatedDonation.donation_date,
          status: updatedDonation.status,
          is_tax_deductible: updatedDonation.is_tax_deductible,
          notes: updatedDonation.notes,
          updated_at: updatedDonation.updated_at,
        })
        .eq('id', donationId)
        .select('*, member:members(*), fund:donation_funds(*)')
        .single();

      if (!error && data) {
        await this.logAuditEvent(churchId, {
          church_id: churchId,
          entity_type: 'donation',
          entity_id: donationId,
          action: 'updated',
          user_id: authorInfo.userId || null,
          user_name: authorInfo.userName,
          user_role: authorInfo.userRole || null,
          previous_value: existing,
          new_value: data,
          notes: `Updated donation transaction ${data.reference_number || donationId}`,
          ip_address: authorInfo.ipAddress || null,
        });
        return data as Donation;
      }
    }

    const updatedList = current.map((d) => (d.id === donationId ? updatedDonation : d));
    saveLocalDonations(churchId, updatedList);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'donation',
      entity_id: donationId,
      action: 'updated',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: existing,
      new_value: updatedDonation,
      notes: `Updated donation transaction ${updatedDonation.reference_number || donationId}`,
      ip_address: authorInfo.ipAddress || null,
    });

    return updatedDonation;
  },

  async archiveDonation(
    churchId: string,
    donationId: string,
    reason: string,
    authorInfo: AuditAuthorInfo
  ): Promise<Donation> {
    const current = getLocalDonations(churchId);
    const existing = current.find((d) => d.id === donationId);
    if (!existing) throw new Error('Donation not found');

    const archived: Donation = {
      ...existing,
      status: 'archived',
      archived_at: new Date().toISOString(),
      notes: existing.notes ? `${existing.notes} | Archived: ${reason}` : `Archived: ${reason}`,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase
        .from('donations')
        .update({
          status: 'archived',
          archived_at: archived.archived_at,
          notes: archived.notes,
          updated_at: archived.updated_at,
        })
        .eq('id', donationId);
    }

    const updatedList = current.map((d) => (d.id === donationId ? archived : d));
    saveLocalDonations(churchId, updatedList);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'donation',
      entity_id: donationId,
      action: 'archived',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: existing,
      new_value: archived,
      notes: `Archived donation $${existing.amount} from ${existing.donor_name} (Reason: ${reason})`,
      ip_address: authorInfo.ipAddress || null,
    });

    return archived;
  },

  async deleteDonation(
    churchId: string,
    donationId: string,
    authorInfo: AuditAuthorInfo
  ): Promise<void> {
    const current = getLocalDonations(churchId);
    const existing = current.find((d) => d.id === donationId);
    if (!existing) return;

    if (isSupabaseConfigured()) {
      await supabase.from('donations').delete().eq('id', donationId);
    }

    const updated = current.filter((d) => d.id !== donationId);
    saveLocalDonations(churchId, updated);

    await this.logAuditEvent(churchId, {
      church_id: churchId,
      entity_type: 'donation',
      entity_id: donationId,
      action: 'deleted',
      user_id: authorInfo.userId || null,
      user_name: authorInfo.userName,
      user_role: authorInfo.userRole || null,
      previous_value: existing,
      new_value: null,
      notes: `Deleted donation transaction ${existing.reference_number || donationId} of $${existing.amount}`,
      ip_address: authorInfo.ipAddress || null,
    });
  },

  // ==========================================
  // 3. FINANCE AUDIT LOGS
  // ==========================================
  async getAuditLogs(churchId: string): Promise<FinanceAuditLog[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('finance_audit_logs')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as FinanceAuditLog[];
      }
    }
    return getLocalAuditLogs(churchId);
  },

  async logAuditEvent(
    churchId: string,
    log: Omit<FinanceAuditLog, 'id' | 'created_at'>
  ): Promise<FinanceAuditLog> {
    const newLog: FinanceAuditLog = {
      ...log,
      id: `fal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      church_id: churchId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('finance_audit_logs').insert([newLog]);
    }

    const current = getLocalAuditLogs(churchId);
    const updated = [newLog, ...current];
    saveLocalAuditLogs(churchId, updated);

    return newLog;
  },

  // ==========================================
  // 4. GIVING STATEMENTS GENERATION
  // ==========================================
  async generateMemberStatement(
    churchId: string,
    memberId: string,
    startDate?: string,
    endDate?: string,
    fundId?: string
  ): Promise<MemberGivingStatement> {
    const member = DEMO_MEMBERS.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const allDonations = await this.getDonations(churchId, 'super_admin');
    const start = startDate || `${new Date().getFullYear()}-01-01`;
    const end = endDate || new Date().toISOString().split('T')[0];

    const filtered = allDonations.filter((d) => {
      if (d.member_id !== memberId && d.member_id !== member.user_id) return false;
      if (d.status === 'archived' || d.status === 'failed' || d.status === 'refunded') return false;
      if (d.donation_date < start || d.donation_date > end) return false;
      if (fundId && fundId !== 'all' && d.fund_id !== fundId && d.fund_name !== fundId) return false;
      return true;
    });

    const totalAmount = filtered.reduce((acc, d) => acc + Number(d.amount), 0);
    const taxDeductibleAmount = filtered.filter((d) => d.is_tax_deductible).reduce((acc, d) => acc + Number(d.amount), 0);
    const nonTaxDeductibleAmount = totalAmount - taxDeductibleAmount;

    // Fund breakdown
    const fundMap = new Map<string, number>();
    for (const d of filtered) {
      fundMap.set(d.fund_name, (fundMap.get(d.fund_name) || 0) + Number(d.amount));
    }

    const fundBreakdown = Array.from(fundMap.entries()).map(([fund_name, amount]) => ({
      fund_name,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }));

    return {
      church: DEMO_CHURCH,
      member,
      startDate: start,
      endDate: end,
      generatedDate: new Date().toISOString().split('T')[0],
      statementNumber: `STMT-${member.membership_number || member.id.slice(-4)}-${new Date().getFullYear()}`,
      donations: filtered,
      totalAmount,
      taxDeductibleAmount,
      nonTaxDeductibleAmount,
      fundBreakdown,
    };
  },

  // ==========================================
  // 5. GIVING DASHBOARD METRICS & ANALYTICS
  // ==========================================
  async getGivingOverview(churchId: string): Promise<GivingDashboardMetrics> {
    const [donations, funds] = await Promise.all([
      this.getDonations(churchId, 'super_admin'),
      this.getFunds(churchId, true),
    ]);
    return this.computeGivingDashboardMetrics(donations, funds);
  },

  computeGivingDashboardMetrics(donations: Donation[], funds: DonationFund[]): GivingDashboardMetrics {
    const activeDonations = donations.filter((d) => d.status === 'completed');
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearStr = `${now.getFullYear()}`;

    let totalThisMonth = 0;
    let totalThisYear = 0;
    let totalAllTime = 0;
    const uniqueDonors = new Set<string>();

    for (const d of activeDonations) {
      const amt = Number(d.amount);
      totalAllTime += amt;

      if (d.donation_date.startsWith(currentYearStr)) {
        totalThisYear += amt;
      }
      if (d.donation_date.startsWith(currentMonthStr)) {
        totalThisMonth += amt;
      }

      if (d.member_id) {
        uniqueDonors.add(d.member_id);
      } else if (d.donor_email) {
        uniqueDonors.add(d.donor_email);
      } else if (d.donor_name) {
        uniqueDonors.add(d.donor_name);
      }
    }

    const donorsCount = uniqueDonors.size || 1;
    const averageDonation = activeDonations.length > 0 ? totalAllTime / activeDonations.length : 0;

    // Giving by Fund
    const fundMap = new Map<string, { amount: number; color: string }>();
    funds.forEach((f) => fundMap.set(f.name, { amount: 0, color: f.color || '#0284c7' }));

    for (const d of activeDonations) {
      const entry = fundMap.get(d.fund_name) || { amount: 0, color: '#64748b' };
      entry.amount += Number(d.amount);
      fundMap.set(d.fund_name, entry);
    }

    const givingByFund = Array.from(fundMap.entries()).map(([fund_name, { amount, color }]) => ({
      fund_id: fund_name,
      fund_name,
      amount,
      percentage: totalAllTime > 0 ? (amount / totalAllTime) * 100 : 0,
      color,
    }));

    // Giving by Payment Method
    const methodMap = new Map<string, { count: number; amount: number }>();
    PAYMENT_METHODS.forEach((m) => methodMap.set(m.value, { count: 0, amount: 0 }));

    for (const d of activeDonations) {
      const methodKey = d.payment_method || 'cash';
      const entry = methodMap.get(methodKey) || { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += Number(d.amount);
      methodMap.set(methodKey, entry);
    }

    const givingByMethod = Array.from(methodMap.entries()).map(([method, { count, amount }]) => ({
      method,
      count,
      amount,
      percentage: totalAllTime > 0 ? (amount / totalAllTime) * 100 : 0,
    }));

    // Monthly Trend (last 6-8 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendMap = new Map<string, { amount: number; donors: Set<string> }>();

    // Prepopulate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTrendMap.set(key, { amount: 0, donors: new Set() });
    }

    for (const d of activeDonations) {
      try {
        const dateObj = new Date(d.donation_date);
        const key = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        if (monthlyTrendMap.has(key)) {
          const entry = monthlyTrendMap.get(key)!;
          entry.amount += Number(d.amount);
          if (d.donor_name) entry.donors.add(d.donor_name);
        }
      } catch (e) {
        // ignore date parse
      }
    }

    const monthlyTrend = Array.from(monthlyTrendMap.entries()).map(([month, { amount, donors }]) => ({
      month,
      amount,
      donors: donors.size,
    }));

    return {
      totalThisMonth,
      totalThisYear,
      totalAllTime,
      donorsCount,
      averageDonation,
      givingByFund,
      givingByMethod,
      monthlyTrend,
    };
  },
};
