import {
  Church,
  ChurchMember,
  ChurchSettings,
  Family,
  FamilyMember,
  Group,
  Ministry,
  Notification,
  Profile,
  Visitor,
  FollowUp,
  AttendanceRecord,
  Donation,
  DonationFund,
  FinanceAuditLog,
  PrayerRequest,
  Announcement,
  CommunicationCampaign,
  ChildrenClass,
  Child,
  ChildAttendance,
  YouthProfile,
  YouthEvent,
  AuditLog,
} from '@/types/database';

export const DEMO_CHURCH: Church = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Grace City Church',
  slug: 'grace-city-chennai',
  tagline: 'Loving God, Loving People, Serving Chennai',
  logo_url: 'https://images.unsplash.com/photo-1548625361-195fe578b9ec?w=200&auto=format&fit=crop&q=80',
  email: 'office@gracecitychennai.org',
  phone: '+91 44 2836 1234',
  website: 'https://gracecitychennai.org',
  address: 'No. 12, Mount Road, Anna Salai',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postal_code: '600002',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  is_active: true,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_CHURCH_2: Church = {
  id: 'a0000000-0000-0000-0000-000000000002',
  name: 'Bethel Fellowship Chennai',
  slug: 'bethel-chennai',
  tagline: 'House of God in the Heart of Chennai',
  logo_url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
  email: 'contact@bethelchennai.org',
  phone: '+91 44 2491 5678',
  website: 'https://bethelchennai.org',
  address: '45, 100 Feet Road, Velachery',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postal_code: '600042',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  is_active: true,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date().toISOString(),
};

export interface DemoUserOption {
  email: string;
  role: 'super_admin' | 'pastor' | 'church_admin' | 'ministry_leader' | 'group_leader' | 'volunteer' | 'member';
  name: string;
  title: string;
  avatar: string;
  phone: string;
  id: string;
}

export const DEMO_USERS: DemoUserOption[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'superadmin@churchcms.io',
    role: 'super_admin',
    name: 'Universal Super Administrator',
    title: 'Super Platform Admin',
    avatar: '',
    phone: '+91 98400 00001',
  },
];

export const DEMO_SETTINGS: ChurchSettings = {
  id: 'cs-001',
  church_id: DEMO_CHURCH.id,
  service_timings: [
    {
      id: 'st-01',
      name: 'Sunday Tamil Service',
      day: 'Sunday',
      time: '07:30 AM',
      type: 'In-Person & Online',
    },
    {
      id: 'st-02',
      name: 'Sunday English Service',
      day: 'Sunday',
      time: '09:30 AM',
      type: 'In-Person & Online',
    },
    {
      id: 'st-03',
      name: 'Wednesday Bible Study & Prayer',
      day: 'Wednesday',
      time: '07:00 PM',
      type: 'In-Person',
    },
  ],
  general_settings: {},
  feature_flags: {
    online_giving: true,
    attendance_tracking: true,
    prayer_requests: true,
    volunteer_scheduling: true,
    check_in_kiosk: true,
    sms_notifications: true,
  },
  branding: {
    primary_color: '#0284c7',
  },
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date().toISOString(),
};

// All mock collections are initialized clean/empty for database connection
export const DEMO_PROFILES: Profile[] = [];
export const DEMO_MEMBERS: ChurchMember[] = [];
export const DEMO_FAMILIES: Family[] = [];
export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [];
export const DEMO_MINISTRIES: Ministry[] = [];
export const DEMO_GROUPS: Group[] = [];
export const DEMO_VOLUNTEERS: any[] = [];
export const DEMO_VISITORS: Visitor[] = [];
export const DEMO_FOLLOW_UPS: FollowUp[] = [];
export const DEMO_EVENTS: any[] = [];
export const DEMO_ATTENDANCE: AttendanceRecord[] = [];
export const DEMO_DONATIONS: Donation[] = [];
export const DEMO_FUNDS: DonationFund[] = [];
export const DEMO_FINANCE_AUDIT: FinanceAuditLog[] = [];
export const DEMO_PRAYER_REQUESTS: PrayerRequest[] = [];
export const DEMO_ANNOUNCEMENTS: Announcement[] = [];
export const DEMO_CAMPAIGNS: CommunicationCampaign[] = [];
export const DEMO_NOTIFICATIONS: Notification[] = [];
export const DEMO_CHILDREN: Child[] = [];
export const DEMO_CLASSES: ChildrenClass[] = [];
export const DEMO_CHILDREN_CLASSES: ChildrenClass[] = [];
export const DEMO_YOUTH: YouthProfile[] = [];
export const DEMO_YOUTH_PROFILES: YouthProfile[] = [];
export const DEMO_YOUTH_EVENTS: YouthEvent[] = [];
export const DEMO_CHILD_ATTENDANCE: ChildAttendance[] = [];
export const DEMO_CHILDREN_ATTENDANCE: ChildAttendance[] = [];
export const DEMO_COMMUNICATION_CAMPAIGNS: CommunicationCampaign[] = [];
export const DEMO_FINANCE_AUDIT_LOGS: FinanceAuditLog[] = [];
export const DEMO_AUDIT_LOGS: AuditLog[] = [];
