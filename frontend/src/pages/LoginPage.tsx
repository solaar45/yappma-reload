import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import logo from '@/assets/logo.jpg';

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated && !authLoading) {
        const from = (location.state as any)?.from?.pathname || '/';
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(username, password);
            // Navigate to the page they tried to visit or dashboard
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            logger.error('Login error', { error: err });

            if (err instanceof ApiError) {
                if (err.status === 401) {
                    setError(t('auth.invalidCredentials'));
                } else {
                    setError(t('auth.loginError'));
                }
            } else {
                setError(t('auth.networkError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-4 flex flex-col items-center text-center">
                    <div className="w-64 h-64 mb-2 p-1 bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <img src={logo} alt="YAPPMA Logo" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">
                            {t('auth.login', { defaultValue: 'Login' })}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {t('auth.loginDescription')}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username">{t('auth.username', { defaultValue: 'Username' })}</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder=""
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                autoFocus
                                disabled={isLoading}
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
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground mr-1">
                            {t('auth.noAccountYet', { defaultValue: 'Don\'t have an account?' })}
                        </span>
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            {t('auth.registerHere')}
                        </Link>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
