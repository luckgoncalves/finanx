'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
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

interface FinanceContextType {
  state: FinanceState;
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  setMonth: (month: number, year: number) => void;
  getMonthlyData: (month: number, year: number) => {
    income: Transaction[];
    expenses: Transaction[];
    totalIncome: number;
    totalExpense: number;
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

  // Check if database is configured
  const isDatabaseConfigured = process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true';
  
  console.log('[Finance] Database:', isDatabaseConfigured, '| User:', user?.email);

  // Load data from API or localStorage
  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    if (isDatabaseConfigured && user) {
      // Load from API
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();

        if (data.transactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: data.transactions });
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
          dispatch({ type: 'SET_STATE', payload: parsed });
        } catch (e) {
          console.error('Error loading saved data:', e);
        }
      }
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, [user, isDatabaseConfigured]);

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

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

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
        dispatch({ type: 'ADD_TRANSACTION', payload: data.transaction });
        return;
      } catch (error) {
        console.error('Error adding transaction:', error);
        return;
      }
    }

    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  };

  const updateTransaction = async (transaction: Transaction) => {
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

    return {
      income,
      expenses,
      totalIncome,
      totalExpense,
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
        addTransaction,
        updateTransaction,
        deleteTransaction,
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
