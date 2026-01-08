'use client';

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  subtitle?: string;
  compact?: boolean;
}

export function SummaryCard({ title, amount, type, subtitle, compact = false }: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    // Para valores grandes, usa formato compacto em mobile
    if (absValue >= 10000) {
      return absValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return absValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStyles = () => {
    switch (type) {
      case 'income':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
          shadow: 'shadow-emerald-500/25',
          icon: ArrowTrendingUpIcon,
          iconBg: 'bg-white/20',
        };
      case 'expense':
        return {
          bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
          shadow: 'shadow-rose-500/25',
          icon: ArrowTrendingDownIcon,
          iconBg: 'bg-white/20',
        };
      case 'balance':
        return {
          bg: amount >= 0 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-br from-rose-500 to-orange-600',
          shadow: amount >= 0 ? 'shadow-emerald-500/25' : 'shadow-rose-500/25',
          icon: amount >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
          iconBg: 'bg-white/20',
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${compact ? 'p-4' : 'p-5'} ${styles.bg} shadow-xl ${styles.shadow} text-white`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white/80 truncate`}>{title}</p>
          <p className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-bold mt-1 font-mono truncate`}>
            {type === 'balance' && amount < 0 ? '-' : ''}
            {formatCurrency(amount)}
          </p>
          {subtitle && (
            <p className="text-xs text-white/60 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-xl ${styles.iconBg} flex-shrink-0`}>
          <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
    </div>
  );
}
