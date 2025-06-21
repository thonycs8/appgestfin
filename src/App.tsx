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
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/ui/theme-provider';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="gestfin-ui-theme">
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
    </ThemeProvider>
  );
}

function AppContent({ activeTab, setActiveTab, user }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  user: any;
}) {
  const PageComponent = pageComponents[activeTab as keyof typeof pageComponents];
  const isAdminPage = activeTab.startsWith('admin-');

  return (
    <AppProvider>
      {({ language }) => {
        const pageTitle = pageTitles[language][activeTab as keyof typeof pageTitles.pt] || activeTab;
        
        return (
          <ProtectedRoute requireAdmin={isAdminPage}>
            <div className="flex h-screen bg-background">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              
              <div className="flex-1 flex flex-col md:ml-64">
                <Header title={pageTitle} />
                
                <main className="flex-1 overflow-y-auto p-6">
                  <PageComponent />
                </main>
              </div>
            </div>
          </ProtectedRoute>
        );
      }}
    </AppProvider>
  );
}

export default App;