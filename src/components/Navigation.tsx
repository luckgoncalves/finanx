'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ListBulletIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CreditCardIcon as CreditCardIconSolid,
} from '@heroicons/react/24/solid';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { FinanXLogo } from './FinanXLogo';

export const navItems = [
  { href: '/', label: 'Início', icon: HomeIcon, iconActive: HomeIconSolid },
  { href: '/extrato', label: 'Extrato', icon: ListBulletIcon, iconActive: ListBulletIconSolid },
  { href: '/lancar', label: 'Lançar', icon: PlusCircleIcon, iconActive: PlusCircleIconSolid },
  { href: '/cartoes', label: 'Cartões', icon: CreditCardIcon, iconActive: CreditCardIconSolid },
  { href: '/relatorios', label: 'Relatórios', icon: ChartBarIcon, iconActive: ChartBarIconSolid },
];

export function Navigation() {
  const pathname = usePathname();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (pathname === '/login') return null;

  return (
    <>
      {/* ── Mobile: barra com bolha na aba ativa ── */}
      <MobileTabBar activeIndex={navItems.findIndex((i) => i.href === (['/despesas', '/entradas'].includes(pathname) ? '/extrato' : pathname))} />

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
                <div className="relative p-2 rounded-xl bg-purple-500/10 dark:bg-purple-400/10 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/20">
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

const SPRING = 'cubic-bezier(.34,1.3,.64,1)';
const NOTCH_PATH =
  'M0 0 H1440 C1454 0 1456 8 1460 18 C1467 36 1482 46 1500 46 C1518 46 1533 36 1540 18 C1544 8 1546 0 1560 0 H3000 V84 H0 Z';

function MobileTabBar({ activeIndex }: { activeIndex: number }) {
  const hasActive = activeIndex >= 0;
  const slot = (i: number) => `calc(${(i + 0.5) * (100 / navItems.length)}%`;
  const active = hasActive ? navItems[activeIndex] : null;
  const ActiveIcon = active?.iconActive;

  return (
    <nav className="md:hidden fixed left-3 right-3 bottom-[max(14px,env(safe-area-inset-bottom))] h-[84px] z-50 drop-shadow-[0_8px_20px_rgba(11,43,38,0.16)]">
      {/* fundo branco com recorte que acompanha a aba ativa */}
      <div className="absolute inset-0 rounded-[26px] overflow-hidden">
        {hasActive ? (
          <svg
            aria-hidden="true"
            width="3000"
            height="84"
            viewBox="0 0 3000 84"
            className="absolute top-0 max-w-none"
            style={{ left: `${slot(activeIndex)} - 1500px)`, transition: `left 560ms ${SPRING}` }}
          >
            <path d={NOTCH_PATH} fill="#FFFFFF" />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
      </div>

      {/* bolha */}
      {hasActive && ActiveIcon && (
        <span
          aria-hidden="true"
          className="absolute -top-7 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(11,43,38,0.18)]"
          style={{ left: `${slot(activeIndex)} - 32px)`, transition: `left 560ms ${SPRING}` }}
        >
          <span key={activeIndex} className="fx-pop w-12 h-12 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <ActiveIcon className="w-[26px] h-[26px]" />
          </span>
        </span>
      )}

      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative h-[84px] ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-4 flex justify-center"
                style={{
                  opacity: isActive ? 0 : 1,
                  transform: isActive ? 'translateY(-18px) scale(0.6)' : 'none',
                  transition: 'opacity 220ms ease, transform 420ms cubic-bezier(.34,1.56,.64,1)',
                }}
              >
                <Icon className="w-6 h-6" />
              </span>
              <span
                className={`absolute inset-x-0 top-[50px] text-center whitespace-nowrap transition-all duration-200 ${
                  isActive ? 'text-[12px] font-bold' : 'text-[11px] font-medium'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
