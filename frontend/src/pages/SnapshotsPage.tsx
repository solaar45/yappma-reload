import { useState } from 'react';
import { useSnapshots } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateSnapshotDialog } from '@/components/CreateSnapshotDialog';
import { EditSnapshotDialog } from '@/components/EditSnapshotDialog';
import { DeleteSnapshotDialog } from '@/components/DeleteSnapshotDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from 'lucide-react';

export default function SnapshotsPage() {
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { snapshots, loading, error } = useSnapshots({ userId: userId!, key: refreshKey });

  const handleSnapshotChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Snapshots</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">Error loading snapshots: {error}</div>
      </div>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Snapshots</h1>
          <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No snapshots found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first snapshot to track account or asset values over time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Snapshots</h1>
          <div className="text-sm text-muted-foreground">
            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CreateSnapshotDialog onSuccess={handleSnapshotChanged} />
      </div>

      {/* Mobile: Card Layout */}
      <div className="grid gap-4 md:hidden">
        {snapshots.map((snapshot) => {
          const isAccount = snapshot.snapshot_type === 'account';
          const value = isAccount
            ? (snapshot as any).balance
            : (snapshot as any).value;
          const currency = isAccount
            ? (snapshot as any).currency
            : 'EUR';

          return (
            <Card key={`${snapshot.snapshot_type}-${snapshot.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{snapshot.entity_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(snapshot.snapshot_date)}
                    </p>
                  </div>
                  <Badge variant={isAccount ? 'default' : 'secondary'}>
                    {isAccount ? 'Account' : 'Asset'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatCurrency(value, currency)}
                  </div>
                  <div className="flex gap-1">
                    <EditSnapshotDialog 
                      snapshot={snapshot} 
                      onSuccess={handleSnapshotChanged} 
                    />
                    <DeleteSnapshotDialog 
                      snapshot={snapshot} 
                      onSuccess={handleSnapshotChanged} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Table Layout */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>All Snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot) => {
                const isAccount = snapshot.snapshot_type === 'account';
                const value = isAccount
                  ? (snapshot as any).balance
                  : (snapshot as any).value;
                const currency = isAccount
                  ? (snapshot as any).currency
                  : 'EUR';

                return (
                  <TableRow key={`${snapshot.snapshot_type}-${snapshot.id}`}>
                    <TableCell>
                      <div className="font-medium">{formatDate(snapshot.snapshot_date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{snapshot.entity_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAccount ? 'default' : 'secondary'}>
                        {isAccount ? 'Account' : 'Asset'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(value, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EditSnapshotDialog 
                          snapshot={snapshot} 
                          onSuccess={handleSnapshotChanged} 
                        />
                        <DeleteSnapshotDialog 
                          snapshot={snapshot} 
                          onSuccess={handleSnapshotChanged} 
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
