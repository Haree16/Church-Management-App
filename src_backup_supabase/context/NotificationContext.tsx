import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/types/database';
import { DEMO_NOTIFICATIONS } from '@/lib/mockData';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, activeChurch } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

  useEffect(() => {
    if (!user || !activeChurch) return;

    if (isSupabaseConfigured()) {
      const fetchNotifications = async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('church_id', activeChurch.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setNotifications(data);
        }
      };

      fetchNotifications();

      // Realtime subscription
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            toast.info(newNotif.title, { description: newNotif.message });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Demo notifications
      setNotifications(DEMO_NOTIFICATIONS);
    }
  }, [user, activeChurch]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    if (isSupabaseConfigured()) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (isSupabaseConfigured() && user && activeChurch) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('church_id', activeChurch.id)
        .eq('user_id', user.id);
    }
    toast.success('All notifications marked as read.');
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notifData: Omit<Notification, 'id' | 'created_at'>) => {
    const newNotif: Notification = {
      ...notifData,
      id: `n-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
