/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>"']/g, '') // Remove HTML/script characters
    .trim();
}

/**
 * Sanitize HTML by escaping special characters
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize URL/endpoint path
 * Only allows alphanumeric, hyphens, underscores, forward slashes
 */
export function sanitizeEndpoint(endpoint: string): string {
  // Remove leading/trailing slashes
  const cleaned = endpoint.replace(/^\/+|\/+$/g, '');
  
  // Only allow safe characters
  const sanitized = cleaned.replace(/[^a-zA-Z0-9\-_\/]/g, '');
  
  // Prevent path traversal
  const parts = sanitized.split('/').filter(part => part !== '..' && part !== '.');
  
  return parts.join('/');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize object by removing null/undefined values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Rate limiter for API calls with exponential backoff
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private backoffTimers: Map<string, number> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 300) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    
    // Check if there's an active backoff
    const backoffUntil = this.backoffTimers.get(key);
    if (backoffUntil && now < backoffUntil) {
      return false;
    }

    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.maxRequests) {
      // Apply exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, Math.floor(validTimestamps.length / 100)), 30000);
      this.backoffTimers.set(key, now + backoffMs);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    // Clear backoff if request is allowed
    this.backoffTimers.delete(key);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
    this.backoffTimers.delete(key);
  }

  resetAll(): void {
    this.requests.clear();
    this.backoffTimers.clear();
  }
}

export const rateLimiter = new RateLimiter();
