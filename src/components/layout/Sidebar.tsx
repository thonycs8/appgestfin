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
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@clerk/clerk-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'income', label: 'Entradas', icon: TrendingUp },
  { id: 'expenses', label: 'Despesas', icon: TrendingDown },
  { id: 'cashflow', label: 'Fluxo', icon: BarChart3 },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'payables', label: 'Contas a Pagar', icon: CreditCard },
  { id: 'investments', label: 'Investimentos', icon: PiggyBank },
  { id: 'management', label: 'Gestão Financeira', icon: Settings }
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
        "fixed left-0 top-0 z-40 h-screen w-64 transform bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-transform duration-300 ease-in-out",
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
              <h1 className="text-lg font-bold">MissãoDesign</h1>
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
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
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
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
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
              © 2024 MissãoDesign
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