'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { useUI } from '@/context/UIContext';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCard } from '@/components/SummaryCard';
import { TransactionList } from '@/components/TransactionList';
import { TransactionForm } from '@/components/TransactionForm';
import { ViewerBanner } from '@/components/ViewerBanner';
import { DespesasPageSkeleton } from '@/components/Skeleton';
import {
  PlusIcon, CheckCircleIcon, ClockIcon, ChartBarIcon, ListBulletIcon,
  BarsArrowDownIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpTrayIcon,
  ExclamationTriangleIcon, CreditCardIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { Transaction, CreditCard } from '@/types/finance';
import { ImportModal } from '@/components/ImportModal';

export type ExpenseSortOption = 'date-desc' | 'date-asc' | 'paid-first' | 'pending-first';

export default function DespesasPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [categoryCardExpanded, setCategoryCardExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<ExpenseSortOption>('date-desc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const { state, getMonthlyData, loading, isViewerMode, togglePaid, refreshData } = useFinance();
  const { hideValues } = useUI();
  const [overdueExpanded, setOverdueExpanded] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingInvoice, setTogglingInvoice] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch('/api/credit-cards');
      const data = await res.json();
      setCreditCards(data.creditCards || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

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

  // Separar despesas com cartão das demais
  const regularExpenses = monthlyData.expenses.filter((t) => !t.creditCardId);
  const cardExpenses = monthlyData.expenses.filter((t) => t.creditCardId);

  // Consolidar por cartão: um item por cartão com o total do mês
  const cardInvoices = creditCards
    .map((card) => {
      const txns = cardExpenses.filter((t) => t.creditCardId === card.id);
      if (txns.length === 0) return null;
      const total = txns.reduce((s, t) => s + t.amount, 0);
      const paidAmount = txns.filter((t) => t.paid).reduce((s, t) => s + t.amount, 0);
      const allPaid = txns.every((t) => t.paid);
      return { card, txns, total, paidAmount, allPaid, count: txns.length };
    })
    .filter(Boolean) as {
      card: CreditCard;
      txns: Transaction[];
      total: number;
      paidAmount: number;
      allPaid: boolean;
      count: number;
    }[];

  // Também incluir faturas de cartões que não estão na lista (transações órfãs de cartão deletado)
  const orphanCardIds = [...new Set(cardExpenses.map((t) => t.creditCardId).filter(Boolean))]
    .filter((id) => !creditCards.find((c) => c.id === id)) as string[];
  const orphanInvoices = orphanCardIds.map((cardId) => {
    const txns = cardExpenses.filter((t) => t.creditCardId === cardId);
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const paidAmount = txns.filter((t) => t.paid).reduce((s, t) => s + t.amount, 0);
    const allPaid = txns.every((t) => t.paid);
    return {
      card: { id: cardId, name: 'Cartão removido', color: '#94a3b8', lastDigits: null, brand: null, isActive: false, createdAt: '' },
      txns, total, paidAmount, allPaid, count: txns.length,
    };
  });

  const allInvoices = [...cardInvoices, ...orphanInvoices];

  // Categorias: regular + uma entrada por fatura de cartão
  const syntheticExpenses = [
    ...regularExpenses,
    ...allInvoices.map((inv) => ({ amount: inv.total, category: `__card_${inv.card.id}` })),
  ];
  const syntheticCategories = [
    ...state.categories,
    ...allInvoices.map((inv) => ({ id: `__card_${inv.card.id}`, name: inv.card.name, color: inv.card.color })),
  ];
  const categorySummary = getCategorySummary(syntheticExpenses, syntheticCategories);

  // Pendências de meses anteriores (apenas despesas sem cartão + faturas consolidadas)
  const overdueRegular = state.transactions.filter((t) => {
    if (t.type !== 'expense' || t.paid || t.creditCardId) return false;
    if (t.year < currentYear) return true;
    if (t.year === currentYear && t.month < currentMonth) return true;
    return false;
  }).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Faturas de cartão com saldo pendente de meses anteriores
  const overdueCardGroups = (() => {
    const cardTxns = state.transactions.filter((t) => {
      if (t.type !== 'expense' || t.paid || !t.creditCardId) return false;
      if (t.year < currentYear) return true;
      if (t.year === currentYear && t.month < currentMonth) return true;
      return false;
    });
    const groups: Record<string, { cardId: string; month: number; year: number; total: number }> = {};
    cardTxns.forEach((t) => {
      const key = `${t.creditCardId}_${t.year}_${t.month}`;
      if (!groups[key]) groups[key] = { cardId: t.creditCardId!, month: t.month, year: t.year, total: 0 };
      groups[key].total += t.amount;
    });
    return Object.values(groups);
  })();

  const overdueTotal =
    overdueRegular.reduce((s, t) => s + t.amount, 0) +
    overdueCardGroups.reduce((s, g) => s + g.total, 0);
  const overduePending = [...overdueRegular]; // só para compatibilidade de exibição

  const handleTogglePaid = async (id: string, paid: boolean) => {
    setTogglingId(id);
    try {
      await togglePaid(id, paid);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleInvoicePaid = async (
    creditCardId: string,
    month: number,
    year: number,
    paid: boolean
  ) => {
    const key = `${creditCardId}_${year}_${month}`;
    setTogglingInvoice(key);
    try {
      await fetch('/api/transactions/bulk-paid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditCardId, month, year, paid }),
      });
      await refreshData();
    } finally {
      setTogglingInvoice(null);
    }
  };

  const sortedRegular = (() => {
    const list = [...regularExpenses];
    const byDate = (a: Transaction, b: Transaction) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();
    const byDateAsc = (a: Transaction, b: Transaction) =>
      new Date(a.date).getTime() - new Date(b.date).getTime();
    switch (sortBy) {
      case 'date-desc': return list.sort(byDate);
      case 'date-asc': return list.sort(byDateAsc);
      case 'paid-first': return list.sort((a, b) => (a.paid !== b.paid ? (a.paid ? -1 : 1) : 0));
      case 'pending-first': return list.sort((a, b) => (a.paid !== b.paid ? (b.paid ? -1 : 1) : 0));
      default: return list.sort(byDate);
    }
  })();

  const hasHistory = sortedRegular.length > 0 || allInvoices.length > 0;

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
            <h1 className="text-2xl font-bold text-rose-600 dark:text-rose-400">Despesas</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isViewerMode && (
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Importar fatura"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            )}
            <MonthSelector />
          </div>
        </div>

        <SummaryCard
          title="Total de Despesas"
          amount={monthlyData.totalExpense}
          type="expense"
          subtitle={`${monthlyData.expenses.length} registro${monthlyData.expenses.length !== 1 ? 's' : ''}`}
        />

        {/* Paid vs Pending */}
        {monthlyData.expenses.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Pagas</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {hideValues ? 'R$ •••••' : monthlyData.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {monthlyData.expenses.filter((e) => e.paid).length} de {monthlyData.expenses.length}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Pendentes</span>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {hideValues ? 'R$ •••••' : monthlyData.totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {monthlyData.expenses.filter((e) => !e.paid).length} de {monthlyData.expenses.length}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Pendências de meses anteriores */}
      {(overduePending.length > 0 || overdueCardGroups.length > 0) && (
        <section className="px-6 mb-6">
          <button
            type="button"
            onClick={() => setOverdueExpanded((v) => !v)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-3"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {overduePending.length + overdueCardGroups.length} pendência{(overduePending.length + overdueCardGroups.length) !== 1 ? 's' : ''} de meses anteriores
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                  {hideValues ? 'R$ •••••' : overdueTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            {overdueExpanded
              ? <ChevronUpIcon className="w-4 h-4 text-amber-500" />
              : <ChevronDownIcon className="w-4 h-4 text-amber-500" />}
          </button>

          {overdueExpanded && (
            <div className="space-y-2">
              {/* Despesas regulares atrasadas */}
              {overduePending.map((t) => {
                const category = state.categories.find((c) => c.id === t.category);
                const isToggling = togglingId === t.id;
                const monthLabel = new Date(t.year, t.month - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30">
                    {!isViewerMode && (
                      <button
                        onClick={() => handleTogglePaid(t.id, true)}
                        disabled={isToggling}
                        className={`shrink-0 transition-all ${isToggling ? 'animate-pulse' : 'hover:scale-110'}`}
                        aria-label="Marcar como pago"
                      >
                        {isToggling
                          ? <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          : <CheckCircleIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400" />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                          {monthLabel}
                        </span>
                        {category && (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                            <span className="text-xs text-zinc-400">{category.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                      {hideValues ? 'R$ •••••' : t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                );
              })}

              {/* Faturas de cartão atrasadas */}
              {overdueCardGroups.map((g) => {
                const card = creditCards.find((c) => c.id === g.cardId);
                const monthLabel = new Date(g.year, g.month - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                const overdueKey = `${g.cardId}_${g.year}_${g.month}`;
                const isToggling = togglingInvoice === overdueKey;
                return (
                  <div
                    key={overdueKey}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30"
                  >
                    {!isViewerMode && (
                      <button
                        type="button"
                        onClick={() => handleToggleInvoicePaid(g.cardId, g.month, g.year, true)}
                        disabled={isToggling}
                        className={`shrink-0 transition-all ${isToggling ? 'animate-pulse' : 'hover:scale-110'}`}
                        aria-label="Marcar fatura como paga"
                      >
                        {isToggling ? (
                          <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircleIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push('/cartoes')}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (card?.color ?? '#94a3b8') + '20' }}
                      >
                        <CreditCardIcon className="w-4 h-4" style={{ color: card?.color ?? '#94a3b8' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Fatura {card?.name ?? 'Cartão'}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                          {monthLabel}
                        </span>
                      </div>
                      <p className="text-sm font-mono font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                        {hideValues ? 'R$ •••••' : g.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <ChevronRightIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Categories Dashboard */}
      {monthlyData.expenses.length > 0 && (
        <section className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Por Categoria</h2>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'dashboard' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                aria-label="Visualização dashboard"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                aria-label="Visualização lista"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'dashboard' ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-800" />
                    {categorySummary.reduce((acc, cat) => {
                      const circumference = 2 * Math.PI * 70;
                      const offset = acc.offset;
                      const length = (cat.percentage / 100) * circumference;
                      acc.elements.push(
                        <circle
                          key={cat.id}
                          cx="80" cy="80" r="70"
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
                    <span className="text-2xl font-bold">{categorySummary.length}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">categorias</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCategoryCardExpanded((e) => !e)}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-expanded={categoryCardExpanded}
              >
                {categoryCardExpanded ? (
                  <><ChevronUpIcon className="w-4 h-4" />Recolher</>
                ) : (
                  <><ChevronDownIcon className="w-4 h-4" />Ver detalhes por categoria</>
                )}
              </button>

              {categoryCardExpanded && (
                <div className="space-y-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {categorySummary.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
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
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categorySummary.map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                  </div>
                  <p className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                    {cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{cat.percentage.toFixed(0)}% do total</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Transaction List */}
      <section className="px-6 pb-24">
        <h2 className="text-lg font-semibold mb-4">Histórico</h2>

        {/* Faturas de Cartão consolidadas */}
        {allInvoices.length > 0 && (
          <div className="space-y-2 mb-4">
            {allInvoices.map((inv) => {
              const invoiceKey = `${inv.card.id}_${currentYear}_${currentMonth}`;
              const isToggling = togglingInvoice === invoiceKey;
              return (
                <div
                  key={inv.card.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark"
                >
                  {/* Botão de pagar fatura */}
                  {!isViewerMode && (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleInvoicePaid(
                          inv.card.id,
                          currentMonth,
                          currentYear,
                          !inv.allPaid
                        )
                      }
                      disabled={isToggling}
                      className={`shrink-0 transition-all ${isToggling ? 'animate-pulse' : 'hover:scale-110'}`}
                      aria-label={inv.allPaid ? 'Marcar fatura como pendente' : 'Marcar fatura como paga'}
                    >
                      {isToggling ? (
                        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      ) : inv.allPaid ? (
                        <CheckCircleSolid className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <CheckCircleIcon className="w-7 h-7 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400" />
                      )}
                    </button>
                  )}

                  {/* Área clicável para ir ao detalhe do cartão */}
                  <button
                    type="button"
                    onClick={() => router.push('/cartoes')}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: inv.card.color + '20' }}
                    >
                      <CreditCardIcon className="w-5 h-5" style={{ color: inv.card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${inv.allPaid ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        Fatura {inv.card.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-zinc-400">{inv.count} transaç{inv.count !== 1 ? 'ões' : 'ão'}</span>
                        {inv.allPaid ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            Paga
                          </span>
                        ) : inv.paidAmount > 0 ? (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            Parcial
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-mono font-semibold ${inv.allPaid ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-rose-600 dark:text-rose-400'}`}>
                        {inv.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      {inv.paidAmount > 0 && !inv.allPaid && (
                        <p className="text-xs text-zinc-400 font-mono">
                          {inv.paidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} pago
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Despesas regulares */}
        <TransactionList
          transactions={sortedRegular}
          type="expense"
          groupByDate={sortBy === 'date-desc' || sortBy === 'date-asc'}
          toolbarExtra={
            hasHistory ? (
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
                    {(['date-desc', 'date-asc', 'paid-first', 'pending-first'] as ExpenseSortOption[]).map((opt, i, arr) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setSortBy(opt); setSortMenuOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          i === 0 ? 'rounded-t-xl' : ''
                        } ${i === arr.length - 1 ? 'rounded-b-xl' : ''} ${
                          sortBy === opt
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {{ 'date-desc': 'Data (mais recente)', 'date-asc': 'Data (mais antiga)', 'paid-first': 'Pagos primeiro', 'pending-first': 'Pendentes primeiro' }[opt]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          }
        />
      </section>

      {/* FAB */}
      {!isViewerMode && (
        <>
          <button
            onClick={() => setShowForm(true)}
            className="fixed right-6 bottom-24 md:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
            aria-label="Adicionar despesa"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
          {showForm && <TransactionForm type="expense" onClose={() => setShowForm(false)} />}
          {showImport && (
            <ImportModal onClose={async () => { setShowImport(false); await fetchCards(); }} />
          )}
        </>
      )}
    </div>
  );
}

function getCategorySummary(
  transactions: { amount: number; category: string }[],
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
