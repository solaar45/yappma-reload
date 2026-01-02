import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, CheckCircle2 } from 'lucide-react';
import type { BankAccount } from '@/lib/api/types';
import { AccountMappingDialog } from './AccountMappingDialog';

interface BankAccountsListProps {
  accounts: BankAccount[];
  onMapped?: () => void;
}

export function BankAccountsList({ accounts, onMapped }: BankAccountsListProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No bank accounts found. Try fetching accounts from the connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const linkedCount = accounts.filter((a) => a.account_id).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
        <CardDescription>
          {accounts.length} account{accounts.length === 1 ? '' : 's'} found. {linkedCount} linked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{account.account_name}</div>
                  {account.account_id && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {account.iban} • {account.bank_name}
                </div>
                {account.account && (
                  <div className="text-sm text-muted-foreground">
                    Linked to: <span className="font-medium text-foreground">{account.account.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AccountMappingDialog bankAccount={account} onSuccess={onMapped}>
                  {account.account_id ? (
                    <Button variant="ghost" size="sm">
                      Edit Link
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Link2 className="h-4 w-4 mr-2" />
                      Link Account
                    </Button>
                  )}
                </AccountMappingDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
