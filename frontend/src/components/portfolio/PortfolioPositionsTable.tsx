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
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit, FileText, Camera, MoreVertical, Trash2 } from 'lucide-react';
import InstitutionLogo from '@/components/InstitutionLogo';
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
  type: 'Account';
  subtype?: string;
  name: string;
  institution: string;
  institutionDomain?: string;
  institutionLogo?: string;
  assetClass: string;
  riskScore: 1 | 2 | 3 | 4 | 5;
  currentValue: number;
  portfolioShare: number;
  performance: number;
  performanceHistory: number[];
  savingsPlan?: number;
  fsaAllocated: number;
  fsaTotal: number;
  fsaUsedYTD: number;
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
  const { t } = useTranslation();
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
            {t('portfolio.type')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: () => {
          return (
            <Badge variant="secondary" className="font-medium">
              {t('portfolio.account')}
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
            {t('portfolio.name')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const name = row.original.name;
          const subtype = row.original.subtype;
          const displayName = (name === '-' || !name) && subtype
            ? t(`accountTypes.${subtype}`, { defaultValue: subtype })
            : name;
          return <div className="font-medium">{displayName}</div>;
        },
      }),
      columnHelper.accessor('institution', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 h-8"
          >
            {t('portfolio.institution')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const institution = row.original.institution;

          return (
            <div className="flex items-center gap-2">
              <InstitutionLogo
                name={institution}
                domain={row.original.institutionDomain}
                size="small"
                className="flex-shrink-0 rounded-full"
              />
              <span className="text-sm font-medium">{institution}</span>
            </div>
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
            {t('portfolio.risk')}
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
            {t('portfolio.marketValue')}
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
            {t('portfolio.portfolioShare')}
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
            {t('portfolio.performance')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.original.performance;
          const isPositive = value >= 0;
          return (
            <div className="flex items-center justify-end">
              <span
                className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
            {t('portfolio.savingsPlan')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <div className="text-right font-mono text-sm">
              {formatCurrency(value)}/{t('portfolio.monthly')}
            </div>
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
            {t('portfolio.fsaAllocated')}
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
            {t('portfolio.fsaUsedYTD')}
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
        header: t('portfolio.actions'),
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
                <span>{t('portfolio.edit')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>{t('portfolio.details')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Camera className="mr-2 h-4 w-4" />
                <span>{t('portfolio.snapshot')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{t('portfolio.delete')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [t]
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
                {t('portfolio.noPositions')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
