import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
import type { Asset, AssetType, SecurityAsset, InsuranceAsset, RealEstateAsset } from '@/lib/api/types';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { useAccounts } from '@/lib/api/hooks';
import InstitutionLogo from '@/components/InstitutionLogo';
import { InsuranceAssetForm } from '@/components/portfolio/InsuranceAssetForm';
import { RealEstateAssetForm } from '@/components/portfolio/RealEstateAssetForm';
import { SecuritySearchCombobox } from '@/components/portfolio/SecuritySearchCombobox';

interface SecurityResult {
  ticker: string;
  name: string;
  exchange?: string;
  exchange_short?: string;
  currency?: string;
  type?: string;
}

interface EditAssetDialogProps {
  asset: Asset;
  onSuccess?: () => void;
}

export function EditAssetDialog({ asset, onSuccess }: EditAssetDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  
  // Security search state
  const [selectedSecurity, setSelectedSecurity] = useState<SecurityResult | undefined>();
  
  const [formData, setFormData] = useState<{
    name: string;
    asset_type_id: string;
    currency: string;
    is_active: boolean;
    security_asset?: Partial<SecurityAsset>;
    insurance_asset?: Partial<InsuranceAsset>;
    real_estate_asset?: Partial<RealEstateAsset>;
  }>({
    name: asset.name,
    asset_type_id: asset.asset_type_id.toString(),
    currency: asset.currency,
    is_active: asset.is_active ?? true,
    security_asset: asset.security_asset ?? undefined,
    insurance_asset: asset.insurance_asset ?? undefined,
    real_estate_asset: asset.real_estate_asset ?? undefined,
  });
  const { accounts } = useAccounts({ userId: userId! });
  const [accountId, setAccountId] = useState(asset.account_id?.toString() || '');

  // Get selected asset type
  const selectedAssetType = assetTypes.find(
    (t) => t.id.toString() === formData.asset_type_id
  );

  // Reset form when dialog opens or asset changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: asset.name,
        asset_type_id: asset.asset_type_id.toString(),
        currency: asset.currency,
        is_active: asset.is_active ?? true,
        security_asset: asset.security_asset ?? undefined,
        insurance_asset: asset.insurance_asset ?? undefined,
        real_estate_asset: asset.real_estate_asset ?? undefined,
      });
      
      // Initialize selectedSecurity from existing asset data
      if (asset.security_asset?.ticker) {
        setSelectedSecurity({
          ticker: asset.security_asset.ticker,
          name: asset.name,
          currency: asset.currency,
          // Convert null to undefined for SecurityResult type
          type: asset.security_asset.security_type ?? undefined,
        });
      } else {
        setSelectedSecurity(undefined);
      }
    }
  }, [open, asset]);

  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const response = await apiClient.get<{ data: AssetType[] }>('asset_types');
        const types = Array.isArray(response) ? response : (response.data || []);
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
        is_active: formData.is_active,
        security_asset: formData.security_asset,
        insurance_asset: formData.insurance_asset,
        real_estate_asset: formData.real_estate_asset,
      };

      // account_id handling: include field (can be null to remove)
      if (typeof accountId !== 'undefined') {
        updateData.account_id = accountId === '' ? null : parseInt(accountId);
      }

      await apiClient.put(`assets/${asset.id}`, { asset: updateData });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.assetCreationFailed');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('assets.editAsset')}</DialogTitle>
            <DialogDescription>
              {t('assets.editAssetDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-type" required>{t('assets.assetType')}</Label>
              <Select
                value={formData.asset_type_id}
                onValueChange={(value) => setFormData({ ...formData, asset_type_id: value })}
              >
                <SelectTrigger id="edit-asset-type">
                  <SelectValue placeholder={t('assets.selectAssetType')} />
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

            {/* Security Search - Directly after selecting Security asset type */}
            {selectedAssetType?.code === 'security' && (
              <div className="grid gap-2">
                <Label>{t('common.tickerOrName')}</Label>
                <SecuritySearchCombobox
                  value={selectedSecurity}
                  onSelect={(security) => {
                    setSelectedSecurity(security);
                    setFormData(prev => ({
                      ...prev,
                      name: security.name,
                      currency: security.currency || 'USD',
                      security_asset: {
                        ...prev.security_asset,
                        ticker: security.ticker,
                        // Cast security.type to the expected union type
                        security_type: security.type as SecurityAsset['security_type'],
                        isin: undefined,
                      }
                    }));
                  }}
                  placeholder={t('common.search')}
                />
              </div>
            )}

            {/* Conditionally render specialized forms based on asset type */}
            {selectedAssetType?.code === 'insurance' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">{t('assets.insurance.details')}</h4>
                <InsuranceAssetForm
                  value={formData.insurance_asset || {}}
                  onChange={(value) => setFormData({ ...formData, insurance_asset: value })}
                />
              </div>
            )}

            {selectedAssetType?.code === 'real_estate' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">{t('assets.realEstate.details')}</h4>
                <RealEstateAssetForm
                  value={formData.real_estate_asset || {}}
                  onChange={(value) => setFormData({ ...formData, real_estate_asset: value })}
                />
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" required>{t('assets.assetName')}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-currency" required>{t('common.currency')}</Label>
              <Input
                id="edit-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-account">{t('assets.linkedAccount')}</Label>
              <Select value={accountId === '' ? '_none' : accountId} onValueChange={(v) => setAccountId(v === '_none' ? '' : v)}>
                <SelectTrigger id="edit-account">
                  <SelectValue placeholder={t('assets.noAccountSelected')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('assets.noAccount')}</SelectItem>
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
                  {t('assets.status')}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {formData.is_active ? t('assets.active') : t('assets.inactive')}
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
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
