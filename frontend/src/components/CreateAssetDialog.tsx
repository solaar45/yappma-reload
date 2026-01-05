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
import { Switch } from '@/components/ui/switch';
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
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    asset_type_id: '',
    institution_id: '',
    account_id: '',
    isin: '',
    ticker: '',
    currency: 'EUR',
    is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoadingTypes(true);
      setLoadingInstitutions(true);
      setLoadingAccounts(true);
      try {
        const [typesResponse, instResponse, accountsResponse] = await Promise.all([
          apiClient.get<{ data: AssetType[] }>('asset_types'),
          apiClient.get<{ data: any[] }>('institutions'),
          apiClient.get<{ data: any[] }>('accounts'),
        ]);

        // Handle both response formats
        const types = Array.isArray(typesResponse) ? typesResponse : (typesResponse.data || []);
        setAssetTypes(types);

        const insts = Array.isArray(instResponse) ? instResponse : (instResponse.data || []);
        setInstitutions(insts);

        const accs = Array.isArray(accountsResponse) ? accountsResponse : (accountsResponse.data || []);
        setAccountsList(accs);

        // Set default to 'security' if available
        const securityType = types.find((t) => t.code === 'security');
        if (securityType) {
          setFormData((prev) => ({ ...prev, asset_type_id: securityType.id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load form data:', err);
      } finally {
        setLoadingTypes(false);
        setLoadingInstitutions(false);
        setLoadingAccounts(false);
      }
    };

    if (open) {
      fetchData();
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
      is_active: formData.is_active,
      institution_id: !showAdvanced && formData.institution_id ? parseInt(formData.institution_id) : undefined,
      account_id: showAdvanced && formData.account_id ? parseInt(formData.account_id) : undefined,
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
      setFormData({
        name: '',
        asset_type_id: '',
        institution_id: '',
        account_id: '',
        isin: '',
        ticker: '',
        currency: 'EUR',
        is_active: true
      });
      setShowAdvanced(false);
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

            {!showAdvanced ? (
              <div className="grid gap-2">
                <Label htmlFor="institution">Institution *</Label>
                <Select
                  value={formData.institution_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institution_id: value })
                  }
                  disabled={loadingInstitutions}
                >
                  <SelectTrigger id="institution">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  An "Investment Depot" account will be created automatically if needed.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 animate-in fade-in duration-300">
                <Label htmlFor="account">Specific Account (Advanced) *</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, account_id: value })
                  }
                  disabled={loadingAccounts}
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select specific account" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* We'll need to load accounts too if advanced is used */}
                    {/* For now, assuming accounts are loaded or added to the fetchData */}
                    {Array.isArray(accountsList) && accountsList.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.name} ({acc.institution?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-mode"
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="advanced-mode" className="text-sm font-normal cursor-pointer">
                Advanced: Select specific account
              </Label>
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base">
                  Asset Status
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
