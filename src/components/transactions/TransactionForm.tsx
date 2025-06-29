import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/i18n';

interface TransactionFormProps {
  transaction?: Transaction;
  type: 'income' | 'expense';
  onSubmit: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransactionForm({ 
  transaction, 
  type, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TransactionFormProps) {
  const { categories, groups, addCategory } = useApp();
  
  const [formData, setFormData] = useState({
    type,
    category: transaction?.category || '',
    subcategory: transaction?.subcategory || '',
    amount: transaction?.amount?.toString() || '',
    description: transaction?.description || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    status: transaction?.status || 'completed'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const availableCategories = categories.filter(c => c.type === type && c.isActive);
  const availableGroups = groups.filter(g => g.isActive);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        type: formData.type as 'income' | 'expense',
        category: formData.category || 'geral',
        subcategory: formData.subcategory || 'Sem categoria',
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: formData.date,
        status: formData.status as 'pending' | 'completed' | 'cancelled'
      });
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      await addCategory({
        name: newCategoryName.trim(),
        type,
        color: newCategoryColor,
        isActive: true
      });
      
      setFormData(prev => ({ ...prev, subcategory: newCategoryName.trim() }));
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const getGroupById = (id: string) => groups.find(g => g.id === id);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: type === 'income' ? '#22c55e' : '#ef4444' }}
          />
          {transaction ? 'Editar' : 'Nova'} {type === 'income' ? 'Receita' : 'Despesa'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Valor <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <p className="text-sm text-gray-600">
                {formatCurrency(parseFloat(formData.amount))}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={`Descreva esta ${type === 'income' ? 'receita' : 'despesa'}...`}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Grupo */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Grupo
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((group) => (
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
            {formData.category && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: getGroupById(formData.category)?.color || '#3b82f6',
                    color: getGroupById(formData.category)?.color || '#3b82f6'
                  }}
                >
                  {getGroupById(formData.category)?.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium">
              Categoria
            </Label>
            <div className="flex gap-2">
              <Select 
                value={formData.subcategory} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione a categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCategory(!showNewCategory)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Nova categoria */}
            {showNewCategory && (
              <Card className="p-4 border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Nova Categoria</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCategory(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-16"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || isCreatingCategory}
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Criar'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {formData.subcategory && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {formData.subcategory}
                </Badge>
              </div>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Data <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'pending' | 'completed' | 'cancelled' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${
                type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                transaction ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}