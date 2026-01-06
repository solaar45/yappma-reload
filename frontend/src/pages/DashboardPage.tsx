import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard, useTaxExemptions } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet } from 'lucide-react';
import { PortfolioHoldingsTable } from '@/components/portfolio/PortfolioHoldingsTable';
import { PortfolioPositionsTable } from '@/components/portfolio/PortfolioPositionsTable';
import { TaxUsageWidget } from '@/components/dashboard/TaxUsageWidget';
import type { PortfolioHolding } from '@/components/portfolio/PortfolioHoldingsTable';
import type { PortfolioPosition } from '@/components/portfolio/PortfolioPositionsTable';
import InstitutionLogo from '@/components/InstitutionLogo';

// Mock data for holdings demo
const mockPortfolioHoldings: PortfolioHolding[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    shares: 50,
    avgCost: 150.25,
    currentPrice: 178.50,
    marketValue: 8925.00,
    totalGainLoss: 1412.50,
    totalGainLossPercent: 18.80,
    dayChange: 125.00,
    dayChangePercent: 1.42,
  },
  {
    id: '2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    shares: 30,
    avgCost: 320.00,
    currentPrice: 385.75,
    marketValue: 11572.50,
    totalGainLoss: 1972.50,
    totalGainLossPercent: 20.55,
    dayChange: -89.25,
    dayChangePercent: -0.77,
  },
  {
    id: '3',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    shares: 25,
    avgCost: 135.50,
    currentPrice: 142.80,
    marketValue: 3570.00,
    totalGainLoss: 182.50,
    totalGainLossPercent: 5.39,
    dayChange: 35.75,
    dayChangePercent: 1.01,
  },
];



export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, userId } = useUser();
  const { data, loading, error } = useDashboard({ userId: userId! });
  const year = new Date().getFullYear();
  const { taxExemptions } = useTaxExemptions({ userId: userId!, year });

  const portfolioPositions = useMemo<PortfolioPosition[]>(() => {
    if (!data?.assets) return [];

    const totalPortfolioValue = parseFloat(data.totalValue || '0');
    const userLimit = user?.tax_allowance_limit || 1000;

    const taxExMap = new Map<number, number>();
    taxExemptions.forEach(te => {
      taxExMap.set(te.institution_id, parseFloat(te.amount));
    });

    const institutionGroups = new Map<number, {
      id: string;
      name: string;
      institution: string;
      currentValue: number;
      savingsPlan: number;
      riskScore: number;
      assetClasses: string[];
      fsaAllocated: number;
    }>();

    const individualAssets: PortfolioPosition[] = [];

    data.assets.forEach(asset => {
      const latestValue = parseFloat(asset.snapshots?.[0]?.value || '0');
      const savingsPlan = parseFloat(asset.savings_plan_amount || '0');
      const riskScore = (asset.risk_class || 3) as PortfolioPosition['riskScore'];

      const assetClassMap: Record<string, string> = {
        'security': 'security',
        'cash': 'cash',
        'real_estate': 'real_estate',
        'crypto': 'crypto',
        'insurance': 'insurance',
        'loan': 'loan',
        'commodity': 'commodity',
        'collectible': 'collectible',
        'other': 'other'
      };

      const code = asset.asset_type?.code || 'other';
      const assetClass = assetClassMap[code] || 'other';

      if (asset.institution_id && asset.institution) {
        const instId = asset.institution_id;
        const existing = institutionGroups.get(instId);
        if (existing) {
          existing.currentValue += latestValue;
          existing.savingsPlan += savingsPlan;
          existing.riskScore = Math.max(existing.riskScore, riskScore) as PortfolioPosition['riskScore'];
          existing.assetClasses.push(assetClass);
        } else {
          institutionGroups.set(instId, {
            id: `inst-${instId}`,
            name: asset.institution.name,
            institution: asset.institution.name,
            currentValue: latestValue,
            savingsPlan: savingsPlan,
            riskScore: riskScore,
            assetClasses: [assetClass],
            fsaAllocated: taxExMap.get(instId) || 0
          });
        }
      } else {
        individualAssets.push({
          id: `asset-${asset.id}`,
          type: 'Asset' as const,
          name: asset.name,
          institution: '-',
          assetClass,
          riskScore,
          currentValue: latestValue,
          portfolioShare: totalPortfolioValue > 0 ? (latestValue / totalPortfolioValue) * 100 : 0,
          savingsPlan: savingsPlan > 0 ? savingsPlan : undefined,
          fsaAllocated: 0,
          fsaTotal: userLimit,
          fsaUsedYTD: 0
        });
      }
    });

    const groupedList = Array.from(institutionGroups.values()).map(group => {
      // Find most common asset class
      const counts = group.assetClasses.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const keys = Object.keys(counts);
      const dominantClass = keys.length > 0
        ? keys.reduce((a, b) => counts[a] > counts[b] ? a : b)
        : 'other';

      return {
        id: group.id,
        type: 'Asset' as const,
        name: group.name,
        institution: group.institution,
        assetClass: dominantClass,
        riskScore: group.riskScore as PortfolioPosition['riskScore'],
        currentValue: group.currentValue,
        portfolioShare: totalPortfolioValue > 0 ? (group.currentValue / totalPortfolioValue) * 100 : 0,
        savingsPlan: group.savingsPlan > 0 ? group.savingsPlan : undefined,
        fsaAllocated: group.fsaAllocated,
        fsaTotal: userLimit,
        fsaUsedYTD: 0 // We don't have YTD usage yet
      };
    });

    return [...groupedList, ...individualAssets];
  }, [data, taxExemptions, user, t]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">{t('dashboard.errorLoading')}: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        {/* Tax Usage Card */}
        <TaxUsageWidget />

        {/* Net Worth Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalNetWorth')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data ? formatCurrency(data.totalValue) : '€0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.asOf')} {formatDate(new Date().toISOString())}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assets Total Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalInAssets')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data ? formatCurrency(data.totalValue) : '€0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.assets.length || 0} {t('dashboard.assets')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PortfolioHoldingsTable holdings={mockPortfolioHoldings} />
        </CardContent>
      </Card>

      {/* Portfolio Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Positionen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PortfolioPositionsTable positions={portfolioPositions} />
        </CardContent>
      </Card>

      {/* Main Content Area - Recent Assets */}
      <div className="grid gap-4 md:gap-6">
        {/* Recent Assets */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('dashboard.recentAssets')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : data?.assets.length ? (
              <div className="space-y-4">
                {data.assets.slice(0, 5).map((asset) => {
                  const latestSnapshot = asset.snapshots?.[0];
                  return (
                    <div key={asset.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <InstitutionLogo name={asset.name} ticker={asset.ticker ?? asset.security_asset?.ticker ?? undefined} size="medium" className="flex-shrink-0 rounded-full" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.asset_type?.description || 'No type'}
                            {latestSnapshot?.quantity && (
                              <> · {parseFloat(latestSnapshot.quantity).toFixed(2)} {t('assets.units')}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {latestSnapshot
                            ? formatCurrency(latestSnapshot.value, asset.currency || 'EUR')
                            : formatCurrency('0', asset.currency || 'EUR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {latestSnapshot ? formatDate(latestSnapshot.snapshot_date) : '-'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noAssetSnapshots')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

