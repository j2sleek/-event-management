import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useSession } from '../SessionContext';
import type { Ticket } from '../types';
import { Calendar, MapPin, Ticket as TicketIcon, Clock, DollarSign } from 'lucide-react';

const MyTickets = () => {
  const { user } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const TICKETS_QUERY = 'id, created_at, events (*)';
      const { data, error } = await supabase
        .from('tickets')
        .select(TICKETS_QUERY)
        .eq('user_id', user.id);

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gradient mb-4 animate-fade-in">
            My Tickets
          </h1>
          <p className="text-gray-600 text-lg">
            {tickets.length > 0 ? `You have ${tickets.length} ticket${tickets.length === 1 ? '' : 's'}` : 'No tickets yet'}
          </p>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map((ticket, index) => (
              <div 
                key={ticket.id} 
                className="card-elevated p-6 animate-slide-up hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-full">
                    <TicketIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    CONFIRMED
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {ticket.events.name}
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>{new Date(ticket.events.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>{new Date(ticket.events.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  
                  {ticket.events.venue_name && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-indigo-500" />
                      <span className="truncate">{ticket.events.venue_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>{ticket.events.price === 0 ? 'Free Event' : `$${ticket.events.price}`}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Purchased on {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="card-elevated max-w-md mx-auto p-12">
              <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No tickets yet
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Start exploring events and get your first ticket to see them here!
              </p>
              <button className="btn btn-primary">
                Browse Events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;