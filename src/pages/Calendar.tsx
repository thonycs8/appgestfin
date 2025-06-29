import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/i18n';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'income' | 'expense' | 'payable' | 'goal' | 'reminder';
  amount?: number;
  status?: string;
  category?: string;
  description?: string;
}

interface CalendarFilters {
  showIncome: boolean;
  showExpenses: boolean;
  showPayables: boolean;
  showGoals: boolean;
  showReminders: boolean;
  categoryFilter: string;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Calendar() {
  const { transactions, payables, goals, groups } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    showIncome: true,
    showExpenses: true,
    showPayables: true,
    showGoals: true,
    showReminders: true,
    categoryFilter: 'all'
  });

  // Generate calendar events from existing data
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Add transactions
    transactions.forEach(transaction => {
      if (filters.showIncome && transaction.type === 'income') {
        events.push({
          id: `transaction-${transaction.id}`,
          title: transaction.description,
          date: transaction.date,
          type: 'income',
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description
        });
      }
      if (filters.showExpenses && transaction.type === 'expense') {
        events.push({
          id: `transaction-${transaction.id}`,
          title: transaction.description,
          date: transaction.date,
          type: 'expense',
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description
        });
      }
    });

    // Add payables
    if (filters.showPayables) {
      payables.forEach(payable => {
        events.push({
          id: `payable-${payable.id}`,
          title: payable.description,
          date: payable.dueDate,
          type: 'payable',
          amount: payable.amount,
          status: payable.status,
          category: payable.category,
          description: payable.supplier ? `Fornecedor: ${payable.supplier}` : ''
        });
      });
    }

    // Add goals deadlines
    if (filters.showGoals) {
      goals.forEach(goal => {
        if (goal.deadline) {
          events.push({
            id: `goal-${goal.id}`,
            title: `Meta: ${goal.title}`,
            date: goal.deadline,
            type: 'goal',
            amount: goal.targetAmount,
            category: goal.category,
            description: goal.description
          });
        }
      });
    }

    // Filter by category
    if (filters.categoryFilter !== 'all') {
      return events.filter(event => event.category === filters.categoryFilter);
    }

    return events;
  }, [transactions, payables, goals, filters]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-800 border-green-200';
      case 'expense': return 'bg-red-100 text-red-800 border-red-200';
      case 'payable': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'goal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reminder': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'income': return <TrendingUp className="h-3 w-3" />;
      case 'expense': return <TrendingDown className="h-3 w-3" />;
      case 'payable': return <Clock className="h-3 w-3" />;
      case 'goal': return <Target className="h-3 w-3" />;
      case 'reminder': return <CalendarIcon className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getDayTotal = (date: Date) => {
    const events = getEventsForDate(date);
    let income = 0;
    let expenses = 0;

    events.forEach(event => {
      if (event.amount) {
        if (event.type === 'income') {
          income += event.amount;
        } else if (event.type === 'expense' || event.type === 'payable') {
          expenses += event.amount;
        }
      }
    });

    return { income, expenses, net: income - expenses };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendário Financeiro</h1>
          <p className="text-gray-600">Visualize e planeje suas finanças</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input placeholder="Título do evento..." />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="payable">Conta a Pagar</SelectItem>
                      <SelectItem value="reminder">Lembrete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (opcional)</Label>
                  <Input type="number" placeholder="0,00" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input placeholder="Descrição do evento..." />
                </div>
                <Button className="w-full">Criar Evento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={(value: 'month' | 'week' | 'agenda') => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showIncome}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showIncome: checked }))}
                  />
                  <span className="text-sm text-green-700">Receitas</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showExpenses}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showExpenses: checked }))}
                  />
                  <span className="text-sm text-red-700">Despesas</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showPayables}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showPayables: checked }))}
                  />
                  <span className="text-sm text-orange-700">Contas a Pagar</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.showGoals}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showGoals: checked }))}
                  />
                  <span className="text-sm text-blue-700">Metas</span>
                </div>
              </div>

              <Select value={filters.categoryFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, categoryFilter: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {view === 'month' && (
                <div className="space-y-4">
                  {/* Week Headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => {
                      const events = getEventsForDate(date);
                      const dayTotal = getDayTotal(date);
                      const isCurrentMonthDay = isCurrentMonth(date);
                      const isTodayDate = isToday(date);

                      return (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${
                            isTodayDate 
                              ? 'bg-blue-50 border-blue-200' 
                              : isCurrentMonthDay 
                                ? 'bg-white border-gray-200 hover:bg-gray-50' 
                                : 'bg-gray-50 border-gray-100'
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              isTodayDate 
                                ? 'text-blue-700' 
                                : isCurrentMonthDay 
                                  ? 'text-gray-900' 
                                  : 'text-gray-400'
                            }`}>
                              {date.getDate()}
                            </span>
                            {events.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {events.length}
                              </Badge>
                            )}
                          </div>

                          {/* Day Total */}
                          {(dayTotal.income > 0 || dayTotal.expenses > 0) && (
                            <div className="mb-2 text-xs">
                              {dayTotal.income > 0 && (
                                <div className="text-green-600">+{formatCurrency(dayTotal.income)}</div>
                              )}
                              {dayTotal.expenses > 0 && (
                                <div className="text-red-600">-{formatCurrency(dayTotal.expenses)}</div>
                              )}
                            </div>
                          )}

                          {/* Events */}
                          <div className="space-y-1">
                            {events.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} truncate`}
                              >
                                <div className="flex items-center gap-1">
                                  {getEventTypeIcon(event.type)}
                                  <span className="truncate">{event.title}</span>
                                </div>
                              </div>
                            ))}
                            {events.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{events.length - 2} mais
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {view === 'agenda' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Próximos Eventos</h3>
                  <div className="space-y-3">
                    {calendarEvents
                      .filter(event => new Date(event.date) >= new Date())
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 20)
                      .map(event => (
                        <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className={`p-2 rounded ${getEventTypeColor(event.type)}`}>
                            {getEventTypeIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                              {event.amount && (
                                <span className="ml-2">• {formatCurrency(event.amount)}</span>
                              )}
                            </div>
                            {event.description && (
                              <div className="text-sm text-gray-500">{event.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className={`p-3 rounded border ${getEventTypeColor(event.type)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getEventTypeIcon(event.type)}
                        <span className="font-medium text-sm">{event.title}</span>
                      </div>
                      {event.amount && (
                        <div className="text-sm font-medium">
                          {formatCurrency(event.amount)}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {event.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum evento nesta data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Receitas</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      calendarEvents
                        .filter(e => e.type === 'income' && new Date(e.date).getMonth() === currentDate.getMonth())
                        .reduce((sum, e) => sum + (e.amount || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Despesas</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(
                      calendarEvents
                        .filter(e => (e.type === 'expense' || e.type === 'payable') && new Date(e.date).getMonth() === currentDate.getMonth())
                        .reduce((sum, e) => sum + (e.amount || 0), 0)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Saldo Líquido</span>
                    <span className="font-bold">
                      {formatCurrency(
                        calendarEvents
                          .filter(e => new Date(e.date).getMonth() === currentDate.getMonth())
                          .reduce((sum, e) => {
                            if (e.type === 'income') return sum + (e.amount || 0);
                            if (e.type === 'expense' || e.type === 'payable') return sum - (e.amount || 0);
                            return sum;
                          }, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Eventos este mês</span>
                  <span className="font-medium">
                    {calendarEvents.filter(e => new Date(e.date).getMonth() === currentDate.getMonth()).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Contas vencidas</span>
                  <span className="font-medium text-red-600">
                    {calendarEvents.filter(e => e.type === 'payable' && e.status === 'overdue').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Metas próximas</span>
                  <span className="font-medium text-blue-600">
                    {calendarEvents.filter(e => e.type === 'goal' && new Date(e.date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}