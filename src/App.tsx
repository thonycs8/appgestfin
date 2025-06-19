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
  dashboard: 'Dashboard',
  income: 'Entradas',
  expenses: 'Despesas',
  cashflow: 'Fluxo de Caixa',
  categories: 'Categorias',
  payables: 'Contas a Pagar',
  investments: 'Investimentos',
  management: 'Gestão Financeira',
  'admin-users': 'Gerenciar Usuários',
  'admin-system': 'Sistema'
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoaded } = useAuth();
  const { user } = useUser();
  
  const PageComponent = pageComponents[activeTab as keyof typeof pageComponents];
  const pageTitle = pageTitles[activeTab as keyof typeof pageTitles];
  const isAdminPage = activeTab.startsWith('admin-');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <ProtectedRoute requireAdmin={isAdminPage}>
          <div className="flex h-screen bg-gray-50">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="flex-1 flex flex-col md:ml-64">
              <Header title={pageTitle} />
              
              <main className="flex-1 overflow-y-auto p-6">
                <PageComponent />
              </main>
            </div>
          </div>
        </ProtectedRoute>
      </SignedIn>
    </>
  );
}

export default App;