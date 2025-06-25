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
import { Alerts } from '@/pages/Alerts';
import { TermsOfService } from '@/components/legal/TermsOfService';
import { PrivacyPolicy } from '@/components/legal/PrivacyPolicy';
import { GDPRCompliance } from '@/components/legal/GDPRCompliance';
import { AppProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

const pageComponents = {
  dashboard: Dashboard,
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
        <Toaster />
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
  const isFullPageRoute = ['subscription-success', 'subscription-cancel', 'terms', 'privacy', 'gdpr'].includes(activeTab);

  // Handle URL-based routing for special pages
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

  return (
    <AppProvider>
      {({ language }) => {
        const pageTitle = pageTitles[language][activeTab as keyof typeof pageTitles.pt] || activeTab;
        
        // Full page routes don't need sidebar/header
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