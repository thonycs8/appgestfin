import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignInButton } from '@clerk/clerk-react';
import { stripeProducts, getFreePlan, getPaidPlans } from '@/stripe-config';
import { useApp } from '@/contexts/AppContext';

export function Pricing() {
  const { language } = useApp();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price);
  };

  const freePlan = getFreePlan();
  const paidPlans = getPaidPlans();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Star className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Planos Flexíveis' : 'Flexible Plans'}
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {language === 'pt' ? 'Escolha o plano ideal' : 'Choose the perfect plan'}
            <span className="text-blue-600"> {language === 'pt' ? 'para você' : 'for you'}</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'pt' 
              ? 'Comece gratuitamente e evolua conforme suas necessidades crescem. Todos os planos incluem suporte e atualizações.'
              : 'Start free and scale as your needs grow. All plans include support and updates.'
            }
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                      {language === 'pt' ? 'Começar Gratuitamente' : 'Start Free'}
                    </Button>
                  </SignInButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paid Plans */}
          {paidPlans.map((product) => {
            const isPopular = product.popular;
            
            return (
              <Card key={product.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} hover:shadow-xl transition-all duration-300 bg-white border border-gray-200`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {language === 'pt' ? 'Mais Popular' : 'Most Popular'}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4 pb-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                    <p className="text-gray-600">{product.description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="text-gray-600 ml-1">/mês</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {language === 'pt' ? '14 dias grátis' : '14 days free'}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {product.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    <SignInButton mode="modal">
                      <Button className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'} text-white`}>
                        {language === 'pt' ? 'Teste Grátis por 14 dias' : '14-day Free Trial'}
                      </Button>
                    </SignInButton>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            {language === 'pt' 
              ? 'Todos os planos incluem 14 dias de teste grátis • Cancele a qualquer momento'
              : 'All plans include 14-day free trial • Cancel anytime'
            }
          </p>
        </div>
      </div>
    </section>
  );
}