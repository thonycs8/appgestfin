import { ArrowRight, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/clerk-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                Gestão Financeira Inteligente
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Controle suas
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {' '}finanças{' '}
                </span>
                com inteligência
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                O Gestfin é a solução completa para gerenciar as finanças da sua empresa e família. 
                Controle receitas, despesas, metas e investimentos em uma única plataforma.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
              
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                Ver Demonstração
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">10k+</div>
                <div className="text-sm text-gray-600">Usuários Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">€ 50M+</div>
                <div className="text-sm text-gray-600">Gerenciados</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Dashboard</h3>
                      <p className="text-sm text-gray-500">Visão geral financeira</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">+18.5%</div>
                    <div className="text-sm text-gray-500">vs mês anterior</div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-end justify-between p-4">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                  <div className="w-8 bg-blue-400 rounded-t" style={{height: '80%'}}></div>
                  <div className="w-8 bg-blue-600 rounded-t" style={{height: '100%'}}></div>
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '70%'}}></div>
                  <div className="w-8 bg-blue-400 rounded-t" style={{height: '90%'}}></div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-green-700">R$ 45.2k</div>
                    <div className="text-sm text-green-600">Receitas</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-red-700">€ 28.1k</div>
                    <div className="text-sm text-red-600">Despesas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg animate-bounce">
              <TrendingUp className="w-6 h-6" />
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg animate-pulse">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}