import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { useApp } from '@/contexts/AppContext';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserSubscription {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export function Subscription() {
  const { getToken } = useAuth();
  const { language } = useApp();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        
        if (!token) {
          throw new Error('No authentication token available');
        }

        supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        });

        const { data, error: fetchError } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [getToken]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {language === 'pt' ? 'Erro ao carregar assinatura: ' : 'Error loading subscription: '}
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {language === 'pt' ? 'Assinatura' : 'Subscription'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'pt' 
            ? 'Gerencie sua assinatura e planos' 
            : 'Manage your subscription and plans'
          }
        </p>
      </div>

      <SubscriptionCard userSubscription={subscription} />
    </div>
  );
}