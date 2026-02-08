'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ShareProvider } from '@/context/ShareContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { RegisterServiceWorker } from './RegisterServiceWorker';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ShareProvider>
        <FinanceProvider>
          <OnboardingProvider>
            <RegisterServiceWorker />
            {children}
          </OnboardingProvider>
        </FinanceProvider>
      </ShareProvider>
    </AuthProvider>
  );
}
