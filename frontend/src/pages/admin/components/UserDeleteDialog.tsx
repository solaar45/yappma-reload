import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin';

interface UserDeleteDialogProps {
  user: AdminUser;
  onDelete: (userId: number) => Promise<void>;
  onClose: () => void;
}

export function UserDeleteDialog({ user, onDelete, onClose }: UserDeleteDialogProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(user.id);
    } catch (error) {
      // Error is handled by parent
    } finally {
      setDeleting(false);
    }
  };

  const isConfirmed = confirmText === user.email;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('admin.users.deleteUser', { defaultValue: 'Benutzer löschen' })}
          </DialogTitle>
          <DialogDescription>
            {t('admin.users.deleteUserFor', { name: user.name, defaultValue: `${user.name} löschen` })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('admin.users.deleteWarning', { defaultValue: 'Warnung: Diese Aktion kann NICHT rückgängig gemacht werden!' })}</strong>
              <div className="mt-2 text-sm">
                {t('admin.users.deleteWarningDetails', {
                  defaultValue: 'Alle Daten dieses Benutzers werden permanent gelöscht:'
                })}
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">
                {t('admin.users.accounts', { defaultValue: 'Konten' })}:
              </span>
              <span className="font-medium">{user.stats?.accounts_count || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">
                {t('admin.users.assets', { defaultValue: 'Assets' })}:
              </span>
              <span className="font-medium">{user.stats?.assets_count || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">
                {t('admin.users.institutions', { defaultValue: 'Institutionen' })}:
              </span>
              <span className="font-medium">{user.stats?.institutions_count || 0}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              {t('admin.users.confirmDelete', { defaultValue: 'Gib zur Bestätigung die E-Mail-Adresse ein' })}:
            </Label>
            <div className="space-y-1">
              <code className="block px-3 py-2 bg-muted rounded text-sm">{user.email}</code>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={user.email}
                autoComplete="off"
              />
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              {t('admin.users.deleteAlternative', {
                defaultValue: 'Hinweis: Du kannst den Benutzer auch deaktivieren statt zu löschen. Dabei bleiben alle Daten erhalten.'
              })}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
          >
            {deleting ? (
              t('admin.users.deleting', { defaultValue: 'Löschen...' })
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin.users.deleteButton', { defaultValue: 'Permanent löschen' })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
