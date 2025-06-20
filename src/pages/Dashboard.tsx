import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/i18n';

export function Dashboard() {
  const { transactions, payables, t } = useApp();

  // Calculate totals
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  // Calculate expense data for chart
  const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
    const existing = acc.find(item => item.name === transaction.subcategory);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({
        name: transaction.subcategory,
        value: transaction.amount,
        color: '#ef4444'
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  // Calculate income data for chart
  const incomesByCategory = incomeTransactions.reduce((acc, transaction) => {
    const existing = acc.find(item => item.name === transaction.subcategory);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({
        name: transaction.subcategory,
        value: transaction.amount,
        color: '#22c55e'
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  const overduePayables = payables.filter(p => p.status === 'overdue');
  const pendingPayables = payables.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(totalIncome)}
          change={8.2}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Despesas Totais"
          value={formatCurrency(totalExpenses)}
          change={-3.1}
          icon={TrendingDown}
          color="red"
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(netProfit)}
          change={12.5}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Investimentos"
          value={formatCurrency(35850)}
          change={5.4}
          icon={PiggyBank}
          color="purple"
        />
      </div>

      {/* Gráficos de categoria */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart title="Despesas por Categoria" data={expensesByCategory} />
        <CategoryChart title="Receitas por Categoria" data={incomesByCategory} />
      </div>

      {/* Fluxo de caixa */}
      <CashFlowChart />

      {/* Contas a pagar */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">
              Contas Vencidas ({overduePayables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overduePayables.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma conta vencida</p>
            ) : (
              overduePayables.map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <p className="font-medium text-foreground">{payable.description}</p>
                    <p className="text-sm text-muted-foreground">{payable.supplier}</p>
                  </div>
                  <Badge variant="destructive">
                    {formatCurrency(payable.amount)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-700 dark:text-orange-400">
              Próximos Vencimentos ({pendingPayables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayables.map((payable) => (
              <div key={payable.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div>
                  <p className="font-medium text-foreground">{payable.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Vence em {new Date(payable.dueDate).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(payable.amount)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}