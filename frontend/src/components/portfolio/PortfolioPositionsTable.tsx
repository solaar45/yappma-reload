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
  type ExpandedState,
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
  fsaGlobalLimit: number;
}

const columnHelper = createColumnHelper<PortfolioPosition>();

interface PortfolioPositionsTableProps {
  positions: PortfolioPosition[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

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

// Helper to determine if an institution string is "valid" (not a placeholder)
function isValidInstitution(inst: string | undefined | null): boolean {
  if (!inst) return false;
  const clean = inst.trim();
  return clean.length > 0 && clean !== '-' && clean.toLowerCase() !== 'null';
}

export function PortfolioPositionsTable({ positions }: PortfolioPositionsTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [grouping, setGrouping] = useState<GroupingState>(['institution']);
  const [expanded, setExpanded] = useState<ExpandedState>(true); // Default all expanded

  // Filter out positions without institution for separate display
  // We treat "-", empty strings, or null as "no institution"
  const { groupedPositions, flatPositions } = useMemo(() => {
    const withInstitution = positions.filter(p => isValidInstitution(p.institution));
    const withoutInstitution = positions.filter(p => !isValidInstitution(p.institution));
    return { groupedPositions: withInstitution, flatPositions: withoutInstitution };
  }, [positions]);

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
             const domain = row.original.institutionDomain;
             
             return (
               <div className="flex items-center gap-2 font-semibold">
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
           // Use depth to detect if this is a child row within a group (depth > 0)
           // If so, render the tree connector in this column (aligned right)
           if (row.depth > 0) {
              return (
                <div className="flex justify-end w-full pr-1 h-full items-center">
                    <div className="w-4 border-l-2 border-b-2 h-4 border-muted-foreground/20 rounded-bl-sm -mt-4 translate-x-1"></div>
                </div>
              );
           }
           return null;
        },
      }),
      
      // Position Name
      columnHelper.accessor('name', {
        header: t('portfolio.position'),
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;

          const name = row.original.name;
          const subtype = row.original.subtype;
          const type = row.original.type;
          
          const displayName = (name === '-' || !name) && subtype
            ? t(`accountTypes.${subtype}`, { defaultValue: subtype })
            : name;
          
          return (
            <div className="flex items-center gap-2">
               {/* Indentation logic removed to ensure flush alignment with header */}
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
            if (row.getIsGrouped()) return null;
            return <RiskScoreVisual score={getValue()} />;
        }
      }),

      columnHelper.accessor('currentValue', {
        header: ({ column }) => (
          <div className="text-right w-full">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 data-[state=open]:bg-accent px-2"
            >
                {t('portfolio.marketValue')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row, getValue }) => {
          const value = row.getIsGrouped() 
             ? row.subRows.reduce((sum, r) => sum + r.original.currentValue, 0)
             : getValue();
          
          return (
            <div className={`text-right font-mono pr-4 ${row.getIsGrouped() ? 'font-bold' : ''}`}>
               {formatValue(value)}
            </div>
          );
        },
        aggregationFn: 'sum',
      }),

      columnHelper.accessor('portfolioShare', {
        header: ({ column }) => (
          <div className="text-right w-full">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 data-[state=open]:bg-accent px-2"
            >
                {t('portfolio.share')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row, getValue }) => {
           const value = row.getIsGrouped()
             ? row.subRows.reduce((sum, r) => sum + r.original.portfolioShare, 0)
             : getValue();
             
           return (
            <div className="space-y-1 w-24 ml-auto pr-4">
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
        header: ({ column }) => (
          <div className="text-right w-full">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 data-[state=open]:bg-accent px-2"
            >
                {t('portfolio.performance')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;

          const value = row.original.performance;
          const isPositive = value >= 0;
          return (
            <div className="flex items-center justify-end pr-4">
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

      columnHelper.accessor('fsaAllocated', {
        id: 'fsa',
        header: ({ column }) => (
          <div className="text-right w-full">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 data-[state=open]:bg-accent px-2"
            >
                {t('portfolio.fsa')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          if (row.getIsGrouped()) {
              const representativeItem = row.leafRows.find(r => r.original.fsaAllocated > 0)?.original;
              
              if (!representativeItem) return <div className="pr-4"><span className="text-muted-foreground text-xs block text-right">-</span></div>;
              
              const allocated = representativeItem.fsaAllocated;
              const globalLimit = representativeItem.fsaGlobalLimit || 1000;
              const percentage = globalLimit > 0 ? (allocated / globalLimit) * 100 : 0;
              
              return (
                <div className="space-y-1 w-32 ml-auto pr-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{formatCurrency(allocated)}</span>
                    <span className="text-muted-foreground text-[10px]">{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
          }
          if (!isValidInstitution(row.original.institution)) {
             return <div className="pr-4"><span className="text-muted-foreground/30 text-xs block text-right">—</span></div>;
          }
          return null; 
        },
      }),
    ],
    [t]
  );

  // Table instance for GROUPED data
  const groupedTable = useReactTable({
    data: groupedPositions,
    columns,
    state: {
      sorting,
      columnFilters,
      grouping, // Enable grouping only here
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

  // Table instance for FLAT data (no grouping needed)
  const flatTable = useReactTable({
    data: flatPositions,
    columns,
    state: {
      sorting,
      columnFilters,
      grouping: [], // No grouping for flat table
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
          {groupedTable.getHeaderGroups().map((headerGroup) => (
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
          {/* 1. Grouped Positions (Institutions) */}
          {groupedTable.getRowModel().rows.map((row) => (
            <TableRow 
              key={row.id} 
              className={row.getIsGrouped() ? "bg-muted/30 hover:bg-muted/50 cursor-pointer" : ""}
              onClick={row.getIsGrouped() ? row.getToggleExpandedHandler() : undefined}
            >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
            </TableRow>
          ))}

          {/* 2. Separator if we have both types */}
          {groupedPositions.length > 0 && flatPositions.length > 0 && (
             <TableRow className="hover:bg-transparent">
               <TableCell colSpan={columns.length} className="bg-muted/5 p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-4 border-y">
                 {t('assetTypes.other', { defaultValue: 'Other' })} / {t('common.assets', { defaultValue: 'Assets' })}
               </TableCell>
             </TableRow>
          )}

          {/* 3. Flat Positions (No Institution) */}
          {flatTable.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
            </TableRow>
          ))}

          {/* Empty State */}
          {positions.length === 0 && (
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
