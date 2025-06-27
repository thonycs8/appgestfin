import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'purple';
}

const colorClasses = {
  green: 'bg-gradient-to-r from-green-500 to-green-600',
  red: 'bg-gradient-to-r from-red-500 to-red-600',
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600'
};

export function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105">
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex-1 p-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% vs mês anterior
            </p>
          </div>
          <div className={`w-2 ${colorClasses[color]}`} />
          <div className={`flex items-center justify-center w-16 ${colorClasses[color]}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}