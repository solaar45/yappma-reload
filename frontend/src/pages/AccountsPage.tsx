import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useAccounts } from '@/lib/api/hooks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateAccountDialog } from '@/components/CreateAccountDialog';
import { EditAccountDialog } from '@/components/EditAccountDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { Wallet, Search, Filter } from 'lucide-react';

interface Account {
  id: number;
  name: string;
  type: string;
  currency: string;
  institution?: {
    id: number;
    name: string;
  };
  snapshots?: Array<{
    id: number;
    balance: string;
    currency: string;
    snapshot_date: string;
  }>;
}

export default function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, isLoading: loading, error, refetch } = useAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  // Define table columns
  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('accounts.name') || 'Name'} />
      ),
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {row.original.name}
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
        const type = row.original.type.replace('_', ' ');
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
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
        <div className="text-destructive">{t('accounts.errorLoading')}: {error.message}</div>
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

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredAccounts} />
    </div>
  );
}
