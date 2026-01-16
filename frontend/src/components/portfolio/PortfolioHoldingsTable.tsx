import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PortfolioHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

const columnHelper = createColumnHelper<PortfolioHolding>();

interface PortfolioHoldingsTableProps {
  holdings: PortfolioHolding[];
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
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function PortfolioHoldingsTable({ holdings }: PortfolioHoldingsTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('ticker', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.ticker')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-mono font-semibold text-foreground">{getValue()}</div>
        ),
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.name')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <div className="max-w-xs truncate">{getValue()}</div>,
      }),
      columnHelper.accessor('shares', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.shares')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-mono">{formatNumber(getValue())}</div>
        ),
      }),
      columnHelper.accessor('avgCost', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.avgCost')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-mono text-muted-foreground">
            {formatCurrency(getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('currentPrice', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.currentPrice')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-mono font-medium">{formatCurrency(getValue())}</div>
        ),
      }),
      columnHelper.accessor('marketValue', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.marketValue')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-right font-mono font-semibold">{formatCurrency(getValue())}</div>
        ),
      }),
      columnHelper.accessor('totalGainLoss', {
        id: 'totalGainLoss',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.totalGainLoss')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.original.totalGainLoss;
          const percent = row.original.totalGainLossPercent;
          const isPositive = value >= 0;
          return (
            <div className="text-right">
              <div
                className={`font-mono font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {formatCurrency(Math.abs(value))}
              </div>
              <div
                className={`text-xs font-mono ${isPositive ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600/70 dark:text-red-400/70'
                  }`}
              >
                {formatPercent(percent)}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('dayChange', {
        id: 'dayChange',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8 data-[state=open]:bg-accent"
          >
            {t('portfolio.dayChange')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.original.dayChange;
          const percent = row.original.dayChangePercent;
          const isPositive = value >= 0;
          return (
            <div className="text-right">
              <div
                className={`font-mono font-medium flex items-center justify-end gap-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {formatCurrency(Math.abs(value))}
              </div>
              <div
                className={`text-xs font-mono ${isPositive ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600/70 dark:text-red-400/70'
                  }`}
              >
                {formatPercent(percent)}
              </div>
            </div>
          );
        },
      }),
    ],
    [t]
  );

  const table = useReactTable({
    data: holdings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
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
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {t('portfolio.noHoldings')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
