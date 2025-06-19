import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignInButton } from '@clerk/clerk-react';

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Perfeito para começar',
    features: [
      'Até 25 transações por mês',
      'Dashboard básico',
      'Categorização simples',
      'Relatórios básicos',
      'Suporte por email'
    ],
    popular: false,
    cta: 'Começar Gratuitamente'
  },
  {
    name: 'Profissional',
    price: '9,99 €',
    period: '/mês',
    description: 'Para pequenas empresas',
    features: [
      'Transações ilimitadas',
      'Dashboard avançado',
      'Metas financeiras',
      'Relatórios detalhados',
      'Contas a pagar/receber',
      'Múltiplos usuários',
      'Suporte prioritário'
    ],
    popular: true,
    cta: 'Teste Grátis por 14 dias'
  },
  {
    name: 'Empresarial',
    price: '49,99 €',
    period: '/mês',
    description: 'Para empresas em crescimento',
    features: [
      'Tudo do plano Profissional',
      'API personalizada',
      'Integrações avançadas',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
      'SLA garantido'
    ],
    popular: false,
    cta: 'Falar com Vendas'
  }
];

export function Pricing() {
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
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'shadow-lg'} hover:shadow-xl transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  {plan.name === 'Gratuito' ? (
                    <SignInButton mode="modal">
                      <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                        {plan.cta}
                      </Button>
                    </SignInButton>
                  ) : (
                    <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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