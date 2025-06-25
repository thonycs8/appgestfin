import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignInButton } from '@clerk/clerk-react';
import { stripeProducts } from '@/stripe-config';
import { useApp } from '@/contexts/AppContext';

const freeFeatures = [
  'Até 25 transações por mês',
  'Dashboard básico',
  'Categorização simples',
  'Relatórios básicos',
  'Suporte por email'
];

export function Pricing() {
  const { language } = useApp();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <Star className="w-4 h-4 mr-2" />
            Planos Flexíveis
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Escolha o plano ideal
            <span className="text-blue-600"> para você</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comece gratuitamente e evolua conforme suas necessidades crescem. 
            Todos os planos incluem suporte e atualizações.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Gratuito</h3>
                <p className="text-gray-600">Perfeito para começar</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">€ 0</span>
                  <span className="text-gray-600 ml-1">/mês</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {freeFeatures.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                    Começar Gratuitamente
                  </Button>
                </SignInButton>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Products */}
          {stripeProducts.map((product, index) => {
            const isPopular = product.name === 'GestFin Profissional';
            
            return (
              <Card key={product.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} hover:shadow-xl transition-all duration-300 bg-white border border-gray-200`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4 pb-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                    <p className="text-gray-600">
                      {product.name === 'GestFin Profissional' 
                        ? 'Para pequenas empresas' 
                        : 'Para empresas em crescimento'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="text-gray-600 ml-1">/mês</span>
                    </div>
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
                        Teste Grátis por 14 dias
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
            Todos os planos incluem <strong>14 dias de teste grátis</strong> • Cancele a qualquer momento
          </p>
        </div>
      </div>
    </section>
  );
}