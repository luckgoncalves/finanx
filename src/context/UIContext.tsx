'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { isDemoMode } from '@/lib/demo';

interface UIContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [hideValues, setHideValues] = useState(() => isDemoMode() ? false : true);

  const toggleHideValues = () => setHideValues((prev) => !prev);

  return (
    <UIContext.Provider value={{ hideValues, toggleHideValues }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
