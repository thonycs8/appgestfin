import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart, 
  Shield, 
  Smartphone,
  BarChart3,
  CreditCard,
  Users,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: TrendingUp,
    title: 'Controle de Receitas',
    description: 'Gerencie todas as suas fontes de renda de forma organizada e intuitiva.',
    color: 'text-green-600 bg-green-100'
  },
  {
    icon: TrendingDown,
    title: 'Gestão de Despesas',
    description: 'Monitore e categorize todos os seus gastos para melhor controle financeiro.',
    color: 'text-red-600 bg-red-100'
  },
  {
    icon: Target,
    title: 'Metas Financeiras',
    description: 'Defina objetivos e acompanhe seu progresso rumo à independência financeira.',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    icon: PieChart,
    title: 'Relatórios Detalhados',
    description: 'Visualize seus dados financeiros com gráficos e relatórios inteligentes.',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    icon: CreditCard,
    title: 'Contas a Pagar',
    description: 'Nunca mais esqueça um vencimento com nosso sistema de lembretes.',
    color: 'text-orange-600 bg-orange-100'
  },
  {
    icon: BarChart3,
    title: 'Dashboard Intuitivo',
    description: 'Tenha uma visão completa da sua situação financeira em tempo real.',
    color: 'text-indigo-600 bg-indigo-100'
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Seus dados protegidos com criptografia de nível bancário.',
    color: 'text-gray-600 bg-gray-100'
  },
  {
    icon: Smartphone,
    title: 'Acesso Mobile',
    description: 'Gerencie suas finanças de qualquer lugar, a qualquer momento.',
    color: 'text-pink-600 bg-pink-100'
  },
  {
    icon: Users,
    title: 'Gestão Familiar',
    description: 'Separe e organize as finanças pessoais e empresariais.',
    color: 'text-cyan-600 bg-cyan-100'
  }
];

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4 mr-2" />
            Recursos Poderosos
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Tudo que você precisa para
            <span className="text-blue-600"> controlar suas finanças</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            O Gestfin oferece todas as ferramentas necessárias para uma gestão financeira 
            completa e eficiente, seja para sua empresa ou família.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}