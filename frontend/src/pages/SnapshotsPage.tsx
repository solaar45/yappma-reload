import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useSnapshots } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateSnapshotDialog } from '@/components/CreateSnapshotDialog';
import { EditSnapshotDialog } from '@/components/EditSnapshotDialog';
import { DeleteSnapshotDialog } from '@/components/DeleteSnapshotDialog';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

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

      return matchesSearch && matchesType;
    });
  }, [snapshots, searchTerm, typeFilter]);

  // Paginated snapshots
  const paginatedSnapshots = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredSnapshots.slice(startIndex, startIndex + pageSize);
  }, [filteredSnapshots, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredSnapshots.length / pageSize);
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, filteredSnapshots.length);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, typeFilter, pageSize]);

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

  // Create table instance
  const table = useReactTable({
    data: paginatedSnapshots,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true, // We handle pagination ourselves
  });

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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
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
        {paginatedSnapshots.map((snapshot) => {
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

        {/* Mobile Pagination */}
        {filteredSnapshots.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              {startIndex}-{endIndex} von {filteredSnapshots.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
                  placeholder={t('snapshots.searchPlaceholder') || 'Nach Entitätsnamen suchen...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('snapshots.allTypes') || 'Alle Typen'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('snapshots.allTypes') || 'Alle Typen'}</SelectItem>
                    <SelectItem value="account">
                      {t('snapshots.types.account') || 'Konto'}
                    </SelectItem>
                    <SelectItem value="asset">{t('snapshots.types.asset') || 'Vermögen'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* DataTable */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Keine Ergebnisse.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredSnapshots.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Zeige {startIndex}-{endIndex} von {filteredSnapshots.length}
                </p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / Seite</SelectItem>
                    <SelectItem value="25">25 / Seite</SelectItem>
                    <SelectItem value="50">50 / Seite</SelectItem>
                    <SelectItem value="100">100 / Seite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
                <div className="text-sm text-muted-foreground">
                  Seite {currentPage + 1} von {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
