import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import { Transaction, Category, Payable, Investment, Group, Budget, FinancialGoal } from '@/types';
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
  deletePayable as dbDeletePayable
} from '@/lib/database';
import { 
  DatabaseError,
  ValidationError,
  RateLimitError,
  withErrorHandling, 
  FinancialError 
} from '@/lib/errorHandling';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  groups: Group[];
  budgets: Budget[];
  goals: FinancialGoal[];
  
  // Loading states
  loading: {
    transactions: boolean;
    categories: boolean;
    payables: boolean;
    groups: boolean;
    budgets: boolean;
    goals: boolean;
  };
  
  // CRUD Operations
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: string, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  
  addPayable: (payable: Omit<Payable, 'id'>) => Promise<void>;
  updatePayable: (id: string, payable: Partial<Payable>) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode | ((context: { language: Language }) => ReactNode) }) {
  const [language, setLanguage] = useState<Language>('pt');
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    transactions: false,
    categories: false,
    payables: false,
    groups: false,
    budgets: false,
    goals: false
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
  };

  // Initialize Supabase auth with better error handling and debugging
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isSignedIn || !user) {
        console.log('🔐 User not signed in or user object not available');
        setIsInitialized(false);
        return;
      }
      
      try {
        console.log('🔐 Initializing Supabase auth for user:', user.id);
        
        // Get the JWT token from Clerk with Supabase template
        const token = await getToken({ template: 'supabase' });
        
        if (!token) {
          console.error('❌ No JWT token received from Clerk');
          throw new Error('No JWT token available from Clerk');
        }
        
        console.log('✅ JWT token received from Clerk (length):', token.length);
        
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '', // Clerk handles refresh
        });
        
        if (error) {
          console.error('❌ Error setting Supabase session:', error);
          throw error;
        }
        
        console.log('✅ Supabase session set successfully');
        console.log('🔍 Session user:', data.user?.id);
        
        // Verify the session is working by checking auth status
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ Error verifying Supabase auth:', authError);
          throw authError;
        }
        
        console.log('✅ Supabase auth verified, user ID:', authData.user?.id);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Error initializing Supabase auth:', error);
        setError('Erro na autenticação. Tente fazer login novamente.');
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initializeAuth();
  }, [isSignedIn, user, getToken]);

  // Initialize default groups
  useEffect(() => {
    if (isSignedIn && user && isInitialized && groups.length === 0) {
      const defaultGroups: Group[] = [
        {
          id: 'empresa',
          name: 'Empresa',
          description: 'Transações relacionadas à empresa',
          color: '#3b82f6',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'familia',
          name: 'Família',
          description: 'Transações pessoais e familiares',
          color: '#8b5cf6',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      setGroups(defaultGroups);
    }
  }, [isSignedIn, user, isInitialized, groups.length]);

  // Initialize mock budgets and goals
  useEffect(() => {
    if (isSignedIn && user && isInitialized && budgets.length === 0) {
      const mockBudgets: Budget[] = [
        {
          id: '1',
          name: 'Marketing Digital',
          category: 'empresa',
          subcategory: 'Marketing',
          budgetAmount: 5000,
          spentAmount: 3200,
          period: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        {
          id: '2',
          name: 'Alimentação Familiar',
          category: 'familia',
          subcategory: 'Alimentação',
          budgetAmount: 2000,
          spentAmount: 1800,
          period: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      ];
      setBudgets(mockBudgets);

      const mockGoals: FinancialGoal[] = [
        {
          id: '1',
          title: 'Reserva de Emergência',
          description: 'Construir reserva equivalente a 6 meses de despesas',
          targetAmount: 50000,
          currentAmount: 32000,
          category: 'familia',
          deadline: '2024-12-31',
          status: 'active'
        },
        {
          id: '2',
          title: 'Expansão da Empresa',
          description: 'Capital para novos equipamentos e contratações',
          targetAmount: 100000,
          currentAmount: 65000,
          category: 'empresa',
          deadline: '2024-06-30',
          status: 'active'
        }
      ];
      setGoals(mockGoals);
    }
  }, [isSignedIn, user, isInitialized, budgets.length]);

  // Load data with better auth handling
  useEffect(() => {
    const loadData = async () => {
      if (!isSignedIn || !user || !isInitialized) {
        console.log('🔄 Skipping data load - not ready:', { isSignedIn, user: !!user, isInitialized });
        return;
      }

      console.log('📊 Loading data for user:', user.id);

      try {
        // Verify auth before loading data
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          console.error('❌ Auth verification failed before data load:', authError);
          throw new Error('Authentication required');
        }
        
        console.log('✅ Auth verified before data load, user:', authData.user.id);

        // Load transactions
        setLoading(prev => ({ ...prev, transactions: true }));
        try {
          const transactionsData = await getTransactions(user.id);
          setTransactions(transactionsData);
          console.log('✅ Loaded transactions:', transactionsData.length);
        } catch (error) {
          console.warn('⚠️ Failed to load transactions:', error);
          setTransactions([]); // Set empty array on error
        }
        
        // Load categories
        setLoading(prev => ({ ...prev, categories: true }));
        try {
          const categoriesData = await getCategories(user.id);
          setCategories(categoriesData);
          console.log('✅ Loaded categories:', categoriesData.length);
        } catch (error) {
          console.warn('⚠️ Failed to load categories:', error);
          setCategories([]); // Set empty array on error
        }
        
        // Load payables
        setLoading(prev => ({ ...prev, payables: true }));
        try {
          const payablesData = await getPayables(user.id);
          setPayables(payablesData);
          console.log('✅ Loaded payables:', payablesData.length);
        } catch (error) {
          console.warn('⚠️ Failed to load payables:', error);
          setPayables([]); // Set empty array on error
        }
        
      } catch (error) {
        console.error('❌ Error in loadData:', error);
        handleError(error, 'carregamento de dados');
      } finally {
        setLoading({
          transactions: false,
          categories: false,
          payables: false,
          groups: false,
          budgets: false,
          goals: false
        });
      }
    };

    loadData();
  }, [isSignedIn, user, isInitialized]);

  // Enhanced transaction CRUD with better auth handling
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Verify auth before operation
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('❌ Auth verification failed before transaction creation:', authError);
        throw new Error('Authentication required');
      }
      
      console.log('✅ Auth verified before transaction creation, user:', authData.user.id);
      
      await withErrorHandling('create_transaction', async () => {
        const newTransaction = await dbCreateTransaction(transaction, user.id, user.emailAddresses[0]?.emailAddress);
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('Transação criada com sucesso!');
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
        const updatedTransaction = await dbUpdateTransaction(id, transaction, user.id);
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        toast.success('Transação atualizada com sucesso!');
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
        await dbDeleteTransaction(id, user.id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso!');
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
  };

  const deleteCategory = async (id: string) => {
    // Mock implementation for now
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('Categoria excluída com sucesso!');
  };

  // Group CRUD
  const addGroup = async (group: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...group,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setGroups(prev => [newGroup, ...prev]);
    toast.success('Grupo criado com sucesso!');
  };

  const updateGroup = async (id: string, group: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...group } : g));
    toast.success('Grupo atualizado com sucesso!');
  };

  const deleteGroup = async (id: string) => {
    // Don't allow deleting default groups
    if (id === 'empresa' || id === 'familia') {
      toast.error('Não é possível excluir grupos padrão');
      return;
    }
    setGroups(prev => prev.filter(g => g.id !== id));
    toast.success('Grupo excluído com sucesso!');
  };

  // Payable CRUD
  const addPayable = async (payable: Omit<Payable, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await withErrorHandling('create_payable', async () => {
        const newPayable = await dbCreatePayable(payable, user.id, user.emailAddresses[0]?.emailAddress);
        setPayables(prev => [newPayable, ...prev]);
        toast.success('Conta a pagar criada com sucesso!');
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
        const updatedPayable = await dbUpdatePayable(id, payable, user.id);
        setPayables(prev => prev.map(p => p.id === id ? updatedPayable : p));
        toast.success('Conta a pagar atualizada com sucesso!');
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
        await dbDeletePayable(id, user.id);
        setPayables(prev => prev.filter(p => p.id !== id));
        toast.success('Conta a pagar excluída com sucesso!');
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
  };

  const updateInvestment = async (id: string, investment: Partial<Investment>) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...investment } : i));
    toast.success('Investimento atualizado com sucesso!');
  };

  const deleteInvestment = async (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    toast.success('Investimento excluído com sucesso!');
  };

  // Budget CRUD
  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString()
    };
    setBudgets(prev => [newBudget, ...prev]);
    toast.success('Orçamento criado com sucesso!');
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget } : b));
    toast.success('Orçamento atualizado com sucesso!');
  };

  const deleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast.success('Orçamento excluído com sucesso!');
  };

  // Goal CRUD
  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: Date.now().toString()
    };
    setGoals(prev => [newGoal, ...prev]);
    toast.success('Meta criada com sucesso!');
  };

  const updateGoal = async (id: string, goal: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
    toast.success('Meta atualizada com sucesso!');
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Meta excluída com sucesso!');
  };

  const contextValue = {
    language,
    setLanguage,
    t,
    transactions,
    categories,
    payables,
    investments,
    groups,
    budgets,
    goals,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addGroup,
    updateGroup,
    deleteGroup,
    addPayable,
    updatePayable,
    deletePayable,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
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