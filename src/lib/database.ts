import { supabase, checkRateLimit, sanitizeInput, validateAmount, validateDate, RATE_LIMITS } from './supabase';
import { Transaction, Category, Payable } from '@/types';
import { DatabaseError, ValidationError, RateLimitError } from '@/lib/errorHandling';
import { trackDatabaseOperation, addBreadcrumb } from '@/lib/sentry';

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, userEmail?: string) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser && userEmail) {
      // Create user record if it doesn't exist
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          created_at: new Date().toISOString()
        });

      if (createError && createError.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating user:', createError);
        throw new DatabaseError('Failed to create user record', createError.code, {
          operation: 'ensure_user_exists',
          userId,
          userEmail,
        });
      }
      
      addBreadcrumb('User record created in database', 'database');
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Failed to verify user existence', undefined, {
      operation: 'ensure_user_exists',
      userId,
      originalError: error,
    });
  }
}

// Transactions
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>,
  userId: string,
  userEmail?: string
): Promise<Transaction> {
  const startTime = Date.now();
  
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
    ...transaction,
    description: sanitizeInput(transaction.description),
    subcategory: sanitizeInput(transaction.subcategory),
    user_id: userId
  };

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([sanitizedTransaction])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create transaction: ${error.message}`, error.code, {
        operation: 'create_transaction',
        table: 'transactions',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('create', 'transactions', true, Date.now() - startTime);
    addBreadcrumb('Transaction created in database', 'database');
    
    return data;
  } catch (error) {
    trackDatabaseOperation('create', 'transactions', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating transaction', undefined, {
      operation: 'create_transaction',
      originalError: error,
    });
  }
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch transactions: ${error.message}`, error.code, {
        operation: 'get_transactions',
        table: 'transactions',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('select', 'transactions', true, Date.now() - startTime);
    return data || [];
  } catch (error) {
    trackDatabaseOperation('select', 'transactions', false, Date.now() - startTime);
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

  const sanitizedUpdates = {
    ...updates,
    ...(updates.description && { description: sanitizeInput(updates.description) }),
    ...(updates.subcategory && { subcategory: sanitizeInput(updates.subcategory) })
  };

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update transaction: ${error.message}`, error.code, {
        operation: 'update_transaction',
        table: 'transactions',
        userId,
        transactionId: id,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('update', 'transactions', true, Date.now() - startTime);
    addBreadcrumb('Transaction updated in database', 'database');
    
    return data;
  } catch (error) {
    trackDatabaseOperation('update', 'transactions', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating transaction', undefined, {
      operation: 'update_transaction',
      originalError: error,
    });
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to delete transaction: ${error.message}`, error.code, {
        operation: 'delete_transaction',
        table: 'transactions',
        userId,
        transactionId: id,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('delete', 'transactions', true, Date.now() - startTime);
    addBreadcrumb('Transaction deleted from database', 'database');
  } catch (error) {
    trackDatabaseOperation('delete', 'transactions', false, Date.now() - startTime);
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
  
  if (!checkRateLimit(`categories:${userId}`, RATE_LIMITS.CATEGORIES_PER_MINUTE)) {
    throw new RateLimitError('Too many category requests. Please try again later.');
  }

  // Ensure user exists
  await ensureUserExists(userId, userEmail);

  const sanitizedCategory = {
    ...category,
    name: sanitizeInput(category.name),
    user_id: userId,
    is_active: true,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([sanitizedCategory])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create category: ${error.message}`, error.code, {
        operation: 'create_category',
        table: 'categories',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('create', 'categories', true, Date.now() - startTime);
    addBreadcrumb('Category created in database', 'database');
    
    return data;
  } catch (error) {
    trackDatabaseOperation('create', 'categories', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating category', undefined, {
      operation: 'create_category',
      originalError: error,
    });
  }
}

export async function getCategories(userId: string): Promise<Category[]> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`, error.code, {
        operation: 'get_categories',
        table: 'categories',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('select', 'categories', true, Date.now() - startTime);
    return data || [];
  } catch (error) {
    trackDatabaseOperation('select', 'categories', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching categories', undefined, {
      operation: 'get_categories',
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
    ...payable,
    description: sanitizeInput(payable.description),
    supplier: payable.supplier ? sanitizeInput(payable.supplier) : null,
    user_id: userId,
    due_date: payable.dueDate
  };

  try {
    const { data, error } = await supabase
      .from('payables')
      .insert([sanitizedPayable])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create payable: ${error.message}`, error.code, {
        operation: 'create_payable',
        table: 'payables',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('create', 'payables', true, Date.now() - startTime);
    addBreadcrumb('Payable created in database', 'database');
    
    return data;
  } catch (error) {
    trackDatabaseOperation('create', 'payables', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating payable', undefined, {
      operation: 'create_payable',
      originalError: error,
    });
  }
}

export async function getPayables(userId: string): Promise<Payable[]> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch payables: ${error.message}`, error.code, {
        operation: 'get_payables',
        table: 'payables',
        userId,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('select', 'payables', true, Date.now() - startTime);
    return data || [];
  } catch (error) {
    trackDatabaseOperation('select', 'payables', false, Date.now() - startTime);
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

  const sanitizedUpdates = {
    ...updates,
    ...(updates.description && { description: sanitizeInput(updates.description) }),
    ...(updates.supplier && { supplier: sanitizeInput(updates.supplier) }),
    ...(updates.dueDate && { due_date: updates.dueDate })
  };

  try {
    const { data, error } = await supabase
      .from('payables')
      .update(sanitizedUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update payable: ${error.message}`, error.code, {
        operation: 'update_payable',
        table: 'payables',
        userId,
        payableId: id,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('update', 'payables', true, Date.now() - startTime);
    addBreadcrumb('Payable updated in database', 'database');
    
    return data;
  } catch (error) {
    trackDatabaseOperation('update', 'payables', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating payable', undefined, {
      operation: 'update_payable',
      originalError: error,
    });
  }
}

export async function deletePayable(id: string, userId: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('payables')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to delete payable: ${error.message}`, error.code, {
        operation: 'delete_payable',
        table: 'payables',
        userId,
        payableId: id,
        duration: Date.now() - startTime,
      });
    }

    trackDatabaseOperation('delete', 'payables', true, Date.now() - startTime);
    addBreadcrumb('Payable deleted from database', 'database');
  } catch (error) {
    trackDatabaseOperation('delete', 'payables', false, Date.now() - startTime);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting payable', undefined, {
      operation: 'delete_payable',
      originalError: error,
    });
  }
}