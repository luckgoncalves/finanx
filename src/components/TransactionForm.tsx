'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/types/finance';

interface TransactionFormProps {
  type: TransactionType;
  onClose: () => void;
  editTransaction?: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    createdAt: string;
  };
}

export function TransactionForm({ type, onClose, editTransaction }: TransactionFormProps) {
  const { state, addTransaction, updateTransaction } = useFinance();
  const categories = state.categories.filter((c) => c.type === type);

  const [description, setDescription] = useState(editTransaction?.description || '');
  // Armazena o valor em centavos (inteiro) para evitar problemas de precisão
  const [amountCents, setAmountCents] = useState(
    editTransaction?.amount ? Math.round(editTransaction.amount * 100) : 0
  );
  const [category, setCategory] = useState(editTransaction?.category || categories[0]?.id || '');
  const [date, setDate] = useState(
    editTransaction?.date || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedDate = new Date(date);
    const transactionData = {
      description,
      amount: amountCents / 100,
      type,
      category,
      date,
      month: parsedDate.getMonth() + 1,
      year: parsedDate.getFullYear(),
    };

    if (editTransaction) {
      updateTransaction({
        ...transactionData,
        id: editTransaction.id,
        createdAt: editTransaction.createdAt,
      });
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  const formatCentsToDisplay = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    // Limita a 10 dígitos para evitar overflow
    const limited = numbers.slice(0, 10);
    setAmountCents(parseInt(limited || '0', 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {editTransaction ? 'Editar' : 'Nova'}{' '}
            {type === 'income' ? 'Entrada' : 'Despesa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCentsToDisplay(amountCents)}
                onChange={handleAmountChange}
                className={`
                  w-full pl-10 pr-4 py-4 rounded-xl text-2xl font-bold
                  bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent
                  focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400
                  transition-colors
                  ${type === 'income' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                  }
                `}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
              placeholder="Ex: Salário, Aluguel..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`
                    p-3 rounded-xl text-sm font-medium transition-all
                    ${category === cat.id
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                  `}
                  style={{
                    backgroundColor: category === cat.id ? `${cat.color}20` : undefined,
                    color: category === cat.id ? cat.color : undefined,
                    ['--tw-ring-color' as string]: category === cat.id ? cat.color : undefined,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className={`
              w-full py-4 rounded-xl font-semibold text-white transition-all
              ${type === 'income'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25'
              }
            `}
          >
            {editTransaction ? 'Salvar Alterações' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}

