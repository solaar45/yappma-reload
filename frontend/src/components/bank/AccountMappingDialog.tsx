import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAccounts } from '@/lib/api/hooks';
import { useBankAccountMapping } from '@/lib/api/hooks';
import { logger } from '@/lib/logger';
import { Loader2, Link2, Unlink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BankAccount } from '@/lib/api/types';

interface AccountMappingDialogProps {
  bankAccount: BankAccount;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function AccountMappingDialog({
  bankAccount,
  onSuccess,
  children,
}: AccountMappingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { mutate: mapAccount, isPending: isMapping } = useBankAccountMapping();

  // Initialize selected account when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedAccountId(bankAccount.account_id?.toString());
      setError(null);
    }
  }, [open, bankAccount.account_id]);

  const handleMap = () => {
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    const accountId = parseInt(selectedAccountId);

    mapAccount(
      {
        bankAccountId: bankAccount.id,
        accountId,
      },
      {
        onSuccess: () => {
          logger.info('Bank account mapped successfully');
          setOpen(false);
          onSuccess?.();
        },
        onError: (err) => {
          logger.error('Failed to map bank account', { error: err });
          setError(err instanceof Error ? err.message : 'Failed to map account');
        },
      }
    );
  };

  const handleUnmap = () => {
    mapAccount(
      {
        bankAccountId: bankAccount.id,
        accountId: null,
      },
      {
        onSuccess: () => {
          logger.info('Bank account unmapped successfully');
          setOpen(false);
          onSuccess?.();
        },
        onError: (err) => {
          logger.error('Failed to unmap bank account', { error: err });
          setError(err instanceof Error ? err.message : 'Failed to unmap account');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Bank Account</DialogTitle>
          <DialogDescription>
            Link {bankAccount.account_name} to one of your internal accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Bank Account</div>
              <div className="text-muted-foreground">
                {bankAccount.account_name} • {bankAccount.iban}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account">Link to Account</Label>
            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading accounts...
              </div>
            ) : (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({account.type}) - {account.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {bankAccount.account_id && (
            <Alert>
              <AlertDescription>
                Currently linked to: <strong>{bankAccount.account?.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          {bankAccount.account_id && (
            <Button variant="outline" onClick={handleUnmap} disabled={isMapping}>
              {isMapping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink
                </>
              )}
            </Button>
          )}
          <Button onClick={handleMap} disabled={isMapping || isLoadingAccounts}>
            {isMapping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Link Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
