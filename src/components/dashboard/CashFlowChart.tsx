import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/i18n';

const cashFlowData = [
  { month: 'Jan', empresa: 12000, familia: 6500 },
  { month: 'Fev', empresa: 15000, familia: 7200 },
  { month: 'Mar', empresa: 11000, familia: 6800 },
  { month: 'Abr', empresa: 18000, familia: 7500 },
  { month: 'Mai', empresa: 16000, familia: 7000 },
  { month: 'Jun', empresa: 19000, familia: 8000 }
];

export function CashFlowChart() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Fluxo de Caixa - Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Valor']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="empresa" 
              stroke="#1e40af" 
              strokeWidth={3}
              name="Empresa"
            />
            <Line 
              type="monotone" 
              dataKey="familia" 
              stroke="#16a34a" 
              strokeWidth={3}
              name="Família"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}