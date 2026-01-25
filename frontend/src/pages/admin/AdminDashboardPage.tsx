import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Shield, Activity, ScrollText } from 'lucide-react';
import { adminService, type SystemStats, type AuditLogEntry } from '@/lib/api/admin';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, auditData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getAuditLog({ limit: 20 }),
      ]);
      setStats(statsData);
      setAuditLog(auditData);
    } catch (error) {
      logger.error('Failed to load admin dashboard data', { error });
      toast({
        title: t('admin.dashboard.loadError'),
        description: t('admin.dashboard.loadErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionDisplayName = (action: string) => {
    return t(`admin.actions.${action}` as any, { defaultValue: action });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create') || action.includes('promote')) return 'default';
    if (action.includes('deactivate') || action.includes('demote')) return 'secondary';
    return 'outline';
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
              {t('admin.dashboard.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.dashboard.welcome', { name: currentUser?.name })}
            </p>
          </div>
          <Link to="/admin/users">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              {t('admin.dashboard.manageUsers')}
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.totalUsers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.activeUsers')}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats && stats.total_users > 0
                  ? `${Math.round((stats.active_users / stats.total_users) * 100)}%`
                  : '0%'}{' '}
                {t('admin.dashboard.ofTotal')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.inactiveUsers')}
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inactive_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.admins')}
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.admin_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.dashboard.recentLogins')}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recent_logins || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              {t('admin.dashboard.auditLog')}
            </CardTitle>
            <CardDescription>
              {t('admin.dashboard.auditLogDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.dashboard.timestamp')}</TableHead>
                    <TableHead>{t('admin.dashboard.admin')}</TableHead>
                    <TableHead>{t('admin.dashboard.action')}</TableHead>
                    <TableHead>{t('admin.dashboard.target')}</TableHead>
                    <TableHead>{t('admin.dashboard.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.length > 0 ? (
                    auditLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.inserted_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.admin_user.name}</div>
                            <div className="text-xs text-muted-foreground">{log.admin_user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {getActionDisplayName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.target_user ? (
                            <div className="text-sm">
                              <div className="font-medium">{log.target_user.name}</div>
                              <div className="text-xs text-muted-foreground">{log.target_user.email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {Object.keys(log.details).length > 0 ? (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {JSON.stringify(log.details)}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t('admin.dashboard.noAuditLogs')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
