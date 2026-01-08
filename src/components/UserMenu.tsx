'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CloudIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if database is configured
  const isDatabaseConfigured = !!process.env.NEXT_PUBLIC_DATABASE_ENABLED;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
    );
  }

  if (!isDatabaseConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400">
        <CloudIcon className="w-4 h-4" />
        <span className="hidden md:inline">Modo Local</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
      >
        <UserCircleIcon className="w-5 h-5" />
        Entrar
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-scale-in">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <p className="font-medium truncate">
              {user.name || 'Usuário'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ServerIcon className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Conectado ao banco
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-rose-600 dark:text-rose-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
