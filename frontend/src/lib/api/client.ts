import { logger } from '@/lib/logger';
import { sanitizeEndpoint, rateLimiter } from './sanitizer';

/**
 * API Error Class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Request Deduplication Error
 * This is not a real error, just a signal that the request was deduplicated
 */
export class DeduplicationError extends Error {
  constructor() {
    super('Request was deduplicated');
    this.name = 'DeduplicationError';
  }
}

/**
 * API Client with request cancellation, rate limiting, and sanitization
 */
class ApiClient {
  private baseURL: string;
  private activeRequests = new Map<string, AbortController>();
  private defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    logger.info('ApiClient initialized', { baseURL: this.baseURL });
  }

  /**
   * Get CSRF token from meta tag or cookie
   */
  private getCsrfToken(): string | null {
    // Try meta tag first
    const metaTag = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (metaTag?.content) {
      return metaTag.content;
    }

    // Try cookie as fallback
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return value;
      }
    }

    return null;
  }

  /**
   * Core request method with all safety features
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & { dedupe?: boolean; skipRateLimit?: boolean } = {}
  ): Promise<T> {
    // Sanitize endpoint to prevent injection
    const sanitizedEndpoint = sanitizeEndpoint(endpoint);
    const url = `${this.baseURL}/${sanitizedEndpoint}`;
    const requestKey = `${options.method || 'GET'}-${url}`;

    // Rate limiting
    if (!options.skipRateLimit && !rateLimiter.canMakeRequest(requestKey)) {
      const remaining = rateLimiter.getRemainingRequests(requestKey);
      logger.warn('Rate limit exceeded', { endpoint: sanitizedEndpoint, remaining });
      throw new ApiError(429, 'Too Many Requests', {
        message: 'Rate limit exceeded. Please try again later.',
        remainingRequests: remaining,
      });
    }

    // Request deduplication for GET requests
    if (options.dedupe && options.method === 'GET') {
      if (this.activeRequests.has(requestKey)) {
        logger.debug('Request deduplicated', { endpoint: sanitizedEndpoint });
        // Return existing promise instead of rejecting
        // Wait for the original request to complete
        const controller = this.activeRequests.get(requestKey)!;
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!this.activeRequests.has(requestKey)) {
              clearInterval(checkInterval);
              // Original request completed, retry this one
              this.request<T>(endpoint, { ...options, dedupe: false })
                .then(resolve)
                .catch(reject);
            }
          }, 50);
          
          // Cleanup after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new DeduplicationError());
          }, 5000);
        });
      }
    }

    // Create AbortController for this request
    const controller = new AbortController();
    this.activeRequests.set(requestKey, controller);

    // Add CSRF token for state-changing requests
    const csrfToken = this.getCsrfToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || '')) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }

    try {
      logger.debug('API Request', {
        method: options.method || 'GET',
        endpoint: sanitizedEndpoint,
      });

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
        credentials: 'include', // Include cookies
      });

      // Handle HTTP errors
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        logger.error('API Error', {
          status: response.status,
          endpoint: sanitizedEndpoint,
          error: errorData,
        });

        throw new ApiError(response.status, response.statusText, errorData);
      }

      // Parse JSON response
      const data = await response.json();
      logger.debug('API Response', { endpoint: sanitizedEndpoint, data });
      return data as T;
    } catch (error) {
      // Don't log AbortError (expected when cancelling)
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('Request cancelled', { endpoint: sanitizedEndpoint });
        throw error;
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors
      logger.error('Network Error', { endpoint: sanitizedEndpoint, error });
      throw new ApiError(0, 'Network Error', error);
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      dedupe: true,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Cancel a specific request
   */
  cancel(method: string, endpoint: string): void {
    const sanitizedEndpoint = sanitizeEndpoint(endpoint);
    const url = `${this.baseURL}/${sanitizedEndpoint}`;
    const requestKey = `${method}-${url}`;
    const controller = this.activeRequests.get(requestKey);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestKey);
      logger.debug('Request cancelled manually', { method, endpoint: sanitizedEndpoint });
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAll(): void {
    logger.info('Cancelling all active requests', {
      count: this.activeRequests.size,
    });
    this.activeRequests.forEach((controller) => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * Get number of active requests
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiClient.cancelAll();
  });
}
