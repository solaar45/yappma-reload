import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useSnapshots, type CombinedSnapshot } from '@/lib/api/hooks/useSnapshots';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import InstitutionLogo from '@/components/InstitutionLogo';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateSnapshotDialog } from '@/components/CreateSnapshotDialog';
import { EditSnapshotDialog } from '@/components/EditSnapshotDialog';
import { DeleteSnapshotDialog } from '@/components/DeleteSnapshotDialog';
import { CsvImportButton } from '@/components/csv-import-button';
import { Button } from '@/components/ui/button';
import { Search, Filter, Trash2, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// Local interface removed in favor of CombinedSnapshot from hook

export default function SnapshotsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { snapshots, loading, error } = useSnapshots({ userId: userId!, key: refreshKey });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSnapshotChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Filter snapshots
  const filteredSnapshots = useMemo(() => {
    if (!snapshots) return [];

    return snapshots.filter((snapshot) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();

      // Get display name and type for searching
      const isAccount = snapshot.snapshot_type === 'account';
      const subtype = snapshot.entity_subtype;
      const typeTranslated = t(`snapshots.types.${snapshot.snapshot_type}`).toLowerCase();
      const subtypeTranslated = subtype
        ? (isAccount
          ? t(`accountTypes.${subtype}`, { defaultValue: subtype })
          : t(`assetTypes.${subtype}`, { defaultValue: subtype })
        ).toLowerCase()
        : '';

      const formattedDate = formatDate(snapshot.snapshot_date).toLowerCase();
      const institutionName = snapshot.institution?.name?.toLowerCase() || '';
      const ticker = (snapshot as any).ticker?.toLowerCase() || '';
      const isin = (snapshot as any).isin?.toLowerCase() || '';

      const matchesSearch =
        searchTerm === '' ||
        snapshot.entity_name.toLowerCase().includes(searchLower) ||
        formattedDate.includes(searchLower) ||
        typeTranslated.includes(searchLower) ||
        subtypeTranslated.includes(searchLower) ||
        institutionName.includes(searchLower) ||
        ticker.includes(searchLower) ||
        isin.includes(searchLower);

      // Type filter
      const matchesType = typeFilter === 'all' || snapshot.snapshot_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [snapshots, searchTerm, typeFilter]);

  // Get selected snapshot IDs
  const selectedSnapshotIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((key) => filteredSnapshots[parseInt(key)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredSnapshots]);

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      logger.info('Batch deleting snapshots', {
        count: selectedSnapshotIds.length,
        ids: selectedSnapshotIds,
      });

      await Promise.all(selectedSnapshotIds.map((id) => apiClient.delete(`snapshots/${id}`)));

      logger.info('Batch delete successful');
      handleSnapshotChanged();
      setRowSelection({});
      setShowDeleteDialog(false);
    } catch (error) {
      logger.error('Error during batch delete', { error });
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: ColumnDef<CombinedSnapshot>[] = useMemo(
    () => [
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
        accessorKey: 'snapshot_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.date') || 'Date'} />
        ),
        cell: ({ row }) => {
          return <div className="font-medium">{formatDate(row.original.snapshot_date)}</div>;
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'entity_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('snapshots.entity') || 'Entity'} />
        ),
        cell: ({ row }) => {
          let displayName = row.original.entity_name;
          // Fallback if name is missing or '-'
          if (!displayName || displayName === '-') {
            const subtype = (row.original as any).entity_subtype;

            // DEBUG: Show subtype to identify if it's missing or case mismatch
            if (!subtype) console.log('Missing subtype for row:', row.original);

            if (row.original.snapshot_type === 'account') {
              // Try to translate, fallback to account
              const translated = subtype
                ? t(`accountTypes.${subtype}`, { defaultValue: t('common.account') })
                : t('common.account');
              // For debugging, if translation falls back to "Account" (and we expect "Girokonto"), we might need to see subtype
              displayName = translated;
            } else {
              const translated = subtype
                ? t(`assetTypes.${subtype}`, { defaultValue: t('common.asset') })
                : t('common.asset');
              displayName = translated;
            }
          }

          const inst = row.original.institution;
          const domain = inst?.website ? inst.website.replace(/^https?:\/\//, '') : undefined;

          return (
            <div className="flex items-center gap-3">
              <InstitutionLogo
                name={inst?.name || row.original.entity_name}
                domain={domain}
                ticker={(row.original as any).ticker}
                isin={(row.original as any).isin}
                size="medium"
                className="flex-shrink-0 rounded-full"
              />
              <div className="font-medium">{displayName}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'snapshot_type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.type') || 'Type'} />
        ),
        cell: ({ row }) => {
          const isAccount = row.original.snapshot_type === 'account';
          return (
            <Badge variant={isAccount ? 'default' : 'secondary'}>
              {t(`snapshots.types.${isAccount ? 'account' : 'asset'}`)}
            </Badge>
          );
        },
      },
      {
        id: 'price',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title={t('common.price') || 'Price'} />
          </div>
        ),
        cell: ({ row }) => {
          const isAccount = row.original.snapshot_type === 'account';
          if (isAccount) return <div className="text-right font-medium">-</div>;

          const price = (row.original as any).market_price_per_unit;
          if (!price || parseFloat(price) === 0) {
            return <div className="text-right font-medium">-</div>;
          }

          // We use the currency of the asset (or default EUR if missing) - combined snapshot doesn't have it directly on root always?
          // Actually CombinedSnapshot doesn't have currency on root for Asset, but formatted currency usually takes 2 params.
          // Let's use EUR as default for now or check if we can get it.
          // In Create/Edit dialogs we see we rely on getting it from somewhere.
          // For display purposes, just formatting the number happens in formatCurrency.
          return (
            <div className="text-right font-medium">
              {formatCurrency(price, (row.original as any).currency || 'EUR')}
            </div>
          );
        },
      },
      {
        id: 'value',
        accessorFn: (row) => {
          const isAccount = row.snapshot_type === 'account';
          const value = isAccount ? row.balance : row.value;
          return parseFloat(value || '0');
        },
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title={t('common.value') || 'Value'} />
          </div>
        ),
        cell: ({ row }) => {
          const snapshot = row.original;
          const isAccount = snapshot.snapshot_type === 'account';
          const value = isAccount ? (snapshot as any).balance : (snapshot as any).value;
          const currency = isAccount ? (snapshot as any).currency : 'EUR';
          return (
            <div className="text-right font-medium">
              {formatCurrency(value || '0', currency || 'EUR')}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('common.actions') || 'Actions'}</div>,
        cell: ({ row }) => {
          return (
            <div className="flex justify-end gap-1">
              <EditSnapshotDialog snapshot={row.original as any} onSuccess={handleSnapshotChanged} />
              <DeleteSnapshotDialog snapshot={row.original as any} onSuccess={handleSnapshotChanged} />
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [t, handleSnapshotChanged]
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('snapshots.title')}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-muted rounded" />
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
        <div className="text-destructive">
          {t('snapshots.errorLoading')}: {error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('snapshots.title')}</h1>
          <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('snapshots.noSnapshots')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('snapshots.addFirstDescription') ||
                    'Start tracking your wealth by adding your first snapshot. Records balances and prices over time.'}
                </p>
              </div>
              <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{t('snapshots.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {filteredSnapshots.length} {filteredSnapshots.length === 1 ? t('common.snapshot') : t('snapshots.title')}
          </Badge>
        </div>
        <div className="flex gap-2">
          <CsvImportButton />
          {/* We wrap CreateSnapshotDialog with a custom trigger if needed, but it has its own trigger. 
              The original code used <CreateSnapshotDialog /> directly which renders a button.
              If we want to style them together, we might need to adjust CreateSnapshotDialog or just place them side by side.
              The original component renders a <Dialog><DialogTrigger asChild><Button>...</Button></DialogTrigger>...
              So placing them side-by-side works fine.
          */}
          <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="grid gap-4 md:hidden">
        {filteredSnapshots.map((snapshot) => {
          const isAccount = snapshot.snapshot_type === 'account';
          const value = isAccount ? (snapshot as any).balance : (snapshot as any).value;
          const currency = isAccount ? (snapshot as any).currency : 'EUR';

          return (
            <Card key={`${snapshot.snapshot_type}-${snapshot.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-end">
                  <Badge variant={isAccount ? 'default' : 'secondary'}>
                    {t(`snapshots.types.${isAccount ? 'account' : 'asset'}`)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <InstitutionLogo
                    name={snapshot.institution?.name || snapshot.entity_name}
                    domain={snapshot.institution?.website?.replace(/^https?:\/\//, '')}
                    ticker={(snapshot as any).ticker}
                    isin={(snapshot as any).isin}
                    size="small"
                    className="flex-shrink-0 rounded-full"
                  />
                  <div>
                    <CardTitle className="text-base">{snapshot.entity_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(snapshot.snapshot_date)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(value, currency)}</div>
                  <div className="flex gap-1">
                    <EditSnapshotDialog snapshot={snapshot as any} onSuccess={handleSnapshotChanged} />
                    <DeleteSnapshotDialog
                      snapshot={snapshot as any}
                      onSuccess={handleSnapshotChanged}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: DataTable with Filters */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          {/* Filters and Batch Actions */}
          <div className="relative mb-6">
            <div
              className={cn(
                "flex flex-col gap-4 md:flex-row md:items-center md:justify-between transition-all duration-200",
                selectedSnapshotIds.length > 0 ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"
              )}
            >
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('snapshots.searchPlaceholder') || 'Search by entity name...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('snapshots.allTypes') || 'All Types'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('snapshots.allTypes') || 'All Types'}</SelectItem>
                    <SelectItem value="account">
                      {t('snapshots.types.account') || 'Account'}
                    </SelectItem>
                    <SelectItem value="asset">{t('snapshots.types.asset') || 'Asset'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Batch Actions Overlay */}
            {selectedSnapshotIds.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-between bg-muted p-3 rounded-md animate-in fade-in zoom-in-95 duration-200">
                <span className="text-sm font-medium">
                  {selectedSnapshotIds.length} {selectedSnapshotIds.length === 1 ?
                    t('snapshots.snapshotSelected') : t('snapshots.snapshotsSelected')
                  }
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('snapshots.deleteSelected') || 'Delete Selected'}
                </Button>
              </div>
            )}
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredSnapshots}
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
              {t('snapshots.deleteSelectedTitle') || 'Delete Selected Snapshots'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('snapshots.deleteSelectedConfirm') ||
                `Are you sure you want to delete ${selectedSnapshotIds.length} snapshot(s)? This action cannot be undone.`
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