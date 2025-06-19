import { useState } from 'react';
import { Plus, TrendingUp, Building2, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockTransactions } from '@/lib/data';

export function Income() {
  const [newIncome, setNewIncome] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: ''
  });

  const incomeTransactions = mockTransactions.filter(t => t.type === 'income');
  const companyIncome = incomeTransactions
    .filter(t => t.category === 'empresa')
    .reduce((sum, t) => sum + t.amount, 0);
  const familyIncome = incomeTransactions
    .filter(t => t.category === 'familia')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Resumo de Entradas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(companyIncome + familyIncome).toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empresa</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {companyIncome.toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Home className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Família</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {familyIncome.toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Entradas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entradas Recentes</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nova Entrada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newIncome.category} onValueChange={(value) => 
                    setNewIncome(prev => ({...prev, category: value}))
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
                <div>
                  <Label htmlFor="subcategory">Subcategoria</Label>
                  <Input 
                    placeholder="Ex: Prestação de serviços, Salário..."
                    value={newIncome.subcategory}
                    onChange={(e) => setNewIncome(prev => ({...prev, subcategory: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome(prev => ({...prev, amount: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    placeholder="Descrição da entrada..."
                    value={newIncome.description}
                    onChange={(e) => setNewIncome(prev => ({...prev, description: e.target.value}))}
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Registrar Entrada
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    transaction.category === 'empresa' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {transaction.category === 'empresa' ? 
                      <Building2 className="h-5 w-5 text-blue-600" /> : 
                      <Home className="h-5 w-5 text-purple-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.subcategory}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +R$ {transaction.amount.toLocaleString('pt-BR')}
                  </p>
                  <Badge variant="outline" className={`${
                    transaction.category === 'empresa' ? 'border-blue-200 text-blue-700' : 'border-purple-200 text-purple-700'
                  }`}>
                    {transaction.category === 'empresa' ? 'Empresa' : 'Família'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}