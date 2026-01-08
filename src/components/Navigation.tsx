'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
  ArrowTrendingDownIcon as ArrowTrendingDownIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

const navItems = [
  { href: '/', label: 'Início', icon: HomeIcon, iconActive: HomeIconSolid },
  { href: '/entradas', label: 'Entradas', icon: ArrowTrendingUpIcon, iconActive: ArrowTrendingUpIconSolid },
  { href: '/despesas', label: 'Despesas', icon: ArrowTrendingDownIcon, iconActive: ArrowTrendingDownIconSolid },
  { href: '/relatorios', label: 'Relatórios', icon: ChartBarIcon, iconActive: ChartBarIconSolid },
];

export function Navigation() {
  const pathname = usePathname();

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:right-auto md:w-20 z-50">
      <div className="glass border-t md:border-t-0 md:border-r border-zinc-200 dark:border-zinc-800 md:h-screen">
        <div className="flex md:flex-col items-center justify-around md:justify-start md:pt-6 md:gap-2 h-16 md:h-full px-2 md:px-0">
          {/* Logo for desktop */}
          <div className="hidden md:flex items-center justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">F</span>
            </div>
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
                  md:w-14 md:h-14 group relative
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
                <span className="text-[10px] font-medium md:hidden">{item.label}</span>
                
                {/* Tooltip for desktop */}
                <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
