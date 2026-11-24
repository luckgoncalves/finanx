'use client';

import { ChevronLeftIcon, ChevronRightIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { MONTHS } from '@/types/finance';

/** Seletor de mês compacto: pílula "‹ Dezembro 2026 ›" + botão de fechar mês. */
export function MonthSelector({ className = '' }: { className?: string }) {
  const { state, setMonth, isMonthClosed, toggleMonthClosed, isViewerMode } = useFinance();
  const { currentMonth, currentYear } = state;
  const closed = isMonthClosed(currentMonth, currentYear);

  const go = (delta: number) => {
    const d = new Date(currentYear, currentMonth - 1 + delta, 1);
    setMonth(d.getMonth() + 1, d.getFullYear());
  };
  const now = new Date();
  const isCurrent = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0 flex items-center justify-between h-11 rounded-full bg-white/70 border border-zinc-200">
        <button onClick={() => go(-1)} aria-label="Mês anterior" className="w-11 h-11 flex items-center justify-center text-zinc-950 shrink-0">
          <ChevronLeftIcon className="w-[18px] h-[18px]" strokeWidth={2.2} />
        </button>
        <button
          onClick={() => setMonth(now.getMonth() + 1, now.getFullYear())}
          disabled={isCurrent}
          title={isCurrent ? undefined : 'Voltar ao mês atual'}
          className="min-w-0 truncate text-[15px] font-semibold text-zinc-950"
        >
          {MONTHS[currentMonth - 1]} <span className="font-medium text-zinc-800">{currentYear}</span>
        </button>
        <button onClick={() => go(1)} aria-label="Próximo mês" className="w-11 h-11 flex items-center justify-center text-zinc-950 shrink-0">
          <ChevronRightIcon className="w-[18px] h-[18px]" strokeWidth={2.2} />
        </button>
      </div>
      {!isViewerMode && (
        <button
          onClick={() => toggleMonthClosed(currentMonth, currentYear)}
          aria-label={closed ? 'Reabrir mês' : 'Fechar mês'}
          aria-pressed={closed}
          title={closed ? 'Mês fechado — tocar para reabrir' : 'Fechar mês'}
          className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
            closed ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white/70 border-zinc-200 text-zinc-800'
          }`}
        >
          {closed ? <LockClosedIcon className="w-[18px] h-[18px]" /> : <LockOpenIcon className="w-[18px] h-[18px]" />}
        </button>
      )}
    </div>
  );
}
