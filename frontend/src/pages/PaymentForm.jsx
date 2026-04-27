import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { paymentApi, houseApi } from '../lib/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FEE_AMOUNTS = {
  security: 100000,
  cleaning: 15000,
};

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

export default function PaymentForm() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Tab state
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'

  // House options
  const [houses, setHouses] = useState([]);
  const [loadingHouses, setLoadingHouses] = useState(true);

  // Form state — shared
  const [houseResidentId, setHouseResidentId] = useState('');
  const [feeType, setFeeType] = useState('security');
  const [year, setYear] = useState(currentYear);
  const [amount, setAmount] = useState(FEE_AMOUNTS.security);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  // Single mode
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Bulk mode
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load houses
  useEffect(() => {
    const fetchHouses = async () => {
      setLoadingHouses(true);
      try {
        const res = await houseApi.getAll();
        const allHouses = res.data?.data || [];

        // Filter to only houses with active residents
        const occupiedHouses = allHouses.filter((house) => {
          const residentList = house.house_residents || house.residents || [];
          if (Array.isArray(residentList)) {
            return residentList.some((hr) => hr.is_active || hr.is_active === 1);
          }
          return false;
        });

        // Map to usable options
        const options = occupiedHouses.map((house) => {
          const residentList = house.house_residents || house.residents || [];
          const activeHr = Array.isArray(residentList)
            ? residentList.find((hr) => hr.is_active || hr.is_active === 1)
            : null;

          const residentName =
            activeHr?.resident?.full_name ||
            activeHr?.full_name ||
            house.active_resident?.full_name ||
            '-';

          return {
            id: activeHr?.id || house.id,
            houseNumber: house.house_number,
            residentName,
            label: `${house.house_number} — ${residentName}`,
          };
        });

        setHouses(options);
        if (options.length > 0) {
          setHouseResidentId(options[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch houses:', err);
      } finally {
        setLoadingHouses(false);
      }
    };

    fetchHouses();
  }, []);

  // Auto-fill amount when fee_type changes
  useEffect(() => {
    setAmount(FEE_AMOUNTS[feeType] || 0);
  }, [feeType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'single') {
        await paymentApi.create({
          house_resident_id: houseResidentId,
          fee_type: feeType,
          month,
          year,
          amount,
          status: paymentStatus,
        });
      } else {
        await paymentApi.createBulk({
          house_resident_id: houseResidentId,
          fee_type: feeType,
          year,
          start_month: startMonth,
          end_month: endMonth,
          amount,
          status: paymentStatus,
        });
      }
      navigate('/payments');
    } catch (err) {
      console.error('Failed to create payment:', err);
      const message =
        err.response?.data?.message ||
        'Failed to save payment. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Payment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new fee payment
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Mode Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 px-6 py-3.5 text-sm font-medium text-center transition-colors ${
                mode === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Single Payment
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 px-6 py-3.5 text-sm font-medium text-center transition-colors ${
                mode === 'bulk'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Bulk Payment
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* House */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House <span className="text-red-500">*</span>
            </label>
            {loadingHouses ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : houses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No houses with active residents available.
              </p>
            ) : (
              <select
                value={houseResidentId}
                onChange={(e) => setHouseResidentId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fee Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Type <span className="text-red-500">*</span>
            </label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2100}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Single: Month */}
          {mode === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Bulk: Start Month & End Month */}
          {mode === 'bulk' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Month <span className="text-red-500">*</span>
                </label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Month <span className="text-red-500">*</span>
                </label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              {formatRupiah(amount)}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Bulk info */}
          {mode === 'bulk' && startMonth && endMonth && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
              This will create{' '}
              <strong>
                {endMonth >= startMonth ? endMonth - startMonth + 1 : 0}
              </strong>{' '}
              payments ({MONTH_NAMES[startMonth - 1]} — {MONTH_NAMES[endMonth - 1]}{' '}
              {year}) with a total of{' '}
              <strong>
                {formatRupiah(
                  amount * (endMonth >= startMonth ? endMonth - startMonth + 1 : 0)
                )}
              </strong>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || houses.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
