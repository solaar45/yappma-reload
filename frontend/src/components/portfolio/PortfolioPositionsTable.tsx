import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit, FileText, Camera, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PortfolioPosition {
  id: string;
  type: 'Asset' | 'Account';
  name: string;
  institution: string;
  institutionLogo?: string;
  assetClass: 'Equity' | 'Bond' | 'Real Estate' | 'Cash' | 'Crypto';
  riskScore: 1 | 2 | 3 | 4 | 5;
  currentValue: number;
  portfolioShare: number; // percentage
  performance: number; // percentage
  performanceHistory: number[]; // for sparkline
  savingsPlan?: number; // monthly amount or null
  fsaAllocated: number;
  fsaTotal: number;
  fsaUsedYTD: number; // in euros
}

const columnHelper = createColumnHelper<PortfolioPosition>();

interface PortfolioPositionsTableProps {
  positions: PortfolioPosition[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

const assetClassColors: Record<string, string> = {
  Equity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Bond: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Real Estate': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Cash: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  Crypto: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function RiskScoreVisual({ score }: { score: number }) {
  const dots = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      {dots.map((dot) => {
        let color = 'bg-gray-300 dark:bg-gray-600';
        if (dot <= score) {
          if (score <= 2) color = 'bg-green-500';
          else if (score === 3) color = 'bg-yellow-500';
          else color = 'bg-red-500';
        }
        return <div key={dot} className={`h-2 w-2 rounded-full ${color}`} />;
      })}
    </div>
  );
}

function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 40;
      const y = 12 - ((value - min) / range) * 12;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="40" height="12" className="inline-block ml-2">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PortfolioPositionsTable({ positions }: PortfolioPositionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Typ
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const type = getValue();
          return (
            <Badge variant={type === 'Asset' ? 'default' : 'secondary'} className="font-medium">
              {type}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-medium">{getValue()}</div>,
      }),
      columnHelper.accessor('institution', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Institution
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
              {row.original.institution.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm">{row.original.institution}</span>
          </div>
        ),
      }),
      columnHelper.accessor('assetClass', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Asset-Klasse
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const assetClass = getValue();
          return (
            <Badge variant="outline" className={assetClassColors[assetClass]}>
              {assetClass}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('riskScore', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Risiko
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <RiskScoreVisual score={getValue()} />,
      }),
      columnHelper.accessor('currentValue', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Aktueller Wert
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-mono font-semibold">{formatCurrency(getValue())}</div>
        ),
      }),
      columnHelper.accessor('portfolioShare', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Anteil am Portfolio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{value.toFixed(1)}%</span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          );
        },
      }),
      columnHelper.accessor('performance', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Performance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.original.performance;
          const isPositive = value >= 0;
          return (
            <div className="flex items-center justify-end">
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercent(value)}
              </span>
              <Sparkline data={row.original.performanceHistory} isPositive={isPositive} />
            </div>
          );
        },
      }),
      columnHelper.accessor('savingsPlan', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            Sparplan
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <div className="text-right font-mono text-sm">{formatCurrency(value)}/Monat</div>
          ) : (
            <div className="text-center text-muted-foreground">-</div>
          );
        },
      }),
      columnHelper.accessor('fsaAllocated', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            FSA zugeteilt
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono font-medium">
            {formatCurrency(row.original.fsaAllocated)}
          </div>
        ),
      }),
      columnHelper.accessor('fsaUsedYTD', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            FSA genutzt (YTD)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const used = row.original.fsaUsedYTD;
          const allocated = row.original.fsaAllocated;
          const percentage = allocated > 0 ? (used / allocated) * 100 : 0;
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground font-mono">({formatCurrency(used)})</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aktionen',
        cell: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Camera className="mr-2 h-4 w-4" />
                <span>Snapshot</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: positions,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-12">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
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
                Keine Positionen gefunden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
