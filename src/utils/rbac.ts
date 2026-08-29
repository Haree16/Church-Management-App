import { SaaSUserRole, ChurchModuleToggles } from '../types';
import { AppTab } from '../components/BottomNav';

export interface RoleConfig {
  role: SaaSUserRole;
  label: string;
  badgeColor: string;
  description: string;
  allowedTabs: AppTab[];
  canSwitchChurch: boolean;
  canManageMembers: boolean;
  canManageMinistries: boolean;
  canManagePrayers: boolean;
  canManageRoster: boolean;
  canRecordAttendance: boolean;
  canManageSundaySchool: boolean;
  canPublishAnnouncements: boolean;
  canSendWhatsApp: boolean;
  canManageEvents: boolean;
  canAccessSettings: boolean;
  canEditSettings: boolean;
  canAccessReports: boolean;
}

export const ROLE_CONFIGS: Record<SaaSUserRole, RoleConfig> = {
  SuperAdmin: {
    role: 'SuperAdmin',
    label: 'Platform Super Admin',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Universal platform management, all churches & global administration',
    allowedTabs: [
      'dashboard',
      'reports',
      'saas',
      'directory',
      'ministries',
      'attendance',
      'whatsapp',
      'prayers',
      'calendar',
      'sundayschool',
      'announcements',
      'volunteers',
      'roster',
      'notifications',
      'settings',
    ],
    canSwitchChurch: true,
    canManageMembers: true,
    canManageMinistries: true,
    canManagePrayers: true,
    canManageRoster: true,
    canRecordAttendance: true,
    canManageSundaySchool: true,
    canPublishAnnouncements: true,
    canSendWhatsApp: true,
    canManageEvents: true,
    canAccessSettings: true,
    canEditSettings: true,
    canAccessReports: true,
  },
  PastorAdmin: {
    role: 'PastorAdmin',
    label: 'Senior / Lead Pastor (Admin)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Full administrator access to church operations, members, ministries & bulletins',
    allowedTabs: [
      'dashboard',
      'reports',
      'directory',
      'ministries',
      'prayers',
      'roster',
      'attendance',
      'sundayschool',
      'whatsapp',
      'calendar',
      'announcements',
      'volunteers',
      'notifications',
      'saas',
      'settings',
    ],
    canSwitchChurch: false,
    canManageMembers: true,
    canManageMinistries: true,
    canManagePrayers: true,
    canManageRoster: true,
    canRecordAttendance: true,
    canManageSundaySchool: true,
    canPublishAnnouncements: true,
    canSendWhatsApp: true,
    canManageEvents: true,
    canAccessSettings: true,
    canEditSettings: true,
    canAccessReports: true,
  },
  AssistantPastor: {
    role: 'AssistantPastor',
    label: 'Assistant Pastor',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Full ministry access: directory, ministries, prayers, attendance, roster, Sunday school & bulletins',
    allowedTabs: [
      'dashboard',
      'reports',
      'directory',
      'ministries',
      'prayers',
      'roster',
      'attendance',
      'sundayschool',
      'whatsapp',
      'calendar',
      'announcements',
      'volunteers',
      'notifications',
      'settings',
    ],
    canSwitchChurch: false,
    canManageMembers: true,
    canManageMinistries: true,
    canManagePrayers: true,
    canManageRoster: true,
    canRecordAttendance: true,
    canManageSundaySchool: true,
    canPublishAnnouncements: true,
    canSendWhatsApp: true,
    canManageEvents: false,
    canAccessSettings: true,
    canEditSettings: false,
    canAccessReports: true,
  },
  TreasurerStaff: {
    role: 'TreasurerStaff',
    label: 'Finance / Church Office Staff',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Member directories, ministries, attendance tracking & church administration',
    allowedTabs: [
      'dashboard',
      'reports',
      'directory',
      'ministries',
      'attendance',
      'calendar',
      'announcements',
      'notifications',
      'saas',
      'settings',
    ],
    canSwitchChurch: false,
    canManageMembers: true,
    canManageMinistries: false,
    canManagePrayers: false,
    canManageRoster: false,
    canRecordAttendance: true,
    canManageSundaySchool: false,
    canPublishAnnouncements: true,
    canSendWhatsApp: true,
    canManageEvents: false,
    canAccessSettings: true,
    canEditSettings: true,
    canAccessReports: true,
  },
  MinistryLeader: {
    role: 'MinistryLeader',
    label: 'Worship / Ministry Team Leader',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Service roster planning, ministry teams, volunteers, prayer team & schedules',
    allowedTabs: [
      'dashboard',
      'reports',
      'ministries',
      'prayers',
      'roster',
      'volunteers',
      'attendance',
      'calendar',
      'announcements',
      'notifications',
    ],
    canSwitchChurch: false,
    canManageMembers: false,
    canManageMinistries: true,
    canManagePrayers: true,
    canManageRoster: true,
    canRecordAttendance: true,
    canManageSundaySchool: false,
    canPublishAnnouncements: false,
    canSendWhatsApp: true,
    canManageEvents: false,
    canAccessSettings: false,
    canEditSettings: false,
    canAccessReports: true,
  },
  SundaySchoolTeacher: {
    role: 'SundaySchoolTeacher',
    label: 'Sunday School Teacher',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Children ministry classes, student badges, verses & attendance',
    allowedTabs: [
      'dashboard',
      'reports',
      'sundayschool',
      'ministries',
      'attendance',
      'calendar',
      'announcements',
      'prayers',
      'notifications',
    ],
    canSwitchChurch: false,
    canManageMembers: false,
    canManageMinistries: true,
    canManagePrayers: true,
    canManageRoster: false,
    canRecordAttendance: true,
    canManageSundaySchool: true,
    canPublishAnnouncements: false,
    canSendWhatsApp: true,
    canManageEvents: false,
    canAccessSettings: false,
    canEditSettings: false,
    canAccessReports: true,
  },
  Member: {
    role: 'Member',
    label: 'Church Member / Congregation',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Prayer wall, church events calendar, pastoral bulletins, ministries & alerts',
    allowedTabs: [
      'dashboard',
      'prayers',
      'ministries',
      'calendar',
      'announcements',
      'notifications',
    ],
    canSwitchChurch: false,
    canManageMembers: false,
    canManageMinistries: false,
    canManagePrayers: false,
    canManageRoster: false,
    canRecordAttendance: false,
    canManageSundaySchool: false,
    canPublishAnnouncements: false,
    canSendWhatsApp: false,
    canManageEvents: false,
    canAccessSettings: false,
    canEditSettings: false,
    canAccessReports: false,
  },
  Volunteer: {
    role: 'Volunteer',
    label: 'Ministry Volunteer',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Prayer wall, volunteer teams, ministries, duty roster, events & announcements',
    allowedTabs: [
      'dashboard',
      'prayers',
      'ministries',
      'roster',
      'volunteers',
      'calendar',
      'announcements',
      'notifications',
    ],
    canSwitchChurch: false,
    canManageMembers: false,
    canManageMinistries: false,
    canManagePrayers: false,
    canManageRoster: false,
    canRecordAttendance: false,
    canManageSundaySchool: false,
    canPublishAnnouncements: false,
    canSendWhatsApp: false,
    canManageEvents: false,
    canAccessSettings: false,
    canEditSettings: false,
    canAccessReports: false,
  },
};

export function canManageChurchEvents(role?: SaaSUserRole): boolean {
  return role === 'SuperAdmin' || role === 'PastorAdmin';
}

export function canManageAllMinistries(role?: SaaSUserRole): boolean {
  return role === 'SuperAdmin' || role === 'PastorAdmin' || role === 'AssistantPastor';
}

export function canCreateEditMinistry(role?: SaaSUserRole): boolean {
  return role === 'SuperAdmin' || role === 'PastorAdmin';
}

export function canAccessReports(role?: SaaSUserRole): boolean {
  const config = getRoleConfig(role);
  return config.canAccessReports;
}

export function canAccessAllChurchReports(role?: SaaSUserRole): boolean {
  return role === 'SuperAdmin' || role === 'PastorAdmin' || role === 'AssistantPastor' || role === 'TreasurerStaff';
}

export function getRoleConfig(role?: SaaSUserRole): RoleConfig {
  if (!role || !ROLE_CONFIGS[role]) {
    return ROLE_CONFIGS.Member;
  }
  return ROLE_CONFIGS[role];
}

export function isModuleEnabledInChurch(tab: AppTab, moduleToggles?: ChurchModuleToggles): boolean {
  if (!moduleToggles) return true;
  // Dashboard, Reports, Settings and SaaS Console should not be completely blocked by standard module toggles
  if (tab === 'dashboard' || tab === 'reports' || tab === 'settings' || tab === 'saas') return true;
  return moduleToggles[tab as keyof ChurchModuleToggles] !== false;
}

export function isTabAllowed(
  role: SaaSUserRole | undefined,
  tab: AppTab,
  moduleToggles?: ChurchModuleToggles
): boolean {
  const config = getRoleConfig(role);
  if (!config.allowedTabs.includes(tab)) {
    return false;
  }
  return isModuleEnabledInChurch(tab, moduleToggles);
}

export function getDefaultTabForRole(
  role: SaaSUserRole | undefined,
  moduleToggles?: ChurchModuleToggles
): AppTab {
  const config = getRoleConfig(role);
  for (const tab of config.allowedTabs) {
    if (isTabAllowed(role, tab, moduleToggles)) {
      return tab;
    }
  }
  return 'prayers';
}

export function canAccessChurchSettings(role?: SaaSUserRole): boolean {
  const config = getRoleConfig(role);
  return config.canAccessSettings;
}

export function canEditChurchSettings(role?: SaaSUserRole): boolean {
  const config = getRoleConfig(role);
  return config.canEditSettings;
}

