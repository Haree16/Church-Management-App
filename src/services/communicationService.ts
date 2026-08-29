import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  CommunicationCampaign,
  CommunicationChannel,
  AnnouncementAudience,
} from '@/types/database';
import { DEMO_COMMUNICATION_CAMPAIGNS, DEMO_MEMBERS, DEMO_CHURCH } from '@/lib/mockData';

const LOCAL_STORAGE_KEY = 'church_cms_comm_campaigns';

export interface SendMessagePayload {
  title: string;
  channel: CommunicationChannel;
  audience_type: AnnouncementAudience;
  target_ministry_id?: string | null;
  target_group_id?: string | null;
  subject?: string | null;
  content: string;
  sender_name?: string | null;
  sender_email?: string | null;
  scheduled_for?: string | null;
}

export interface RecipientPreview {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
}

// ==============================================================================
// PROVIDER ADAPTER ARCHITECTURE (SECURE EXTENSION POINT)
// ==============================================================================
export interface ProviderSendResult {
  success: boolean;
  messageId: string;
  provider: string;
  recipientsAttempted: number;
  deliveredCount: number;
  failedCount: number;
  timestamp: string;
}

export interface CommunicationDriver {
  send(payload: SendMessagePayload, recipients: RecipientPreview[]): Promise<ProviderSendResult>;
}

// Default Safe Sandboxed Driver (Does not expose secret API keys on client)
class SandboxedProviderDriver implements CommunicationDriver {
  private channelName: string;
  constructor(channelName: string) {
    this.channelName = channelName;
  }

  async send(payload: SendMessagePayload, recipients: RecipientPreview[]): Promise<ProviderSendResult> {
    // Simulate real-world asynchronous messaging queue processing
    await new Promise((resolve) => setTimeout(resolve, 600));

    const total = recipients.length || 1;
    return {
      success: true,
      messageId: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      provider: `ChurchOS-${this.channelName.toUpperCase()}-Gateway`,
      recipientsAttempted: total,
      deliveredCount: total,
      failedCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

const DRIVERS: Record<CommunicationChannel, CommunicationDriver> = {
  email: new SandboxedProviderDriver('Email-SMTP/SendGrid'),
  sms: new SandboxedProviderDriver('SMS-Twilio/Telnyx'),
  whatsapp: new SandboxedProviderDriver('WhatsApp-Business-API'),
  push: new SandboxedProviderDriver('Push-FCM/APNS'),
  in_app: new SandboxedProviderDriver('In-App-Broadcast'),
};

function getLocalCampaigns(churchId: string): CommunicationCampaign[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${churchId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local communication campaigns:', e);
  }
  return [];
}

function saveLocalCampaigns(churchId: string, campaigns: CommunicationCampaign[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${churchId}`, JSON.stringify(campaigns));
  } catch (e) {
    console.error('Error writing local communication campaigns:', e);
  }
}

export const communicationService = {
  getRecipientsForAudience(
    churchId: string,
    audienceType: AnnouncementAudience,
    targetMinistryId?: string | null,
    targetGroupId?: string | null
  ): RecipientPreview[] {
    const members = DEMO_MEMBERS.filter((m) => m.church_id === churchId || !m.church_id);
    let list: RecipientPreview[] = members.map((m) => ({
      id: m.id,
      name: m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`,
      email: m.profile?.email || null,
      phone: m.profile?.phone || null,
      role: m.role,
      status: m.status,
    }));

    if (audienceType === 'volunteers') {
      list = list.filter((r) => r.role === 'volunteer');
    } else if (audienceType === 'members') {
      list = list.filter((r) => r.role === 'member' && r.status === 'active');
    } else if (audienceType === 'new_members') {
      list = list.slice(0, 3);
    }

    return list;
  },

  renderTemplateVariables(template: string, context: Record<string, string>): string {
    let rendered = template;
    for (const [key, val] of Object.entries(context)) {
      const pattern = new RegExp(`\\{${key}\\}`, 'gi');
      rendered = rendered.replace(pattern, val);
    }
    return rendered;
  },

  async getCampaigns(churchId: string): Promise<CommunicationCampaign[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('communication_campaigns')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as CommunicationCampaign[];
      }
    }
    return getLocalCampaigns(churchId);
  },

  async sendCampaign(churchId: string, payload: SendMessagePayload, authorName: string): Promise<CommunicationCampaign> {
    const recipients = this.getRecipientsForAudience(
      churchId,
      payload.audience_type,
      payload.target_ministry_id,
      payload.target_group_id
    );

    const driver = DRIVERS[payload.channel] || DRIVERS.email;
    const sendResult = await driver.send(payload, recipients);

    const isScheduled = !!payload.scheduled_for && new Date(payload.scheduled_for) > new Date();

    const campaign: CommunicationCampaign = {
      id: `camp-${Date.now()}`,
      church_id: churchId,
      title: payload.title.trim(),
      channel: payload.channel,
      audience_type: payload.audience_type,
      subject: payload.subject?.trim() || null,
      content: payload.content.trim(),
      sender_name: payload.sender_name?.trim() || authorName,
      sender_email: payload.sender_email?.trim() || DEMO_CHURCH.email,
      recipient_count: recipients.length,
      sent_count: isScheduled ? 0 : sendResult.deliveredCount,
      failed_count: isScheduled ? 0 : sendResult.failedCount,
      status: isScheduled ? 'scheduled' : 'sent',
      scheduled_for: payload.scheduled_for || null,
      sent_at: isScheduled ? null : new Date().toISOString(),
      created_by: authorName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('communication_campaigns')
        .insert([{
          church_id: churchId,
          title: campaign.title,
          channel: campaign.channel,
          audience_type: campaign.audience_type,
          subject: campaign.subject,
          content: campaign.content,
          sender_name: campaign.sender_name,
          sender_email: campaign.sender_email,
          recipient_count: campaign.recipient_count,
          sent_count: campaign.sent_count,
          failed_count: campaign.failed_count,
          status: campaign.status,
          scheduled_for: campaign.scheduled_for,
          sent_at: campaign.sent_at,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as CommunicationCampaign;
      }
    }

    const current = getLocalCampaigns(churchId);
    const updated = [campaign, ...current];
    saveLocalCampaigns(churchId, updated);
    return campaign;
  },
};
