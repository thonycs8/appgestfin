import { useAuth, useUser } from '@clerk/clerk-react';
import { useCallback } from 'react';
import { createAuthenticatedSupabaseClient } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  role: 'user' | 'admin' | 'manager';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt?: string;
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Hook personalizado para autenticação
export function useAuthUser() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const ensureSupabaseAuth = useCallback(async () => {
    if (!isSignedIn || !user) {
      console.log('❌ ensureSupabaseAuth: User not authenticated');
      throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
    }

    try {
      console.log('🔑 Getting Supabase token...');
      const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);
      
      console.log('✅ Supabase authentication successful');
      return authenticatedSupabase;
    } catch (error) {
      console.error('❌ ensureSupabaseAuth failed:', error);
      if (error instanceof AuthError) throw error;
      throw new AuthError('Authentication setup failed', 'SETUP_ERROR');
    }
  }, [isSignedIn, user, getToken]);

  const syncUserToSupabase = useCallback(async () => {
    if (!isSignedIn || !user) return;

    try {
      console.log('👤 Syncing user to Supabase...', { userId: user.id, email: user.emailAddresses[0]?.emailAddress });
      const authenticatedSupabase = await ensureSupabaseAuth();

      const userData = {
        id: user.id,
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName,
        last_name: user.lastName,
        username: user.username,
        avatar_url: user.imageUrl,
        phone: user.phoneNumbers[0]?.phoneNumber,
        email_verified: user.emailAddresses[0]?.verification?.status === 'verified',
        phone_verified: user.phoneNumbers[0]?.verification?.status === 'verified',
        role: (user.publicMetadata?.role as string) || 'user',
        is_active: true,
        last_sign_in_at: new Date().toISOString(),
        metadata: {
          clerk_metadata: user.publicMetadata,
          unsafe_metadata: user.unsafeMetadata,
        },
      };

      console.log('💾 Upserting user data to Supabase...');
      const { error } = await authenticatedSupabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });

      if (error) {
        console.error('❌ Error syncing user to Supabase:', error);
        throw new AuthError('Failed to sync user data', 'SYNC_ERROR');
      }

      console.log('✅ User synced to Supabase successfully');
      return userData;
    } catch (error) {
      console.error('❌ Error in syncUserToSupabase:', error);
      throw error;
    }
  }, [isSignedIn, user, ensureSupabaseAuth]);

  const getAuthUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!isSignedIn || !user) return null;

    try {
      console.log('👤 Getting auth user data...');
      const authenticatedSupabase = await ensureSupabaseAuth();

      const { data, error } = await authenticatedSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se o usuário não existe, sincronizar
        if (error.code === 'PGRST116') {
          console.log('👤 User not found in database, syncing...');
          await syncUserToSupabase();
          return getAuthUser(); // Tentar novamente
        }
        throw new AuthError('Failed to get user data', 'USER_FETCH_ERROR');
      }

      console.log('✅ Auth user data retrieved successfully');
      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        username: data.username,
        imageUrl: data.avatar_url,
        role: data.role,
        isActive: data.is_active,
        emailVerified: data.email_verified,
        createdAt: data.created_at,
        lastSignInAt: data.last_sign_in_at,
      };
    } catch (error) {
      console.error('❌ Error getting auth user:', error);
      return null;
    }
  }, [isSignedIn, user, ensureSupabaseAuth, syncUserToSupabase]);

  const updateUserRole = useCallback(async (userId: string, role: 'user' | 'admin' | 'manager') => {
    try {
      const authenticatedSupabase = await ensureSupabaseAuth();

      const { error } = await authenticatedSupabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new AuthError('Failed to update user role', 'ROLE_UPDATE_ERROR');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }, [ensureSupabaseAuth]);

  const getUserStats = useCallback(async () => {
    try {
      const authenticatedSupabase = await ensureSupabaseAuth();

      const { data, error } = await authenticatedSupabase
        .rpc('get_user_financial_stats');

      if (error) {
        throw new AuthError('Failed to get user stats', 'STATS_ERROR');
      }

      return data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }, [ensureSupabaseAuth]);

  return {
    isLoaded,
    isSignedIn,
    user,
    ensureSupabaseAuth,
    syncUserToSupabase,
    getAuthUser,
    updateUserRole,
    getUserStats,
  };
}

// Função para verificar permissões
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user || !user.isActive) return false;

  const rolePermissions = {
    admin: ['*'], // Admin tem todas as permissões
    manager: [
      'read:transactions',
      'create:transactions',
      'update:transactions',
      'delete:transactions',
      'read:categories',
      'create:categories',
      'update:categories',
      'read:payables',
      'create:payables',
      'update:payables',
      'delete:payables',
      'read:reports',
    ],
    user: [
      'read:transactions',
      'create:transactions',
      'update:own:transactions',
      'delete:own:transactions',
      'read:categories',
      'create:categories',
      'update:own:categories',
      'read:payables',
      'create:payables',
      'update:own:payables',
    ],
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

// Função para verificar se é admin
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin' && user?.isActive === true;
}

// Função para verificar se é manager ou admin
export function isManagerOrAdmin(user: AuthUser | null): boolean {
  return user?.isActive === true && (user?.role === 'admin' || user?.role === 'manager');
}