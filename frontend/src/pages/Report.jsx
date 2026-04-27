import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { reportApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// ─── Chart Tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-sm font-semibold text-card-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatRupiah(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, iconClassName, loading }) {
  return (
    <Card>
      <CardContent className="pt-1">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg', iconClassName)}>
            <Icon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {label}
            </p>
            {loading ? (
              <div className="h-7 w-28 bg-muted rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground truncate">
                {value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Report Page ──────────────────────────────────────────────────────────
export default function Report() {
  const [year, setYear] = useState(currentYear);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [errorSummary, setErrorSummary] = useState(null);

  // Monthly detail
  const [selectedMonth, setSelectedMonth] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  // ── Fetch summary ───────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await reportApi.summary(year);
      const result = res.data?.data || res.data;

      setSummaryData({
        totalIncome: Number(result.total_income || 0),
        totalExpenses: Number(result.total_expenses || 0),
        finalBalance: Number(result.final_balance || 0),
      });

      const summary = result.summary || [];
      const chart = MONTH_SHORT.map((name, index) => {
        const monthData = summary.find((s) => Number(s.month) === index + 1);
        return {
          month: name,
          income: monthData ? Number(monthData.income || 0) : 0,
          expenses: monthData ? Number(monthData.expenses || 0) : 0,
        };
      });
      setChartData(chart);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setErrorSummary('Failed to load report summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  }, [year]);

  useEffect(() => {
    fetchSummary();
    setSelectedMonth('');
    setDetailData(null);
  }, [fetchSummary]);

  // ── Fetch detail ────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!selectedMonth) {
      setDetailData(null);
      return;
    }
    setLoadingDetail(true);
    setErrorDetail(null);
    try {
      const res = await reportApi.detail(selectedMonth, year);
      const result = res.data?.data || res.data;
      setDetailData(result);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      setErrorDetail('Failed to load report detail. Please try again.');
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedMonth, year]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Summary of neighborhood income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-muted-foreground" />
          <Select value={year} onValueChange={(val) => setYear(Number(val))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={y}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Error State ────────────────────────────────────────────────────── */}
      {errorSummary ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle size={40} className="mx-auto text-destructive mb-3" />
            <p className="text-sm text-destructive">{errorSummary}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              className="mt-4"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={TrendingUp}
              label="Total Income"
              value={formatRupiah(summaryData?.totalIncome || 0)}
              iconClassName="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
              loading={loadingSummary}
            />
            <SummaryCard
              icon={TrendingDown}
              label="Total Expenses"
              value={formatRupiah(summaryData?.totalExpenses || 0)}
              iconClassName="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
              loading={loadingSummary}
            />
            <SummaryCard
              icon={Wallet}
              label="Final Balance"
              value={formatRupiah(summaryData?.finalBalance || 0)}
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              loading={loadingSummary}
            />
          </div>

          {/* ── Bar Chart ──────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Income vs Expenses Chart — {year}
              </CardTitle>
              <CardDescription>
                Monthly comparison of income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickFormatter={(value) =>
                        value >= 1_000_000
                          ? `${(value / 1_000_000).toFixed(0)}M`
                          : value >= 1_000
                          ? `${(value / 1_000).toFixed(0)}K`
                          : value
                      }
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Separator />

      {/* ── Monthly Detail Section ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Monthly Detail</CardTitle>
              <CardDescription>
                Select a month to view detailed income and expense breakdown
              </CardDescription>
            </div>
            <Select
              value={selectedMonth}
              onValueChange={(val) => setSelectedMonth(val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="— Select Month —" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, index) => (
                  <SelectItem key={index + 1} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* No month selected */}
          {!selectedMonth ? (
            <div className="py-10 text-center text-muted-foreground">
              <Calendar size={48} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">Select a month to view details</p>
              <p className="text-sm mt-1">
                Choose a month from the dropdown above to display income and
                expense details.
              </p>
            </div>
          ) : loadingDetail ? (
            /* Loading state */
            <div className="py-10 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : errorDetail ? (
            /* Error state */
            <div className="py-10 text-center">
              <AlertCircle size={40} className="mx-auto text-destructive mb-3" />
              <p className="text-sm text-destructive">{errorDetail}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDetail}
                className="mt-4"
              >
                Try again
              </Button>
            </div>
          ) : detailData ? (
            /* Detail content */
            <div className="space-y-6">
              {/* Month Title */}
              <h3 className="text-base font-semibold text-foreground">
                {detailData.month_name ||
                  MONTH_NAMES[Number(selectedMonth) - 1]}{' '}
                {year}
              </h3>

              {/* ── Income Detail ──────────────────────────────────────────── */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Income Detail
                </h4>
                {detailData.income?.detail?.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>House</TableHead>
                          <TableHead>Resident</TableHead>
                          <TableHead>Fee Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.income.detail.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.house || '-'}
                            </TableCell>
                            <TableCell>{item.resident || '-'}</TableCell>
                            <TableCell className="capitalize">
                              {item.fee_type || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatRupiah(item.amount || 0)}
                            </TableCell>
                            <TableCell>
                              {item.payment_date
                                ? new Date(
                                    item.payment_date
                                  ).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  item.status === 'paid'
                                    ? 'default'
                                    : 'destructive'
                                }
                                className={cn(
                                  item.status === 'paid' &&
                                    'bg-green-600 text-white hover:bg-green-700'
                                )}
                              >
                                {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No income data for this month.
                  </p>
                )}
              </div>

              <Separator />

              {/* ── Expense Detail ─────────────────────────────────────────── */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  <TrendingDown size={16} />
                  Expense Detail
                </h4>
                {detailData.expenses?.detail?.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.expenses.detail.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {item.category || '-'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatRupiah(item.amount || 0)}
                            </TableCell>
                            <TableCell>
                              {item.date
                                ? new Date(item.date).toLocaleDateString(
                                    'en-US',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No expense data for this month.
                  </p>
                )}
              </div>

              <Separator />

              {/* ── Monthly Summary ────────────────────────────────────────── */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Summary for{' '}
                    {detailData.month_name ||
                      MONTH_NAMES[Number(selectedMonth) - 1]}{' '}
                    {year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-xs text-muted-foreground">
                        Total Income
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatRupiah(detailData.income?.total || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-xs text-muted-foreground">
                        Total Expenses
                      </span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatRupiah(detailData.expenses?.total || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-xs text-muted-foreground">
                        Balance
                      </span>
                      <span
                        className={cn(
                          'text-lg font-bold',
                          Number(detailData.balance || 0) >= 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {formatRupiah(detailData.balance || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
