import { 
  Member, PrayerRequest, RosterAssignment, AttendanceRecord, ChurchEvent, 
  AppNotification, PastorAnnouncement,
  ChurchTenant, SaaSUser, AuthSession,
  SundaySchoolClass, SundaySchoolStudent, SundaySchoolAttendanceRecord, WhatsAppReminderTemplate,
  WhatsAppGroup,
  CompleteChurchSettings,
  ChurchMinistry, MinistryMember, MinistryTeam, MinistryTeamMember,
  MinistryActivity, MinistryAnnouncement
} from '../types';
import { 
  INITIAL_MEMBERS, INITIAL_PRAYERS, INITIAL_ROSTER, INITIAL_ATTENDANCE, 
  INITIAL_EVENTS, INITIAL_NOTIFICATIONS, INITIAL_ANNOUNCEMENTS,
  INITIAL_CHURCHES, INITIAL_SAAS_USERS, INITIAL_SUNDAY_SCHOOL_CLASSES,
  INITIAL_SUNDAY_SCHOOL_STUDENTS, INITIAL_SUNDAY_SCHOOL_ATTENDANCE, INITIAL_WHATSAPP_TEMPLATES,
  INITIAL_WHATSAPP_GROUPS,
  INITIAL_CHURCH_SETTINGS,
  INITIAL_MINISTRIES, INITIAL_MINISTRY_MEMBERS, INITIAL_MINISTRY_TEAMS,
  INITIAL_MINISTRY_TEAM_MEMBERS, INITIAL_MINISTRY_ACTIVITIES,
  INITIAL_MINISTRY_ANNOUNCEMENTS
} from '../data/initialData';

const STORAGE_KEYS = {
  AUTH_SESSION: 'nca_church_auth_session_v4',
  USERS: 'nca_church_saas_users_v4',
  CHURCHES: 'nca_church_tenants_v4',
  CHURCH_SETTINGS: 'nca_church_settings_v4',
  MEMBERS: 'nca_church_members_v4',
  MINISTRIES: 'nca_church_ministries_v4',
  MINISTRY_MEMBERS: 'nca_church_ministry_members_v4',
  MINISTRY_TEAMS: 'nca_church_ministry_teams_v4',
  MINISTRY_TEAM_MEMBERS: 'nca_church_ministry_team_members_v4',
  MINISTRY_ACTIVITIES: 'nca_church_ministry_activities_v4',
  MINISTRY_ANNOUNCEMENTS: 'nca_church_ministry_announcements_v4',
  PRAYERS: 'nca_church_prayers_v4',
  ROSTER: 'nca_church_roster_v4',
  ATTENDANCE: 'nca_church_attendance_v4',
  EVENTS: 'nca_church_events_v4',
  NOTIFICATIONS: 'nca_church_notifications_v4',
  ANNOUNCEMENTS: 'nca_church_announcements_v4',
  SUNDAY_SCHOOL_CLASSES: 'nca_church_ss_classes_v4',
  SUNDAY_SCHOOL_STUDENTS: 'nca_church_ss_students_v4',
  SUNDAY_SCHOOL_ATTENDANCE: 'nca_church_ss_attendance_v4',
  WHATSAPP_TEMPLATES: 'nca_church_wa_templates_v4',
  WHATSAPP_GROUPS: 'nca_church_wa_groups_v4',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error(`Failed to read key ${key}`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write key ${key}`, err);
  }
}

// 1. Auth Session Persistence (Session stays indefinitely across reloads until explicit logout or cache cleared)
export const getStoredAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read auth session', err);
    return null;
  }
};

export const saveStoredAuthSession = (session: AuthSession | null): void => {
  if (session) {
    setItem(STORAGE_KEYS.AUTH_SESSION, session);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
};

export const clearStoredAuthSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
};

// 2. Tenants & Users
export const getStoredChurches = (): ChurchTenant[] => getItem(STORAGE_KEYS.CHURCHES, INITIAL_CHURCHES);
export const saveStoredChurches = (data: ChurchTenant[]): void => setItem(STORAGE_KEYS.CHURCHES, data);

export const getStoredUsers = (): SaaSUser[] => getItem(STORAGE_KEYS.USERS, INITIAL_SAAS_USERS);
export const saveStoredUsers = (data: SaaSUser[]): void => setItem(STORAGE_KEYS.USERS, data);

// 2.1 Church Settings Map per Tenant
export const getAllStoredChurchSettings = (): Record<string, CompleteChurchSettings> => {
  return getItem(STORAGE_KEYS.CHURCH_SETTINGS, INITIAL_CHURCH_SETTINGS);
};

export const saveAllStoredChurchSettings = (data: Record<string, CompleteChurchSettings>): void => {
  setItem(STORAGE_KEYS.CHURCH_SETTINGS, data);
};

export const getDefaultChurchSettings = (churchId: string, churchName?: string): CompleteChurchSettings => {
  if (INITIAL_CHURCH_SETTINGS[churchId]) {
    return JSON.parse(JSON.stringify(INITIAL_CHURCH_SETTINGS[churchId]));
  }
  const base = JSON.parse(JSON.stringify(INITIAL_CHURCH_SETTINGS['church-1']));
  return {
    ...base,
    id: `cs-${churchId}`,
    church_id: churchId,
    profile: {
      ...base.profile,
      name: churchName || `Church ${churchId}`,
      shortName: (churchName || churchId).substring(0, 12),
      email: `office@${churchId}.org`,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const getStoredChurchSettings = (churchId: string): CompleteChurchSettings => {
  const all = getAllStoredChurchSettings();
  if (all && all[churchId]) {
    return all[churchId];
  }
  const defaultSettings = getDefaultChurchSettings(churchId);
  const updated = { ...(all || {}), [churchId]: defaultSettings };
  saveAllStoredChurchSettings(updated);
  return defaultSettings;
};

export const saveStoredChurchSettings = (churchId: string, settings: CompleteChurchSettings): void => {
  const all = getAllStoredChurchSettings();
  const stamped: CompleteChurchSettings = {
    ...settings,
    church_id: churchId,
    updatedAt: new Date().toISOString(),
  };
  const updated = { ...(all || {}), [churchId]: stamped };
  saveAllStoredChurchSettings(updated);
};

// 3. Core Church Records
export const getStoredMembers = (): Member[] => getItem(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
export const saveStoredMembers = (data: Member[]): void => setItem(STORAGE_KEYS.MEMBERS, data);

// 3.1 Reusable Ministries Framework
export const getStoredMinistries = (): ChurchMinistry[] => getItem(STORAGE_KEYS.MINISTRIES, INITIAL_MINISTRIES);
export const saveStoredMinistries = (data: ChurchMinistry[]): void => setItem(STORAGE_KEYS.MINISTRIES, data);

export const getStoredMinistryMembers = (): MinistryMember[] => getItem(STORAGE_KEYS.MINISTRY_MEMBERS, INITIAL_MINISTRY_MEMBERS);
export const saveStoredMinistryMembers = (data: MinistryMember[]): void => setItem(STORAGE_KEYS.MINISTRY_MEMBERS, data);

export const getStoredMinistryTeams = (): MinistryTeam[] => getItem(STORAGE_KEYS.MINISTRY_TEAMS, INITIAL_MINISTRY_TEAMS);
export const saveStoredMinistryTeams = (data: MinistryTeam[]): void => setItem(STORAGE_KEYS.MINISTRY_TEAMS, data);

export const getStoredMinistryTeamMembers = (): MinistryTeamMember[] => getItem(STORAGE_KEYS.MINISTRY_TEAM_MEMBERS, INITIAL_MINISTRY_TEAM_MEMBERS);
export const saveStoredMinistryTeamMembers = (data: MinistryTeamMember[]): void => setItem(STORAGE_KEYS.MINISTRY_TEAM_MEMBERS, data);

export const getStoredMinistryActivities = (): MinistryActivity[] => getItem(STORAGE_KEYS.MINISTRY_ACTIVITIES, INITIAL_MINISTRY_ACTIVITIES);
export const saveStoredMinistryActivities = (data: MinistryActivity[]): void => setItem(STORAGE_KEYS.MINISTRY_ACTIVITIES, data);

export const getStoredMinistryAnnouncements = (): MinistryAnnouncement[] => getItem(STORAGE_KEYS.MINISTRY_ANNOUNCEMENTS, INITIAL_MINISTRY_ANNOUNCEMENTS);
export const saveStoredMinistryAnnouncements = (data: MinistryAnnouncement[]): void => setItem(STORAGE_KEYS.MINISTRY_ANNOUNCEMENTS, data);

export const getStoredPrayers = (): PrayerRequest[] => getItem(STORAGE_KEYS.PRAYERS, INITIAL_PRAYERS);
export const saveStoredPrayers = (data: PrayerRequest[]): void => setItem(STORAGE_KEYS.PRAYERS, data);

export const getStoredRoster = (): RosterAssignment[] => getItem(STORAGE_KEYS.ROSTER, INITIAL_ROSTER);
export const saveStoredRoster = (data: RosterAssignment[]): void => setItem(STORAGE_KEYS.ROSTER, data);

export const getStoredAttendance = (): AttendanceRecord[] => getItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
export const saveStoredAttendance = (data: AttendanceRecord[]): void => setItem(STORAGE_KEYS.ATTENDANCE, data);

export const getStoredEvents = (): ChurchEvent[] => getItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
export const saveStoredEvents = (data: ChurchEvent[]): void => setItem(STORAGE_KEYS.EVENTS, data);

export const getStoredNotifications = (): AppNotification[] => getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
export const saveStoredNotifications = (data: AppNotification[]): void => setItem(STORAGE_KEYS.NOTIFICATIONS, data);

export const getStoredAnnouncements = (): PastorAnnouncement[] => getItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
export const saveStoredAnnouncements = (data: PastorAnnouncement[]): void => setItem(STORAGE_KEYS.ANNOUNCEMENTS, data);

export const getStoredSundaySchoolClasses = (): SundaySchoolClass[] => getItem(STORAGE_KEYS.SUNDAY_SCHOOL_CLASSES, INITIAL_SUNDAY_SCHOOL_CLASSES);
export const saveStoredSundaySchoolClasses = (data: SundaySchoolClass[]): void => setItem(STORAGE_KEYS.SUNDAY_SCHOOL_CLASSES, data);

export const getStoredSundaySchoolStudents = (): SundaySchoolStudent[] => getItem(STORAGE_KEYS.SUNDAY_SCHOOL_STUDENTS, INITIAL_SUNDAY_SCHOOL_STUDENTS);
export const saveStoredSundaySchoolStudents = (data: SundaySchoolStudent[]): void => setItem(STORAGE_KEYS.SUNDAY_SCHOOL_STUDENTS, data);

export const getStoredSundaySchoolAttendance = (): SundaySchoolAttendanceRecord[] => getItem(STORAGE_KEYS.SUNDAY_SCHOOL_ATTENDANCE, INITIAL_SUNDAY_SCHOOL_ATTENDANCE);
export const saveStoredSundaySchoolAttendance = (data: SundaySchoolAttendanceRecord[]): void => setItem(STORAGE_KEYS.SUNDAY_SCHOOL_ATTENDANCE, data);

export const getStoredWhatsAppTemplates = (): WhatsAppReminderTemplate[] => getItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, INITIAL_WHATSAPP_TEMPLATES);
export const saveStoredWhatsAppTemplates = (data: WhatsAppReminderTemplate[]): void => setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, data);

export const getStoredWhatsAppGroups = (): WhatsAppGroup[] => getItem(STORAGE_KEYS.WHATSAPP_GROUPS, INITIAL_WHATSAPP_GROUPS);
export const saveStoredWhatsAppGroups = (data: WhatsAppGroup[]): void => setItem(STORAGE_KEYS.WHATSAPP_GROUPS, data);

export function resetAllDataToDefault(): void {
  saveStoredChurches(INITIAL_CHURCHES);
  saveStoredUsers(INITIAL_SAAS_USERS);
  saveAllStoredChurchSettings(INITIAL_CHURCH_SETTINGS);
  saveStoredMembers(INITIAL_MEMBERS);
  saveStoredMinistries(INITIAL_MINISTRIES);
  saveStoredMinistryMembers(INITIAL_MINISTRY_MEMBERS);
  saveStoredMinistryTeams(INITIAL_MINISTRY_TEAMS);
  saveStoredMinistryTeamMembers(INITIAL_MINISTRY_TEAM_MEMBERS);
  saveStoredMinistryActivities(INITIAL_MINISTRY_ACTIVITIES);
  saveStoredMinistryAnnouncements(INITIAL_MINISTRY_ANNOUNCEMENTS);
  saveStoredPrayers(INITIAL_PRAYERS);
  saveStoredRoster(INITIAL_ROSTER);
  saveStoredAttendance(INITIAL_ATTENDANCE);
  saveStoredEvents(INITIAL_EVENTS);
  saveStoredNotifications(INITIAL_NOTIFICATIONS);
  saveStoredAnnouncements(INITIAL_ANNOUNCEMENTS);
  saveStoredSundaySchoolClasses(INITIAL_SUNDAY_SCHOOL_CLASSES);
  saveStoredSundaySchoolStudents(INITIAL_SUNDAY_SCHOOL_STUDENTS);
  saveStoredSundaySchoolAttendance(INITIAL_SUNDAY_SCHOOL_ATTENDANCE);
  saveStoredWhatsAppTemplates(INITIAL_WHATSAPP_TEMPLATES);
  saveStoredWhatsAppGroups(INITIAL_WHATSAPP_GROUPS);
}

export function exportDataAsJson(churchId?: string): string {
  const allMembers = getStoredMembers();
  const allPrayers = getStoredPrayers();
  const allAttendance = getStoredAttendance();
  const allEvents = getStoredEvents();
  const allAnnouncements = getStoredAnnouncements();

  const filterByChurch = <T extends { church_id?: string; churchId?: string }>(items: T[]): T[] => {
    if (!churchId) return items;
    return items.filter(i => (i.church_id === churchId || i.churchId === churchId));
  };

  const payload = {
    exportedAt: new Date().toISOString(),
    church_id: churchId || 'all',
    members: filterByChurch(allMembers),
    prayers: filterByChurch(allPrayers),
    attendance: filterByChurch(allAttendance),
    events: filterByChurch(allEvents),
    announcements: filterByChurch(allAnnouncements),
  };
  return JSON.stringify(payload, null, 2);
}

export function exportMembersToCsv(members: Member[]): string {
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'City', 'State', 'PIN Code', 'Status', 'Joined Date', 'Teams', 'Skills'];
  const rows = members.map(m => [
    `"${m.firstName || ''}"`,
    `"${m.lastName || ''}"`,
    `"${m.email || ''}"`,
    `"${m.phone || ''}"`,
    `"${m.address || ''}"`,
    `"${m.city || ''}"`,
    `"${m.state || ''}"`,
    `"${m.zipCode || ''}"`,
    `"${m.status || ''}"`,
    `"${m.joinedDate || ''}"`,
    `"${(m.ministryTeams || []).join(', ')}"`,
    `"${(m.skills || []).join(', ')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
