import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstitutions } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { CreateInstitutionDialog } from '@/components/CreateInstitutionDialog';
import { EditInstitutionDialog } from '@/components/EditInstitutionDialog';
import { DeleteInstitutionDialog } from '@/components/DeleteInstitutionDialog';
import { Building2, Landmark, XCircle, Trash2, Plus } from 'lucide-react';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import type { Institution } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';

export default function InstitutionsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { institutions, loading, error, refetch } = useInstitutions({ userId: userId!, key: refreshKey });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInstitutionChanged = () => {
    setRefreshKey((prev) => prev + 1);
    setRowSelection({});
  };

  const getTypeLabel = (type: string) => {
    return t(`institutions.types.${type}`);
  };

  // Get unique types and countries for filters
  const uniqueTypes = useMemo(() => {
    if (!institutions) return [];
    return Array.from(new Set(institutions.map((i) => i.type)));
  }, [institutions]);

  const uniqueCountries = useMemo(() => {
    if (!institutions) return [];
    return Array.from(new Set(institutions.map((i) => i.country))).sort();
  }, [institutions]);

  // Filter institutions
  const filteredInstitutions = useMemo(() => {
    if (!institutions) return [];

    return institutions.filter((institution) => {
      const matchesSearch =
        searchQuery === '' ||
        institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        institution.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || institution.type === typeFilter;
      const matchesCountry = countryFilter === 'all' || institution.country === countryFilter;

      return matchesSearch && matchesType && matchesCountry;
    });
  }, [institutions, searchQuery, typeFilter, countryFilter]);

  // Get selected institutions
  const selectedInstitutions = useMemo(() => {
    if (!filteredInstitutions) return [];
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => filteredInstitutions[parseInt(key)]);
  }, [rowSelection, filteredInstitutions]);

  const handleBatchDelete = async () => {
    if (!userId || selectedInstitutions.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedInstitutions.map((institution) =>
          apiClient.delete(`institutions/${institution.id}`)
        )
      );
      setShowDeleteDialog(false);
      handleInstitutionChanged();
    } catch (err) {
      console.error('Failed to delete institutions:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Institution>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('institutions.name')} />
      ),
      cell: ({ row }) => (
        <div className="font-semibold">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('institutions.type')} />
      ),
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const icons: Record<string, any> = {
          bank: Landmark,
          broker: Building2,
          insurance: Building2,
          other: Building2,
        };
        const Icon = icons[type] || Building2;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{getTypeLabel(type)}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'country',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('institutions.country')} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('country')}</Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <EditInstitutionDialog
            institution={row.original}
            onSuccess={handleInstitutionChanged}
          />
          <DeleteInstitutionDialog
            institution={row.original}
            onSuccess={handleInstitutionChanged}
          />
        </div>
      ),
      enableSorting: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse bg-muted rounded" />
          <div className="h-96 w-full animate-pulse bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('institutions.errorLoading')}</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                {t('common.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!institutions || institutions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
          <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Landmark className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('institutions.noInstitutions')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('institutions.addFirst')}
                </p>
              </div>
              <Button onClick={() => {}} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                {t('institutions.createInstitution')}
              </Button>
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
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {institutions.length} {t('institutions.title')}
          </Badge>
        </div>
        <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
      </div>

      {/* Data Table with Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder={t('institutions.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('institutions.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('institutions.allTypes')}</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('institutions.allCountries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('institutions.allCountries')}</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Actions Bar */}
            {selectedInstitutions.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedInstitutions.length}{' '}
                    {selectedInstitutions.length === 1
                      ? t('institutions.institutionSelected')
                      : t('institutions.institutionsSelected')}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('institutions.deleteSelected')}
                </Button>
              </div>
            )}
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={filteredInstitutions}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
      </Card>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('institutions.deleteSelectedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('institutions.deleteSelectedConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
