import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Adicionado useCallback
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
  updateCategory as dbUpdateCategory,
  updatePayable as dbUpdatePayable,
  deleteTransaction as dbDeleteTransaction,
  deleteCategory as dbDeleteCategory,
  deletePayable as dbDeletePayable
} from '@/lib/database';
import { 
  DatabaseError,
  ValidationError,
  RateLimitError,
  withErrorHandling, 
  FinancialError 
} from '@/lib/errorHandling';
import { supabase } from '@/lib/supabase'; // Certifique-se que 'supabase' é a instância do cliente Supabase
import { toast } from 'sonner';

interface AppContextType {
  // ... (o restante da sua interface AppContextType permanece o mesmo)
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
  error: string | null;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode | ((context: { language: Language }) => ReactNode) }) {
  const [language, setLanguage] = useState<Language>('pt');
  const { getToken, isSignedIn, isLoaded: clerkLoaded } = useAuth(); // Renomeado isLoaded para evitar conflito
  const { user, isLoaded: userLoaded } = useUser(); // Renomeado isLoaded para evitar conflito
  
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
  const [isInitialized, setIsInitialized] = useState(false); // Indica se a autenticação Supabase foi configurada

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

  // NOVA FUNÇÃO: Garante que a sessão Supabase esteja autenticada com o token mais recente do Clerk
  const ensureSupabaseAuth = useCallback(async () => {
    if (!clerkLoaded || !userLoaded) {
      console.warn('🔐 Clerk not fully loaded yet. Cannot ensure Supabase auth.');
      throw new Error('AuthSessionMissingError: Clerk not ready.');
    }
    if (!isSignedIn || !user) {
      console.log('🔐 User not signed in. Cannot ensure Supabase auth.');
      throw new Error('AuthSessionMissingError: User not signed in.');
    }

    try {
      // Obter o token JWT mais recente do Clerk
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('❌ No JWT token received from Clerk (ensureSupabaseAuth).');
        throw new Error('AuthSessionMissingError: No JWT token available from Clerk.');
      }
      
      // Definir a sessão no cliente Supabase
      // Isso é crucial para que as chamadas subsequentes ao DB sejam autenticadas
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '', // Clerk gerencia o refresh
      });

      if (setSessionError) {
        console.error('❌ Error setting Supabase session in ensureSupabaseAuth:', setSessionError);
        throw setSessionError;
      }
      
      console.log('✅ Supabase session ensured with Clerk JWT.');
      return { userId: user.id, jwt: token };
    } catch (error) {
      console.error('❌ Error in ensureSupabaseAuth:', error);
      throw error; // Re-lança o erro para ser tratado pela função chamadora
    }
  }, [clerkLoaded, userLoaded, isSignedIn, user, getToken]); // Dependências para useCallback

  // useEffect para inicializar a sessão Supabase UMA VEZ ao carregar o app ou autenticar
  useEffect(() => {
    const initializeAuthAndData = async () => {
      // isLoaded (do useAuth) e userLoaded (do useUser) garantem que o Clerk carregou.
      if (!clerkLoaded || !userLoaded) {
        console.log('🔐 Clerk not loaded, skipping initial Supabase auth setup.');
        return;
      }

      if (!isSignedIn) {
        console.log('🔐 User not signed in. Skipping initial Supabase auth setup and data load.');
        setIsInitialized(false); // Garante que isInitialized seja false se não estiver logado
        return;
      }

      try {
        console.log('🔐 Initializing Supabase auth and loading initial data...');
        // Chama ensureSupabaseAuth para garantir a sessão antes de carregar os dados iniciais
        await ensureSupabaseAuth(); 
        
        console.log('✅ Initial Supabase session set. Starting data load.');
        setIsInitialized(true); // Marca como inicializado após configurar a sessão

      } catch (error) {
        console.error('❌ Error during initial Supabase setup:', error);
        setError('Erro na inicialização da autenticação. Tente fazer login novamente.');
        setIsInitialized(false); // Falhou na inicialização
      }
    };

    initializeAuthAndData();
  }, [clerkLoaded, userLoaded, isSignedIn, ensureSupabaseAuth]);


  // Initialize default groups (Mantido o mesmo)
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

  // Initialize mock budgets and goals (Mantido o mesmo)
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
      // Agora dependemos de `isInitialized` para garantir que o Supabase já está configurado
      if (!isInitialized || !isSignedIn || !user) {
        console.log('🔄 Skipping data load - not ready:', { isSignedIn, user: !!user, isInitialized });
        return;
      }

      console.log('📊 Loading data for user:', user.id);

      try {
        // A sessão do Supabase já deveria estar configurada pelo ensureSupabaseAuth inicial
        // Não precisamos de supabase.auth.getUser() aqui, pois já foi feito no ensureSupabaseAuth
        // (a menos que você queira validar novamente, mas isso pode ser redundante e custoso)
        // Se `ensureSupabaseAuth` falhar, `isInitialized` será `false`.

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
  }, [isInitialized, isSignedIn, user, ensureSupabaseAuth]); // Adicione ensureSupabaseAuth como dependência

  // Enhanced transaction CRUD with better auth handling
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para adicionar transações.');
        throw new Error('User not authenticated');
    }
    
    try {
      // 1. Garante que a sessão Supabase está autenticada com o token mais recente do Clerk
      await ensureSupabaseAuth(); 
      
      console.log('✅ Auth verified before transaction creation, user:', user.id);
      
      await withErrorHandling('create_transaction', async () => {
        // user.id e user.emailAddresses[0]?.emailAddress já vêm do Clerk e podem ser passados
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para atualizar transações.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para excluir transações.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para adicionar categorias.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para atualizar categorias.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
      await withErrorHandling('update_category', async () => {
        const updatedCategory = await dbUpdateCategory(id, category, user.id);
        setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
        toast.success('Categoria atualizada com sucesso!');
      }, {
        type: 'data',
        operation: 'update_category',
        userId: user.id,
        categoryId: id,
      });
    } catch (error) {
      handleError(error, 'atualização de categoria');
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para excluir categorias.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
      await withErrorHandling('delete_category', async () => {
        await dbDeleteCategory(id, user.id);
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success('Categoria excluída com sucesso!');
      }, {
        type: 'data',
        operation: 'delete_category',
        userId: user.id,
        categoryId: id,
      });
    } catch (error) {
      handleError(error, 'exclusão de categoria');
      throw error;
    }
  };

  // Group CRUD (continuam sendo mock, não precisam de ensureSupabaseAuth se não acessam o DB)
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

  // Payable CRUD
  const addPayable = async (payable: Omit<Payable, 'id'>) => {
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para adicionar contas a pagar.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para atualizar contas a pagar.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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
    if (!user) {
        toast.error('Usuário não autenticado. Faça login para excluir contas a pagar.');
        throw new Error('User not authenticated');
    }
    
    try {
      await ensureSupabaseAuth(); // Garante a autenticação Supabase
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

  // Investment CRUD (mock)
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