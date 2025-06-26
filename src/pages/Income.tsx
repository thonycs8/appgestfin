import { useState } from 'react';
import { Plus, TrendingUp, Building2, Home, Edit, Trash2 } from 'lucide-react';
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

export function Income() {
  const { transactions, categories, groups, addTransaction, updateTransaction, deleteTransaction, addCategory, addGroup, t, language } = useApp();
  
  const [newIncome, setNewIncome] = useState({
    group: '',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    color: '#22c55e'
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

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  // Calculate totals by group
  const groupTotals = groups.reduce((acc, group) => {
    const groupIncome = incomeTransactions
      .filter(t => t.category === group.id)
      .reduce((sum, t) => sum + t.amount, 0);
    acc[group.id] = groupIncome;
    return acc;
  }, {} as Record<string, number>);

  const totalIncome = Object.values(groupTotals).reduce((sum, amount) => sum + amount, 0);

  const activeIncomeCategories = categories.filter(c => c.type === 'income' && c.isActive);

  const resetForm = () => {
    setNewIncome({
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
      type: 'income',
      color: '#22c55e'
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

  const handleCreateIncome = () => {
    // Validação básica - categoria agora é opcional
    if (!newIncome.amount || !newIncome.description) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios (valor e descrição).' : 'Please fill in the required fields (amount and description).');
      return;
    }

    const amount = parseFloat(newIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      addTransaction({
        type: 'income',
        category: newIncome.group || 'geral',
        subcategory: newIncome.category || 'Sem categoria',
        amount: amount,
        description: newIncome.description.trim(),
        date: newIncome.date,
        status: 'completed'
      });

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      
      // Show success message
      alert(language === 'pt' ? 'Receita registrada com sucesso!' : 'Income registered successfully!');
    } catch (error) {
      console.error('Error creating income:', error);
      alert(language === 'pt' ? 'Erro ao registrar receita. Tente novamente.' : 'Error registering income. Please try again.');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewIncome({
      group: transaction.category,
      category: transaction.subcategory === 'Sem categoria' ? '' : transaction.subcategory,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction || !newIncome.amount || !newIncome.description) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios (valor e descrição).' : 'Please fill in the required fields (amount and description).');
      return;
    }

    const amount = parseFloat(newIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      updateTransaction(editingTransaction.id, {
        category: newIncome.group || 'geral',
        subcategory: newIncome.category || 'Sem categoria',
        amount: amount,
        description: newIncome.description.trim(),
        date: newIncome.date
      });

      setEditingTransaction(null);
      resetForm();
      setIsDialogOpen(false);
      
      alert(language === 'pt' ? 'Receita atualizada com sucesso!' : 'Income updated successfully!');
    } catch (error) {
      console.error('Error updating income:', error);
      alert(language === 'pt' ? 'Erro ao atualizar receita. Tente novamente.' : 'Error updating income. Please try again.');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir esta receita?' : 'Are you sure you want to delete this income?')) {
      try {
        deleteTransaction(id);
        alert(language === 'pt' ? 'Receita excluída com sucesso!' : 'Income deleted successfully!');
      } catch (error) {
        console.error('Error deleting income:', error);
        alert(language === 'pt' ? 'Erro ao excluir receita.' : 'Error deleting income.');
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
      {/* Resumo de Entradas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('totalGeneral')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalIncome)}
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
                  <TrendingUp className="h-6 w-6 text-white" />
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

      {/* Lista de Entradas */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">{t('recentIncome')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('newIncome')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {editingTransaction ? t('editIncome') : t('newIncome')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    {t('amount')} <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome(prev => ({...prev, amount: e.target.value}))}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    {t('description')} <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    placeholder={t('incomeDescription')}
                    value={newIncome.description}
                    onChange={(e) => setNewIncome(prev => ({...prev, description: e.target.value}))}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div>
                  <Label htmlFor="group" className="text-sm font-medium text-gray-700">
                    Grupo <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newIncome.group} 
                      onValueChange={(value) => setNewIncome(prev => ({...prev, group: value}))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder={language === 'pt' ? 'Selecione o grupo (opcional)' : 'Select group (optional)'} />
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
                              placeholder="Ex: Freelance, Investimentos..."
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
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    {t('category')} <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newIncome.category} 
                      onValueChange={(value) => setNewIncome(prev => ({...prev, category: value}))}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder={language === 'pt' ? 'Selecione a categoria (opcional)' : 'Select category (optional)'} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        {activeIncomeCategories.map((category) => (
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
                              placeholder="Ex: Salário, Vendas, Consultoria..."
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
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">{t('date')}</Label>
                  <Input 
                    type="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome(prev => ({...prev, date: e.target.value}))}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={editingTransaction ? handleUpdateTransaction : handleCreateIncome}
                  type="button"
                >
                  {editingTransaction ? t('update') : t('registerIncome')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {incomeTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'pt' ? 'Nenhuma receita registrada ainda.' : 'No income registered yet.'}
                </p>
                <p className="text-gray-600">
                  {language === 'pt' ? 'Clique no botão "Nova Receita" para começar.' : 'Click "New Income" button to get started.'}
                </p>
              </div>
            ) : (
              incomeTransactions.map((transaction) => {
                const group = getGroupById(transaction.category);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-25 border border-green-100 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: group?.color || '#3b82f6' }}
                      >
                        {group?.id === 'empresa' ? (
                          <Building2 className="h-6 w-6 text-white" />
                        ) : group?.id === 'familia' ? (
                          <Home className="h-6 w-6 text-white" />
                        ) : (
                          <TrendingUp className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.subcategory === 'Sem categoria' ? 
                            <span className="italic text-gray-400">Sem categoria</span> : 
                            transaction.subcategory
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.date, language === 'pt' ? 'pt-PT' : 'en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          +{formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="outline" style={{ 
                          borderColor: group?.color || '#3b82f6', 
                          color: group?.color || '#3b82f6' 
                        }}>
                          {group?.name || 'Geral'}
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