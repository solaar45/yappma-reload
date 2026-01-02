import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, RefreshCw } from 'lucide-react';

export default function BankConnectionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Bank Connections</h1>
          <Badge variant="secondary" className="text-base">
            FinTS
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button disabled>
            <Link2 className="h-4 w-4 mr-2" />
            Add connection
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Phase 2A – In progress</h3>
              <p className="text-sm text-muted-foreground">
                Diese Seite ist das Frontend-MVP für FinTS Bankverbindungen (anlegen, Accounts mappen, manueller Sync).
              </p>
            </div>

            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Liste BankConnections (GET /api/bank_connections)</li>
              <li>Verbindung testen (POST /api/bank_connections/test)</li>
              <li>Accounts laden (POST /api/bank_connections/:id/fetch_accounts)</li>
              <li>Accounts verknüpfen (POST /api/bank_accounts/:id/link)</li>
              <li>Manueller Sync (POST /api/bank_connections/:id/sync_balances)</li>
            </ul>

            <p className="text-sm text-muted-foreground">
              Nächster Commit füllt diese UI mit echten Komponenten (Dialoge, Tabellen, Status/Errors) und nutzt den bestehenden API-Client.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
