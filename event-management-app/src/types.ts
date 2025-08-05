export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  creator_id: string;
  category_id: string;
  created_at: string;
  price: number;
  max_tickets: number;
  available_tickets: number;
  image_url?: string;
  venue_name?: string;
  venue_address?: string;
  average_rating?: number;
  total_ratings?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  createdAt: string;
  events: Event;
  ticketType: string;
  pricePaid: number;
  status: string;
}

export interface EventRating {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  event_id?: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  event_id?: string;
  amount: number;
  currency: string;
  payment_intent_id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  transaction_type: 'ticket' | 'subscription';
  created_at: string;
}

export interface UserProfile {
  id: string;
  role: 'standard' | 'pro';
  events_created_this_month: number;
  last_event_creation_reset: string;
}

export interface EventAnalytics {
  event_id: string;
  views: number;
  ticket_sales: number;
  revenue: number;
  average_rating: number;
  total_ratings: number;
}