import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

// Types
export interface PortfolioHolding {
  id: string;
  type: 'account' | 'asset';
  name: string;
  institution: string;
  assetClass: 'equity' | 'bond' | 'real_estate' | 'cash' | 'crypto' | 'commodity';
  riskScore: 1 | 2 | 3 | 4 | 5;
  currentValue: number;
  portfolioShare: number; // Percentage
  performance: number; // Percentage YTD
  savingsPlan: number | null; // Monthly amount or null
  fsaAllocated: number; // Amount allocated
  fsaUsedYtd: number; // Amount used this year
}

// Dummy Data
const DUMMY_HOLDINGS: PortfolioHolding[] = [
  {
    id: '1',
    type: 'account',
    name: 'Girokonto',
    institution: 'Deutsche Bank',
    assetClass: 'cash',
    riskScore: 1,
    currentValue: 12500,
    portfolioShare: 10.1,
    performance: 0,
    savingsPlan: null,
    fsaAllocated: 0,
    fsaUsedYtd: 0,
  },
  {
    id: '2',
    type: 'asset',
    name: 'Apple Inc.',
    institution: 'Trade Republic',
    assetClass: 'equity',
    riskScore: 4,
    currentValue: 15450,
    portfolioShare: 12.5,
    performance: 8.5,
    savingsPlan: 250,
    fsaAllocated: 350,
    fsaUsedYtd: 227.5,
  },
  {
    id: '3',
    type: 'asset',
    name: 'iShares MSCI World ETF',
    institution: 'Trade Republic',
    assetClass: 'equity',
    riskScore: 3,
    currentValue: 45800,
    portfolioShare: 37.1,
    performance: 12.3,
    savingsPlan: 500,
    fsaAllocated: 400,
    fsaUsedYtd: 385.2,
  },
  {
    id: '4',
    type: 'asset',
    name: 'DAX ETF',
    institution: 'Comdirect',
    assetClass: 'equity',
    riskScore: 3,
    currentValue: 18200,
    portfolioShare: 14.7,
    performance: -2.1,
    savingsPlan: null,
    fsaAllocated: 250,
    fsaUsedYtd: 165,
  },
  {
    id: '5',
    type: 'account',
    name: 'Tagesgeld',
    institution: 'Deutsche Bank',
    assetClass: 'cash',
    riskScore: 1,
    currentValue: 8500,
    portfolioShare: 6.9,
    performance: 3.5,
    savingsPlan: 100,
    fsaAllocated: 0,
    fsaUsedYtd: 0,
  },
  {
    id: '6',
    type: 'asset',
    name: 'Bitcoin',
    institution: 'Trade Republic',
    assetClass: 'crypto',
    riskScore: 5,
    currentValue: 3200,
    portfolioShare: 2.6,
    performance: 45.2,
    savingsPlan: null,
    fsaAllocated: 0,
    fsaUsedYtd: 0,
  },
  {
    id: '7',
    type: 'asset',
    name: 'Vanguard Total Bond',
    institution: 'Comdirect',
    assetClass: 'bond',
    riskScore: 2,
    currentValue: 19850,
    portfolioShare: 16.1,
    performance: 1.8,
    savingsPlan: null,
    fsaAllocated: 0,
    fsaUsedYtd: 0,
  },
];

const ASSET_CLASS_LABELS: Record<string, string> = {
  equity: 'Aktien',
  bond: 'Anleihen',
  real_estate: 'Immobilien',
  cash: 'Bargeld',
  crypto: 'Krypto',
  commodity: 'Rohstoffe',
};

const RISK_COLORS = {
  1: 'bg-green-500',
  2: 'bg-lime-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

const RISK_LABELS = {
  1: 'Sehr niedrig',
  2: 'Niedrig',
  3: 'Mittel',
  4: 'Hoch',
  5: 'Sehr hoch',
};

export function PortfolioHoldingsTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');

  // Calculate totals
  const totalValue = useMemo(
    () => DUMMY_HOLDINGS.reduce((sum, h) => sum + h.currentValue, 0),
    []
  );
  const totalFsaAllocated = useMemo(
    () => DUMMY_HOLDINGS.reduce((sum, h) => sum + h.fsaAllocated, 0),
    []
  );
  const totalFsaUsed = useMemo(
    () => DUMMY_HOLDINGS.reduce((sum, h) => sum + h.fsaUsedYtd, 0),
    []
  );
  const totalSavingsPlan = useMemo(
    () =>
      DUMMY_HOLDINGS.reduce((sum, h) => sum + (h.savingsPlan || 0), 0),
    []
  );
  const avgPerformance = useMemo(
    () =>
      DUMMY_HOLDINGS.reduce((sum, h) => sum + h.performance, 0) /
      DUMMY_HOLDINGS.length,
    []
  );

  // Weighted average risk score
  const avgRiskScore = useMemo(
    () =>
      DUMMY_HOLDINGS.reduce(
        (sum, h) => sum + h.riskScore * h.portfolioShare,
        0
      ) / 100,
    []
  );

  const columns: ColumnDef<PortfolioHolding>[] = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Typ
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.type === 'account' ? 'default' : 'secondary'}>
            {row.original.type === 'account' ? (
              <>
                <Wallet className="mr-1 h-3 w-3" />
                Account
              </>
            ) : (
              <>
                <PiggyBank className="mr-1 h-3 w-3" />
                Asset
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: 'institution',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Institution
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: 'assetClass',
        header: 'Asset-Klasse',
        cell: ({ row }) => (
          <Badge variant="outline">
            {ASSET_CLASS_LABELS[row.original.assetClass]}
          </Badge>
        ),
      },
      {
        accessorKey: 'riskScore',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Risiko
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const risk = row.original.riskScore;
          return (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-4 w-1.5 rounded-sm ${
                      level <= risk ? RISK_COLORS[risk] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {RISK_LABELS[risk]}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'currentValue',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Aktueller Wert
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-semibold">
            {formatCurrency(row.original.currentValue.toString(), 'EUR')}
          </div>
        ),
      },
      {
        accessorKey: 'portfolioShare',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Anteil
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {row.original.portfolioShare.toFixed(1)}%
              </span>
            </div>
            <Progress value={row.original.portfolioShare} className="h-1.5" />
          </div>
        ),
      },
      {
        accessorKey: 'performance',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Performance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const perf = row.original.performance;
          const isPositive = perf >= 0;
          return (
            <div
              className={`flex items-center gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {isPositive ? '+' : ''}
                {perf.toFixed(1)}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'savingsPlan',
        header: 'Sparplan',
        cell: ({ row }) => {
          const plan = row.original.savingsPlan;
          return plan ? (
            <div className="text-sm">
              <div className="font-medium">
                {formatCurrency(plan.toString(), 'EUR')}
              </div>
              <div className="text-xs text-muted-foreground">pro Monat</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'fsaAllocated',
        header: 'FSA zugeteilt',
        cell: ({ row }) => {
          const allocated = row.original.fsaAllocated;
          return allocated > 0 ? (
            <div className="text-sm font-medium">
              {formatCurrency(allocated.toString(), 'EUR')}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'fsaUsedYtd',
        header: 'FSA genutzt (YTD)',
        cell: ({ row }) => {
          const used = row.original.fsaUsedYtd;
          const allocated = row.original.fsaAllocated;
          if (allocated === 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          const percentage = (used / allocated) * 100;
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {formatCurrency(used.toString(), 'EUR')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Aktionen',
        cell: () => (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    []
  );

  // Filter data
  const filteredData = useMemo(() => {
    let data = DUMMY_HOLDINGS;

    if (typeFilter !== 'all') {
      data = data.filter((h) => h.type === typeFilter);
    }

    if (institutionFilter !== 'all') {
      data = data.filter((h) => h.institution === institutionFilter);
    }

    return data;
  }, [typeFilter, institutionFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Get unique institutions
  const institutions = useMemo(
    () => Array.from(new Set(DUMMY_HOLDINGS.map((h) => h.institution))),
    []
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtvermögen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue.toString(), 'EUR')}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`font-medium ${
                  avgPerformance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {avgPerformance >= 0 ? '+' : ''}
                {avgPerformance.toFixed(1)}% YTD
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FSA Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFsaUsed.toString(), 'EUR')}
            </div>
            <p className="text-xs text-muted-foreground">
              von {formatCurrency(totalFsaAllocated.toString(), 'EUR')} zugeteilt
            </p>
            <Progress
              value={(totalFsaUsed / totalFsaAllocated) * 100}
              className="mt-2 h-1.5"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko-Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRiskScore.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              {avgRiskScore <= 2
                ? 'Konservativ'
                : avgRiskScore <= 3.5
                ? 'Moderat'
                : 'Aggressiv'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monatl. Sparrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSavingsPlan.toString(), 'EUR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {DUMMY_HOLDINGS.filter((h) => h.savingsPlan).length} aktive Sparpläne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Nach Name suchen..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn('name')?.setFilterValue(event.target.value)
                }
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="account">Nur Accounts</SelectItem>
                <SelectItem value="asset">Nur Assets</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={institutionFilter}
              onValueChange={setInstitutionFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Institutionen</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Keine Einträge gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} Einträge
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Zurück
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Weiter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
