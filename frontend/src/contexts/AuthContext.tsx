import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { User } from '@/lib/api/types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get<{ data: User[] }>('users');
            if (response?.data && response.data.length > 0) {
                setUser(response.data[0]);
                logger.info('User authenticated', { userId: response.data[0].id });
            } else {
                setUser(null);
            }
        } catch (error) {
            logger.debug('Not authenticated', { error });
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await apiClient.post<{ user: User; message: string }>(
                'users/log_in',
                { user: { email, password } }
            );

            if (response?.user) {
                setUser(response.user);
                logger.info('Login successful', { userId: response.user.id });
            }
        } catch (error) {
            logger.error('Login failed', { error });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await apiClient.delete('users/log_out');
            setUser(null);
            logger.info('Logout successful');
        } catch (error) {
            logger.error('Logout failed', { error });
            // Clear user anyway on logout error
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
