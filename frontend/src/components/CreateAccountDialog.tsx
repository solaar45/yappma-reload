import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateAccount, useInstitutions } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import InstitutionLogo from '@/components/InstitutionLogo';

interface CreateAccountDialogProps {
  onSuccess?: () => void;
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
] as const;

export function CreateAccountDialog({ onSuccess }: CreateAccountDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { institutions, loading: institutionsLoading } = useInstitutions({ userId: userId! });
  const { createAccount, loading, error } = useCreateAccount();
  const [open, setOpen] = useState(false);
  const [institutionOpen, setInstitutionOpen] = useState(false);
  const [showCustomInstitution, setShowCustomInstitution] = useState(false);

  // Account types (use plain labels as fallback)
  const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'brokerage', label: 'Brokerage' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ] as const;

  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currency: 'EUR',
    institution_id: '',
    custom_institution_name: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!showCustomInstitution && !formData.institution_id) return;
    if (showCustomInstitution && !formData.custom_institution_name) return;

    const result = await createAccount({
      user_id: userId,
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      institution_id: !showCustomInstitution ? parseInt(formData.institution_id) : undefined,
      custom_institution_name: showCustomInstitution ? formData.custom_institution_name : undefined,
      is_active: formData.is_active,
    });

    if (result) {
      setOpen(false);
      setFormData({
        name: '',
        type: 'checking',
        currency: 'EUR',
        institution_id: '',
        custom_institution_name: '',
        is_active: true,
      });
      setShowCustomInstitution(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('accounts.createAccount') || 'Add Account'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('accounts.createAccount') || 'Create New Account'}</DialogTitle>
            <DialogDescription>
              {t('accounts.addFirstDescription') || 'Add a new account to track your finances.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" required>{t('accounts.name') || 'Account Name'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution" required>{t('accounts.institution') || 'Institution'}</Label>
              <Popover open={institutionOpen} onOpenChange={setInstitutionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={institutionOpen}
                    className="w-full justify-between font-normal"
                    disabled={institutionsLoading}
                  >
                    {formData.institution_id
                      ? institutions?.find((inst) => inst.id.toString() === formData.institution_id)?.name
                      : institutionsLoading ? t('common.loading') : t('institutions.searchPlaceholder') || "Select institution..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('institutions.searchPlaceholder') || "Search bank or broker..."} />
                    <CommandList>
                      <CommandEmpty>{t('institutions.noInstitutions') || "No institution found."}</CommandEmpty>
                      <CommandGroup>
                        {institutions?.map((inst) => (
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
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {inst.type ? t(`institutions.types.${inst.type}`) : inst.category}
                                </span>
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
              <Label htmlFor="type" required>{t('accounts.type') || 'Account Type'}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(`accountTypes.${opt.value}`, { defaultValue: opt.label })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency" required>{t('common.currency') || 'Currency'}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base">
                  {t('accounts.status') || 'Account Status'}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.is_active ? (t('accounts.active') || 'Active') : (t('accounts.inactive') || 'Inactive')}
                </div>
              </div>
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error.message}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || (!showCustomInstitution && !formData.institution_id) || (showCustomInstitution && !formData.custom_institution_name)}
            >
              {loading ? (t('common.loading') || 'Creating...') : (t('common.create') || 'Create Account')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
