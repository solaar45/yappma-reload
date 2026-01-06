import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
import { useInstitutions } from '@/lib/api/hooks';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import InstitutionLogo from '@/components/InstitutionLogo';

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
  const [formData, setFormData] = useState({
    name: asset.name,
    asset_type_id: asset.asset_type_id.toString(),
    isin: asset.isin || asset.security_asset?.isin || '',
    ticker: asset.ticker || asset.security_asset?.ticker || '',
    currency: asset.currency,
    is_active: asset.is_active ?? true,
    savings_plan_amount: asset.savings_plan_amount?.toString() || '',
  });
  const { institutions } = useInstitutions({ userId: userId! });
  const [institutionId, setInstitutionId] = useState(asset.institution_id?.toString() || '');

  // Reset form when dialog opens or asset changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: asset.name,
        asset_type_id: asset.asset_type_id.toString(),
        isin: asset.isin || asset.security_asset?.isin || '',
        ticker: asset.ticker || asset.security_asset?.ticker || '',
        currency: asset.currency,
        is_active: asset.is_active ?? true,
        savings_plan_amount: asset.savings_plan_amount?.toString() || '',
      });
      setInstitutionId(asset.institution_id?.toString() || '');
    }
  }, [open, asset]);

  useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const response = await apiClient.get<{ data: AssetType[] }>('asset_types');
        // Handle both response formats
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
        isin: formData.isin || undefined,
        ticker: formData.ticker || undefined,
        savings_plan_amount: formData.savings_plan_amount ? parseFloat(formData.savings_plan_amount) : null,
        institution_id: institutionId === '' ? null : parseInt(institutionId),
        user_id: userId
      };

      await apiClient.put(`assets/${asset.id}`, { asset: updateData });
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
            <DialogTitle>{t('assets.editAsset')}</DialogTitle>
            <DialogDescription>
              {t('common.save')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('assets.assetName')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-type">{t('assets.assetType')} *</Label>
              <Select
                value={formData.asset_type_id}
                onValueChange={(value) => setFormData({ ...formData, asset_type_id: value })}
              >
                <SelectTrigger id="edit-asset-type">
                  <SelectValue placeholder={t('assets.allTypes')} />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-ticker">{t('assets.ticker')}</Label>
              <Input
                id="edit-ticker"
                placeholder="e.g., AAPL"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-isin">{t('assets.isin')}</Label>
              <Input
                id="edit-isin"
                placeholder="e.g., US0378331005"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-savings-plan">{t('assets.savingsPlan')} ({t('common.optional')})</Label>
              <Input
                id="edit-savings-plan"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.savings_plan_amount}
                onChange={(e) => setFormData({ ...formData, savings_plan_amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-institution">{t('assets.institution')} ({t('common.optional')})</Label>
              <Select value={institutionId === '' ? '_none' : institutionId} onValueChange={(v) => setInstitutionId(v === '_none' ? '' : v)}>
                <SelectTrigger id="edit-institution">
                  <SelectValue placeholder={t('assets.allInstitutions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{t('assets.allInstitutions')}</SelectItem>
                  {institutions
                    ?.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        <div className="flex items-center gap-2">
                          <InstitutionLogo name={inst.name} domain={inst.website ? inst.website.replace(/^https?:\/\//, '') : undefined} size="small" className="flex-shrink-0 rounded-full" />
                          <span>{inst.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-currency">{t('common.currency')} *</Label>
              <Input
                id="edit-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                required
              />
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
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
