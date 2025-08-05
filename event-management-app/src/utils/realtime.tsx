import { supabase } from '../supabase';
import { createNotification } from './notifications';
import toast from 'react-hot-toast';

export interface RealtimeEvent {
  type: 'event_created' | 'event_updated' | 'ticket_purchased' | 'event_rated' | 'event_reminder';
  data: any;
  userId: string;
}

class RealtimeManager {
  private channels: Map<string, any> = new Map();

  // Subscribe to event updates for a specific event
  subscribeToEvent(eventId: string, callback: (event: RealtimeEvent) => void) {
    const channelName = `event-${eventId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => {
          callback({
            type: 'event_updated',
            data: payload.new,
            userId: payload.new.creator_id
          });
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tickets', filter: `event_id=eq.${eventId}` },
        (payload) => {
          callback({
            type: 'ticket_purchased',
            data: payload.new,
            userId: payload.new.user_id
          });
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'event_ratings', filter: `event_id=eq.${eventId}` },
        (payload) => {
          callback({
            type: 'event_rated',
            data: payload.new,
            userId: payload.new.user_id
          });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to user-specific notifications
  subscribeToUserNotifications(userId: string, callback: (notification: any) => void) {
    const channelName = `user-notifications-${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new;
          callback(notification);
          
          // Show toast notification
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-slide-in' : 'animate-fade-out'} max-w-md w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 animate-pulse-gentle">
                    {this.getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button 
                  onClick={() => toast.dismiss(t.id)} 
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            </div>
          ), { duration: 6000 });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to analytics updates for event creators
  subscribeToAnalytics(creatorId: string, callback: (data: any) => void) {
    const channelName = `analytics-${creatorId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'event_analytics' },
        async (payload) => {
          // Check if this analytics event belongs to the creator's events
          const { data: event } = await supabase
            .from('events')
            .select('creator_id')
            .eq('id', payload.new.event_id)
            .single();
          
          if (event && event.creator_id === creatorId) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  private getNotificationIcon(type: string) {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'success': 
        return <div className={`${iconClass} text-green-500`}>✓</div>;
      case 'warning': 
        return <div className={`${iconClass} text-yellow-500`}>⚠</div>;
      case 'error': 
        return <div className={`${iconClass} text-red-500`}>✕</div>;
      default: 
        return <div className={`${iconClass} text-blue-500`}>ℹ</div>;
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Utility functions for common real-time operations
export const notifyEventCreated = async (eventId: string, eventName: string, creatorId: string) => {
  // Notify followers or interested users
  const { data: followers } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', creatorId);

  if (followers) {
    const notifications = followers.map(follow => ({
      user_id: follow.follower_id,
      title: 'New Event Created',
      message: `${eventName} has been created by someone you follow`,
      type: 'info' as const,
      event_id: eventId
    }));

    await supabase.from('notifications').insert(notifications);
  }
};

export const notifyTicketPurchased = async (eventId: string, eventName: string, creatorId: string) => {
  await createNotification(
    creatorId,
    'Ticket Sold',
    `Someone purchased a ticket for ${eventName}`,
    'success',
    eventId
  );
};

export const notifyEventRated = async (eventId: string, eventName: string, rating: number, creatorId: string) => {
  await createNotification(
    creatorId,
    'New Rating',
    `Your event "${eventName}" received a ${rating}-star rating`,
    'info',
    eventId
  );
};

export const scheduleEventReminders = async (eventId: string, eventDate: string, eventName: string) => {
  // This would typically be handled by a background job or cron
  // For now, we'll create a simple reminder system
  const eventDateTime = new Date(eventDate);
  const now = new Date();
  
  // Schedule reminder 24 hours before event
  const reminderTime = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
  
  if (reminderTime > now) {
    // In a real implementation, you'd use a job queue or scheduled function
    setTimeout(async () => {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('event_id', eventId);

      if (tickets) {
        const notifications = tickets.map(ticket => ({
          user_id: ticket.user_id,
          title: 'Event Reminder',
          message: `Don't forget! ${eventName} is tomorrow`,
          type: 'info' as const,
          event_id: eventId
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }, reminderTime.getTime() - now.getTime());
  }
};