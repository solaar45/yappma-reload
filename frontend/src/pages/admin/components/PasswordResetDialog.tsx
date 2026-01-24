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
import { Key, Copy, Check, AlertTriangle } from 'lucide-react';
import type { AdminUser } from '@/lib/api/admin';

interface PasswordResetDialogProps {
  user: AdminUser;
  onReset: (userId: number, newPassword: string) => Promise<void>;
  onClose: () => void;
}

export function PasswordResetDialog({ user, onReset, onClose }: PasswordResetDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'generate' | 'manual'>('generate');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [manualPassword, setManualPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSecurePassword = () => {
    const length = 20;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setMode('generate');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateManualPassword = (password: string) => {
    const newErrors: Record<string, string> = {};

    if (password.length < 16) {
      newErrors.password = t('admin.users.errors.passwordTooShort', {
        defaultValue: 'Passwort muss mindestens 16 Zeichen lang sein'
      });
    }

    if (!/[a-z]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoLowercase', {
        defaultValue: 'Passwort muss einen Kleinbuchstaben enthalten'
      });
    }

    if (!/[A-Z]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoUppercase', {
        defaultValue: 'Passwort muss einen Großbuchstaben enthalten'
      });
    }

    if (!/[0-9]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoNumber', {
        defaultValue: 'Passwort muss eine Zahl enthalten'
      });
    }

    if (!/[!?@#$%^&*_0-9]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoSpecial', {
        defaultValue: 'Passwort muss ein Sonderzeichen enthalten'
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    const password = mode === 'generate' ? generatedPassword : manualPassword;

    if (!password) {
      setErrors({ password: t('admin.users.errors.passwordRequired', { defaultValue: 'Passwort ist erforderlich' }) });
      return;
    }

    if (mode === 'manual' && !validateManualPassword(password)) {
      return;
    }

    setResetting(true);
    try {
      await onReset(user.id, password);
    } catch (error) {
      // Error is handled by parent
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('admin.users.resetPassword', { defaultValue: 'Passwort zurücksetzen' })}
          </DialogTitle>
          <DialogDescription>
            {t('admin.users.resetPasswordFor', { name: user.name, defaultValue: `Passwort für ${user.name} zurücksetzen` })}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('admin.users.resetPasswordWarning', {
              defaultValue: 'Der Benutzer muss das Passwort bei der nächsten Anmeldung ändern.'
            })}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'generate' ? 'default' : 'outline'}
              onClick={() => setMode('generate')}
              className="flex-1"
            >
              {t('admin.users.generatePassword', { defaultValue: 'Passwort generieren' })}
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              {t('admin.users.manualPassword', { defaultValue: 'Manuell eingeben' })}
            </Button>
          </div>

          {mode === 'generate' && (
            <div className="space-y-3">
              {!generatedPassword ? (
                <Button type="button" onClick={generateSecurePassword} className="w-full">
                  {t('admin.users.generateSecurePassword', { defaultValue: 'Sicheres Passwort generieren' })}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label>{t('admin.users.generatedPassword', { defaultValue: 'Generiertes Passwort' })}</Label>
                  <div className="flex gap-2">
                    <Input value={generatedPassword} readOnly className="font-mono" />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={copyToClipboard}
                      title={t('common.copy', { defaultValue: 'Kopieren' })}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription className="text-sm">
                      {t('admin.users.copyPasswordWarning', {
                        defaultValue: 'Kopiere dieses Passwort jetzt! Es wird nach dem Schließen nicht mehr angezeigt.'
                      })}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="manual-password">
                {t('admin.users.newPassword', { defaultValue: 'Neues Passwort' })}
              </Label>
              <Input
                id="manual-password"
                type="password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder={t('admin.users.passwordPlaceholder', { defaultValue: 'Mindestens 16 Zeichen' })}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.users.passwordRequirements', {
                  defaultValue: 'Mind. 16 Zeichen, Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen'
                })}
              </p>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={resetting}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            disabled={resetting || (mode === 'generate' && !generatedPassword)}
          >
            {resetting
              ? t('admin.users.resetting', { defaultValue: 'Zurücksetzen...' })
              : t('admin.users.resetPasswordButton', { defaultValue: 'Passwort zurücksetzen' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
