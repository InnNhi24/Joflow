/**
 * User Context for Global State Management with Authentication
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService, DatabaseUser } from '../services/supabase';
import { useAuth } from './AuthContext';
import { UserProfile } from '../components/OnboardingFlow';

interface UserContextType {
  currentUser: DatabaseUser | null;
  isLoading: boolean;
  updateUser: (updates: Partial<DatabaseUser>) => Promise<void>;
  setCurrentUser: (user: DatabaseUser | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<DatabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateUser = async (updates: Partial<DatabaseUser>) => {
    if (!currentUser || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await userService.updateUser(currentUser.id, updates);
      
      if (error) {
        console.error('Error updating user:', error);
        return;
      }

      if (data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user profile when auth user changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && !currentUser) {
        setIsLoading(true);
        try {
          const { data, error } = await userService.getUserById(user.id);
          
          if (error) {
            console.error('Error loading user profile:', error);
            return;
          }

          if (data) {
            setCurrentUser(data);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (!user) {
        // User logged out
        setCurrentUser(null);
      }
    };

    if (!authLoading) {
      loadUserProfile();
    }
  }, [user, authLoading, currentUser]);

  return (
    <UserContext.Provider value={{
      currentUser,
      isLoading: isLoading || authLoading,
      updateUser,
      setCurrentUser
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}