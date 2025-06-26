import { useState } from 'react';
import { Bell, AlertTriangle, Clock, TrendingUp, DollarSign, CreditCard, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  low: 'text-blue-600 bg-blue-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100'
};

export function AlertsDropdown() {
  const { language } = useApp();
  const { alerts, getUnreadCount, markAsRead, markAllAsRead, deleteAlert } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = getUnreadCount();
  const recentAlerts = alerts.slice(0, 5);

  const getAlertTitle = (alert: Alert) => {
    switch (alert.type) {
      case 'payable_due':
        return language === 'pt' ? 'Conta a Vencer' : 'Bill Due';
      case 'payable_overdue':
        return language === 'pt' ? 'Conta Vencida' : 'Overdue Bill';
      case 'investment_yield':
        return language === 'pt' ? 'Investimento Rendendo' : 'Investment Yield';
      case 'budget_limit':
        return language === 'pt' ? 'Orçamento no Limite' : 'Budget Limit';
      case 'goal_deadline':
        return language === 'pt' ? 'Meta Próxima do Prazo' : 'Goal Deadline';
      case 'low_balance':
        return language === 'pt' ? 'Saldo Baixo' : 'Low Balance';
      default:
        return alert.title;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (!alert.isRead) {
      markAsRead(alert.id);
    }
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-9 w-9 border-gray-300 text-gray-700 hover:bg-gray-50">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 bg-white border border-gray-200">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="font-semibold">
              {language === 'pt' ? 'Notificações' : 'Notifications'}
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-6 px-2"
                >
                  {language === 'pt' ? 'Marcar todas' : 'Mark all'}
                </Button>
              )}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'pt' ? 'Configurações de Notificação' : 'Notification Settings'}
                    </DialogTitle>
                  </DialogHeader>
                  <AlertSettings />
                </DialogContent>
              </Dialog>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {language === 'pt' ? 'Nenhuma notificação' : 'No notifications'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              {recentAlerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                return (
                  <DropdownMenuItem
                    key={alert.id}
                    className="p-0 focus:bg-gray-50"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className={`w-full p-3 border-l-4 ${
                      alert.severity === 'critical' ? 'border-red-500' :
                      alert.severity === 'high' ? 'border-orange-500' :
                      alert.severity === 'medium' ? 'border-yellow-500' :
                      'border-blue-500'
                    } ${!alert.isRead ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-1 rounded ${severityColors[alert.severity]}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getAlertTitle(alert)}
                            </p>
                            <div className="flex items-center gap-1">
                              {!alert.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAlert(alert.id);
                                }}
                                className="h-4 w-4 p-0 hover:bg-gray-200"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(alert.createdAt).toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              
              {alerts.length > 5 && (
                <DropdownMenuItem className="p-3 text-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    {language === 'pt' ? `Ver todas (${alerts.length})` : `View all (${alerts.length})`}
                  </Button>
                </DropdownMenuItem>
              )}
            </ScrollArea>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function AlertSettings() {
  const { language } = useApp();
  const { notificationSettings, updateNotificationSettings } = useAlerts();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Notificações por Email' : 'Email Notifications'}
          </label>
          <input
            type="checkbox"
            checked={notificationSettings.emailNotifications}
            onChange={(e) => updateNotificationSettings({ emailNotifications: e.target.checked })}
            className="rounded"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Notificações Push' : 'Push Notifications'}
          </label>
          <input
            type="checkbox"
            checked={notificationSettings.pushNotifications}
            onChange={(e) => updateNotificationSettings({ pushNotifications: e.target.checked })}
            className="rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Alertar contas a pagar (dias antes)' : 'Alert bills due (days before)'}
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={notificationSettings.payableDueDays}
            onChange={(e) => updateNotificationSettings({ payableDueDays: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Limite de rendimento para alertar (%)' : 'Yield threshold for alerts (%)'}
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={notificationSettings.investmentYieldThreshold}
            onChange={(e) => updateNotificationSettings({ investmentYieldThreshold: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Limite de orçamento para alertar (%)' : 'Budget threshold for alerts (%)'}
          </label>
          <input
            type="number"
            min="50"
            max="100"
            value={notificationSettings.budgetLimitThreshold}
            onChange={(e) => updateNotificationSettings({ budgetLimitThreshold: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {language === 'pt' ? 'Saldo mínimo para alertar (€)' : 'Minimum balance for alerts (€)'}
          </label>
          <input
            type="number"
            min="0"
            value={notificationSettings.lowBalanceThreshold}
            onChange={(e) => updateNotificationSettings({ lowBalanceThreshold: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );
}