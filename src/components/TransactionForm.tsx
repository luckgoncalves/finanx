'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/types/finance';

type PaymentMode = 'single' | 'installment' | 'recurring';

interface TransactionFormProps {
  type: TransactionType;
  onClose: () => void;
  editTransaction?: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    paid: boolean;
    paidAt?: string | null;
    isInstallment?: boolean;
    installmentNumber?: number | null;
    totalInstallments?: number | null;
    isRecurring?: boolean;
    recurringGroupId?: string | null;
    createdAt: string;
  };
}

export function TransactionForm({ type, onClose, editTransaction }: TransactionFormProps) {
  const { state, addTransaction, updateTransaction } = useFinance();
  const categories = state.categories.filter((c) => c.type === type);

  const [description, setDescription] = useState(editTransaction?.description || '');
  const [amountCents, setAmountCents] = useState(
    editTransaction?.amount ? Math.round(editTransaction.amount * 100) : 0
  );
  const [category, setCategory] = useState(editTransaction?.category || categories[0]?.id || '');
  const [date, setDate] = useState(
    editTransaction?.date || new Date().toISOString().split('T')[0]
  );
  
  // Payment mode states
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('single');
  const [installments, setInstallments] = useState(2);
  const [recurringMonths, setRecurringMonths] = useState(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedDate = new Date(date);
    const transactionData = {
      description,
      amount: amountCents / 100,
      type,
      category,
      date,
      month: parsedDate.getMonth() + 1,
      year: parsedDate.getFullYear(),
      isInstallment: paymentMode === 'installment',
      totalInstallments: paymentMode === 'installment' ? installments : undefined,
      isRecurring: paymentMode === 'recurring',
      recurringMonths: paymentMode === 'recurring' ? recurringMonths : undefined,
    };

    try {
      if (editTransaction) {
        await updateTransaction({
          ...transactionData,
          id: editTransaction.id,
          paid: editTransaction.paid,
          paidAt: editTransaction.paidAt,
          isInstallment: editTransaction.isInstallment || false,
          isRecurring: editTransaction.isRecurring || false,
          createdAt: editTransaction.createdAt,
        });
      } else {
        await addTransaction(transactionData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCentsToDisplay = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 10);
    setAmountCents(parseInt(limited || '0', 10));
  };

  const isEditing = !!editTransaction;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className="relative w-full md:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl p-6 pb-24 md:pb-6 animate-slide-up max-h-[85vh] overflow-y-auto overscroll-contain"
        onTouchMove={(e) => e.stopPropagation()}
      >
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
              Valor {paymentMode === 'installment' && '(por parcela)'}
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
              Data {paymentMode !== 'single' && '(primeira parcela)'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
              required
            />
          </div>

          {/* Payment Mode */}
          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Tipo de Pagamento
              </label>
              
              {/* Show current payment type when editing */}
              {isEditing ? (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  {editTransaction?.isInstallment ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
                        Parcelado
                      </span>
                      {editTransaction.installmentNumber && editTransaction.totalInstallments && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Parcela {editTransaction.installmentNumber} de {editTransaction.totalInstallments}
                        </span>
                      )}
                    </div>
                  ) : editTransaction?.isRecurring ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium">
                        Recorrente
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Despesa mensal fixa
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                        À vista
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pagamento único
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Payment mode selector for new transactions */
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('single')}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      paymentMode === 'single'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    À vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('installment')}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      paymentMode === 'installment'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Parcelado
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('recurring')}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      paymentMode === 'recurring'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Recorrente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Installments selector */}
          {!isEditing && paymentMode === 'installment' && (
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Número de Parcelas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="w-16 text-center font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                  {installments}x
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                Total: {formatCentsToDisplay(amountCents * installments)} em {installments} parcelas de {formatCentsToDisplay(amountCents)}
              </p>
            </div>
          )}

          {/* Recurring months selector */}
          {!isEditing && paymentMode === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                Repetir por quantos meses?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 12, 24].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setRecurringMonths(months)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      recurringMonths === months
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {months} meses
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                {formatCentsToDisplay(amountCents)} por mês durante {recurringMonths} meses
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-4 rounded-xl font-semibold text-white transition-all
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              ${type === 'income'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25'
              }
            `}
          >
            {isSubmitting ? 'Salvando...' : editTransaction ? 'Salvar Alterações' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
