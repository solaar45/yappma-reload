import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Transaction, TransactionCategory } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CategorySelector } from './CategorySelector';
import { Calendar, CreditCard, User, Building2, FileText, Tag } from 'lucide-react';
import logger from '@/lib/logger';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, updates: { category_id?: number; notes?: string }) => Promise<void>;
  categories: TransactionCategory[];
}

export function TransactionDetailsModal({
  transaction,
  open,
  onClose,
  onSave,
  categories
}: TransactionDetailsModalProps) {
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCategoryId(transaction.category?.id);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: { category_id?: number; notes?: string } = {};
      if (categoryId !== undefined) updates.category_id = categoryId;
      if (notes) updates.notes = notes;

      await onSave(transaction.id, updates);
      logger.info('Transaction updated', { id: transaction.id, updates });
      onClose();
    } catch (error) {
      logger.error('Failed to update transaction', { error });
    } finally {
      setIsSaving(false);
    }
  };

  const isExpense = parseFloat(transaction.amount) < 0;
  const amount = Math.abs(parseFloat(transaction.amount));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View and edit transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount & Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className={`text-2xl font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                {isExpense ? '-' : '+'}{formatCurrency(amount, transaction.currency)}
              </p>
            </div>
            <Badge variant={transaction.status === 'booked' ? 'default' : 'secondary'}>
              {transaction.status}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label>Description</Label>
            </div>
            <p className="text-sm">{transaction.description || 'No description'}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label>Booking Date</Label>
              </div>
              <p className="text-sm">{formatDate(transaction.booking_date)}</p>
            </div>
            {transaction.value_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label>Value Date</Label>
                </div>
                <p className="text-sm">{formatDate(transaction.value_date)}</p>
              </div>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label>Account</Label>
            </div>
            <p className="text-sm">{transaction.account_name}</p>
          </div>

          {/* Counterparty */}
          {(transaction.creditor_name || transaction.debtor_name) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label>{isExpense ? 'Paid to' : 'Received from'}</Label>
              </div>
              <p className="text-sm font-medium">
                {isExpense ? transaction.creditor_name : transaction.debtor_name}
              </p>
              {(transaction.creditor_iban || transaction.debtor_iban) && (
                <p className="text-xs text-muted-foreground">
                  {isExpense ? transaction.creditor_iban : transaction.debtor_iban}
                </p>
              )}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Label>Category</Label>
            </div>
            <CategorySelector
              categories={categories.filter(c => c.type === (isExpense ? 'expense' : 'income'))}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add notes about this transaction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Label>Transaction ID</Label>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{transaction.external_id}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
