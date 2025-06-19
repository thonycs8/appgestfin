import { useState } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, Building2, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPayables } from '@/lib/data';

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
  const [newPayable, setNewPayable] = useState({
    description: '',
    amount: '',
    dueDate: '',
    category: '',
    supplier: ''
  });

  const overduePayables = mockPayables.filter(p => p.status === 'overdue');
  const pendingPayables = mockPayables.filter(p => p.status === 'pending');
  const paidPayables = mockPayables.filter(p => p.status === 'paid');

  const totalOverdue = overduePayables.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayables.reduce((sum, p) => sum + p.amount, 0);

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
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-700">
                R$ {totalOverdue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">{overduePayables.length} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">A Vencer</p>
              <p className="text-2xl font-bold text-yellow-700">
                R$ {totalPending.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">{pendingPayables.length} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(totalOverdue + totalPending).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">
                {overduePayables.length + pendingPayables.length} contas ativas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contas a Pagar</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nova Conta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    placeholder="Ex: Aluguel, Financiamento..."
                    value={newPayable.description}
                    onChange={(e) => setNewPayable(prev => ({...prev, description: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input 
                    placeholder="Nome do fornecedor..."
                    value={newPayable.supplier}
                    onChange={(e) => setNewPayable(prev => ({...prev, supplier: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={newPayable.amount}
                    onChange={(e) => setNewPayable(prev => ({...prev, amount: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input 
                    type="date"
                    value={newPayable.dueDate}
                    onChange={(e) => setNewPayable(prev => ({...prev, dueDate: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newPayable.category} onValueChange={(value) => 
                    setNewPayable(prev => ({...prev, category: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  Registrar Conta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="overdue">Vencidas</TabsTrigger>
              <TabsTrigger value="pending">A Vencer</TabsTrigger>
              <TabsTrigger value="paid">Pagas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {mockPayables.map((payable) => {
                const StatusIcon = statusIcons[payable.status];
                return (
                  <div key={payable.id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
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
                        <p className="text-sm text-gray-600">{payable.supplier}</p>
                        <p className="text-xs text-gray-500">
                          Vence: {new Date(payable.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-lg font-bold text-gray-900">
                        R$ {payable.amount.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex gap-2">
                        <Badge className={statusColors[payable.status]}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {payable.status === 'pending' ? 'Pendente' : 
                           payable.status === 'paid' ? 'Paga' : 'Vencida'}
                        </Badge>
                        <Badge variant="outline" className={`${
                          payable.category === 'empresa' ? 'border-blue-200 text-blue-700' : 'border-purple-200 text-purple-700'
                        }`}>
                          {payable.category === 'empresa' ? 'Empresa' : 'Família'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              {overduePayables.map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payable.description}</p>
                      <p className="text-sm text-gray-600">{payable.supplier}</p>
                      <p className="text-xs text-red-600 font-medium">
                        Venceu em {new Date(payable.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-700">
                      R$ {payable.amount.toLocaleString('pt-BR')}
                    </p>
                    <Button size="sm" variant="destructive">
                      Pagar Agora
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingPayables.map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payable.description}</p>
                      <p className="text-sm text-gray-600">{payable.supplier}</p>
                      <p className="text-xs text-gray-500">
                        Vence em {new Date(payable.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-700">
                      R$ {payable.amount.toLocaleString('pt-BR')}
                    </p>
                    <Button size="sm" variant="secondary">
                      Marcar como Pago
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="paid" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Nenhuma conta paga encontrada</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}