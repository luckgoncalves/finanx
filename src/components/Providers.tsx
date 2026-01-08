'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { OnboardingProvider } from '@/context/OnboardingContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FinanceProvider>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
