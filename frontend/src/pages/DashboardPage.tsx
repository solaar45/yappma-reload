import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, PiggyBank } from 'lucide-react';

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

      {/* Main Content Area */}
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
