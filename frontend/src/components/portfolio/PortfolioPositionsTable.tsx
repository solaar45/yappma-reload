import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type GroupingState,
  type AggregationFn,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit, FileText, Camera, MoreVertical, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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
  type: string;
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
  fsaGlobalLimit: number; // e.g. 1000 or 2000
}

const columnHelper = createColumnHelper<PortfolioPosition>();

interface PortfolioPositionsTableProps {
  positions: PortfolioPosition[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0, // No cents for FSA usually
    maximumFractionDigits: 0,
  }).format(value);
}

// Separate formatter for regular values with cents
function formatValue(value: number): string {
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
  // Group by institution by default
  const [grouping, setGrouping] = useState<GroupingState>(['institution']);
  const [expanded, setExpanded] = useState({});

  const columns = useMemo(
    () => [
      // Institution Group Column
      columnHelper.accessor('institution', {
        id: 'institution',
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
        cell: ({ row, getValue }) => {
           if (row.getIsGrouped()) {
             const institutionName = getValue();
             const domain = row.original.institutionDomain; // Note: row.original refers to first row in group
             
             return (
               <div className="flex items-center gap-2 font-semibold cursor-pointer" onClick={row.getToggleExpandedHandler()}>
                 <span className="w-4 h-4 flex items-center justify-center">
                    {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                 </span>
                 <InstitutionLogo
                   name={institutionName}
                   domain={domain}
                   size="small"
                   className="flex-shrink-0 rounded-full"
                 />
                 <span>{institutionName}</span>
                 <Badge variant="outline" className="ml-2 text-xs font-normal">
                   {row.subRows.length} {row.subRows.length === 1 ? t('common.item') : t('common.items')}
                 </Badge>
               </div>
             );
           }
           return null; // Should not happen as this column is grouped
        },
      }),
      
      // Position Name (Account/Asset)
      columnHelper.accessor('name', {
        header: t('portfolio.position'),
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null; // Don't show in group row

          const name = row.original.name;
          const subtype = row.original.subtype;
          const type = row.original.type;
          
          const displayName = (name === '-' || !name) && subtype
            ? t(`accountTypes.${subtype}`, { defaultValue: subtype })
            : name;

          return (
            <div className="flex items-center gap-2 pl-8">
               {/* Indentation visual */}
               <div className="w-4 border-l-2 border-b-2 h-4 border-muted-foreground/20 rounded-bl-sm -mt-4 mr-2"></div>
               
               <div className="flex flex-col">
                 <span className="font-medium">{displayName}</span>
                 <span className="text-xs text-muted-foreground">{t(`portfolio.${type.toLowerCase()}`, {defaultValue: type})}</span>
               </div>
            </div>
          );
        },
      }),

      columnHelper.accessor('type', {
         header: t('portfolio.type'),
         cell: ({row, getValue}) => {
             if (row.getIsGrouped()) return null;
             return <Badge variant="secondary" className="text-xs">{getValue()}</Badge>
         }
      }),

      columnHelper.accessor('riskScore', {
        header: t('portfolio.risk'),
        cell: ({ row, getValue }) => {
            if (row.getIsGrouped()) return null; // Or aggregate risk?
            return <RiskScoreVisual score={getValue()} />;
        }
      }),

      columnHelper.accessor('currentValue', {
        header: ({ column }) => (
          <div className="text-right">
             {t('portfolio.marketValue')}
          </div>
        ),
        cell: ({ row, getValue }) => {
          const value = row.getIsGrouped() 
             ? row.subRows.reduce((sum, r) => sum + r.original.currentValue, 0)
             : getValue();
          
          return (
            <div className={`text-right font-mono ${row.getIsGrouped() ? 'font-bold' : ''}`}>
               {formatValue(value)}
            </div>
          );
        },
        aggregationFn: 'sum',
      }),

      columnHelper.accessor('portfolioShare', {
        header: t('portfolio.share'),
        cell: ({ row, getValue }) => {
           // For groups, we could sum shares too
           const value = row.getIsGrouped()
             ? row.subRows.reduce((sum, r) => sum + r.original.portfolioShare, 0)
             : getValue();
             
           return (
            <div className="space-y-1 w-24 ml-auto">
              <div className="flex items-center justify-end">
                <span className={`text-xs ${row.getIsGrouped() ? 'font-bold' : ''}`}>{value.toFixed(1)}%</span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          );
        },
        aggregationFn: 'sum',
      }),

      columnHelper.accessor('performance', {
        header: t('portfolio.performance'),
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null; // Hard to aggregate performance correctly without weighted avg

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

      // FSA Column - Only show on Group Level
      columnHelper.accessor('fsaAllocated', {
        id: 'fsa',
        header: t('portfolio.fsa'),
        cell: ({ row }) => {
          // Only show FSA in the group row (Institution)
          if (row.getIsGrouped()) {
              // Get the first item in the group that has an FSA allocated
              const representativeItem = row.leafRows.find(r => r.original.fsaAllocated > 0)?.original;
              
              if (!representativeItem) return <span className="text-muted-foreground text-xs block text-center">-</span>;
              
              const allocated = representativeItem.fsaAllocated;
              const globalLimit = representativeItem.fsaGlobalLimit || 1000;
              
              // Percentage of the global limit (e.g. 500/1000 = 50%)
              const percentage = globalLimit > 0 ? (allocated / globalLimit) * 100 : 0;
              
              return (
                <div className="space-y-1 w-32">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{formatCurrency(allocated)}</span>
                    <span className="text-muted-foreground text-[10px]">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
          }
          return null; 
        },
      }),

      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;
          
          return (
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
        )},
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
      grouping,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
            table.getRowModel().rows.map((row) => {
               // Only render Group rows or Expanded rows' children
               // Tanstack table flattened rows automatically handle this when using getExpandedRowModel
               return (
                  <TableRow key={row.id} className={row.getIsGrouped() ? "bg-muted/30 hover:bg-muted/50" : ""}>
                    {row.getVisibleCells().map((cell) => {
                      // Logic to merge cells for grouping row if needed, 
                      // but default flexRender handles grouping cell + placeholders usually.
                      // We defined custom cells that return null for grouped rows on non-group columns.
                      
                      return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )})}
                  </TableRow>
               )
            })
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
