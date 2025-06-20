export const translations = {
  pt: {
    // Navigation
    dashboard: 'Dashboard',
    income: 'Receitas',
    expenses: 'Despesas',
    cashflow: 'Fluxo de Caixa',
    categories: 'Categorias',
    payables: 'Contas a Pagar',
    investments: 'Investimentos',
    management: 'Gestão Financeira',
    adminUsers: 'Gerenciar Usuários',
    adminSystem: 'Sistema',
    
    // Common
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Excluir',
    create: 'Criar',
    update: 'Atualizar',
    search: 'Buscar',
    loading: 'Carregando...',
    
    // Categories
    newCategory: 'Nova Categoria',
    editCategory: 'Editar Categoria',
    categoryName: 'Nome da Categoria',
    categoryType: 'Tipo',
    categoryGroup: 'Grupo',
    categoryColor: 'Cor',
    incomeCategories: 'Categorias de Receita',
    expenseCategories: 'Categorias de Despesa',
    
    // Transactions
    newTransaction: 'Nova Transação',
    editTransaction: 'Editar Transação',
    description: 'Descrição',
    amount: 'Valor',
    date: 'Data',
    category: 'Categoria',
    
    // Status
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    completed: 'Concluído',
    overdue: 'Vencido',
    
    // Groups
    company: 'Empresa',
    family: 'Família',
    
    // Types
    income: 'Receita',
    expense: 'Despesa'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    income: 'Income',
    expenses: 'Expenses',
    cashflow: 'Cash Flow',
    categories: 'Categories',
    payables: 'Payables',
    investments: 'Investments',
    management: 'Financial Management',
    adminUsers: 'Manage Users',
    adminSystem: 'System',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    loading: 'Loading...',
    
    // Categories
    newCategory: 'New Category',
    editCategory: 'Edit Category',
    categoryName: 'Category Name',
    categoryType: 'Type',
    categoryGroup: 'Group',
    categoryColor: 'Color',
    incomeCategories: 'Income Categories',
    expenseCategories: 'Expense Categories',
    
    // Transactions
    newTransaction: 'New Transaction',
    editTransaction: 'Edit Transaction',
    description: 'Description',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    overdue: 'Overdue',
    
    // Groups
    company: 'Company',
    family: 'Family',
    
    // Types
    income: 'Income',
    expense: 'Expense'
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.pt;

export const formatCurrency = (amount: number, locale: string = 'pt-PT') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: string | Date, locale: string = 'pt-PT') => {
  return new Date(date).toLocaleDateString(locale);
};