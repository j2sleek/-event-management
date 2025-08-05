import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase';
import { useSession } from '../SessionContext';
import type { EventRating } from '../types';
import toast from 'react-hot-toast';

interface EventRatingProps {
  eventId: string;
  eventName: string;
}

const EventRatingComponent: React.FC<EventRatingProps> = ({ eventId, eventName }) => {
  const { user } = useSession();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [existingRating, setExistingRating] = useState<EventRating | null>(null);
  const [allRatings, setAllRatings] = useState<EventRating[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [eventId, user]);

  const fetchRatings = async () => {
    if (!user) return;

    try {
      // Fetch user's existing rating
      const { data: userRating } = await supabase
        .from('event_ratings')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (userRating) {
        setExistingRating(userRating);
        setRating(userRating.rating);
        setReview(userRating.review || '');
      }

      // Fetch all ratings for display
      const { data: ratings } = await supabase
        .from('event_ratings')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (ratings) {
        setAllRatings(ratings);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const submitRating = async () => {
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      const ratingData = {
        event_id: eventId,
        user_id: user.id,
        rating,
        review: review.trim() || null
      };

      if (existingRating) {
        await supabase
          .from('event_ratings')
          .update(ratingData)
          .eq('id', existingRating.id);
        toast.success('Rating updated successfully!');
      } else {
        await supabase
          .from('event_ratings')
          .insert([ratingData]);
        toast.success('Rating submitted successfully!');
      }

      // Create notification for event creator
      const { data: event } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();

      if (event && event.creator_id !== user.id) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: event.creator_id,
            title: 'New Event Rating',
            message: `Someone rated your event "${eventName}" ${rating} star${rating !== 1 ? 's' : ''}`,
            type: 'info',
            event_id: eventId
          }]);
      }

      fetchRatings();
    } catch (error: any) {
      toast.error('Error submitting rating: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = allRatings.length > 0 
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Star className="h-6 w-6 text-yellow-400 fill-current" />
        <h3 className="text-xl font-semibold text-gray-900">Rate This Event</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform duration-200 hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-200 ${
                    star <= rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-right">
            <span className="text-lg font-medium text-gray-900">
              {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Click to rate'}
            </span>
            {rating > 0 && (
              <p className="text-sm text-gray-500">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Write a review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this event..."
          className="input-field resize-none"
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Help others by sharing your honest feedback
          </p>
          <span className="text-xs text-gray-400">
            {review.length}/500
          </span>
        </div>
      </div>

      <button
        onClick={submitRating}
        disabled={rating === 0 || loading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Submitting...
          </span>
        ) : (
          existingRating ? 'Update Rating' : 'Submit Rating'
        )}
      </button>

      {allRatings.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-lg">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="ml-2 text-lg font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {allRatings.length} review{allRatings.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{showReviews ? 'Hide' : 'Show'} Reviews</span>
            </button>
          </div>

          {showReviews && (
            <div className="space-y-4 max-h-80 overflow-y-auto animate-fade-in">
              {allRatings.map((ratingItem, index) => (
                <div 
                  key={ratingItem.id} 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow duration-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-white px-2 py-1 rounded">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= ratingItem.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {ratingItem.profiles?.full_name || 'Anonymous User'}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(ratingItem.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {ratingItem.review && (
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{ratingItem.review}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventRatingComponent;