import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api/client';

interface ErrorDisplayProps {
  error: Error | ApiError;
  title?: string;
}

export function ErrorDisplay({ error, title = 'Error' }: ErrorDisplayProps) {
  const getErrorMessage = () => {
    if (error instanceof ApiError) {
      if (error.data && typeof error.data === 'object') {
        const data = error.data as { message?: string; error?: string; errors?: Record<string, string[]> };
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.errors) {
          return Object.entries(data.errors)
            .map(([key, messages]) => `${key}: ${messages.join(', ')}`)
            .join('; ');
        }
      }
      return error.statusText;
    }
    return error.message;
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{getErrorMessage()}</AlertDescription>
    </Alert>
  );
}
