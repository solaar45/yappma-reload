import { useState, useMemo } from 'react';
import { useBankConnections, useFetchAccounts, useSyncBalances } from '@/lib/api/hooks';
import { formatDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { AddBankConnectionDialog } from '@/components/bank/AddBankConnectionDialog';
import { BankAccountsList } from '@/components/bank/BankAccountsList';
import { SyncStatusIndicator } from '@/components/bank/SyncStatusIndicator';
import { ErrorDisplay } from '@/components/bank/ErrorDisplay';
import { Link2, RefreshCw, Search, Loader2, Download } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BankConnection, BankAccount } from '@/lib/api/types';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

export default function BankConnectionsPage() {
  const { data: connections, isLoading, error, refetch } = useBankConnections();
  const { mutateAsync: fetchAccounts, isPending: isFetching } = useFetchAccounts();
  const { mutateAsync: syncBalances, isPending: isSyncing } = useSyncBalances();
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchedAccounts, setFetchedAccounts] = useState<BankAccount[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<number | null>(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);

  const filteredConnections = useMemo(() => {
    if (!connections) return [];
    return connections.filter((conn) =>
      conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.blz.includes(searchTerm)
    );
  }, [connections, searchTerm]);

  const handleFetchAccounts = async (connectionId: number) => {
    try {
      setActiveConnectionId(connectionId);
      const result = await fetchAccounts(connectionId);
      
      if (result.success && result.accounts) {
        // Fetch full bank accounts from backend (with IDs)
        const response = await apiClient.get<{ data: BankAccount[] }>(
          `bank_accounts?bank_connection_id=${connectionId}`
        );
        const accounts = Array.isArray(response) ? response : (response?.data || []);
        setFetchedAccounts(accounts);
        logger.info('Bank accounts loaded', { count: accounts.length });
      }
    } catch (error) {
      logger.error('Failed to fetch accounts', { error });
    } finally {
      setActiveConnectionId(null);
    }
  };

  const handleSync = async (connectionId: number) => {
    try {
      setSyncingConnectionId(connectionId);
      await syncBalances(connectionId);
      await refetch();
      logger.info('Balances synced successfully');
    } catch (error) {
      logger.error('Failed to sync balances', { error });
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const columns: ColumnDef<BankConnection>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.name}</div>;
      },
    },
    {
      accessorKey: 'blz',
      header: ({ column }) => <DataTableColumnHeader column={column} title="BLZ" />,
      cell: ({ row }) => {
        return <div className="text-sm">{row.original.blz}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        return <SyncStatusIndicator connection={row.original} isLoading={syncingConnectionId === row.original.id} />;
      },
    },
    {
      accessorKey: 'last_sync_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Sync" />,
      cell: ({ row }) => {
        const lastSync = row.original.last_sync_at;
        if (!lastSync) {
          return <Badge variant="outline">Never</Badge>;
        }
        return <div className="text-sm">{formatDate(lastSync)}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const connection = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFetchAccounts(connection.id)}
              disabled={isFetching && activeConnectionId === connection.id}
            >
              {isFetching && activeConnectionId === connection.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSync(connection.id)}
              disabled={syncingConnectionId === connection.id}
            >
              {syncingConnectionId === connection.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bank Connections</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bank Connections</h1>
        </div>
        <ErrorDisplay error={error} title="Failed to load bank connections" />
        <Button onClick={refetch} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bank Connections</h1>
          <AddBankConnectionDialog onSuccess={refetch} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Link2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Bank Connections</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Connect your bank account via FinTS to automatically sync balances and transactions.
                </p>
              </div>
              <AddBankConnectionDialog onSuccess={refetch} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Bank Connections</h1>
          <Badge variant="secondary" className="text-base">
            {filteredConnections.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddBankConnectionDialog onSuccess={refetch} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <DataTable columns={columns} data={filteredConnections} />
          </CardContent>
        </Card>

        {fetchedAccounts.length > 0 && (
          <BankAccountsList
            accounts={fetchedAccounts}
            onMapped={() => {
              setFetchedAccounts([]);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
