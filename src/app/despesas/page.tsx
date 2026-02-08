'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionForm } from '@/components/TransactionForm';
import { ViewerBanner } from '@/components/ViewerBanner';
import { DespesasPageSkeleton } from '@/components/Skeleton';
import { PlusIcon, CheckCircleIcon, ClockIcon, ChartBarIcon, ListBulletIcon, BarsArrowDownIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Transaction } from '@/types/finance';

export type ExpenseSortOption = 'date-desc' | 'date-asc' | 'paid-first' | 'pending-first';

export default function DespesasPage() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [categoryCardExpanded, setCategoryCardExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<ExpenseSortOption>('date-desc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const { state, getMonthlyData, loading, isViewerMode } = useFinance();

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortMenuOpen]);
  const { currentMonth, currentYear } = state;
  
  const monthlyData = getMonthlyData(currentMonth, currentYear);
  const categorySummary = getCategorySummary(monthlyData.expenses, state.categories);

  const sortedExpenses = (() => {
    const list = [...monthlyData.expenses];
    const byDate = (a: Transaction, b: Transaction) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();
    const byDateAsc = (a: Transaction, b: Transaction) =>
      new Date(a.date).getTime() - new Date(b.date).getTime();
    switch (sortBy) {
      case 'date-desc':
        return list.sort(byDate);
      case 'date-asc':
        return list.sort(byDateAsc);
      case 'paid-first':
        return list.sort((a, b) => (a.paid !== b.paid ? (a.paid ? -1 : 1) : 0));
      case 'pending-first':
        return list.sort((a, b) => (a.paid !== b.paid ? (b.paid ? -1 : 1) : 0));
      default:
        return list.sort(byDate);
    }
  })();

  if (loading) {
    return <DespesasPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <ViewerBanner />
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

      {/* Categories Dashboard */}
      {monthlyData.expenses.length > 0 && (
        <section className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Por Categoria</h2>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-white dark:bg-zinc-700 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                aria-label="Visualização dashboard"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-700 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                aria-label="Visualização lista"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'dashboard' ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              {/* Gráfico – sempre visível */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    {categorySummary.reduce((acc, cat) => {
                      const circumference = 2 * Math.PI * 70;
                      const offset = acc.offset;
                      const length = (cat.percentage / 100) * circumference;
                      acc.elements.push(
                        <circle
                          key={cat.id}
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="12"
                          strokeDasharray={`${length} ${circumference - length}`}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                          style={{ opacity: 0.9 }}
                        />
                      );
                      acc.offset += length;
                      return acc;
                    }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">
                      {categorySummary.length}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      categorias
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão expandir / legendas (só ao clicar) */}
              <button
                type="button"
                onClick={() => setCategoryCardExpanded((e) => !e)}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-expanded={categoryCardExpanded}
              >
                {categoryCardExpanded ? (
                  <>
                    <ChevronUpIcon className="w-4 h-4" />
                    Recolher
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-4 h-4" />
                    Ver detalhes por categoria
                  </>
                )}
              </button>

              {categoryCardExpanded && (
                <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {categorySummary.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 w-10 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categorySummary.map((cat) => (
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
          )}
        </section>
      )}

      {/* Transaction List */}
      <section className="px-6 pb-24">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>
        <TransactionList
          transactions={sortedExpenses}
          type="expense"
          groupByDate={sortBy === 'date-desc' || sortBy === 'date-asc'}
          toolbarExtra={
            monthlyData.expenses.length > 0 ? (
              <div className="relative shrink-0" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((open) => !open)}
                  className="h-11 min-w-11 inline-flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Ordenar despesas"
                  aria-expanded={sortMenuOpen}
                  aria-haspopup="true"
                >
                  <BarsArrowDownIcon className="w-5 h-5" />
                </button>
                {sortMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 py-2 min-w-[200px] rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
                    <button
                      type="button"
                      onClick={() => { setSortBy('date-desc'); setSortMenuOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors rounded-t-xl ${
                        sortBy === 'date-desc'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Data (mais recente)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('date-asc'); setSortMenuOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                        sortBy === 'date-asc'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Data (mais antiga)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('paid-first'); setSortMenuOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                        sortBy === 'paid-first'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Pagos primeiro
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('pending-first'); setSortMenuOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors rounded-b-xl ${
                        sortBy === 'pending-first'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      Pendentes primeiro
                    </button>
                  </div>
                )}
              </div>
            ) : null
          }
        />
      </section>

      {/* FAB - Add Button (oculto em modo visualização) */}
      {!isViewerMode && (
        <>
          <button
            onClick={() => setShowForm(true)}
            className="fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
            aria-label="Adicionar despesa"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
          {showForm && (
            <TransactionForm
              type="expense"
              onClose={() => setShowForm(false)}
            />
          )}
        </>
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
