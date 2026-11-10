'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  getLocalSavedIds,
  setLocalSavedIds,
  syncAndMergeSavedProperties,
  persistUserSavedIds,
} from '@/lib/services/savedPropertiesService';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'tenant' | 'owner' | 'admin';
  saved_properties?: string[];
  city?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  savedIds: string[];
  isSaved: (propertyId: string) => boolean;
  toggleSave: (propertyId: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize saved IDs from localStorage on mount
  useEffect(() => {
    setSavedIds(getLocalSavedIds());
  }, []);

  // Sync profile & merge saved properties for an authenticated user
  const syncUserSession = useCallback(async (authUser: User) => {
    setUser(authUser);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch profile from database
      const { data: existingProf, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const userMeta = authUser.user_metadata || {};
      const fullName = existingProf?.full_name || userMeta.full_name || userMeta.name || 'User';
      const avatarUrl = existingProf?.avatar_url || userMeta.avatar_url || userMeta.picture || '';
      const email = authUser.email || existingProf?.email || '';
      const currentRole = existingProf?.role || 'user';

      let activeProfile: UserProfile;

      if (!existingProf) {
        // Create new user profile with role: 'user'
        const newProf = {
          id: authUser.id,
          full_name: fullName,
          email,
          avatar_url: avatarUrl,
          role: 'user' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(newProf)
          .select()
          .maybeSingle();

        if (insertErr) {
          console.warn('Could not insert new profile:', insertErr.message);
        }
        activeProfile = (inserted as UserProfile) || (newProf as UserProfile);
      } else {
        activeProfile = existingProf as UserProfile;
      }

      // 2. Merge local saved properties into user's profile
      const localIds = getLocalSavedIds();
      const mergedSaved = await syncAndMergeSavedProperties(authUser.id, localIds);

      activeProfile.saved_properties = mergedSaved;
      setProfile(activeProfile);
      setSavedIds(mergedSaved);
    } catch (err) {
      console.error('Error syncing user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        syncUserSession(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setSavedIds(getLocalSavedIds());
        setIsLoading(false);
      }
    });

    // Subscribe to auth changes (OAuth redirect, sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await syncUserSession(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setSavedIds(getLocalSavedIds());
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserSession]);

  // Fast isSaved check
  const isSaved = useCallback((propertyId: string): boolean => {
    if (!propertyId) return false;
    return savedIds.includes(propertyId);
  }, [savedIds]);

  // Toggle save property (optimistic update + local storage + cloud sync if logged in)
  const toggleSave = useCallback(async (propertyId: string): Promise<void> => {
    if (!propertyId) return;

    setSavedIds((prev) => {
      const next = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];

      // Asynchronously persist to local storage and DB
      persistUserSavedIds(user?.id, next);

      if (profile) {
        setProfile({ ...profile, saved_properties: next });
      }

      return next;
    });
  }, [user, profile]);

  // Trigger Google OAuth Sign In
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      alert('Supabase credentials are not configured.');
      return;
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSavedIds(getLocalSavedIds());
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await syncUserSession(user);
    }
  }, [user, syncUserSession]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      savedIds,
      isSaved,
      toggleSave,
      signInWithGoogle,
      signOut,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshProfile,
    }),
    [
      user,
      profile,
      isLoading,
      savedIds,
      isSaved,
      toggleSave,
      signInWithGoogle,
      signOut,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
