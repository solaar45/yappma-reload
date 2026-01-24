import type { User } from './api/types';

export type Role = 'user' | 'admin' | 'super_admin' | 'read_only';

/**
 * Checks if user is an admin (admin or super_admin)
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Checks if user is a super admin
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

/**
 * Checks if user can edit another user
 */
export function canEditUser(currentUser: User | null, targetUser: { id: number; role: Role }): boolean {
  if (!currentUser) return false;
  
  // Cannot edit yourself through admin panel
  if (currentUser.id === targetUser.id) return false;
  
  // Super admin cannot be edited by anyone
  if (targetUser.role === 'super_admin') return false;
  
  // Super admin can edit anyone
  if (currentUser.role === 'super_admin') return true;
  
  // Admin can edit regular users
  if (currentUser.role === 'admin' && targetUser.role === 'user') return true;
  
  return false;
}

/**
 * Checks if user can delete another user
 */
export function canDeleteUser(currentUser: User | null, targetUser: { id: number; role: Role }): boolean {
  if (!currentUser) return false;
  
  // Cannot delete yourself
  if (currentUser.id === targetUser.id) return false;
  
  // Super admin cannot be deleted
  if (targetUser.role === 'super_admin') return false;
  
  // Super admin can delete anyone
  if (currentUser.role === 'super_admin') return true;
  
  // Admin can delete regular users
  if (currentUser.role === 'admin' && targetUser.role === 'user') return true;
  
  return false;
}

/**
 * Checks if user can reset another user's password
 */
export function canResetPassword(currentUser: User | null, targetUser: { id: number; role: Role }): boolean {
  if (!currentUser) return false;
  
  // Cannot reset your own password through admin panel
  if (currentUser.id === targetUser.id) return false;
  
  // Super admin cannot have password reset by admin
  if (targetUser.role === 'super_admin') return false;
  
  // Super admin can reset anyone's password
  if (currentUser.role === 'super_admin') return true;
  
  // Admin can reset regular user passwords
  if (currentUser.role === 'admin' && targetUser.role === 'user') return true;
  
  return false;
}

/**
 * Checks if user can promote/demote roles
 */
export function canManageRoles(currentUser: User | null): boolean {
  return isSuperAdmin(currentUser);
}

/**
 * Gets the display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    user: 'Benutzer',
    admin: 'Administrator',
    super_admin: 'Super Administrator',
    read_only: 'Nur Lesen'
  };
  return roleNames[role] || role;
}

/**
 * Gets the badge variant for a role
 */
export function getRoleBadgeVariant(role: Role): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'super_admin':
      return 'default';
    case 'admin':
      return 'secondary';
    case 'read_only':
      return 'outline';
    default:
      return 'outline';
  }
}
