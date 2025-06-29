import { useState } from 'react';
import { TrendingUp, Target, Calendar, DollarSign, PieChart, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/i18n';

// Mock data for financial management
const performanceData = [
  { month: 'Jan', receita: 25000, despesa: 18000, lucro: 7000 },
  { month: 'Fev', receita: 28000, despesa: 19500, lucro: 8500 },
  { month: 'Mar', receita: 32000, despesa: 21000, lucro: 11000 },
  { month: 'Abr', receita: 29000, despesa: 20000, lucro: 9000 },
  { month: 'Mai', receita: 35000, despesa: 22000, lucro: 13000 },
  { month: 'Jun', receita: 38000, despesa: 24000, lucro: 14000 }
];

const categoryPerformance = [
  { name: 'Prestação de Serviços', valor: 180000, meta: 200000 },
  { name: 'Consultoria', valor: 95000, meta: 100000 },
  { name: 'Produtos Digitais', valor: 45000, meta: 60000 },
  { name: 'Treinamentos', valor: 25000, meta: 30000 }
];

export function Management() {
  const { 
    budgets, 
    goals, 
    groups,
    addBudget, 
    updateBudget, 
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    language 
  } = useApp();

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: '',
    deadline: ''
  });

  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    subcategory: '',
    budgetAmount: '',
    period: 'monthly' as 'monthly' | 'quarterly' | 'yearly'
  });

  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const resetBudgetForm = () => {
    setNewBudget({
      name: '',
      category: '',
      subcategory: '',
      budgetAmount: '',
      period: 'monthly'
    });
  };

  const resetGoalForm = () => {
    setNewGoal({
      title: '',
      description: '',
      targetAmount: '',
      category: '',
      deadline: ''
    });
  };

  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.budgetAmount) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios.' : 'Please fill in the required fields.');
      return;
    }

    const amount = parseFloat(newBudget.budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await addBudget({
        name: newBudget.name,
        category: newBudget.category || 'geral',
        subcategory: newBudget.subcategory || 'Geral',
        budgetAmount: amount,
        spentAmount: 0,
        period: newBudget.period,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      resetBudgetForm();
      setIsBudgetDialogOpen(false);
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget || !newBudget.name || !newBudget.budgetAmount) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios.' : 'Please fill in the required fields.');
      return;
    }

    const amount = parseFloat(newBudget.budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await updateBudget(editingBudget.id, {
        name: newBudget.name,
        category: newBudget.category || 'geral',
        subcategory: newBudget.subcategory || 'Geral',
        budgetAmount: amount,
        period: newBudget.period
      });

      setEditingBudget(null);
      resetBudgetForm();
      setIsBudgetDialogOpen(false);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setNewBudget({
      name: budget.name,
      category: budget.category,
      subcategory: budget.subcategory,
      budgetAmount: budget.budgetAmount.toString(),
      period: budget.period
    });
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir este orçamento?' : 'Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.targetAmount) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios.' : 'Please fill in the required fields.');
      return;
    }

    const amount = parseFloat(newGoal.targetAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await addGoal({
        title: newGoal.title,
        description: newGoal.description,
        targetAmount: amount,
        currentAmount: 0,
        category: newGoal.category || 'geral',
        deadline: newGoal.deadline,
        status: 'active'
      });

      resetGoalForm();
      setIsGoalDialogOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !newGoal.title || !newGoal.targetAmount) {
      alert(language === 'pt' ? 'Por favor, preencha os campos obrigatórios.' : 'Please fill in the required fields.');
      return;
    }

    const amount = parseFloat(newGoal.targetAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'pt' ? 'Por favor, digite um valor válido.' : 'Please enter a valid amount.');
      return;
    }

    try {
      await updateGoal(editingGoal.id, {
        title: newGoal.title,
        description: newGoal.description,
        targetAmount: amount,
        category: newGoal.category || 'geral',
        deadline: newGoal.deadline
      });

      setEditingGoal(null);
      resetGoalForm();
      setIsGoalDialogOpen(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount.toString(),
      category: goal.category,
      deadline: goal.deadline
    });
    setIsGoalDialogOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir esta meta?' : 'Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(id);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const handleBudgetDialogOpenChange = (open: boolean) => {
    setIsBudgetDialogOpen(open);
    if (!open) {
      setEditingBudget(null);
      resetBudgetForm();
    }
  };

  const handleGoalDialogOpenChange = (open: boolean) => {
    setIsGoalDialogOpen(open);
    if (!open) {
      setEditingGoal(null);
      resetGoalForm();
    }
  };

  const getGroupById = (id: string) => groups.find(g => g.id === id);

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ROI Médio</p>
              <p className="text-2xl font-bold text-gray-900">18.5%</p>
              <p className="text-xs text-green-600">+2.3% vs mês anterior</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Metas Atingidas</p>
              <p className="text-2xl font-bold text-gray-900">75%</p>
              <p className="text-xs text-blue-600">{goals.filter(g => g.status === 'completed').length} de {goals.length} metas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Margem Líquida</p>
              <p className="text-2xl font-bold text-gray-900">36.8%</p>
              <p className="text-xs text-purple-600">Acima da meta</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orçamentos</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
              <p className="text-xs text-orange-600">Utilização média</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Gráfico de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Financeira - Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value.toLocaleString('pt-PT')}`, 'Valor']} />
                  <Legend />
                  <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={3} name="Receita" />
                  <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} name="Despesa" />
                  <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resumo de Metas e Orçamentos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metas em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const group = getGroupById(goal.category);
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{goal.title}</h4>
                        <Badge variant="outline" style={{ 
                          borderColor: group?.color || '#3b82f6', 
                          color: group?.color || '#3b82f6' 
                        }}>
                          {group?.name || 'Geral'}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Status dos Orçamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgets.slice(0, 3).map((budget) => {
                  const usage = (budget.spentAmount / budget.budgetAmount) * 100;
                  const isOverBudget = usage > 100;
                  const isNearLimit = usage > 80 && usage <= 100;
                  const group = getGroupById(budget.category);
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{budget.name}</h4>
                        <div className="flex items-center gap-2">
                          {isOverBudget ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : isNearLimit ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <Badge variant="outline" style={{ 
                            borderColor: group?.color || '#3b82f6', 
                            color: group?.color || '#3b82f6' 
                          }}>
                            {group?.name || 'Geral'}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(usage, 100)} 
                        className={`h-2 ${isOverBudget ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`} 
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatCurrency(budget.spentAmount)}</span>
                        <span className={usage > 100 ? 'text-red-600 font-medium' : ''}>
                          {formatCurrency(budget.budgetAmount)} ({usage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metas Financeiras</CardTitle>
              <Dialog open={isGoalDialogOpen} onOpenChange={handleGoalDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Target className="mr-2 h-4 w-4" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título da Meta</Label>
                      <Input 
                        placeholder="Ex: Reserva de Emergência"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal(prev => ({...prev, title: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input 
                        placeholder="Descreva o objetivo da meta..."
                        value={newGoal.description}
                        onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetAmount">Valor Alvo</Label>
                      <Input 
                        type="number"
                        placeholder="0,00"
                        value={newGoal.targetAmount}
                        onChange={(e) => setNewGoal(prev => ({...prev, targetAmount: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Grupo</Label>
                      <Select value={newGoal.category} onValueChange={(value) => 
                        setNewGoal(prev => ({...prev, category: value}))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
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
                    </div>
                    <div>
                      <Label htmlFor="deadline">Prazo</Label>
                      <Input 
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal(prev => ({...prev, deadline: e.target.value}))}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                    >
                      {editingGoal ? 'Atualizar Meta' : 'Criar Meta'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const remaining = goal.targetAmount - goal.currentAmount;
                const daysUntilDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const group = getGroupById(goal.category);
                
                return (
                  <div key={goal.id} className="p-6 border rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{goal.title}</h3>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" style={{ 
                          borderColor: group?.color || '#3b82f6', 
                          color: group?.color || '#3b82f6' 
                        }}>
                          {group?.name || 'Geral'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso: {progress.toFixed(1)}%</span>
                        <span>Faltam: {formatCurrency(remaining)}</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className={`flex items-center gap-1 ${daysUntilDeadline < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                        <Calendar className="h-4 w-4" />
                        {daysUntilDeadline > 0 ? `${daysUntilDeadline} dias restantes` : 'Prazo vencido'}
                      </span>
                      <Button size="sm" variant="outline">
                        Atualizar Progresso
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Orçamentos</CardTitle>
              <Dialog open={isBudgetDialogOpen} onOpenChange={handleBudgetDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Novo Orçamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Orçamento</Label>
                      <Input 
                        placeholder="Ex: Marketing Digital"
                        value={newBudget.name}
                        onChange={(e) => setNewBudget(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Grupo</Label>
                      <Select value={newBudget.category} onValueChange={(value) => 
                        setNewBudget(prev => ({...prev, category: value}))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
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
                    </div>
                    <div>
                      <Label htmlFor="subcategory">Subcategoria</Label>
                      <Input 
                        placeholder="Ex: Marketing, Alimentação..."
                        value={newBudget.subcategory}
                        onChange={(e) => setNewBudget(prev => ({...prev, subcategory: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetAmount">Valor do Orçamento</Label>
                      <Input 
                        type="number"
                        placeholder="0,00"
                        value={newBudget.budgetAmount}
                        onChange={(e) => setNewBudget(prev => ({...prev, budgetAmount: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="period">Período</Label>
                      <Select value={newBudget.period} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                        setNewBudget(prev => ({...prev, period: value}))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={editingBudget ? handleUpdateBudget : handleCreateBudget}
                    >
                      {editingBudget ? 'Atualizar Orçamento' : 'Criar Orçamento'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
              {budgets.map((budget) => {
                const usage = (budget.spentAmount / budget.budgetAmount) * 100;
                const remaining = budget.budgetAmount - budget.spentAmount;
                const isOverBudget = usage > 100;
                const isNearLimit = usage > 80 && usage <= 100;
                const group = getGroupById(budget.category);
                
                return (
                  <div key={budget.id} className={`p-6 border rounded-lg space-y-4 ${
                    isOverBudget ? 'border-red-200 bg-red-50' : 
                    isNearLimit ? 'border-yellow-200 bg-yellow-50' : 
                    'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{budget.name}</h3>
                        <p className="text-gray-600 text-sm">{budget.subcategory}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverBudget ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : isNearLimit ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <Badge variant="outline" style={{ 
                          borderColor: group?.color || '#3b82f6', 
                          color: group?.color || '#3b82f6' 
                        }}>
                          {group?.name || 'Geral'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBudget(budget)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilização: {usage.toFixed(1)}%</span>
                        <span className={remaining < 0 ? 'text-red-600 font-medium' : ''}>
                          {remaining >= 0 ? `Restam: ${formatCurrency(remaining)}` : `Excesso: ${formatCurrency(Math.abs(remaining))}`}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(usage, 100)} 
                        className={`h-3 ${
                          isOverBudget ? '[&>div]:bg-red-500' : 
                          isNearLimit ? '[&>div]:bg-yellow-500' : 
                          '[&>div]:bg-green-500'
                        }`}
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatCurrency(budget.spentAmount)}</span>
                        <span>{formatCurrency(budget.budgetAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Período: {budget.period === 'monthly' ? 'Mensal' : budget.period === 'quarterly' ? 'Trimestral' : 'Anual'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value.toLocaleString('pt-PT')}`, 'Valor']} />
                  <Legend />
                  <Bar dataKey="valor" fill="#3b82f6" name="Realizado" />
                  <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Taxa de Crescimento Mensal</span>
                  <span className="text-green-600 font-bold">+12.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Eficiência Operacional</span>
                  <span className="text-blue-600 font-bold">87.3%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Controle de Custos</span>
                  <span className="text-purple-600 font-bold">92.1%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Liquidez Corrente</span>
                  <span className="text-orange-600 font-bold">2.4x</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas e Recomendações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Orçamento próximo do limite</p>
                    <p className="text-sm text-yellow-700">Marketing Digital está em 90% do orçamento mensal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Meta atingida</p>
                    <p className="text-sm text-green-700">Receita mensal superou a meta em 15%</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Oportunidade de investimento</p>
                    <p className="text-sm text-blue-700">Considere aumentar investimento em Produtos Digitais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}