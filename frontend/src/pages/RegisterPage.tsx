import { useState, type FormEvent, useEffect } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { CheckCircle2, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { register, isAuthenticated, isLoading: authLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });
    // Check password requirements on change
    useEffect(() => {
        setPasswordRequirements({
            length: password.length >= 16,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!?@#$%^&*_]/.test(password)
        });
    }, [password]);

    const isPasswordValid = Object.values(passwordRequirements).every(v => v);

    const handleUsernameBlur = async () => {
        if (!username || username.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        try {
            setUsernameStatus('checking');
            const response = await apiClient.get<{ available: boolean }>(`users/check_username/${username}`);
            setUsernameStatus(response.available ? 'available' : 'taken');
        } catch (err) {
            logger.error('Error checking username', { error: err });
            setUsernameStatus('idle');
        }
    };

    // Redirect if already authenticated
    if (isAuthenticated && !authLoading) {
        const from = (location.state as any)?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isPasswordValid) {
            setError(t('auth.registrationError', { defaultValue: 'Please meet all password requirements' }));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch', { defaultValue: 'Passwords do not match' }));
            return;
        }

        setIsLoading(true);

        try {
            await register(username, password);
            // Navigate to the dashboard
            navigate('/', { replace: true });
        } catch (err) {
            logger.error('Registration error', { error: err });
            setError(t('auth.registrationError', { defaultValue: 'Registration failed. Username might be taken.' }));
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{t('auth.register', { defaultValue: 'Register' })}</CardTitle>
                    <CardDescription>{t('auth.registerDescription', { defaultValue: 'Create an account to start tracking your wealth' })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="username">{t('auth.username', { defaultValue: 'Username' })}</Label>
                                {usernameStatus === 'checking' && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <div className="h-3 w-3 animate-spin rounded-full border border-solid border-current border-r-transparent" />
                                        {t('auth.usernameChecking')}
                                    </span>
                                )}
                                {usernameStatus === 'available' && (
                                    <span className="text-xs text-green-500 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {t('auth.usernameAvailable')}
                                    </span>
                                )}
                                {usernameStatus === 'taken' && (
                                    <span className="text-xs text-destructive flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {t('auth.usernameTaken')}
                                    </span>
                                )}
                            </div>
                            <Input
                                id="username"
                                type="text"
                                placeholder=""
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (usernameStatus !== 'idle') setUsernameStatus('idle');
                                }}
                                onBlur={handleUsernameBlur}
                                required
                                autoFocus
                                disabled={isLoading}
                                className={cn(
                                    usernameStatus === 'available' && 'border-green-500 focus-visible:ring-green-500',
                                    usernameStatus === 'taken' && 'border-destructive focus-visible:ring-destructive'
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{t('auth.password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className={cn(
                                    password && (isPasswordValid ? 'border-green-500 focus-visible:ring-green-500' : 'border-yellow-500 focus-visible:ring-yellow-500')
                                )}
                            />

                            {/* Password Requirements List */}
                            <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2 text-xs">
                                <p className="font-semibold flex items-center gap-1 mb-1">
                                    {isPasswordValid ? (
                                        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <ShieldAlert className="h-3.5 w-3.5 text-yellow-500" />
                                    )}
                                    {t('auth.passwordRequirements')}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                                    <RequirementItem met={passwordRequirements.length} label={t('auth.passwordRequirementLength')} />
                                    <RequirementItem met={passwordRequirements.upper} label={t('auth.passwordRequirementUpper')} />
                                    <RequirementItem met={passwordRequirements.lower} label={t('auth.passwordRequirementLower')} />
                                    <RequirementItem met={passwordRequirements.number} label={t('auth.passwordRequirementNumber')} />
                                    <RequirementItem met={passwordRequirements.special} label={t('auth.passwordRequirementSpecial')} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t('common.saving') : t('auth.register', { defaultValue: 'Register' })}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground mr-1">
                            {t('auth.alreadyHasAccount', { defaultValue: 'Already have an account?' })}
                        </span>
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            {t('auth.loginHere')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
    return (
        <div className={cn(
            "flex items-center gap-1.5 transition-colors",
            met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-current shrink-0" />
            )}
            <span>{label}</span>
        </div>
    );
}
