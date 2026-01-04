import { RefreshCw, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRevokeConsent, useSyncAccounts } from '@/lib/api/hooks/useBankConnections';
import type { BankConsent } from '@/lib/api/types';
import { formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useUser } from '@/contexts/UserContext';

interface ConsentListProps {
  consents: BankConsent[];
}

export function ConsentList({ consents }: ConsentListProps) {
  const revokeConsent = useRevokeConsent();
  const syncAccounts = useSyncAccounts();
  const { refreshBankStatus } = useUser();

  const handleSync = async (consentId: string) => {
    logger.info('Syncing consent', { consentId });
    try {
      const result = await syncAccounts.mutateAsync(consentId);
      logger.info('Sync completed', result);
      // Refresh bank status in UserContext
      await refreshBankStatus();
    } catch (error) {
      logger.error('Sync failed', error);
    }
  };

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Möchtest du diese Bankverbindung wirklich löschen?')) {
      return;
    }
    
    logger.info('Revoking consent', { consentId });
    try {
      await revokeConsent.mutateAsync(consentId);
      // Refresh bank status in UserContext
      await refreshBankStatus();
    } catch (error) {
      logger.error('Revoke failed', error);
    }
  };

  const getStatusBadge = (status: BankConsent['status']) => {
    const variants: Record<BankConsent['status'], { variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: any }> = {
      valid: { variant: 'default', icon: CheckCircle2 },
      authorized: { variant: 'default', icon: CheckCircle2 },
      pending: { variant: 'secondary', icon: Clock },
      expired: { variant: 'outline', icon: XCircle },
      revoked: { variant: 'destructive', icon: XCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {consents.map((consent) => (
        <Card key={consent.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {consent.aspsp_name || consent.aspsp_id}
                </CardTitle>
                {consent.aspsp_bic && (
                  <CardDescription>{consent.aspsp_bic}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(consent.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Metadata */}
              <div className="text-sm text-muted-foreground space-y-1">
                {consent.valid_until && (
                  <p>
                    Gültig bis:{' '}
                    {formatDistance(new Date(consent.valid_until), new Date(), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </p>
                )}
                {consent.last_used_at && (
                  <p>
                    Zuletzt verwendet:{' '}
                    {formatDistance(new Date(consent.last_used_at), new Date(), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(consent.external_id)}
                  disabled={
                    syncAccounts.isPending ||
                    !['valid', 'authorized'].includes(consent.status)
                  }
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      syncAccounts.isPending ? 'animate-spin' : ''
                    }`}
                  />
                  Synchronisieren
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevoke(consent.external_id)}
                  disabled={revokeConsent.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
