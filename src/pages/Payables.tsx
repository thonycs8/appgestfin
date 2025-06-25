import { useState } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, Building2, Home, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/i18n';
import { Payable } from '@/types';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  pending: Calendar,
  paid: CheckCircle,
  overdue: AlertTriangle
};

export function Payables() {
  const { payables, addPayable, updatePayable, deletePayable, t, language } = useApp();
  
  const [newPayable, setNewPayable] = useState({
    description: '',
    amount: '',
    dueDate: '',
    category: '',
    supplier: ''
  });

  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const overduePayables = payables.filter(p => p.status === 'overdue');
  const pendingPayables = payables.filter(p => p.status === 'pending');
  const paidPayables = payables.filter(p => p.status === 'paid');

  const totalOverdue = overduePayables.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('pending');
      case 'paid': return t('paid');
      case 'overdue': return t('overdue');
      default: return status;
    }
  };

  const resetForm = () => {
    setNewPayable({
      description: '',
      amount: '',
      dueDate: '',
      category: '',
      supplier: ''
    });
  };

  const handleCreatePayable = async () => {
    if (!newPayable.description || !newPayable.amount || !newPayable.dueDate || !newPayable.category) {
      alert(language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(newPayable.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await addPayable({
        description: newPayable.description.trim(),
        amount: amount,
        dueDate: newPayable.dueDate,
        category: newPayable.category as 'empresa' | 'familia',
        status: 'pending',
        supplier: newPayable.supplier.trim() || undefined
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating payable:', error);
    }
  };

  const handleEditPayable = (payable: Payable) => {
    setEditingPayable(payable);
    setNewPayable({
      description: payable.description,
      amount: payable.amount.toString(),
      dueDate: payable.dueDate,
      category: payable.category,
      supplier: payable.supplier || ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdatePayable = async () => {
    if (!editingPayable || !newPayable.description || !newPayable.amount || !newPayable.dueDate || !newPayable.category) {
      alert(language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill in all required fields.');
      return;
    }

    const amount = parseFloat(newPayable.amount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await updatePayable(editingPayable.id, {
        description: newPayable.description.trim(),
        amount: amount,
        dueDate: newPayable.dueDate,
        category: newPayable.category as 'empresa' | 'familia',
        supplier: newPayable.supplier.trim() || undefined
      });

      setEditingPayable(null);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating payable:', error);
    }
  };

  const handleDeletePayable = async (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir esta conta a pagar?' : 'Are you sure you want to delete this payable?')) {
      try {
        await deletePayable(id);
      } catch (error) {
        console.error('Error deleting payable:', error);
      }
    }
  };

  const handleMarkAsPaid = async (payable: Payable) => {
    try {
      await updatePayable(payable.id, { status: 'paid' });
    } catch (error) {
      console.error('Error marking payable as paid:', error);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingPayable(null);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('overdue')}</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(totalOverdue)}
              </p>
              <p className="text-xs text-gray-500">{overduePayables.length} {t('accounts')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('toPay')}</p>
              <p className="text-2xl font-bold text-yellow-700">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-xs text-gray-500">{pendingPayables.length} {t('accounts')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('totalGeneral')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalOverdue + totalPending)}
              </p>
              <p className="text-xs text-gray-500">
                {overduePayables.length + pendingPayables.length} {t('activeAccounts')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('payables')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('newAccount')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPayable ? 'Editar Conta a Pagar' : t('registerNewAccount')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Input 
                    placeholder={language === 'pt' ? 'Ex: Aluguel, Financiamento...' : 'Ex: Rent, Financing...'}
                    value={newPayable.description}
                    onChange={(e) => setNewPayable(prev => ({...prev, description: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">{t('supplier')}</Label>
                  <Input 
                    placeholder={t('supplierName')}
                    value={newPayable.supplier}
                    onChange={(e) => setNewPayable(prev => ({...prev, supplier: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newPayable.amount}
                    onChange={(e) => setNewPayable(prev => ({...prev, amount: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">{t('dueDate')}</Label>
                  <Input 
                    type="date"
                    value={newPayable.dueDate}
                    onChange={(e) => setNewPayable(prev => ({...prev, dueDate: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select value={newPayable.category} onValueChange={(value) => 
                    setNewPayable(prev => ({...prev, category: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'pt' ? 'Selecione a categoria' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">{t('company')}</SelectItem>
                      <SelectItem value="familia">{t('family')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full"
                  onClick={editingPayable ? handleUpdatePayable : handleCreatePayable}
                >
                  {editingPayable ? 'Atualizar Conta' : t('registerAccount')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">{t('all')}</TabsTrigger>
              <TabsTrigger value="overdue">{t('overdue')}</TabsTrigger>
              <TabsTrigger value="pending">{t('toPay')}</TabsTrigger>
              <TabsTrigger value="paid">{t('paid')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {payables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'pt' ? 'Nenhuma conta a pagar registrada ainda.' : 'No payables registered yet.'}
                  </p>
                  <p className="text-gray-600">
                    {language === 'pt' ? 'Clique no botão "Nova Conta" para começar.' : 'Click "New Account" button to get started.'}
                  </p>
                </div>
              ) : (
                payables.map((payable) => {
                  const StatusIcon = statusIcons[payable.status];
                  return (
                    <div key={payable.id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          payable.category === 'empresa' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {payable.category === 'empresa' ? 
                            <Building2 className="h-5 w-5 text-blue-600" /> : 
                            <Home className="h-5 w-5 text-purple-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payable.description}</p>
                          {payable.supplier && (
                            <p className="text-sm text-gray-600">{payable.supplier}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {payable.status === 'overdue' ? t('overdueOn') : t('dueOn')}: {new Date(payable.dueDate).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(payable.amount)}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={statusColors[payable.status]}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {getStatusText(payable.status)}
                            </Badge>
                            <Badge variant="outline" className={`${
                              payable.category === 'empresa' ? 'border-blue-200 text-blue-700' : 'border-purple-200 text-purple-700'
                            }`}>
                              {payable.category === 'empresa' ? t('company') : t('family')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {payable.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(payable)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              {t('markAsPaid')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayable(payable)}
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
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {language === 'pt' ? 'Excluir Conta a Pagar' : 'Delete Payable'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === 'pt' 
                                    ? 'Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.'
                                    : 'Are you sure you want to delete this payable? This action cannot be undone.'
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {language === 'pt' ? 'Cancelar' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePayable(payable.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {language === 'pt' ? 'Excluir' : 'Delete'}
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
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              {overduePayables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>{language === 'pt' ? 'Nenhuma conta vencida' : 'No overdue accounts'}</p>
                </div>
              ) : (
                overduePayables.map((payable) => (
                  <div key={payable.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payable.description}</p>
                        {payable.supplier && (
                          <p className="text-sm text-gray-600">{payable.supplier}</p>
                        )}
                        <p className="text-xs text-red-600 font-medium">
                          {t('overdueOn')} {new Date(payable.dueDate).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-700">
                          {formatCurrency(payable.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsPaid(payable)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t('payNow')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayable(payable)}
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
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === 'pt' ? 'Excluir Conta a Pagar' : 'Delete Payable'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'pt' 
                                  ? 'Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.'
                                  : 'Are you sure you want to delete this payable? This action cannot be undone.'
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === 'pt' ? 'Cancelar' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePayable(payable.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {language === 'pt' ? 'Excluir' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingPayables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>{language === 'pt' ? 'Nenhuma conta pendente' : 'No pending accounts'}</p>
                </div>
              ) : (
                pendingPayables.map((payable) => (
                  <div key={payable.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payable.description}</p>
                        {payable.supplier && (
                          <p className="text-sm text-gray-600">{payable.supplier}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {t('dueOn')} {new Date(payable.dueDate).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-700">
                          {formatCurrency(payable.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleMarkAsPaid(payable)}
                        >
                          {t('markAsPaid')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayable(payable)}
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
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === 'pt' ? 'Excluir Conta a Pagar' : 'Delete Payable'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'pt' 
                                  ? 'Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.'
                                  : 'Are you sure you want to delete this payable? This action cannot be undone.'
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === 'pt' ? 'Cancelar' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePayable(payable.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {language === 'pt' ? 'Excluir' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="paid" className="space-y-4">
              {paidPayables.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>{t('noPaidAccounts')}</p>
                </div>
              ) : (
                paidPayables.map((payable) => (
                  <div key={payable.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payable.description}</p>
                        {payable.supplier && (
                          <p className="text-sm text-gray-600">{payable.supplier}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {language === 'pt' ? 'Pago em' : 'Paid on'}: {new Date(payable.dueDate).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(payable.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayable(payable)}
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
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === 'pt' ? 'Excluir Conta a Pagar' : 'Delete Payable'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === 'pt' 
                                  ? 'Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.'
                                  : 'Are you sure you want to delete this payable? This action cannot be undone.'
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === 'pt' ? 'Cancelar' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePayable(payable.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {language === 'pt' ? 'Excluir' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}