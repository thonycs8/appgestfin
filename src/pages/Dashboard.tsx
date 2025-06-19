import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockPayables } from '@/lib/data';

const expenseData = [
  { name: 'Marketing', value: 2500, color: '#ef4444' },
  { name: 'Software', value: 800, color: '#dc2626' },
  { name: 'Alimentação', value: 1200, color: '#b91c1c' },
  { name: 'Outros', value: 1500, color: '#991b1b' }
];

const incomeData = [
  { name: 'Prestação de Serviços', value: 15000, color: '#22c55e' },
  { name: 'Salário', value: 8000, color: '#16a34a' },
  { name: 'Outros', value: 2000, color: '#15803d' }
];

export function Dashboard() {
  const overduePayables = mockPayables.filter(p => p.status === 'overdue');
  const pendingPayables = mockPayables.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value="R$ 25.000"
          change={8.2}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Despesas Totais"
          value="R$ 6.000"
          change={-3.1}
          icon={TrendingDown}
          color="red"
        />
        <MetricCard
          title="Lucro Líquido"
          value="R$ 19.000"
          change={12.5}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Investimentos"
          value="R$ 35.850"
          change={5.4}
          icon={PiggyBank}
          color="purple"
        />
      </div>

      {/* Gráficos de categoria */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart title="Despesas por Categoria" data={expenseData} />
        <CategoryChart title="Receitas por Categoria" data={incomeData} />
      </div>

      {/* Fluxo de caixa */}
      <CashFlowChart />

      {/* Contas a pagar */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-700">
              Contas Vencidas ({overduePayables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overduePayables.length === 0 ? (
              <p className="text-gray-500">Nenhuma conta vencida</p>
            ) : (
              overduePayables.map((payable) => (
                <div key={payable.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{payable.description}</p>
                    <p className="text-sm text-gray-600">{payable.supplier}</p>
                  </div>
                  <Badge variant="destructive">
                    R$ {payable.amount.toLocaleString('pt-BR')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-700">
              Próximos Vencimentos ({pendingPayables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayables.map((payable) => (
              <div key={payable.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-gray-900">{payable.description}</p>
                  <p className="text-sm text-gray-600">
                    Vence em {new Date(payable.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="secondary">
                  R$ {payable.amount.toLocaleString('pt-BR')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}