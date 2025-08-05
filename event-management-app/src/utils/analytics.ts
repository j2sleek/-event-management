import { supabase } from '../supabase';
import type { EventAnalytics } from '../types';
import { realtimeManager } from './realtime';

export const trackEvent = async (
  eventId: string,
  metricType: 'view' | 'ticket_purchase' | 'rating' | 'share' | 'click' | 'search',
  metricValue: number = 1,
  userId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const { error } = await supabase
      .from('event_analytics')
      .insert({
        event_id: eventId,
        metric_type: metricType,
        metric_value: metricValue,
        user_id: userId,
        metadata: metadata || {}
      });

    if (error) throw error;

    // Track user engagement patterns
    if (userId) {
      await trackUserEngagement(userId, metricType, eventId);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Track user engagement patterns
const trackUserEngagement = async (userId: string, action: string, eventId: string) => {
  try {
    await supabase
      .from('user_engagement')
      .upsert({
        user_id: userId,
        event_id: eventId,
        last_action: action,
        last_interaction: new Date().toISOString(),
        interaction_count: 1
      }, {
        onConflict: 'user_id,event_id',
        ignoreDuplicates: false
      });
  } catch (error) {
    console.error('Error tracking user engagement:', error);
  }
};

// Track page views with session data
export const trackPageView = async (page: string, userId?: string, sessionId?: string) => {
  try {
    await supabase
      .from('page_analytics')
      .insert({
        page,
        user_id: userId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track search queries
export const trackSearch = async (query: string, resultsCount: number, userId?: string) => {
  try {
    await supabase
      .from('search_analytics')
      .insert({
        query,
        results_count: resultsCount,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

export const getEventAnalytics = async (eventId: string): Promise<EventAnalytics | null> => {
  const { data, error } = await supabase
    .from('event_analytics')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }

  const analytics = data.reduce((acc, item) => {
    switch (item.metric_type) {
      case 'view':
        acc.views += item.metric_value;
        break;
      case 'ticket_purchase':
        acc.ticket_sales += item.metric_value;
        break;
      case 'rating':
        acc.total_ratings += 1;
        acc.average_rating = (acc.average_rating * (acc.total_ratings - 1) + item.metric_value) / acc.total_ratings;
        break;
    }
    return acc;
  }, {
    event_id: eventId,
    views: 0,
    ticket_sales: 0,
    revenue: 0,
    average_rating: 0,
    total_ratings: 0
  });

  // Get revenue from payment transactions
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('event_id', eventId)
    .eq('status', 'succeeded');

  analytics.revenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return analytics;
};

export const getAllEventsAnalytics = async (creatorId: string) => {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, created_at, date')
    .eq('creator_id', creatorId);

  if (error) return [];

  const analyticsPromises = events.map(event => getEventAnalytics(event.id));
  const analytics = await Promise.all(analyticsPromises);

  return events.map((event, index) => ({
    ...event,
    analytics: analytics[index]
  }));
};

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (creatorId: string, period: '7d' | '30d' | '90d' = '30d') => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Get events created in period
    const { data: events } = await supabase
      .from('events')
      .select('id, name, created_at, price')
      .eq('creator_id', creatorId)
      .gte('created_at', startDate.toISOString());

    // Get analytics for these events
    const eventIds = events?.map(e => e.id) || [];
    
    const { data: analytics } = await supabase
      .from('event_analytics')
      .select('*')
      .in('event_id', eventIds)
      .gte('created_at', startDate.toISOString());

    // Get ticket sales
    const { data: tickets } = await supabase
      .from('tickets')
      .select('event_id, price_paid, created_at')
      .in('event_id', eventIds)
      .gte('created_at', startDate.toISOString());

    // Get ratings
    const { data: ratings } = await supabase
      .from('event_ratings')
      .select('event_id, rating, created_at')
      .in('event_id', eventIds)
      .gte('created_at', startDate.toISOString());

    // Process data
    const totalViews = analytics?.filter(a => a.metric_type === 'view').length || 0;
    const totalTickets = tickets?.length || 0;
    const totalRevenue = tickets?.reduce((sum, t) => sum + (t.price_paid || 0), 0) || 0;
    const avgRating = ratings?.length 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    // Generate time series data
    const timeSeriesData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayViews = analytics?.filter(a => 
        a.metric_type === 'view' && 
        a.created_at.startsWith(dateStr)
      ).length || 0;
      
      const dayTickets = tickets?.filter(t => 
        t.created_at.startsWith(dateStr)
      ).length || 0;
      
      const dayRevenue = tickets?.filter(t => 
        t.created_at.startsWith(dateStr)
      ).reduce((sum, t) => sum + (t.price_paid || 0), 0) || 0;

      timeSeriesData.push({
        date: dateStr,
        views: dayViews,
        tickets: dayTickets,
        revenue: dayRevenue
      });
    }

    return {
      summary: {
        totalViews,
        totalTickets,
        totalRevenue,
        avgRating,
        eventsCreated: events?.length || 0
      },
      timeSeriesData,
      events: events || [],
      period
    };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return null;
  }
};

// Real-time analytics subscription
export const subscribeToAnalytics = (creatorId: string, callback: (data: any) => void) => {
  return realtimeManager.subscribeToAnalytics(creatorId, callback);
};