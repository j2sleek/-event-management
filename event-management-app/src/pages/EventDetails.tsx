import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import type { Event } from '../types';
import { useSession } from '../SessionContext';
import EventRatingComponent from '../components/EventRating';
import { trackEvent } from '../utils/analytics';
import { Calendar, MapPin, Users, DollarSign, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const fetchEvent = React.useCallback(async () => {
    if (!id || !user) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
      
      // Track page view
      await trackEvent(id, 'view', 1, user.id);

      // Check if user has a ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (ticketError && ticketError.code !== 'PGRST116') {
        throw ticketError;
      }

      if (ticketData) {
        setHasTicket(true);
      }

    } catch (error: any) {
      console.error('Error fetching event:', error.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const getTicket = async () => {
    if (!id || !user || !event) return;
    
    setPurchasing(true);
    try {
      const { error } = await supabase.from('tickets').insert([
        { 
          event_id: id, 
          user_id: user.id,
          ticket_type: 'standard',
          price_paid: event.price
        },
      ]);
      
      if (error) throw error;
      
      // Update available tickets
      await supabase
        .from('events')
        .update({ available_tickets: event.available_tickets - 1 })
        .eq('id', id);
      
      // Track ticket purchase
      await trackEvent(id, 'ticket_purchase', 1, user.id);
      
      setHasTicket(true);
      setEvent(prev => prev ? { ...prev, available_tickets: prev.available_tickets - 1 } : null);
      toast.success('Ticket acquired successfully!');
    } catch (error: any) {
      toast.error(error.error_description || error.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const [longitude, latitude] = event.location.coordinates;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="text-white animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>
            <div className="flex items-center space-x-4 text-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {new Date(event.date).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              {event.venue_name && (
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{event.venue_name}</h3>
                  {event.venue_address && (
                    <p className="text-gray-600 flex items-center mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue_address}
                    </p>
                  )}
                </div>
              )}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 text-center">
                <MapPin className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-700 mb-4">Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <span>View on Google Maps</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {hasTicket && (
              <EventRatingComponent eventId={event.id} eventName={event.name} />
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              <h3 className="text-xl font-bold mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {event.price === 0 ? 'Free' : `$${event.price}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available Tickets</span>
                  <span className="font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {event.available_tickets}
                  </span>
                </div>
                {event.average_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-semibold">
                      ⭐ {event.average_rating.toFixed(1)} ({event.total_ratings} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
              {hasTicket ? (
                <div className="text-center">
                  <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg mb-4">
                    <p className="font-semibold">✓ You have a ticket for this event!</p>
                  </div>
                  <p className="text-gray-600">Check your tickets in the My Tickets section.</p>
                </div>
              ) : event.available_tickets > 0 ? (
                <button
                  onClick={getTicket}
                  disabled={purchasing}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    `Get Ticket - ${event.price === 0 ? 'Free' : `$${event.price}`}`
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Sold Out</p>
                    <p className="text-sm mt-1">No tickets available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
