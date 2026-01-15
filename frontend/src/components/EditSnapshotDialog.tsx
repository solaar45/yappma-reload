import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api/client';
import type { CombinedSnapshot } from '@/lib/api/hooks/useSnapshots';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';

interface EditSnapshotDialogProps {
  snapshot: CombinedSnapshot;
  onSuccess?: () => void;
}

export function EditSnapshotDialog({ snapshot, onSuccess }: EditSnapshotDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAccount = snapshot.snapshot_type === 'account';
  const initialValue = isAccount
    ? (snapshot as any).balance
    : (snapshot as any).value;
  const initialCurrency = isAccount ? (snapshot as any).currency : 'EUR';
  const initialQuantity = !isAccount ? (snapshot as any).quantity || '' : '';

  const [formData, setFormData] = useState({
    snapshot_date: snapshot.snapshot_date,
    value: initialValue,
    currency: initialCurrency,
    quantity: initialQuantity,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSecurity = !isAccount && (snapshot as any).entity_subtype === 'security';

    if (!isSecurity && !formData.value) return;
    if (isSecurity && !formData.quantity) return;

    setLoading(true);

    try {
      const endpoint = isAccount
        ? `/snapshots/accounts/${snapshot.id}`
        : `/snapshots/assets/${snapshot.id}`;

      const payload = isAccount
        ? {
          balance: formData.value,
          currency: formData.currency,
          snapshot_date: formData.snapshot_date,
        }
        : {
          value: formData.value,
          quantity: formData.quantity || undefined,
          snapshot_date: formData.snapshot_date,
        };

      await apiClient.put(endpoint, payload);

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSecurity = !isAccount && (snapshot as any).entity_subtype === 'security';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          {/* Header section... */}
          <DialogHeader>
            <DialogTitle>{t('snapshots.editSnapshot')}</DialogTitle>
            <DialogDescription>
              {(() => {
                let displayName = snapshot.entity_name;
                if (!displayName || displayName === '-') {
                  const subtype = (snapshot as any).entity_subtype;
                  if (snapshot.snapshot_type === 'account') {
                    displayName = subtype
                      ? t(`accountTypes.${subtype}`, { defaultValue: t('common.account') })
                      : t('common.account');
                  } else {
                    displayName = subtype
                      ? t(`assetTypes.${subtype}`, { defaultValue: t('common.asset') })
                      : t('common.asset');
                  }
                }
                return t('snapshots.editSnapshotDescription', { entityName: displayName });
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" required>{t('common.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.snapshot_date}
                onChange={(e) => setFormData({ ...formData, snapshot_date: e.target.value })}
                required
              />
            </div>

            {(isAccount || !isSecurity) && (
              <div className="grid gap-2">
                <Label htmlFor="value" required>
                  {isAccount ? t('common.balance') : t('common.value')}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required={isAccount || !isSecurity}
                />
              </div>
            )}

            {isAccount && (
              <div className="grid gap-2">
                <Label htmlFor="currency" required>{t('common.currency')}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isAccount && (
              <div className="grid gap-2">
                <Label htmlFor="quantity">{t('snapshots.quantityOptional')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  placeholder={t('snapshots.quantityPlaceholder')}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !formData.value}>
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
