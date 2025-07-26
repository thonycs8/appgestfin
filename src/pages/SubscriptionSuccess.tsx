import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@clerk/clerk-react';
import { createAuthenticatedSupabaseClient } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function SubscriptionSuccess() {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        console.log('💳 Loading subscription success data...');
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          console.log('⚠️ Supabase not configured, skipping subscription load');
          return;
        }
        const authenticatedSupabase = await createAuthenticatedSupabaseClient(getToken);

        const { data, error: fetchError } = await authenticatedSupabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (fetchError) {
          console.warn('⚠️ Subscription fetch error:', fetchError.message);
          return;
        }

        setSubscription(data);
        console.log('✅ Subscription success data loaded:', data);
      } catch (error) {
        console.warn('⚠️ Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [getToken]);

  const handleContinue = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text={language === 'pt' ? 'Carregando informações da assinatura...' : 'Loading subscription information...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">
              {language === 'pt' ? 'Erro ao carregar assinatura' : 'Error loading subscription'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleContinue} className="w-full">
              {language === 'pt' ? 'Continuar para o Dashboard' : 'Continue to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'pt' ? 'Assinatura Confirmada!' : 'Subscription Confirmed!'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {language === 'pt' 
                ? 'Sua assinatura foi processada com sucesso. Você agora tem acesso a todos os recursos do seu plano.'
                : 'Your subscription has been processed successfully. You now have access to all features of your plan.'
              }
            </p>
            
            {subscription && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <p className="font-medium">
                    {language === 'pt' ? 'Plano Ativo' : 'Active Plan'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {stripeProducts.find(p => p.priceId === subscription.price_id)?.name || 'Pro'}
                    </span>
                    <Badge variant={subscription.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {subscription.subscription_status === 'active' 
                        ? (language === 'pt' ? 'Ativo' : 'Active')
                        : subscription.subscription_status
                      }
                    </Badge>
                  </div>
                  {subscription.current_period_end && (
                    <p className="text-xs text-muted-foreground">
                      {language === 'pt' ? 'Próxima cobrança: ' : 'Next billing: '}
                      {new Date(subscription.current_period_end * 1000).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button onClick={handleContinue} className="w-full">
            {language === 'pt' ? 'Continuar para o Dashboard' : 'Continue to Dashboard'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            {language === 'pt' 
              ? 'Você receberá um email de confirmação em breve.'
              : 'You will receive a confirmation email shortly.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}