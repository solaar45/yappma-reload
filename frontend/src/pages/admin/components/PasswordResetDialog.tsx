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
      newErrors.password = t('admin.users.errors.passwordTooShort');
    }

    if (!/[a-z]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoLowercase');
    }

    if (!/[A-Z]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoUppercase');
    }

    if (!/[0-9]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoNumber');
    }

    if (!/[!?@#$%^&*_0-9]/.test(password)) {
      newErrors.password = t('admin.users.errors.passwordNoSpecial');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    const password = mode === 'generate' ? generatedPassword : manualPassword;

    if (!password) {
      setErrors({ password: t('admin.users.errors.passwordRequired') });
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
            {t('admin.users.resetPassword')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.users.resetPasswordFor' as any, { name: user.name })}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('admin.users.resetPasswordWarning' as any)}
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
              {t('admin.users.generatePassword' as any)}
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              {t('admin.users.manualPassword' as any)}
            </Button>
          </div>

          {mode === 'generate' && (
            <div className="space-y-3">
              {!generatedPassword ? (
                <Button type="button" onClick={generateSecurePassword} className="w-full">
                  {t('admin.users.generateSecurePassword' as any)}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label>{t('admin.users.generatedPassword' as any)}</Label>
                  <div className="flex gap-2">
                    <Input value={generatedPassword} readOnly className="font-mono" />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={copyToClipboard}
                      title={t('common.copy' as any)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription className="text-sm">
                      {t('admin.users.copyPasswordWarning' as any)}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="manual-password">
                {t('admin.users.newPassword' as any)}
              </Label>
              <Input
                id="manual-password"
                type="password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder={t('admin.users.passwordPlaceholder' as any)}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.users.passwordRequirements' as any)}
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
              ? t('admin.users.resetting' as any)
              : t('admin.users.resetPasswordButton' as any)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
