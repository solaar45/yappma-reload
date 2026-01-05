import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { useTransactions } from '@/lib/api/hooks';
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
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { Transaction } from '@/lib/api/types';

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch transactions
  const { data: transactions, isLoading, error } = useTransactions({
    userId: userId!,
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.creditor_name?.toLowerCase().includes(searchLower) ||
        tx.debtor_name?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      // Date filters
      const matchesFromDate = !fromDate || new Date(tx.booking_date) >= new Date(fromDate);
      const matchesToDate = !toDate || new Date(tx.booking_date) <= new Date(toDate);

      return matchesSearch && matchesStatus && matchesFromDate && matchesToDate;
    });
  }, [transactions, searchTerm, statusFilter, fromDate, toDate]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, filteredTransactions.length);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter, fromDate, toDate, pageSize]);

  // Define table columns
  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: 'booking_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Datum" />
        ),
        cell: ({ row }) => {
          return <div className="font-medium">{formatDate(row.original.booking_date)}</div>;
        },
        sortingFn: 'datetime',
      },
      {
        id: 'type',
        header: () => <div className="w-8"></div>,
        cell: ({ row }) => {
          const isIncoming = parseFloat(row.original.amount) > 0;
          return isIncoming ? (
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Beschreibung" />
        ),
        cell: ({ row }) => {
          const tx = row.original;
          const counterparty = tx.creditor_name || tx.debtor_name;
          
          return (
            <div>
              <div className="font-medium">
                {tx.description || counterparty || 'Keine Beschreibung'}
              </div>
              {counterparty && tx.description && (
                <div className="text-sm text-muted-foreground">{counterparty}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const isBooked = row.original.status === 'booked';
          return (
            <Badge variant={isBooked ? 'default' : 'secondary'}>
              {isBooked ? 'Gebucht' : 'Ausstehend'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Betrag" />
          </div>
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.original.amount);
          const isIncoming = amount > 0;
          
          return (
            <div className={`text-right font-medium ${
              isIncoming ? 'text-green-600' : 'text-red-600'
            }`}>
              {isIncoming ? '+' : ''}{formatCurrency(row.original.amount, row.original.currency)}
            </div>
          );
        },
      },
    ],
    [t]
  );

  // Create table instance
  const table = useReactTable({
    data: paginatedTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transaktionen</h1>
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
          Fehler beim Laden: {error.toString()}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transaktionen</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Keine Transaktionen vorhanden</p>
              <p className="text-sm text-muted-foreground mt-2">
                Synchronisiere deine Bankverbindungen um Transaktionen zu laden
              </p>
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
          <h1 className="text-3xl font-bold">Transaktionen</h1>
          <Badge variant="secondary" className="text-base">
            {transactions.length} Transaktionen
          </Badge>
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="grid gap-4 md:hidden">
        {paginatedTransactions.map((tx) => {
          const amount = parseFloat(tx.amount);
          const isIncoming = amount > 0;
          const counterparty = tx.creditor_name || tx.debtor_name;

          return (
            <Card key={tx.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {isIncoming ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {tx.description || counterparty || 'Keine Beschreibung'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(tx.booking_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tx.status === 'booked' ? 'default' : 'secondary'}>
                    {tx.status === 'booked' ? 'Gebucht' : 'Ausstehend'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {counterparty && tx.description && (
                    <div className="text-sm text-muted-foreground">{counterparty}</div>
                  )}
                  <div className={`text-2xl font-bold ml-auto ${
                    isIncoming ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isIncoming ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Mobile Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              {startIndex}-{endIndex} von {filteredTransactions.length}
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
                  placeholder="Suche nach Beschreibung oder Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="booked">Gebucht</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Von:</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Bis:</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                >
                  Zurücksetzen
                </Button>
              )}
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
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Zeige {startIndex}-{endIndex} von {filteredTransactions.length}
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
