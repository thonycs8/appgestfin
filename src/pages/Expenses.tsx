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
  const { transactions, categories, groups, addTransaction, updateTransaction, deleteTransaction, addCategory, addGroup, t, language } = useApp();
  
  const [newExpense, setNewExpense] = useState({
    group: '',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#ef4444'
  });

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Calculate totals by group
  const groupTotals = groups.reduce((acc, group) => {
    const groupExpenses = expenseTransactions
      .filter(t => t.category === group.id)
      .reduce((sum, t) => sum + t.amount, 0);
    acc[group.id] = groupExpenses;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(groupTotals).reduce((sum, amount) => sum + amount, 0);

  const activeExpenseCategories = categories.filter(c => c.type === 'expense' && c.isActive);

  const resetForm = () => {
    setNewExpense({
      group: '',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const resetCategoryForm = () => {
    setNewCategory({
      name: '',
      type: 'expense',
      color: '#ef4444'
    });
  };

  const resetGroupForm = () => {
    setNewGroup({
      name: '',
      description: '',
      color: '#3b82f6'
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      alert(language === 'pt' ? 'Por favor, digite o nome da categoria.' : 'Please enter the category name.');
      return;
    }

    try {
      await addCategory({
        name: newCategory.name,
        type: newCategory.type,
        color: newCategory.color,
        isActive: true
      });

      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      alert(language === 'pt' ? 'Por favor, digite o nome do grupo.' : 'Please enter the group name.');
      return;
    }

    try {
      await addGroup({
        name: newGroup.name,
        description: newGroup.description,
        color: newGroup.color,
        isActive: true
      });

      resetGroupForm();
      setIsGroupDialogOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleCreateExpense = () => {
    // Validação básica
    if (!newExpense.group || !newExpense.category || !newExpense.amount || !newExpense.description) {
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
        category: newExpense.group,
        subcategory: newExpense.category,
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
      group: transaction.category,
      category: transaction.subcategory,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction || !newExpense.group || !newExpense.category || !newExpense.amount || !newExpense.description) {
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
        category: newExpense.group,
        subcategory: newExpense.category,
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

  const getGroupById = (id: string) => groups.find(g => g.id === id);

  return (
    <div className="space-y-8">
      {/* Resumo de Despesas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('totalGeneral')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        {groups.slice(0, 3).map((group) => (
          <Card key={group.id} className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-lg shadow-sm"
                style={{ backgroundColor: group.color }}
              >
                {group.id === 'empresa' ? (
                  <Building2 className="h-6 w-6 text-white" />
                ) : group.id === 'familia' ? (
                  <Home className="h-6 w-6 text-white" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{group.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(groupTotals[group.id] || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
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
                  <Label htmlFor="group" className="text-sm font-medium text-gray-700">Grupo</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newExpense.group} 
                      onValueChange={(value) => setNewExpense(prev => ({...prev, group: value}))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder={language === 'pt' ? 'Selecione o grupo' : 'Select group'} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {groups.filter(g => g.isActive).map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: group.color }}
                              />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">+</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Novo Grupo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Nome do Grupo</Label>
                            <Input 
                              value={newGroup.name}
                              onChange={(e) => setNewGroup(prev => ({...prev, name: e.target.value}))}
                              placeholder="Ex: Casa, Carro, Saúde..."
                            />
                          </div>
                          <div>
                            <Label>Descrição (opcional)</Label>
                            <Input 
                              value={newGroup.description}
                              onChange={(e) => setNewGroup(prev => ({...prev, description: e.target.value}))}
                              placeholder="Descrição do grupo..."
                            />
                          </div>
                          <div>
                            <Label>Cor</Label>
                            <Input 
                              type="color"
                              value={newGroup.color}
                              onChange={(e) => setNewGroup(prev => ({...prev, color: e.target.value}))}
                            />
                          </div>
                          <Button onClick={handleCreateGroup} className="w-full">
                            Criar Grupo
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">{t('category')}</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(value) => setNewExpense(prev => ({...prev, category: value}))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder={language === 'pt' ? 'Selecione a categoria' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {activeExpenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">+</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Nova Categoria</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Nome da Categoria</Label>
                            <Input 
                              value={newCategory.name}
                              onChange={(e) => setNewCategory(prev => ({...prev, name: e.target.value}))}
                              placeholder="Ex: Alimentação, Transporte, Marketing..."
                            />
                          </div>
                          <div>
                            <Label>Cor</Label>
                            <Input 
                              type="color"
                              value={newCategory.color}
                              onChange={(e) => setNewCategory(prev => ({...prev, color: e.target.value}))}
                            />
                          </div>
                          <Button onClick={handleCreateCategory} className="w-full">
                            Criar Categoria
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
              expenseTransactions.map((transaction) => {
                const group = getGroupById(transaction.category);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-25 border border-red-100 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: group?.color || '#ef4444' }}
                      >
                        {group?.id === 'empresa' ? (
                          <Building2 className="h-6 w-6 text-white" />
                        ) : group?.id === 'familia' ? (
                          <Home className="h-6 w-6 text-white" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-white" />
                        )}
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
                        <Badge variant="outline" style={{ 
                          borderColor: group?.color || '#ef4444', 
                          color: group?.color || '#ef4444' 
                        }}>
                          {group?.name || transaction.category}
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
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}