import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { RealEstateAsset } from '@/lib/api/types';

interface RealEstateAssetFormProps {
  value: Partial<RealEstateAsset>;
  onChange: (value: Partial<RealEstateAsset>) => void;
  disabled?: boolean;
}

export function RealEstateAssetForm({ value, onChange, disabled }: RealEstateAssetFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">{t('assets.realEstate.address')}</Label>
        <Textarea
          id="address"
          value={value.address || ''}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder={t('assets.realEstate.addressPlaceholder')}
          disabled={disabled}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="property_type">{t('assets.realEstate.propertyType')}</Label>
          <Select
            value={value.property_type || ''}
            onValueChange={(val) => onChange({ ...value, property_type: val as RealEstateAsset['property_type'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assets.realEstate.selectPropertyType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">{t('assets.realEstate.types.residential')}</SelectItem>
              <SelectItem value="commercial">{t('assets.realEstate.types.commercial')}</SelectItem>
              <SelectItem value="land">{t('assets.realEstate.types.land')}</SelectItem>
              <SelectItem value="mixed_use">{t('assets.realEstate.types.mixedUse')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage">{t('assets.realEstate.usage')}</Label>
          <Select
            value={value.usage || ''}
            onValueChange={(val) => onChange({ ...value, usage: val as RealEstateAsset['usage'] })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assets.realEstate.selectUsage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner_occupied">{t('assets.realEstate.usages.ownerOccupied')}</SelectItem>
              <SelectItem value="rented_out">{t('assets.realEstate.usages.rentedOut')}</SelectItem>
              <SelectItem value="vacant">{t('assets.realEstate.usages.vacant')}</SelectItem>
              <SelectItem value="development">{t('assets.realEstate.usages.development')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size_m2">{t('assets.realEstate.sizeM2')}</Label>
          <Input
            id="size_m2"
            type="number"
            step="0.01"
            value={value.size_m2 || ''}
            onChange={(e) => onChange({ ...value, size_m2: e.target.value })}
            placeholder="150.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">{t('assets.realEstate.purchasePrice')}</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            value={value.purchase_price || ''}
            onChange={(e) => onChange({ ...value, purchase_price: e.target.value })}
            placeholder="350000.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">{t('assets.realEstate.purchaseDate')}</Label>
          <Input
            id="purchase_date"
            type="date"
            value={value.purchase_date || ''}
            onChange={(e) => onChange({ ...value, purchase_date: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="construction_year">{t('assets.realEstate.constructionYear')}</Label>
          <Input
            id="construction_year"
            type="number"
            min="1800"
            max="2100"
            value={value.construction_year || ''}
            onChange={(e) => onChange({ ...value, construction_year: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="2005"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="renovation_year">{t('assets.realEstate.renovationYear')}</Label>
          <Input
            id="renovation_year"
            type="number"
            min="1800"
            max="2100"
            value={value.renovation_year || ''}
            onChange={(e) => onChange({ ...value, renovation_year: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="2020"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cadastral_number">{t('assets.realEstate.cadastralNumber')}</Label>
        <Input
          id="cadastral_number"
          value={value.cadastral_number || ''}
          onChange={(e) => onChange({ ...value, cadastral_number: e.target.value })}
          placeholder="12-345-678/90"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">{t('assets.realEstate.financials')}</h4>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rental_income">{t('assets.realEstate.rentalIncome')}</Label>
          <Input
            id="rental_income"
            type="number"
            step="0.01"
            value={value.rental_income || ''}
            onChange={(e) => onChange({ ...value, rental_income: e.target.value })}
            placeholder="1200.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="operating_expenses">{t('assets.realEstate.operatingExpenses')}</Label>
          <Input
            id="operating_expenses"
            type="number"
            step="0.01"
            value={value.operating_expenses || ''}
            onChange={(e) => onChange({ ...value, operating_expenses: e.target.value })}
            placeholder="300.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="property_tax">{t('assets.realEstate.propertyTax')}</Label>
          <Input
            id="property_tax"
            type="number"
            step="0.01"
            value={value.property_tax || ''}
            onChange={(e) => onChange({ ...value, property_tax: e.target.value })}
            placeholder="150.00"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mortgage_outstanding">{t('assets.realEstate.mortgageOutstanding')}</Label>
          <Input
            id="mortgage_outstanding"
            type="number"
            step="0.01"
            value={value.mortgage_outstanding || ''}
            onChange={(e) => onChange({ ...value, mortgage_outstanding: e.target.value })}
            placeholder="250000.00"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mortgage_rate">{t('assets.realEstate.mortgageRate')} (%)</Label>
          <Input
            id="mortgage_rate"
            type="number"
            step="0.01"
            value={value.mortgage_rate || ''}
            onChange={(e) => onChange({ ...value, mortgage_rate: e.target.value })}
            placeholder="2.5"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
