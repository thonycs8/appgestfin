import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { createRobustSupabaseClient } from './supabase';
import { Transaction, Category, Payable } from '@/types';

// Query Keys - centralizados para melhor organização
export const queryKeys = {
  transactions: ['transactions'] as const,
  transactionsByType: (type: string) => ['transactions', type] as const,
  categories: ['categories'] as const,
  categoriesByType: (type: string) => ['categories', type] as const,
  payables: ['payables'] as const,
  payablesByStatus: (status: string) => ['payables', status] as const,
  workouts: ['workouts'] as const,
  workoutById: (id: string) => ['workouts', id] as const,
  userProfile: ['userProfile'] as const,
  financialSummary: ['financialSummary'] as const,
} as const;

// Hook personalizado para obter cliente Supabase autenticado
function useSupabaseClient() {
  const { getToken, userId } = useAuth();
  
  return async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return createRobustSupabaseClient(getToken, userId);
  };
}

// ==================== TRANSAÇÕES ====================

export function useTransactions(filters?: { type?: 'income' | 'expense'; category?: string }) {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();

  return useQuery({
    queryKey: filters?.type 
      ? queryKeys.transactionsByType(filters.type)
      : queryKeys.transactions,
    queryFn: async (): Promise<Transaction[]> => {
      console.log('🔄 Fetching transactions with TanStack Query...');
      
      const supabase = await getSupabase();
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      console.log('✅ Transactions fetched successfully:', data?.length || 0);

      return (data || []).map(item => ({
        id: item.id,
        type: item.type,
        category: item.category,
        subcategory: item.subcategory,
        amount: parseFloat(item.amount.toString()),
        description: item.description,
        date: item.date,
        status: item.status,
        userId: item.user_id
      }));
    },
    enabled: !!userId, // Só executa se o usuário estiver autenticado
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useCreateTransaction() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
      console.log('➕ Creating transaction with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const transactionData = {
        type: transaction.type,
        category: transaction.category || 'geral',
        subcategory: transaction.subcategory || 'Sem categoria',
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        status: transaction.status || 'completed',
        user_id: userId
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating transaction:', error);
        throw new Error(`Failed to create transaction: ${error.message}`);
      }

      console.log('✅ Transaction created successfully:', data.id);

      return {
        id: data.id,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        amount: parseFloat(data.amount.toString()),
        description: data.description,
        date: data.date,
        status: data.status,
        userId: data.user_id
      };
    },
    onSuccess: (newTransaction) => {
      // Invalidar e refetch das queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.transactionsByType(newTransaction.type) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.financialSummary });
      
      // Adicionar otimisticamente à cache
      queryClient.setQueryData(queryKeys.transactions, (old: Transaction[] | undefined) => {
        return old ? [newTransaction, ...old] : [newTransaction];
      });
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error);
    }
  });
}

export function useUpdateTransaction() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Transaction> 
    }): Promise<Transaction> => {
      console.log('✏️ Updating transaction with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const updateData: any = {};
      if (updates.type) updateData.type = updates.type;
      if (updates.category) updateData.category = updates.category;
      if (updates.subcategory) updateData.subcategory = updates.subcategory;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description) updateData.description = updates.description;
      if (updates.date) updateData.date = updates.date;
      if (updates.status) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating transaction:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      console.log('✅ Transaction updated successfully:', id);

      return {
        id: data.id,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        amount: parseFloat(data.amount.toString()),
        description: data.description,
        date: data.date,
        status: data.status,
        userId: data.user_id
      };
    },
    onSuccess: (updatedTransaction) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.transactionsByType(updatedTransaction.type) 
      });
      
      // Atualizar otimisticamente na cache
      queryClient.setQueryData(queryKeys.transactions, (old: Transaction[] | undefined) => {
        return old?.map(t => t.id === updatedTransaction.id ? updatedTransaction : t) || [];
      });
    }
  });
}

export function useDeleteTransaction() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deleting transaction with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting transaction:', error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }

      console.log('✅ Transaction deleted successfully:', id);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.financialSummary });
      
      // Remover otimisticamente da cache
      queryClient.setQueryData(queryKeys.transactions, (old: Transaction[] | undefined) => {
        return old?.filter(t => t.id !== deletedId) || [];
      });
    }
  });
}

// ==================== CATEGORIAS ====================

export function useCategories(type?: 'income' | 'expense') {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();

  return useQuery({
    queryKey: type ? queryKeys.categoriesByType(type) : queryKeys.categories,
    queryFn: async (): Promise<Category[]> => {
      console.log('🏷️ Fetching categories with TanStack Query...');
      
      const supabase = await getSupabase();
      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching categories:', error);
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }

      console.log('✅ Categories fetched successfully:', data?.length || 0);

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        color: item.color,
        isActive: item.is_active,
        createdAt: item.created_at,
        userId: item.user_id
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos - categorias mudam menos
  });
}

export function useCreateCategory() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
      console.log('➕ Creating category with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const categoryData = {
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
        is_active: category.isActive !== undefined ? category.isActive : true,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating category:', error);
        throw new Error(`Failed to create category: ${error.message}`);
      }

      console.log('✅ Category created successfully:', data.id);

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        isActive: data.is_active,
        createdAt: data.created_at,
        userId: data.user_id
      };
    },
    onSuccess: (newCategory) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categoriesByType(newCategory.type) 
      });
      
      // Adicionar otimisticamente à cache
      queryClient.setQueryData(queryKeys.categories, (old: Category[] | undefined) => {
        return old ? [newCategory, ...old] : [newCategory];
      });
    }
  });
}

// ==================== WORKOUTS (EXEMPLO SOLICITADO) ====================

interface Workout {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: string[];
  created_at: string;
  user_id: string;
}

export function useWorkouts() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.workouts,
    queryFn: async (): Promise<Workout[]> => {
      console.log('💪 Fetching workouts with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching workouts:', error);
        throw new Error(`Failed to fetch workouts: ${error.message}`);
      }

      console.log('✅ Workouts fetched successfully:', data?.length || 0);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

export function useWorkout(id: string) {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.workoutById(id),
    queryFn: async (): Promise<Workout> => {
      console.log('💪 Fetching workout by ID with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching workout:', error);
        throw new Error(`Failed to fetch workout: ${error.message}`);
      }

      console.log('✅ Workout fetched successfully:', data.id);

      return data;
    },
    enabled: !!userId && !!id,
  });
}

export function useCreateWorkout() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'created_at' | 'user_id'>): Promise<Workout> => {
      console.log('➕ Creating workout with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const workoutData = {
        name: workout.name,
        description: workout.description,
        duration: workout.duration,
        difficulty: workout.difficulty,
        exercises: workout.exercises,
        user_id: userId
      };

      const { data, error } = await supabase
        .from('workouts')
        .insert([workoutData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating workout:', error);
        throw new Error(`Failed to create workout: ${error.message}`);
      }

      console.log('✅ Workout created successfully:', data.id);

      return data;
    },
    onSuccess: (newWorkout) => {
      // Invalidar e refetch da lista de workouts
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
      
      // Adicionar otimisticamente à cache
      queryClient.setQueryData(queryKeys.workouts, (old: Workout[] | undefined) => {
        return old ? [newWorkout, ...old] : [newWorkout];
      });
    },
    onError: (error) => {
      console.error('❌ Workout creation failed:', error);
    }
  });
}

export function useUpdateWorkout() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Workout> 
    }): Promise<Workout> => {
      console.log('✏️ Updating workout with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating workout:', error);
        throw new Error(`Failed to update workout: ${error.message}`);
      }

      console.log('✅ Workout updated successfully:', id);

      return data;
    },
    onSuccess: (updatedWorkout) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.workoutById(updatedWorkout.id) 
      });
      
      // Atualizar otimisticamente na cache
      queryClient.setQueryData(queryKeys.workouts, (old: Workout[] | undefined) => {
        return old?.map(w => w.id === updatedWorkout.id ? updatedWorkout : w) || [];
      });
    }
  });
}

export function useDeleteWorkout() {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deleting workout with TanStack Query...');
      
      const supabase = await getSupabase();
      
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting workout:', error);
        throw new Error(`Failed to delete workout: ${error.message}`);
      }

      console.log('✅ Workout deleted successfully:', id);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts });
      
      // Remover otimisticamente da cache
      queryClient.setQueryData(queryKeys.workouts, (old: Workout[] | undefined) => {
        return old?.filter(w => w.id !== deletedId) || [];
      });
    }
  });
}

// ==================== RESUMO FINANCEIRO ====================

export function useFinancialSummary(dateFrom?: string, dateTo?: string) {
  const { userId } = useAuth();
  const getSupabase = useSupabaseClient();

  return useQuery({
    queryKey: [...queryKeys.financialSummary, dateFrom, dateTo],
    queryFn: async () => {
      console.log('📊 Fetching financial summary with TanStack Query...');
      
      const supabase = await getSupabase();
      
      let query = supabase
        .from('transactions')
        .select('type, amount, category')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch financial summary: ${error.message}`);
      }

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: data?.length || 0,
        incomeByCategory: {} as Record<string, number>,
        expensesByCategory: {} as Record<string, number>
      };

      data?.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
          summary.totalIncome += amount;
          summary.incomeByCategory[transaction.category] = 
            (summary.incomeByCategory[transaction.category] || 0) + amount;
        } else {
          summary.totalExpenses += amount;
          summary.expensesByCategory[transaction.category] = 
            (summary.expensesByCategory[transaction.category] || 0) + amount;
        }
      });

      summary.netProfit = summary.totalIncome - summary.totalExpenses;

      console.log('✅ Financial summary calculated successfully');
      return summary;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}