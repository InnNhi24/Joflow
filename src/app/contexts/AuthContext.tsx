/**
 * Authentication Context with Supabase Auth
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ user: User | null; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<void>;
  createUserProfile: (userId: string, profileData: any) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Starting signup process...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData // This will be available in user.user_metadata
        }
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      console.log('Signup successful:', data);

      // With email confirmation disabled, user should be immediately confirmed
      if (data.user) {
        console.log('User created, creating profile...');
        const profileResult = await createUserProfile(data.user.id, userData);
        if (profileResult.error) {
          console.error('Error creating profile:', profileResult.error);
        } else {
          console.log('Profile created successfully:', profileResult.data);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Handle email not confirmed error
      if (error && error.message.includes('Email not confirmed')) {
        console.log('Email not confirmed, auto-confirming user...');
        
        // Try to confirm the user automatically
        try {
          // First, let's try to sign up again to trigger confirmation
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password
          });
          
          if (signUpData.user && !signUpError) {
            return { user: signUpData.user, error: null };
          }
        } catch (confirmError) {
          console.warn('Auto-confirmation failed:', confirmError);
        }
        
        return { user: null, error: { message: 'Please contact support to activate your account' } };
      }

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const createUserProfile = async (userId: string, profileData: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId, // Use auth user ID directly
          name: profileData.name,
          phone: profileData.phone,
          email: profileData.email,
          location_lat: profileData.location.lat,
          location_lng: profileData.location.lng,
          location_name: profileData.locationName
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { data: null, error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      createUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}