import {
  memberService,
} from './memberService';
import {
  familyService,
} from './familyService';
import {
  visitorService,
} from './visitorService';
import {
  ministryService,
} from './ministryService';
import {
  groupService,
} from './groupService';
import {
  eventService,
} from './eventService';
import {
  prayerService,
} from './prayerService';
import {
  followUpService,
} from './followUpService';
import {
  childrenService,
} from './childrenService';
import {
  youthService,
} from './youthService';
import {
  announcementService,
} from './announcementService';
import { UserRole } from '@/types/database';

export interface GlobalSearchResultItem {
  id: string;
  category: 'member' | 'family' | 'visitor' | 'ministry' | 'group' | 'event' | 'prayer' | 'follow_up' | 'child' | 'youth' | 'announcement';
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'purple' | 'emerald' | 'amber' | 'blue';
}

export const searchService = {
  async globalSearch(
    churchId: string,
    query: string,
    userRole?: UserRole | null,
    userId?: string | null
  ): Promise<GlobalSearchResultItem[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim().toLowerCase();
    const results: GlobalSearchResultItem[] = [];

    try {
      const [
        members,
        families,
        visitors,
        ministries,
        groups,
        events,
        prayers,
        followUps,
        children,
        youth,
        announcements,
      ] = await Promise.all([
        memberService.getMembers(churchId),
        familyService.getFamilies(churchId),
        visitorService.getVisitors(churchId),
        ministryService.getMinistries(churchId),
        groupService.getGroups(churchId),
        eventService.getEvents(churchId),
        prayerService.getPrayerRequests(churchId, userRole, userId),
        followUpService.getFollowUps(churchId, userRole, userId),
        childrenService.getChildren(churchId, userRole, userId),
        youthService.getYouthProfiles(churchId),
        announcementService.getAnnouncements(churchId, 'all'),
      ]);

      // 1. Members
      for (const m of members) {
        const name = `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.toLowerCase();
        const email = (m.profile?.email || '').toLowerCase();
        const phone = (m.profile?.phone || '').toLowerCase();
        if (name.includes(q) || email.includes(q) || phone.includes(q)) {
          results.push({
            id: m.id,
            category: 'member',
            title: m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`,
            subtitle: m.profile?.email || m.profile?.phone || 'Member',
            url: `/people/members/${m.id}`,
            badge: m.role.replace('_', ' '),
            badgeVariant: 'purple',
          });
        }
      }

      // 2. Families
      for (const f of families) {
        const famName = f.family_name || '';
        if (famName.toLowerCase().includes(q) || (f.address && f.address.toLowerCase().includes(q))) {
          results.push({
            id: f.id,
            category: 'family',
            title: famName,
            subtitle: `${f.members?.length || 0} family members`,
            url: `/people/families`,
            badge: 'Family',
            badgeVariant: 'secondary',
          });
        }
      }

      // 3. Visitors
      for (const v of visitors) {
        const name = `${v.first_name || ''} ${v.last_name || ''}`.toLowerCase();
        const email = (v.email || '').toLowerCase();
        if (name.includes(q) || email.includes(q)) {
          results.push({
            id: v.id,
            category: 'visitor',
            title: `${v.first_name} ${v.last_name}`,
            subtitle: `Visited: ${v.visit_date || 'Recent'}`,
            url: `/people/visitors`,
            badge: 'Visitor',
            badgeVariant: 'blue',
          });
        }
      }

      // 4. Ministries
      for (const m of ministries) {
        if (m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))) {
          results.push({
            id: m.id,
            category: 'ministry',
            title: m.name,
            subtitle: m.leader?.first_name ? `Leader: ${m.leader.first_name} ${m.leader.last_name}` : 'Ministry',
            url: `/church/ministries`,
            badge: 'Ministry',
            badgeVariant: 'emerald',
          });
        }
      }

      // 5. Groups
      for (const g of groups) {
        if (g.name.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q))) {
          results.push({
            id: g.id,
            category: 'group',
            title: g.name,
            subtitle: g.meeting_day ? `Meets: ${g.meeting_day}` : 'Small Group',
            url: `/church/groups`,
            badge: 'Group',
            badgeVariant: 'amber',
          });
        }
      }

      // 6. Events
      for (const e of events) {
        if (e.name.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))) {
          results.push({
            id: e.id,
            category: 'event',
            title: e.name,
            subtitle: e.location || 'Church Event',
            url: `/engagement/events`,
            badge: 'Event',
            badgeVariant: 'purple',
          });
        }
      }

      // 7. Prayer Requests
      for (const p of prayers) {
        const desc = p.description || p.request || '';
        if (p.title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
          results.push({
            id: p.id,
            category: 'prayer',
            title: p.title,
            subtitle: `Submitted by: ${p.author_name || 'Anonymous'}`,
            url: `/engagement/prayer-requests`,
            badge: p.status,
            badgeVariant: p.status === 'answered' ? 'emerald' : 'outline',
          });
        }
      }

      // 8. Follow-ups
      for (const f of followUps) {
        const title = f.person_name || f.title || 'Pastoral Follow-Up';
        if (title.toLowerCase().includes(q) || (f.notes && f.notes.toLowerCase().includes(q))) {
          results.push({
            id: f.id,
            category: 'follow_up',
            title: title,
            subtitle: `Type: ${f.type.replace('_', ' ')} • Due: ${f.due_date || 'Open'}`,
            url: `/engagement/follow-ups`,
            badge: f.priority,
            badgeVariant: f.priority === 'urgent' ? 'destructive' : 'secondary',
          });
        }
      }

      // 9. Children (Filtered by role permissions)
      for (const ch of children) {
        if (ch.child_name.toLowerCase().includes(q) || (ch.parent_name && ch.parent_name.toLowerCase().includes(q))) {
          results.push({
            id: ch.id,
            category: 'child',
            title: ch.child_name,
            subtitle: `Class: ${ch.class_name || 'Kids Kingdom'} • Parent: ${ch.parent_name || 'Guardian'}`,
            url: `/children`,
            badge: 'Child',
            badgeVariant: 'emerald',
          });
        }
      }

      // 10. Youth
      for (const y of youth) {
        if (y.name.toLowerCase().includes(q) || (y.school_name && y.school_name.toLowerCase().includes(q))) {
          results.push({
            id: y.id,
            category: 'youth',
            title: y.name,
            subtitle: `${y.grade || 'Student'} • ${y.school_name || 'Youth'}`,
            url: `/youth`,
            badge: 'Youth',
            badgeVariant: 'purple',
          });
        }
      }

      // 11. Announcements
      for (const a of announcements) {
        if (a.title.toLowerCase().includes(q) || (a.message || a.content || '').toLowerCase().includes(q)) {
          results.push({
            id: a.id,
            category: 'announcement',
            title: a.title,
            subtitle: `Audience: ${a.audience}`,
            url: `/communication/announcements`,
            badge: 'Bulletin',
            badgeVariant: 'blue',
          });
        }
      }

      return results.slice(0, 25);
    } catch (e) {
      console.error('Error during global search execution:', e);
      return [];
    }
  },
};
