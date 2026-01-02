import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useAccounts, useAssets } from '@/lib/api/hooks';
import { apiClient, ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditSnapshotDialog } from './EditSnapshotDialog';
import { Plus } from 'lucide-react';
import type { CombinedSnapshot } from '@/lib/api/hooks/useSnapshots';

interface CreateSnapshotDialogProps {
  onSuccess?: () => void;
}

export function CreateSnapshotDialog({ onSuccess }: CreateSnapshotDialogProps) {
  const { userId } = useUser();
  const { accounts } = useAccounts({ userId: userId! });
  const { assets } = useAssets({ userId: userId! });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshotType, setSnapshotType] = useState<'account' | 'asset'>('account');
  const [formData, setFormData] = useState({
    entity_id: '',
    snapshot_date: new Date().toISOString().split('T')[0],
    value: '',
    currency: 'EUR',
    quantity: '',
  });
  
  // Duplicate handling state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingSnapshot, setExistingSnapshot] = useState<CombinedSnapshot | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entity_id || !formData.value) {
      return;
    }

    setLoading(true);

    try {
      if (snapshotType === 'account') {
        // Account snapshot
        const payload = {
          account_snapshot: {
            account_id: parseInt(formData.entity_id),
            balance: parseFloat(formData.value),
            currency: formData.currency,
            snapshot_date: formData.snapshot_date,
            source: 'manual',
          },
        };
        await apiClient.post('/snapshots', payload);
      } else {
        // Asset snapshot
        const payload = {
          asset_snapshot: {
            asset_id: parseInt(formData.entity_id),
            value: parseFloat(formData.value),
            quantity: formData.quantity ? parseFloat(formData.quantity) : null,
            snapshot_date: formData.snapshot_date,
          },
        };
        await apiClient.post('/asset_snapshots', payload);
      }

      // Success - close dialog and reset
      setOpen(false);
      setFormData({
        entity_id: '',
        snapshot_date: new Date().toISOString().split('T')[0],
        value: '',
        currency: 'EUR',
        quantity: '',
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to create snapshot:', err);
      
      // Check if it's an ApiError with 422 status
      if (err instanceof ApiError && err.status === 422) {
        const errorData = err.data as any;
        console.log('Error data:', errorData);
        
        // Check for error_type === 'duplicate' or constraint name contains snapshot unique index
        const isDuplicate = 
          errorData?.error_type === 'duplicate' ||
          (errorData?.constraint && (
            errorData.constraint.includes('snapshot') && 
            errorData.constraint.includes('date')
          ));
        
        if (isDuplicate) {
          console.log('Duplicate snapshot detected, fetching existing...');
          await fetchExistingSnapshot();
        } else {
          console.error('Validation error (not duplicate):', errorData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingSnapshot = async () => {
    try {
      console.log('Fetching existing snapshot for entity:', formData.entity_id, 'date:', formData.snapshot_date);
      
      // Fetch all snapshots for this entity
      let response;
      if (snapshotType === 'account') {
        response = await apiClient.get(`/accounts/${formData.entity_id}`);
      } else {
        response = await apiClient.get(`/assets/${formData.entity_id}`);
      }

      const entity = response as any;
      const snapshots = entity.snapshots || [];
      
      console.log('Found snapshots:', snapshots);
      
      // Find the snapshot for this date
      const existing = snapshots.find(
        (s: any) => s.snapshot_date === formData.snapshot_date
      );

      console.log('Existing snapshot:', existing);

      if (existing) {
        const entityName = entity.name;
        setExistingSnapshot({
          ...existing,
          snapshot_type: snapshotType,
          entity_name: entityName,
        } as CombinedSnapshot);
        setShowDuplicateDialog(true);
      } else {
        console.error('Could not find existing snapshot for date:', formData.snapshot_date);
      }
    } catch (err) {
      console.error('Failed to fetch existing snapshot:', err);
    }
  };

  const handleEditExisting = () => {
    setShowDuplicateDialog(false);
    setOpen(false);
    // Small delay to let dialogs close before opening edit
    setTimeout(() => {
      setShowEditDialog(true);
    }, 100);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setFormData({
      entity_id: '',
      snapshot_date: new Date().toISOString().split('T')[0],
      value: '',
      currency: 'EUR',
      quantity: '',
    });
    onSuccess?.();
  };

  const entities = snapshotType === 'account' ? accounts : assets;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Snapshot
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Snapshot</DialogTitle>
              <DialogDescription>
                Record a balance or value at a specific point in time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Snapshot Type *</Label>
                <Select 
                  value={snapshotType} 
                  onValueChange={(value: 'account' | 'asset') => {
                    setSnapshotType(value);
                    setFormData({ ...formData, entity_id: '' });
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="entity">
                  {snapshotType === 'account' ? 'Account' : 'Asset'} *
                </Label>
                <Select 
                  value={formData.entity_id} 
                  onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                >
                  <SelectTrigger id="entity">
                    <SelectValue placeholder={`Select ${snapshotType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {entities?.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.snapshot_date}
                  onChange={(e) => setFormData({ ...formData, snapshot_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">
                  {snapshotType === 'account' ? 'Balance' : 'Value'} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              {snapshotType === 'account' && (
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {snapshotType === 'asset' && (
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity (optional)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., number of shares"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.entity_id || !formData.value}>
                {loading ? 'Creating...' : 'Create Snapshot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Snapshot Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A snapshot for <strong>{existingSnapshot?.entity_name}</strong> on{' '}
              <strong>{existingSnapshot?.snapshot_date}</strong> already exists.
              <br /><br />
              Would you like to edit the existing snapshot instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEditExisting}>
              Edit Existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog (triggered when user chooses to edit) */}
      {existingSnapshot && showEditDialog && (
        <EditSnapshotDialog
          snapshot={existingSnapshot}
          onSuccess={handleEditSuccess}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </>
  );
}
