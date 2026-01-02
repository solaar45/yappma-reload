import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTestConnection } from '@/lib/api/hooks';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { Link2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddBankConnectionDialogProps {
  onSuccess?: () => void;
}

export function AddBankConnectionDialog({ onSuccess }: AddBankConnectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [blz, setBlz] = useState('');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [fintsUrl, setFintsUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { testConnection, isLoading: isTesting } = useTestConnection();

  const handleTest = async () => {
    if (!blz || !userId || !pin || !fintsUrl) {
      setTestResult({ success: false, message: 'Please fill all fields' });
      return;
    }

    try {
      const result = await testConnection({
        blz,
        user_id: userId,
        pin,
        fints_url: fintsUrl,
      });

      setTestResult({
        success: result.success,
        message: result.success
          ? `Connection successful! Found ${result.account_count} account(s).`
          : result.error || 'Connection failed',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  const handleCreate = async () => {
    if (!name || !blz || !userId || !pin || !fintsUrl) {
      setTestResult({ success: false, message: 'Please fill all fields' });
      return;
    }

    setIsCreating(true);
    try {
      await apiClient.post('bank_connections', {
        bank_connection: {
          name,
          blz,
          user_id_fints: userId,
          pin_encrypted: pin, // Backend will encrypt
          fints_url: fintsUrl,
          user_id: 1, // TODO: Get from user context
        },
      });

      logger.info('Bank connection created');
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      logger.error('Failed to create connection', { error });
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create connection',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBlz('');
    setUserId('');
    setPin('');
    setFintsUrl('');
    setTestResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Link2 className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Bank Connection</DialogTitle>
          <DialogDescription>
            Connect your bank account via FinTS to automatically sync balances.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="e.g., DKB Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="blz">BLZ (Bank Code)</Label>
            <Input
              id="blz"
              placeholder="e.g., 12030000"
              value={blz}
              onChange={(e) => setBlz(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Your bank user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="Your online banking PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fintsUrl">FinTS URL</Label>
            <Input
              id="fintsUrl"
              placeholder="https://banking-dkb.s-fints-pt-dkb.de/fints30"
              value={fintsUrl}
              onChange={(e) => setFintsUrl(e.target.value)}
            />
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={isTesting || isCreating}>
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isTesting || isCreating || !testResult?.success}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Connection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
