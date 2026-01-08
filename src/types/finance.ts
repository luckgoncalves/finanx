export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO date string
  month: number; // 1-12
  year: number;
  paid: boolean;
  paidAt?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface MonthlyData {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: number;
  currentYear: number;
}

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'condominio', name: 'Condomínio', type: 'expense', color: '#ef4444', icon: 'home' },
  { id: 'luz', name: 'Luz', type: 'expense', color: '#f59e0b', icon: 'bolt' },
  { id: 'telefone', name: 'Telefone/Internet', type: 'expense', color: '#8b5cf6', icon: 'phone' },
  { id: 'saude', name: 'Saúde', type: 'expense', color: '#ec4899', icon: 'heart' },
  { id: 'iptu', name: 'IPTU', type: 'expense', color: '#6366f1', icon: 'document' },
  { id: 'ipva', name: 'IPVA', type: 'expense', color: '#14b8a6', icon: 'car' },
  { id: 'cartao', name: 'Cartão de Crédito', type: 'expense', color: '#f97316', icon: 'credit-card' },
  { id: 'seguro', name: 'Seguro', type: 'expense', color: '#84cc16', icon: 'shield' },
  { id: 'educacao', name: 'Educação', type: 'expense', color: '#06b6d4', icon: 'book' },
  { id: 'assinatura', name: 'Assinaturas', type: 'expense', color: '#a855f7', icon: 'tag' },
  { id: 'outros', name: 'Outros', type: 'expense', color: '#64748b', icon: 'dots' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salario', name: 'Salário', type: 'income', color: '#10b981', icon: 'banknotes' },
  { id: 'acordo', name: 'Acordo', type: 'income', color: '#22c55e', icon: 'document-check' },
  { id: 'fgts', name: 'FGTS', type: 'income', color: '#34d399', icon: 'building' },
  { id: 'cashback', name: 'Cashback', type: 'income', color: '#4ade80', icon: 'arrow-path' },
  { id: 'outros_entrada', name: 'Outros', type: 'income', color: '#6ee7b7', icon: 'plus' },
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

