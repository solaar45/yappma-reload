import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConsents } from '@/lib/api/hooks/useBankConnections';
import { BankSelectionDialog } from '@/components/bank-connections/BankSelectionDialog';
import { ConsentList } from '@/components/bank-connections/ConsentList';
import { logger } from '@/lib/logger';

export function BankConnectionsPage() {
  const [showBankSelection, setShowBankSelection] = useState(false);
  const { data: consents, isLoading, error } = useConsents();

  logger.debug('BankConnectionsPage render', { consentsCount: consents?.length });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bankverbindungen</h1>
          <p className="text-muted-foreground mt-2">
            Verbinde deine Bankkonten über PSD2 für automatische Synchronisation
          </p>
        </div>
        <Button onClick={() => setShowBankSelection(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Bank verbinden
        </Button>
      </div>

      {/* Active Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Verbundene Banken</CardTitle>
          <CardDescription>
            Verwalte deine aktiven Bankverbindungen und synchronisiere Kontodaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Lade Verbindungen...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Fehler beim Laden der Verbindungen
            </div>
          ) : consents && consents.length > 0 ? (
            <ConsentList consents={consents} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Noch keine Bankverbindungen</p>
              <Button onClick={() => setShowBankSelection(true)} variant="outline">
                Erste Bank verbinden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Selection Dialog */}
      <BankSelectionDialog
        open={showBankSelection}
        onOpenChange={setShowBankSelection}
      />
    </div>
  );
}
