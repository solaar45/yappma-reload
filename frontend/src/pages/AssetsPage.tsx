import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useAssets, useAccounts } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import InstitutionLogo from '@/components/InstitutionLogo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateAssetDialog } from '@/components/CreateAssetDialog';
import { EditAssetDialog } from '@/components/EditAssetDialog';
import { DeleteAssetDialog } from '@/components/DeleteAssetDialog';
import { PiggyBank, Search, Filter, Trash2, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Asset } from '@/lib/api/types';

export default function AssetsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { assets, loading, error, refetch } = useAssets({ userId: userId! });
  const { accounts } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique asset types and accounts for filters
  const assetTypes = useMemo(() => {
    if (!assets) return [];
    const typeSet = new Set(assets.map(asset => asset.asset_type?.description || 'Other'));
    return Array.from(typeSet).sort();
  }, [assets]);

  const accountsList = useMemo(() => {
    if (!accounts) return [];
    return accounts.map(acc => ({ id: acc.id, name: acc.name }));
  }, [accounts]);

  // Filter and search logic
  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.security_asset?.isin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.security_asset?.ticker?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' ||
        (asset.asset_type?.description || 'Other') === typeFilter;

      // Account filter
      const matchesAccount = accountFilter === 'all' ||
        asset.account_id?.toString() === accountFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && asset.is_active) ||
        (statusFilter === 'inactive' && !asset.is_active);

      return matchesSearch && matchesType && matchesAccount && matchesStatus;
    });
  }, [assets, searchTerm, typeFilter, accountFilter, statusFilter]);

  // Get selected asset IDs
  const selectedAssetIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key as keyof typeof rowSelection])
      .map(key => filteredAssets[parseInt(key)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredAssets]);

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      logger.info('Batch deleting assets', { count: selectedAssetIds.length, ids: selectedAssetIds });

      await Promise.all(
        selectedAssetIds.map(id => apiClient.delete(`assets/${id}`))
      );

      logger.info('Batch delete successful');
      await refetch();
      setRowSelection({});
      setShowDeleteDialog(false);
    } catch (error) {
      logger.error('Error during batch delete', { error });
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: ColumnDef<Asset>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.name') || 'Name'} />
      ),
      cell: ({ row }) => {
        const ticker = row.original.security_asset?.ticker || row.original.ticker || null;
        return (
          <div className="flex items-center gap-3">
            <InstitutionLogo name={row.original.name} ticker={ticker ?? undefined} size="medium" className="flex-shrink-0 rounded-full" />
            <div className="font-medium">{row.original.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'asset_type.description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.type') || 'Type'} />
      ),
      cell: ({ row }) => {
        const type = row.original.asset_type?.description || 'Other';
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'account.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.account') || 'Account'} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {row.original.account?.name || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.status') || 'Status'} />
      ),
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  {t('assets.active') || 'Active'}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('assets.inactive') || 'Inactive'}
                </span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'currentValue',
      accessorFn: (row) => {
        const value = row.snapshots?.[0]?.value || '0';
        return parseFloat(value);
      },
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title={t('assets.currentValue') || 'Current Value'} />
        </div>
      ),
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        const value = latestSnapshot?.value || '0';
        const currency = row.original.currency || 'EUR';
        return (
          <div className="text-right font-medium">
            {formatCurrency(value, currency)}
          </div>
        );
      },
    },
    {
      id: 'quantity',
      accessorFn: (row) => {
        const quantity = row.snapshots?.[0]?.quantity;
        return quantity ? parseFloat(quantity) : null;
      },
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title={t('assets.quantity') || 'Quantity'} />
        </div>
      ),
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        const quantity = latestSnapshot?.quantity;

        if (!quantity) {
          return <div className="text-right text-muted-foreground">-</div>;
        }

        return (
          <div className="text-right text-sm">
            {parseFloat(quantity).toFixed(2)}
          </div>
        );
      },
    },
    {
      id: 'identification',
      accessorFn: (row) => {
        return row.security_asset?.isin || row.security_asset?.ticker || row.symbol;
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.isinTicker') || 'ISIN/Ticker'} />
      ),
      cell: ({ row }) => {
        const isin = row.original.security_asset?.isin;
        const ticker = row.original.security_asset?.ticker;
        const symbol = row.original.symbol;

        if (isin) {
          return (
            <div className="text-xs font-mono text-muted-foreground">
              {isin}
            </div>
          );
        }

        if (ticker) {
          return (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span>{ticker}</span>
            </div>
          );
        }

        if (symbol) {
          return (
            <div className="text-sm text-muted-foreground">
              {symbol}
            </div>
          );
        }

        return <div className="text-muted-foreground">-</div>;
      },
    },
    {
      id: 'lastUpdated',
      accessorFn: (row) => {
        return row.snapshots?.[0]?.snapshot_date || '';
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.lastUpdated') || 'Last Updated'} />
      ),
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        if (!latestSnapshot?.snapshot_date) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              {t('assets.noSnapshots') || 'No snapshots'}
            </Badge>
          );
        }

        const snapshotDate = new Date(latestSnapshot.snapshot_date);
        const daysSince = Math.floor((Date.now() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOld = daysSince > 30;

        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm">
              {formatDate(latestSnapshot.snapshot_date)}
            </span>
            {isOld && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 w-fit">
                {daysSince} {t('assets.daysOld') || 'days old'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'snapshots',
      accessorFn: (row) => row.snapshots?.length || 0,
      header: ({ column }) => (
        <div className="text-center">
          <DataTableColumnHeader column={column} title={t('assets.snapshots') || 'Snapshots'} />
        </div>
      ),
      cell: ({ row }) => {
        const count = row.original.snapshots?.length || 0;
        return (
          <div className="text-center text-sm text-muted-foreground">
            {count}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-1">
            <EditAssetDialog asset={row.original} onSuccess={refetch} />
            <DeleteAssetDialog asset={row.original} onSuccess={refetch} />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('assets.title')}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('assets.errorLoading')}</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                {t('common.retry') || 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('assets.title')}</h1>
          <CreateAssetDialog onSuccess={refetch} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <PiggyBank className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('assets.noAssets')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('assets.addFirstDescription') ||
                    'Start tracking your investments by adding your first asset. Track stocks, bonds, real estate, and more.'}
                </p>
              </div>
              <CreateAssetDialog onSuccess={refetch} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{t('assets.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {filteredAssets.length} {filteredAssets.length === 1 ? t('common.asset') : t('assets.title')}
          </Badge>
        </div>
        <CreateAssetDialog onSuccess={refetch} />
      </div>

      {/* Data Table with Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters and Batch Actions */}
          <div className="relative mb-6">
            <div
              className={cn(
                "flex flex-col gap-4 md:flex-row md:items-center md:justify-between transition-all duration-200",
                selectedAssetIds.length > 0 ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"
              )}
            >
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('assets.searchPlaceholder') || 'Search assets, ISIN, ticker...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('assets.allTypes') || 'All Types'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allTypes') || 'All Types'}</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('assets.allAccounts') || 'All Accounts'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allAccounts') || 'All Accounts'}</SelectItem>
                    {accountsList.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={t('assets.allStatus') || 'All'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allStatus') || 'All'}</SelectItem>
                    <SelectItem value="active">{t('assets.active') || 'Active'}</SelectItem>
                    <SelectItem value="inactive">{t('assets.inactive') || 'Inactive'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Batch Actions Overlay */}
            {selectedAssetIds.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-between bg-muted p-3 rounded-md animate-in fade-in zoom-in-95 duration-200">
                <span className="text-sm font-medium">
                  {selectedAssetIds.length} {selectedAssetIds.length === 1 ?
                    t('assets.assetSelected') : t('assets.assetsSelected')
                  }
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('assets.deleteSelected') || 'Delete Selected'}
                </Button>
              </div>
            )}
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredAssets}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
      </Card>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('assets.deleteSelectedTitle') || 'Delete Selected Assets'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('assets.deleteSelectedConfirm') ||
                `Are you sure you want to delete ${selectedAssetIds.length} asset(s)? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') || 'Deleting...' : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
