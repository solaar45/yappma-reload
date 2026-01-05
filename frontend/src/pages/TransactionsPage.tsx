import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTransactions, useTransactionCategories, useUpdateTransaction, exportTransactionsToCSV } from '@/hooks/api/useTransactions';
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal';
import { Transaction, TransactionFilters } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import logger from '@/lib/logger';

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: categories = [] } = useTransactionCategories();
  const updateTransaction = useUpdateTransaction();

  logger.debug('TransactionsPage render', {
    transactionsCount: transactions.length,
    filters,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleCategoryFilter = (value: string) => {
    const categoryId = value === 'all' ? undefined : parseInt(value);
    setFilters((prev) => ({ ...prev, category_id: categoryId }));
  };

  const handleStatusFilter = (value: string) => {
    const status = value === 'all' ? undefined : (value as 'booked' | 'pending');
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleExport = () => {
    exportTransactionsToCSV(transactions, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalOpen(true);
  };

  const handleSaveTransaction = async (
    id: number,
    updates: { category_id?: number; notes?: string }
  ) => {
    await updateTransaction.mutateAsync({ id, updates });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">View and manage your transactions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={transactions.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select onValueChange={handleCategoryFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="0">Uncategorized</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select onValueChange={handleStatusFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions found. Try adjusting your filters.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isExpense = parseFloat(transaction.amount) < 0;
                      const amount = Math.abs(parseFloat(transaction.amount));

                      return (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleTransactionClick(transaction)}
                        >
                          <TableCell className="font-medium">
                            {formatDate(transaction.booking_date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.notes && (
                                <div className="text-xs text-muted-foreground">{transaction.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.category ? (
                              <Badge variant="outline" className="gap-1">
                                {transaction.category.icon && <span>{transaction.category.icon}</span>}
                                {transaction.category.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Uncategorized</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {transaction.account_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-medium ${isExpense ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {isExpense ? '-' : '+'}
                              {formatCurrency(amount, transaction.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'booked' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {transactions.map((transaction) => {
                  const isExpense = parseFloat(transaction.amount) < 0;
                  const amount = Math.abs(parseFloat(transaction.amount));

                  return (
                    <Card
                      key={transaction.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transaction.booking_date)}
                            </div>
                            <div className="text-sm text-muted-foreground">  
                              {transaction.account_name}
                            </div>
                            {transaction.category && (
                              <Badge variant="outline" className="gap-1 mt-2">
                                {transaction.category.icon && <span>{transaction.category.icon}</span>}
                                {transaction.category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <div
                              className={`font-bold text-lg ${isExpense ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {isExpense ? '-' : '+'}
                              {formatCurrency(amount, transaction.currency)}
                            </div>
                            <Badge variant={transaction.status === 'booked' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
      />
    </div>
  );
}
