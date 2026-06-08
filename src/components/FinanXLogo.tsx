'use client';

interface FinanXLogoProps {
  variant?: 'icon' | 'full';
  size?: number;
  className?: string;
}

function FinanXIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="finanX">
      {/* Outer background */}
      <rect width="120" height="120" rx="24" className="fill-emerald-500 dark:fill-emerald-950" />

      {/* Card body */}
      <rect x="18" y="30" width="84" height="58" rx="7" className="fill-emerald-50 dark:fill-emerald-900" />
      {/* Card header strip */}
      <rect x="18" y="30" width="84" height="18" rx="7" className="fill-emerald-100 dark:fill-emerald-800" />
      {/* Card top accent */}
      <rect x="18" y="30" width="84" height="8" rx="4" className="fill-emerald-200 dark:fill-emerald-700" />

      {/* Chip */}
      <rect x="74" y="52" width="36" height="24" rx="6" strokeWidth="1.5" className="fill-emerald-500 dark:fill-emerald-400 stroke-emerald-50 dark:stroke-emerald-950" />
      {/* Chip circle */}
      <circle cx="92" cy="64" r="5" className="fill-emerald-50 dark:fill-emerald-950" />

      {/* Card lines */}
      <rect x="26" y="72" width="28" height="4" rx="2" className="fill-emerald-300" />
      <rect x="26" y="80" width="18" height="4" rx="2" className="fill-emerald-200 dark:fill-emerald-400" />
    </svg>
  );
}

export function FinanXLogo({ variant = 'icon', size = 56, className }: FinanXLogoProps) {
  if (variant === 'icon') {
    return (
      <div className={className}>
        <FinanXIcon size={size} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4${className ? ` ${className}` : ''}`}>
      <FinanXIcon size={size} />
      <div className="text-center">
        <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          finan<span className="text-emerald-500 dark:text-emerald-400">X</span>
        </div>
        <div className="text-xs tracking-[3px] uppercase text-zinc-500 dark:text-zinc-400 mt-1">
          Gestão Financeira
        </div>
      </div>
    </div>
  );
}
