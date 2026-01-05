import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, AlertTriangle, PiggyBank, Save, Check } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import {
    useTaxExemptions,
    useUpdateUser,
    useDeleteTaxExemption
} from '@/lib/api/hooks';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TaxExemptionDialog } from '@/components/TaxExemptionDialog';
import type { TaxExemption } from '@/lib/api/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Fixed tax allowance limits based on tax status
const TAX_LIMITS = {
    single: 1000,
    married: 2000
} as const;

export default function TaxesPage() {
    const { t } = useTranslation();
    const { user, userId, setUser } = useUser();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { taxExemptions, loading, refetch } = useTaxExemptions({
        userId: userId!,
        year: selectedYear
    });

    const { updateUser, loading: settingsLoading } = useUpdateUser();
    const { deleteTaxExemption } = useDeleteTaxExemption();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExemption, setEditingExemption] = useState<TaxExemption | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [taxStatus, setTaxStatus] = useState<'single' | 'married'>(user?.tax_status || 'single');

    // Keep tax status in sync with user state
    useEffect(() => {
        if (user) {
            setTaxStatus(user.tax_status);
        }
    }, [user]);

    // Compute limit automatically based on status
    const computedLimit = TAX_LIMITS[taxStatus];

    const totalExemptions = useMemo(() => {
        return taxExemptions.reduce((sum, te) => sum + parseFloat(te.amount), 0);
    }, [taxExemptions]);

    const limit = user?.tax_allowance_limit || 1000;
    const usagePercent = Math.min((totalExemptions / limit) * 100, 100);
    const isOverLimit = totalExemptions > limit;

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        const yearsList = [];
        for (let y = current + 1; y >= 2020; y--) {
            yearsList.push(y);
        }
        return yearsList;
    }, []);

    const handleUpdateStatus = async () => {
        if (!userId) {
            logger.error('No userId found in handleUpdateStatus');
            return;
        }

        setSaveSuccess(false);
        setSaveError(null);

        logger.info('Updating user tax status', { userId, tax_status: taxStatus, computed_limit: computedLimit });

        // Send only tax_status; backend will set the limit automatically
        const updatedUser = await updateUser(userId, {
            tax_status: taxStatus,
            tax_allowance_limit: computedLimit // Send computed limit to backend
        });

        if (updatedUser) {
            logger.info('User tax status updated successfully', { updatedUser });
            setUser(updatedUser);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            logger.error('Failed to update user tax status');
            setSaveError('Konnte Status nicht speichern.');
        }
    };

    const handleDelete = async () => {
        if (deletingId) {
            const success = await deleteTaxExemption(deletingId);
            if (success) {
                refetch();
                setDeleteConfirmOpen(false);
            }
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('taxes.title')}</h1>
                    <p className="text-muted-foreground">{t('taxes.taxAllowance')} & {t('taxes.exemptionOrders')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={selectedYear < new Date().getFullYear() ? "cursor-not-allowed" : ""}>
                                    <Button
                                        disabled={selectedYear < new Date().getFullYear()}
                                        onClick={() => {
                                            setEditingExemption(null);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('taxes.addExemption')}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {selectedYear < new Date().getFullYear() && (
                                <TooltipContent>
                                    <p>{t('taxes.tooltipDisabledAddOrder')}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="h-5 w-5 text-primary" />
                            {t('taxes.taxAllowance')} ({selectedYear})
                        </CardTitle>
                        <CardDescription>
                            {user?.tax_status === 'married' ? t('taxes.married') : t('taxes.single')} · {formatCurrency(limit)} {t('taxes.totalLimit')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('taxes.usedAmount')}</span>
                                <span className={isOverLimit ? "text-destructive font-bold" : "font-medium"}>
                                    {formatCurrency(totalExemptions)}
                                </span>
                            </div>
                            <Progress value={usagePercent} className={isOverLimit ? "[&>div]:bg-destructive" : ""} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span>{formatCurrency(limit)} (100%)</span>
                            </div>
                        </div>

                        {isOverLimit && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <p>{t('taxes.warningOverLimit', { total: formatCurrency(totalExemptions), limit: formatCurrency(limit) })}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <div className="flex justify-between text-sm italic">
                                <span className="text-muted-foreground">{t('taxes.remainingAmount')}</span>
                                <span className="font-medium text-success">
                                    {formatCurrency(Math.max(0, limit - totalExemptions))}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('navigation.settings')}</CardTitle>
                        <CardDescription>Passen Sie Ihren Steuerstatus an. Das Limit wird automatisch gesetzt.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('taxes.status')}</label>
                                <Select
                                    value={taxStatus}
                                    onValueChange={(v: 'single' | 'married') => setTaxStatus(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">{t('taxes.single')}</SelectItem>
                                        <SelectItem value="married">{t('taxes.married')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('taxes.totalLimit')}</label>
                                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                                    <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                                        {formatCurrency(computedLimit)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Automatisch basierend auf Status
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={handleUpdateStatus}
                                disabled={settingsLoading}
                                className={cn(
                                    "w-full transition-colors",
                                    saveSuccess && "bg-success hover:bg-success text-white"
                                )}
                                variant={saveError ? "destructive" : "default"}
                            >
                                {saveSuccess ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Gespeichert
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Update Status
                                    </>
                                )}
                            </Button>
                            {saveError && (
                                <p className="text-xs text-destructive text-center mt-1">{saveError}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('taxes.exemptionOrders')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('taxes.institution')}</TableHead>
                                <TableHead className="text-right">{t('taxes.amount')}</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        {t('common.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : taxExemptions.length > 0 ? (
                                taxExemptions.map((te) => (
                                    <TableRow key={te.id}>
                                        <TableCell className="font-medium">
                                            {te.institution?.name || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(te.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    disabled={selectedYear < new Date().getFullYear()}
                                                    onClick={() => {
                                                        setEditingExemption(te);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    disabled={selectedYear < new Date().getFullYear()}
                                                    onClick={() => {
                                                        setDeletingId(te.id);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        {t('taxes.noExemptions')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <TaxExemptionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                taxExemption={editingExemption}
                year={selectedYear}
                onSuccess={refetch}
            />

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('taxes.deleteExemption')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie diesen Freistellungsauftrag wirklich löschen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
