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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      try {
        await deleteTransaction(id);
      } finally {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleTogglePaid = async (transaction: Transaction) => {
    setTogglingId(transaction.id);
    try {
      await togglePaid(transaction.id, !transaction.paid);
    } finally {
      setTogglingId(null);
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

            <div className="space-y-3">
              {groupedTransactions[date].map((transaction) => {
                const category = getCategoryInfo(transaction.category);
                const isPaid = transaction.paid;
                const isToggling = togglingId === transaction.id;
                
                return (
                  <div
                    key={transaction.id}
                    className={`group p-4 rounded-2xl bg-white dark:bg-zinc-900 card-shadow dark:card-shadow-dark transition-all ${
                      isPaid ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox para marcar como pago (apenas despesas) */}
                      {type === 'expense' && (
                        <button
                          onClick={() => handleTogglePaid(transaction)}
                          disabled={isToggling}
                          className={`flex-shrink-0 mt-0.5 transition-all ${
                            isToggling ? 'animate-pulse' : 'hover:scale-110'
                          }`}
                          aria-label={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          {isToggling ? (
                            <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          ) : isPaid ? (
                            <CheckCircleSolid className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <CheckCircleIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400" />
                          )}
                        </button>
                      )}

                      {/* Conteúdo principal */}
                      <div className="flex-1">
                        {/* Descrição */}
                        <p className={`font-medium ${isPaid ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
                          {transaction.description}
                        </p>
                        
                        {/* Badge de parcelamento ou recorrente */}
                        {transaction.isInstallment && transaction.installmentNumber && transaction.totalInstallments && (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-1">
                            Parcela {transaction.installmentNumber}/{transaction.totalInstallments}
                          </span>
                        )}
                        {transaction.isRecurring && (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-1">
                            Recorrente
                          </span>
                        )}
                        
                        {/* Valor */}
                        <p
                          className={`font-semibold font-mono mt-1 ${
                            type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isPaid 
                                ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        
                        {/* Categoria */}
                        <div className="flex items-center gap-2 mt-2">
                          {showCategory && category && (
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                {category.name}
                              </span>
                            </div>
                          )}
                          {isPaid && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Pago
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações - sempre visível no mobile, hover no desktop */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          disabled={deletingId === transaction.id}
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors disabled:opacity-50"
                          aria-label="Editar"
                        >
                          <PencilIcon className="w-5 h-5 sm:w-4 sm:h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDeleteId === transaction.id || deletingId === transaction.id
                              ? 'bg-rose-100 dark:bg-rose-900/30'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700'
                          }`}
                          aria-label={
                            deletingId === transaction.id 
                              ? 'Excluindo...' 
                              : confirmDeleteId === transaction.id 
                                ? 'Confirmar exclusão' 
                                : 'Excluir'
                          }
                        >
                          {deletingId === transaction.id ? (
                            <div className="w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                          ) : (
                            <TrashIcon
                              className={`w-5 h-5 sm:w-4 sm:h-4 ${
                                confirmDeleteId === transaction.id
                                  ? 'text-rose-500'
                                  : 'text-zinc-400'
                              }`}
                            />
                          )}
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
