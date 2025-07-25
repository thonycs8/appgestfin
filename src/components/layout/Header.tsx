import { useEffect, useState } from 'react';
import { User, LogOut, Settings, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react';
import { useApp } from '@/contexts/AppContext';
import { createAuthenticatedSupabaseClient } from '@/lib/supabase';
import { stripeProducts } from '@/stripe-config';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { language, setLanguage } = useApp();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isSignedIn) return;
      
      try {
        console.log('💳 Fetching subscription data...');
        const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);

        const { data, error } = await authenticatedSupabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.warn('⚠️ Subscription fetch error (expected if no Supabase setup):', error.message);
          return;
        }

        setSubscription(data);
        console.log('✅ Subscription data loaded:', data);
      } catch (error) {
        console.warn('⚠️ Error fetching subscription (expected if no Supabase setup):', error);
      }
    };

    fetchSubscription();
  }, [isSignedIn, getToken]);

  const getCurrentPlanName = () => {
    if (!subscription?.price_id) return language === 'pt' ? 'Gratuito' : 'Free';
    
    const product = stripeProducts.find(p => p.priceId === subscription.price_id && p.mode === 'subscription');
    return product?.name || (language === 'pt' ? 'Plano Desconhecido' : 'Unknown Plan');
  };

  if (!isSignedIn) return null;

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {subscription && (
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
              {getCurrentPlanName()}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 border-gray-300 text-gray-700 hover:bg-gray-50">
              <Languages className="h-4 w-4" />
              <span className="sr-only">Toggle language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
            <DropdownMenuItem 
              onClick={() => setLanguage('pt')}
              className={language === 'pt' ? 'bg-gray-100' : ''}
            >
              🇵🇹 Português
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'bg-gray-100' : ''}
            >
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Alerts Dropdown */}
        <AlertsDropdown />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-gray-200" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-gray-900">
                  {user?.fullName || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-gray-600">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {user?.publicMetadata?.role === 'admin' && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      {language === 'pt' ? 'Administrador' : 'Administrator'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                    {getCurrentPlanName()}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-gray-700 hover:bg-gray-100">
              <Settings className="mr-2 h-4 w-4" />
              <span>{language === 'pt' ? 'Configurações' : 'Settings'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem className="text-gray-700 hover:bg-gray-100">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{language === 'pt' ? 'Sair' : 'Sign Out'}</span>
              </DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}