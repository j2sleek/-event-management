import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useSession } from '../SessionContext';
import { TrendingUp, Users, DollarSign, Star, Eye, Calendar, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  eventName: string;
  views: number;
  tickets: number;
  revenue: number;
  rating: number;
  date: string;
}

interface TimeSeriesData {
  date: string;
  views: number;
  tickets: number;
  revenue: number;
}

const Analytics = () => {
  const { user } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async (showRefreshing = false) => {
    if (!user) return;
    
    if (showRefreshing) setRefreshing(true);
    
    try {
      const daysAgo = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: events } = await supabase
        .from('events')
        .select(`
          id, name, created_at,
          event_analytics(metric_type, metric_value, created_at),
          tickets(price_paid, created_at),
          event_ratings(rating, created_at)
        `)
        .eq('creator_id', user.id);

      const analyticsData = events?.map(event => {
        const views = event.event_analytics?.filter(a => a.metric_type === 'view').length || 0;
        const tickets = event.tickets?.length || 0;
        const revenue = event.tickets?.reduce((sum, t) => sum + (t.price_paid || 0), 0) || 0;
        const avgRating = event.event_ratings?.length 
          ? event.event_ratings.reduce((sum, r) => sum + r.rating, 0) / event.event_ratings.length 
          : 0;

        return {
          eventName: event.name,
          views,
          tickets,
          revenue,
          rating: Math.round(avgRating * 10) / 10,
          date: event.created_at
        };
      }) || [];

      // Generate time series data
      const timeSeriesMap = new Map<string, TimeSeriesData>();
      
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        timeSeriesMap.set(dateStr, {
          date: dateStr,
          views: 0,
          tickets: 0,
          revenue: 0
        });
      }

      events?.forEach(event => {
        event.event_analytics?.forEach(analytic => {
          const date = new Date(analytic.created_at).toISOString().split('T')[0];
          if (timeSeriesMap.has(date) && analytic.metric_type === 'view') {
            timeSeriesMap.get(date)!.views += analytic.metric_value;
          }
        });
        
        event.tickets?.forEach(ticket => {
          const date = new Date(ticket.created_at).toISOString().split('T')[0];
          if (timeSeriesMap.has(date)) {
            const data = timeSeriesMap.get(date)!;
            data.tickets += 1;
            data.revenue += ticket.price_paid || 0;
          }
        });
      });

      const timeSeriesArray = Array.from(timeSeriesMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAnalytics(analyticsData);
      setTimeSeriesData(timeSeriesArray);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, selectedPeriod]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for analytics updates
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_analytics' },
        () => fetchAnalytics()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        () => fetchAnalytics()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_ratings' },
        () => fetchAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedPeriod]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    </div>
  );

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalTickets = analytics.reduce((sum, a) => sum + a.tickets, 0);
  const totalRevenue = analytics.reduce((sum, a) => sum + a.revenue, 0);
  const avgRating = analytics.length ? analytics.reduce((sum, a) => sum + a.rating, 0) / analytics.length : 0;



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Event Analytics</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
              className="input-field w-auto"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 card-hover animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 card-hover animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900">{totalTickets.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 card-hover animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 card-hover animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-semibold mb-6">Event Performance</h3>
          <div className="space-y-4">
            {analytics.map((event, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900">{event.eventName}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{event.rating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Views</p>
                    <p className="font-semibold text-blue-600">{event.views}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Tickets</p>
                    <p className="font-semibold text-green-600">{event.tickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-semibold text-yellow-600">${event.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;