import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateAccountDialog } from '@/components/CreateAccountDialog';
import { EditAccountDialog } from '@/components/EditAccountDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { Wallet, Building2, TrendingUp } from 'lucide-react';

export default function AccountsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { accounts, loading, error } = useAccounts({ userId: userId!, key: refreshKey });

  const handleAccountChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 animate-pulse bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 w-24 animate-pulse bg-muted rounded" />
                  <div className="h-4 w-40 animate-pulse bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">{t('accounts.errorLoading')}: {error}</div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
          <CreateAccountDialog onSuccess={handleAccountChanged} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('accounts.noAccounts')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('accounts.addFirst')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group accounts by institution
  const accountsByInstitution = accounts.reduce((acc, account) => {
    const institutionName = account.institution?.name || 'Other';
    if (!acc[institutionName]) {
      acc[institutionName] = [];
    }
    acc[institutionName].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
          <div className="text-sm text-muted-foreground">
            {accounts.length} {t('accounts.snapshots')}
          </div>
        </div>
        <CreateAccountDialog onSuccess={handleAccountChanged} />
      </div>

      {Object.entries(accountsByInstitution).map(([institutionName, institutionAccounts]) => (
        <div key={institutionName} className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{institutionName}</h2>
            <span className="text-sm text-muted-foreground">
              ({institutionAccounts.length})
            </span>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {institutionAccounts.map((account) => {
              const latestSnapshot = account.snapshots?.[0];
              const balance = latestSnapshot?.balance || '0';
              const currency = latestSnapshot?.currency || account.currency || 'EUR';
              const snapshotDate = latestSnapshot?.snapshot_date;

              return (
                <Card key={account.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {account.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <EditAccountDialog 
                        account={account} 
                        onSuccess={handleAccountChanged} 
                      />
                      <DeleteAccountDialog 
                        account={account} 
                        onSuccess={handleAccountChanged} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(balance, currency)}
                        </div>
                        {snapshotDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.asOf')} {formatDate(snapshotDate)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span className="capitalize">{account.type.replace('_', ' ')}</span>
                      </div>

                      {account.snapshots && account.snapshots.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {account.snapshots.length} {t('accounts.snapshots')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
