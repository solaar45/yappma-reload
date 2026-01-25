import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
} from 'lucide-react';
import { adminService, type AdminUser } from '@/lib/api/admin';
import { canEditUser, canDeleteUser, canResetPassword, canManageRoles, getRoleDisplayName, getRoleBadgeVariant } from '@/lib/permissions';
import { UserEditDialog } from './components/UserEditDialog';
import { UserDeleteDialog } from './components/UserDeleteDialog';
import { PasswordResetDialog } from './components/PasswordResetDialog';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

type DialogType = 'edit' | 'delete' | 'password' | 'create' | null;

export default function UserManagementPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      logger.error('Failed to load users', { error });
      toast({
        title: t('admin.users.loadError'),
        description: t('admin.users.loadErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter((user) => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleUserUpdate = async (userId: number, updates: any) => {
    try {
      await adminService.updateUser(userId, updates);
      await loadUsers();
      setDialogType(null);
      toast({
        title: t('admin.users.updateSuccess'),
        description: t('admin.users.updateSuccessDescription'),
      });
    } catch (error) {
      logger.error('Failed to update user', { error });
      toast({
        title: t('admin.users.updateError'),
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async (userId: number, newPassword: string) => {
    try {
      await adminService.resetPassword(userId, newPassword);
      setDialogType(null);
      toast({
        title: t('admin.users.passwordResetSuccess'),
        description: t('admin.users.passwordResetSuccessDescription'),
      });
    } catch (error) {
      logger.error('Failed to reset password', { error });
      toast({
        title: t('admin.users.passwordResetError'),
        variant: 'destructive',
      });
    }
  };

  const handleUserDelete = async (userId: number) => {
    try {
      await adminService.deleteUser(userId);
      await loadUsers();
      setDialogType(null);
      toast({
        title: t('admin.users.deleteSuccess'),
        description: t('admin.users.deleteSuccessDescription'),
      });
    } catch (error) {
      logger.error('Failed to delete user', { error });
      toast({
        title: t('admin.users.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      if (user.is_active) {
        await adminService.deactivateUser(user.id);
        toast({
          title: t('admin.users.deactivateSuccess'),
        });
      } else {
        await adminService.reactivateUser(user.id);
        toast({
          title: t('admin.users.reactivateSuccess'),
        });
      }
      await loadUsers();
    } catch (error) {
      logger.error('Failed to toggle user status', { error });
      toast({
        title: t('admin.users.toggleStatusError'),
        variant: 'destructive',
      });
    }
  };

  const handlePromoteToAdmin = async (user: AdminUser) => {
    try {
      await adminService.promoteToAdmin(user.id);
      await loadUsers();
      toast({
        title: t('admin.users.promoteSuccess'),
      });
    } catch (error) {
      logger.error('Failed to promote user', { error });
      toast({
        title: t('admin.users.promoteError'),
        variant: 'destructive',
      });
    }
  };

  const handleDemoteToUser = async (user: AdminUser) => {
    try {
      await adminService.demoteToUser(user.id);
      await loadUsers();
      toast({
        title: t('admin.users.demoteSuccess'),
      });
    } catch (error) {
      logger.error('Failed to demote user', { error });
      toast({
        title: t('admin.users.demoteError'),
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await adminService.createUser(userData);
      await loadUsers();
      setDialogType(null);
      toast({
        title: t('admin.users.createSuccess'),
      });
    } catch (error) {
      logger.error('Failed to create user', { error });
      toast({
        title: t('admin.users.createError'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('admin.users.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredUsers.length} {t('admin.users.usersTotal')}
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedUser(null);
              setDialogType('create');
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t('admin.users.createUser')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.allRoles', { defaultValue: 'Alle Rollen' })}</SelectItem>
              <SelectItem value="user">{t(getRoleDisplayName('user') as any)}</SelectItem>
              <SelectItem value="admin">{t(getRoleDisplayName('admin') as any)}</SelectItem>
              <SelectItem value="super_admin">{t(getRoleDisplayName('super_admin') as any)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.users.allStatus', { defaultValue: 'Alle Status' })}</SelectItem>
              <SelectItem value="active">{t('admin.users.active', { defaultValue: 'Aktiv' })}</SelectItem>
              <SelectItem value="inactive">{t('admin.users.inactive', { defaultValue: 'Inaktiv' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.user')}</TableHead>
                <TableHead>{t('admin.users.role')}</TableHead>
                <TableHead>{t('admin.users.status')}</TableHead>
                <TableHead>{t('admin.users.portfolio')}</TableHead>
                <TableHead>{t('admin.users.lastLogin')}</TableHead>
                <TableHead className="text-right">{t('admin.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">
                            {t('admin.users.you')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'super_admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
                      {user.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                      {t(getRoleDisplayName(user.role) as any)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user.stats?.accounts_count || 0} {t('common.accounts')}</div>
                      <div>{user.stats?.assets_count || 0} {t('common.assets')}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : t('admin.users.never')}
                    </div>
                    {user.login_count > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {user.login_count}× {t('admin.users.logins')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEditUser(currentUser, user) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogType('edit');
                          }}
                          title={t('admin.users.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canResetPassword(currentUser, user) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogType('password');
                          }}
                          title={t('admin.users.resetPassword')}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      )}

                      {canManageRoles(currentUser) && user.role === 'user' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePromoteToAdmin(user)}
                          title={t('admin.users.promoteToAdmin')}
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {canManageRoles(currentUser) && user.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDemoteToUser(user)}
                          title={t('admin.users.demoteToUser')}
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {user.id !== currentUser?.id && user.role !== 'super_admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user)}
                          title={
                            user.is_active
                              ? t('admin.users.deactivate')
                              : t('admin.users.reactivate')
                          }
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {canDeleteUser(currentUser, user) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogType('delete');
                          }}
                          title={t('admin.users.delete')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {t('admin.users.noUsers')}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {(dialogType === 'edit' || dialogType === 'create') && (
        <UserEditDialog
          user={selectedUser}
          onSave={dialogType === 'edit' ? handleUserUpdate : handleCreateUser}
          onClose={() => setDialogType(null)}
        />
      )}

      {dialogType === 'password' && selectedUser && (
        <PasswordResetDialog
          user={selectedUser}
          onReset={handlePasswordReset}
          onClose={() => setDialogType(null)}
        />
      )}

      {dialogType === 'delete' && selectedUser && (
        <UserDeleteDialog
          user={selectedUser}
          onDelete={handleUserDelete}
          onClose={() => setDialogType(null)}
        />
      )}
    </div>
  );
}
