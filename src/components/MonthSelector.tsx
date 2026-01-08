'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { MONTHS } from '@/types/finance';

export function MonthSelector() {
  const { state, setMonth } = useFinance();
  const { currentMonth, currentYear } = state;

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setMonth(12, currentYear - 1);
    } else {
      setMonth(currentMonth - 1, currentYear);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setMonth(1, currentYear + 1);
    } else {
      setMonth(currentMonth + 1, currentYear);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1, now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={goToPreviousMonth}
        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center">
        <button
          onClick={goToCurrentMonth}
          className={`
            text-lg font-semibold transition-colors
            ${!isCurrentMonth() ? 'hover:text-emerald-500 dark:hover:text-emerald-400' : ''}
          `}
          title="Voltar ao mês atual"
        >
          {MONTHS[currentMonth - 1]}
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{currentYear}</span>
      </div>

      <button
        onClick={goToNextMonth}
        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

