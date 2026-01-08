'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FinanceProvider } from '@/context/FinanceContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FinanceProvider>
        {children}
      </FinanceProvider>
    </AuthProvider>
  );
}

