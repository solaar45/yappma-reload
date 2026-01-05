import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../client';
import type { TaxExemption } from '../types';
import { logger } from '@/lib/logger';

interface UseTaxExemptionsProps {
    userId: number;
    year: number;
}

export function useTaxExemptions({ userId, year }: UseTaxExemptionsProps) {
    const [taxExemptions, setTaxExemptions] = useState<TaxExemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTaxExemptions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ data: TaxExemption[] }>(`tax_exemptions?user_id=${userId}&year=${year}`);
            setTaxExemptions(response.data);
            setError(null);
        } catch (err: any) {
            logger.error('Failed to fetch tax exemptions', { err });
            setError(err.message || 'Failed to fetch tax exemptions');
        } finally {
            setLoading(false);
        }
    }, [userId, year]);

    useEffect(() => {
        if (userId) {
            fetchTaxExemptions();
        }
    }, [userId, year, fetchTaxExemptions]);

    return {
        taxExemptions,
        loading,
        error,
        refetch: fetchTaxExemptions,
    };
}
