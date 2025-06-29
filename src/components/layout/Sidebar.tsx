import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Tags, 
  CreditCard, 
  PiggyBank, 
  Settings, 
  Menu, 
  X, 
  Building2, 
  Users, 
  Shield, 
  Crown, 
  Bell, 
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@clerk/clerk-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'income', label: 'Entradas', icon: TrendingUp },
  { id: 'expenses', label: 'Despesas', icon: TrendingDown },
  { id: 'cashflow', label: 'Fluxo', icon: BarChart3 },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'payables', label: 'Contas a Pagar', icon: CreditCard },
  { id: 'investments', label: 'Investimentos', icon: PiggyBank },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'management', label: 'Gestão Financeira', icon: Settings },
  { id: 'subscription', label: 'Assinatura', icon: Crown }
];

const adminMenuItems = [
  { id: 'admin-users', label: 'Usuários', icon: Users },
  { id: 'admin-system', label: 'Sistema', icon: Shield }
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  const isAdmin = user?.publicMetadata?.role === 'admin';

  if (!isSignedIn) return null;

  const handleNavigation = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
    
    // Handle special routes
    if (tabId === 'subscription-success') {
      window.history.pushState({}, '', '/subscription/success');
    } else if (tabId === 'subscription-cancel') {
      window.history.pushState({}, '', '/subscription/cancel');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "sidebar-fixed w-64 transform bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-blue-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Gestfin</h1>
              <p className="text-xs text-blue-200">Gestão Financeira</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200",
                    activeTab === item.id
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="border-t border-blue-700 my-4 pt-4">
                  <p className="text-xs text-blue-300 font-medium mb-2 px-3">ADMINISTRAÇÃO</p>
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200",
                          activeTab === item.id
                            ? "bg-white/20 text-white shadow-lg"
                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-blue-700 p-4">
            <p className="text-xs text-blue-200 text-center">
              © 2024 Gestfin
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}