import { useEffect, useState } from 'react';
import { Bell, User, LogOut, Settings, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useApp } from '@/contexts/AppContext';
import { createClient } from '@supabase/supabase-js';
import { stripeProducts } from '@/stripe-config';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { language, setLanguage, t } = useApp();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isSignedIn) return;
      
      try {
        const token = await getToken({ template: 'supabase' });
        
        if (token) {
          supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });

          const { data } = await supabase
            .from('stripe_user_subscriptions')
            .select('*')
            .maybeSingle();

          setSubscription(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [isSignedIn, getToken]);

  const getCurrentPlanName = () => {
    if (!subscription?.price_id) return language === 'pt' ? 'Gratuito' : 'Free';
    
    const product = stripeProducts.find(p => p.priceId === subscription.price_id);
    return product?.name || (language === 'pt' ? 'Plano Desconhecido' : 'Unknown Plan');
  };

  if (!isSignedIn) return null;

  return (
    <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 shadow-sm sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {subscription && (
            <Badge variant="outline" className="text-xs">
              {getCurrentPlanName()}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Languages className="h-4 w-4 text-foreground" />
              <span className="sr-only">Toggle language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setLanguage('pt')}
              className={language === 'pt' ? 'bg-accent' : ''}
            >
              🇵🇹 Português
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'bg-accent' : ''}
            >
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ModeToggle />

        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 text-foreground" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.fullName || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {user?.publicMetadata?.role === 'admin' && (
                    <Badge variant="secondary" className="text-xs">
                      {language === 'pt' ? 'Administrador' : 'Administrator'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getCurrentPlanName()}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{language === 'pt' ? 'Configurações' : 'Settings'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <SignOutButton>
              <DropdownMenuItem>
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