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
import { Plus, Search, Loader2, AlertCircle, Edit } from 'lucide-react';
import { useAccounts } from '@/lib/api/hooks';
import InstitutionLogo from '@/components/InstitutionLogo';
import { SecurityAssetForm } from '@/components/portfolio/SecurityAssetForm';
import { InsuranceAssetForm } from '@/components/portfolio/InsuranceAssetForm';
import { RealEstateAssetForm } from '@/components/portfolio/RealEstateAssetForm';
import { useToast } from '@/hooks/use-toast';

interface CreateAssetDialogProps {
  onSuccess?: () => void;
}

export function CreateAssetDialog({ onSuccess }: CreateAssetDialogProps) {
  const { t } = useTranslation();
  const { userId } = useUser();
  const { createAsset, loading, error } = useCreateAsset();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Progressive form state
  const [identifier, setIdentifier] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [enrichmentSuccess, setEnrichmentSuccess] = useState(false);
  
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

  // Check if we should show remaining fields
  const shouldShowRemainingFields = 
    selectedAssetType?.code === 'security' 
      ? (enrichmentSuccess || showManualEntry)
      : formData.asset_type_id !== '';

  useEffect(() => {
    const fetchAssetTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await apiClient.get<{ data: AssetType[] }>('asset_types');
        const types = Array.isArray(response) ? response : (response.data || []);
        setAssetTypes(types);
      } catch (err) {
        console.error('Failed to load asset types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };

    if (open) {
      fetchAssetTypes();
      // Reset all form state
      setValidationError(null);
      setIdentifier('');
      setEnrichmentError(null);
      setShowManualEntry(false);
      setEnrichmentSuccess(false);
      setFormData({
        name: '',
        asset_type_id: '',
        currency: 'EUR',
        is_active: true,
        security_asset: undefined,
        insurance_asset: undefined,
        real_estate_asset: undefined
      });
      setAccountId('');
    }
  }, [open]);

  const handleEnrichSecurity = async () => {
    if (!identifier) return;

    setIsEnriching(true);
    setEnrichmentError(null);
    setEnrichmentSuccess(false);

    try {
      const response = await apiClient.post('securities/enrich', {
        identifier: identifier.trim(),
        type: 'auto'
      });

      if (response.data) {
        const enrichedData = response.data;
        
        // Auto-fill form with enriched data
        setFormData(prev => ({
          ...prev,
          name: enrichedData.name || '',
          currency: enrichedData.currency || 'EUR',
          security_asset: {
            ...prev.security_asset,
            ticker: enrichedData.ticker,
            isin: enrichedData.isin,
            // Keep the security_type that was already selected
          }
        }));

        setEnrichmentSuccess(true);
        toast({
          title: t('common.success'),
          description: `Wertpapier "${enrichedData.name}" gefunden`,
        });
      }
    } catch (err: any) {
      console.error('Enrichment error:', err);
      setEnrichmentError('Wertpapier nicht gefunden');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setEnrichmentError(null);
    
    // Set identifier as ticker or isin based on format
    const isISIN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(identifier.trim());
    setFormData(prev => ({
      ...prev,
      security_asset: {
        ...prev.security_asset,
        [isISIN ? 'isin' : 'ticker']: identifier.trim().toUpperCase()
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formData.asset_type_id) return;

    // Clear previous validation errors
    setValidationError(null);

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
      security_type?: string;
    } | undefined;

    try {
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
        toast({
          title: t('common.success'),
          description: 'Asset erfolgreich angelegt',
        });
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Asset creation error:', err);
      
      // Extract error details from ApiError structure
      const errorData = err?.data || {};
      const errorDetail = errorData?.errors?.detail || '';
      const errorMessage = errorData?.errors?.message || err?.message || '';
      
      // Handle specific security validation errors with i18n
      if (errorDetail === 'security_not_found') {
        const identifier = sanitizedSecurity?.ticker || sanitizedSecurity?.isin || 'unbekannt';
        setValidationError(t('errors.securityNotFound', { identifier }));
      } else if (errorDetail === 'validation_failed') {
        setValidationError(t('errors.validationFailed'));
      } else {
        // Generic error - show backend message or fallback
        setValidationError(errorMessage || t('errors.assetCreationFailed'));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {t('assets.createAsset')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('assets.createAsset')}</DialogTitle>
            <DialogDescription>
              {t('assets.addFirstDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Step 1: Asset Type - Always shown */}
            <div className="grid gap-2">
              <Label htmlFor="asset_type">{t('assets.assetType')} *</Label>
              <Select
                value={formData.asset_type_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, asset_type_id: value });
                  // Reset progressive states when asset type changes
                  setIdentifier('');
                  setEnrichmentError(null);
                  setShowManualEntry(false);
                  setEnrichmentSuccess(false);
                }}
                disabled={loadingTypes}
              >
                <SelectTrigger id="asset_type">
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

            {/* Step 2: Security Type - Only for security assets */}
            {selectedAssetType?.code === 'security' && (
              <div className="grid gap-2">
                <Label htmlFor="security_type">{t('assets.security.type')} *</Label>
                <Select
                  value={formData.security_asset?.security_type || ''}
                  onValueChange={(val) => {
                    setFormData({
                      ...formData,
                      security_asset: {
                        ...formData.security_asset,
                        security_type: val as SecurityAsset['security_type'],
                      },
                    });
                    // Reset states when security type changes
                    setIdentifier('');
                    setEnrichmentError(null);
                    setShowManualEntry(false);
                    setEnrichmentSuccess(false);
                  }}
                >
                  <SelectTrigger id="security_type">
                    <SelectValue placeholder={t('assets.security.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">{t('assets.security.types.stock')}</SelectItem>
                    <SelectItem value="etf">{t('assets.security.types.etf')}</SelectItem>
                    <SelectItem value="bond">{t('assets.security.types.bond')}</SelectItem>
                    <SelectItem value="mutual_fund">{t('assets.security.types.mutualFund')}</SelectItem>
                    <SelectItem value="index_fund">{t('assets.security.types.indexFund')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 3: Identifier - Only when security type is selected */}
            {selectedAssetType?.code === 'security' && formData.security_asset?.security_type && (
              <div className="grid gap-2">
                <Label htmlFor="identifier">
                  {t('assets.security.identifier')}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({t('assets.security.tickerOrIsin')})
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setEnrichmentError(null);
                    }}
                    placeholder="z.B. AAPL oder US0378331005"
                    disabled={enrichmentSuccess}
                  />
                  {!enrichmentSuccess ? (
                    <Button
                      type="button"
                      onClick={handleEnrichSecurity}
                      disabled={!identifier || isEnriching}
                      className="flex-shrink-0"
                    >
                      {isEnriching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {isEnriching ? 'Suche...' : 'Suchen'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEnrichmentSuccess(false);
                        setShowManualEntry(false);
                        setIdentifier('');
                      }}
                      className="flex-shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                      Ändern
                    </Button>
                  )}
                </div>
                
                {/* Enrichment Error with Manual Entry Option */}
                {enrichmentError && !showManualEntry && (
                  <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                          {enrichmentError}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Möchten Sie das Asset manuell anlegen?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleManualEntry}
                          className="mt-2"
                        >
                          Manuell anlegen
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Indicator */}
                {enrichmentSuccess && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm">
                    <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Wertpapier gefunden und Felder automatisch ausgefüllt
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Specialized forms for non-security assets */}
            {selectedAssetType?.code === 'insurance' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  {t('assets.insurance.details')}
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
                  {t('assets.realEstate.details')}
                </h4>
                <RealEstateAssetForm
                  value={formData.real_estate_asset || {}}
                  onChange={(value) => setFormData({ ...formData, real_estate_asset: value })}
                />
              </div>
            )}

            {/* Remaining fields - shown after enrichment or manual entry for securities, or immediately for other types */}
            {shouldShowRemainingFields && (
              <>
                <div className="border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('assets.assetName')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">{t('common.currency')} *</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="account">{t('assets.account')} ({t('common.optional')})</Label>
                  <Select value={accountId === '' ? '_none' : accountId} onValueChange={(v) => setAccountId(v === '_none' ? '' : v)}>
                    <SelectTrigger id="account">
                      <SelectValue placeholder={t('assets.allAccounts')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('assets.allAccounts')}</SelectItem>
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
              </>
            )}
            
            {/* Error Display */}
            {validationError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {validationError}
              </div>
            )}
            
            {error && !validationError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.asset_type_id || !shouldShowRemainingFields}
            >
              {loading ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
