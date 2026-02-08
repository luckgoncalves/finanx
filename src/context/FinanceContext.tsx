'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useShare } from './ShareContext';
import {
  Transaction,
  Category,
  FinanceState,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/types/finance';

type Action =
  | { type: 'SET_STATE'; payload: Partial<FinanceState> }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'SET_MONTH'; payload: { month: number; year: number } }
  | { type: 'SET_LOADING'; payload: boolean };

interface AddTransactionData {
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  month: number;
  year: number;
  isInstallment?: boolean;
  totalInstallments?: number;
  isRecurring?: boolean;
  recurringMonths?: number;
}

interface FinanceContextType {
  state: FinanceState;
  loading: boolean;
  isViewerMode: boolean;
  addTransaction: (transaction: AddTransactionData) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  togglePaid: (id: string, paid: boolean) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  setMonth: (month: number, year: number) => void;
  getMonthlyData: (month: number, year: number) => {
    income: Transaction[];
    expenses: Transaction[];
    totalIncome: number;
    totalExpense: number;
    totalPaid: number;
    totalPending: number;
    balance: number;
  };
  getYearlyTotal: (year: number) => {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  refreshData: () => Promise<void>;
}

const initialState: FinanceState = {
  transactions: [],
  categories: [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
};

function financeReducer(state: FinanceState & { loading: boolean }, action: Action): FinanceState & { loading: boolean } {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'SET_MONTH':
      return {
        ...state,
        currentMonth: action.payload.month,
        currentYear: action.payload.year,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'finanx-data';

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, { ...initialState, loading: true });
  const { user } = useAuth();
  const { viewAsOwnerId } = useShare();

  // Check if database is configured
  const isDatabaseConfigured = process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true';
  
  console.log('[Finance] Database:', isDatabaseConfigured, '| User:', user?.email);

  // Load data from API or localStorage
  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    if (isDatabaseConfigured && user) {
      try {
        const url = viewAsOwnerId
          ? `/api/transactions?viewAs=${encodeURIComponent(viewAsOwnerId)}`
          : '/api/transactions';
        const res = await fetch(url);
        const data = await res.json();

        if (data.transactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions });
        } else if (res.status === 403) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        }
      } catch (error) {
        console.error('Error loading from API:', error);
      }
    } else {
      // Load from localStorage (fallback)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Restaurar dados mas sempre abrir no mês atual
          const now = new Date();
          dispatch({
            type: 'SET_STATE',
            payload: {
              ...parsed,
              currentMonth: now.getMonth() + 1,
              currentYear: now.getFullYear(),
            },
          });
        } catch (e) {
          console.error('Error loading saved data:', e);
        }
      }
    }

    // Sempre exibir o mês atual ao abrir o app
    const now = new Date();
    dispatch({ type: 'SET_MONTH', payload: { month: now.getMonth() + 1, year: now.getFullYear() } });

    dispatch({ type: 'SET_LOADING', payload: false });
  }, [user, isDatabaseConfigured, viewAsOwnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save to localStorage when state changes (fallback)
  useEffect(() => {
    if (!isDatabaseConfigured || !user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loading: _unused, ...stateToSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [state, user, isDatabaseConfigured]);

  const isViewerMode = viewAsOwnerId != null;

  const addTransaction = async (transaction: AddTransactionData) => {
    if (isViewerMode) return;
    if (isDatabaseConfigured && user) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        });

        if (!res.ok) {
          throw new Error('Failed to create transaction');
        }

        const data = await res.json();
        
        // Handle multiple transactions (installments/recurring)
        if (data.transactions && Array.isArray(data.transactions)) {
          data.transactions.forEach((t: Transaction) => {
            dispatch({ type: 'ADD_TRANSACTION', payload: t });
          });
        } else if (data.transaction) {
          dispatch({ type: 'ADD_TRANSACTION', payload: data.transaction });
        }
        return;
      } catch (error) {
        console.error('Error adding transaction:', error);
        return;
      }
    }

    // Local storage fallback (single transaction only)
    const newTransaction: Transaction = {
      id: uuidv4(),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      date: transaction.date,
      month: transaction.month,
      year: transaction.year,
      paid: false,
      paidAt: null,
      isInstallment: false,
      isRecurring: false,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (isViewerMode) return;
    if (isDatabaseConfigured && user) {
      try {
        const res = await fetch(`/api/transactions/${transaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        });

        if (!res.ok) {
          throw new Error('Failed to update transaction');
        }

        const data = await res.json();
        dispatch({ type: 'UPDATE_TRANSACTION', payload: data.transaction });
        return;
      } catch (error) {
        console.error('Error updating transaction:', error);
        return;
      }
    }

    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };

  const deleteTransaction = async (id: string) => {
    if (isViewerMode) return;
    if (isDatabaseConfigured && user) {
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('Failed to delete transaction');
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        return;
      }
    }

    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  const togglePaid = async (id: string, paid: boolean) => {
    if (isViewerMode) return;
    if (isDatabaseConfigured && user) {
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid }),
        });

        if (!res.ok) {
          throw new Error('Failed to toggle paid status');
        }

        const data = await res.json();
        dispatch({ type: 'UPDATE_TRANSACTION', payload: data.transaction });
        return;
      } catch (error) {
        console.error('Error toggling paid:', error);
        return;
      }
    }

    // Update locally
    const transaction = state.transactions.find((t) => t.id === id);
    if (transaction) {
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          ...transaction,
          paid,
          paidAt: paid ? new Date().toISOString() : null,
        },
      });
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
    };

    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const setMonth = (month: number, year: number) => {
    dispatch({ type: 'SET_MONTH', payload: { month, year } });
  };

  const getMonthlyData = (month: number, year: number) => {
    const monthTransactions = state.transactions.filter(
      (t) => t.month === month && t.year === year
    );
    const income = monthTransactions.filter((t) => t.type === 'income');
    const expenses = monthTransactions.filter((t) => t.type === 'expense');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = expenses.filter((t) => t.paid).reduce((sum, t) => sum + t.amount, 0);
    const totalPending = expenses.filter((t) => !t.paid).reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      totalIncome,
      totalExpense,
      totalPaid,
      totalPending,
      balance: totalIncome - totalExpense,
    };
  };

  const getYearlyTotal = (year: number) => {
    const yearTransactions = state.transactions.filter((t) => t.year === year);
    const totalIncome = yearTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = yearTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <FinanceContext.Provider
      value={{
        state,
        loading: state.loading,
        isViewerMode,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        togglePaid,
        addCategory,
        setMonth,
        getMonthlyData,
        getYearlyTotal,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
