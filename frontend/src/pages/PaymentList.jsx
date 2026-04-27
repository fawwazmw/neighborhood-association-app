import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Trash2, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { paymentApi } from '../lib/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

function StatusBadge({ status }) {
  const isPaid = status === 'paid';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPaid
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {isPaid ? 'Paid' : 'Unpaid'}
    </span>
  );
}

export default function PaymentList() {
  const currentYear = new Date().getFullYear();

  // Filter state
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [feeType, setFeeType] = useState('');
  const [status, setStatus] = useState('');

  // Data state
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate bills modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(currentYear);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, year };
      if (month) params.month = month;
      if (feeType) params.fee_type = feeType;
      if (status) params.status = status;

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
  }, [year, month, feeType, status]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleMarkPaid = async (id) => {
    if (!window.confirm('Mark this payment as paid?')) return;
    try {
      await paymentApi.update(id, { status: 'paid' });
      fetchPayments(currentPage);
    } catch (err) {
      console.error('Failed to update payment:', err);
      alert('Failed to update payment status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentApi.delete(id);
      fetchPayments(currentPage);
    } catch (err) {
      console.error('Failed to delete payment:', err);
      alert('Failed to delete payment.');
    }
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await paymentApi.generateBills({
        month: generateMonth,
        year: generateYear,
      });
      const count = res.data?.data?.count ?? res.data?.count ?? res.data?.data?.length ?? 0;
      setGenerateResult({ success: true, count });
      fetchPayments(1);
    } catch (err) {
      console.error('Failed to generate bills:', err);
      const message = err.response?.data?.message || 'Failed to generate bills.';
      setGenerateResult({ success: false, message });
    } finally {
      setGenerating(false);
    }
  };

  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage resident fee payment data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowGenerateModal(true);
              setGenerateResult(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Receipt size={16} />
            Generate Bills
          </button>
          <Link
            to="/payments/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Payment
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          {/* Fee Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">
            <p>{error}</p>
            <button
              onClick={() => fetchPayments(currentPage)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p>No payment data yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600 w-12">No</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">House</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Resident</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Fee Type</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Month/Year</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-right">Amount</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Payment Date</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{rowNumber}</td>
                      <td className="px-5 py-3 text-gray-900 font-medium">{houseNumber}</td>
                      <td className="px-5 py-3 text-gray-700">{residentName}</td>
                      <td className="px-5 py-3 text-gray-700">{feeTypeLabel}</td>
                      <td className="px-5 py-3 text-gray-700">{monthYear}</td>
                      <td className="px-5 py-3 text-gray-900 font-medium text-right">
                        {formatRupiah(payment.amount || 0)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={payment.status} />
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
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {payment.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={14} />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing page {currentPage} of {lastPage} ({total} records)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchPayments(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Prev
              </button>
              {Array.from({ length: lastPage }, (_, i) => i + 1)
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
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => fetchPayments(item)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        item === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => fetchPayments(currentPage + 1)}
                disabled={currentPage >= lastPage}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Bills Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Generate Bills</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={generateYear}
                  onChange={(e) => setGenerateYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {generateResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    generateResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {generateResult.success
                    ? `Successfully generated ${generateResult.count} bills.`
                    : generateResult.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateBills}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Receipt size={16} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
