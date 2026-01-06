import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useAccounts } from '@/lib/api/hooks';
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
import { CreateAccountDialog } from '@/components/CreateAccountDialog';
import { EditAccountDialog } from '@/components/EditAccountDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { Trash2, Search, Filter, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

import type { Account } from '@/lib/api/types';

export default function AccountsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { accounts, isLoading: loading, error, refetch } = useAccounts({ userId: userId ?? undefined });
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique institutions and types for filters
  const institutions = useMemo(() => {
    if (!accounts) return [];
    const instSet = new Set(accounts.map(acc => acc.institution?.name || 'Other'));
    return Array.from(instSet).sort();
  }, [accounts]);

  const accountTypes = useMemo(() => {
    if (!accounts) return [];
    const typeSet = new Set(accounts.map(acc => acc.type));
    return Array.from(typeSet).sort();
  }, [accounts]);

  // Filter and search logic
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.institution?.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Institution filter
      const matchesInstitution = institutionFilter === 'all' ||
        (account.institution?.name || 'Other') === institutionFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || account.type === typeFilter;

      return matchesSearch && matchesInstitution && matchesType;
    });
  }, [accounts, searchTerm, institutionFilter, typeFilter]);

  // Get selected account IDs
  const selectedAccountIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key as keyof typeof rowSelection])
      .map(key => filteredAccounts[parseInt(key)]?.id)
      .filter(Boolean);
  }, [rowSelection, filteredAccounts]);

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      logger.info('Batch deleting accounts', { count: selectedAccountIds.length, ids: selectedAccountIds });

      await Promise.all(
        selectedAccountIds.map(id => apiClient.delete(`accounts/${id}`))
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
  const columns: ColumnDef<Account>[] = [
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
        <DataTableColumnHeader column={column} title={t('accounts.name') || 'Name'} />
      ),
      cell: ({ row }) => {
        const inst = row.original.institution;
        const domain = inst?.website ? inst.website.replace(/^https?:\/\//, '') : undefined;
        return (
          <div className="flex items-center gap-3">
            <InstitutionLogo
              name={inst?.name || row.original.name}
              domain={domain}
              size="medium"
              className="flex-shrink-0 rounded-full"
            />
            <div className="font-medium">{row.original.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'institution.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('accounts.institution') || 'Institution'} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {row.original.institution?.name || 'Other'}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('accounts.type') || 'Type'} />
      ),
      cell: ({ row }) => {
        const code = row.original.type;
        const translatedType = t(`accountTypes.${code}`, { defaultValue: code.replace('_', ' ') });
        return (
          <Badge variant="outline" className="capitalize">
            {translatedType}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('accounts.status') || 'Status'} />
      ),
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  {t('accounts.active') || 'Active'}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('accounts.inactive') || 'Inactive'}
                </span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'balance',
      accessorFn: (row) => {
        const balance = row.snapshots?.[0]?.balance || '0';
        return parseFloat(balance);
      },
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title={t('accounts.balance') || 'Balance'} />
        </div>
      ),
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        const balance = latestSnapshot?.balance || '0';
        const currency = latestSnapshot?.currency || row.original.currency || 'EUR';
        return (
          <div className="text-right font-medium">
            {formatCurrency(balance, currency)}
          </div>
        );
      },
    },
    {
      id: 'lastUpdated',
      accessorFn: (row) => {
        return row.snapshots?.[0]?.snapshot_date || '';
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('accounts.lastUpdated') || 'Last Updated'} />
      ),
      cell: ({ row }) => {
        const latestSnapshot = row.original.snapshots?.[0];
        if (!latestSnapshot?.snapshot_date) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              {t('accounts.noSnapshots') || 'No snapshots'}
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
                {daysSince} {t('accounts.daysOld') || 'days old'}
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
          <DataTableColumnHeader column={column} title={t('accounts.snapshots') || 'Snapshots'} />
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
            <EditAccountDialog account={row.original} onSuccess={refetch} />
            <DeleteAccountDialog account={row.original} onSuccess={refetch} />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
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
                <h3 className="text-lg font-semibold">{t('accounts.errorLoading')}</h3>
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

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
          <CreateAccountDialog onSuccess={refetch} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Wallet className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('accounts.noAccounts')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('accounts.addFirstDescription') ||
                    'Start tracking your wealth by adding your first account. Connect bank accounts, credit cards, or other financial accounts.'}
                </p>
              </div>
              <CreateAccountDialog onSuccess={refetch} />
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
          <h1 className="text-3xl font-bold">{t('accounts.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {filteredAccounts.length} {filteredAccounts.length === 1 ? t('common.account') : t('accounts.title')}
          </Badge>
        </div>
        <CreateAccountDialog onSuccess={refetch} />
      </div>

      {/* Data Table with Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters and Batch Actions */}
          <div className="relative mb-6">
            <div
              className={cn(
                "flex flex-col gap-4 md:flex-row md:items-center md:justify-between transition-all duration-200",
                selectedAccountIds.length > 0 ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"
              )}
            >
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('accounts.searchPlaceholder') || 'Search accounts...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('accounts.allInstitutions') || 'All Institutions'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('accounts.allInstitutions') || 'All Institutions'}</SelectItem>
                    {institutions.map((inst) => (
                      <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('accounts.allTypes') || 'All Types'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('accounts.allTypes') || 'All Types'}</SelectItem>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {t(`accountTypes.${type}`, { defaultValue: type.replace('_', ' ') })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Batch Actions Overlay */}
            {selectedAccountIds.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-between bg-muted p-3 rounded-md animate-in fade-in zoom-in-95 duration-200">
                <span className="text-sm font-medium">
                  {selectedAccountIds.length} {selectedAccountIds.length === 1 ?
                    t('accounts.accountSelected') : t('accounts.accountsSelected')
                  }
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('accounts.deleteSelected') || 'Delete Selected'}
                </Button>
              </div>
            )}
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredAccounts}
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
              {t('accounts.deleteSelectedTitle') || 'Delete Selected Accounts'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounts.deleteSelectedConfirm') ||
                `Are you sure you want to delete ${selectedAccountIds.length} account(s)? This action cannot be undone.`
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
