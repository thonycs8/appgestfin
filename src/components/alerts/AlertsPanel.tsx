import { useState } from 'react';
import { AlertTriangle, Clock, TrendingUp, DollarSign, CreditCard, CheckCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlerts } from '@/hooks/useAlerts';
import { useApp } from '@/contexts/AppContext';
import { Alert } from '@/types';

const alertIcons = {
  payable_due: Clock,
  payable_overdue: AlertTriangle,
  investment_yield: TrendingUp,
  budget_limit: DollarSign,
  goal_deadline: Clock,
  low_balance: CreditCard
};

const severityColors = {
  low: 'text-blue-600 bg-blue-100 border-blue-200',
  medium: 'text-yellow-600 bg-yellow-100 border-yellow-200',
  high: 'text-orange-600 bg-orange-100 border-orange-200',
  critical: 'text-red-600 bg-red-100 border-red-200'
};

export function AlertsPanel() {
  const { language } = useApp();
  const { 
    alerts, 
    getUnreadCount, 
    getAlertsBySeverity,
    markAllAsRead
  } = useAlerts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  const criticalAlerts = getAlertsBySeverity('critical');
  const highAlerts = getAlertsBySeverity('high');
  const unreadCount = getUnreadCount();

  return (
    <div className="space-y-6">
      {/* Resumo de Alertas */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {language === 'pt' ? 'Críticos' : 'Critical'}
              </p>
              <p className="text-2xl font-bold text-red-700">{criticalAlerts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {language === 'pt' ? 'Alta Prioridade' : 'High Priority'}
              </p>
              <p className="text-2xl font-bold text-orange-700">{highAlerts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {language === 'pt' ? 'Não Lidos' : 'Unread'}
              </p>
              <p className="text-2xl font-bold text-blue-700">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <CheckCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {language === 'pt' ? 'Total' : 'Total'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {language === 'pt' ? 'Central de Alertas' : 'Alerts Center'}
            </CardTitle>
            
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} size="sm">
                  {language === 'pt' ? 'Marcar Todas como Lidas' : 'Mark All as Read'}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={language === 'pt' ? 'Buscar alertas...' : 'Search alerts...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={language === 'pt' ? 'Severidade' : 'Severity'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'pt' ? 'Todas' : 'All'}</SelectItem>
                <SelectItem value="critical">{language === 'pt' ? 'Crítica' : 'Critical'}</SelectItem>
                <SelectItem value="high">{language === 'pt' ? 'Alta' : 'High'}</SelectItem>
                <SelectItem value="medium">{language === 'pt' ? 'Média' : 'Medium'}</SelectItem>
                <SelectItem value="low">{language === 'pt' ? 'Baixa' : 'Low'}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={language === 'pt' ? 'Tipo' : 'Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All'}</SelectItem>
                <SelectItem value="payable_due">{language === 'pt' ? 'Contas a Vencer' : 'Bills Due'}</SelectItem>
                <SelectItem value="payable_overdue">{language === 'pt' ? 'Contas Vencidas' : 'Overdue Bills'}</SelectItem>
                <SelectItem value="investment_yield">{language === 'pt' ? 'Rendimentos' : 'Yields'}</SelectItem>
                <SelectItem value="budget_limit">{language === 'pt' ? 'Orçamentos' : 'Budgets'}</SelectItem>
                <SelectItem value="low_balance">{language === 'pt' ? 'Saldo Baixo' : 'Low Balance'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">{language === 'pt' ? 'Todos' : 'All'}</TabsTrigger>
              <TabsTrigger value="critical">{language === 'pt' ? 'Críticos' : 'Critical'}</TabsTrigger>
              <TabsTrigger value="unread">{language === 'pt' ? 'Não Lidos' : 'Unread'}</TabsTrigger>
              <TabsTrigger value="today">{language === 'pt' ? 'Hoje' : 'Today'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-6">
              <AlertsList alerts={filteredAlerts} />
            </TabsContent>
            
            <TabsContent value="critical" className="space-y-4 mt-6">
              <AlertsList alerts={criticalAlerts} />
            </TabsContent>
            
            <TabsContent value="unread" className="space-y-4 mt-6">
              <AlertsList alerts={alerts.filter(a => !a.isRead)} />
            </TabsContent>
            
            <TabsContent value="today" className="space-y-4 mt-6">
              <AlertsList alerts={alerts.filter(a => {
                const today = new Date().toDateString();
                return new Date(a.createdAt).toDateString() === today;
              })} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertsList({ alerts }: { alerts: Alert[] }) {
  const { language } = useApp();
  const { markAsRead, deleteAlert } = useAlerts();

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{language === 'pt' ? 'Nenhum alerta encontrado' : 'No alerts found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = alertIcons[alert.type];
        return (
          <div
            key={alert.id}
            className={`p-4 border rounded-lg transition-all hover:shadow-md ${
              !alert.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${severityColors[alert.severity]}`}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {alert.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={severityColors[alert.severity]}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-2">{alert.message}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(alert.createdAt).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                  </p>
                  
                  <div className="flex gap-2">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        {language === 'pt' ? 'Marcar como Lida' : 'Mark as Read'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {language === 'pt' ? 'Excluir' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}