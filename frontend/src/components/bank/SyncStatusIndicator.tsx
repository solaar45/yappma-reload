import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import type { BankConnection } from '@/lib/api/types';

interface SyncStatusIndicatorProps {
  connection: BankConnection;
  isLoading?: boolean;
}

export function SyncStatusIndicator({ connection, isLoading }: SyncStatusIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-600">Syncing...</span>
      </div>
    );
  }

  if (connection.status === 'error') {
    return (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-destructive" />
        <Badge variant="destructive">Error</Badge>
      </div>
    );
  }

  if (connection.status === 'inactive') {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">Inactive</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <Badge variant="outline" className="text-green-600 border-green-600">
        Active
      </Badge>
    </div>
  );
}
