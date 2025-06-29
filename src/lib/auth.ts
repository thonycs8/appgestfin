import { useAuth, useUser } from '@clerk/clerk-react';
import { supabase } from './supabase';

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

  const ensureSupabaseAuth = async () => {
    if (!isSignedIn || !user) {
      throw new AuthError('User not authenticated', 'NOT_AUTHENTICATED');
    }

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new AuthError('Failed to get authentication token', 'TOKEN_ERROR');
      }

      const { error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });

      if (error) {
        throw new AuthError(`Supabase auth error: ${error.message}`, 'SUPABASE_ERROR');
      }

      return token;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Authentication setup failed', 'SETUP_ERROR');
    }
  };

  const syncUserToSupabase = async () => {
    if (!isSignedIn || !user) return;

    try {
      await ensureSupabaseAuth();

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

      const { error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });

      if (error) {
        console.error('Error syncing user to Supabase:', error);
        throw new AuthError('Failed to sync user data', 'SYNC_ERROR');
      }

      return userData;
    } catch (error) {
      console.error('Error in syncUserToSupabase:', error);
      throw error;
    }
  };

  const getAuthUser = async (): Promise<AuthUser | null> => {
    if (!isSignedIn || !user) return null;

    try {
      await ensureSupabaseAuth();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se o usuário não existe, sincronizar
        if (error.code === 'PGRST116') {
          await syncUserToSupabase();
          return getAuthUser(); // Tentar novamente
        }
        throw new AuthError('Failed to get user data', 'USER_FETCH_ERROR');
      }

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
      console.error('Error getting auth user:', error);
      return null;
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'manager') => {
    try {
      await ensureSupabaseAuth();

      const { error } = await supabase
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
  };

  const getUserStats = async () => {
    try {
      await ensureSupabaseAuth();

      const { data, error } = await supabase
        .rpc('get_user_financial_stats');

      if (error) {
        throw new AuthError('Failed to get user stats', 'STATS_ERROR');
      }

      return data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  };

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