import { useAuth, useUser } from '@clerk/clerk-react';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthUser, AuthUser } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireManager?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireManager = false,
  fallback 
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { getAuthUser } = useAuthUser();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthUser = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        console.log('⏳ ProtectedRoute: Auth not ready', { isLoaded, isSignedIn, hasUser: !!user });
        setLoading(false);
        return;
      }

      try {
        console.log('🔐 ProtectedRoute: Loading auth user data...');
        const userData = await getAuthUser();
        setAuthUser(userData);
        console.log('✅ ProtectedRoute: Auth user loaded:', userData?.id);
      } catch (error) {
        console.error('❌ ProtectedRoute: Error loading auth user:', error);
        setAuthUser(null);
      } finally {
        console.log('🏁 ProtectedRoute: Loading complete');
        setLoading(false);
      }
    };

    loadAuthUser();
  }, [isLoaded, isSignedIn, user, getAuthUser]);

  // Loading state
  if (!isLoaded || loading) {
    console.log('⏳ ProtectedRoute: Showing loading spinner');
    return fallback || <LoadingSpinner />;
  }

  // Not signed in
  if (!isSignedIn) {
    console.log('❌ ProtectedRoute: User not signed in');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // User not active
  if (authUser && !authUser.isActive) {
    console.log('❌ ProtectedRoute: User account inactive');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta Inativa</h2>
          <p className="text-gray-600 mb-6">Sua conta foi desativada. Entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  // Admin required but user is not admin
  if (requireAdmin && authUser?.role !== 'admin') {
    console.log('❌ ProtectedRoute: Admin access required but user is not admin');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você não tem permissão de administrador para acessar esta página.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Manager required but user is not manager or admin
  if (requireManager && !['admin', 'manager'].includes(authUser?.role || '')) {
    console.log('❌ ProtectedRoute: Manager access required but user lacks permissions');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você não tem permissão de gerente para acessar esta página.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
}