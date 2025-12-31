import { useState } from 'react';
import { useAssets } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateAssetDialog } from '@/components/CreateAssetDialog';
import { EditAssetDialog } from '@/components/EditAssetDialog';
import { DeleteAssetDialog } from '@/components/DeleteAssetDialog';
import { PiggyBank, TrendingUp, Package } from 'lucide-react';

export default function AssetsPage() {
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { assets, loading, error } = useAssets({ userId: userId!, key: refreshKey });

  const handleAssetChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Assets</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="text-destructive">Error loading assets: {error}</div>
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Assets</h1>
          <CreateAssetDialog onSuccess={handleAssetChanged} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No assets found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first asset to start tracking your investments
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    const typeName = asset.asset_type?.description || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(asset);
    return acc;
  }, {} as Record<string, typeof assets>);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Assets</h1>
          <div className="text-sm text-muted-foreground">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CreateAssetDialog onSuccess={handleAssetChanged} />
      </div>

      {Object.entries(assetsByType).map(([typeName, typeAssets]) => (
        <div key={typeName} className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{typeName}</h2>
            <span className="text-sm text-muted-foreground">
              ({typeAssets.length})
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typeAssets.map((asset) => {
              const latestSnapshot = asset.snapshots?.[0];
              const value = latestSnapshot?.value || '0';
              const quantity = latestSnapshot?.quantity;
              const snapshotDate = latestSnapshot?.snapshot_date;
              const currency = asset.currency || 'EUR';

              return (
                <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {asset.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <EditAssetDialog asset={asset} onSuccess={handleAssetChanged} />
                      <DeleteAssetDialog asset={asset} onSuccess={handleAssetChanged} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(value, currency)}
                        </div>
                        {snapshotDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            as of {formatDate(snapshotDate)}
                          </p>
                        )}
                      </div>

                      {quantity && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Quantity:</span>
                          <span className="font-medium">
                            {parseFloat(quantity).toFixed(2)} units
                          </span>
                        </div>
                      )}

                      {asset.security_asset?.isin && (
                        <div className="text-xs text-muted-foreground font-mono">
                          ISIN: {asset.security_asset.isin}
                        </div>
                      )}

                      {asset.security_asset?.ticker && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>{asset.security_asset.ticker}</span>
                        </div>
                      )}

                      {asset.snapshots && asset.snapshots.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {asset.snapshots.length} snapshot{asset.snapshots.length !== 1 ? 's' : ''}
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
