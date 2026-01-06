import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building } from 'lucide-react';

type SizeKey = 'small' | 'medium' | 'large';

interface Props {
  name: string;
  domain?: string | null;
  ticker?: string | null;
  isin?: string | null;
  size?: SizeKey;
  className?: string;
}

const SIZE_MAP: Record<SizeKey, number> = {
  small: 24,
  medium: 40,
  large: 64,
};

function initialsFromName(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const InstitutionLogo: React.FC<Props> = ({ name, domain, ticker, isin, size = 'medium', className }) => {
  const logoDevToken = import.meta.env.VITE_LOGO_DEV_TOKEN;
  const logokitToken = import.meta.env.VITE_LOGOKIT_TOKEN || logoDevToken; // Fallback to dev token if logokit not set
  const px = SIZE_MAP[size];

  // Build URL priority: isin -> ticker -> domain -> name
  const buildUrl = () => {
    try {
      // Logokit API for ISIN and Ticker (uses logokitToken)
      if (logokitToken) {
        const encodedLogokitToken = encodeURIComponent(String(logokitToken));
        if (isin) return `https://img.logokit.com/ticker/${encodeURIComponent(String(isin))}?token=${encodedLogokitToken}`;
        if (ticker) return `https://img.logokit.com/ticker/${encodeURIComponent(String(ticker))}?token=${encodedLogokitToken}`;
        // Logokit API for Domain
        if (domain) return `https://img.logokit.com/${encodeURIComponent(String(domain))}?token=${encodedLogokitToken}`;
      }

      // Fallback: Logo.dev Name API (uses logoDevToken)
      if (logoDevToken) {
        const encodedLogoDevToken = encodeURIComponent(String(logoDevToken));
        return `https://img.logo.dev/name/${encodeURIComponent(String(name))}?token=${encodedLogoDevToken}`;
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  const src = buildUrl();

  return (
    <Avatar className={className} style={{ width: px, height: px }}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name}
          loading="lazy"
          width={px}
          height={px}
          onError={(e) => {
            // Let AvatarFallback handle fallback; clear src to avoid retry loops
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : null}
      <AvatarFallback className="bg-muted text-muted-foreground flex items-center justify-center">
        {initialsFromName(name) || <Building className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
};

export default InstitutionLogo;
