import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2 } from 'lucide-react';
import { stripeProducts } from '@/stripe-config';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '@/contexts/AppContext';

interface SubscriptionCardProps {
  userSubscription?: {
    subscription_status: string;
    price_id: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
}

export function SubscriptionCard({ userSubscription }: SubscriptionCardProps) {
  const { getToken } = useAuth();
  const { language } = useApp();
  const [loading, setLoading] = useState<string | null>(null);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB');
  };

  const getCurrentPlan = () => {
    if (!userSubscription?.price_id) return null;
    return stripeProducts.find(product => product.priceId === userSubscription.price_id);
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(priceId);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: 'subscription',
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription/cancel`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(language === 'pt' 
        ? 'Erro ao processar assinatura. Tente novamente.' 
        : 'Error processing subscription. Please try again.'
      );
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = getCurrentPlan();
  const isActive = userSubscription?.subscription_status === 'active';

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {userSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {language === 'pt' ? 'Sua Assinatura' : 'Your Subscription'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {currentPlan?.name || (language === 'pt' ? 'Plano Desconhecido' : 'Unknown Plan')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentPlan && formatPrice(currentPlan.price, currentPlan.currency)}/mês
                </p>
              </div>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive 
                  ? (language === 'pt' ? 'Ativo' : 'Active')
                  : userSubscription.subscription_status
                }
              </Badge>
            </div>
            
            {userSubscription.current_period_end && (
              <div className="text-sm text-muted-foreground">
                {userSubscription.cancel_at_period_end 
                  ? (language === 'pt' ? 'Cancela em: ' : 'Cancels on: ')
                  : (language === 'pt' ? 'Renova em: ' : 'Renews on: ')
                }
                {formatDate(userSubscription.current_period_end)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid gap-6 md:grid-cols-2">
        {stripeProducts.map((product) => {
          const isCurrentPlan = currentPlan?.id === product.id;
          const isLoadingThis = loading === product.priceId;
          
          return (
            <Card key={product.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrentPlan && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-blue-500 text-white">
                    {language === 'pt' ? 'Atual' : 'Current'}
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <div className="text-2xl font-bold">
                  {formatPrice(product.price, product.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(product.priceId)}
                  disabled={isCurrentPlan || isLoadingThis}
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                >
                  {isLoadingThis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCurrentPlan 
                    ? (language === 'pt' ? 'Plano Atual' : 'Current Plan')
                    : (language === 'pt' ? 'Assinar' : 'Subscribe')
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}