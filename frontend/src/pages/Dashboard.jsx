import { useState, useEffect } from 'react';
import { Home, Users, Building2, Wallet } from 'lucide-react';
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
import { houseApi, paymentApi, reportApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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
              <div className="h-7 w-24 bg-muted rounded animate-pulse mt-1" />
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

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [houseData, setHouseData] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [thisMonthBalance, setThisMonthBalance] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();

      const [houseRes, paymentRes, reportRes] = await Promise.all([
        houseApi.getAll(),
        paymentApi.getAll({ page: 1, status: 'paid' }),
        reportApi.summary(currentYear),
      ]);

      // House data
      if (houseRes.data?.success) {
        setHouseData(houseRes.data.data);
      }

      // Recent payments (last 5)
      if (paymentRes.data?.success) {
        const payments = paymentRes.data.data?.data || paymentRes.data.data || [];
        setRecentPayments(payments.slice(0, 5));
      }

      // Report summary → chart data & balance
      if (reportRes.data?.success) {
        const summary = reportRes.data.data?.summary || [];

        const chart = MONTH_NAMES.map((name, index) => {
          const monthData = summary.find((s) => Number(s.month) === index + 1);
          return {
            month: name,
            income: monthData ? Number(monthData.income || 0) : 0,
            expenses: monthData ? Number(monthData.expenses || 0) : 0,
          };
        });
        setChartData(chart);

        // This month's balance
        const currentMonth = new Date().getMonth() + 1;
        const thisMonth = summary.find((s) => Number(s.month) === currentMonth);
        if (thisMonth) {
          setThisMonthBalance(
            Number(thisMonth.income || 0) - Number(thisMonth.expenses || 0)
          );
        } else {
          setThisMonthBalance(0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHouses = houseData.length;
  const occupiedHouses = houseData.filter(
    (h) => h.occupancy_status === 'Occupied'
  ).length;
  const totalResidents = houseData.reduce((acc, h) => {
    const activeResidents = (h.house_residents || []).filter((hr) => hr.is_active);
    return acc + activeResidents.length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Neighborhood administration data summary
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Home}
          label="Total Houses"
          value={totalHouses}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          loading={loading}
        />
        <SummaryCard
          icon={Building2}
          label="Occupied Houses"
          value={occupiedHouses}
          iconClassName="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
          loading={loading}
        />
        <SummaryCard
          icon={Users}
          label="Total Residents"
          value={totalResidents}
          iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          loading={loading}
        />
        <SummaryCard
          icon={Wallet}
          label="This Month Balance"
          value={formatRupiah(thisMonthBalance)}
          iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          loading={loading}
        />
      </div>

      {/* Financial Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Income vs Expenses {new Date().getFullYear()}
          </CardTitle>
          <CardDescription>
            Monthly financial overview for the current year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
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
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.06)', radius: 4 }}
                />
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

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
          <CardDescription>
            Latest payment transactions recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <p>No payment data yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.house_resident?.house?.house_number || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.house_resident?.resident?.full_name || '-'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.fee_type || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(payment.amount || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={payment.status === 'paid' ? 'default' : 'destructive'}
                        className={cn(
                          payment.status === 'paid' &&
                            'bg-green-600 text-white hover:bg-green-700'
                        )}
                      >
                        {payment.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString(
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
