import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { useApp } from '@/contexts/AppContext';
import { Check, Crown, Loader2, TrendingUp, Users, Shield, Zap, BarChart3, Target } from 'lucide-react';
import { stripeProducts } from '@/stripe-config';

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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
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
    if (!subscription?.price_id) return null;
    return stripeProducts.find(product => product.priceId === subscription.price_id);
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setCheckoutLoading(priceId);
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
      setCheckoutLoading(null);
    }
  };

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

  const currentPlan = getCurrentPlan();
  const isActive = subscription?.subscription_status === 'active';
  const isFreeUser = !subscription || !subscription.price_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Upgrade Sua Experiência' : 'Upgrade Your Experience'}
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
            {language === 'pt' ? 'Desbloqueie todo o' : 'Unlock the full'}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {language === 'pt' ? ' potencial ' : ' potential '}
            </span>
            {language === 'pt' ? 'do Gestfin' : 'of Gestfin'}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {language === 'pt' 
              ? 'Transforme sua gestão financeira com recursos avançados, relatórios detalhados e suporte prioritário.'
              : 'Transform your financial management with advanced features, detailed reports and priority support.'
            }
          </p>

          {/* Current Plan Status */}
          {subscription && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
              <Crown className="w-4 h-4" />
              <span className="font-medium">
                {language === 'pt' ? 'Plano Atual: ' : 'Current Plan: '}
                {currentPlan?.name || (language === 'pt' ? 'Gratuito' : 'Free')}
              </span>
              {subscription.current_period_end && (
                <span className="text-sm">
                  • {language === 'pt' ? 'Renova em ' : 'Renews on '}
                  {formatDate(subscription.current_period_end)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {language === 'pt' ? 'Crescimento Acelerado' : 'Accelerated Growth'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'pt' 
                ? 'Relatórios avançados e insights que impulsionam seu crescimento financeiro'
                : 'Advanced reports and insights that drive your financial growth'
              }
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {language === 'pt' ? 'Segurança Premium' : 'Premium Security'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'pt' 
                ? 'Proteção avançada dos seus dados com backup automático e criptografia'
                : 'Advanced data protection with automatic backup and encryption'
              }
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {language === 'pt' ? 'Suporte Dedicado' : 'Dedicated Support'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'pt' 
                ? 'Suporte prioritário com especialistas em gestão financeira'
                : 'Priority support with financial management specialists'
              }
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {stripeProducts.map((product) => {
            const isCurrentPlan = currentPlan?.id === product.id;
            const isLoadingThis = checkoutLoading === product.priceId;
            const isPopular = product.name === 'GestFin Profissional';
            
            return (
              <Card key={product.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} hover:shadow-xl transition-all duration-300`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
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
                    <p className="text-muted-foreground">
                      {product.name === 'GestFin Profissional' 
                        ? (language === 'pt' ? 'Ideal para pequenas empresas' : 'Ideal for small businesses')
                        : (language === 'pt' ? 'Para empresas em crescimento' : 'For growing businesses')
                      }
                    </p>
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
                  
                  <div className="pt-4">
                    <Button 
                      className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} 
                      variant={isCurrentPlan ? 'secondary' : (isPopular ? 'default' : 'outline')}
                      onClick={() => handleSubscribe(product.priceId)}
                      disabled={isCurrentPlan || isLoadingThis}
                    >
                      {isLoadingThis && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isCurrentPlan 
                        ? (language === 'pt' ? 'Plano Atual' : 'Current Plan')
                        : (language === 'pt' ? 'Começar Agora' : 'Start Now')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Chart */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {language === 'pt' ? 'Compare os Planos' : 'Compare Plans'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium text-muted-foreground">
                      {language === 'pt' ? 'Recursos' : 'Features'}
                    </th>
                    <th className="text-center py-4 px-4 font-medium">
                      {language === 'pt' ? 'Gratuito' : 'Free'}
                    </th>
                    <th className="text-center py-4 px-4 font-medium">Profissional</th>
                    <th className="text-center py-4 px-4 font-medium">Empresarial</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4 px-4">{language === 'pt' ? 'Transações por mês' : 'Transactions per month'}</td>
                    <td className="text-center py-4 px-4">25</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                      <span className="text-sm">{language === 'pt' ? 'Ilimitadas' : 'Unlimited'}</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                      <span className="text-sm">{language === 'pt' ? 'Ilimitadas' : 'Unlimited'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">{language === 'pt' ? 'Múltiplos usuários' : 'Multiple users'}</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">API {language === 'pt' ? 'personalizada' : 'access'}</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">{language === 'pt' ? 'Suporte prioritário' : 'Priority support'}</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ROI Calculator */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6" />
              {language === 'pt' ? 'Calculadora de ROI' : 'ROI Calculator'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">2.5x</div>
                <p className="text-muted-foreground">
                  {language === 'pt' ? 'Aumento médio na eficiência' : 'Average efficiency increase'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">15h</div>
                <p className="text-muted-foreground">
                  {language === 'pt' ? 'Horas economizadas por mês' : 'Hours saved per month'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">€500+</div>
                <p className="text-muted-foreground">
                  {language === 'pt' ? 'Economia mensal média' : 'Average monthly savings'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {language === 'pt' ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'Posso cancelar a qualquer momento?' : 'Can I cancel anytime?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.'
                      : 'Yes, you can cancel your subscription anytime without cancellation fees.'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'Como funciona o período gratuito?' : 'How does the free trial work?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Você tem 14 dias para testar todos os recursos premium sem cobrança.'
                      : 'You have 14 days to test all premium features without charge.'
                    }
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'Posso fazer upgrade/downgrade?' : 'Can I upgrade/downgrade?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Sim, você pode alterar seu plano a qualquer momento e o valor será ajustado proporcionalmente.'
                      : 'Yes, you can change your plan anytime and the amount will be prorated.'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'Meus dados estão seguros?' : 'Is my data secure?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Sim, utilizamos criptografia de nível bancário e backup automático.'
                      : 'Yes, we use bank-level encryption and automatic backup.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}