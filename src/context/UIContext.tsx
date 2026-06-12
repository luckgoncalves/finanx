'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [hideValues, setHideValues] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('finanx-hide-values');
    return stored === null ? true : stored === 'true';
  });

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      localStorage.setItem('finanx-hide-values', String(next));
      return next;
    });
  };

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
