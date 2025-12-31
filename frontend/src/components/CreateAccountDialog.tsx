import { useState } from 'react';
import { useCreateAccount } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CreateAccountDialogProps {
  onSuccess?: () => void;
}

export function CreateAccountDialog({ onSuccess }: CreateAccountDialogProps) {
  const { userId } = useUser();
  const { createAccount, loading, error } = useCreateAccount();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    iban: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const result = await createAccount({
      user_id: userId,
      name: formData.name,
      iban: formData.iban || undefined,
    });

    if (result) {
      setOpen(false);
      setFormData({ name: '', iban: '' });
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new account to track your finances.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Checking Account"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iban">IBAN (optional)</Label>
              <Input
                id="iban"
                placeholder="DE89 3704 0044 0532 0130 00"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
