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
import { houseApi, paymentApi, reportApi } from '../lib/api';

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

function SummaryCard({ icon: Icon, label, value, color, loading }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          {loading ? (
            <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatRupiah(entry.value)}
        </p>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-red-100 text-red-700',
  };

  const labelMap = {
    paid: 'Paid',
    unpaid: 'Unpaid',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        map[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {labelMap[status] || status}
    </span>
  );
}

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
        paymentApi.getAll({ page: 1 }),
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Neighborhood administration data summary
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Home}
          label="Total Houses"
          value={totalHouses}
          color="blue"
          loading={loading}
        />
        <SummaryCard
          icon={Building2}
          label="Occupied Houses"
          value={occupiedHouses}
          color="green"
          loading={loading}
        />
        <SummaryCard
          icon={Users}
          label="Total Residents"
          value={totalResidents}
          color="purple"
          loading={loading}
        />
        <SummaryCard
          icon={Wallet}
          label="This Month Balance"
          value={formatRupiah(thisMonthBalance)}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Financial Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Income vs Expenses {new Date().getFullYear()}
        </h2>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 13 }}
                iconType="circle"
              />
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
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Payments
          </h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentPayments.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p>No payment data yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">House</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Resident</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Fee Type</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-right">Amount</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-900 font-medium">
                      {payment.house_resident?.house?.house_number || '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {payment.house_resident?.resident?.full_name || '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-700 capitalize">
                      {payment.fee_type || '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium text-right">
                      {formatRupiah(payment.amount || 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={payment.status || 'unpaid'} />
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
