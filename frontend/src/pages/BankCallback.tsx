import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { completeConsent } from '../lib/api/bankConnections';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function BankCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const consentId = searchParams.get('consent_id');
      const authCode = searchParams.get('code');
      const mockStatus = searchParams.get('status');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Fehler: ${error}`);
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!consentId) {
        setStatus('error');
        setMessage('Keine Consent-ID gefunden');
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      // Handle mock consent (when Styx is not running)
      if (mockStatus === 'authorized' && consentId.startsWith('mock-consent-')) {
        setStatus('success');
        setMessage('Mock-Autorisierung erfolgreich!');
        
        // Notify parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'BANK_AUTH_SUCCESS',
              consentId,
              mock: true,
            },
            window.location.origin
          );
        }
        
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      // Handle real consent completion
      try {
        await completeConsent(consentId, authCode || undefined);
        setStatus('success');
        setMessage('Autorisierung erfolgreich!');

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'BANK_AUTH_SUCCESS',
              consentId,
            },
            window.location.origin
          );
        }

        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (err) {
        setStatus('error');
        setMessage('Fehler beim Abschließen der Autorisierung');
        console.error('Failed to complete consent:', err);

        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verarbeite Autorisierung...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Bitte warten Sie einen Moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Erfolgreich!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Dieses Fenster schließt sich automatisch...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fehler
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Dieses Fenster schließt sich automatisch...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
