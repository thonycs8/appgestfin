import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import { Transaction, Category, Payable, Investment } from '@/types';
import { mockTransactions, mockCategories, mockPayables, mockInvestments } from '@/lib/data';

interface AppContextType {
  // Language & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  t: (key: TranslationKey) => string;
  
  // Data
  transactions: Transaction[];
  categories: Category[];
  payables: Payable[];
  investments: Investment[];
  
  // CRUD Operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  addPayable: (payable: Omit<Payable, 'id'>) => void;
  updatePayable: (id: string, payable: Partial<Payable>) => void;
  deletePayable: (id: string) => void;
  
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [categories, setCategories] = useState<Category[]>(mockCategories.map(cat => ({
    ...cat,
    isActive: true,
    createdAt: new Date().toISOString()
  })));
  const [payables, setPayables] = useState<Payable[]>(mockPayables);
  const [investments, setInvestments] = useState<Investment[]>(mockInvestments);

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Transaction CRUD
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Category CRUD
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setCategories(prev => [newCategory, ...prev]);
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Payable CRUD
  const addPayable = (payable: Omit<Payable, 'id'>) => {
    const newPayable: Payable = {
      ...payable,
      id: Date.now().toString()
    };
    setPayables(prev => [newPayable, ...prev]);
  };

  const updatePayable = (id: string, payable: Partial<Payable>) => {
    setPayables(prev => prev.map(p => p.id === id ? { ...p, ...payable } : p));
  };

  const deletePayable = (id: string) => {
    setPayables(prev => prev.filter(p => p.id !== id));
  };

  // Investment CRUD
  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString()
    };
    setInvestments(prev => [newInvestment, ...prev]);
  };

  const updateInvestment = (id: string, investment: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...investment } : i));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      theme,
      setTheme,
      t,
      transactions,
      categories,
      payables,
      investments,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addPayable,
      updatePayable,
      deletePayable,
      addInvestment,
      updateInvestment,
      deleteInvestment
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}