import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, PiggyBank, LayoutDashboard, PieChart } from 'lucide-react';
import { PortfolioHoldingsTable } from '@/components/portfolio/PortfolioHoldingsTable';
import { PortfolioPositionsTable } from '@/components/portfolio/PortfolioPositionsTable';
import { TaxUsageWidget } from '@/components/dashboard/TaxUsageWidget';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import type { PortfolioHolding } from '@/components/portfolio/PortfolioHoldingsTable';
import type { PortfolioPosition } from '@/components/portfolio/PortfolioPositionsTable';

// PortfolioPosition formatting logic is handled within DashboardPage via useMemo


export default function DashboardPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { data, loading, error } = useDashboard({ userId: userId! });
  const [view, setView] = useState<'overview' | 'analytics'>('overview');

  // Calculate portfolio holdings from real data
  const portfolioHoldings: PortfolioHolding[] = useMemo(() => {
    if (!data?.assets) return [];

    return data.assets
      .filter((asset) => asset.asset_type?.code === 'security')
      .map((asset) => {
        const snapshots = asset.snapshots || [];
        const sortedSnapshots = [...snapshots].sort(
          (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        );

        const latestSnapshot = sortedSnapshots[0];
        const previousSnapshot = sortedSnapshots[1];

        const quantity = latestSnapshot?.quantity ? parseFloat(latestSnapshot.quantity) : 0;
        const marketPrice = latestSnapshot?.market_price_per_unit ? parseFloat(latestSnapshot.market_price_per_unit) : 0;
        const marketValue = quantity > 0 ? quantity * marketPrice : (latestSnapshot?.value ? parseFloat(latestSnapshot.value) : 0);
        const costBasis = latestSnapshot?.cost_basis ? parseFloat(latestSnapshot.cost_basis) : 0;

        const avgCost = quantity > 0 ? costBasis / quantity : 0;
        const totalGainLoss = marketValue - costBasis;
        const totalGainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : 0;

        let dayChange = 0;
        let dayChangePercent = 0;
        if (latestSnapshot && previousSnapshot) {
          const prevValue = parseFloat(previousSnapshot.value || '0');
          dayChange = marketValue - prevValue;
          dayChangePercent = prevValue > 0 ? (dayChange / prevValue) * 100 : 0;
        }

        return {
          id: asset.id.toString(),
          ticker: asset.security_asset?.ticker || asset.symbol || '-',
          name: asset.name,
          shares: quantity,
          avgCost: avgCost,
          currentPrice: marketPrice,
          marketValue: marketValue,
          totalGainLoss: totalGainLoss,
          totalGainLossPercent: totalGainLossPercent,
          dayChange: dayChange,
          dayChangePercent: dayChangePercent,
        };
      });
  }, [data?.assets]);

  // Calculate portfolio positions (Accounts + Assets) from real data
  const portfolioPositions: PortfolioPosition[] = useMemo(() => {
    if (!data?.accounts && !data?.assets) return [];

    const totalNetWorth = parseFloat(data.totalValue || '0');
    // Default total FSA limit (should ideally come from user settings)
    const globalFsaLimit = 1000; 

    // 2. Process Assets
    const assets = data?.assets || [];

    // 1. Process Accounts
    const accountPositions: PortfolioPosition[] = (data?.accounts || []).map((account) => {
      const snapshots = account.snapshots || [];
      const latestSnapshot = snapshots[0];
      const previousSnapshot = snapshots[1];

      let accountValue = latestSnapshot ? parseFloat(latestSnapshot.balance) : 0;
      let accountSavingsPlan = account.savings_plan_amount ? parseFloat(account.savings_plan_amount) : 0;

      // Find and add security assets linked to this account
      const linkedSecurityAssets = assets.filter(
        asset => asset.account_id === account.id && asset.asset_type?.code === 'security'
      );

      linkedSecurityAssets.forEach(asset => {
        const assetLatestSnapshot = asset.snapshots?.[0];
        accountValue += assetLatestSnapshot ? parseFloat(assetLatestSnapshot.value) : 0;
        accountSavingsPlan += asset.savings_plan_amount ? parseFloat(asset.savings_plan_amount) : 0;
      });

      const portfolioShare = totalNetWorth > 0 ? (accountValue / totalNetWorth) * 100 : 0;

      let performance = 0;
      if (latestSnapshot && previousSnapshot) {
        const prevValue = parseFloat(previousSnapshot.balance);
        if (prevValue > 0) {
          performance = ((latestSnapshot ? parseFloat(latestSnapshot.balance) : 0) - prevValue) / prevValue * 100;
        }
      }

      const performanceHistory = snapshots.slice(0, 7).reverse().map(s => parseFloat(s.balance));
      if (performanceHistory.length === 1) performanceHistory.unshift(performanceHistory[0]);
      if (performanceHistory.length === 0) performanceHistory.push(0, 0);

      // Extract FSA data from account institution
      const exemption = account.institution?.tax_exemptions?.[0];
      const fsaAllocated = exemption?.amount ? parseFloat(exemption.amount) : 0;

      return {
        id: `account-${account.id}`,
        type: 'Account',
        name: account.name,
        subtype: account.type,
        institution: account.institution?.name || '-',
        institutionDomain: account.institution?.website ? account.institution.website.replace(/^https?:\/\//, '') : undefined,
        assetClass: 'Cash',
        riskScore: 1,
        currentValue: accountValue,
        portfolioShare: portfolioShare,
        performance: performance,
        performanceHistory: performanceHistory,
        savingsPlan: accountSavingsPlan > 0 ? accountSavingsPlan : undefined,
        fsaAllocated: fsaAllocated,
        fsaGlobalLimit: globalFsaLimit,
      };
    });

    // 3. Process non-security Assets individual positions
    const otherAssetPositions: PortfolioPosition[] = assets
      .filter(asset => asset.asset_type?.code !== 'security')
      .map((asset) => {
        const snapshots = asset.snapshots || [];
        const latestSnapshot = snapshots[0];
        const previousSnapshot = snapshots[1];

        const currentValue = latestSnapshot ? parseFloat(latestSnapshot.value) : 0;
        const portfolioShare = totalNetWorth > 0 ? (currentValue / totalNetWorth) * 100 : 0;

        let performance = 0;
        if (latestSnapshot && previousSnapshot) {
          const prevValue = parseFloat(previousSnapshot.value);
          if (prevValue > 0) {
            performance = ((currentValue - prevValue) / prevValue) * 100;
          }
        }

        const performanceHistory = snapshots.slice(0, 7).reverse().map(s => parseFloat(s.value));
        if (performanceHistory.length === 1) performanceHistory.unshift(performanceHistory[0]);
        if (performanceHistory.length === 0) performanceHistory.push(0, 0);

        // Extract FSA data from asset account institution
        const exemption = asset.account?.institution?.tax_exemptions?.[0];
        const fsaAllocated = exemption?.amount ? parseFloat(exemption.amount) : 0;

        return {
          id: `asset-${asset.id}`,
          type: 'Asset',
          name: asset.name,
          subtype: asset.asset_type?.code,
          institution: asset.account?.institution?.name || asset.account?.name || '-',
          institutionDomain: asset.account?.institution?.website ? asset.account.institution.website.replace(/^https?:\/\//, '') : undefined,
          assetClass: asset.asset_type?.description || 'Other',
          riskScore: (asset.risk_class as any) || 3,
          currentValue: currentValue,
          portfolioShare: portfolioShare,
          performance: performance,
          performanceHistory: performanceHistory,
          savingsPlan: asset.savings_plan_amount ? parseFloat(asset.savings_plan_amount) : undefined,
          fsaAllocated: fsaAllocated,
          fsaGlobalLimit: globalFsaLimit,
        };
      });

    return [...accountPositions, ...otherAssetPositions].sort((a, b) => b.currentValue - a.currentValue);
  }, [data?.accounts, data?.assets, data?.totalValue, t]);


  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">{t('dashboard.errorLoading')}: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Dashboard Toggle Navigation */}
      <div className="flex items-center space-x-2 border-b pb-2">
        <Button
          variant={view === 'overview' ? 'secondary' : 'ghost'}
          onClick={() => setView('overview')}
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          {t('dashboard.overview', { defaultValue: 'Overview' })}
        </Button>
        <Button
          variant={view === 'analytics' ? 'secondary' : 'ghost'}
          onClick={() => setView('analytics')}
          className="gap-2"
        >
          <PieChart className="h-4 w-4" />
          {t('dashboard.analytics', { defaultValue: 'Analytics' })}
        </Button>
      </div>

      {view === 'overview' ? (
        <>
          {/* Metric Cards Grid */}
          <div className="grid gap-4 md:gap-6 xl:grid-cols-4">
            {/* Tax Usage Card (New) */}
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

          {/* Portfolio Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('portfolio.holdingsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PortfolioHoldingsTable holdings={portfolioHoldings} />
            </CardContent>
          </Card>

          {/* Portfolio Positions Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('portfolio.positionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PortfolioPositionsTable positions={portfolioPositions} />
            </CardContent>
          </Card>
        </>
      ) : (
        <DashboardAnalytics positions={portfolioPositions} />
      )}
    </div>
  );
}
