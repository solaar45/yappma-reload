import { apiClient } from './client';

export interface UserStats {
  accounts_count: number;
  assets_count: number;
  institutions_count: number;
  total_value: string;
  last_activity: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin' | 'read_only';
  is_active: boolean;
  currency_default: string;
  tax_status: string;
  tax_allowance_limit: number;
  last_login_at: string | null;
  login_count: number;
  deactivated_at: string | null;
  force_password_change: boolean;
  created_by_user_id: number | null;
  deactivated_by_user_id: number | null;
  inserted_at: string;
  updated_at: string;
  stats?: UserStats;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin' | 'read_only';
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: 'user' | 'admin' | 'read_only';
  is_active?: boolean;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_users: number;
  recent_logins: number;
}

export interface AuditLogEntry {
  id: number;
  admin_user: {
    id: number;
    email: string;
    name: string;
  };
  target_user: {
    id: number;
    email: string;
    name: string;
  } | null;
  action: string;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  inserted_at: string;
}

class AdminService {
  private baseUrl = '/admin';

  /**
   * Lists all users with optional filters
   */
  async getUsers(filters?: { role?: string; active?: boolean }): Promise<AdminUser[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.active !== undefined) params.append('active', String(filters.active));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<{ data: AdminUser[] }>(`${this.baseUrl}/users${query}`);
    return response.data;
  }

  /**
   * Gets a single user by ID
   */
  async getUser(userId: number): Promise<AdminUser> {
    const response = await apiClient.get<{ data: AdminUser }>(`${this.baseUrl}/users/${userId}`);
    return response.data;
  }

  /**
   * Creates a new user
   */
  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>(`${this.baseUrl}/users`, { user: data });
    return response.data;
  }

  /**
   * Updates a user
   */
  async updateUser(userId: number, updates: UpdateUserInput): Promise<AdminUser> {
    const response = await apiClient.patch<{ data: AdminUser }>(
      `${this.baseUrl}/users/${userId}`,
      { user: updates }
    );
    return response.data;
  }

  /**
   * Resets a user's password
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/users/${userId}/reset-password`, {
      password: newPassword
    });
  }

  /**
   * Deactivates a user (soft delete)
   */
  async deactivateUser(userId: number): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>(
      `${this.baseUrl}/users/${userId}/deactivate`
    );
    return response.data;
  }

  /**
   * Reactivates a deactivated user
   */
  async reactivateUser(userId: number): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>(
      `${this.baseUrl}/users/${userId}/reactivate`
    );
    return response.data;
  }

  /**
   * Permanently deletes a user and all their data
   */
  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Promotes a user to admin role (super admin only)
   */
  async promoteToAdmin(userId: number): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>(
      `${this.baseUrl}/users/${userId}/promote-to-admin`
    );
    return response.data;
  }

  /**
   * Demotes an admin to regular user (super admin only)
   */
  async demoteToUser(userId: number): Promise<AdminUser> {
    const response = await apiClient.post<{ data: AdminUser }>(
      `${this.baseUrl}/users/${userId}/demote-to-user`
    );
    return response.data;
  }

  /**
   * Gets system-wide statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await apiClient.get<{ data: SystemStats }>(`${this.baseUrl}/dashboard/stats`);
    return response.data;
  }

  /**
   * Gets audit log with optional filters
   */
  async getAuditLog(filters?: {
    limit?: number;
    admin_user_id?: number;
    action?: string;
  }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.admin_user_id) params.append('admin_user_id', String(filters.admin_user_id));
    if (filters?.action) params.append('action', filters.action);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<{ data: AuditLogEntry[] }>(
      `${this.baseUrl}/audit-log${query}`
    );
    return response.data;
  }
}

export const adminService = new AdminService();
