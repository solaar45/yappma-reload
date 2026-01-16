import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts } from '@/lib/api/hooks';
import { useUser } from '@/contexts/UserContext';

export function CsvImportButton() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { userId } = useUser();
  const { accounts } = useAccounts(userId!);
  
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFile(null);
      setSelectedAccountId('');
      setUploading(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // Validate account selection if it might be a bank import
    // Ideally we would detect file type first, but since we do it in one step,
    // we should encourage selecting an account.
    // However, for Scalable Capital (Asset Import), account selection is not needed.
    // Strategy: Always show account selector, but make it optional? 
    // No, the backend now REQUIRES it for account imports.
    // So if the user uploads a DKB CSV but selected no account, the backend will return 422.
    // That's fine, we handle the error.
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedAccountId && selectedAccountId !== 'none') {
        formData.append('account_id', selectedAccountId);
    }

    try {
      const response = await apiClient.post<any>('/snapshots/import', formData, {
        headers: {
            // Let browser set Content-Type
        },
      });

      const { snapshots_created, warnings } = response;

      if (warnings && warnings.length > 0) {
        toast({
          title: t('import.warningTitle') || 'Import completed with warnings',
          description: t('import.warningDescription', { count: warnings.length }) || `${warnings.length} warnings occurred.`,
          variant: 'default',
        });
      } else {
        toast({
          title: t('import.successTitle') || 'Import successful',
          description: t('import.successDescription', { count: snapshots_created }) || `Created ${snapshots_created} snapshots.`,
        });
      }

      setOpen(false);
    } catch (error: any) {
      // Handle specific error message from backend
      const errorMsg = error.data?.error || error.message;
      
      toast({
        title: t('import.errorTitle') || 'Import failed',
        description: errorMsg || t('import.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const accountOptions = accounts || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t('import.buttonLabel') || 'Import CSV'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('import.dialogTitle') || 'Import Snapshots'}</DialogTitle>
          <DialogDescription>
            {t('import.dialogDescription') || 'Upload a CSV file from DKB or Scalable Capital.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="account-select">{t('import.targetAccount') || 'Target Account (for Bank Imports)'}</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger id="account-select">
                <SelectValue placeholder={t('import.selectAccount') || 'Select an account...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('import.noAccount') || 'None (Asset Import / Scalable)'}</SelectItem>
                {accountOptions.map((acc) => {
                  const hasName = acc.name && acc.name.trim() !== '' && acc.name !== '-';
                  const typeName = t(`accountTypes.${acc.type}`, { defaultValue: acc.type.replace('_', ' ') });
                  const displayName = hasName ? acc.name : typeName;
                  const institutionName = acc.institution?.name || 'Other';
                  
                  return (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {displayName} ({institutionName})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('import.accountHelp') || 'Required for bank statement imports (e.g. DKB). Not needed for portfolio imports (Scalable).'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">{t('import.fileLabel') || 'CSV File'}</Label>
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
            {uploading ? (t('common.loading') || 'Uploading...') : (t('import.uploadButton') || 'Import')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
