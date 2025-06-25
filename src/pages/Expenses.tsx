import { useState } from 'react';
import { Plus, TrendingDown, Building2, Home, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate } from '@/lib/i18n';
import { Transaction } from '@/types';

export function Expenses() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction, t, language } = useApp();
  
  const [newExpense, setNewExpense] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const companyExpenses = expenseTransactions
    .filter(t => t.category === 'empresa')
    .reduce((sum, t) => sum + t.amount, 0);
  const familyExpenses = expenseTransactions
    .filter(t => t.category === 'familia')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeExpenseCategories = categories.filter(c => c.type === 'expense' && c.isActive);

  const resetForm = () => {
    setNewExpense({
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleCreateExpense = () => {
    // Validação básica
    if (!newExpense.category || !newExpense.subcategory || !newExpense.amount || !newExpense.description) {
      alert(language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      addTransaction({
        type: 'expense',
        category: newExpense.category as 'empresa' | 'familia',
        subcategory: newExpense.subcategory,
        amount: amount,
        description: newExpense.description.trim(),
        date: newExpense.date,
        status: 'completed'
      });

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      
      // Show success message
      alert(language === 'pt' ? 'Despesa registrada com sucesso!' : 'Expense registered successfully!');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(language === 'pt' ? 'Erro ao registrar despesa. Tente novamente.' : 'Error registering expense. Please try again.');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewExpense({
      category: transaction.category,
      subcategory: transaction.subcategory,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction || !newExpense.category || !newExpense.subcategory || !newExpense.amount || !newExpense.description) {
      alert(language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      updateTransaction(editingTransaction.id, {
        category: newExpense.category as 'empresa' | 'familia',
        subcategory: newExpense.subcategory,
        amount: amount,
        description: newExpense.description.trim(),
        date: newExpense.date
      });

      setEditingTransaction(null);
      resetForm();
      setIsDialogOpen(false);
      
      alert(language === 'pt' ? 'Despesa atualizada com sucesso!' : 'Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert(language === 'pt' ? 'Erro ao atualizar despesa. Tente novamente.' : 'Error updating expense. Please try again.');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir esta despesa?' : 'Are you sure you want to delete this expense?')) {
      try {
        deleteTransaction(id);
        alert(language === 'pt' ? 'Despesa excluída com sucesso!' : 'Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert(language === 'pt' ? 'Erro ao excluir despesa.' : 'Error deleting expense.');
      }
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
      resetForm();
    }
  };

  const filteredCategories = activeExpenseCategories.filter(c => 
    !newExpense.category || c.category === newExpense.category
  );

  return (
    <div className="space-y-8">
      {/* Resumo de Despesas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('totalGeneral')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(companyExpenses + familyExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('company')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(companyExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('family')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(familyExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Despesas */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">{t('recentExpenses')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('newExpense')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingTransaction ? t('editExpense') : t('newExpense')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">{t('categoryGroup')}</Label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={(value) => setNewExpense(prev => ({...prev, category: value, subcategory: ''}))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder={language === 'pt' ? 'Selecione o grupo' : 'Select group'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="empresa">{t('company')}</SelectItem>
                      <SelectItem value="familia">{t('family')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">{t('category')}</Label>
                  <Select 
                    value={newExpense.subcategory} 
                    onValueChange={(value) => setNewExpense(prev => ({...prev, subcategory: value}))}
                    disabled={!newExpense.category}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder={language === 'pt' ? 'Selecione a categoria' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">{t('amount')}</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({...prev, amount: e.target.value}))}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">{t('description')}</Label>
                  <Input 
                    placeholder={t('expenseDescription')}
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({...prev, description: e.target.value}))}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">{t('date')}</Label>
                  <Input 
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({...prev, date: e.target.value}))}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={editingTransaction ? handleUpdateTransaction : handleCreateExpense}
                  type="button"
                >
                  {editingTransaction ? t('update') : t('registerExpense')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {expenseTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingDown className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'pt' ? 'Nenhuma despesa registrada ainda.' : 'No expenses registered yet.'}
                </p>
                <p className="text-gray-600">
                  {language === 'pt' ? 'Clique no botão "Nova Despesa" para começar.' : 'Click "New Expense" button to get started.'}
                </p>
              </div>
            ) : (
              expenseTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-25 border border-red-100 rounded-lg hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-sm ${
                      transaction.category === 'empresa' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                    }`}>
                      {transaction.category === 'empresa' ? 
                        <Building2 className="h-6 w-6 text-white" /> : 
                        <Home className="h-6 w-6 text-white" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.subcategory}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date, language === 'pt' ? 'pt-PT' : 'en-GB')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="outline" className={`text-xs ${
                        transaction.category === 'empresa' 
                          ? 'border-blue-200 text-blue-700 bg-blue-50' 
                          : 'border-purple-200 text-purple-700 bg-purple-50'
                      }`}>
                        {transaction.category === 'empresa' ? t('company') : t('family')}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border border-gray-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                              {language === 'pt' ? 'Excluir Transação' : 'Delete Transaction'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              {language === 'pt' ? 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.' : 'Are you sure you want to delete this transaction? This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}