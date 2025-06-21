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
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction, t, language } = useApp();
  
  const [newIncome, setNewIncome] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const companyIncome = incomeTransactions
    .filter(t => t.category === 'empresa')
    .reduce((sum, t) => sum + t.amount, 0);
  const familyIncome = incomeTransactions
    .filter(t => t.category === 'familia')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeIncomeCategories = categories.filter(c => c.type === 'income' && c.isActive);

  const handleCreateIncome = () => {
    if (!newIncome.category || !newIncome.subcategory || !newIncome.amount || !newIncome.description) return;

    addTransaction({
      type: 'income',
      category: newIncome.category as 'empresa' | 'familia',
      subcategory: newIncome.subcategory,
      amount: parseFloat(newIncome.amount),
      description: newIncome.description,
      date: newIncome.date,
      status: 'completed'
    });

    setNewIncome({
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewIncome({
      category: transaction.category,
      subcategory: transaction.subcategory,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTransaction = () => {
    if (!editingTransaction || !newIncome.category || !newIncome.subcategory || !newIncome.amount || !newIncome.description) return;

    updateTransaction(editingTransaction.id, {
      category: newIncome.category as 'empresa' | 'familia',
      subcategory: newIncome.subcategory,
      amount: parseFloat(newIncome.amount),
      description: newIncome.description,
      date: newIncome.date
    });

    setEditingTransaction(null);
    setNewIncome({
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  const filteredCategories = activeIncomeCategories.filter(c => 
    !newIncome.category || c.category === newIncome.category
  );

  return (
    <div className="space-y-6">
      {/* Resumo de Entradas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('totalGeneral')}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(companyIncome + familyIncome)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('company')}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(companyIncome)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Home className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('family')}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(familyIncome)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Entradas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('recentIncome')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                setEditingTransaction(null);
                setNewIncome({
                  category: '',
                  subcategory: '',
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0]
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('newIncome')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? t('editIncome') : t('newIncome')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">{t('categoryGroup')}</Label>
                  <Select value={newIncome.category} onValueChange={(value) => 
                    setNewIncome(prev => ({...prev, category: value, subcategory: ''}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'pt' ? 'Selecione o grupo' : 'Select group'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">{t('company')}</SelectItem>
                      <SelectItem value="familia">{t('family')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subcategory">{t('category')}</Label>
                  <Select value={newIncome.subcategory} onValueChange={(value) => 
                    setNewIncome(prev => ({...prev, subcategory: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'pt' ? 'Selecione a categoria' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome(prev => ({...prev, amount: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Input 
                    placeholder={t('incomeDescription')}
                    value={newIncome.description}
                    onChange={(e) => setNewIncome(prev => ({...prev, description: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="date">{t('date')}</Label>
                  <Input 
                    type="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome(prev => ({...prev, date: e.target.value}))}
                  />
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={editingTransaction ? handleUpdateTransaction : handleCreateIncome}
                >
                  {editingTransaction ? t('update') : t('registerIncome')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    transaction.category === 'empresa' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-purple-100 dark:bg-purple-900/20'
                  }`}>
                    {transaction.category === 'empresa' ? 
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : 
                      <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.subcategory}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.date, language === 'pt' ? 'pt-PT' : 'en-GB')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="outline" className={`${
                      transaction.category === 'empresa' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400' : 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400'
                    }`}>
                      {transaction.category === 'empresa' ? t('company') : t('family')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{language === 'pt' ? 'Excluir Transação' : 'Delete Transaction'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === 'pt' ? 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.' : 'Are you sure you want to delete this transaction? This action cannot be undone.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}