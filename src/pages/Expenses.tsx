import { useState } from 'react';
import { Plus, TrendingDown, Building2, Home, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/i18n';
import { Transaction } from '@/types';

export function Expenses() {
  const { 
    transactions, 
    groups, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    exportUserData,
    loading,
    checkPlanLimits
  } = useApp();
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateExpense = async (transaction: Omit<Transaction, 'id'>) => {
    setIsSubmitting(true);
    try {
      // Verificar limites do plano
      const canCreate = await checkPlanLimits('transaction');
      if (!canCreate) {
        setIsSubmitting(false);
        return;
      }

      await addTransaction(transaction);
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExpense = async (transaction: Omit<Transaction, 'id'>) => {
    if (!editingTransaction) return;
    
    setIsSubmitting(true);
    try {
      await updateTransaction(editingTransaction.id, transaction);
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const handleExportData = async () => {
    try {
      await exportUserData();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600">Controle seus gastos e custos</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Editar Despesa' : 'Nova Despesa'}
                </DialogTitle>
              </DialogHeader>
              <TransactionForm
                transaction={editingTransaction || undefined}
                type="expense"
                onSubmit={editingTransaction ? handleUpdateExpense : handleCreateExpense}
                onCancel={() => setIsDialogOpen(false)}
                isLoading={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumo de Despesas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-red-600">
                {expenseTransactions.length} transações
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
                <p className="text-xs text-gray-500">
                  {expenseTransactions.filter(t => t.category === group.id).length} transações
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Despesas */}
      <TransactionList
        transactions={expenseTransactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        isLoading={loading.transactions}
      />
    </div>
  );
}