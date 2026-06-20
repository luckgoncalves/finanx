'use client';

import { ChevronLeftIcon, ChevronRightIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { MONTHS } from '@/types/finance';

export function MonthSelector() {
  const { state, setMonth, isMonthClosed, toggleMonthClosed } = useFinance();
  const { currentMonth, currentYear } = state;

  const closed = isMonthClosed(currentMonth, currentYear);

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
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
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
            {closed && (
              <LockClosedIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            )}
          </div>
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

      <button
        onClick={() => toggleMonthClosed(currentMonth, currentYear)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
          closed
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        title={closed ? 'Reabrir mês' : 'Fechar mês'}
      >
        {closed ? (
          <>
            <LockClosedIcon className="w-3.5 h-3.5" />
            Mês fechado — reabrir
          </>
        ) : (
          <>
            <LockOpenIcon className="w-3.5 h-3.5" />
            Fechar mês
          </>
        )}
      </button>
    </div>
  );
}
