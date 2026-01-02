import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
        <CardDescription>
          {accounts.length} account{accounts.length === 1 ? '' : 's'} found. Link them to your internal accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{account.account_name}</div>
                <div className="text-sm text-muted-foreground">
                  {account.iban} • {account.bank_name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.account_id ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Linked
                  </Badge>
                ) : (
                  <AccountMappingDialog bankAccount={account} onSuccess={onMapped}>
                    <Button variant="outline" size="sm">
                      <Link2 className="h-4 w-4 mr-2" />
                      Link Account
                    </Button>
                  </AccountMappingDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
