import { createAuthenticatedSupabaseClient } from './supabase';
import { useAuth } from '@clerk/clerk-react';
import { Transaction, Category } from '@/types';
import { AuthError } from './auth';

export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  subcategory?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: string;
}

class DatabaseService {
  private async getSupabaseClient() {
    const { getToken } = useAuth();
    return createAuthenticatedSupabaseClient(getToken);
  }

  private async ensureAuth(): Promise<string> {
    const supabase = await this.getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AuthError('Authentication required', 'NOT_AUTHENTICATED');
    }
    
    return user.id;
  }

  // Transações com filtros e paginação melhorados
  async getTransactions(
    filters: TransactionFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResponse<Transaction[]>> {
    try {
      const userId = await this.ensureAuth();
      const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      // Aplicar filtros
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      
      if (filters.amountMin !== undefined) {
        query = query.gte('amount', filters.amountMin);
      }
      
      if (filters.amountMax !== undefined) {
        query = query.lte('amount', filters.amountMax);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Aplicar ordenação e paginação
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      const transactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        category: item.category,
        subcategory: item.subcategory,
        amount: item.amount,
        description: item.description,
        date: item.date,
        status: item.status,
        userId: item.user_id
      }));

      return { data: transactions, error: null, success: true };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<DatabaseResponse<Transaction>> {
    try {
      const userId = await this.ensureAuth();

      // Validações
      if (!transaction.description?.trim()) {
        return { data: null, error: 'Descrição é obrigatória', success: false };
      }

      if (!transaction.amount || transaction.amount <= 0) {
        return { data: null, error: 'Valor deve ser maior que zero', success: false };
      }

      if (!transaction.date) {
        return { data: null, error: 'Data é obrigatória', success: false };
      }

      const transactionData = {
        type: transaction.type,
        category: transaction.category || 'geral',
        subcategory: transaction.subcategory || 'Sem categoria',
        amount: transaction.amount,
        description: transaction.description.trim(),
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
        return { data: null, error: error.message, success: false };
      }

      const newTransaction: Transaction = {
        id: data.id,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        amount: data.amount,
        description: data.description,
        date: data.date,
        status: data.status,
        userId: data.user_id
      };

      return { data: newTransaction, error: null, success: true };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao criar transação', 
        success: false 
      };
    }
  }

  async updateTransaction(
    id: string, 
    updates: Partial<Transaction>
  ): Promise<DatabaseResponse<Transaction>> {
    try {
      const userId = await this.ensureAuth();

      // Validações
      if (updates.amount !== undefined && updates.amount <= 0) {
        return { data: null, error: 'Valor deve ser maior que zero', success: false };
      }

      if (updates.description !== undefined && !updates.description.trim()) {
        return { data: null, error: 'Descrição não pode estar vazia', success: false };
      }

      const updateData: any = {};
      
      if (updates.type) updateData.type = updates.type;
      if (updates.category) updateData.category = updates.category;
      if (updates.subcategory) updateData.subcategory = updates.subcategory;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description) updateData.description = updates.description.trim();
      if (updates.date) updateData.date = updates.date;
      if (updates.status) updateData.status = updates.status;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data) {
        return { data: null, error: 'Transação não encontrada', success: false };
      }

      const updatedTransaction: Transaction = {
        id: data.id,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        amount: data.amount,
        description: data.description,
        date: data.date,
        status: data.status,
        userId: data.user_id
      };

      return { data: updatedTransaction, error: null, success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar transação', 
        success: false 
      };
    }
  }

  async deleteTransaction(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const userId = await this.ensureAuth();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao excluir transação', 
        success: false 
      };
    }
  }

  // Categorias com melhor validação
  async getCategories(type?: 'income' | 'expense'): Promise<DatabaseResponse<Category[]>> {
    try {
      const userId = await this.ensureAuth();
      
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
        return { data: null, error: error.message, success: false };
      }

      const categories: Category[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        color: item.color,
        userId: item.user_id,
        isActive: item.is_active,
        createdAt: item.created_at
      }));

      return { data: categories, error: null, success: true };
    } catch (error) {
      console.error('Error getting categories:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao buscar categorias', 
        success: false 
      };
    }
  }

  async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<DatabaseResponse<Category>> {
    try {
      const userId = await this.ensureAuth();

      // Validações
      if (!category.name?.trim()) {
        return { data: null, error: 'Nome da categoria é obrigatório', success: false };
      }

      if (!category.type || !['income', 'expense'].includes(category.type)) {
        return { data: null, error: 'Tipo da categoria deve ser "income" ou "expense"', success: false };
      }

      // Verificar se já existe uma categoria com o mesmo nome e tipo
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', category.name.trim())
        .eq('type', category.type)
        .single();

      if (existing) {
        return { data: null, error: 'Já existe uma categoria com este nome e tipo', success: false };
      }

      const categoryData = {
        name: category.name.trim(),
        type: category.type,
        color: category.color || '#3b82f6',
        user_id: userId,
        is_active: category.isActive !== undefined ? category.isActive : true
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        color: data.color,
        userId: data.user_id,
        isActive: data.is_active,
        createdAt: data.created_at
      };

      return { data: newCategory, error: null, success: true };
    } catch (error) {
      console.error('Error creating category:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao criar categoria', 
        success: false 
      };
    }
  }

  // Estatísticas financeiras
  async getFinancialSummary(dateFrom?: string, dateTo?: string): Promise<DatabaseResponse<any>> {
    try {
      const userId = await this.ensureAuth();
      
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
        return { data: null, error: error.message, success: false };
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
        if (transaction.type === 'income') {
          summary.totalIncome += transaction.amount;
          summary.incomeByCategory[transaction.category] = 
            (summary.incomeByCategory[transaction.category] || 0) + transaction.amount;
        } else {
          summary.totalExpenses += transaction.amount;
          summary.expensesByCategory[transaction.category] = 
            (summary.expensesByCategory[transaction.category] || 0) + transaction.amount;
        }
      });

      summary.netProfit = summary.totalIncome - summary.totalExpenses;

      return { data: summary, error: null, success: true };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao buscar resumo financeiro', 
        success: false 
      };
    }
  }

  // Backup de dados do usuário
  async exportUserData(): Promise<DatabaseResponse<any>> {
    try {
      const userId = await this.ensureAuth();
      
      const [transactions, categories, payables] = await Promise.all([
        this.getTransactions(),
        this.getCategories(),
        supabase.from('payables').select('*').eq('user_id', userId)
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        transactions: transactions.data,
        categories: categories.data,
        payables: payables.data,
        version: '1.0'
      };

      return { data: exportData, error: null, success: true };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro ao exportar dados', 
        success: false 
      };
    }
  }
}

export const databaseService = new DatabaseService();