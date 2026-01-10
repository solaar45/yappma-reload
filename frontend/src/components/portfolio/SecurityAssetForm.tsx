import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
        title: t('error'),
        description: t('assets.security.enrichment.noIdentifier'),
        variant: 'destructive',
      });
      return;
    }

    setIsEnriching(true);
    try {
      const metadata = await enrichSecurityMetadata(identifier, 'auto');
      
      // Merge enriched data with existing data
      onChange({
        ...value,
        ticker: metadata.ticker || value.ticker,
        security_type: metadata.security_type || value.security_type,
        exchange: metadata.exchange || value.exchange,
        sector: metadata.sector || value.sector,
        distribution_type: metadata.distribution_type || value.distribution_type,
        expense_ratio: metadata.expense_ratio?.toString() || value.expense_ratio,
        country_of_domicile: metadata.country_of_domicile || value.country_of_domicile,
        benchmark_index: metadata.benchmark_index || value.benchmark_index,
      });

      toast({
        title: t('success'),
        description: t('assets.security.enrichment.success'),
      });
    } catch (error) {
      toast({
        title: t('error'),
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="security_type">{t('assets.security.type')}</Label>
          <Select
            value={value.security_type || ''}
            onValueChange={(val) => onChange({ ...value, security_type: val as SecurityAsset['security_type'] })}
            disabled={disabled}
          >
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="distribution_type">{t('assets.security.distributionType')}</Label>
          <Select
            value={value.distribution_type || ''}
            onValueChange={(val) => onChange({ ...value, distribution_type: val as SecurityAsset['distribution_type'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assets.security.selectDistribution')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accumulating">{t('assets.security.accumulating')}</SelectItem>
              <SelectItem value="distributing">{t('assets.security.distributing')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="exchange">{t('assets.security.exchange')}</Label>
          <Input
            id="exchange"
            value={value.exchange || ''}
            onChange={(e) => onChange({ ...value, exchange: e.target.value })}
            placeholder="NASDAQ"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">{t('assets.security.sector')}</Label>
          <Input
            id="sector"
            value={value.sector || ''}
            onChange={(e) => onChange({ ...value, sector: e.target.value })}
            placeholder="Technology"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expense_ratio">{t('assets.security.expenseRatio')} (%)</Label>
          <Input
            id="expense_ratio"
            type="number"
            step="0.01"
            value={value.expense_ratio || ''}
            onChange={(e) => onChange({ ...value, expense_ratio: e.target.value })}
            placeholder="0.45"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon_rate">{t('assets.security.couponRate')} (%)</Label>
          <Input
            id="coupon_rate"
            type="number"
            step="0.01"
            value={value.coupon_rate || ''}
            onChange={(e) => onChange({ ...value, coupon_rate: e.target.value })}
            placeholder="2.5"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuer">{t('assets.security.issuer')}</Label>
          <Input
            id="issuer"
            value={value.issuer || ''}
            onChange={(e) => onChange({ ...value, issuer: e.target.value })}
            placeholder="BlackRock"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maturity_date">{t('assets.security.maturityDate')}</Label>
          <Input
            id="maturity_date"
            type="date"
            value={value.maturity_date || ''}
            onChange={(e) => onChange({ ...value, maturity_date: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country_of_domicile">{t('assets.security.countryOfDomicile')}</Label>
          <Input
            id="country_of_domicile"
            value={value.country_of_domicile || ''}
            onChange={(e) => onChange({ ...value, country_of_domicile: e.target.value })}
            placeholder="USA"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="benchmark_index">{t('assets.security.benchmarkIndex')}</Label>
          <Input
            id="benchmark_index"
            value={value.benchmark_index || ''}
            onChange={(e) => onChange({ ...value, benchmark_index: e.target.value })}
            placeholder="S&P 500"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
