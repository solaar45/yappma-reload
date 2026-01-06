import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/lib/api/client';
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
import InstitutionLogo from '@/components/InstitutionLogo';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateInstitutionDialogProps {
  onSuccess?: () => void;
  compact?: boolean;
}

const INSTITUTION_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'broker', label: 'Broker' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
] as const;

const COUNTRIES = [
  { value: 'DE', label: 'Germany' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'other', label: 'Other' },
] as const;

export function CreateInstitutionDialog({ onSuccess, compact = false }: CreateInstitutionDialogProps) {
  const { userId } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('bank');
  const [website, setWebsite] = useState<string>('');
  const [country, setCountry] = useState<string>('DE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/institutions', {
        institution: {
          name: name.trim(),
          type,
            country,
            website: website ? website.trim() : undefined,
          user_id: userId,
        },
      });

      // Reset form
      setName('');
      setType('bank');
      setCountry('DE');
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create institution:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="sm" type="button">
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Institution
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Institution</DialogTitle>
            <DialogDescription>
              Create a new financial institution (bank, broker, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div>
                <InstitutionLogo name={name || 'Institution'} domain={website ? website.replace(/^https?:\/\//, '') : undefined} size="large" className="rounded-full" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Logo Preview (from logo.dev)</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., ING DiBa, Sparkasse"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                placeholder="e.g., dkb.de or https://dkb.de"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
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
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Institution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
