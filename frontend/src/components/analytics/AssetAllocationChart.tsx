import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAssetAllocation, type AssetAllocation } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency } from '@/lib/formatters';

const COLORS = {
  cash: '#94a3b8',      // slate-400
  security: '#3b82f6',  // blue-500
  real_estate: '#f97316', // orange-500
  crypto: '#a855f7',    // purple-500 (mapped from 'other' if needed or added later)
  insurance: '#ec4899', // pink-500
  bond: '#22c55e',      // green-500 (mapped if present)
  loan: '#ef4444',      // red-500
  other: '#eab308',     // yellow-500
};

export function AssetAllocationChart() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { data: allocation, loading, error } = useAssetAllocation({ userId: userId! });

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>{t('dashboard.assetAllocation')}</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (error || !allocation || allocation.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>{t('dashboard.assetAllocation')}</CardTitle>
          <CardDescription>{t('dashboard.noData')}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {error ? t('common.error') : t('dashboard.noAssetSnapshots')}
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts and add colors
  const chartData = allocation.map((item) => ({
    name: t(`assetTypes.${item.asset_type}`),
    value: parseFloat(item.value),
    percentage: item.percentage,
    color: COLORS[item.asset_type as keyof typeof COLORS] || COLORS.other,
  })).filter(item => item.value > 0);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{t('dashboard.assetAllocation')}</CardTitle>
        <CardDescription>{t('dashboard.assetAllocationDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <div className="flex flex-1 justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
