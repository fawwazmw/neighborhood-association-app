import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
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
import { reportApi } from '../lib/api';

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

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, colorClass, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          {loading ? (
            <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-red-100 text-red-700',
  };

  const labelMap = {
    paid: 'Paid',
    pending: 'Pending',
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold text-gray-900">Financial Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Summary of neighborhood income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary Section ──────────────────────────────────────────────────── */}
      {errorSummary ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm text-red-600">{errorSummary}</p>
          <button
            onClick={fetchSummary}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={TrendingUp}
              label="Total Income"
              value={formatRupiah(summaryData?.totalIncome || 0)}
              colorClass="bg-green-50 text-green-600"
              loading={loadingSummary}
            />
            <SummaryCard
              icon={TrendingDown}
              label="Total Expenses"
              value={formatRupiah(summaryData?.totalExpenses || 0)}
              colorClass="bg-red-50 text-red-600"
              loading={loadingSummary}
            />
            <SummaryCard
              icon={Wallet}
              label="Final Balance"
              value={formatRupiah(summaryData?.finalBalance || 0)}
              colorClass="bg-blue-50 text-blue-600"
              loading={loadingSummary}
            />
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Income vs Expenses Chart — {year}
            </h2>
            {loadingSummary ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
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
          </div>
        </>
      )}

      {/* ── Monthly Detail Section ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Detail
            </h2>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">— Select Month —</option>
              {MONTH_NAMES.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5">
          {!selectedMonth ? (
            <div className="py-10 text-center text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Select a month to view details</p>
              <p className="text-sm mt-1">
                Choose a month from the dropdown above to display income and expense details.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : errorDetail ? (
            <div className="py-10 text-center">
              <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
              <p className="text-sm text-red-600">{errorDetail}</p>
              <button
                onClick={fetchDetail}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Month Title */}
              <h3 className="text-base font-semibold text-gray-800">
                {detailData.month_name || MONTH_NAMES[Number(selectedMonth) - 1]} {year}
              </h3>

              {/* Income Detail */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Income Detail
                </h4>
                {detailData.income?.detail?.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-green-50 text-left">
                          <th className="px-4 py-2.5 font-semibold text-gray-600">House</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Resident</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Fee Type</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Amount</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Payment Date</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailData.income.detail.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-900 font-medium">
                              {item.house || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">
                              {item.resident || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700 capitalize">
                              {item.fee_type || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-900 font-medium text-right">
                              {formatRupiah(item.amount || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {item.payment_date
                                ? new Date(item.payment_date).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <StatusBadge status={item.status || 'unpaid'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No income data for this month.
                  </p>
                )}
              </div>

              {/* Expense Detail */}
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <TrendingDown size={16} />
                  Expense Detail
                </h4>
                {detailData.expenses?.detail?.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-50 text-left">
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Category</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Description</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Amount</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailData.expenses.detail.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-900 font-medium">
                              {item.category || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">
                              {item.description || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-900 font-medium text-right">
                              {formatRupiah(item.amount || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {item.date
                                ? new Date(item.date).toLocaleDateString('en-US', {
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
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No expense data for this month.
                  </p>
                )}
              </div>

              {/* Monthly Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Summary for {detailData.month_name || MONTH_NAMES[Number(selectedMonth) - 1]} {year}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-xs text-gray-500">Total Income</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatRupiah(detailData.income?.total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-xs text-gray-500">Total Expenses</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatRupiah(detailData.expenses?.total || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-xs text-gray-500">Balance</span>
                    <span
                      className={`text-lg font-bold ${
                        Number(detailData.balance || 0) >= 0
                          ? 'text-blue-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatRupiah(detailData.balance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
