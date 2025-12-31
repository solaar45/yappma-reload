import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
import type { Asset, AssetType } from '@/lib/api/types';
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
import { Select } from '@/components/ui/select';
import { Pencil } from 'lucide-react';

interface EditAssetDialogProps {
  asset: Asset;
  onSuccess?: () => void;
}

export function EditAssetDialog({ asset, onSuccess }: EditAssetDialogProps) {
  const { userId } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [formData, setFormData] = useState({
    name: asset.name,
    asset_type_id: asset.asset_type_id.toString(),
    isin: asset.security_asset?.isin || '',
    ticker: asset.security_asset?.ticker || '',
    currency: asset.currency,
  });

  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const types = await apiClient.get<AssetType[]>('/asset_types');
        setAssetTypes(types);
      } catch (err) {
        console.error('Failed to load asset types:', err);
      }
    };

    if (open) {
      fetchAssetTypes();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        name: formData.name,
        asset_type_id: parseInt(formData.asset_type_id),
        currency: formData.currency,
      };

      // Add symbol (ISIN) if available
      if (formData.isin) {
        updateData.symbol = formData.isin;
      }

      // Add security_asset data if it's a security type
      const selectedType = assetTypes.find((t) => t.id === parseInt(formData.asset_type_id));
      if (selectedType?.code === 'security' && (formData.isin || formData.ticker)) {
        updateData.security_asset = {
          isin: formData.isin || undefined,
          ticker: formData.ticker || undefined,
        };
      }

      await apiClient.put(`/assets/${asset.id}`, { asset: updateData });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Make changes to your asset. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Asset Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-type">Asset Type *</Label>
              <Select
                id="edit-asset-type"
                value={formData.asset_type_id}
                onChange={(e) => setFormData({ ...formData, asset_type_id: e.target.value })}
                required
              >
                <option value="">Select asset type</option>
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.description || type.code}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ticker">Ticker Symbol</Label>
              <Input
                id="edit-ticker"
                placeholder="e.g., AAPL"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-isin">ISIN</Label>
              <Input
                id="edit-isin"
                placeholder="e.g., US0378331005"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-currency">Currency *</Label>
              <Input
                id="edit-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
