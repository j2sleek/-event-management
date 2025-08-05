import { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import EventCard from '../components/EventCard';
import { supabase } from '../supabase';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  distance_km?: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const initializeLocation = () => {
    getLocation();
  };

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyEvents();
    }
  }, [location]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          fetchAllEvents();
        }
      );
    } else {
      fetchAllEvents();
    }
  };

  const fetchNearbyEvents = async () => {
    if (!location) return;
    
    try {
      const { data, error } = await supabase.rpc('nearby_events', {
        lat: location.lat,
        long: location.lng,
        radius_meters: 50000
      });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      fetchAllEvents();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Finding amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gradient mb-4 animate-fade-in">
            Discover Amazing Events
          </h1>
          <div className="flex items-center justify-center text-gray-600 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mx-auto w-fit">
            <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
            <span className="font-medium">
              {location ? 'Showing events near you' : 'Showing all events'}
            </span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="card-elevated max-w-md mx-auto p-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No events found
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Be the first to create an event in your area and bring your community together!
              </p>
              <button className="btn btn-primary">
                Create Your First Event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}