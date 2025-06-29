import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LandingPage } from '@/components/landing/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { Calendary } from '@/pages/Calendary';
import { Income } from '@/pages/Income';
import { Expenses } from '@/pages/Expenses';
import { Payables } from '@/pages/Payables';
import { Categories } from '@/pages/Categories';
import { Management } from '@/pages/Management';
import { AdminUsers } from '@/pages/AdminUsers';
import { AdminSystem } from '@/pages/AdminSystem';
import { Subscription } from '@/pages/Subscription';
import { SubscriptionSuccess } from '@/pages/SubscriptionSuccess';
import { SubscriptionCancel } from '@/pages/SubscriptionCancel';
import { Alerts } from '@/pages/Alerts';
import { TermsOfService } from '@/components/legal/TermsOfService';
import { PrivacyPolicy } from '@/components/legal/PrivacyPolicy';
import { GDPRCompliance } from '@/components/legal/GDPRCompliance';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import './App.css';

const pageComponents = {
  dashboard: Dashboard,
  calendar: Calendary,
  income: Income,
  expenses: Expenses,
  cashflow: Dashboard, // Placeholder
  categories: Categories,
  payables: Payables,
  investments: Dashboard, // Placeholder
  alerts: Alerts,
  management: Management,
  subscription: Subscription,
  'subscription-success': SubscriptionSuccess,
  'subscription-cancel': SubscriptionCancel,
  'admin-users': AdminUsers,
  'admin-system': AdminSystem,
  'terms': TermsOfService,
  'privacy': PrivacyPolicy,
  'gdpr': GDPRCompliance
};

const pageTitles = {
  pt: {
    dashboard: 'Dashboard',
    calendar: 'Calendário Financeiro',
    income: 'Receitas',
    expenses: 'Despesas',
    cashflow: 'Fluxo de Caixa',
    categories: 'Categorias',
    payables: 'Contas a Pagar',
    investments: 'Investimentos',
    alerts: 'Central de Alertas',
    management: 'Gestão Financeira',
    subscription: 'Assinatura',
    'subscription-success': 'Assinatura Confirmada',
    'subscription-cancel': 'Assinatura Cancelada',
    'admin-users': 'Gerenciar Usuários',
    'admin-system': 'Sistema',
    'terms': 'Termos de Serviço',
    'privacy': 'Política de Privacidade',
    'gdpr': 'Conformidade GDPR'
  },
  en: {
    dashboard: 'Dashboard',
    calendar: 'Financial Calendar',
    income: 'Income',
    expenses: 'Expenses',
    cashflow: 'Cash Flow',
    categories: 'Categories',
    payables: 'Payables',
    investments: 'Investments',
    alerts: 'Alerts Center',
    management: 'Financial Management',
    subscription: 'Subscription',
    'subscription-success': 'Subscription Confirmed',
    'subscription-cancel': 'Subscription Cancelled',
    'admin-users': 'Manage Users',
    'admin-system': 'System',
    'terms': 'Terms of Service',
    'privacy': 'Privacy Policy',
    'gdpr': 'GDPR Compliance'
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Oops! Algo deu errado
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">Detalhes do erro (dev)</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Debug logging
  useEffect(() => {
    console.log('App state:', { isLoaded, isSignedIn, user: user?.id });
  }, [isLoaded, isSignedIn, user]);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <SignedOut>
          <LandingPage />
        </SignedOut>

        <SignedIn>
          <AppContent 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            user={user}
          />
        </SignedIn>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

function AppContent({ activeTab, setActiveTab, user }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  user: any;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useApp();
  
  useEffect(() => {
    // Simulate loading time and then show content
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('AppContent state:', { activeTab, user: user?.id, language, isLoading });
  }, [activeTab, user, language, isLoading]);

  const PageComponent = pageComponents[activeTab as keyof typeof pageComponents];
  const isAdminPage = activeTab.startsWith('admin-');
  const isFullPageRoute = ['subscription-success', 'subscription-cancel', 'terms', 'privacy', 'gdpr'].includes(activeTab);

  // Handle URL-based routing for special pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/subscription/success' && activeTab !== 'subscription-success') {
        setActiveTab('subscription-success');
      } else if (path === '/subscription/cancel' && activeTab !== 'subscription-cancel') {
        setActiveTab('subscription-cancel');
      } else if (path === '/terms' && activeTab !== 'terms') {
        setActiveTab('terms');
      } else if (path === '/privacy' && activeTab !== 'privacy') {
        setActiveTab('privacy');
      } else if (path === '/gdpr' && activeTab !== 'gdpr') {
        setActiveTab('gdpr');
      }
    }
  }, [activeTab, setActiveTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  if (!PageComponent) {
    console.error('Page component not found for:', activeTab);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Página não encontrada</h2>
          <p className="text-gray-600 mb-6">A página solicitada não existe.</p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pageTitle = pageTitles[language][activeTab as keyof typeof pageTitles.pt] || activeTab;
  
  // Full page routes don't need sidebar/header
  if (isFullPageRoute) {
    return (
      <ErrorBoundary>
        <PageComponent />
      </ErrorBoundary>
    );
  }
  
  return (
    <ErrorBoundary>
      <ProtectedRoute requireAdmin={isAdminPage}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex-1 flex flex-col">
            <div className="md:ml-64">
              <Header title={pageTitle} />
              
              <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="w-full p-6">
                  <ErrorBoundary>
                    <PageComponent />
                  </ErrorBoundary>
                </div>
              </main>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}

export default App;