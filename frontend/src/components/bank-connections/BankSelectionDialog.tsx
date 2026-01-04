import { useState } from 'react';
import { Search, Building2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBanks, useCreateConsent } from '@/lib/api/hooks/useBankConnections';
import type { Bank } from '@/lib/api/types';
import { logger } from '@/lib/logger';

interface BankSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankSelectionDialog({ open, onOpenChange }: BankSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: banks, isLoading } = useBanks();
  const createConsent = useCreateConsent();

  // Defensive: Ensure banks is an array
  const banksList = Array.isArray(banks) ? banks : [];

  const filteredBanks = banksList.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = async (bank: Bank) => {
    logger.info('Bank selected', { bank: bank.name });
    
    try {
      const redirectUrl = `${window.location.origin}/bank-callback`;
      const result = await createConsent.mutateAsync({
        aspspId: bank.aspsp_id,
        redirectUrl,
      });

      // Redirect to bank authorization
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      logger.error('Failed to initiate consent', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bank auswählen</DialogTitle>
          <DialogDescription>
            Wähle deine Bank aus, um eine sichere Verbindung herzustellen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Bank suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Bank List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Lade Banken...
              </div>
            ) : filteredBanks.length > 0 ? (
              <div className="space-y-2">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.aspsp_id}
                    onClick={() => handleBankSelect(bank)}
                    disabled={createConsent.isPending}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex-shrink-0">
                      {bank.logo_url ? (
                        <img
                          src={bank.logo_url}
                          alt={bank.name}
                          className="w-12 h-12 rounded object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{bank.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {bank.bic}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {banksList.length === 0 ? 'Keine Banken verfügbar' : 'Keine Banken gefunden'}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
