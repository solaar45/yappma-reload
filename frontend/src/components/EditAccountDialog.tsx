import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { useInstitutions } from '@/lib/api/hooks';
import { apiClient } from '@/lib/api/client';
import type { Account } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Pencil, AlertCircle } from 'lucide-react';

import InstitutionLogo from '@/components/InstitutionLogo';

interface EditAccountDialogProps {
  account: Account;
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
] as const;

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
] as const;

export function EditAccountDialog({ account, onSuccess }: EditAccountDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { institutions, loading: institutionsLoading } = useInstitutions({ userId: userId! });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // If the account name is "-", treat it as empty for the input field
  const [name, setName] = useState(account.name === '-' ? '' : account.name);
  
  const [type, setType] = useState(account.type);
  const [currency, setCurrency] = useState(account.currency);
  const [institutionId, setInstitutionId] = useState(account.institution_id?.toString() || '');
  const [isActive, setIsActive] = useState(account.is_active ?? true);

  // Reset form when dialog opens or account changes
  useEffect(() => {
    if (open) {
      setName(account.name === '-' ? '' : account.name);
      setType(account.type);
      setCurrency(account.currency);
      setInstitutionId(account.institution_id?.toString() || '');
      setIsActive(account.is_active ?? true);
    }
  }, [open, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionId) {
      return;
    }
    
    // Send "-" if empty to pass validation
    const nameToSend = name.trim() || "-";

    setLoading(true);

    try {
      await apiClient.put(`/accounts/${account.id}`, {
        account: {
          name: nameToSend,
          type,
          currency,
          institution_id: parseInt(institutionId),
          is_active: isActive,
          user_id: userId,
        },
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('accounts.editAccount')}</DialogTitle>
            <DialogDescription>
              {t('accounts.editAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Institution Selection */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="institution" required>{t('accounts.institution')}</Label>
              </div>
              {institutionsLoading ? (
                <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
                  <span className="text-sm text-muted-foreground">{t('accounts.loadingInstitutions')}</span>
                </div>
              ) : institutions && institutions.length > 0 ? (
                <Select value={institutionId} onValueChange={setInstitutionId}>
                  <SelectTrigger id="institution">
                    <SelectValue placeholder={t('accounts.selectInstitution')} />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        <div className="flex items-center gap-2">
                          <InstitutionLogo name={inst.name} domain={inst.website ? inst.website.replace(/^https?:\/\//, '') : undefined} size="small" className="flex-shrink-0 rounded-full" />
                          <div className="flex flex-col">
                            <span>{inst.name}</span>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {inst.type ? t(`institutions.types.${inst.type}`, { defaultValue: inst.type }) : inst.category}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('accounts.noInstitutionsFound')}
                  </span>
                </div>
              )}
            </div>

            {/* Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="type" required>{t('accounts.accountType')}</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as any)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <AccountTypeLabel type={t.value} label={t.label} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Selection */}
            <div className="grid gap-2">
              <Label htmlFor="currency" required>{t('common.currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
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

            {/* Status Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base">
                  {t('accounts.status')}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {isActive ? t('accounts.active') : t('accounts.inactive')}
                </div>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Name Input (Optional, moved to bottom) */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('accounts.accountName')}
                <span className="text-muted-foreground font-normal ml-1">({t('common.optional') || 'optional'})</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
              />
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !institutionId || institutions?.length === 0}
            >
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to translate account types inside the SelectItem
function AccountTypeLabel({ type, label }: { type: string, label: string }) {
  const { t } = useTranslation();
  return <>{t(`accountTypes.${type}`, { defaultValue: label })}</>;
}
