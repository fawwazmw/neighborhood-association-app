import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Receipt,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

export default function PaymentList() {
  const currentYear = new Date().getFullYear();

  // Filter state
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState('all');
  const [feeType, setFeeType] = useState('all');
  const [status, setStatus] = useState('all');

  // Data state
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate bills dialog
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [generateYear, setGenerateYear] = useState(String(currentYear));
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  // Year options
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  // ── Fetch payments ────────────────────────────────────────────────────────
  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, year };
        if (month !== 'all') params.month = month;
        if (feeType !== 'all') params.fee_type = feeType;
        if (status !== 'all') params.status = status;

        const res = await paymentApi.getAll(params);
        const responseData = res.data?.data || res.data;
        const items = responseData?.data || [];

        setPayments(items);
        setCurrentPage(responseData?.current_page || 1);
        setLastPage(responseData?.last_page || 1);
        setTotal(responseData?.total || 0);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        setError('Failed to load payment data.');
      } finally {
        setLoading(false);
      }
    },
    [year, month, feeType, status]
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  // ── Mark as paid ──────────────────────────────────────────────────────────
  const handleMarkPaid = async (id) => {
    try {
      await paymentApi.update(id, { status: 'paid' });
      toast.success('Payment marked as paid.');
      fetchPayments(currentPage);
    } catch (err) {
      console.error('Failed to update payment:', err);
      toast.error('Failed to update payment status.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentApi.delete(id);
      toast.success('Payment deleted successfully.');
      fetchPayments(currentPage);
    } catch (err) {
      console.error('Failed to delete payment:', err);
      toast.error('Failed to delete payment.');
    }
  };

  // ── Generate bills ────────────────────────────────────────────────────────
  const handleGenerateBills = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await paymentApi.generateBills({
        month: Number(generateMonth),
        year: Number(generateYear),
      });
      const count =
        res.data?.data?.count ??
        res.data?.count ??
        res.data?.data?.length ??
        0;
      setGenerateResult({ success: true, count });
      toast.success(`Successfully generated ${count} bills.`);
      fetchPayments(1);
    } catch (err) {
      console.error('Failed to generate bills:', err);
      const message =
        err.response?.data?.message || 'Failed to generate bills.';
      setGenerateResult({ success: false, message });
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const getPageNumbers = () => {
    return Array.from({ length: lastPage }, (_, i) => i + 1)
      .filter((page) => {
        if (lastPage <= 7) return true;
        if (page === 1 || page === lastPage) return true;
        if (Math.abs(page - currentPage) <= 1) return true;
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
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage resident fee payment data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white"
            onClick={() => {
              setShowGenerateDialog(true);
              setGenerateResult(null);
            }}
          >
            <Receipt />
            Generate Bills
          </Button>
          <Link to="/payments/create">
            <Button>
              <Plus />
              Add Payment
            </Button>
          </Link>
        </div>
      </div>

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
                {yearOptions.map((y) => (
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

          {/* Fee Type */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fee Type</label>
            <Select value={feeType} onValueChange={setFeeType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
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
                  className="h-10 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-destructive">
              <p>{error}</p>
              <Button
                variant="link"
                onClick={() => fetchPayments(currentPage)}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <p className="font-medium">No payment data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => {
                    const houseNumber =
                      payment.house_resident?.house?.house_number ||
                      payment.house?.house_number ||
                      '-';
                    const residentName =
                      payment.house_resident?.resident?.full_name ||
                      payment.resident?.full_name ||
                      '-';
                    const feeTypeLabel =
                      payment.fee_type?.charAt(0).toUpperCase() +
                        payment.fee_type?.slice(1) || '-';
                    const monthYear = `${MONTH_NAMES[(payment.month || 1) - 1]} ${payment.year}`;
                    const rowNumber = (currentPage - 1) * 10 + index + 1;

                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {houseNumber}
                        </TableCell>
                        <TableCell>{residentName}</TableCell>
                        <TableCell>{feeTypeLabel}</TableCell>
                        <TableCell>{monthYear}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(payment.amount || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              payment.status === 'paid'
                                ? 'default'
                                : 'destructive'
                            }
                            className={cn(
                              payment.status === 'paid' &&
                                'bg-green-100 text-green-700 hover:bg-green-100'
                            )}
                          >
                            {payment.status === 'paid' ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? new Date(
                                payment.payment_date
                              ).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {payment.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleMarkPaid(payment.id)}
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Pay
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(payment.id)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
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
          {!loading && !error && lastPage > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing page {currentPage} of {lastPage} ({total} records)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {getPageNumbers().map((item, idx) =>
                  item === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => fetchPayments(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(currentPage + 1)}
                  disabled={currentPage >= lastPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Bills Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Bills</DialogTitle>
            <DialogDescription>
              Generate monthly fee bills for all active residents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={generateMonth} onValueChange={setGenerateMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {MONTH_NAMES[Number(generateMonth) - 1] || 'Select month'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={generateYear} onValueChange={setGenerateYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {generateResult && (
              <div
                className={cn(
                  'p-3 rounded-lg text-sm border',
                  generateResult.success
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}
              >
                {generateResult.success
                  ? `Successfully generated ${generateResult.count} bills.`
                  : generateResult.message}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Close
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={handleGenerateBills}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
