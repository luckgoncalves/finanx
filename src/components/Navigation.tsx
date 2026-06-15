'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
  ArrowTrendingDownIcon as ArrowTrendingDownIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CreditCardIcon as CreditCardIconSolid,
} from '@heroicons/react/24/solid';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { FinanXLogo } from './FinanXLogo';

const navItems = [
  { href: '/', label: 'Início', icon: HomeIcon, iconActive: HomeIconSolid },
  { href: '/entradas', label: 'Entradas', icon: ArrowTrendingUpIcon, iconActive: ArrowTrendingUpIconSolid },
  { href: '/despesas', label: 'Despesas', icon: ArrowTrendingDownIcon, iconActive: ArrowTrendingDownIconSolid },
  { href: '/cartoes', label: 'Cartões', icon: CreditCardIcon, iconActive: CreditCardIconSolid },
  { href: '/relatorios', label: 'Relatórios', icon: ChartBarIcon, iconActive: ChartBarIconSolid },
];

export function Navigation() {
  const pathname = usePathname();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (pathname === '/login') return null;

  return (
    <>
      {/* ── Mobile: floating liquid-glass pill ── */}
      <nav className="md:hidden fixed bottom-5 left-0 right-0 flex justify-center px-4 z-50">
        <div className="flex items-center gap-1 px-2 py-2 rounded-full
                        bg-zinc-900/75 dark:bg-black/70
                        backdrop-blur-2xl
                        border border-white/10
                        shadow-2xl shadow-black/40">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.iconActive : item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-90"
              >
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/20'
                    : 'hover:bg-white/5'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-zinc-400'
                  }`} />
                </div>
                <span className={`text-[9px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-emerald-400' : 'text-zinc-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-90"
            >
              <div className="p-2 rounded-full bg-purple-500/20">
                <ArrowDownTrayIcon className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium text-purple-400">Instalar</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Desktop: left sidebar (unchanged) ── */}
      <nav className="hidden md:block fixed top-0 left-0 bottom-0 w-20 z-50">
        <div className="glass border-r border-zinc-200 dark:border-zinc-800 h-screen">
          <div className="flex flex-col items-center justify-start pt-6 gap-2 h-full">
            <div className="flex items-center justify-center mb-6">
              <FinanXLogo variant="icon" size={40} />
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.iconActive : item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200
                    w-14 h-14 group relative
                    ${isActive
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }
                  `}
                >
                  <div className={`
                    relative p-2 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-emerald-500/10 dark:bg-emerald-400/10'
                      : 'group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800'
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    )}
                  </div>

                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                </Link>
              );
            })}

            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 w-14 h-14 group relative text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 mt-auto mb-6"
              >
                <div className="relative p-2 rounded-xl transition-all duration-200 bg-purple-500/10 dark:bg-purple-400/10 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/20">
                  <ArrowDownTrayIcon className="w-6 h-6" />
                </div>
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Instalar App
                </div>
              </button>
            )}

            {isInstalled && (
              <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl w-14 h-14 group relative text-emerald-500 dark:text-emerald-400 mt-auto mb-6">
                <div className="relative p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  App Instalado
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
