/**
 * Root Component with Authentication
 * Manages navigation: Onboarding → Role Selection → Dashboard
 */

import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import RoleSelector from './components/RoleSelector';
import OnboardingFlow, { UserProfile } from './components/OnboardingFlow';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/supabase';
import { Toaster } from 'sonner';
import { UserRole } from './types';

function AppContent() {
  const { user, signOut, loading } = useAuth();
  const { currentUser, updateUser, setCurrentUser } = useUser();
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'account' | 'onboarding' | 'roleSelect' | 'dashboard' | 'authCallback'>('landing');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Debug and monitoring

  // Check for auth callback on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=signup')) {
      setCurrentView('authCallback');
      return;
    }
  }, []);

  // Auto-redirect logic
  useEffect(() => {
    if (loading || isManualNavigation) return; // Don't do anything while loading or during manual navigation
    
    if (user && currentUser) {
      // Check if profile is complete (has real name and phone)
      const isProfileComplete = currentUser.name && 
                               currentUser.name !== 'New User' && 
                               currentUser.phone && 
                               currentUser.phone.trim() !== '';
      
      if (isProfileComplete) {
        // Check if user has saved role
        if (currentUser.role) {
          // User has role saved -> go to dashboard
          setUserRole(currentUser.role);
          if (currentView !== 'dashboard') {
            setCurrentView('dashboard');
          }
        } else {
          // User has NO role -> must select role
          if (currentView !== 'roleSelect') {
            setCurrentView('roleSelect');
          }
        }
      } else {
        // User has incomplete profile -> complete onboarding
        if (currentView !== 'onboarding') {
          setCurrentView('onboarding');
        }
      }
    } else if (user && !currentUser) {
      // User is authenticated but no profile -> complete onboarding
      if (currentView !== 'onboarding') {
        setCurrentView('onboarding');
      }
    }
    // If no user, stay on current view (landing/auth)
  }, [user, currentUser, loading, currentView]);

  const handleGetStarted = () => {
    // Navigate to auth
    setIsManualNavigation(false);
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    // User signed in successfully, check if they have profile
    setIsManualNavigation(false);
    if (currentUser) {
      setCurrentView('roleSelect');
    } else {
      setCurrentView('onboarding');
    }
  };

  const handleAuthNeedProfile = () => {
    // User signed up, need to complete profile
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    // Update user profile in database
    if (user) {
      await updateUser({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        location_lat: profile.location.lat,
        location_lng: profile.location.lng,
        location_name: profile.locationName
      });
      setCurrentView('roleSelect');
    }
  };

  const handleAuthCallbackSuccess = () => {
    // Clear URL hash
    window.history.replaceState(null, '', window.location.pathname);
    setCurrentView('roleSelect');
  };

  const handleAuthCallbackError = (error: string) => {
    // Handle auth error
    // Clear URL hash
    window.history.replaceState(null, '', window.location.pathname);
    setCurrentView('landing');
  };

  const [isManualNavigation, setIsManualNavigation] = useState(false);

  const handleRoleSelectorBack = () => {
    // Handle back navigation
    
    // Set manual navigation flag to prevent auto-redirect
    setIsManualNavigation(true);
    
    // Check if user has complete profile
    if (currentUser) {
      const isProfileComplete = currentUser.name && 
                               currentUser.name !== 'New User' && 
                               currentUser.phone && 
                               currentUser.phone.trim() !== '';
      
      if (isProfileComplete) {
        // User has complete profile -> go to account page (with logout/continue options)
        setCurrentView('account');
      } else {
        // User has incomplete profile -> go to onboarding
        setCurrentView('onboarding');
      }
    } else {
      // No user profile -> go to auth
      setCurrentView('auth');
    }
    
    // Reset manual navigation flag after a short delay
    setTimeout(() => {
      setIsManualNavigation(false);
    }, 100);
  };
  const handleAccountBack = () => {
    // From account page, go back to role selector
    setCurrentView('roleSelect');
  };

  const handleAccountSignOut = async () => {
    // Sign out and go to landing
    setUserRole(null);
    setCurrentUser(null);
    await signOut();
    setCurrentView('landing');
  };

  const handleAccountContinue = () => {
    // Continue to role selector
    setCurrentView('roleSelect');
  };

  // Role is fixed once selected - users cannot change roles
  // They must logout and create a new account to change role

  const handleSelectRole = async (role: UserRole) => {
    setUserRole(role);
    setIsManualNavigation(false);
    
    // Save role to database permanently
    if (currentUser) {
      try {
        await userService.updateUserRole(currentUser.id, role);
        // Update local user state
        setCurrentUser({ ...currentUser, role });
      } catch (error) {
        // Handle error silently
      }
    }
    
    setCurrentView('dashboard');
  };

  const handleUpdateProfile = async (profile: Omit<UserProfile, 'password'>) => {
    if (!currentUser) return;
    
    await updateUser({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      location_lat: profile.location.lat,
      location_lng: profile.location.lng,
      location_name: profile.locationName
    });
  };

  const handleLogout = async () => {
    setUserRole(null);
    setCurrentUser(null);
    await signOut();
    setCurrentView('landing');
  };

  // Convert DatabaseUser to UserProfile format for components (excluding password for security)
  const userProfile: Omit<UserProfile, 'password'> | null = currentUser ? {
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email || '',
    location: {
      lat: currentUser.location_lat,
      lng: currentUser.location_lng
    },
    locationName: currentUser.location_name
  } : null;

  return (
    <>
      <Toaster position="top-right" richColors />
      {currentView === 'authCallback' && (
        <AuthCallback 
          onSuccess={handleAuthCallbackSuccess}
          onError={handleAuthCallbackError}
        />
      )}
      {currentView === 'landing' && (
        <Landing onGetStarted={handleGetStarted} />
      )}
      {currentView === 'auth' && (
        <Auth 
          onBack={() => setCurrentView('landing')}
          onSuccess={handleAuthSuccess}
          onNeedProfile={handleAuthNeedProfile}
        />
      )}
      {currentView === 'account' && currentUser && (
        <Account 
          onBack={handleAccountBack}
          onSignOut={handleAccountSignOut}
          onContinue={handleAccountContinue}
          userEmail={currentUser.email || undefined}
          userName={currentUser.name}
        />
      )}
      {currentView === 'onboarding' && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onBack={() => setCurrentView('auth')}
          existingProfile={currentUser ? {
            name: currentUser.name !== 'New User' ? currentUser.name : '',
            phone: currentUser.phone,
            location: { lat: currentUser.location_lat, lng: currentUser.location_lng },
            locationName: currentUser.location_name
          } : undefined}
        />
      )}
      {currentView === 'roleSelect' && userProfile && (
        <RoleSelector 
          onSelectRole={handleSelectRole} 
          onBack={handleRoleSelectorBack}
        />
      )}
      {currentView === 'dashboard' && userRole && userProfile && currentUser && (
        <Dashboard
          userRole={userRole}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      )}
    </>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </AuthProvider>
  );
}