import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/stores/use-notification-store';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setLoading,
    setError,
    clearError,
  } = useNotificationStore();

  // Fetch notifications for the current user
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id, setLoading, clearError, setError, setNotifications]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      markAsRead(notificationId);
    } catch (err) {
      console.error('Error in markNotificationAsRead:', err);
    }
  }, [user?.id, markAsRead]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error in markAllNotificationsAsRead:', err);
    }
  }, [user?.id, markAllAsRead]);

  // Delete notification
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error in removeNotification:', err);
    }
  }, [user?.id, deleteNotification]);

  // Send notification to a user (admin function)
  const sendNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending notification:', error);
        throw error;
      }

      // If sending to current user, add to local state
      if (userId === user?.id) {
        addNotification(data);
      }

      toast.success('Notification sent successfully');
      return data;
    } catch (err) {
      console.error('Error in sendNotification:', err);
      toast.error('Failed to send notification');
      throw err;
    }
  }, [user?.id, addNotification]);

  // Send notification to all users (admin function)
  const sendNotificationToAll = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      if (!users || users.length === 0) {
        toast.error('No users found');
        return;
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error sending notifications to all users:', error);
        throw error;
      }

      toast.success(`Notification sent to ${users.length} users`);
    } catch (err) {
      console.error('Error in sendNotificationToAll:', err);
      toast.error('Failed to send notifications');
      throw err;
    }
  }, []);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          addNotification(payload.new as any);
          toast.info('You have a new notification');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,

    // Actions
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    sendNotification,
    sendNotificationToAll,
  };
}