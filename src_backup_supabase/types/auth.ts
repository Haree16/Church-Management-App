import { Church, ChurchMember, Profile, UserRole } from './database';

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  activeChurch: Church | null;
  churchMember: ChurchMember | null;
  role: UserRole | null;
  availableChurches: Church[];
}

export type Permission =
  // Church management
  | 'church:read'
  | 'church:update'
  | 'church:delete'
  | 'church:settings_update'
  // Member management
  | 'members:read'
  | 'members:create'
  | 'members:update'
  | 'members:delete'
  | 'members:view_sensitive' // address, phone, pastoral notes
  // Families
  | 'families:read'
  | 'families:write'
  // Ministries & Groups
  | 'ministries:read'
  | 'ministries:write'
  | 'groups:read'
  | 'groups:write'
  | 'groups:manage_roster'
  // Volunteers
  | 'volunteers:read'
  | 'volunteers:schedule'
  // Engagement - Prayers & Follow-ups
  | 'attendance:read'
  | 'attendance:record'
  | 'events:read'
  | 'events:manage'
  | 'prayers:read_all'
  | 'prayers:read_team'
  | 'prayers:read_public'
  | 'prayers:submit'
  | 'prayers:manage'
  | 'follow_ups:read'
  | 'follow_ups:write'
  | 'follow_ups:assign'
  | 'follow_ups:delete'
  // Finances
  | 'finance:view_overview'
  | 'finance:view_detailed'
  | 'finance:manage_donations'
  | 'finance:manage_funds'
  | 'finance:view_statements'
  | 'finance:export_reports'
  | 'finance:view_audit_logs'
  | 'finance:view_own_giving'
  // Communication
  | 'announcements:read'
  | 'announcements:create'
  | 'announcements:manage'
  | 'communication:send'
  // Children & Youth
  | 'children:read'
  | 'children:write'
  | 'children:check_in'
  | 'youth:read'
  | 'youth:manage'
  // Reports & Logs
  | 'reports:view'
  | 'audit_logs:view';

export interface RoleDefinition {
  name: string;
  description: string;
  role: UserRole;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'purple' | 'emerald' | 'amber';
  permissions: Permission[];
}
