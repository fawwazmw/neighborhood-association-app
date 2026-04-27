import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowDownCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { expenseApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

const emptyForm = {
  category: '',
  description: '',
  amount: '',
  date: '',
  is_recurring: false,
};

export default function ExpenseList() {
  // Data state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Filter state
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('');

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, year };
        if (month !== 'all') params.month = month;
        if (category.trim()) params.category = category.trim();

        const res = await expenseApi.getAll(params);
        const result = res.data?.data || res.data;

        if (Array.isArray(result)) {
          setData(result);
          setPagination({
            currentPage: 1,
            lastPage: 1,
            total: result.length,
          });
        } else {
          setData(result.data || []);
          setPagination({
            currentPage: result.current_page || 1,
            lastPage: result.last_page || 1,
            total: result.total || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expense data. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [year, month, category]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // ── Total expenses ────────────────────────────────────────────────────────
  const totalExpenses = data.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // ── Dialog handlers ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      category: item.category || '',
      description: item.description || '',
      amount: item.amount ? String(Number(item.amount)) : '',
      date: item.date || '',
      is_recurring: !!item.is_recurring,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setForm(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editItem) {
        await expenseApi.update(editItem.id, payload);
        toast.success('Expense updated successfully.');
      } else {
        await expenseApi.create(payload);
        toast.success('Expense created successfully.');
      }
      handleCloseDialog();
      fetchData(editItem ? pagination.currentPage : 1);
    } catch (err) {
      console.error('Failed to save expense:', err);
      toast.error('Failed to save expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeleteItem(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await expenseApi.delete(deleteItem.id);
      toast.success('Expense deleted successfully.');
      handleCloseDelete();
      fetchData(pagination.currentPage);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      toast.error('Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.lastPage) {
      fetchData(page);
    }
  };

  const getPageNumbers = () => {
    return Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
      .filter((page) => {
        if (pagination.lastPage <= 7) return true;
        if (page === 1 || page === pagination.lastPage) return true;
        if (Math.abs(page - pagination.currentPage) <= 1) return true;
        return false;
      })
      .reduce((acc, page, idx, arr) => {
        if (idx > 0 && page - arr[idx - 1] > 1) {
          acc.push('...');
        }
        acc.push(page);
        return acc;
      }, []);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage neighborhood association expenses
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Total Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses (this page)
              </p>
              {loading ? (
                <div className="h-7 w-32 bg-muted rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatRupiah(totalExpenses)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3 py-3">
          {/* Year */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {month === 'all' ? 'All' : MONTH_NAMES[Number(month) - 1]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {MONTH_NAMES.map((name, idx) => (
                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Search category..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive/60 mb-3" />
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="link"
                onClick={() => fetchData(1)}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <ArrowDownCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No expense data found</p>
              <p className="text-sm mt-1">
                Click &quot;Add Expense&quot; to add new data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Recurring</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const rowNumber =
                      (pagination.currentPage - 1) * 10 + index + 1;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.category}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {item.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(item.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              item.is_recurring ? 'default' : 'secondary'
                            }
                            className={cn(
                              item.is_recurring &&
                                'bg-green-100 text-green-700 hover:bg-green-100'
                            )}
                          >
                            {item.is_recurring ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleOpenDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.lastPage > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.lastPage} (
                {pagination.total} records)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(pagination.currentPage - 1)
                  }
                  disabled={pagination.currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={
                        page === pagination.currentPage
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(pagination.currentPage + 1)
                  }
                  disabled={pagination.currentPage >= pagination.lastPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the expense details below.'
                : 'Fill in the details to add a new expense.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    handleFormChange('category', e.target.value)
                  }
                  placeholder="e.g. Security Salary"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    handleFormChange('description', e.target.value)
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount (IDR) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    handleFormChange('amount', e.target.value)
                  }
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    handleFormChange('date', e.target.value)
                  }
                  required
                />
              </div>

              {/* Recurring */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={form.is_recurring}
                  onCheckedChange={(checked) =>
                    handleFormChange('is_recurring', !!checked)
                  }
                />
                <Label
                  htmlFor="is_recurring"
                  className="text-sm font-normal cursor-pointer"
                >
                  Recurring expense
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editItem ? (
                  'Save Changes'
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto p-3 bg-red-100 rounded-full mb-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Expense?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete the expense{' '}
              <span className="font-medium text-foreground">
                &quot;{deleteItem?.category}&quot;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCloseDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
