import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useUser } from '@/contexts/UserContext';
import { useAssets, useInstitutions } from '@/lib/api/hooks';
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
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateAssetDialog } from '@/components/CreateAssetDialog';
import { EditAssetDialog } from '@/components/EditAssetDialog';
import { DeleteAssetDialog } from '@/components/DeleteAssetDialog';
import { Search, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Asset } from '@/lib/api/types';

export default function AssetsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { assets, loading, error, refetch } = useAssets({ userId: userId! });
  const { institutions: _institutions } = useInstitutions({ userId: userId! });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique asset types for filters
  const assetTypes = useMemo(() => {
    if (!assets) return [];
    const typeSet = new Set(assets.map(asset => {
      const code = asset.asset_type?.code || 'other';
      return t(`assetTypes.${code}`, { defaultValue: asset.asset_type?.description || 'Other' });
    }));
    return Array.from(typeSet).sort();
  }, [assets, t]);

  const institutionsList = useMemo(() => {
    if (!assets) return [];
    const seen = new Map<number, string>();
    assets.forEach(a => {
      if (a.institution_id && a.institution) {
        seen.set(a.institution_id, a.institution.name);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [assets]);

  // Helper function to get risk class color
  const getRiskClassColor = (riskClass: number | null | undefined) => {
    if (!riskClass) return 'bg-muted-foreground/30';

    switch (riskClass) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-lime-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-muted-foreground/30';
    }
  };

  // Helper function to get risk label
  const getRiskLabel = (riskClass: number | null | undefined) => {
    if (!riskClass) return t('assets.riskUnknown') || 'Unknown';

    switch (riskClass) {
      case 1: return t('assets.riskVeryLow') || 'Very Low';
      case 2: return t('assets.riskLow') || 'Low';
      case 3: return t('assets.riskMedium') || 'Medium';
      case 4: return t('assets.riskHigh') || 'High';
      case 5: return t('assets.riskVeryHigh') || 'Very High';
      default: return t('assets.riskUnknown') || 'Unknown';
    }
  };

  // Helper function to get risk source label
  const getRiskSourceLabel = (source: string | null | undefined) => {
    switch (source) {
      case 'auto_api': return t('assets.riskSourceApi') || 'Auto (API)';
      case 'auto_type': return t('assets.riskSourceType') || 'Auto (Type)';
      case 'manual': return t('assets.riskSourceManual') || 'Manual';
      default: return t('assets.riskSourceUnknown') || 'Unknown';
    }
  };

  // Filter and search logic
  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      const matchesSearch = searchTerm === '' ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.isin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ticker?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' ||
        (t(`assetTypes.${asset.asset_type?.code || 'other'}`, { defaultValue: asset.asset_type?.description || 'Other' }) === typeFilter);

      const matchesInstitution = institutionFilter === 'all' ||
        asset.institution_id?.toString() === institutionFilter;

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && asset.is_active) ||
        (statusFilter === 'inactive' && !asset.is_active);

      return matchesSearch && matchesType && matchesInstitution && matchesStatus;
    });
  }, [assets, searchTerm, typeFilter, institutionFilter, statusFilter, t]);

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
      await Promise.all(selectedAssetIds.map(id => apiClient.delete(`assets/${id}`)));
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
        const ticker = row.original.ticker || row.original.security_asset?.ticker || null;
        const isin = row.original.isin || row.original.security_asset?.isin || null;
        return (
          <div className="flex items-center gap-3">
            <InstitutionLogo name={row.original.name} ticker={ticker ?? undefined} isin={isin ?? undefined} size="medium" className="flex-shrink-0 rounded-full" />
            <div className="font-medium">{row.original.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'asset_type.description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.assetType') || 'Type'} />
      ),
      cell: ({ row }) => {
        const code = row.original.asset_type?.code || 'other';
        const description = row.original.asset_type?.description || 'Other';
        const translatedType = t(`assetTypes.${code}`, { defaultValue: description });
        return <Badge variant="outline" className="capitalize">{translatedType}</Badge>;
      },
    },
    {
      accessorKey: 'risk_class',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.risk') || 'Risk'} />
      ),
      cell: ({ row }) => {
        const riskClass = row.original.risk_class;
        const riskSource = row.original.risk_class_source;
        const riskLabel = getRiskLabel(riskClass);
        const sourceLabel = getRiskSourceLabel(riskSource);
        const color = getRiskClassColor(riskClass);

        if (!riskClass) {
          return (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              ))}
            </div>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i <= riskClass ? color : "bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{t('assets.risk')}: {riskLabel} ({riskClass}/5)</div>
                  <div className="text-muted-foreground mt-1">{t('assets.riskSource')}: {sourceLabel}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'institution.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.institution') || 'Institution'} />
      ),
      cell: ({ row }) => {
        const inst = row.original.institution;
        if (!inst) return <div className="text-sm text-muted-foreground">-</div>;
        return (
          <div className="flex items-center gap-2">
            <InstitutionLogo name={inst.name} domain={inst.website ? inst.website.replace(/^https?:\/\//, '') : undefined} size="small" className="flex-shrink-0 rounded-full" />
            <div className="text-sm text-muted-foreground">{inst.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'savings_plan_amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets.savingsPlan') || 'Savings Plan'} />
      ),
      cell: ({ row }) => {
        const amount = row.original.savings_plan_amount;
        if (!amount || parseFloat(amount) === 0) return <div className="text-sm text-muted-foreground">-</div>;
        return <div className="text-sm font-medium">{formatCurrency(amount, row.original.currency || 'EUR')}</div>;
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
                <span className="text-sm text-green-600">{t('assets.active') || 'Active'}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('assets.inactive') || 'Inactive'}</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'currentValue',
      accessorFn: (row) => parseFloat(row.snapshots?.[0]?.value || '0'),
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title={t('assets.currentValue') || 'Current Value'} />
        </div>
      ),
      cell: ({ row }) => {
        const value = row.original.snapshots?.[0]?.value || '0';
        const currency = row.original.currency || 'EUR';
        return <div className="text-right font-medium">{formatCurrency(value, currency)}</div>;
      },
    },
    {
      id: 'lastUpdated',
      accessorFn: (row) => row.snapshots?.[0]?.snapshot_date || '',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('assets.lastUpdated') || 'Last Updated'} />,
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        if (!latestSnapshot?.snapshot_date) return <Badge variant="outline" className="text-muted-foreground">{t('assets.noSnapshots') || 'No snapshots'}</Badge>;
        return <div className="text-sm">{formatDate(latestSnapshot.snapshot_date)}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <EditAssetDialog asset={row.original} onSuccess={refetch} />
          <DeleteAssetDialog asset={row.original} onSuccess={refetch} />
        </div>
      ),
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
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse bg-muted rounded" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('assets.errorLoading')}</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">{t('common.retry') || 'Retry'}</Button>
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
          <h1 className="text-3xl font-bold">{t('assets.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {filteredAssets.length} {t('assets.title')}
          </Badge>
        </div>
        <CreateAssetDialog onSuccess={refetch} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", selectedAssetIds.length > 0 && "opacity-0 invisible")}>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('assets.searchPlaceholder') || 'Search assets...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('assets.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allTypes')}</SelectItem>
                    {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('assets.allInstitutions') || 'All Institutions'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allInstitutions') || 'All Institutions'}</SelectItem>
                    {institutionsList.map(inst => <SelectItem key={inst.id} value={inst.id.toString()}>{inst.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={t('assets.allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assets.allStatus')}</SelectItem>
                    <SelectItem value="active">{t('assets.active')}</SelectItem>
                    <SelectItem value="inactive">{t('assets.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedAssetIds.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-between bg-muted p-3 rounded-md">
                <span className="text-sm font-medium">{selectedAssetIds.length} {t('assets.assetsSelected')}</span>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('assets.deleteSelected')}
                </Button>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={filteredAssets}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('assets.deleteSelectedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('assets.deleteSelectedConfirm', { count: selectedAssetIds.length })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
