import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import { Transaction, Category, Payable, Investment } from '@/types';
import { 
  getTransactions, 
  getCategories, 
  getPayables,
  createTransaction as dbCreateTransaction,
  createCategory as dbCreateCategory,
  createPayable as dbCreatePayable,
  updateTransaction as dbUpdateTransaction,
  updatePayable as dbUpdatePayable,
  deleteTransaction as dbDeleteTransaction,
  deletePayable as dbDeletePayable,
  DatabaseError,
  ValidationError,
  RateLimitError
} from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  useSentryUser, 
  trackFinancialOperation, 
  trackAuthEvent, 
  withPerformanceMonitoring,
  captureError,
  addBreadcrumb
} from '@/lib/sentry';
import { withErrorHandling, FinancialError } from '@/lib/errorHandling';

interface AppContextType {
  // Language & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  
  // Data
  transactions: Transaction[];
  categories: Category[];
  payables: Payable[];
  investments: Investment[];
  
  // Loading states
  loading: {
    transactions: boolean;
    categories: boolean;
    payables: boolean;
  };
  
  // CRUD Operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addPayable: (payable: Omit<Payable, 'id'>) => Promise<void>;
  updatePayable: (id: string, payable: Partial<Payable>) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode | ((context: { language: Language }) => ReactNode) }) {
  const [language, setLanguage] = useState<Language>('pt');
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { setUser: setSentryUser, clearUser: clearSentryUser } = useSentryUser();
  
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    transactions: false,
    categories: false,
    payables: false
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const clearError = () => setError(null);

  const handleError = (error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    
    let message = `Erro em ${operation}`;
    
    if (error instanceof ValidationError) {
      message = `Dados inválidos: ${error.message}`;
    } else if (error instanceof RateLimitError) {
      message = 'Muitas requisições. Tente novamente em alguns minutos.';
    } else if (error instanceof DatabaseError) {
      message = `Erro no banco de dados: ${error.message}`;
    } else if (error instanceof FinancialError) {
      message = `Erro financeiro: ${error.message}`;
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    setError(message);
    toast.error(message);
    
    // Report to Sentry
    captureError(error as Error, {
      operation,
      userId: user?.id,
      userEmail: user?.emailAddresses[0]?.emailAddress,
    });
  };

  // Set up Sentry user context when user changes
  useEffect(() => {
    if (user && isSignedIn) {
      setSentryUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        username: user.fullName || undefined,
      });
      
      trackAuthEvent('user_context_set', user.id);
      addBreadcrumb('User context set in AppProvider', 'auth');
    } else {
      clearSentryUser();
      trackAuthEvent('user_context_cleared');
    }
  }, [user, isSignedIn, setSentryUser, clearSentryUser]);

  // Initialize Supabase auth
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        await withPerformanceMonitoring('supabase_auth_init', async () => {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            supabase.auth.setSession({
              access_token: token,
              refresh_token: '',
            });
            addBreadcrumb('Supabase auth initialized', 'auth');
          }
        });
      } catch (error) {
        console.error('Error initializing Supabase auth:', error);
        captureError(error as Error, { operation: 'supabase_auth_init' });
      }
    };

    initializeAuth();
  }, [isSignedIn, user, getToken]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!isSignedIn || !user) return;

      try {
        await withPerformanceMonitoring('load_app_data', async () => {
          // Load transactions
          setLoading(prev => ({ ...prev, transactions: true }));
          const transactionsData = await getTransactions(user.id);
          setTransactions(transactionsData);
          addBreadcrumb(`Loaded ${transactionsData.length} transactions`, 'data');
          
          // Load categories
          setLoading(prev => ({ ...prev, categories: true }));
          const categoriesData = await getCategories(user.id);
          setCategories(categoriesData);
          addBreadcrumb(`Loaded ${categoriesData.length} categories`, 'data');
          
          // Load payables
          setLoading(prev => ({ ...prev, payables: true }));
          const payablesData = await getPayables(user.id);
          setPayables(payablesData);
          addBreadcrumb(`Loaded ${payablesData.length} payables`, 'data');
        }, {
          userId: user.id,
          operation: 'initial_data_load'
        });
        
      } catch (error) {
        handleError(error, 'carregamento de dados');
      } finally {
        setLoading({
          transactions: false,
          categories: false,
          payables: false
        });
      }
    };

    loadData();
  }, [isSignedIn, user]);

  // Transaction CRUD
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('create_transaction', async () => {
        trackFinancialOperation('create_transaction', {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
        });
        
        const newTransaction = await dbCreateTransaction(transaction, user.id, user.emailAddresses[0]?.emailAddress);
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('Transação criada com sucesso!');
        
        addBreadcrumb('Transaction created successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'create_transaction',
        userId: user.id,
      });
    } catch (error) {
      handleError(error, 'criação de transação');
      throw error;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('update_transaction', async () => {
        trackFinancialOperation('update_transaction', {
          transactionId: id,
          updates: Object.keys(transaction),
        });
        
        const updatedTransaction = await dbUpdateTransaction(id, transaction, user.id);
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        toast.success('Transação atualizada com sucesso!');
        
        addBreadcrumb('Transaction updated successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'update_transaction',
        userId: user.id,
        transactionId: id,
      });
    } catch (error) {
      handleError(error, 'atualização de transação');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('delete_transaction', async () => {
        trackFinancialOperation('delete_transaction', {
          transactionId: id,
        });
        
        await dbDeleteTransaction(id, user.id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso!');
        
        addBreadcrumb('Transaction deleted successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'delete_transaction',
        userId: user.id,
        transactionId: id,
      });
    } catch (error) {
      handleError(error, 'exclusão de transação');
      throw error;
    }
  };

  // Category CRUD
  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('create_category', async () => {
        const newCategory = await dbCreateCategory(category, user.id, user.emailAddresses[0]?.emailAddress);
        setCategories(prev => [newCategory, ...prev]);
        toast.success('Categoria criada com sucesso!');
        
        addBreadcrumb('Category created successfully', 'data');
      }, {
        type: 'data',
        operation: 'create_category',
        userId: user.id,
      });
    } catch (error) {
      handleError(error, 'criação de categoria');
      throw error;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    // Mock implementation for now
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
    toast.success('Categoria atualizada com sucesso!');
    addBreadcrumb('Category updated successfully', 'data');
  };

  const deleteCategory = async (id: string) => {
    // Mock implementation for now
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Categoria excluída com sucesso!');
    addBreadcrumb('Category deleted successfully', 'data');
  };

  // Payable CRUD
  const addPayable = async (payable: Omit<Payable, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('create_payable', async () => {
        trackFinancialOperation('create_payable', {
          amount: payable.amount,
          category: payable.category,
          dueDate: payable.dueDate,
        });
        
        const newPayable = await dbCreatePayable(payable, user.id, user.emailAddresses[0]?.emailAddress);
        setPayables(prev => [newPayable, ...prev]);
        toast.success('Conta a pagar criada com sucesso!');
        
        addBreadcrumb('Payable created successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'create_payable',
        userId: user.id,
      });
    } catch (error) {
      handleError(error, 'criação de conta a pagar');
      throw error;
    }
  };

  const updatePayable = async (id: string, payable: Partial<Payable>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('update_payable', async () => {
        trackFinancialOperation('update_payable', {
          payableId: id,
          updates: Object.keys(payable),
        });
        
        const updatedPayable = await dbUpdatePayable(id, payable, user.id);
        setPayables(prev => prev.map(p => p.id === id ? updatedPayable : p));
        toast.success('Conta a pagar atualizada com sucesso!');
        
        addBreadcrumb('Payable updated successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'update_payable',
        userId: user.id,
        payableId: id,
      });
    } catch (error) {
      handleError(error, 'atualização de conta a pagar');
      throw error;
    }
  };

  const deletePayable = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('delete_payable', async () => {
        trackFinancialOperation('delete_payable', {
          payableId: id,
        });
        
        await dbDeletePayable(id, user.id);
        setPayables(prev => prev.filter(p => p.id !== id));
        toast.success('Conta a pagar excluída com sucesso!');
        
        addBreadcrumb('Payable deleted successfully', 'finance');
      }, {
        type: 'financial',
        operation: 'delete_payable',
        userId: user.id,
        payableId: id,
      });
    } catch (error) {
      handleError(error, 'exclusão de conta a pagar');
      throw error;
    }
  };

  // Investment CRUD (mock for now)
  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString()
    };
    setInvestments(prev => [newInvestment, ...prev]);
    toast.success('Investimento criado com sucesso!');
    addBreadcrumb('Investment created successfully', 'finance');
  };

  const updateInvestment = async (id: string, investment: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...investment } : i));
    toast.success('Investimento atualizado com sucesso!');
    addBreadcrumb('Investment updated successfully', 'finance');
  };

  const deleteInvestment = async (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    toast.success('Investimento excluído com sucesso!');
    addBreadcrumb('Investment deleted successfully', 'finance');
  };

  const contextValue = {
    language,
    setLanguage,
    t,
    transactions,
    categories,
    payables,
    investments,
    loading,
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
    deleteInvestment,
    error,
    clearError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {typeof children === 'function' ? children({ language }) : children}
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