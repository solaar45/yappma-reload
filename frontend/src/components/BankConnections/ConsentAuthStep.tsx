import React, { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import {
  initiateConsent,
  getConsentStatus,
  type Bank,
} from '../../lib/api/bankConnections';

interface ConsentAuthStepProps {
  bank: Bank;
  onAuthorized: (consentId: string) => void;
  onBack: () => void;
}

export function ConsentAuthStep({
  bank,
  onAuthorized,
  onBack,
}: ConsentAuthStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const handleInitiateConsent = async () => {
    try {
      setLoading(true);
      setError(null);

      const redirectUrl = `${window.location.origin}/bank-callback`;
      const response = await initiateConsent(bank.aspsp_id, redirectUrl);

      setConsentId(response.consent_id);
      setAuthUrl(response.authorization_url);

      // Open authorization URL in new window
      window.open(
        response.authorization_url,
        'bank-auth',
        'width=600,height=800'
      );

      // Start polling for consent status
      startPolling(response.consent_id);
    } catch (err) {
      setError('Consent konnte nicht erstellt werden');
      console.error('Failed to initiate consent:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const status = await getConsentStatus(id);
        if (status.status === 'valid') {
          clearInterval(interval);
          setPolling(false);
          onAuthorized(id);
        } else if (status.status === 'rejected' || status.status === 'expired') {
          clearInterval(interval);
          setPolling(false);
          setError('Autorisierung fehlgeschlagen oder abgelaufen');
        }
      } catch (err) {
        console.error('Failed to check consent status:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 300000);
  };

  return (
    <div className="space-y-6">
      {/* Bank Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        {bank.logo_url && (
          <img
            src={bank.logo_url}
            alt={bank.name}
            className="w-16 h-16 object-contain"
          />
        )}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {bank.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sie werden zur Bank weitergeleitet, um den Zugriff zu autorisieren
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Was passiert als Nächstes?
        </h4>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="font-semibold">1.</span>
            <span>
              Sie werden in einem neuen Fenster zur {bank.name} Website
              weitergeleitet
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">2.</span>
            <span>Melden Sie sich mit Ihren Banking-Zugangsdaten an</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">3.</span>
            <span>
              Bestätigen Sie den Zugriff auf Ihre Kontodaten (nur Lesezugriff)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">4.</span>
            <span>
              Nach der Bestätigung werden Sie automatisch zurückgeleitet
            </span>
          </li>
        </ol>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium mb-1">Sicher & Verschlüsselt</p>
          <p>
            YAPPMA speichert keine Banking-Zugangsdaten. Die Verbindung erfolgt
            über die sichere PSD2-Schnittstelle Ihrer Bank.
          </p>
        </div>
      </div>

      {/* Status */}
      {polling && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
          <span className="text-sm text-yellow-900 dark:text-yellow-100">
            Warte auf Autorisierung...
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-900 dark:text-red-100">
            {error}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Zurück
        </button>
        <button
          onClick={handleInitiateConsent}
          disabled={loading || polling}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Initialisiere...</span>
            </>
          ) : polling ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Warte auf Autorisierung...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              <span>Zur Bank-Autorisierung</span>
            </>
          )}
        </button>
      </div>

      {authUrl && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Fenster nicht geöffnet?{' '}
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Hier klicken
          </a>
        </p>
      )}
    </div>
  );
}
