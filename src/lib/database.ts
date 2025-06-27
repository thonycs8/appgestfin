import { supabase, checkRateLimit, sanitizeInput, validateAmount, validateDate, RATE_LIMITS } from './supabase';
import { Transaction, Category, Payable } from '@/types';
import { DatabaseError, ValidationError, RateLimitError } from '@/lib/errorHandling';

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, userEmail?: string) {
  try {
    console.log('🔧 Ensuring user exists:', userId);
    
    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (checkError || !existingUser) {
      // User doesn't exist, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail || `${userId}@clerk.local`
        });
        
      if (insertError) {
        console.warn('⚠️ Warning creating user record:', insertError);
      } else {
        console.log('✅ Created new user record for:', userId);
      }
    } else {
      console.log('✅ User record already exists for:', userId);
    }
  } catch (error) {
    console.warn('⚠️ Error ensuring user exists:', error);
    // Don't throw error, just log warning - the RLS policies should handle this
  }
}

// Helper function to verify authentication before operations
async function verifyAuth(userId: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('❌ Auth verification failed:', authError);
      throw new Error('Authentication required');
    }
    
    console.log('✅ Auth verified for operation, user:', authData.user.id);
    return authData.user;
  } catch (error) {
    console.error('❌ Auth verification error:', error);
    throw new Error('Authentication required');
  }
}

// Transactions
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>,
  userId: string,
  userEmail?: string
): Promise<Transaction> {
  const startTime = Date.now();
  
  console.log('📝 Creating transaction for user:', userId);
  
  if (!checkRateLimit(`transactions:${userId}`, RATE_LIMITS.TRANSACTIONS_PER_MINUTE)) {
    throw new RateLimitError('Too many transaction requests. Please try again later.');
  }

  // Validation
  if (!validateAmount(transaction.amount)) {
    throw new ValidationError('Invalid amount', 'amount', { amount: transaction.amount });
  }

  if (!validateDate(transaction.date)) {
    throw new ValidationError('Invalid date', 'date', { date: transaction.date });
  }

  // Ensure user exists
  await ensureUserExists(userId, userEmail);

  const sanitizedTransaction = {
    type: transaction.type,
    category: transaction.category,
    subcategory: sanitizeInput(transaction.subcategory),
    amount: transaction.amount,
    description: sanitizeInput(transaction.description),
    date: transaction.date,
    status: transaction.status || 'completed',
    user_id: userId
  };

  try {
    console.log('💾 Inserting transaction into database...');
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([sanitizedTransaction])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating transaction:', error);
      throw new DatabaseError(`Failed to create transaction: ${error.message}`, error.code, {
        operation: 'create_transaction',
        table: 'transactions',
        userId,
        duration: Date.now() - startTime,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('✅ Transaction created successfully:', data.id);
    
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      amount: data.amount,
      description: data.description,
      date: data.date,
      status: data.status
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating transaction', undefined, {
      operation: 'create_transaction',
      originalError: error,
    });
  }
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const startTime = Date.now();
  
  console.log('📊 Fetching transactions for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error fetching transactions:', error);
      throw new DatabaseError(`Failed to fetch transactions: ${error.message}`, error.code, {
        operation: 'get_transactions',
        table: 'transactions',
        userId,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Fetched transactions successfully:', data?.length || 0);
    
    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      category: item.category,
      subcategory: item.subcategory,
      amount: item.amount,
      description: item.description,
      date: item.date,
      status: item.status
    }));
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching transactions', undefined, {
      operation: 'get_transactions',
      originalError: error,
    });
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
  userId: string
): Promise<Transaction> {
  const startTime = Date.now();
  
  console.log('✏️ Updating transaction:', id, 'for user:', userId);
  
  if (!checkRateLimit(`transactions:${userId}`, RATE_LIMITS.TRANSACTIONS_PER_MINUTE)) {
    throw new RateLimitError('Too many transaction requests. Please try again later.');
  }

  // Validation
  if (updates.amount && !validateAmount(updates.amount)) {
    throw new ValidationError('Invalid amount', 'amount', { amount: updates.amount });
  }

  if (updates.date && !validateDate(updates.date)) {
    throw new ValidationError('Invalid date', 'date', { date: updates.date });
  }

  const sanitizedUpdates: any = {};
  
  if (updates.type) sanitizedUpdates.type = updates.type;
  if (updates.category) sanitizedUpdates.category = updates.category;
  if (updates.subcategory) sanitizedUpdates.subcategory = sanitizeInput(updates.subcategory);
  if (updates.amount !== undefined) sanitizedUpdates.amount = updates.amount;
  if (updates.description) sanitizedUpdates.description = sanitizeInput(updates.description);
  if (updates.date) sanitizedUpdates.date = updates.date;
  if (updates.status) sanitizedUpdates.status = updates.status;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error updating transaction:', error);
      throw new DatabaseError(`Failed to update transaction: ${error.message}`, error.code, {
        operation: 'update_transaction',
        table: 'transactions',
        userId,
        transactionId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Transaction updated successfully:', id);
    
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      amount: data.amount,
      description: data.description,
      date: data.date,
      status: data.status
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating transaction', undefined, {
      operation: 'update_transaction',
      originalError: error,
    });
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  const startTime = Date.now();
  
  console.log('🗑️ Deleting transaction:', id, 'for user:', userId);
  
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Database error deleting transaction:', error);
      throw new DatabaseError(`Failed to delete transaction: ${error.message}`, error.code, {
        operation: 'delete_transaction',
        table: 'transactions',
        userId,
        transactionId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Transaction deleted successfully:', id);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting transaction', undefined, {
      operation: 'delete_transaction',
      originalError: error,
    });
  }
}

// Categories
export async function createCategory(
  category: Omit<Category, 'id' | 'createdAt'>,
  userId: string,
  userEmail?: string
): Promise<Category> {
  const startTime = Date.now();
  
  console.log('📝 Creating category for user:', userId);
  
  if (!checkRateLimit(`categories:${userId}`, RATE_LIMITS.CATEGORIES_PER_MINUTE)) {
    throw new RateLimitError('Too many category requests. Please try again later.');
  }

  // Ensure user exists
  await ensureUserExists(userId, userEmail);

  const sanitizedCategory = {
    name: sanitizeInput(category.name),
    type: category.type,
    color: category.color || '#000000',
    user_id: userId,
    is_active: category.isActive !== undefined ? category.isActive : true
  };

  try {
    console.log('💾 Inserting category into database...');
    
    // Use upsert to avoid conflicts
    const { data, error } = await supabase
      .from('categories')
      .upsert([sanitizedCategory], { 
        onConflict: 'user_id,name,type',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating category:', error);
      throw new DatabaseError(`Failed to create category: ${error.message}`, error.code, {
        operation: 'create_category',
        table: 'categories',
        userId,
        duration: Date.now() - startTime,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('✅ Category created successfully:', data.id);
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      color: data.color,
      isActive: data.is_active,
      createdAt: data.created_at
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating category', undefined, {
      operation: 'create_category',
      originalError: error,
    });
  }
}

export async function getCategories(userId: string): Promise<Category[]> {
  const startTime = Date.now();
  
  console.log('📊 Fetching categories for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error fetching categories:', error);
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`, error.code, {
        operation: 'get_categories',
        table: 'categories',
        userId,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Fetched categories successfully:', data?.length || 0);
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.color,
      isActive: item.is_active,
      createdAt: item.created_at
    }));
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching categories', undefined, {
      operation: 'get_categories',
      originalError: error,
    });
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>,
  userId: string
): Promise<Category> {
  const startTime = Date.now();
  
  console.log('✏️ Updating category:', id, 'for user:', userId);
  
  if (!checkRateLimit(`categories:${userId}`, RATE_LIMITS.CATEGORIES_PER_MINUTE)) {
    throw new RateLimitError('Too many category requests. Please try again later.');
  }

  const sanitizedUpdates: any = {};
  
  if (updates.name) sanitizedUpdates.name = sanitizeInput(updates.name);
  if (updates.type) sanitizedUpdates.type = updates.type;
  if (updates.color) sanitizedUpdates.color = updates.color;
  if (updates.isActive !== undefined) sanitizedUpdates.is_active = updates.isActive;

  try {
    const { data, error } = await supabase
      .from('categories')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error updating category:', error);
      throw new DatabaseError(`Failed to update category: ${error.message}`, error.code, {
        operation: 'update_category',
        table: 'categories',
        userId,
        categoryId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Category updated successfully:', id);
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      color: data.color,
      isActive: data.is_active,
      createdAt: data.created_at
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating category', undefined, {
      operation: 'update_category',
      originalError: error,
    });
  }
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const startTime = Date.now();
  
  console.log('🗑️ Deleting category:', id, 'for user:', userId);
  
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Database error deleting category:', error);
      throw new DatabaseError(`Failed to delete category: ${error.message}`, error.code, {
        operation: 'delete_category',
        table: 'categories',
        userId,
        categoryId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Category deleted successfully:', id);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting category', undefined, {
      operation: 'delete_category',
      originalError: error,
    });
  }
}

// Payables
export async function createPayable(
  payable: Omit<Payable, 'id'>,
  userId: string,
  userEmail?: string
): Promise<Payable> {
  const startTime = Date.now();
  
  console.log('📝 Creating payable for user:', userId);
  
  if (!checkRateLimit(`payables:${userId}`, RATE_LIMITS.PAYABLES_PER_MINUTE)) {
    throw new RateLimitError('Too many payable requests. Please try again later.');
  }

  if (!validateAmount(payable.amount)) {
    throw new ValidationError('Invalid amount', 'amount', { amount: payable.amount });
  }

  if (!validateDate(payable.dueDate)) {
    throw new ValidationError('Invalid due date', 'dueDate', { dueDate: payable.dueDate });
  }

  // Ensure user exists
  await ensureUserExists(userId, userEmail);

  const sanitizedPayable = {
    description: sanitizeInput(payable.description),
    amount: payable.amount,
    due_date: payable.dueDate,
    category: payable.category,
    status: payable.status || 'pending',
    supplier: payable.supplier ? sanitizeInput(payable.supplier) : null,
    user_id: userId
  };

  try {
    console.log('💾 Inserting payable into database...');
    
    const { data, error } = await supabase
      .from('payables')
      .insert([sanitizedPayable])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error creating payable:', error);
      throw new DatabaseError(`Failed to create payable: ${error.message}`, error.code, {
        operation: 'create_payable',
        table: 'payables',
        userId,
        duration: Date.now() - startTime,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('✅ Payable created successfully:', data.id);
    
    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      dueDate: data.due_date,
      category: data.category,
      status: data.status,
      supplier: data.supplier
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating payable', undefined, {
      operation: 'create_payable',
      originalError: error,
    });
  }
}

export async function getPayables(userId: string): Promise<Payable[]> {
  const startTime = Date.now();
  
  console.log('📊 Fetching payables for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('❌ Database error fetching payables:', error);
      throw new DatabaseError(`Failed to fetch payables: ${error.message}`, error.code, {
        operation: 'get_payables',
        table: 'payables',
        userId,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Fetched payables successfully:', data?.length || 0);
    
    return (data || []).map(item => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      dueDate: item.due_date,
      category: item.category,
      status: item.status,
      supplier: item.supplier
    }));
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching payables', undefined, {
      operation: 'get_payables',
      originalError: error,
    });
  }
}

export async function updatePayable(
  id: string,
  updates: Partial<Payable>,
  userId: string
): Promise<Payable> {
  const startTime = Date.now();
  
  console.log('✏️ Updating payable:', id, 'for user:', userId);
  
  if (!checkRateLimit(`payables:${userId}`, RATE_LIMITS.PAYABLES_PER_MINUTE)) {
    throw new RateLimitError('Too many payable requests. Please try again later.');
  }

  // Validation
  if (updates.amount && !validateAmount(updates.amount)) {
    throw new ValidationError('Invalid amount', 'amount', { amount: updates.amount });
  }

  if (updates.dueDate && !validateDate(updates.dueDate)) {
    throw new ValidationError('Invalid due date', 'dueDate', { dueDate: updates.dueDate });
  }

  const sanitizedUpdates: any = {};
  
  if (updates.description) sanitizedUpdates.description = sanitizeInput(updates.description);
  if (updates.amount !== undefined) sanitizedUpdates.amount = updates.amount;
  if (updates.dueDate) sanitizedUpdates.due_date = updates.dueDate;
  if (updates.category) sanitizedUpdates.category = updates.category;
  if (updates.status) sanitizedUpdates.status = updates.status;
  if (updates.supplier !== undefined) sanitizedUpdates.supplier = updates.supplier ? sanitizeInput(updates.supplier) : null;

  try {
    const { data, error } = await supabase
      .from('payables')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error updating payable:', error);
      throw new DatabaseError(`Failed to update payable: ${error.message}`, error.code, {
        operation: 'update_payable',
        table: 'payables',
        userId,
        payableId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Payable updated successfully:', id);
    
    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      dueDate: data.due_date,
      category: data.category,
      status: data.status,
      supplier: data.supplier
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating payable', undefined, {
      operation: 'update_payable',
      originalError: error,
    });
  }
}

export async function deletePayable(id: string, userId: string): Promise<void> {
  const startTime = Date.now();
  
  console.log('🗑️ Deleting payable:', id, 'for user:', userId);
  
  try {
    const { error } = await supabase
      .from('payables')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Database error deleting payable:', error);
      throw new DatabaseError(`Failed to delete payable: ${error.message}`, error.code, {
        operation: 'delete_payable',
        table: 'payables',
        userId,
        payableId: id,
        duration: Date.now() - startTime,
      });
    }
    
    console.log('✅ Payable deleted successfully:', id);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting payable', undefined, {
      operation: 'delete_payable',
      originalError: error,
    });
  }
}