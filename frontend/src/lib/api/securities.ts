import { apiClient } from './client';
import type {
  ApiResponse,
  SecurityEnrichmentRequest,
  SecurityEnrichmentResponse,
} from './types';
import { logger } from '@/lib/logger';

/**
 * Securities API functions
 */

/**
 * Enrich security metadata by ticker, ISIN, or WKN
 */
export async function enrichSecurityMetadata(
  identifier: string,
  type: 'ticker' | 'isin' | 'wkn' | 'auto' = 'auto'
): Promise<SecurityEnrichmentResponse> {
  const payload: SecurityEnrichmentRequest = {
    identifier,
    type,
  };

  try {
    const response = await apiClient.post<ApiResponse<SecurityEnrichmentResponse>>(
      'securities/enrich',
      payload
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to enrich security data', { identifier, type: type || 'auto', error });
    throw error;
  }
}
