'use client';

import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { useAuth } from '@/context/AuthContext';

export function AppShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pl-20">
      <main className="flex-1">
        {children}
      </main>
      <Navigation />
    </div>
  );
}

