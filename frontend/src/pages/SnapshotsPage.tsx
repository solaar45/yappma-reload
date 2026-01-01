import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useSnapshots } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateSnapshotDialog } from '@/components/CreateSnapshotDialog';
import { EditSnapshotDialog } from '@/components/EditSnapshotDialog';
import { DeleteSnapshotDialog } from '@/components/DeleteSnapshotDialog';
import { Calendar as CalendarIcon, Search, Filter } from 'lucide-react';

interface Snapshot {
  id: number;
  snapshot_type: 'account' | 'asset';
  snapshot_date: string;
  entity_name: string;
  balance?: string;
  value?: string;
  currency?: string;
}

// Helper to parse German date format (dd.MM.yyyy) to Date
function parseGermanDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) return null;
  
  return new Date(year, month, day);
}

export default function SnapshotsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { snapshots, loading, error } = useSnapshots({ userId: userId!, key: refreshKey });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFromStr, setDateFromStr] = useState<string>('');
  const [dateToStr, setDateToStr] = useState<string>('');

  const handleSnapshotChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Filter snapshots
  const filteredSnapshots = useMemo(() => {
    if (!snapshots) return [];

    return snapshots.filter((snapshot) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        snapshot.entity_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || snapshot.snapshot_type === typeFilter;

      // Date filter
      const snapshotDate = new Date(snapshot.snapshot_date);
      const dateFrom = parseGermanDate(dateFromStr);
      const dateTo = parseGermanDate(dateToStr);
      
      const matchesDateFrom = !dateFrom || snapshotDate >= dateFrom;
      const matchesDateTo = !dateTo || snapshotDate <= dateTo;

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [snapshots, searchTerm, typeFilter, dateFromStr, dateToStr]);

  // Define table columns
  const columns: ColumnDef<Snapshot>[] = useMemo(
    () => [
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
          return <div className="font-medium">{row.original.entity_name}</div>;
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
          const isAccount = row.original.snapshot_type === 'account';
          const value = isAccount ? row.original.balance : row.original.value;
          const currency = isAccount ? row.original.currency : 'EUR';
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
              <EditSnapshotDialog snapshot={row.original} onSuccess={handleSnapshotChanged} />
              <DeleteSnapshotDialog snapshot={row.original} onSuccess={handleSnapshotChanged} />
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
          {t('snapshots.errorLoading')}: {error}
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('snapshots.noSnapshots')}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('snapshots.addFirst')}</p>
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
            {filteredSnapshots.length} {t('snapshots.title').toLowerCase()}
          </Badge>
        </div>
        <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
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
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{snapshot.entity_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(snapshot.snapshot_date)}
                    </p>
                  </div>
                  <Badge variant={isAccount ? 'default' : 'secondary'}>
                    {t(`snapshots.types.${isAccount ? 'account' : 'asset'}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(value, currency)}</div>
                  <div className="flex gap-1">
                    <EditSnapshotDialog snapshot={snapshot} onSuccess={handleSnapshotChanged} />
                    <DeleteSnapshotDialog
                      snapshot={snapshot}
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
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('snapshots.searchPlaceholder') || 'Search by entity name...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Type and Date Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                
                {/* Type Filter */}
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

                {/* Date From Input */}
                <Input
                  placeholder="01.10.2019"
                  value={dateFromStr}
                  onChange={(e) => setDateFromStr(e.target.value)}
                  className="w-[140px]"
                />

                {/* Date To Input */}
                <Input
                  placeholder="31.03.2022"
                  value={dateToStr}
                  onChange={(e) => setDateToStr(e.target.value)}
                  className="w-[140px]"
                />
              </div>
            </div>
          </div>

          {/* DataTable */}
          <DataTable columns={columns} data={filteredSnapshots} />
        </CardContent>
      </Card>
    </div>
  );
}
