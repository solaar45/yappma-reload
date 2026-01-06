import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useCreateTaxExemption,
    useUpdateTaxExemption,
    useAccounts
} from '@/lib/api/hooks';
import type { TaxExemption } from '@/lib/api/types';
import { useUser } from '@/contexts/UserContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import InstitutionLogo from '@/components/InstitutionLogo';
import { cn } from '@/lib/utils';

interface TaxExemptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taxExemption?: TaxExemption | null;
    year: number;
    onSuccess: () => void;
}

export function TaxExemptionDialog({
    open,
    onOpenChange,
    taxExemption,
    year,
    onSuccess
}: TaxExemptionDialogProps) {
    const { t } = useTranslation();
    const { userId } = useUser();
    const { accounts, isLoading: accountsLoading } = useAccounts({ userId: userId! });
    const { createTaxExemption, loading: creating, error: createError } = useCreateTaxExemption();
    const { updateTaxExemption, loading: updating, error: updateError } = useUpdateTaxExemption();
    const [localError, setLocalError] = useState<string | null>(null);

    const filteredInstitutions = useMemo(() => {
        if (!accounts) return [];
        const seen = new Set<number>();
        return accounts
            .filter(acc => acc.institution && !seen.has(acc.institution.id) && seen.add(acc.institution.id))
            .map(acc => acc.institution!);
    }, [accounts]);

    const [institutionOpen, setInstitutionOpen] = useState(false);
    const [formData, setFormData] = useState({
        institution_id: '',
        amount: '',
    });

    useEffect(() => {
        if (taxExemption) {
            setFormData({
                institution_id: taxExemption.institution_id.toString(),
                amount: taxExemption.amount,
            });
        } else {
            setFormData({
                institution_id: '',
                amount: '',
            });
        }
        setLocalError(null);
    }, [taxExemption, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !formData.institution_id || !formData.amount) return;

        setLocalError(null);
        const data = {
            user_id: userId,
            institution_id: parseInt(formData.institution_id),
            amount: parseFloat(formData.amount),
            year: year,
        };

        try {
            let result;
            if (taxExemption) {
                result = await updateTaxExemption(taxExemption.id, data);
            } else {
                result = await createTaxExemption(data);
            }

            if (result) {
                onSuccess();
                onOpenChange(false);
            } else {
                // If result is null, it means the hook caught an error
                // We'll handle it below if it's an ApiError
            }
        } catch (err: any) {
            // The hooks currently catch errors and return null
            // So we might need to check the 'error' from the hook
        }
    };


    // Listen to error changes from hooks
    useEffect(() => {
        const error = (taxExemption ? updateError : createError) as any;
        if (error) {
            if (error.status === 422 && error.data?.errors) {
                const errors = error.data.errors;
                if (errors.user_id?.includes('has already been taken') ||
                    errors.institution_id?.includes('has already been taken')) {
                    setLocalError(t('taxes.errorDuplicateExemption'));
                } else {
                    setLocalError(t('common.error'));
                }
            } else {
                setLocalError(error.message || t('common.error'));
            }
        }
    }, [createError, updateError, taxExemption, t]);

    const loading = creating || updating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {taxExemption ? t('taxes.editExemption') : t('taxes.addExemption')}
                        </DialogTitle>
                        <DialogDescription>
                            {taxExemption ? 'Passen Sie diesen Freistellungsauftrag an.' : 'Hinterlegen Sie einen neuen Freistellungsauftrag.'}
                        </DialogDescription>
                    </DialogHeader>

                    {localError && (
                        <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-destructive flex items-center justify-center shrink-0">
                                <span className="text-[10px] text-white">!</span>
                            </div>
                            {localError}
                        </div>
                    )}
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="institution">{t('taxes.institution')} *</Label>
                            <Popover open={institutionOpen} onOpenChange={setInstitutionOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={institutionOpen}
                                        className="w-full justify-between font-normal"
                                        disabled={accountsLoading || !!taxExemption}
                                    >
                                        {formData.institution_id
                                            ? filteredInstitutions.find((inst: any) => inst.id.toString() === formData.institution_id)?.name
                                            : accountsLoading ? t('common.loading') : t('common.search')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder={t('common.search')} />
                                        <CommandList>
                                            <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                                            <CommandGroup>
                                                {filteredInstitutions.map((inst: any) => (
                                                    <CommandItem
                                                        key={inst.id}
                                                        value={inst.name}
                                                        onSelect={() => {
                                                            setFormData({ ...formData, institution_id: inst.id.toString() });
                                                            setInstitutionOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.institution_id === inst.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <InstitutionLogo name={inst.name} domain={inst.website ? inst.website.replace(/^https?:\/\//, '') : undefined} size="small" className="flex-shrink-0 rounded-full" />
                                                            <div className="flex flex-col">
                                                                <span>{inst.name}</span>
                                                                <span className="text-[10px] text-muted-foreground capitalize">{inst.type || inst.category}</span>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">{t('taxes.amount')} (€) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2 text-xs text-muted-foreground">
                            {t('taxes.year')}: {year}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.institution_id || !formData.amount}
                        >
                            {loading ? t('common.loading') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
