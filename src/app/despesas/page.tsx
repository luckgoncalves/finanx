'use client';

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionForm } from '@/components/TransactionForm';
import { PlusIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function DespesasPage() {
  const [showForm, setShowForm] = useState(false);
  const { state, getMonthlyData } = useFinance();
  const { currentMonth, currentYear } = state;
  
  const monthlyData = getMonthlyData(currentMonth, currentYear);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerenciar</p>
            <h1 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              Despesas
            </h1>
          </div>
          <MonthSelector />
        </div>

        <SummaryCard
          title="Total de Despesas"
          amount={monthlyData.totalExpense}
          type="expense"
          subtitle={`${monthlyData.expenses.length} registro${monthlyData.expenses.length !== 1 ? 's' : ''}`}
        />

        {/* Paid vs Pending Summary */}
        {monthlyData.expenses.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Pagas</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {monthlyData.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {monthlyData.expenses.filter(e => e.paid).length} de {monthlyData.expenses.length}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Pendentes</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {monthlyData.totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {monthlyData.expenses.filter(e => !e.paid).length} de {monthlyData.expenses.length}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Categories Summary */}
      {monthlyData.expenses.length > 0 && (
        <section className="px-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Por Categoria</h2>
          <div className="grid grid-cols-2 gap-3">
            {getCategorySummary(monthlyData.expenses, state.categories).map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium truncate">{cat.name}</span>
                </div>
                <p className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                  {cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {cat.percentage.toFixed(0)}% do total
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction List */}
      <section className="px-6 pb-24">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>
        <TransactionList
          transactions={monthlyData.expenses}
          type="expense"
        />
      </section>

      {/* FAB - Add Button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        aria-label="Adicionar despesa"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {/* Form Modal */}
      {showForm && (
        <TransactionForm
          type="expense"
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// Helper function to get category summary
function getCategorySummary(
  transactions: { amount: number; category: string; paid?: boolean }[],
  categories: { id: string; name: string; color: string }[]
) {
  const totals: Record<string, number> = {};
  const grandTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  transactions.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  return Object.entries(totals)
    .map(([categoryId, total]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'Outros',
        color: category?.color || '#64748b',
        total,
        percentage: (total / grandTotal) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);
}
