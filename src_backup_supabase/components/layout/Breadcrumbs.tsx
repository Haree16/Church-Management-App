import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  members: 'Members',
  families: 'Families',
  visitors: 'Visitors',
  church: 'Church',
  ministries: 'Ministries',
  groups: 'Groups',
  volunteers: 'Volunteers',
  engagement: 'Engagement',
  attendance: 'Attendance',
  events: 'Events',
  calendar: 'Calendar',
  'prayer-requests': 'Prayer Requests',
  'follow-ups': 'Follow-ups',
  finance: 'Finance',
  donations: 'Donations',
  funds: 'Funds',
  'giving-reports': 'Giving Reports',
  communication: 'Communication',
  announcements: 'Announcements',
  notifications: 'Notifications',
  reports: 'Reports',
  settings: 'Settings',
  'church-settings': 'Church Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
    return (
      <div className="flex items-center text-xs font-medium text-slate-500">
        <Home className="h-3.5 w-3.5 mr-1 text-slate-400" />
        <span>Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathSegments.map((segment, index) => {
        const routeTo = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div key={routeTo} className="flex items-center space-x-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
