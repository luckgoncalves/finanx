'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ShareProvider } from '@/context/ShareContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { OnboardingProvider } from '@/context/OnboardingContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ShareProvider>
        <FinanceProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </FinanceProvider>
      </ShareProvider>
    </AuthProvider>
  );
}
