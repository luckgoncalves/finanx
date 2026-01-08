'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Onboarding } from '@/components/Onboarding';

interface OnboardingContextType {
  showOnboarding: () => void;
  isOnboardingVisible: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const isDatabaseConfigured = !!process.env.NEXT_PUBLIC_DATABASE_ENABLED;

  // Check onboarding status when user logs in
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isDatabaseConfigured || !user || hasChecked) return;

      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          if (!data.onboardingCompleted) {
            setIsOnboardingVisible(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setHasChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [user, isDatabaseConfigured, hasChecked]);

  // Reset check when user changes
  useEffect(() => {
    setHasChecked(false);
  }, [user?.email]);

  const handleComplete = useCallback(async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
    setIsOnboardingVisible(false);
  }, []);

  const handleSkip = useCallback(async () => {
    try {
      await fetch('/api/user/onboarding', { method: 'POST' });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
    setIsOnboardingVisible(false);
  }, []);

  const showOnboarding = useCallback(() => {
    setIsOnboardingVisible(true);
  }, []);

  return (
    <OnboardingContext.Provider value={{ showOnboarding, isOnboardingVisible }}>
      {children}
      {isOnboardingVisible && (
        <Onboarding onComplete={handleComplete} onSkip={handleSkip} />
      )}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

