import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { useAccounts, useAssets } from '@/lib/api/hooks';
import { apiClient } from '@/lib/api/client';
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
import { Plus } from 'lucide-react';

interface CreateSnapshotDialogProps {
  onSuccess?: () => void;
}

export function CreateSnapshotDialog({ onSuccess }: CreateSnapshotDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { accounts } = useAccounts({ userId: userId! });
  const { assets } = useAssets({ userId: userId! });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshotType, setSnapshotType] = useState<'account' | 'asset'>('account');
  const [formData, setFormData] = useState({
    entity_id: '',
    snapshot_date: new Date().toISOString().split('T')[0],
    value: '',
    currency: 'EUR',
    quantity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entity_id || !formData.value) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = snapshotType === 'account' 
        ? '/snapshots/accounts' 
        : '/snapshots/assets';

      const payload = snapshotType === 'account'
        ? {
            account_id: parseInt(formData.entity_id),
            balance: formData.value,
            currency: formData.currency,
            snapshot_date: formData.snapshot_date,
          }
        : {
            asset_id: parseInt(formData.entity_id),
            value: formData.value,
            quantity: formData.quantity || undefined,
            snapshot_date: formData.snapshot_date,
          };

      await apiClient.post(endpoint, payload);

      setOpen(false);
      setFormData({
        entity_id: '',
        snapshot_date: new Date().toISOString().split('T')[0],
        value: '',
        currency: 'EUR',
        quantity: '',
      });
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  const entities = snapshotType === 'account' ? accounts : assets;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('snapshots.createSnapshot') || 'Add Snapshot'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('snapshots.createSnapshot') || 'Create New Snapshot'}</DialogTitle>
            <DialogDescription>
              {t('snapshots.addFirst') || 'Record a balance or value at a specific point in time.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">{t('common.type') || 'Snapshot Type'} *</Label>
              <Select 
                value={snapshotType} 
                onValueChange={(value: 'account' | 'asset') => {
                  setSnapshotType(value);
                  setFormData({ ...formData, entity_id: '' });
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">{t('common.account') || 'Account'}</SelectItem>
                  <SelectItem value="asset">{t('common.asset') || 'Asset'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="entity">
                {snapshotType === 'account' ? t('common.account') : t('common.asset')} *
              </Label>
              <Select 
                value={formData.entity_id} 
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
              >
                <SelectTrigger id="entity">
                  <SelectValue placeholder={`${t('common.search')}...`} />
                </SelectTrigger>
                <SelectContent>
                  {entities?.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id.toString()}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">{t('common.date') || 'Date'} *</Label>
              <Input
                id="date"
                type="date"
                value={formData.snapshot_date}
                onChange={(e) => setFormData({ ...formData, snapshot_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">
                {snapshotType === 'account' ? t('accounts.balance') : t('common.value')} *
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>

            {snapshotType === 'account' && (
              <div className="grid gap-2">
                <Label htmlFor="currency">{t('common.currency') || 'Currency'} *</Label>
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

            {snapshotType === 'asset' && (
              <div className="grid gap-2">
                <Label htmlFor="quantity">{t('common.quantity') || 'Quantity'} ({t('common.optional')})</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  placeholder="e.g., number of shares"
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
            <Button type="submit" disabled={loading || !formData.entity_id || !formData.value}>
              {loading ? t('common.loading') : t('snapshots.createSnapshot')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
