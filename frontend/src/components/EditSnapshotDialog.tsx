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
import { Pencil } from 'lucide-react';

interface EditSnapshotDialogProps {
  snapshot: CombinedSnapshot;
  onSuccess?: () => void;
}

export function EditSnapshotDialog({ snapshot, onSuccess }: EditSnapshotDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    snapshot_date: snapshot.snapshot_date,
    value: snapshot.value || '',
    quantity: snapshot.quantity || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = `asset_snapshots/${snapshot.id}`;

      const payload = {
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
            <DialogTitle>{t('snapshots.editSnapshot') || 'Edit Snapshot'}</DialogTitle>
            <DialogDescription>
              {t('common.save')} - {snapshot.entity_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">{t('common.date')} *</Label>
              <Input
                id="date"
                type="date"
                value={formData.snapshot_date}
                onChange={(e) => setFormData({ ...formData, snapshot_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">{t('common.value')} *</Label>
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
              <Label htmlFor="quantity">{t('common.quantity')} ({t('common.optional')})</Label>
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
            <Button type="submit" disabled={loading || !formData.value}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

