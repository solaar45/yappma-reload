import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  account: Account;
  onSuccess?: () => void;
}

export function DeleteAccountDialog({ account, onSuccess }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Deleting account', { accountId: account.id, name: account.name });
      
      await apiClient.delete(`accounts/${account.id}`);
      
      logger.info('Account deleted successfully', { accountId: account.id });
      
      // Close dialog first
      setOpen(false);
      
      // Then trigger refetch
      if (onSuccess) {
        logger.debug('Triggering refetch after account delete');
        onSuccess();
      }
    } catch (err: any) {
      logger.error('Failed to delete account', { error: err, accountId: account.id });
      
      // If account doesn't exist (404), treat as success
      if (err?.status === 404) {
        logger.info('Account already deleted (404), treating as success');
        setOpen(false);
        onSuccess?.();
        return;
      }
      
      const errorMessage = err?.data?.error || err?.message || 'Failed to delete account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const snapshotCount = account.snapshots?.length || 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{account.name}</strong>
              {snapshotCount > 0 && (
                <span>
                  {' '}and all <strong>{snapshotCount}</strong> associated snapshot{snapshotCount !== 1 ? 's' : ''}
                </span>
              )}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
