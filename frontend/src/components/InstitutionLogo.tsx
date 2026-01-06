import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building } from 'lucide-react';

type SizeKey = 'small' | 'medium' | 'large';

interface Props {
  name: string;
  domain?: string | null;
  ticker?: string | null;
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

export const InstitutionLogo: React.FC<Props> = ({ name, domain, ticker, size = 'medium', className }) => {
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN;
  const px = SIZE_MAP[size];

  // Build URL priority: ticker -> domain -> name
  const buildUrl = () => {
    if (!token) return null;
    try {
      const encodedToken = encodeURIComponent(String(token));
      if (ticker) return `https://img.logo.dev/ticker/${encodeURIComponent(String(ticker))}?token=${encodedToken}`;
      if (domain) return `https://img.logo.dev/${encodeURIComponent(String(domain))}?token=${encodedToken}`;
      return `https://img.logo.dev/name/${encodeURIComponent(String(name))}?token=${encodedToken}`;
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
