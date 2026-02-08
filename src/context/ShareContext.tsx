'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

const VIEW_AS_KEY = 'finanx-view-as';

export interface SharedAccountAsViewer {
  id: string;
  ownerId: string;
  owner: { id: string; email: string; name: string | null } | null;
}

interface ShareContextType {
  viewAsOwnerId: string | null;
  setViewAs: (ownerId: string | null) => void;
  sharedAccountsAsViewer: SharedAccountAsViewer[];
  loadShares: () => Promise<void>;
  isViewerMode: boolean;
  loading: boolean;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewAsOwnerId, setViewAsOwnerIdState] = useState<string | null>(null);
  const [sharedAccountsAsViewer, setSharedAccountsAsViewer] = useState<
    SharedAccountAsViewer[]
  >([]);
  const [loading, setLoading] = useState(true);

  const setViewAs = useCallback((ownerId: string | null) => {
    setViewAsOwnerIdState(ownerId);
    if (typeof window !== 'undefined') {
      if (ownerId) localStorage.setItem(VIEW_AS_KEY, ownerId);
      else localStorage.removeItem(VIEW_AS_KEY);
    }
  }, []);

  const loadShares = useCallback(async () => {
    if (!user) {
      setSharedAccountsAsViewer([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/shares');
      const data = await res.json();
      if (res.ok && data.asViewer) {
        setSharedAccountsAsViewer(data.asViewer);
      } else {
        setSharedAccountsAsViewer([]);
      }
    } catch {
      setSharedAccountsAsViewer([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setViewAsOwnerIdState(null);
      setSharedAccountsAsViewer([]);
      setLoading(false);
      return;
    }
    loadShares();
  }, [user, loadShares]);

  // Restore viewAs from localStorage after we have shared accounts
  useEffect(() => {
    if (!user || loading) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(VIEW_AS_KEY) : null;
    if (stored && sharedAccountsAsViewer.some((a) => a.ownerId === stored)) {
      setViewAsOwnerIdState(stored);
    } else if (stored) {
      localStorage.removeItem(VIEW_AS_KEY);
    }
  }, [user, loading, sharedAccountsAsViewer]);

  const isViewerMode = viewAsOwnerId != null;

  return (
    <ShareContext.Provider
      value={{
        viewAsOwnerId,
        setViewAs,
        sharedAccountsAsViewer,
        loadShares,
        isViewerMode,
        loading,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (context === undefined) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}
