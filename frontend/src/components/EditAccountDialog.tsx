import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useInstitutions } from '@/lib/api/hooks';
import { apiClient } from '@/lib/api/client';
import type { Account } from '@/lib/api/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, AlertCircle } from 'lucide-react';
import { CreateInstitutionDialog } from './CreateInstitutionDialog';

interface EditAccountDialogProps {
  account: Account;
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
] as const;

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
] as const;

export function EditAccountDialog({ account, onSuccess }: EditAccountDialogProps) {
  const { userId } = useUser();
  const { institutions, loading: institutionsLoading, refetch: refetchInstitutions } = useInstitutions({ userId: userId! });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState(account.type);
  const [currency, setCurrency] = useState(account.currency);
  const [institutionId, setInstitutionId] = useState(account.institution_id?.toString() || '');

  // Reset form and refetch institutions when dialog opens
  useEffect(() => {
    if (open) {
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setInstitutionId(account.institution_id?.toString() || '');
      refetchInstitutions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !institutionId) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(`/accounts/${account.id}`, {
        account: {
          name: name.trim(),
          type,
          currency,
          institution_id: parseInt(institutionId),
          user_id: userId,
        },
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionCreated = () => {
    refetchInstitutions();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Checking, Savings Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="institution">Institution *</Label>
                <CreateInstitutionDialog compact onSuccess={handleInstitutionCreated} />
              </div>
              {institutionsLoading ? (
                <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
                  <span className="text-sm text-muted-foreground">Loading institutions...</span>
                </div>
              ) : institutions && institutions.length > 0 ? (
                <Select value={institutionId} onValueChange={setInstitutionId}>
                  <SelectTrigger id="institution">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    No institutions found. Please create one first.
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim() || !institutionId || institutions?.length === 0}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
