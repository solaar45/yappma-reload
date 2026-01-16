import { useState } from 'react';
import { apiClient } from '../client';
import type { User } from '../types';
import { logger } from '@/lib/logger';

interface UpdateUserInput {
    name?: string;
    email?: string;
    currency_default?: string;
    tax_allowance_limit?: number;
    tax_status?: 'single' | 'married';
}

export function useUpdateUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateUser = async (userId: number, data: UpdateUserInput): Promise<User | null> => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.put<{ data: User }>(`users/${userId}`, { user: data });
            return response.data;
        } catch (err: any) {
            logger.error('Failed to update user', { err });
            setError(err.message || 'Failed to update user');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateUser,
        loading,
        error,
    };
}
