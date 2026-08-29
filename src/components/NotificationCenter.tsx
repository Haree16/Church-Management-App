import React, { useState, useEffect } from 'react';
import { AppNotification, ChurchTenant } from '../types';
import { Bell, BellRing, Check, ShieldAlert, Sparkles, Filter, Trash2, Send, ExternalLink, Smartphone } from 'lucide-react';
import { 
  requestMobileNotificationPermission, 
  sendMobilePanelNotification 
} from '../services/mobileNotificationService';

interface NotificationCenterProps {
  notifications?: AppNotification[];
  currentChurch?: ChurchTenant;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onSendNotification: (notif: AppNotification) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  currentChurch,
  onMarkRead,
  onClearAll,
  onSendNotification,
  onNavigateTab,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showSendModal, setShowSendModal] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const safeNotifications = notifications || [];

  // New Push Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<AppNotification['category']>('Announcement');
  const [linkTab, setLinkTab] = useState('announcements');

  const requestPushPermission = async () => {
    const granted = await requestMobileNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      sendMobilePanelNotification({
        id: `notif-welcome-${Date.now()}`,
        title: '🔔 Notifications Enabled',
        message: 'You will receive real-time pastoral bulletins, urgent prayer requests, and event alerts in your mobile notification panel.',
        category: 'Announcement',
        churchName: currentChurch?.name || 'Church CMS',
        iconUrl: currentChurch?.logoUrl?.trim() || '/church_logo.jpg',
      });
    }
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      category,
      date: new Date().toISOString().split('T')[0],
      read: false,
      linkTab,
    };

    onSendNotification(newNotif);

    sendMobilePanelNotification({
      id: newNotif.id,
      title: newNotif.title,
      message: newNotif.message,
      category: newNotif.category,
      linkTab: newNotif.linkTab,
      churchName: currentChurch?.name || 'Church CMS',
      iconUrl: currentChurch?.logoUrl?.trim() || '/church_logo.jpg',
    });

    setShowSendModal(false);
    setTitle('');
    setMessage('');
  };

  const filtered = safeNotifications.filter(
    (n) => filterCategory === 'All' || n.category === filterCategory
  );

  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'Event':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'Prayer':
        return 'bg-indigo-100 text-indigo-900 border border-indigo-300';
      case 'Emergency':
        return 'bg-rose-100 text-rose-900 border border-rose-300 font-black animate-pulse';
      case 'Announcement':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      case 'Devotional':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
              <BellRing className="w-3.5 h-3.5" />
              Church Broadcasts & Push Notifications
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Member Notification Center
            </h2>
            <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
              Receive instant alerts for urgent prayer requests, pastor announcements, upcoming service schedule changes, and ministry updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!permissionGranted && (
              <button
                onClick={requestPushPermission}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl shadow-md text-xs flex items-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4" />
                Enable Mobile & Panel Notifications
              </button>
            )}

            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md text-xs flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Send Church Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Unread Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 max-w-full">
          {['All', 'Announcement', 'Prayer', 'Event', 'Emergency', 'Devotional'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-slate-600">Unread: <strong className="text-blue-600">{unreadCount}</strong></span>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
            No notifications in this category.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.read ? 'bg-white border-slate-200 opacity-80' : 'bg-blue-50/60 border-blue-200 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getCategoryBadgeStyle(n.category)}`}>
                    {n.category}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{n.date}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                {n.linkTab && onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab(n.linkTab!)}
                    className="mt-2 text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    View in {n.linkTab.toUpperCase()} module &rarr;
                  </button>
                )}
              </div>

              {!n.read && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Send Broadcast Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Send New Church Broadcast</h3>

            <form onSubmit={handleSendPush} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Time Adjustment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Prayer">Prayer</option>
                    <option value="Event">Event</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Devotional">Devotional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Navigate Module</label>
                  <select
                    value={linkTab}
                    onChange={(e) => setLinkTab(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="announcements">Announcements</option>
                    <option value="prayers">Prayers</option>
                    <option value="calendar">Calendar</option>
                    <option value="giving">Giving</option>
                    <option value="live">Live Stream</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter broadcast message details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
