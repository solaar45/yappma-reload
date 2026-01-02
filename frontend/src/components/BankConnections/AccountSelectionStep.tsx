import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';
import {
  listAccounts,
  syncAccounts,
  type BankAccount,
} from '../../lib/api/bankConnections';

interface AccountSelectionStepProps {
  consentId: string;
  onComplete: () => void;
  onBack: () => void;
}

export function AccountSelectionStep({
  consentId,
  onComplete,
  onBack,
}: AccountSelectionStepProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [consentId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await listAccounts(consentId);
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError('Konten konnten nicht geladen werden');
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await syncAccounts(consentId);
      onComplete();
    } catch (err) {
      setError('Synchronisierung fehlgeschlagen');
      console.error('Failed to sync accounts:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-gray-600 dark:text-gray-400">
          Lade Konten...
        </p>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Zurück
          </button>
          <button
            onClick={loadAccounts}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="text-sm text-green-900 dark:text-green-100">
          <p className="font-medium">Autorisierung erfolgreich!</p>
          <p>Die folgenden Konten werden synchronisiert:</p>
        </div>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.resource_id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {account.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {account.iban}
                </p>
              </div>
              {account.balance && (
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {account.balance.amount.toFixed(2)} {account.balance.currency}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aktueller Saldo
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>
          YAPPMA wird Ihre Kontostände und Transaktionen der letzten 90 Tage
          importieren. Zukünftige Transaktionen werden automatisch
          synchronisiert.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={syncing}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Zurück
        </button>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Synchronisiere...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Konten importieren</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
