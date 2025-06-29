import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import { Transaction, Category, Payable, Investment, Group, Budget, FinancialGoal } from '@/types';
import { useAuthUser } from '@/lib/auth';
import { databaseService, TransactionFilters, PaginationOptions } from '@/lib/database-enhanced';
import { toast } from 'sonner';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode | ((context: { language: Language }) => ReactNode) }) {
  const [language, setLanguage] = useState<Language>('pt');
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
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
      if (!clerkLoaded || !userLoaded) {
        return;
      }

      if (!isSignedIn || !user) {
        setIsInitialized(false);
        return;
      }

      try {
        console.log('🔐 Initializing authentication and syncing user...');
        await ensureSupabaseAuth();
        await syncUserToSupabase();
        setIsInitialized(true);
        console.log('✅ Authentication initialized successfully');
      } catch (error) {
        console.error('❌ Error during authentication initialization:', error);
        setError('Erro na inicialização da autenticação. Tente fazer login novamente.');
        setIsInitialized(false);
      }
    };

    initializeAuth();
  }, [clerkLoaded, userLoaded, isSignedIn, user, ensureSupabaseAuth, syncUserToSupabase]);

  // Inicializar grupos padrão
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

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isInitialized || !isSignedIn || !user) {
        return;
      }

      try {
        await Promise.all([
          loadTransactions(),
          loadCategories()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        handleError(error, 'carregamento inicial de dados');
      }
    };

    loadInitialData();
  }, [isInitialized, isSignedIn, user]);

  // Transações com filtros melhorados
  const loadTransactions = async (filters?: TransactionFilters, pagination?: PaginationOptions) => {
    if (!isInitialized) return;
    
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const result = await databaseService.getTransactions(filters, pagination);
      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar transações');
      }
    } catch (error) {
      handleError(error, 'carregamento de transações');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const result = await databaseService.createTransaction(transaction);
      if (result.success && result.data) {
        setTransactions(prev => [result.data!, ...prev]);
        toast.success('Transação criada com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar transação');
      }
    } catch (error) {
      handleError(error, 'criação de transação');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const result = await databaseService.updateTransaction(id, updates);
      if (result.success && result.data) {
        setTransactions(prev => prev.map(t => t.id === id ? result.data! : t));
        toast.success('Transação atualizada com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao atualizar transação');
      }
    } catch (error) {
      handleError(error, 'atualização de transação');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const result = await databaseService.deleteTransaction(id);
      if (result.success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao excluir transação');
      }
    } catch (error) {
      handleError(error, 'exclusão de transação');
      throw error;
    }
  };

  // Categorias
  const loadCategories = async (type?: 'income' | 'expense') => {
    if (!isInitialized) return;
    
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const result = await databaseService.getCategories(type);
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar categorias');
      }
    } catch (error) {
      handleError(error, 'carregamento de categorias');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      const result = await databaseService.createCategory(category);
      if (result.success && result.data) {
        setCategories(prev => [result.data!, ...prev]);
        toast.success('Categoria criada com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      handleError(error, 'criação de categoria');
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      // Implementar quando necessário
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
      
      // Implementar exclusão no banco
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
      const result = await databaseService.getFinancialSummary(dateFrom, dateTo);
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

  const exportUserData = async () => {
    try {
      const result = await databaseService.exportUserData();
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