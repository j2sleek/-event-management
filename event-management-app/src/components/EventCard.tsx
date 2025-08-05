import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  distance_km?: number;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-2 transform hover:scale-[1.02] overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200">
          {event.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {event.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-indigo-600 font-medium">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          
          {event.distance_km && (
            <div className="flex items-center space-x-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{event.distance_km.toFixed(1)}km</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}