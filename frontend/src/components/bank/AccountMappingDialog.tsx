import { useState, ReactNode } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts, useLinkAccount } from '@/lib/api/hooks';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';
import type { BankAccount } from '@/lib/api/types';
import { ErrorDisplay } from './ErrorDisplay';

interface AccountMappingDialogProps {
  bankAccount: BankAccount;
  children: ReactNode;
  onSuccess?: () => void;
}

export function AccountMappingDialog({ bankAccount, children, onSuccess }: AccountMappingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const { accounts, isLoading: loadingAccounts, error: accountsError } = useAccounts();
  const { linkAccount, isLoading: isLinking, error: linkError } = useLinkAccount();

  const handleLink = async () => {
    if (!selectedAccountId) return;

    try {
      await linkAccount(bankAccount.id, { account_id: parseInt(selectedAccountId) });
      logger.info('Account linked successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Failed to link account', { error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Bank Account</DialogTitle>
          <DialogDescription>
            Connect {bankAccount.account_name} ({bankAccount.iban}) to an internal account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {accountsError && <ErrorDisplay error={accountsError} title="Failed to load accounts" />}
          {linkError && <ErrorDisplay error={linkError} title="Failed to link account" />}

          <div className="grid gap-2">
            <Label htmlFor="account">Internal Account</Label>
            {loadingAccounts ? (
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
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleLink}
            disabled={!selectedAccountId || isLinking || loadingAccounts}
          >
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              'Link Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
