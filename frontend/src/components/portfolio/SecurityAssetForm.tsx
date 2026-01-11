import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SecurityAsset } from '@/lib/api/types';

interface SecurityAssetFormProps {
  value: Partial<SecurityAsset>;
  onChange: (value: Partial<SecurityAsset>) => void;
  disabled?: boolean;
}

export function SecurityAssetForm({ value, onChange, disabled }: SecurityAssetFormProps) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');

  // Initialize identifier from existing value
  useEffect(() => {
    const id = value.ticker || value.isin || '';
    setIdentifier(id);
  }, [value.ticker, value.isin]);

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    const trimmed = val.trim();

    if (trimmed === '') {
      // Clear both ticker and ISIN
      onChange({ 
        ...value, 
        ticker: undefined, 
        isin: undefined 
      });
      return;
    }

    // Auto-detect: ISIN has 12 characters and starts with 2 letters (country code)
    if (trimmed.length === 12 && /^[A-Z]{2}/i.test(trimmed)) {
      // Treat as ISIN
      onChange({ 
        ...value, 
        isin: trimmed.toUpperCase(), 
        ticker: undefined 
      });
    } else {
      // Treat as ticker
      onChange({ 
        ...value, 
        ticker: trimmed.toUpperCase(), 
        isin: undefined 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">
          {t('assets.security.identifier') || 'Security Identifier'}
          <span className="text-xs text-muted-foreground ml-2">
            ({t('assets.security.tickerOrIsin') || 'Ticker or ISIN'})
          </span>
        </Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(e) => handleIdentifierChange(e.target.value)}
          disabled={disabled}
          placeholder="AAPL or US0378331005"
        />
        <p className="text-xs text-muted-foreground">
          {t('assets.security.identifierHint') || 'Enter a ticker symbol (e.g. AAPL) or ISIN code (e.g. US0378331005). The type will be detected automatically.'}
        </p>
      </div>

      {/* WKN as optional info field (no validation) */}
      <div className="space-y-2">
        <Label htmlFor="wkn">
          {t('assets.security.wkn') || 'WKN'}
          <span className="text-xs text-muted-foreground ml-2">
            ({t('common.optional') || 'optional'})
          </span>
        </Label>
        <Input
          id="wkn"
          value={value.wkn || ''}
          onChange={(e) => onChange({ ...value, wkn: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          {t('assets.security.wknNoValidation') || 'WKN is stored as additional information only (no validation)'}
        </p>
      </div>
    </div>
  );
}
