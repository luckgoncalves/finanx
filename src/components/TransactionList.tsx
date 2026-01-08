'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionType } from '@/types/finance';
import { TransactionForm } from './TransactionForm';

interface TransactionListProps {
  transactions: Transaction[];
  type: TransactionType;
  showCategory?: boolean;
}

export function TransactionList({ transactions, type, showCategory = true }: TransactionListProps) {
  const { state, deleteTransaction, togglePaid } = useFinance();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getCategoryInfo = (categoryId: string) => {
    return state.categories.find((c) => c.id === categoryId);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      deleteTransaction(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleTogglePaid = async (transaction: Transaction) => {
    setTogglingId(transaction.id);
    await togglePaid(transaction.id, !transaction.paid);
    setTogglingId(null);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <span className="text-3xl">
            {type === 'income' ? '💰' : '📝'}
          </span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Nenhuma {type === 'income' ? 'entrada' : 'despesa'} registrada
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Toque no botão + para adicionar
        </p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <div className="space-y-2">
              {groupedTransactions[date].map((transaction) => {
                const category = getCategoryInfo(transaction.category);
                const isPaid = transaction.paid;
                const isToggling = togglingId === transaction.id;
                
                return (
                  <div
                    key={transaction.id}
                    className={`group flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark hover:scale-[1.01] transition-all ${
                      isPaid ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox para marcar como pago (apenas despesas) */}
                    {type === 'expense' && (
                      <button
                        onClick={() => handleTogglePaid(transaction)}
                        disabled={isToggling}
                        className={`flex-shrink-0 transition-all ${
                          isToggling ? 'opacity-50' : 'hover:scale-110'
                        }`}
                        aria-label={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                      >
                        {isPaid ? (
                          <CheckCircleSolid className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <CheckCircleIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400" />
                        )}
                      </button>
                    )}

                    {showCategory && category && (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isPaid ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {showCategory && category && (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {category.name}
                          </span>
                        )}
                        {isPaid && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Pago
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold font-mono text-sm sm:text-base flex-shrink-0 ${
                          type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isPaid 
                              ? 'text-zinc-400 dark:text-zinc-500 line-through'
                              : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          aria-label="Editar"
                        >
                          <PencilIcon className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            deletingId === transaction.id
                              ? 'bg-rose-100 dark:bg-rose-900/30'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          aria-label={deletingId === transaction.id ? 'Confirmar exclusão' : 'Excluir'}
                        >
                          <TrashIcon
                            className={`w-4 h-4 ${
                              deletingId === transaction.id
                                ? 'text-rose-500'
                                : 'text-zinc-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editingTransaction && (
        <TransactionForm
          type={type}
          onClose={() => setEditingTransaction(null)}
          editTransaction={editingTransaction}
        />
      )}
    </>
  );
}
