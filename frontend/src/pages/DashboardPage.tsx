import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { PortfolioHoldingsTable } from '@/components/portfolio/PortfolioHoldingsTable';
import { PortfolioPositionsTable } from '@/components/portfolio/PortfolioPositionsTable';
import { AssetAllocationChart } from '@/components/analytics/AssetAllocationChart';
import type { PortfolioHolding } from '@/components/portfolio/PortfolioHoldingsTable';
import type { PortfolioPosition } from '@/components/portfolio/PortfolioPositionsTable';

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
  {
    id: '4',
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    shares: 15,
    avgCost: 245.00,
    currentPrice: 198.50,
    marketValue: 2977.50,
    totalGainLoss: -697.50,
    totalGainLossPercent: -18.98,
    dayChange: -44.85,
    dayChangePercent: -1.48,
  },
  {
    id: '5',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    shares: 40,
    avgCost: 155.75,
    currentPrice: 172.25,
    marketValue: 6890.00,
    totalGainLoss: 660.00,
    totalGainLossPercent: 10.59,
    dayChange: 68.80,
    dayChangePercent: 1.01,
  },
  {
    id: '6',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    shares: 20,
    avgCost: 475.00,
    currentPrice: 495.50,
    marketValue: 9910.00,
    totalGainLoss: 410.00,
    totalGainLossPercent: 4.32,
    dayChange: 198.20,
    dayChangePercent: 2.04,
  },
];

// Mock data for positions demo
const mockPortfolioPositions: PortfolioPosition[] = [
  {
    id: '1',
    type: 'Asset',
    name: 'Apple Inc.',
    institution: 'Trade Republic',
    assetClass: 'Equity',
    riskScore: 3,
    currentValue: 15450.00,
    portfolioShare: 12.5,
    performance: 8.5,
    performanceHistory: [100, 102, 101, 105, 107, 108, 109],
    savingsPlan: 250,
    fsaAllocated: 1000,
    fsaTotal: 1000,
    fsaUsedYTD: 227.50,
  },
  {
    id: '2',
    type: 'Account',
    name: 'Girokonto DKB',
    institution: 'Deutsche Bank',
    assetClass: 'Cash',
    riskScore: 1,
    currentValue: 8720.00,
    portfolioShare: 7.1,
    performance: 0.0,
    performanceHistory: [100, 100, 100, 100, 100, 100, 100],
    fsaAllocated: 0,
    fsaTotal: 1000,
    fsaUsedYTD: 0,
  },
  {
    id: '3',
    type: 'Asset',
    name: 'Vanguard FTSE All-World',
    institution: 'Scalable Capital',
    assetClass: 'Equity',
    riskScore: 4,
    currentValue: 32100.00,
    portfolioShare: 26.0,
    performance: 12.3,
    performanceHistory: [100, 98, 103, 108, 110, 112, 112],
    savingsPlan: 500,
    fsaAllocated: 500,
    fsaTotal: 1000,
    fsaUsedYTD: 325.00,
  },
  {
    id: '4',
    type: 'Asset',
    name: 'iShares Core Global Aggregate Bond',
    institution: 'ING',
    assetClass: 'Bond',
    riskScore: 2,
    currentValue: 18900.00,
    portfolioShare: 15.3,
    performance: 3.2,
    performanceHistory: [100, 101, 102, 102, 103, 103, 103],
    savingsPlan: 300,
    fsaAllocated: 350,
    fsaTotal: 1000,
    fsaUsedYTD: 115.80,
  },
  {
    id: '5',
    type: 'Asset',
    name: 'Bitcoin',
    institution: 'Bitpanda',
    assetClass: 'Crypto',
    riskScore: 5,
    currentValue: 6500.00,
    portfolioShare: 5.3,
    performance: -15.7,
    performanceHistory: [100, 95, 92, 88, 85, 84, 84],
    fsaAllocated: 0,
    fsaTotal: 1000,
    fsaUsedYTD: 0,
  },
  {
    id: '6',
    type: 'Asset',
    name: 'REITs Portfolio',
    institution: 'Consorsbank',
    assetClass: 'Real Estate',
    riskScore: 3,
    currentValue: 24300.00,
    portfolioShare: 19.7,
    performance: 6.8,
    performanceHistory: [100, 102, 104, 105, 106, 107, 107],
    savingsPlan: 400,
    fsaAllocated: 150,
    fsaTotal: 1000,
    fsaUsedYTD: 98.50,
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { data, loading, error } = useDashboard({ userId: userId! });

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

        {/* Accounts Total Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalInAccounts')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data ? formatCurrency(data.accountsValue) : '€0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.accounts.length || 0} {t('dashboard.accounts')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assets Total Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalInAssets')}</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data ? formatCurrency(data.assetsValue) : '€0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.assets.length || 0} {t('dashboard.assets')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Asset Allocation Chart */}
        <AssetAllocationChart assets={data?.assets || []} />
        
        {/* Portfolio Holdings Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PortfolioHoldingsTable holdings={mockPortfolioHoldings} />
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Positionen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PortfolioPositionsTable positions={mockPortfolioPositions} />
        </CardContent>
      </Card>

      {/* Main Content Area - Existing Cards */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-2">
        {/* Recent Accounts */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('dashboard.recentAccounts')}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : data?.accounts.length ? (
              <div className="space-y-4">
                {data.accounts.slice(0, 5).map((account) => {
                  const latestSnapshot = account.snapshots?.[0];
                  return (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {account.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.institution?.name || 'No institution'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {latestSnapshot
                            ? formatCurrency(latestSnapshot.balance, latestSnapshot.currency)
                            : formatCurrency('0', account.currency)}
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
                {t('dashboard.noAccountSnapshots')}
              </div>
            )}
          </CardContent>
        </Card>

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
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {asset.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.asset_type?.description || 'No type'}
                          {latestSnapshot?.quantity && (
                            <> · {parseFloat(latestSnapshot.quantity).toFixed(2)} {t('assets.units')}</>
                          )}
                        </p>
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
