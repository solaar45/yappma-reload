import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Institution } from '@/lib/api/types';
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
import { Pencil } from 'lucide-react';

interface EditInstitutionDialogProps {
  institution: Institution;
  onSuccess?: () => void;
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

export function EditInstitutionDialog({ institution, onSuccess }: EditInstitutionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(institution.name);
  const [type, setType] = useState(institution.type);
  const [country, setCountry] = useState(institution.country);
  const [website, setWebsite] = useState(institution.website || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(`/institutions/${institution.id}`, {
        institution: {
          name: name.trim(),
          type,
          country,
          website: website ? website.trim() : undefined,
        },
      });

      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update institution:', err);
    } finally {
      setLoading(false);
    }
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
            <DialogTitle>Edit Institution</DialogTitle>
            <DialogDescription>
              Update the institution details.
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
              <Label htmlFor="name" required>Name</Label>
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
              <Label htmlFor="type" required>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as any)}
              >
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
              <Label htmlFor="country" required>Country</Label>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
