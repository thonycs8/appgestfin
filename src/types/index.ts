export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'empresa' | 'familia';
  subcategory: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  userId?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  category: 'empresa' | 'familia';
  userId?: string;
}

export interface Payable {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: 'empresa' | 'familia';
  status: 'pending' | 'paid' | 'overdue';
  supplier?: string;
  userId?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'fund' | 'crypto' | 'real_estate' | 'savings';
  amount: number;
  currentValue: number;
  category: 'empresa' | 'familia';
  purchaseDate: string;
  userId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  category: 'empresa' | 'familia';
  color: string;
  userId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  companyBalance: number;
  familyBalance: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: 'empresa' | 'familia';
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  userId?: string;
}

export interface Budget {
  id: string;
  name: string;
  category: 'empresa' | 'familia';
  subcategory: string;
  budgetAmount: number;
  spentAmount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  userId?: string;
}

export interface Alert {
  id: string;
  type: 'payable_due' | 'payable_overdue' | 'investment_yield' | 'budget_limit' | 'goal_deadline' | 'low_balance';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  dueDate?: string;
  relatedId?: string;
  relatedType?: 'payable' | 'investment' | 'budget' | 'goal' | 'account';
  userId?: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  payableDueDays: number; // Dias antes do vencimento para alertar
  investmentYieldThreshold: number; // Percentual de rendimento para alertar
  budgetLimitThreshold: number; // Percentual do orçamento para alertar
  lowBalanceThreshold: number; // Valor mínimo de saldo para alertar
  createdAt: string;
  updatedAt: string;
}