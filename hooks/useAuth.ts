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
        console.warn('Auth: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      console.log('Auth: Initializing session check...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Auth: Session error during init:', sessionError);
          if (sessionError.message.includes('Refresh Token Not Found') || sessionError.message.includes('Invalid Refresh Token')) {
            console.log('Auth: Invalid token, signing out...');
            await supabase.auth.signOut();
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
          console.log('Auth: User session found:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('Auth: No active session found');
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth: Critical error during initialization:', err);
      } finally {
        if (mounted) {
          console.log('Auth: Initialization finished');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: State changed:', event, session?.user?.id);
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // initializeAuth already handles this
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
        // Only fetch if we don't have a profile or the user changed
        if (!profileRef.current || profileRef.current.id !== session.user.id) {
          console.log('Auth: Profile missing or user changed, fetching profile...');
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
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const isProfileComplete = useCallback(() => {
    if (!profile) return false;
    return !!(profile.telefone && profile.setor && profile.tax_id && profile.endereco);
  }, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    isProfileComplete
  }), [user, profile, loading, signOut, refreshProfile, isProfileComplete]);

  return value;
}
