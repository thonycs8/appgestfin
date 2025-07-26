import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, Star } from 'lucide-react';
import { stripeProducts, getFreePlan, getPaidPlans } from '@/stripe-config';
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
    if (!userSubscription?.price_id) return getFreePlan();
    return stripeProducts.find(product => product.priceId === userSubscription.price_id) || getFreePlan();
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
  const freePlan = getFreePlan();
  const paidPlans = getPaidPlans();

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {userSubscription && currentPlan && (
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
                <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.mode === 'free' 
                    ? (language === 'pt' ? 'Plano gratuito' : 'Free plan')
                    : `${formatPrice(currentPlan.price, currentPlan.currency)}/mês`
                  }
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
      <div className="grid gap-6 md:grid-cols-3">
        {/* Free Plan */}
        {freePlan && (
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">{freePlan.name}</h3>
                <p className="text-muted-foreground">{freePlan.description}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(freePlan.price, freePlan.currency)}
                  </span>
                  <span className="text-muted-foreground ml-1">/mês</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {freePlan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={currentPlan?.mode === 'free'}
              >
                {currentPlan?.mode === 'free' 
                  ? (language === 'pt' ? 'Plano Atual' : 'Current Plan')
                  : (language === 'pt' ? 'Começar Gratuitamente' : 'Start Free')
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paid Plans */}
        {paidPlans.map((product) => {
          const isCurrentPlan = currentPlan?.id === product.id;
          const isLoadingThis = loading === product.priceId;
          const isPopular = product.popular;
          
          return (
            <Card key={product.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} hover:shadow-xl transition-all duration-300`}>
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {language === 'pt' ? 'Mais Popular' : 'Most Popular'}
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-500 text-white">
                    {language === 'pt' ? 'Atual' : 'Current'}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{product.name}</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p className="text-sm">{product.description}</p>
                    {product.name === 'Empresarial' && (
                      <p className="text-xs text-blue-600 font-medium">
                        {language === 'pt' ? 'Inclui tudo do plano Pro' : 'Includes everything from Pro plan'}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="text-muted-foreground ml-1">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'pt' ? '14 dias grátis' : '14 days free'}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {product.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} 
                  variant={isCurrentPlan ? 'secondary' : (isPopular ? 'default' : 'outline')}
                  onClick={() => handleSubscribe(product.priceId)}
                  disabled={isCurrentPlan || isLoadingThis}
                >
                  {isLoadingThis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCurrentPlan 
                    ? (language === 'pt' ? 'Plano Atual' : 'Current Plan')
                    : (language === 'pt' ? 'Teste Grátis por 14 dias' : '14-day Free Trial')
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