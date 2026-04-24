'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error.message || error);
        return null;
      }
      
      if (data) {
        // Force SUPER_ADMIN for specific user
        if (data.email === 'jpstefanon@gmail.com') {
          if (data.perfil !== 'SUPER_ADMIN' || data.status !== 'ACTIVE') {
            console.log('Auth: Syncing SUPER_ADMIN role to DB...');
            await supabase
              .from('profiles')
              .update({ perfil: 'SUPER_ADMIN', status: 'ACTIVE' })
              .eq('id', userId);
            data.perfil = 'SUPER_ADMIN';
            data.status = 'ACTIVE';
          }
        }
        setProfile(data);
        return data;
      } else {
        console.warn('Profile not found for user:', userId);
        setProfile(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: stop loading after 5 seconds no matter what
    const timeoutId = setTimeout(() => {
      if (mounted) {
         setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message.includes('Refresh Token Not Found') || sessionError.message.includes('Invalid Refresh Token')) {
             await supabase.auth.signOut();
             if (typeof window !== 'undefined') {
                window.localStorage.clear();
                window.sessionStorage.clear();
             }
             if (mounted) {
               setUser(null);
               setProfile(null);
               setLoading(false);
             }
             return;
          }
          throw sessionError;
        }

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth check error', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        if (!profileRef.current || profileRef.current.id !== session.user.id) {
          setLoading(true);
          await fetchProfile(session.user.id);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        window.location.href = '/login';
      }
    } catch (e) {
      console.error('Logout error:', e);
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [user, profile, loading, signOut, refreshProfile]);

  return value;
}
