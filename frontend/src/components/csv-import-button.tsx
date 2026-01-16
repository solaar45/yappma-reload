import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export function CsvImportButton() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<any>('/snapshots/import', formData, {
        headers: {
            // Let the browser set Content-Type for FormData
            // If we set 'Content-Type': 'multipart/form-data', it will miss the boundary
            // apiClient logic handles this check (isFormData ? {} : defaultHeaders)
        },
      });

      const { snapshots_created, warnings } = response;

      if (warnings && warnings.length > 0) {
        toast({
          title: t('import.warningTitle'),
          description: t('import.warningDescription', { count: warnings.length }),
          variant: 'default',
        });
      } else {
        toast({
          title: t('import.successTitle'),
          description: t('import.successDescription', { count: snapshots_created }),
        });
      }

      setOpen(false);
      setFile(null);
    } catch (error) {
      toast({
        title: t('import.errorTitle'),
        description: t('import.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t('import.buttonLabel')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('import.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('import.dialogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">{t('import.fileLabel')}</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? t('common.loading') : t('import.uploadButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}