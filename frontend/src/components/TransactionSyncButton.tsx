import React, { useState } from 'react';
import { useSyncTransactions } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionSyncButtonProps {
  accountId: number;
  consentId: string;
  accountName?: string;
  fromDate?: string;
  toDate?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TransactionSyncButton({
  accountId,
  consentId,
  accountName,
  fromDate,
  toDate,
  variant = 'outline',
  size = 'sm',
  className,
}: TransactionSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const syncMutation = useSyncTransactions();

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      const result = await syncMutation.mutateAsync({
        account_id: accountId,
        consent_id: consentId,
        from_date: fromDate,
        to_date: toDate,
      });

      if (result.success) {
        toast.success(
          `${result.transactions_synced} Transaktionen synchronisiert`,
          {
            description: accountName ? `für ${accountName}` : undefined,
            icon: <Check className="h-4 w-4" />,
          }
        );
      } else {
        toast.error('Synchronisation fehlgeschlagen', {
          description: result.error || 'Unbekannter Fehler',
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      toast.error('Synchronisation fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={syncing}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {size !== 'icon' && (
        <span className="ml-2">
          {syncing ? 'Synchronisiere...' : 'Transaktionen sync'}
        </span>
      )}
    </Button>
  );
}
