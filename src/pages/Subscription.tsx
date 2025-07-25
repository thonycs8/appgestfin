import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { Check, Crown, Loader2, TrendingUp, Users, Shield, BarChart3, Star, Zap } from 'lucide-react';
import { stripeProducts, getFreePlan, getPaidPlans } from '@/stripe-config';

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
        const token = await getToken();
        
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
    if (!subscription?.price_id) return getFreePlan();
    return stripeProducts.find(product => product.priceId === subscription.price_id) || getFreePlan();
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
  const freePlan = getFreePlan();
  const paidPlans = getPaidPlans();

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
            {language === 'pt' ? 'Escolha o plano ideal' : 'Choose the perfect plan'}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {language === 'pt' ? ' para você' : ' for you'}
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {language === 'pt' 
              ? 'Comece gratuitamente e evolua conforme suas necessidades crescem. Todos os planos incluem suporte e atualizações.'
              : 'Start free and scale as your needs grow. All plans include support and updates.'
            }
          </p>

          {/* Current Plan Status */}
          {subscription && currentPlan && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
              <Crown className="w-4 h-4" />
              <span className="font-medium">
                {language === 'pt' ? 'Plano Atual: ' : 'Current Plan: '}
                {currentPlan.name}
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
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          {freePlan && (
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">{freePlan.name}</h3>
                  <p className="text-gray-600">{freePlan.description}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(freePlan.price, freePlan.currency)}
                    </span>
                    <span className="text-gray-600 ml-1">/mês</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {freePlan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={currentPlan?.mode === 'free'}
                  >
                    {currentPlan?.mode === 'free' 
                      ? (language === 'pt' ? 'Plano Atual' : 'Current Plan')
                      : (language === 'pt' ? 'Começar Gratuitamente' : 'Start Free')
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paid Plans */}
          {paidPlans.map((product) => {
            const isCurrentPlan = currentPlan?.id === product.id;
            const isLoadingThis = checkoutLoading === product.priceId;
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
                    <p className="text-muted-foreground">{product.description}</p>
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
                        : (language === 'pt' ? 'Teste Grátis por 14 dias' : 'Start 14-day Free Trial')
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
                    <td className="text-center py-4 px-4">1</td>
                    <td className="text-center py-4 px-4">5</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                      <span className="text-sm">{language === 'pt' ? 'Ilimitados' : 'Unlimited'}</span>
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
                  <tr>
                    <td className="py-4 px-4">{language === 'pt' ? 'Relatórios customizados' : 'Custom reports'}</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">{language === 'pt' ? 'Gerente de conta dedicado' : 'Dedicated account manager'}</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">-</td>
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
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'O que acontece se eu exceder o limite do plano gratuito?' : 'What happens if I exceed the free plan limit?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Você será notificado e poderá fazer upgrade para continuar adicionando transações.'
                      : 'You will be notified and can upgrade to continue adding transactions.'
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
                <div>
                  <h4 className="font-semibold mb-2">
                    {language === 'pt' ? 'Há desconto para pagamento anual?' : 'Is there a discount for annual payment?'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'pt' 
                      ? 'Entre em contato conosco para planos anuais com desconto especial.'
                      : 'Contact us for annual plans with special discount.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            {language === 'pt' 
              ? 'Todos os planos incluem 14 dias de teste grátis • Cancele a qualquer momento'
              : 'All plans include 14-day free trial • Cancel anytime'
            }
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Sem compromisso • Sem taxas de cancelamento' : 'No commitment • No cancellation fees'}
          </div>
        </div>
      </div>
    </div>
  );
}