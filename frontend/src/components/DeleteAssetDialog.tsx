import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Asset } from '@/lib/api/types';
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

interface DeleteAssetDialogProps {
  asset: Asset;
  onSuccess?: () => void;
}

export function DeleteAssetDialog({ asset, onSuccess }: DeleteAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Deleting asset', { assetId: asset.id, name: asset.name });
      
      await apiClient.delete(`assets/${asset.id}`);
      
      logger.info('Asset deleted successfully', { assetId: asset.id });
      
      // Close dialog first
      setOpen(false);
      
      // Then trigger refetch
      if (onSuccess) {
        logger.debug('Triggering refetch after asset delete');
        onSuccess();
      }
    } catch (err: any) {
      logger.error('Failed to delete asset', { error: err, assetId: asset.id });
      
      // If asset doesn't exist (404), treat as success since it's already deleted
      if (err?.status === 404) {
        logger.info('Asset already deleted (404), treating as success');
        setOpen(false);
        onSuccess?.();
        return;
      }
      
      // Show error message for other errors
      const errorMessage = err?.data?.error || err?.message || 'Failed to delete asset. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              This will permanently delete <strong>{asset.name}</strong> and all associated snapshots.
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
