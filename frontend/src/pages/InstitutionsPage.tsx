import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstitutions } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateInstitutionDialog } from '@/components/CreateInstitutionDialog';
import { EditInstitutionDialog } from '@/components/EditInstitutionDialog';
import { DeleteInstitutionDialog } from '@/components/DeleteInstitutionDialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Landmark, XCircle } from 'lucide-react';

export default function InstitutionsPage() {
  const { t } = useTranslation();
  const { userId } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const { institutions, loading, error, refetch } = useInstitutions({ userId: userId!, key: refreshKey });

  const handleInstitutionChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Use translated type labels
  const getTypeLabel = (type: string) => {
    return t(`institutions.types.${type}`);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
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
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('institutions.errorLoading')}</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                {t('common.retry') || 'Retry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!institutions || institutions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
          <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <Landmark className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('institutions.noInstitutions')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('institutions.addFirst')}
                </p>
              </div>
              <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group institutions by type
  const institutionsByType = institutions.reduce((acc, institution) => {
    const typeName = getTypeLabel(institution.type);
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
          <h1 className="text-3xl font-bold">{t('institutions.title')}</h1>
          <Badge variant="secondary" className="text-base">
            {institutions.length} {institutions.length === 1 ? t('institutions.title').slice(0, -1) : t('institutions.title')}
          </Badge>
        </div>
        <CreateInstitutionDialog onSuccess={handleInstitutionChanged} />
      </div>

      {Object.entries(institutionsByType).map(([typeName, typeInstitutions]) => (
        <div key={typeName} className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{typeName}</h2>
            <Badge variant="outline">
              {typeInstitutions.length}
            </Badge>
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
                      {getTypeLabel(institution.type)}
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
