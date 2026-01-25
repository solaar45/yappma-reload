import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AdminUser } from '@/lib/api/admin';
import { getRoleDisplayName } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';

interface UserEditDialogProps {
  user: AdminUser | null;
  onSave: ((userId: number, updates: any) => Promise<void>) | ((userData: any) => Promise<void>);
  onClose: () => void;
}

export function UserEditDialog({ user, onSave, onClose }: UserEditDialogProps) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const isCreate = !user;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    is_active: user?.is_active ?? true,
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password: '',
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('admin.users.errors.nameRequired' as any);
    }

    if (!formData.email.trim()) {
      newErrors.email = t('admin.users.errors.emailRequired' as any);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.users.errors.emailInvalid' as any);
    }

    if (isCreate && !formData.password) {
      newErrors.password = t('admin.users.errors.passwordRequired' as any);
    }

    if (isCreate && formData.password && formData.password.length < 16) {
      newErrors.password = t('admin.users.errors.passwordTooShort' as any);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      if (isCreate) {
        await (onSave as (userData: any) => Promise<void>)({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      } else if (user) {
        await (onSave as (userId: number, updates: any) => Promise<void>)(user.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
        });
      }
    } catch (error) {
      // Error is handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isCreate
                ? t('admin.users.createUser')
                : t('admin.users.editUser' as any)}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? t('admin.users.createUserDescription' as any)
                : t('admin.users.editUserDescription' as any)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('admin.users.name' as any)} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('admin.users.namePlaceholder' as any)}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                {t('admin.users.email' as any)} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {isCreate && (
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {t('admin.users.password' as any)} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('admin.users.passwordPlaceholder' as any)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.users.passwordRequirements' as any)}
                </p>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">
                {t('admin.users.role' as any)}
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t(getRoleDisplayName('user') as any)}</SelectItem>
                  {currentUser?.role === 'super_admin' && (
                    <SelectItem value="admin">{t(getRoleDisplayName('admin') as any)}</SelectItem>
                  )}
                  <SelectItem value="read_only">{t(getRoleDisplayName('read_only') as any)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isCreate && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">
                    {t('admin.users.active' as any)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.users.activeDescription' as any)}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? t('common.saving')
                : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
