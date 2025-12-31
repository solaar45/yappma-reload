import { useState, useEffect } from 'react';
import { useCreateAsset } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
import type { AssetType } from '@/lib/api/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateAssetDialogProps {
  onSuccess?: () => void;
}

export function CreateAssetDialog({ onSuccess }: CreateAssetDialogProps) {
  const { userId } = useUser();
  const { createAsset, loading, error } = useCreateAsset();
  const [open, setOpen] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    asset_type_id: '',
    isin: '',
    ticker: '',
    currency: 'EUR',
  });

  useEffect(() => {
    const fetchAssetTypes = async () => {
      setLoadingTypes(true);
      try {
        const types = await apiClient.get<AssetType[]>('/asset_types');
        setAssetTypes(types);
        // Set default to 'security' if available
        const securityType = types.find((t) => t.code === 'security');
        if (securityType) {
          setFormData((prev) => ({ ...prev, asset_type_id: securityType.id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load asset types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };

    if (open) {
      fetchAssetTypes();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formData.asset_type_id) return;

    const result = await createAsset({
      user_id: userId,
      asset_type_id: parseInt(formData.asset_type_id),
      name: formData.name,
      currency: formData.currency,
      security_asset:
        formData.isin || formData.ticker
          ? {
              isin: formData.isin || undefined,
              ticker: formData.ticker || undefined,
            }
          : undefined,
    });

    if (result) {
      setOpen(false);
      setFormData({ name: '', asset_type_id: '', isin: '', ticker: '', currency: 'EUR' });
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to track your investments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Apple Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset_type">Asset Type *</Label>
              <Select
                value={formData.asset_type_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, asset_type_id: value })
                }
                disabled={loadingTypes}
              >
                <SelectTrigger id="asset_type">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.description || type.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticker">Ticker Symbol (optional)</Label>
              <Input
                id="ticker"
                placeholder="e.g., AAPL"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="isin">ISIN (optional)</Label>
              <Input
                id="isin"
                placeholder="e.g., US0378331005"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency *</Label>
              <Input
                id="currency"
                placeholder="EUR"
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
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.asset_type_id}
            >
              {loading ? 'Creating...' : 'Create Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
