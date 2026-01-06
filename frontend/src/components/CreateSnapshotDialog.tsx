import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { useAssets } from '@/lib/api/hooks';
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
  const { assets } = useAssets({ userId: userId! });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    entity_id: '',
    snapshot_date: new Date().toISOString().split('T')[0],
    value: '',
    quantity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entity_id || !formData.value) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = '/asset_snapshots';
      const payload = {
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
        quantity: '',
      });
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

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
              {t('snapshots.addFirst') || 'Record a value at a specific point in time.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="entity">
                {t('common.asset')} *
              </Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
              >
                <SelectTrigger id="entity">
                  <SelectValue placeholder={`${t('common.search')}...`} />
                </SelectTrigger>
                <SelectContent>
                  {assets?.map((entity) => (
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
                {t('common.value')} *
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

