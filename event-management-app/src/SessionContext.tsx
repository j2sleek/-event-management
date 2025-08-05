import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const SessionContext = createContext<{ session: Session | null, user: User | null }>({ session: null, user: null });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    }).catch((error) => {
      console.error('Error getting session:', error?.message || 'Unknown authentication error');
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error handling auth state change:', error instanceof Error ? error.message : 'Unknown error');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
