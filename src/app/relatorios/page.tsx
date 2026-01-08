'use client';

import { useFinance } from '@/context/FinanceContext';
import { MonthSelector } from '@/components/MonthSelector';
import { MONTHS } from '@/types/finance';

export default function RelatoriosPage() {
  const { state, getMonthlyData, getYearlyTotal } = useFinance();
  const { currentYear } = state;
  
  const yearlyData = getYearlyTotal(currentYear);

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

  // Calculate category breakdown for the year
  const yearTransactions = state.transactions.filter((t) => t.year === currentYear);
  const expensesByCategory = yearTransactions
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
        percentage: yearlyData.totalExpense > 0 
          ? (total / yearlyData.totalExpense) * 100 
          : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen">
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

      {/* Year Overview */}
      <section className="px-6 mb-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
          <h2 className="text-lg font-semibold mb-4">Resumo {currentYear}</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Entradas</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {yearlyData.totalIncome.toLocaleString('pt-BR', { 
                  notation: 'compact',
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Despesas</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
                {yearlyData.totalExpense.toLocaleString('pt-BR', { 
                  notation: 'compact',
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Saldo</p>
              <p className={`text-lg font-bold font-mono ${
                yearlyData.balance >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {yearlyData.balance.toLocaleString('pt-BR', { 
                  notation: 'compact',
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
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
          <h2 className="text-lg font-semibold mb-4">Despesas por Categoria</h2>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                    {cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{ 
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 text-right">
                  {cat.percentage.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {yearTransactions.length === 0 && (
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

