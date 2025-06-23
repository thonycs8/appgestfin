import { ArrowRight, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/clerk-react';
import { useApp } from '@/contexts/AppContext';

export function Hero() {
  const { language } = useApp();

  const content = {
    pt: {
      badge: 'Gestão Financeira Inteligente',
      title: 'Controle suas',
      titleHighlight: ' finanças ',
      titleEnd: 'com inteligência',
      description: 'O Gestfin é a solução completa para gerenciar as finanças da sua empresa e família. Controle receitas, despesas, metas e investimentos em uma única plataforma.',
      ctaPrimary: 'Começar Gratuitamente',
      ctaSecondary: 'Ver Demonstração',
      stats: {
        uptime: 'Uptime',
        users: 'Usuários Ativos',
        managed: 'Gerenciados'
      }
    },
    en: {
      badge: 'Smart Financial Management',
      title: 'Control your',
      titleHighlight: ' finances ',
      titleEnd: 'intelligently',
      description: 'Gestfin is the complete solution to manage your company and family finances. Control income, expenses, goals and investments in a single platform.',
      ctaPrimary: 'Start Free',
      ctaSecondary: 'View Demo',
      stats: {
        uptime: 'Uptime',
        users: 'Active Users',
        managed: 'Managed'
      }
    }
  };

  const t = content[language];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                {t.badge}
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                {t.title}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {t.titleHighlight}
                </span>
                {t.titleEnd}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {t.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  {t.ctaPrimary}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
              
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                {t.ctaSecondary}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">{t.stats.uptime}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">10k+</div>
                <div className="text-sm text-muted-foreground">{t.stats.users}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">€ 50M+</div>
                <div className="text-sm text-muted-foreground">{t.stats.managed}</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative bg-card rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'pt' ? 'Visão geral financeira' : 'Financial overview'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">+18.5%</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'pt' ? 'vs mês anterior' : 'vs last month'}
                    </div>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-end justify-between p-4">
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                  <div className="w-8 bg-blue-400 rounded-t" style={{height: '80%'}}></div>
                  <div className="w-8 bg-blue-600 rounded-t" style={{height: '100%'}}></div>
                  <div className="w-8 bg-blue-500 rounded-t" style={{height: '70%'}}></div>
                  <div className="w-8 bg-blue-400 rounded-t" style={{height: '90%'}}></div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">€ 45.2k</div>
                    <div className="text-sm text-green-600 dark:text-green-500">
                      {language === 'pt' ? 'Receitas' : 'Revenue'}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="text-lg font-bold text-red-700 dark:text-red-400">€ 28.1k</div>
                    <div className="text-sm text-red-600 dark:text-red-500">
                      {language === 'pt' ? 'Despesas' : 'Expenses'}
                    </div>
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