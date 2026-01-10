import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { enrichSecurityMetadata } from '@/lib/api/securities';
import { useToast } from '@/hooks/use-toast';
import type { SecurityAsset } from '@/lib/api/types';

interface SecurityAssetFormProps {
  value: Partial<SecurityAsset>;
  onChange: (value: Partial<SecurityAsset>) => void;
  disabled?: boolean;
}

export function SecurityAssetForm({ value, onChange, disabled }: SecurityAssetFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrich = async () => {
    const identifier = value.ticker || value.isin || value.wkn;
    if (!identifier) {
      toast({
        title: t('common.error'),
        description: t('assets.security.enrichment.noIdentifier'),
        variant: 'destructive',
      });
      return;
    }

    setIsEnriching(true);
    try {
      const metadata = await enrichSecurityMetadata(identifier, 'auto');
      
      // Merge enriched data with existing data (only visible fields)
      onChange({
        ...value,
        ticker: metadata.ticker || value.ticker,
      });

      toast({
        title: t('common.success'),
        description: t('assets.security.enrichment.success'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('assets.security.enrichment.failed'),
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="ticker">{t('assets.security.ticker')}</Label>
          <Input
            id="ticker"
            value={value.ticker || ''}
            onChange={(e) => onChange({ ...value, ticker: e.target.value })}
            placeholder="AAPL"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleEnrich}
          disabled={disabled || isEnriching || (!value.ticker && !value.isin && !value.wkn)}
          className="mb-0"
        >
          {isEnriching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-2">{t('assets.security.autoFill')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isin">{t('assets.security.isin')}</Label>
          <Input
            id="isin"
            value={value.isin || ''}
            onChange={(e) => onChange({ ...value, isin: e.target.value })}
            placeholder="US0378331005"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wkn">{t('assets.security.wkn')}</Label>
          <Input
            id="wkn"
            value={value.wkn || ''}
            onChange={(e) => onChange({ ...value, wkn: e.target.value })}
            placeholder="865985"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
