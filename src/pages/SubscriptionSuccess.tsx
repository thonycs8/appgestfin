import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function SubscriptionSuccess() {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [getToken]);

  const handleContinue = () => {
    window.location.href = '/dashboard';
  };

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
            
            {!loading && subscription && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {language === 'pt' ? 'Plano Ativo' : 'Active Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscription_status === 'active' 
                    ? (language === 'pt' ? 'Ativo' : 'Active')
                    : subscription.subscription_status
                  }
                </p>
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