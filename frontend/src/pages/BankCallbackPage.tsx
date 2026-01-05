import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export function BankCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verarbeite Autorisierung...');

  useEffect(() => {
    const consentId = searchParams.get('consent_id');
    const authStatus = searchParams.get('status');

    logger.info('Bank callback received', { consentId, authStatus });

    if (!consentId) {
      setStatus('error');
      setMessage('Keine Consent-ID gefunden');
      return;
    }

    // Complete the consent
    const completeConsent = async () => {
      try {
        await apiClient.bankConnections.completeConsent(consentId);
        
        setStatus('success');
        setMessage('Autorisierung erfolgreich!');
        
        logger.info('Consent completed successfully', { consentId });
        
        // Redirect to bank connections page after 2 seconds
        setTimeout(() => {
          navigate('/bank-connections', { replace: true });
        }, 2000);
      } catch (error) {
        logger.error('Failed to complete consent', error);
        setStatus('error');
        setMessage('Fehler beim Abschließen der Autorisierung');
        
        // Redirect anyway after 3 seconds
        setTimeout(() => {
          navigate('/bank-connections', { replace: true });
        }, 3000);
      }
    };

    completeConsent();
  }, [searchParams, navigate]);

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'processing' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                Verarbeite...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Erfolgreich!
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                Fehler
              </>
            )}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Du wirst automatisch weitergeleitet...
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-muted-foreground">
              Du wirst zurück zu den Bankverbindungen geleitet...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
