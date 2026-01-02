import { apiClient } from './api/client';
import { logger } from './logger';

const TOKEN_KEY = 'yappma_token';
const USER_KEY = 'yappma_user';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    currency_default: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  currency_default?: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('auth/login', {
      email,
      password,
    });

    this.setToken(response.token);
    this.setUser(response.user);
    logger.info('Login successful', { userId: response.user.id });

    return response;
  }

  /**
   * Register new user
   */
  async register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    currencyDefault: string = 'EUR'
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      currency_default: currencyDefault,
    });

    this.setToken(response.token);
    this.setUser(response.user);
    logger.info('Registration successful', { userId: response.user.id });

    return response;
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    logger.info('Logout successful');
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Set token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get stored user
   */
  getUser(): AuthResponse['user'] | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      logger.error('Failed to parse stored user', { error });
      return null;
    }
  }

  /**
   * Set user in localStorage
   */
  setUser(user: AuthResponse['user']): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
