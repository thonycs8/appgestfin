import { supabase, checkRateLimit, sanitizeInput, validateAmount, validateDate, RATE_LIMITS } from './supabase';
import { Transaction, Category, Payable } from '@/types';

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

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
      }
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
  }
}

// Transactions
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>,
  userId: string,
  userEmail?: string
): Promise<Transaction> {
  if (!checkRateLimit(`transactions:${userId}`, RATE_LIMITS.TRANSACTIONS_PER_MINUTE)) {
    throw new RateLimitError('Too many transaction requests. Please try again later.');
  }

  // Validation
  if (!validateAmount(transaction.amount)) {
    throw new ValidationError('Invalid amount');
  }

  if (!validateDate(transaction.date)) {
    throw new ValidationError('Invalid date');
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
      throw new DatabaseError(`Failed to create transaction: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating transaction');
  }
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch transactions: ${error.message}`, error.code);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching transactions');
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
  userId: string
): Promise<Transaction> {
  if (!checkRateLimit(`transactions:${userId}`, RATE_LIMITS.TRANSACTIONS_PER_MINUTE)) {
    throw new RateLimitError('Too many transaction requests. Please try again later.');
  }

  // Validation
  if (updates.amount && !validateAmount(updates.amount)) {
    throw new ValidationError('Invalid amount');
  }

  if (updates.date && !validateDate(updates.date)) {
    throw new ValidationError('Invalid date');
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
      throw new DatabaseError(`Failed to update transaction: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating transaction');
  }
}

export async function deleteTransaction(id: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to delete transaction: ${error.message}`, error.code);
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting transaction');
  }
}

// Categories
export async function createCategory(
  category: Omit<Category, 'id' | 'createdAt'>,
  userId: string,
  userEmail?: string
): Promise<Category> {
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
      throw new DatabaseError(`Failed to create category: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating category');
  }
}

export async function getCategories(userId: string): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`, error.code);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching categories');
  }
}

// Payables
export async function createPayable(
  payable: Omit<Payable, 'id'>,
  userId: string,
  userEmail?: string
): Promise<Payable> {
  if (!checkRateLimit(`payables:${userId}`, RATE_LIMITS.PAYABLES_PER_MINUTE)) {
    throw new RateLimitError('Too many payable requests. Please try again later.');
  }

  if (!validateAmount(payable.amount)) {
    throw new ValidationError('Invalid amount');
  }

  if (!validateDate(payable.dueDate)) {
    throw new ValidationError('Invalid due date');
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
      throw new DatabaseError(`Failed to create payable: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error creating payable');
  }
}

export async function getPayables(userId: string): Promise<Payable[]> {
  try {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch payables: ${error.message}`, error.code);
    }

    return data || [];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error fetching payables');
  }
}

export async function updatePayable(
  id: string,
  updates: Partial<Payable>,
  userId: string
): Promise<Payable> {
  if (!checkRateLimit(`payables:${userId}`, RATE_LIMITS.PAYABLES_PER_MINUTE)) {
    throw new RateLimitError('Too many payable requests. Please try again later.');
  }

  // Validation
  if (updates.amount && !validateAmount(updates.amount)) {
    throw new ValidationError('Invalid amount');
  }

  if (updates.dueDate && !validateDate(updates.dueDate)) {
    throw new ValidationError('Invalid due date');
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
      throw new DatabaseError(`Failed to update payable: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error updating payable');
  }
}

export async function deletePayable(id: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('payables')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to delete payable: ${error.message}`, error.code);
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Unexpected error deleting payable');
  }
}