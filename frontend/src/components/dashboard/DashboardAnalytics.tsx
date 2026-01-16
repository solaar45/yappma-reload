import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { PortfolioPosition } from '@/components/portfolio/PortfolioPositionsTable';

interface DashboardAnalyticsProps {
  positions: PortfolioPosition[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function DashboardAnalytics({ positions }: DashboardAnalyticsProps) {
  const { t } = useTranslation();

  // 1. Asset Allocation Logic
  const allocationData = positions.reduce((acc, pos) => {
    const type = pos.assetClass || 'Other';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += pos.currentValue;
    } else {
      acc.push({ name: type, value: pos.currentValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // 2. Net Worth Trend Logic (Approximate from position histories)
  // Assuming all histories are length 7 and aligned (latest is last)
  const historyLength = 7;
  const trendData = Array.from({ length: historyLength }, (_, i) => {
    let total = 0;
    positions.forEach(pos => {
      // performanceHistory is usually [newest, ..., oldest] or reverse. 
      // In DashboardPage: slice(0, 7).reverse() -> [oldest, ..., newest]
      // So index i=0 is oldest.
      const val = pos.performanceHistory?.[i] || 0;
      total += val;
    });
    return { name: `T-${historyLength - 1 - i}`, value: total };
  });

  // 3. Top Performers Logic
  const topPerformers = [...positions]
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5)
    .map(pos => ({
      name: pos.name,
      performance: pos.performance
    }));

  // 4. Liquid vs Illiquid Logic
  // Assumption: Cash & Security = Liquid. Real Estate, Vehicle, Other = Illiquid.
  const liquidityData = positions.reduce((acc, pos) => {
    const isLiquid = ['Cash', 'Security', 'Cryptocurrency'].includes(pos.assetClass || '');
    const key = isLiquid ? 'Liquid' : 'Illiquid'; // Translation keys can be added later
    const existing = acc.find(item => item.name === key);
    if (existing) {
      existing.value += pos.currentValue;
    } else {
      acc.push({ name: key, value: pos.currentValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);


  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      {/* Asset Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.assetAllocation')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Worth Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.netWorthTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.topPerformers')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPerformers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="performance" fill="#82ca9d" name="Change %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Liquidity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.liquidity')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={liquidityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {liquidityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
