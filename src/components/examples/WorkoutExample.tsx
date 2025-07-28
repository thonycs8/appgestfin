import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle, Plus, Edit, Trash2, Dumbbell } from 'lucide-react';
import { useWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from '@/lib/queries';
import { toast } from 'sonner';

interface WorkoutFormData {
  name: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: string;
}

export function WorkoutExample() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    description: '',
    duration: '',
    difficulty: 'beginner',
    exercises: ''
  });

  // TanStack Query hooks
  const { 
    data: workouts = [], 
    isLoading, 
    error, 
    refetch 
  } = useWorkouts();

  const createWorkoutMutation = useCreateWorkout();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      difficulty: 'beginner',
      exercises: ''
    });
    setEditingWorkout(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.duration) {
      toast.error('Nome e duração são obrigatórios');
      return;
    }

    const workoutData = {
      name: formData.name,
      description: formData.description,
      duration: parseInt(formData.duration),
      difficulty: formData.difficulty,
      exercises: formData.exercises.split(',').map(ex => ex.trim()).filter(Boolean)
    };

    try {
      if (editingWorkout) {
        await updateWorkoutMutation.mutateAsync({
          id: editingWorkout.id,
          updates: workoutData
        });
        toast.success('Treino atualizado com sucesso!');
      } else {
        await createWorkoutMutation.mutateAsync(workoutData);
        toast.success('Treino criado com sucesso!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Erro ao salvar treino');
    }
  };

  const handleEdit = (workout: any) => {
    setEditingWorkout(workout);
    setFormData({
      name: workout.name,
      description: workout.description,
      duration: workout.duration.toString(),
      difficulty: workout.difficulty,
      exercises: workout.exercises.join(', ')
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
      try {
        await deleteWorkoutMutation.mutateAsync(id);
        toast.success('Treino excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting workout:', error);
        toast.error('Erro ao excluir treino');
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos de Treino</h1>
          <p className="text-gray-600">Exemplo de TanStack Query com Supabase</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Treino
        </Button>
      </div>

      {/* Estados de Loading e Error */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <LoadingSpinner size="lg" text="Carregando treinos..." />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Erro ao carregar treinos</p>
                <p className="text-sm text-red-500">{error.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingWorkout ? 'Editar Treino' : 'Novo Treino'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Treino</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Treino de Peito e Tríceps"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                    setFormData(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o treino..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="exercises">Exercícios (separados por vírgula)</Label>
                <Textarea
                  id="exercises"
                  value={formData.exercises}
                  onChange={(e) => setFormData(prev => ({ ...prev, exercises: e.target.value }))}
                  placeholder="Supino reto, Supino inclinado, Tríceps pulley, Mergulho"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkoutMutation.isPending || updateWorkoutMutation.isPending}
                >
                  {(createWorkoutMutation.isPending || updateWorkoutMutation.isPending) ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Salvando...
                    </>
                  ) : (
                    editingWorkout ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Treinos */}
      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum treino encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece criando seu primeiro plano de treino
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Treino
                </Button>
              </CardContent>
            </Card>
          ) : (
            workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(workout)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(workout.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        disabled={deleteWorkoutMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{workout.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getDifficultyColor(workout.difficulty)}>
                      {getDifficultyText(workout.difficulty)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {workout.duration} min
                    </span>
                  </div>

                  {workout.exercises && workout.exercises.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Exercícios ({workout.exercises.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {workout.exercises.slice(0, 3).map((exercise, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {exercise}
                          </Badge>
                        ))}
                        {workout.exercises.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{workout.exercises.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    Criado em {new Date(workout.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Debug Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug - TanStack Query Status</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</p>
              <p><strong>Error:</strong> {error ? 'Sim' : 'Não'}</p>
              <p><strong>Workouts Count:</strong> {workouts.length}</p>
            </div>
            <div>
              <p><strong>Create Pending:</strong> {createWorkoutMutation.isPending ? 'Sim' : 'Não'}</p>
              <p><strong>Update Pending:</strong> {updateWorkoutMutation.isPending ? 'Sim' : 'Não'}</p>
              <p><strong>Delete Pending:</strong> {deleteWorkoutMutation.isPending ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}