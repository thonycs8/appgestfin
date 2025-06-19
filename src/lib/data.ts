import { Transaction, Account, Payable, Investment, Category } from '@/types';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'empresa',
    subcategory: 'Prestação de Serviços',
    amount: 15000,
    description: 'Projeto de branding cliente ABC',
    date: '2024-01-15',
    status: 'completed'
  },
  {
    id: '2',
    type: 'expense',
    category: 'empresa',
    subcategory: 'Marketing',
    amount: 2500,
    description: 'Campanha Google Ads',
    date: '2024-01-10',
    status: 'completed'
  },
  {
    id: '3',
    type: 'income',
    category: 'familia',
    subcategory: 'Salário',
    amount: 8000,
    description: 'Salário mensal',
    date: '2024-01-05',
    status: 'completed'
  },
  {
    id: '4',
    type: 'expense',
    category: 'familia',
    subcategory: 'Alimentação',
    amount: 1200,
    description: 'Mercado mensal',
    date: '2024-01-12',
    status: 'completed'
  },
  {
    id: '5',
    type: 'expense',
    category: 'empresa',
    subcategory: 'Software',
    amount: 800,
    description: 'Licenças Adobe Creative Suite',
    date: '2024-01-08',
    status: 'completed'
  }
];

export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Conta Corrente Empresa',
    balance: 45000,
    type: 'checking',
    category: 'empresa'
  },
  {
    id: '2',
    name: 'Conta Poupança Família',
    balance: 15000,
    type: 'savings',
    category: 'familia'
  },
  {
    id: '3',
    name: 'Investimentos Empresa',
    balance: 25000,
    type: 'investment',
    category: 'empresa'
  }
];

export const mockPayables: Payable[] = [
  {
    id: '1',
    description: 'Aluguel do escritório',
    amount: 3500,
    dueDate: '2024-02-05',
    category: 'empresa',
    status: 'pending',
    supplier: 'Imobiliária Prime'
  },
  {
    id: '2',
    description: 'Financiamento do carro',
    amount: 1200,
    dueDate: '2024-02-10',
    category: 'familia',
    status: 'pending',
    supplier: 'Banco do Brasil'
  },
  {
    id: '3',
    description: 'Internet e telefone',
    amount: 350,
    dueDate: '2024-01-25',
    category: 'empresa',
    status: 'overdue',
    supplier: 'Vivo Empresas'
  }
];

export const mockInvestments: Investment[] = [
  {
    id: '1',
    name: 'Tesouro Direto',
    type: 'savings',
    amount: 10000,
    currentValue: 10850,
    category: 'familia',
    purchaseDate: '2023-06-15'
  },
  {
    id: '2',
    name: 'Ações ITUB4',
    type: 'stock',
    amount: 5000,
    currentValue: 5400,
    category: 'empresa',
    purchaseDate: '2023-12-01'
  }
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Prestação de Serviços', type: 'income', category: 'empresa', color: '#22c55e' },
  { id: '2', name: 'Vendas', type: 'income', category: 'empresa', color: '#16a34a' },
  { id: '3', name: 'Salário', type: 'income', category: 'familia', color: '#15803d' },
  { id: '4', name: 'Marketing', type: 'expense', category: 'empresa', color: '#ef4444' },
  { id: '5', name: 'Software', type: 'expense', category: 'empresa', color: '#dc2626' },
  { id: '6', name: 'Alimentação', type: 'expense', category: 'familia', color: '#b91c1c' }
];