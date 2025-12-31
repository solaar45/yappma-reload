import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
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
      await apiClient.delete(`/accounts/${account.id}`);
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      
      // If account doesn't exist (404), treat as success
      if (err?.response?.status === 404) {
        console.log('Account already deleted, refreshing list');
        setOpen(false);
        onSuccess?.();
      } else {
        setError(err?.response?.data?.error || 'Failed to delete account. Please try again.');
      }
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
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
