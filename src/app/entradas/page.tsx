'use client';

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionForm } from '@/components/TransactionForm';
import { EntradasPageSkeleton } from '@/components/Skeleton';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function EntradasPage() {
  const [showForm, setShowForm] = useState(false);
  const { state, getMonthlyData, loading } = useFinance();
  const { currentMonth, currentYear } = state;
  
  const monthlyData = getMonthlyData(currentMonth, currentYear);

  if (loading) {
    return <EntradasPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerenciar</p>
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              Entradas
            </h1>
          </div>
          <MonthSelector />
        </div>

        <SummaryCard
          title="Total de Entradas"
          amount={monthlyData.totalIncome}
          type="income"
          subtitle={`${monthlyData.income.length} registro${monthlyData.income.length !== 1 ? 's' : ''}`}
        />
      </header>

      {/* Transaction List */}
      <section className="px-6 pb-24">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>
        <TransactionList
          transactions={monthlyData.income}
          type="income"
        />
      </section>

      {/* FAB - Add Button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
        aria-label="Adicionar entrada"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {/* Form Modal */}
      {showForm && (
        <TransactionForm
          type="income"
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

