import { useState } from 'react';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LandingPage } from '@/components/landing/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
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
import { AppProvider } from '@/contexts/AppContext';
import './App.css';

const pageComponents = {
  dashboard: Dashboard,
  income: Income,
  expenses: Expenses,
  cashflow: Dashboard, // Placeholder
  categories: Categories,
  payables: Payables,
  investments: Dashboard, // Placeholder
  management: Management,
  subscription: Subscription,
  'subscription-success': SubscriptionSuccess,
  'subscription-cancel': SubscriptionCancel,
  'admin-users': AdminUsers,
  'admin-system': AdminSystem
};

const pageTitles = {
  pt: {
    dashboard: 'Dashboard',
    income: 'Receitas',
    expenses: 'Despesas',
    cashflow: 'Fluxo de Caixa',
    categories: 'Categorias',
    payables: 'Contas a Pagar',
    investments: 'Investimentos',
    management: 'Gestão Financeira',
    subscription: 'Assinatura',
    'subscription-success': 'Assinatura Confirmada',
    'subscription-cancel': 'Assinatura Cancelada',
    'admin-users': 'Gerenciar Usuários',
    'admin-system': 'Sistema'
  },
  en: {
    dashboard: 'Dashboard',
    income: 'Income',
    expenses: 'Expenses',
    cashflow: 'Cash Flow',
    categories: 'Categories',
    payables: 'Payables',
    investments: 'Investments',
    management: 'Financial Management',
    subscription: 'Subscription',
    'subscription-success': 'Subscription Confirmed',
    'subscription-cancel': 'Subscription Cancelled',
    'admin-users': 'Manage Users',
    'admin-system': 'System'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoaded } = useAuth();
  const { user } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <>
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
      </>
    </AppProvider>
  );
}

function AppContent({ activeTab, setActiveTab, user }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  user: any;
}) {
  const PageComponent = pageComponents[activeTab as keyof typeof pageComponents];
  const isAdminPage = activeTab.startsWith('admin-');
  const isFullPageRoute = ['subscription-success', 'subscription-cancel'].includes(activeTab);

  // Handle URL-based routing for success/cancel pages
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path === '/subscription/success' && activeTab !== 'subscription-success') {
      setActiveTab('subscription-success');
    } else if (path === '/subscription/cancel' && activeTab !== 'subscription-cancel') {
      setActiveTab('subscription-cancel');
    }
  }

  return (
    <AppProvider>
      {({ language }) => {
        const pageTitle = pageTitles[language][activeTab as keyof typeof pageTitles.pt] || activeTab;
        
        // Full page routes (success/cancel) don't need sidebar/header
        if (isFullPageRoute) {
          return <PageComponent />;
        }
        
        return (
          <ProtectedRoute requireAdmin={isAdminPage}>
            <div className="flex h-screen bg-gray-50">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              
              <div className="flex-1 flex flex-col">
                <div className="md:ml-64">
                  <Header title={pageTitle} />
                  
                  <main className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="w-full p-6">
                      <PageComponent />
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        );
      }}
    </AppProvider>
  );
}

export default App;