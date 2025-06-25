import { useState } from 'react';
import { Plus, Edit, Trash2, Tags, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/i18n';

const colorOptions = [
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Cinza', value: '#6b7280' }
];

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, t, transactions } = useApp();
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: '' as 'income' | 'expense' | '',
    color: '#22c55e'
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCategory = () => {
    if (!newCategory.name || !newCategory.type) return;

    addCategory({
      name: newCategory.name,
      type: newCategory.type as 'income' | 'expense',
      color: newCategory.color,
      isActive: true
    });
    
    setNewCategory({ name: '', type: '', color: '#22c55e' });
    setIsDialogOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name || !newCategory.type) return;

    updateCategory(editingCategory.id, {
      name: newCategory.name,
      type: newCategory.type as 'income' | 'expense',
      color: newCategory.color
    });
    
    setEditingCategory(null);
    setNewCategory({ name: '', type: '', color: '#22c55e' });
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    const isUsed = transactions.some(t => t.subcategory === categories.find(c => c.id === id)?.name);
    if (isUsed) {
      alert('Esta categoria está sendo usada em transações e não pode ser excluída.');
      return;
    }
    deleteCategory(id);
  };

  const handleToggleActive = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      updateCategory(id, { isActive: !category.isActive });
    }
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const getCategoryUsage = (categoryName: string) => {
    const categoryTransactions = transactions.filter(t => t.subcategory === categoryName);
    return categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light text-black mb-2">Categorias</h1>
              <p className="text-gray-600 text-lg">Organize suas transações financeiras</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-sm font-medium"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategory({ name: '', type: '', color: '#22c55e' });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-xl font-light text-black">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome da Categoria</Label>
                    <Input 
                      placeholder="Ex: Marketing, Alimentação, Salário..."
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({...prev, name: e.target.value}))}
                      className="mt-1 border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">Tipo</Label>
                    <Select value={newCategory.type} onValueChange={(value: 'income' | 'expense') => 
                      setNewCategory(prev => ({...prev, type: value}))
                    }>
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="color" className="text-sm font-medium text-gray-700">Cor</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-full h-12 rounded border-2 transition-all ${
                            newCategory.color === color.value 
                              ? 'border-black scale-105' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewCategory(prev => ({...prev, color: color.value}))}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white py-3 text-sm font-medium" 
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  >
                    {editingCategory ? 'Atualizar' : 'Criar Categoria'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded">
                  <Tags className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-light text-black">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded">
                  <TrendingUp className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receitas</p>
                  <p className="text-2xl font-light text-black">{incomeCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded">
                  <TrendingDown className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-2xl font-light text-black">{expenseCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded">
                  <Eye className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ativas</p>
                  <p className="text-2xl font-light text-black">
                    {categories.filter(cat => cat.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Categories */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-light text-black flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Categorias de Receita ({incomeCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {incomeCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma categoria de receita criada</p>
                  </div>
                ) : (
                  incomeCategories.map((category) => {
                    const usage = getCategoryUsage(category.name);
                    return (
                      <div key={category.id} className="group p-4 border border-gray-100 rounded hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-200" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <p className="font-medium text-black">{category.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {!category.isActive && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    <EyeOff className="h-3 w-3 mr-1" />Inativa
                                  </Badge>
                                )}
                                {usage > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {formatCurrency(usage)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Switch
                              checked={category.isActive}
                              onCheckedChange={() => handleToggleActive(category.id)}
                              className="data-[state=checked]:bg-black"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <Trash2 className="h-4 w-4 text-gray-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border border-gray-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-light text-black">Excluir Categoria</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-black hover:bg-gray-800 text-white"
                                  >
                                    Excluir
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

          {/* Expense Categories */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-light text-black flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                Categorias de Despesa ({expenseCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {expenseCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma categoria de despesa criada</p>
                  </div>
                ) : (
                  expenseCategories.map((category) => {
                    const usage = getCategoryUsage(category.name);
                    return (
                      <div key={category.id} className="group p-4 border border-gray-100 rounded hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-200" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <p className="font-medium text-black">{category.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {!category.isActive && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    <EyeOff className="h-3 w-3 mr-1" />Inativa
                                  </Badge>
                                )}
                                {usage > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {formatCurrency(usage)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Switch
                              checked={category.isActive}
                              onCheckedChange={() => handleToggleActive(category.id)}
                              className="data-[state=checked]:bg-black"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                  <Trash2 className="h-4 w-4 text-gray-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border border-gray-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-light text-black">Excluir Categoria</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-black hover:bg-gray-800 text-white"
                                  >
                                    Excluir
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
      </div>
    </div>
  );
}