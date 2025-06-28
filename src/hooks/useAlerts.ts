import { useState, useEffect } from 'react';
import { Alert, NotificationSettings } from '@/types';
import { useApp } from '@/contexts/AppContext';

export function useAlerts() {
  const { payables, investments, transactions } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    id: '1',
    userId: 'user1',
    emailNotifications: true,
    pushNotifications: true,
    payableDueDays: 7,
    investmentYieldThreshold: 5,
    budgetLimitThreshold: 80,
    lowBalanceThreshold: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];
    const now = new Date();

    // Alertas de contas a pagar
    payables.forEach(payable => {
      const dueDate = new Date(payable.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (payable.status === 'overdue') {
        newAlerts.push({
          id: `overdue-${payable.id}`,
          type: 'payable_overdue',
          title: 'Conta Vencida',
          message: `${payable.description} venceu em ${dueDate.toLocaleDateString('pt-BR')}`,
          severity: 'critical',
          isRead: false,
          createdAt: new Date().toISOString(),
          dueDate: payable.dueDate,
          relatedId: payable.id,
          relatedType: 'payable'
        });
      } else if (payable.status === 'pending' && daysUntilDue <= notificationSettings.payableDueDays && daysUntilDue > 0) {
        newAlerts.push({
          id: `due-${payable.id}`,
          type: 'payable_due',
          title: 'Conta a Vencer',
          message: `${payable.description} vence em ${daysUntilDue} dia(s)`,
          severity: daysUntilDue <= 3 ? 'high' : 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          dueDate: payable.dueDate,
          relatedId: payable.id,
          relatedType: 'payable'
        });
      }
    });

    // Alertas de investimentos (simulando rendimentos)
    investments.forEach(investment => {
      const yieldPercentage = ((investment.currentValue - investment.amount) / investment.amount) * 100;
      
      if (yieldPercentage >= notificationSettings.investmentYieldThreshold) {
        newAlerts.push({
          id: `yield-${investment.id}`,
          type: 'investment_yield',
          title: 'Investimento Rendendo',
          message: `${investment.name} teve rendimento de ${yieldPercentage.toFixed(2)}%`,
          severity: yieldPercentage >= 10 ? 'high' : 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedId: investment.id,
          relatedType: 'investment'
        });
      }
    });

    // Alertas de orçamento (simulando dados)
    const mockBudgets = [
      {
        id: '1',
        name: 'Marketing Digital',
        budgetAmount: 5000,
        spentAmount: 4200,
        category: 'empresa' as const
      },
      {
        id: '2',
        name: 'Alimentação',
        budgetAmount: 2000,
        spentAmount: 1600,
        category: 'familia' as const
      }
    ];

    mockBudgets.forEach(budget => {
      const usagePercentage = (budget.spentAmount / budget.budgetAmount) * 100;
      
      if (usagePercentage >= notificationSettings.budgetLimitThreshold) {
        newAlerts.push({
          id: `budget-${budget.id}`,
          type: 'budget_limit',
          title: 'Orçamento Próximo do Limite',
          message: `${budget.name} está em ${usagePercentage.toFixed(1)}% do orçamento`,
          severity: usagePercentage >= 95 ? 'critical' : 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedId: budget.id,
          relatedType: 'budget'
        });
      }
    });

    // Alertas de saldo baixo (simulando)
    const mockAccounts = [
      { id: '1', name: 'Conta Corrente', balance: 800, category: 'empresa' as const },
      { id: '2', name: 'Conta Poupança', balance: 500, category: 'familia' as const }
    ];

    mockAccounts.forEach(account => {
      if (account.balance <= notificationSettings.lowBalanceThreshold) {
        newAlerts.push({
          id: `balance-${account.id}`,
          type: 'low_balance',
          title: 'Saldo Baixo',
          message: `${account.name} está com saldo baixo: €${account.balance.toLocaleString('pt-BR')}`,
          severity: account.balance <= 500 ? 'critical' : 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          relatedId: account.id,
          relatedType: 'account'
        });
      }
    });

    setAlerts(newAlerts);
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getUnreadCount = () => {
    return alerts.filter(alert => !alert.isRead).length;
  };

  const getAlertsByType = (type: Alert['type']) => {
    return alerts.filter(alert => alert.type === type);
  };

  const getAlertsBySeverity = (severity: Alert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({
      ...prev,
      ...settings,
      updatedAt: new Date().toISOString()
    }));
  };

  useEffect(() => {
    generateAlerts();
    
    // Atualizar alertas a cada 5 minutos
    const interval = setInterval(generateAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [payables, investments, notificationSettings]);

  return {
    alerts,
    notificationSettings,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    getUnreadCount,
    getAlertsByType,
    getAlertsBySeverity,
    updateNotificationSettings,
    generateAlerts
  };
}