import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useSession } from '../SessionContext';

interface Category {
  id: string;
  name: string;
}

const Subscriptions = () => {
  const { user } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch user subscriptions
        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('user_category_subscriptions')
          .select('category_id')
          .eq('user_id', user.id);
        if (subscriptionsError) throw subscriptionsError;
        setSubscriptions(subscriptionsData.map((subscription) => subscription.category_id) || []);
      } catch (error: any) {
        console.error('Error fetching subscription data:', error?.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const unsubscribe = async (categoryId: string) => {
    const { error } = await supabase
      .from('user_category_subscriptions')
      .delete()
      .match({ user_id: user.id, category_id: categoryId });
    if (error) throw error;
    setSubscriptions(subscriptions.filter((id) => id !== categoryId));
  };

  const subscribe = async (categoryId: string) => {
    const { error } = await supabase
      .from('user_category_subscriptions')
      .insert([{ user_id: user.id, category_id: categoryId }]);
    if (error) throw error;
    setSubscriptions([...subscriptions, categoryId]);
  };

  const toggleSubscription = async (categoryId: string) => {
    if (!user) return;

    const isSubscribed = subscriptions.includes(categoryId);

    try {
      if (isSubscribed) {
        await unsubscribe(categoryId);
      } else {
        await subscribe(categoryId);
      }
    } catch (error: any) {
      console.error('Error updating subscription:', error?.message || 'Unknown error occurred');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Manage Subscriptions</h1>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
            <span>{category.name}</span>
            <button
              onClick={() => toggleSubscription(category.id)}
              className={`px-4 py-2 rounded-md ${ 
                subscriptions.includes(category.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {subscriptions.includes(category.id) ? 'Unsubscribe' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;