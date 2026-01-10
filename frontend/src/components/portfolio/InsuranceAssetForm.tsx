import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InsuranceAsset } from '@/lib/api/types';

interface InsuranceAssetFormProps {
  value: Partial<InsuranceAsset>;
  onChange: (value: Partial<InsuranceAsset>) => void;
  disabled?: boolean;
}

export function InsuranceAssetForm({ value, onChange, disabled }: InsuranceAssetFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insurer_name">{t('assets.insurance.insurerName')}</Label>
          <Input
            id="insurer_name"
            value={value.insurer_name || ''}
            onChange={(e) => onChange({ ...value, insurer_name: e.target.value })}
            placeholder="Allianz"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="policy_number">{t('assets.insurance.policyNumber')}</Label>
          <Input
            id="policy_number"
            value={value.policy_number || ''}
            onChange={(e) => onChange({ ...value, policy_number: e.target.value })}
            placeholder="POL-123456"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="insurance_type">{t('assets.insurance.type')}</Label>
        <Input
          id="insurance_type"
          value={value.insurance_type || ''}
          onChange={(e) => onChange({ ...value, insurance_type: e.target.value })}
          placeholder={t('assets.insurance.typePlaceholder')}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="policy_start_date">{t('assets.insurance.policyStartDate')}</Label>
          <Input
            id="policy_start_date"
            type="date"
            value={value.policy_start_date || ''}
            onChange={(e) => onChange({ ...value, policy_start_date: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="policy_end_date">{t('assets.insurance.policyEndDate')}</Label>
          <Input
            id="policy_end_date"
            type="date"
            value={value.policy_end_date || ''}
            onChange={(e) => onChange({ ...value, policy_end_date: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coverage_amount">{t('assets.insurance.coverageAmount')}</Label>
          <Input
            id="coverage_amount"
            type="number"
            step="0.01"
            value={value.coverage_amount || ''}
            onChange={(e) => onChange({ ...value, coverage_amount: e.target.value })}
            placeholder="100000.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="premium_amount">{t('assets.insurance.premiumAmount')}</Label>
          <Input
            id="premium_amount"
            type="number"
            step="0.01"
            value={value.premium_amount || ''}
            onChange={(e) => onChange({ ...value, premium_amount: e.target.value })}
            placeholder="500.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deductible">{t('assets.insurance.deductible')}</Label>
          <Input
            id="deductible"
            type="number"
            step="0.01"
            value={value.deductible || ''}
            onChange={(e) => onChange({ ...value, deductible: e.target.value })}
            placeholder="500.00"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_frequency">{t('assets.insurance.paymentFrequency')}</Label>
        <Input
          id="payment_frequency"
          value={value.payment_frequency || ''}
          onChange={(e) => onChange({ ...value, payment_frequency: e.target.value })}
          placeholder={t('assets.insurance.frequencyPlaceholder')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
