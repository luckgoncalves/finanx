'use client';

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useUI } from '@/context/UIContext';
import { MonthSelector } from '@/components/MonthSelector';
import { ViewerBanner } from '@/components/ViewerBanner';
import { MONTHS } from '@/types/finance';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function RelatoriosPage() {
  const { state, getMonthlyData, getYearlyTotal } = useFinance();
  const { hideValues } = useUI();
  const { currentMonth, currentYear } = state;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const monthlyData = getMonthlyData(currentMonth, currentYear);
  const yearlyData = getYearlyTotal(currentYear);

  const incomePercent = yearlyData.totalIncome > 0
    ? (monthlyData.totalIncome / yearlyData.totalIncome) * 100
    : 0;
  const expensePercent = yearlyData.totalExpense > 0
    ? (monthlyData.totalExpense / yearlyData.totalExpense) * 100
    : 0;

  // Calculate monthly data for chart
  const monthlyStats = MONTHS.map((_, index) => {
    const data = getMonthlyData(index + 1, currentYear);
    return {
      month: index + 1,
      monthName: MONTHS[index].slice(0, 3),
      income: data.totalIncome,
      expense: data.totalExpense,
      balance: data.balance,
    };
  });

  // Find max value for chart scaling
  const maxValue = Math.max(
    ...monthlyStats.map((m) => Math.max(m.income, m.expense)),
    1
  );

  // Category breakdown for selected month
  const monthTransactions = state.transactions.filter(
    (t) => t.month === currentMonth && t.year === currentYear
  );

  const expensesByCategory = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([categoryId, total]) => {
      const category = state.categories.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'Outros',
        color: category?.color || '#64748b',
        total,
        percentage: monthlyData.totalExpense > 0
          ? (total / monthlyData.totalExpense) * 100
          : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen">
      <ViewerBanner />
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Análise</p>
            <h1 className="text-2xl font-bold">Relatórios</h1>
          </div>
          <MonthSelector />
        </div>
      </header>

      {/* Month Overview */}
      <section className="px-6 mb-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
          <h2 className="text-lg font-semibold mb-4">
            {MONTHS[currentMonth - 1]} {currentYear}
          </h2>

          <div className="space-y-3 mb-6">
            {/* Entradas */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Entradas</p>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {hideValues ? 'R$ •••••' : monthlyData.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {!hideValues && yearlyData.totalIncome > 0 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {incomePercent.toFixed(0)}% do total anual
                  </p>
                )}
              </div>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            {/* Despesas */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Despesas</p>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {hideValues ? 'R$ •••••' : monthlyData.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {!hideValues && yearlyData.totalExpense > 0 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {expensePercent.toFixed(0)}% do total anual
                  </p>
                )}
              </div>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            {/* Saldo */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Saldo do mês</p>
              <div className="text-right">
                <p className={`text-sm font-bold font-mono ${
                  monthlyData.balance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {hideValues ? 'R$ •••••' : monthlyData.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {!hideValues && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    acumulado {currentYear}: {yearlyData.balance.toLocaleString('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Evolução Mensal
            </p>
            <div className="flex items-end gap-1 h-32">
              {monthlyStats.map((stat) => {
                const incomeHeight = (stat.income / maxValue) * 100;
                const expenseHeight = (stat.expense / maxValue) * 100;
                const isCurrentMonth = stat.month === state.currentMonth;
                
                return (
                  <div
                    key={stat.month}
                    className={`flex-1 flex flex-col items-center gap-1 ${
                      isCurrentMonth ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <div className="w-full flex gap-0.5 items-end h-24">
                      <div
                        className="flex-1 bg-emerald-500 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                      />
                      <div
                        className="flex-1 bg-rose-500 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] ${
                      isCurrentMonth 
                        ? 'font-bold text-emerald-600 dark:text-emerald-400' 
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {stat.monthName}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Despesas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="px-6 pb-24">
          <h2 className="text-lg font-semibold mb-4">
            Despesas por Categoria · {MONTHS[currentMonth - 1]}
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const isOpen = expandedCategory === cat.id;
              const catTransactions = monthTransactions
                .filter((t) => t.type === 'expense' && t.category === cat.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return (
                <div
                  key={cat.id}
                  className="rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-semibold font-mono text-rose-600 dark:text-rose-400 text-sm">
                          {hideValues ? 'R$ •••••' : cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <ChevronDownIcon
                          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 text-right">
                      {catTransactions.length} transaç{catTransactions.length !== 1 ? 'ões' : 'ão'} · {cat.percentage.toFixed(1)}%
                    </p>
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800">
                      {catTransactions.map((t, i) => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between px-4 py-3 gap-3 ${
                            i < catTransactions.length - 1
                              ? 'border-b border-zinc-100 dark:border-zinc-800'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                              {t.installmentNumber && t.totalInstallments
                                ? ` · ${t.installmentNumber}/${t.totalInstallments}x`
                                : ''}
                            </p>
                          </div>
                          <span className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                            {hideValues
                              ? 'R$ •••••'
                              : t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {monthTransactions.length === 0 && categoryBreakdown.length === 0 && (
        <section className="px-6 pb-24">
          <div className="text-center py-12 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl">📈</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              Sem dados para exibir
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Adicione transações para ver os relatórios
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

