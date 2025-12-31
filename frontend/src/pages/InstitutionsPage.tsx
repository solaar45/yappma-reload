import { useState } from 'react';
import { useInstitutions } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateInstitutionDialog } from '@/components/CreateInstitutionDialog';
import { EditInstitutionDialog } from '@/components/EditInstitutionDialog';
import { DeleteInstitutionDialog } from '@/components/DeleteInstitutionDialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Landmark } from 'lucide-react';

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  broker: 'Broker',
  insurance: 'Insurance',
  other: 'Other',
};

export default function InstitutionsPage() {
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { institutions, loading, error } = useInstitutions({ userId: userId!, key: refreshKey });

  const handleInstitutionChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Institutions</h1>
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 animate-pulse bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                  <div className="h-4 w-16 animate-pulse bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">Error loading institutions: {error}</div>
      </div>
    );
  }

  if (!institutions || institutions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Institutions</h1>
          <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Landmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No institutions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first financial institution to organize your accounts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group institutions by type
  const institutionsByType = institutions.reduce((acc, institution) => {
    const typeName = INSTITUTION_TYPE_LABELS[institution.type] || 'Other';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(institution);
    return acc;
  }, {} as Record<string, typeof institutions>);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Institutions</h1>
          <div className="text-sm text-muted-foreground">
            {institutions.length} institution{institutions.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
      </div>

      {Object.entries(institutionsByType).map(([typeName, typeInstitutions]) => (
        <div key={typeName} className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{typeName}</h2>
            <span className="text-sm text-muted-foreground">
              ({typeInstitutions.length})
            </span>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {typeInstitutions.map((institution) => (
              <Card key={institution.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {institution.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <EditInstitutionDialog 
                      institution={institution} 
                      onSuccess={handleInstitutionChanged} 
                    />
                    <DeleteInstitutionDialog 
                      institution={institution} 
                      onSuccess={handleInstitutionChanged} 
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {INSTITUTION_TYPE_LABELS[institution.type]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {institution.country}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
