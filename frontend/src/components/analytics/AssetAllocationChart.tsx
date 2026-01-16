import { useMemo } from 'react';
import {
  Card,
  CardContent,
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
import { formatCurrency } from '@/lib/formatters';
import type { Asset } from '@/lib/api/types';

interface AssetAllocationChartProps {
  assets: Asset[];
}

const COLORS: Record<string, string> = {
  cash: '#94a3b8',      // slate-400
  security: '#3b82f6',  // blue-500
  real_estate: '#f97316', // orange-500
  insurance: '#ec4899', // pink-500
  loan: '#ef4444',      // red-500
  other: '#eab308',     // yellow-500
  // Fallbacks
  default: '#a855f7',   // purple-500
};

export function AssetAllocationChart({ assets }: AssetAllocationChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    const allocationMap = new Map<string, number>();

    assets.forEach((asset) => {
      // Get latest snapshot value
      const snapshots = asset.snapshots || [];
      if (snapshots.length === 0) return;

      // Sort snapshots by date descending to find the latest
      // Assuming snapshots might not be sorted, though API usually returns them sorted
      // But let's be safe if we rely on [0]
      const latestSnapshot = [...snapshots].sort((a, b) => 
        new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
      )[0];

      if (!latestSnapshot) return;

      const value = parseFloat(latestSnapshot.value);
      if (isNaN(value) || value <= 0) return;

      const typeCode = asset.asset_type?.code || 'other';
      
      const currentTotal = allocationMap.get(typeCode) || 0;
      allocationMap.set(typeCode, currentTotal + value);
    });

    const totalValue = Array.from(allocationMap.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(allocationMap.entries()).map(([code, value]) => ({
      name: t(`assetTypes.${code}`, { defaultValue: code }),
      code, // keep code for color mapping
      value,
      percentage: (value / totalValue) * 100,
    })).sort((a, b) => b.value - a.value); // Sort by value descending

  }, [assets, t]);

  if (!chartData || chartData.length === 0) {
     // Don't render card if no data, or render empty state?
     // User request implies showing the chart. If no data, maybe just hide or show "No Data".
     // Let's show a card with "No Data" message for better UX if data is missing but loaded.
     return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>{t('dashboard.assetAllocation', 'Asset Allocation')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {t('dashboard.noAssetSnapshots', 'No asset data available')}
        </CardContent>
      </Card>
     );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{t('dashboard.assetAllocation', 'Asset Allocation')}</CardTitle>
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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.code] || COLORS.default} 
                  />
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
        {/* Custom Legend/List below chart for better readability of percentages */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: COLORS[item.code] || COLORS.default }} 
              />
              <div className="flex flex-1 justify-between text-sm">
                <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
                <span className="font-medium">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
