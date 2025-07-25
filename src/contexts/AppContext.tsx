import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import { Transaction, Category, Payable, Investment, Group, Budget, FinancialGoal } from '@/types';
import { useAuthUser } from '@/lib/auth';
import { 
  createTransaction, 
  getTransactions, 
  updateTransaction, 
  deleteTransaction,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createPayable,
  getPayables,
  updatePayable,
  deletePayable
} from '@/lib/database';
import { databaseService, TransactionFilters, PaginationOptions } from '@/lib/database-enhanced';
import { toast } from 'sonner';
import { getFreePlan } from '@/stripe-config';
import { mockCategories, mockTransactions, mockPayables, mockInvestments } from '@/lib/data';
import { createAuthenticatedSupabaseClient } from '@/lib/supabase';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  transactions: Transaction[];
  categories: Category[];
  payables: Payable[];
  investments: Investment[];
  groups: Group[];
  budgets: Budget[];
  goals: FinancialGoal[];
  loading: {
    transactions: boolean;
    categories: boolean;
    payables: boolean;
    groups: boolean;
    budgets: boolean;
    goals: boolean;
  };
  // Transações com filtros melhorados
  loadTransactions: (filters?: TransactionFilters, pagination?: PaginationOptions) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Categorias
  loadCategories: (type?: 'income' | 'expense') => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Grupos (mock)
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (id: string, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  // Contas a pagar
  addPayable: (payable: Omit<Payable, 'id'>) => Promise<void>;
  updatePayable: (id: string, payable: Partial<Payable>) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  // Investimentos (mock)
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  // Orçamentos (mock)
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Metas (mock)
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Estatísticas
  getFinancialSummary: (dateFrom?: string, dateTo?: string) => Promise<any>;
  exportUserData: () => Promise<void>;
  // Estado de erro
  error: string | null;
  clearError: () => void;
  // Verificação de limites do plano
  checkPlanLimits: (action: 'transaction' | 'category' | 'user') => Promise<boolean>;
  getCurrentPlanLimits: () => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode | ((context: { language: Language }) => ReactNode) }) {
  const [language, setLanguage] = useState<Language>('pt');
  const { isSignedIn, isLoaded: clerkLoaded, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { ensureSupabaseAuth, syncUserToSupabase } = useAuthUser();
  
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
  const [isMockMode, setIsMockMode] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const clearError = () => setError(null);

  const handleError = (error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    
    let message = `Erro em ${operation}`;
    
    if (error instanceof Error) {
      message = error.message;
    }
    
    setError(message);
    toast.error(message);
  };

  // Inicializar autenticação e sincronizar usuário
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Starting auth initialization...', { clerkLoaded, userLoaded, isSignedIn, userId: user?.id });
      
      if (!clerkLoaded || !userLoaded) {
        console.log('⏳ Waiting for Clerk to load...', { clerkLoaded, userLoaded });
        return;
      }

      if (!isSignedIn || !user) {
        console.log('❌ User not signed in or user data missing', { isSignedIn, hasUser: !!user });
        setIsInitialized(false);
        return;
      }

      try {
        console.log('🔐 User signed in, initializing authentication...', { userId: user.id, email: user.emailAddresses[0]?.emailAddress });
        
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
          console.warn('⚠️ Supabase not configured, enabling mock mode');
          setIsMockMode(true);
          setIsInitialized(true);
          
          // Load mock data in mock mode
          console.log('📦 Loading mock data...');
          setTransactions(mockTransactions);
          setCategories(mockCategories);
          setPayables(mockPayables);
          setInvestments(mockInvestments);
          console.log('✅ Mock data loaded successfully');
          return;
        }
        
        console.log('🔗 Connecting to Supabase...');
        await ensureSupabaseAuth();
        console.log('👤 Syncing user to Supabase...');
        await syncUserToSupabase();
        setIsInitialized(true);
        console.log('✅ Authentication and sync completed successfully');
      } catch (error) {
        console.error('❌ Error during authentication initialization:', error);
        // Don't throw error, just log warning and continue in mock mode
        console.warn('⚠️ Falling back to mock mode due to auth error');
        setIsMockMode(true);
        setIsInitialized(true);
        
        // Load mock data in mock mode
        console.log('📦 Loading mock data as fallback...');
        setTransactions(mockTransactions);
        setCategories(mockCategories);
        setPayables(mockPayables);
        setInvestments(mockInvestments);
        console.log('✅ Fallback mock data loaded');
      }
    };

    initializeAuth();
  }, [clerkLoaded, userLoaded, isSignedIn, user, ensureSupabaseAuth, syncUserToSupabase]);

  // Carregar informações da assinatura
  useEffect(() => {
    const loadSubscription = async () => {
      if (!isSignedIn || !user || !isInitialized) {
        console.log('⏳ Skipping subscription load - not ready', { isSignedIn, hasUser: !!user, isInitialized });
        return;
      }
      
      try {
        console.log('💳 Loading subscription data...');
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          console.log('⚠️ Supabase not configured, skipping subscription load');
          return;
        }

        const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
        
        const { data, error } = await authenticatedSupabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.warn('⚠️ Subscription load error:', error.message);
          return;
        }

        setUserSubscription(data);
        console.log('✅ Subscription data loaded:', data);
      } catch (error) {
        console.warn('⚠️ Error loading subscription:', error);
      }
    };
    loadSubscription();
  }, [isSignedIn, user, isInitialized, getToken]);


  // Inicializar grupos padrão
  useEffect(() => {
    if (isSignedIn && user && isInitialized && groups.length === 0) {
      console.log('🏷️ Initializing default groups...');
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
      console.log('✅ Default groups initialized');
    }
  }, [isSignedIn, user, isInitialized, groups.length]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isInitialized || !isSignedIn || !user) {
        console.log('⏳ Skipping initial data load - not ready', { isInitialized, isSignedIn, hasUser: !!user });
        return;
      }

      try {
        console.log('📊 Loading initial data...');
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          console.log('📦 Mock mode - skipping database data load');
          return;
        }
        
        await Promise.all([
          loadTransactions(),
          loadCategories()
        ]);
        console.log('✅ Initial data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        handleError(error, 'carregamento inicial de dados');
      }
    };

    loadInitialData();
  }, [isInitialized, isSignedIn, user]);

  // Transações com filtros melhorados
  const loadTransactions = async (filters?: TransactionFilters, pagination?: PaginationOptions) => {
    if (!isInitialized) {
      console.log('⏳ Transactions load skipped - not initialized');
      return;
    }
    
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.log('📦 Mock mode: Using local transactions data');
      return;
    }
    
    console.log('📊 Loading transactions from database...');
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const result = await databaseService.getTransactions(filters, pagination, getToken);
      if (result.success && result.data) {
        setTransactions(result.data);
        console.log('✅ Transactions loaded:', result.data.length);
      } else {
        throw new Error(result.error || 'Erro ao carregar transações');
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      handleError(error, 'carregamento de transações');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      console.log('➕ Adding transaction:', transaction);
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - add to local state
        console.log('📦 Mock mode: Adding transaction locally');
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          userId: user?.id
        };
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('Transação criada com sucesso! (Modo demonstração)');
        console.log('✅ Transaction added in mock mode');
        return;
      }
      
      const newTransaction = await createTransaction(
        transaction, 
        user!.id, 
        user!.emailAddresses[0]?.emailAddress,
        getToken
      );
      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transação criada com sucesso!');
      console.log('✅ Transaction added to database');
    } catch (error) {
      handleError(error, 'criação de transação');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - update local state
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        toast.success('Transação atualizada com sucesso! (Modo demonstração)');
        return;
      }
      
      const updatedTransaction = await updateTransaction(id, updates, user!.id, getToken);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
      toast.success('Transação atualizada com sucesso!');
    } catch (error) {
      handleError(error, 'atualização de transação');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - remove from local state
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso! (Modo demonstração)');
        return;
      }
      
      await deleteTransaction(id, user!.id, getToken);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      handleError(error, 'exclusão de transação');
      throw error;
    }
  };

  // Categorias
  const loadCategories = async (type?: 'income' | 'expense') => {
    if (!isInitialized) {
      console.log('⏳ Categories load skipped - not initialized');
      return;
    }
    
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
      console.log('📦 Mock mode: Using local categories data');
      return;
    }
    
    console.log('🏷️ Loading categories from database...');
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const result = await databaseService.getCategories(type, getToken);
      if (result.success && result.data) {
        setCategories(result.data);
        console.log('✅ Categories loaded:', result.data.length);
      } else {
        throw new Error(result.error || 'Erro ao carregar categorias');
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      handleError(error, 'carregamento de categorias');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - add to local state
        const newCategory: Category = {
          ...category,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          userId: user?.id
        };
        setCategories(prev => [newCategory, ...prev]);
        toast.success('Categoria criada com sucesso! (Modo demonstração)');
        return;
      }
      
      const newCategory = await createCategory(
        category, 
        user!.id, 
        user!.emailAddresses[0]?.emailAddress,
        getToken
      );
      setCategories(prev => [newCategory, ...prev]);
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      handleError(error, 'criação de categoria');
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - update local state
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        toast.success('Categoria atualizada com sucesso! (Modo demonstração)');
        return;
      }
      
      const updatedCategory = await updateCategory(id, updates, user!.id, getToken);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Categoria atualizada com sucesso!');
    } catch (error) {
      handleError(error, 'atualização de categoria');
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Verificar se a categoria está sendo usada
      const isUsed = transactions.some(t => t.subcategory === categories.find(c => c.id === id)?.name);
      if (isUsed) {
        throw new Error('Esta categoria está sendo usada em transações e não pode ser excluída.');
      }
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - remove from local state
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success('Categoria excluída com sucesso! (Modo demonstração)');
        return;
      }
      
      await deleteCategory(id, user!.id, getToken);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria excluída com sucesso!');
    } catch (error) {
      handleError(error, 'exclusão de categoria');
      throw error;
    }
  };

  // Estatísticas financeiras
  const getFinancialSummary = async (dateFrom?: string, dateTo?: string) => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - calculate from local data
        const summary = {
          totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
          transactionCount: transactions.length,
          incomeByCategory: {},
          expensesByCategory: {}
        };
        return summary;
      }
      
      const result = await databaseService.getFinancialSummary(dateFrom, dateTo, getToken);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao buscar resumo financeiro');
      }
    } catch (error) {
      handleError(error, 'busca de resumo financeiro');
      return null;
    }
  };

  // Backup de dados do usuário
  const exportUserData = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || isMockMode) {
        // Mock mode - export local data
        const exportData = {
          exportDate: new Date().toISOString(),
          userId: user?.id,
          transactions,
          categories,
          payables,
          version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestfin-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Dados exportados com sucesso! (Modo demonstração)');
        return;
      }
      
      const result = await databaseService.exportUserData(getToken);
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestfin-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Dados exportados com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao exportar dados');
      }
    } catch (error) {
      handleError(error, 'exportação de dados');
    }
  };

  // Verificação de limites do plano
  const getCurrentPlanLimits = () => {
    if (!userSubscription?.price_id) {
      return getFreePlan()?.limits || { transactions: 25, users: 1, categories: 10 };
    }
    
    const currentProduct = stripeProducts.find(p => p.priceId === userSubscription.price_id && p.mode === 'subscription');
    return currentProduct?.limits || { transactions: 25, users: 1, categories: 10 };
  };

  const checkPlanLimits = async (action: 'transaction' | 'category' | 'user') => {
    const limits = getCurrentPlanLimits();
    
    switch (action) {
      case 'transaction':
        if (limits.transactions === 'unlimited') return true;
        const transactionCount = transactions.length;
        if (transactionCount >= limits.transactions) {
          toast.error(
            language === 'pt' 
              ? `Limite de ${limits.transactions} transações atingido. Faça upgrade para continuar.`
              : `Limit of ${limits.transactions} transactions reached. Upgrade to continue.`
          );
          return false;
        }
        return true;
        
      case 'category':
        if (limits.categories === 'unlimited') return true;
        const categoryCount = categories.length;
        if (categoryCount >= limits.categories) {
          toast.error(
            language === 'pt' 
              ? `Limite de ${limits.categories} categorias atingido. Faça upgrade para continuar.`
              : `Limit of ${limits.categories} categories reached. Upgrade to continue.`
          );
          return false;
        }
        return true;
        
      case 'user':
        if (limits.users === 'unlimited') return true;
        // Implementar verificação de usuários quando necessário
        return true;
        
      default:
        return true;
    }
  };

  // Implementações mock para outras funcionalidades
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
    if (id === 'empresa' || id === 'familia') {
      toast.error('Não é possível excluir grupos padrão');
      return;
    }
    setGroups(prev => prev.filter(g => g.id !== id));
    toast.success('Grupo excluído com sucesso!');
  };

  // Mock implementations for other entities
  const addPayable = async (payable: Omit<Payable, 'id'>) => {
    const newPayable: Payable = { ...payable, id: Date.now().toString() };
    setPayables(prev => [newPayable, ...prev]);
    toast.success('Conta a pagar criada com sucesso!');
  };

  const updatePayable = async (id: string, payable: Partial<Payable>) => {
    setPayables(prev => prev.map(p => p.id === id ? { ...p, ...payable } : p));
    toast.success('Conta a pagar atualizada com sucesso!');
  };

  const deletePayable = async (id: string) => {
    setPayables(prev => prev.filter(p => p.id !== id));
    toast.success('Conta a pagar excluída com sucesso!');
  };

  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = { ...investment, id: Date.now().toString() };
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

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { ...budget, id: Date.now().toString() };
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

  const addGoal = async (goal: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = { ...goal, id: Date.now().toString() };
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
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loadCategories,
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
    getFinancialSummary,
    exportUserData,
    error,
    clearError,
    checkPlanLimits,
    getCurrentPlanLimits
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