export const stripeProducts = [
  {
    id: 'prod_free',
    priceId: 'price_free',
    name: 'Gratuito',
    description: 'Perfeito para começar',
    mode: 'free' as const,
    price: 0,
    currency: 'EUR',
    features: [
      'Até 25 transações por mês',
      'Dashboard básico',
      'Categorização simples',
      'Relatórios básicos',
      'Suporte por email'
    ],
    limits: {
      transactions: 25,
      users: 1,
      categories: 10,
      reports: 'basic'
    }
  },
  {
    id: 'prod_SYnoCl0dvnmG6b',
    priceId: 'price_1RdgCjIH2pXtzEEVWaTOg9hL',
    name: 'Pro',
    description: 'Ideal para pequenas empresas e profissionais por conta própria',
    mode: 'subscription' as const,
    price: 9.99,
    currency: 'EUR',
    popular: true,
    features: [
      'Transações ilimitadas',
      'Dashboard avançado',
      'Metas financeiras',
      'Relatórios detalhados',
      'Contas a pagar/receber',
      'Múltiplos usuários',
      'Suporte prioritário'
    ],
    limits: {
      transactions: 'unlimited',
      users: 5,
      categories: 'unlimited',
      reports: 'advanced'
    }
  },
  {
    id: 'prod_SYnpMBQu6jdSDU',
    priceId: 'price_1RdgDcIH2pXtzEEViuNIiPwv',
    name: 'Empresarial',
    description: 'Para empresas em crescimento',
    mode: 'subscription' as const,
    price: 49.99,
    currency: 'EUR',
    features: [
      'Tudo do plano Pro',
      'API personalizada',
      'Integrações avançadas',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
      'SLA garantido'
    ],
    limits: {
      transactions: 'unlimited',
      users: 'unlimited',
      categories: 'unlimited',
      reports: 'custom'
    }
  }
] as const;

export type StripeProduct = typeof stripeProducts[number];

export const getProductByPriceId = (priceId: string) => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getFreePlan = () => {
  return stripeProducts.find(product => product.mode === 'free');
};

export const getPaidPlans = () => {
  return stripeProducts.filter(product => product.mode === 'subscription');
};