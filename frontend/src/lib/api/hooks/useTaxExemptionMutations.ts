import { useState } from 'react';
import { apiClient } from '../client';
import type { TaxExemption } from '../types';
import { logger } from '@/lib/logger';

interface CreateTaxExemptionInput {
    user_id: number;
    institution_id: number;
    amount: number;
    year: number;
}

export function useCreateTaxExemption() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createTaxExemption = async (data: CreateTaxExemptionInput): Promise<TaxExemption | null> => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.post<{ data: TaxExemption }>('tax_exemptions', { tax_exemption: data });
            return response.data;
        } catch (err: any) {
            logger.error('Failed to create tax exemption', { err });
            setError(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { createTaxExemption, loading, error };
}

export function useUpdateTaxExemption() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateTaxExemption = async (id: number, data: Partial<CreateTaxExemptionInput>): Promise<TaxExemption | null> => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.put<{ data: TaxExemption }>(`tax_exemptions/${id}`, { tax_exemption: data });
            return response.data;
        } catch (err: any) {
            logger.error('Failed to update tax exemption', { err });
            setError(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { updateTaxExemption, loading, error };
}

export function useDeleteTaxExemption() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteTaxExemption = async (id: number): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            await apiClient.delete(`tax_exemptions/${id}`);
            return true;
        } catch (err: any) {
            logger.error('Failed to delete tax exemption', { err });
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { deleteTaxExemption, loading, error };
}
