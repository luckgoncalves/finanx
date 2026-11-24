'use client';

import { useFinance } from '@/context/FinanceContext';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { SummaryCard } from '@/components/SummaryCard';
import { ViewerBanner } from '@/components/ViewerBanner';
import { DashboardSkeleton } from '@/components/Skeleton';
import { MONTHS } from '@/types/finance';
import Link from 'next/link';
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuth();
  const { state, getMonthlyData, getYearlyTotal, loading, isViewerMode } = useFinance();
  const { hideValues } = useUI();
  const { currentMonth, currentYear } = state;
  
  const monthlyData = getMonthlyData(currentMonth, currentYear);
  const yearlyData = getYearlyTotal(currentYear);

  // Get recent transactions (last 5)
  const recentTransactions = [...monthlyData.income, ...monthlyData.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <ViewerBanner />
      <PageHeader title={`Olá, ${(user?.name || '').split(' ')[0] || 'bem-vindo'}`} kicker="Finanx" />
      <header className="px-6 pt-4 pb-6">
        {/* Summary Cards */}
        <div className="grid gap-4">
          <SummaryCard
            title="Saldo do Mês"
            amount={monthlyData.balance}
            type="balance"
            subtitle={`${MONTHS[currentMonth - 1]} ${currentYear}`}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title="Entradas"
              amount={monthlyData.totalIncome}
              type="income"
              compact
            />
            <SummaryCard
              title="Despesas"
              amount={monthlyData.totalExpense}
              type="expense"
              compact
            />
          </div>
        </div>
      </header>

      {/* Quick Actions (ocultos em modo visualização) */}
      {!isViewerMode && (
      <section className="px-6 mb-6">
        <div className="flex gap-3">
          <Link
            href="/lancar?tipo=entrada"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Entrada
          </Link>
          <Link
            href="/lancar"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-500/20 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Despesa
          </Link>
        </div>
      </section>
      )}

      {/* Year Summary */}
      <section className="px-6 mb-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            Resumo {currentYear}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Entradas</p>
              <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {hideValues ? 'R$ •••••' : yearlyData.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Despesas</p>
              <p className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 font-mono">
                {hideValues ? 'R$ •••••' : yearlyData.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Saldo</p>
              <p className={`text-xs sm:text-sm font-semibold font-mono ${yearlyData.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {hideValues ? 'R$ •••••' : yearlyData.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Movimentações Recentes</h2>
          <Link
            href="/extrato?aba=historico"
            className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Ver todas
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => {
              const category = state.categories.find((c) => c.id === transaction.category);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: category ? `${category.color}15` : '#e5e5e5' }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: category?.color || '#737373' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-semibold font-mono text-sm sm:text-base flex-shrink-0 ${
                      transaction.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {hideValues ? 'R$ •••••' : (
                      <>
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhuma movimentação neste mês
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Comece adicionando uma entrada ou despesa
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
