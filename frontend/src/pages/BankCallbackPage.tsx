import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { completeConsent } from '../lib/api/bankConnections';

/**
 * Bank OAuth Callback Page
 * 
 * This page handles the redirect from the bank after user authorization.
 * It completes the consent flow and redirects to the accounts page.
 * 
 * Expected query parameters:
 * - consent_id: The consent ID from the initiate step
 * - code: Authorization code (optional, depends on bank)
 * - state: State parameter for CSRF protection (optional)
 */
export function BankCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const consentId = searchParams.get('consent_id');
    const authCode = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for errors from bank
    if (error) {
      setStatus('error');
      setMessage(
        `Autorisierung fehlgeschlagen: ${searchParams.get('error_description') || error}`
      );
      return;
    }

    // Check if consent_id is present
    if (!consentId) {
      setStatus('error');
      setMessage('Ungültiger Callback: Consent ID fehlt');
      return;
    }

    try {
      // Complete consent with backend
      await completeConsent(consentId, authCode || undefined);
      
      setStatus('success');
      setMessage('Bank erfolgreich verbunden!');
      
      // Redirect to accounts page after 2 seconds
      setTimeout(() => {
        navigate('/accounts');
      }, 2000);
    } catch (err) {
      console.error('Failed to complete consent:', err);
      setStatus('error');
      setMessage('Fehler beim Abschließen der Autorisierung');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verarbeite Autorisierung...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Bitte warten Sie einen Moment
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {message}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sie werden weitergeleitet...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Fehler
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/accounts')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Zurück zu Konten
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
