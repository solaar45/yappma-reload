import { useState, useEffect } from 'react';
import type { Transaction, TransactionCategory } from '@/types/transaction';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Calendar, FileText, Building2, User, CreditCard } from 'lucide-react';
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
  categories,
}: TransactionDetailsModalProps) {
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Update form when transaction changes
  useEffect(() => {
    if (transaction) {
      setNotes(transaction.notes || '');
      setCategoryId(transaction.category?.id);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        category_id: categoryId,
        notes: notes.trim() || undefined,
      });
      logger.info('Transaction updated successfully', { id: transaction.id });
      onClose();
    } catch (error) {
      logger.error('Failed to save transaction', { error });
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  const isExpense = parseFloat(transaction.amount) < 0;
  const amount = Math.abs(parseFloat(transaction.amount));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View and edit transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Section */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p
                className={`text-2xl font-bold ${
                  isExpense ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isExpense ? '-' : '+'}
                {formatCurrency(amount, transaction.currency)}
              </p>
            </div>
            <Badge variant={transaction.status === 'booked' ? 'default' : 'secondary'}>
              {transaction.status}
            </Badge>
          </div>

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </div>
              <p className="font-medium">{transaction.description}</p>
            </div>

            {/* Account */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Account</span>
              </div>
              <p className="font-medium">{transaction.account_name}</p>
            </div>

            {/* Booking Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Booking Date</span>
              </div>
              <p className="font-medium">{formatDate(transaction.booking_date)}</p>
            </div>

            {/* Value Date */}
            {transaction.value_date && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Value Date</span>
                </div>
                <p className="font-medium">{formatDate(transaction.value_date)}</p>
              </div>
            )}

            {/* Creditor */}
            {transaction.creditor_name && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Creditor</span>
                </div>
                <p className="font-medium">{transaction.creditor_name}</p>
                {transaction.creditor_iban && (
                  <p className="text-sm text-muted-foreground">{transaction.creditor_iban}</p>
                )}
              </div>
            )}

            {/* Debtor */}
            {transaction.debtor_name && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Debtor</span>
                </div>
                <p className="font-medium">{transaction.debtor_name}</p>
                {transaction.debtor_iban && (
                  <p className="text-sm text-muted-foreground">{transaction.debtor_iban}</p>
                )}
              </div>
            )}
          </div>

          {/* Editable Fields */}
          <div className="space-y-4 pt-4 border-t">
            {/* Category Selector */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId?.toString() || 'none'}
                onValueChange={(value) =>
                  setCategoryId(value === 'none' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2">
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this transaction..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
