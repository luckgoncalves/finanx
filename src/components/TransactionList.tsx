'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionType } from '@/types/finance';
import { TransactionForm } from './TransactionForm';

interface TransactionListProps {
  transactions: Transaction[];
  type: TransactionType;
  showCategory?: boolean;
}

export function TransactionList({ transactions, type, showCategory = true }: TransactionListProps) {
  const { state, deleteTransaction } = useFinance();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
                
                return (
                  <div
                    key={transaction.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark hover:scale-[1.01] transition-transform"
                  >
                    {showCategory && category && (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      {showCategory && category && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {category.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold font-mono ${
                          type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
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

