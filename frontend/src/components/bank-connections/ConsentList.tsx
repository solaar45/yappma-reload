import { useState } from 'react';
import { RefreshCw, Trash2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRevokeConsent, useSyncAccounts } from '@/lib/api/hooks/useBankConnections';
import { TransactionSyncButton } from '@/components/TransactionSyncButton';
import type { BankConsent } from '@/lib/api/types';
import { formatDistance, subMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface ConsentListProps {
  consents: BankConsent[];
}

interface LinkedAccount {
  id: number;
  name: string;
  external_id: string;
  iban?: string;
  currency: string;
}

export function ConsentList({ consents }: ConsentListProps) {
  const revokeConsent = useRevokeConsent();
  const syncAccounts = useSyncAccounts();
  const { refreshBankStatus } = useUser();
  const [expandedConsents, setExpandedConsents] = useState<Set<number>>(new Set());

  const handleSync = async (consentId: string, bankName: string) => {
    logger.info('Syncing consent', { consentId });
    
    const toastId = toast.loading(`Synchronisiere ${bankName}...`);
    
    try {
      const result = await syncAccounts.mutateAsync(consentId);
      logger.info('Sync completed', result);
      
      // Success toast with details
      const accountsCount = result.accounts_synced || 0;
      toast.success(
        `${bankName} erfolgreich synchronisiert`,
        {
          id: toastId,
          description: `${accountsCount} ${accountsCount === 1 ? 'Konto' : 'Konten'} aktualisiert`,
          duration: 5000,
        }
      );
      
      // Refresh bank status in UserContext
      await refreshBankStatus();
    } catch (error) {
      logger.error('Sync failed', error);
      
      // Error toast
      toast.error(
        `Fehler beim Synchronisieren von ${bankName}`,
        {
          id: toastId,
          description: error instanceof Error ? error.message : 'Unbekannter Fehler',
          duration: 7000,
        }
      );
    }
  };

  const handleRevoke = async (consentId: string, bankName: string) => {
    if (!confirm(`Möchtest du die Verbindung zu ${bankName} wirklich löschen?`)) {
      return;
    }
    
    logger.info('Revoking consent', { consentId });
    const toastId = toast.loading(`Lösche ${bankName}...`);
    
    try {
      await revokeConsent.mutateAsync(consentId);
      
      toast.success(
        `${bankName} erfolgreich gelöscht`,
        {
          id: toastId,
          duration: 4000,
        }
      );
      
      // Refresh bank status in UserContext
      await refreshBankStatus();
    } catch (error) {
      logger.error('Revoke failed', error);
      
      toast.error(
        `Fehler beim Löschen von ${bankName}`,
        {
          id: toastId,
          description: error instanceof Error ? error.message : 'Unbekannter Fehler',
          duration: 7000,
        }
      );
    }
  };

  const toggleConsent = (consentId: number) => {
    setExpandedConsents((prev) => {
      const next = new Set(prev);
      if (next.has(consentId)) {
        next.delete(consentId);
      } else {
        next.add(consentId);
      }
      return next;
    });
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

  // Hook to fetch linked accounts for a consent
  const useLinkedAccounts = (consentExternalId: string) => {
    return useQuery({
      queryKey: ['consent-accounts', consentExternalId],
      queryFn: async () => {
        const response = await apiClient.get<{ data: LinkedAccount[] }>(
          `bank-connections/consents/${consentExternalId}/accounts`
        );
        return Array.isArray(response) ? response : response.data || [];
      },
      enabled: !!consentExternalId,
    });
  };

  // Default date range: last 90 days
  const defaultFromDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
  const defaultToDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-4">
      {consents.map((consent) => {
        const bankName = consent.aspsp_name || consent.aspsp_id;
        const isExpanded = expandedConsents.has(consent.id);
        const { data: linkedAccounts, isLoading: accountsLoading } = useLinkedAccounts(consent.external_id);
        
        return (
          <Card key={consent.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {bankName}
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
                    onClick={() => handleSync(consent.external_id, bankName)}
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
                    Konten sync
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevoke(consent.external_id, bankName)}
                    disabled={revokeConsent.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </div>

                {/* Linked Accounts - Collapsible */}
                {linkedAccounts && linkedAccounts.length > 0 && (
                  <Collapsible open={isExpanded} onOpenChange={() => toggleConsent(consent.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4" />
                          Transaktionen synchronisieren ({linkedAccounts.length} {linkedAccounts.length === 1 ? 'Konto' : 'Konten'})
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-2">
                      {accountsLoading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Lade Konten...
                        </div>
                      ) : (
                        linkedAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                          >
                            <div>
                              <p className="font-medium text-sm">{account.name}</p>
                              {account.iban && (
                                <p className="text-xs text-muted-foreground">{account.iban}</p>
                              )}
                            </div>
                            <TransactionSyncButton
                              accountId={account.id}
                              consentId={consent.external_id}
                              accountName={account.name}
                              fromDate={defaultFromDate}
                              toDate={defaultToDate}
                              variant="outline"
                              size="sm"
                            />
                          </div>
                        ))
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
