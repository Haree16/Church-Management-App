import React, { useState, useMemo } from 'react';
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  Heart,
  Calendar,
  Clock,
  Shield,
  Megaphone,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/context/NotificationContext';
import { Notification, NotificationCategory } from '@/types/database';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const getCategoryIcon = (category?: NotificationCategory) => {
    switch (category) {
      case 'new_visitor':
        return <UserPlus className="h-4 w-4 text-sky-600" />;
      case 'new_prayer_request':
        return <Heart className="h-4 w-4 text-rose-600" />;
      case 'follow_up_due':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'follow_up_overdue':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'event_reminder':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'volunteer_assignment':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-sky-600" />;
      case 'system_notification':
        return <Shield className="h-4 w-4 text-slate-600" />;
      default:
        return <Bell className="h-4 w-4 text-sky-600" />;
    }
  };

  const getCategoryLabel = (category?: NotificationCategory) => {
    switch (category) {
      case 'new_visitor':
        return 'Visitor Alert';
      case 'new_prayer_request':
        return 'Prayer Request';
      case 'follow_up_due':
        return 'Follow-Up Due';
      case 'follow_up_overdue':
        return 'Follow-Up Overdue';
      case 'event_reminder':
        return 'Event Reminder';
      case 'volunteer_assignment':
        return 'Volunteer Roster';
      case 'announcement':
        return 'Announcement';
      case 'system_notification':
        return 'System & Security';
      default:
        return 'General Update';
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (unreadOnly && n.is_read) return false;
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, unreadOnly, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Notification Center & Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs font-mono">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time updates for visitors, urgent prayer petitions, overdue pastoral care, volunteer schedules, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-9 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearNotifications()}
              className="h-9 gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setUnreadOnly((prev) => !prev)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
            unreadOnly
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Unread Only ({unreadCount})
        </button>

        <span className="text-slate-300 dark:text-slate-700 px-1">|</span>

        {[
          { key: 'new_visitor', label: 'Visitors' },
          { key: 'new_prayer_request', label: 'Prayers' },
          { key: 'follow_up_due', label: 'Follow-ups' },
          { key: 'event_reminder', label: 'Events' },
          { key: 'volunteer_assignment', label: 'Volunteers' },
          { key: 'announcement', label: 'Announcements' },
          { key: 'system_notification', label: 'System' },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              categoryFilter === cat.key
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-10 w-10 text-slate-400" />}
            title="No notifications found"
            description="You're all caught up! New alerts and pastoral tasks will appear here."
          />
        ) : (
          filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all hover:shadow-xs border ${
                !notif.is_read
                  ? 'border-sky-300 bg-sky-50/20 dark:border-sky-900/60 dark:bg-sky-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-normal">
                        {getCategoryLabel(notif.category)}
                      </Badge>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                      {notif.sender_name && (
                        <span>From: <strong>{notif.sender_name}</strong></span>
                      )}
                      <span>•</span>
                      <span>{formatDate(notif.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.link && (
                    <Link
                      to={notif.link}
                      onClick={() => markAsRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-900 transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {!notif.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notif.id)}
                      className="h-8 text-xs text-slate-500 hover:text-slate-900"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
export default NotificationsPage;
