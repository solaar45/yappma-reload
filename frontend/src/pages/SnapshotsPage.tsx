import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useSnapshots } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateSnapshotDialog } from '@/components/CreateSnapshotDialog';
import { EditSnapshotDialog } from '@/components/EditSnapshotDialog';
import { DeleteSnapshotDialog } from '@/components/DeleteSnapshotDialog';
import { Calendar } from 'lucide-react';

interface Snapshot {
  id: number;
  snapshot_type: 'account' | 'asset';
  snapshot_date: string;
  entity_name: string;
  balance?: string;
  value?: string;
  currency?: string;
}

export default function SnapshotsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { snapshots, loading, error } = useSnapshots({ userId: userId!, key: refreshKey });

  const handleSnapshotChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Define table columns
  const columns: ColumnDef<Snapshot>[] = useMemo(
    () => [
      {
        accessorKey: 'snapshot_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.date') || 'Date'} />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium">{formatDate(row.original.snapshot_date)}</div>
          );
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
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
            {snapshots.length} {t('snapshots.title').toLowerCase()}
          </Badge>
        </div>
        <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
      </div>

      {/* Mobile: Card Layout */}
      <div className="grid gap-4 md:hidden">
        {snapshots.map((snapshot) => {
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

      {/* Desktop: DataTable Layout */}
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          <DataTable columns={columns} data={snapshots} />
        </CardContent>
      </Card>
    </div>
  );
}
