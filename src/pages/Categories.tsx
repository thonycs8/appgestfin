import { useState } from 'react';
import { Plus, Edit, Trash2, Tags, Building2, Home, TrendingUp, TrendingDown } from 'lucide-react';
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
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Cinza', value: '#6b7280' }
];

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, t, transactions } = useApp();
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: '' as 'income' | 'expense' | '',
    category: '' as 'empresa' | 'familia' | '',
    color: '#22c55e'
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCategory = () => {
    if (!newCategory.name || !newCategory.type || !newCategory.category) return;

    addCategory({
      name: newCategory.name,
      type: newCategory.type as 'income' | 'expense',
      category: newCategory.category as 'empresa' | 'familia',
      color: newCategory.color
    });
    
    setNewCategory({ name: '', type: '', category: '', color: '#22c55e' });
    setIsDialogOpen(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      type: category.type,
      category: category.category,
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name || !newCategory.type || !newCategory.category) return;

    updateCategory(editingCategory.id, {
      name: newCategory.name,
      type: newCategory.type as 'income' | 'expense',
      category: newCategory.category as 'empresa' | 'familia',
      color: newCategory.color
    });
    
    setEditingCategory(null);
    setNewCategory({ name: '', type: '', category: '', color: '#22c55e' });
    setIsDialogOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if category is being used
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
  const companyCategories = categories.filter(cat => cat.category === 'empresa');
  const familyCategories = categories.filter(cat => cat.category === 'familia');

  // Calculate category usage
  const getCategoryUsage = (categoryName: string) => {
    const categoryTransactions = transactions.filter(t => t.subcategory === categoryName);
    return categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Tags className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('income')}</p>
              <p className="text-2xl font-bold text-foreground">{incomeCategories.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('expense')}</p>
              <p className="text-2xl font-bold text-foreground">{expenseCategories.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{t('active')}</p>
              <p className="text-2xl font-bold text-foreground">
                {categories.filter(cat => cat.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categorias por Tipo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">
              {t('incomeCategories')} ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomeCategories.map((category) => {
              const usage = getCategoryUsage(category.name);
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {category.category === 'empresa' ? t('company') : t('family')}
                        </Badge>
                        {!category.isActive && (
                          <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>
                        )}
                        {usage > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(usage)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
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
                          <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">
              {t('expenseCategories')} ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenseCategories.map((category) => {
              const usage = getCategoryUsage(category.name);
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {category.category === 'empresa' ? t('company') : t('family')}
                        </Badge>
                        {!category.isActive && (
                          <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>
                        )}
                        {usage > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(usage)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => handleToggleActive(category.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
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
                          <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Botão Nova Categoria */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('categories')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null);
                setNewCategory({ name: '', type: '', category: '', color: '#22c55e' });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('newCategory')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? t('editCategory') : t('newCategory')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('categoryName')}</Label>
                  <Input 
                    placeholder="Ex: Marketing, Alimentação..."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="type">{t('categoryType')}</Label>
                  <Select value={newCategory.type} onValueChange={(value: 'income' | 'expense') => 
                    setNewCategory(prev => ({...prev, type: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t('income')}</SelectItem>
                      <SelectItem value="expense">{t('expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">{t('categoryGroup')}</Label>
                  <Select value={newCategory.category} onValueChange={(value: 'empresa' | 'familia') => 
                    setNewCategory(prev => ({...prev, category: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">{t('company')}</SelectItem>
                      <SelectItem value="familia">{t('family')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">{t('categoryColor')}</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-full h-10 rounded-lg border-2 transition-all ${
                          newCategory.color === color.value 
                            ? 'border-foreground scale-110' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewCategory(prev => ({...prev, color: color.value}))}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                >
                  {editingCategory ? t('update') : t('create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>
    </div>
  );
}