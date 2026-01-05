import { useState } from 'react';
import { Plus, Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { Link } from 'react-router-dom';

interface Account {
  id: number;
  name: string;
  type: string;
  currency: string;
  iban?: string;
  account_product?: string;
  is_active: boolean;
  last_synced_at?: string;
  sync_enabled: boolean;
  bank_consent_id?: number;
}

export function AccountsPage() {
  const { data: accounts, isLoading, error, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      logger.debug('Fetching accounts');
      const response = await apiClient.get<Account[]>('accounts');
      return response;
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      checking: 'Girokonto',
      savings: 'Sparkonto',
      credit_card: 'Kreditkarte',
      investment: 'Depot',
      loan: 'Kredit',
      other: 'Sonstiges',
    };
    return labels[type] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      checking: 'bg-blue-100 text-blue-800',
      savings: 'bg-green-100 text-green-800',
      credit_card: 'bg-purple-100 text-purple-800',
      investment: 'bg-orange-100 text-orange-800',
      loan: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Lade Konten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-red-600">Fehler beim Laden der Konten</p>
          <Button onClick={() => refetch()} className="mt-4">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Konten</h1>
          <p className="text-muted-foreground mt-2">
            Übersicht deiner verbundenen Bankkonten
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Link to="/bank-connections">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Bank verbinden
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {!accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Noch keine Konten
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Verbinde deine erste Bank über PSD2
              </p>
              <div className="mt-6">
                <Link to="/bank-connections">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Bank verbinden
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aktive Konten
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accounts.filter((a) => a.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  von {accounts.length} gesamt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Synchronisiert
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accounts.filter((a) => a.sync_enabled).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sync aktiviert
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Währungen
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(accounts.map((a) => a.currency)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  verschiedene
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      {account.iban && (
                        <CardDescription className="font-mono text-xs">
                          {account.iban}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getAccountTypeColor(account.type)}
                      >
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                      {!account.is_active && (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      {account.account_product && (
                        <p className="text-muted-foreground">
                          Produkt: {account.account_product}
                        </p>
                      )}
                      {account.last_synced_at && (
                        <p className="text-muted-foreground">
                          Zuletzt synchronisiert:{' '}
                          {new Date(account.last_synced_at).toLocaleString(
                            'de-DE'
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {account.sync_enabled ? (
                        <Badge variant="outline" className="text-green-600">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sync aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Sync pausiert
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
