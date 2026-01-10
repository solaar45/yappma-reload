import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateAsset } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
import type { AssetType, SecurityAsset, InsuranceAsset, RealEstateAsset } from '@/lib/api/types';
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
import { useAccounts } from '@/lib/api/hooks';
import InstitutionLogo from '@/components/InstitutionLogo';
import { SecurityAssetForm } from '@/components/portfolio/SecurityAssetForm';
import { InsuranceAssetForm } from '@/components/portfolio/InsuranceAssetForm';
import { RealEstateAssetForm } from '@/components/portfolio/RealEstateAssetForm';

interface CreateAssetDialogProps {
  onSuccess?: () => void;
}

export function CreateAssetDialog({ onSuccess }: CreateAssetDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { createAsset, loading, error } = useCreateAsset();
  const [open, setOpen] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    asset_type_id: string;
    currency: string;
    is_active: boolean;
    security_asset?: Partial<SecurityAsset>;
    insurance_asset?: Partial<InsuranceAsset>;
    real_estate_asset?: Partial<RealEstateAsset>;
  }>({
    name: '',
    asset_type_id: '',
    currency: 'EUR',
    is_active: true,
  });
  const { accounts } = useAccounts({ userId: userId! });
  const [accountId, setAccountId] = useState('');

  // Get selected asset type
  const selectedAssetType = assetTypes.find(
    (t) => t.id.toString() === formData.asset_type_id
  );

  useEffect(() => {
    const fetchAssetTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await apiClient.get<{ data: AssetType[] }>('asset_types');
        const types = Array.isArray(response) ? response : (response.data || []);
        setAssetTypes(types);
        
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

    // Helper to convert null values to undefined to satisfy API types
    const sanitize = <T,>(obj?: T) => {
      if (!obj) return undefined;
      const out: any = {};
      for (const key of Object.keys(obj as any)) {
        const val = (obj as any)[key];
        out[key] = val === null ? undefined : val;
      }
      return out as T;
    };

    const sanitizedSecurity = sanitize(formData.security_asset) as {
      isin?: string;
      ticker?: string;
      wkn?: string;
      exchange?: string;
      sector?: string;
    } | undefined;

    

    const result = await createAsset({
      user_id: userId,
      asset_type_id: parseInt(formData.asset_type_id),
      name: formData.name,
      currency: formData.currency,
      is_active: formData.is_active,
      security_asset: sanitizedSecurity,
      ...(accountId ? { account_id: parseInt(accountId) } : {}),
    });

    if (result) {
      setOpen(false);
      setFormData({
        name: '',
        asset_type_id: '',
        currency: 'EUR',
        is_active: true,
      });
      setAccountId('');
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {t('assets.createAsset') || 'Add Asset'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('assets.createAsset') || 'Create New Asset'}</DialogTitle>
            <DialogDescription>
              {t('assets.addFirstDescription') || 'Add a new asset to track your investments.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('assets.assetName') || 'Asset Name'} *</Label>
              <Input
                id="name"
                placeholder="e.g., Apple Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset_type">{t('assets.assetType') || 'Asset Type'} *</Label>
              <Select
                value={formData.asset_type_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, asset_type_id: value })
                }
                disabled={loadingTypes}
              >
                <SelectTrigger id="asset_type">
                  <SelectValue placeholder={t('assets.allTypes') || "Select asset type"} />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {t(`assetTypes.${type.code}`, { defaultValue: type.description || type.code })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditionally render specialized forms based on asset type */}
            {selectedAssetType?.code === 'security' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  {t('assets.security.details') || 'Security Details'}
                </h4>
                <SecurityAssetForm
                  value={formData.security_asset || {}}
                  onChange={(value) => setFormData({ ...formData, security_asset: value })}
                />
              </div>
            )}

            {selectedAssetType?.code === 'insurance' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  {t('assets.insurance.details') || 'Insurance Details'}
                </h4>
                <InsuranceAssetForm
                  value={formData.insurance_asset || {}}
                  onChange={(value) => setFormData({ ...formData, insurance_asset: value })}
                />
              </div>
            )}

            {selectedAssetType?.code === 'real_estate' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  {t('assets.realEstate.details') || 'Real Estate Details'}
                </h4>
                <RealEstateAssetForm
                  value={formData.real_estate_asset || {}}
                  onChange={(value) => setFormData({ ...formData, real_estate_asset: value })}
                />
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">{t('common.currency') || 'Currency'} *</Label>
                <Input
                  id="currency"
                  placeholder="EUR"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">{t('assets.account') || 'Linked Account'} ({t('common.optional') || 'optional'})</Label>
              <Select value={accountId === '' ? '_none' : accountId} onValueChange={(v) => setAccountId(v === '_none' ? '' : v)}>
                <SelectTrigger id="account">
                  <SelectValue placeholder={t('assets.allAccounts') || "No account"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('assets.allAccounts') || "No Account"}</SelectItem>
                  {accounts
                    ?.filter((a) => a.is_active)
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        <div className="flex items-center gap-2">
                          <InstitutionLogo name={a.institution?.name || a.name} domain={a.institution?.website ? a.institution.website.replace(/^https?:\/\//, '') : undefined} size="small" className="flex-shrink-0 rounded-full" />
                          <div className="flex flex-col">
                            <span>{a.name}</span>
                            <span className="text-[10px] text-muted-foreground">{a.institution?.name || '-'}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base">
                  {t('assets.status') || 'Asset Status'}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.is_active ? (t('assets.active') || 'Active') : (t('assets.inactive') || 'Inactive')}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.asset_type_id}
            >
              {loading ? (t('common.loading') || 'Creating...') : (t('common.create') || 'Create Asset')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
