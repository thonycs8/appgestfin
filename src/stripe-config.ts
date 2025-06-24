export const stripeProducts = [
  {
    id: 'prod_SYnpMBQu6jdSDU',
    priceId: 'price_1RdgDcIH2pXtzEEViuNIiPwv',
    name: 'Empresarial',
    description: 'Para empresas em crescimento. Tudo do plano Profissional, API personalizada, Integrações avançadas, Relatórios customizados, Gerente de conta dedicado, Treinamento personalizado, SLA garantido',
    mode: 'subscription' as const,
    price: 49.99,
    currency: 'EUR',
    features: [
      'Tudo do plano Profissional',
      'API personalizada',
      'Integrações avançadas',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
      'SLA garantido'
    ]
  },
  {
    id: 'prod_SYnoCl0dvnmG6b',
    priceId: 'price_1RdgCjIH2pXtzEEVWaTOg9hL',
    name: 'GestFin Profissional',
    description: 'Ideal para pequenas empresas e profissionais por conta própria. Transações ilimitadas, Dashboard avançado, Metas financeiras, Relatórios detalhados, Contas a pagar/receber, Múltiplos usuários, Suporte prioritário',
    mode: 'subscription' as const,
    price: 9.99,
    currency: 'EUR',
    features: [
      'Transações ilimitadas',
      'Dashboard avançado',
      'Metas financeiras',
      'Relatórios detalhados',
      'Contas a pagar/receber',
      'Múltiplos usuários',
      'Suporte prioritário'
    ]
  }
] as const;

export type StripeProduct = typeof stripeProducts[number];