import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  UserPlus,
  UserMinus,
  History,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { houseApi, residentApi } from '../lib/api';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign resident modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [residentList, setResidentList] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [assignData, setAssignData] = useState({
    resident_id: '',
    start_date: '',
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // Remove resident
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  const fetchHouse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await houseApi.getById(id);
      setHouse(response.data?.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load house data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHouse();
  }, [fetchHouse]);

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignError(null);
    setAssignData({ resident_id: '', start_date: '' });
    try {
      setLoadingResidents(true);
      const response = await residentApi.getAll({ per_page: 100 });
      const data = response.data?.data;
      // Handle both paginated and non-paginated responses
      setResidentList(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setAssignError('Failed to load resident data.');
    } finally {
      setLoadingResidents(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      setAssignSubmitting(true);
      setAssignError(null);
      await houseApi.assignResident(id, assignData);
      setShowAssignModal(false);
      fetchHouse();
    } catch (err) {
      setAssignError(
        err.response?.data?.message || 'Failed to assign resident.'
      );
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRemoveResident = async () => {
    if (!window.confirm('Are you sure you want to remove the resident from this house?')) {
      return;
    }
    try {
      setRemoveSubmitting(true);
      await houseApi.removeResident(id);
      fetchHouse();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove resident.');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  // Derived data
  const activeResident = (house?.house_residents || []).find(
    (hr) => hr.is_active === true || hr.is_active === 1
  );
  const isOccupied = !!activeResident;
  const houseResidentHistory = house?.house_residents || [];
  // Collect all payments from all house_residents records
  const paymentList = houseResidentHistory.flatMap(
    (hr) => (hr.payments || []).map(p => ({ ...p, _resident: hr.resident }))
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/houses')}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to House List
        </button>
      </div>
    );
  }

  if (!house) return null;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/houses')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to House List
      </button>

      {/* House Info Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="text-blue-600" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  House {house.house_number}
                </h1>
                {house.address && (
                  <p className="text-sm text-gray-500 mt-0.5">{house.address}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                  isOccupied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isOccupied ? 'Occupied' : 'Vacant'}
              </span>
              <Link
                to={`/houses/${id}/edit`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Current Resident Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} className="text-gray-500" />
            Current Resident
          </h2>
        </div>
        <div className="p-6">
          {isOccupied && activeResident ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Resident Name
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {activeResident.resident?.full_name ||
                      activeResident.full_name ||
                      '-'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Phone Number
                    </p>
                    <p className="text-sm text-gray-700">
                      {activeResident.resident?.phone_number ||
                        activeResident.phone_number ||
                        '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Status
                    </p>
                    <p className="text-sm text-gray-700 capitalize">
                      {activeResident.resident?.resident_status ||
                        activeResident.resident_status ||
                        '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Move-in Date
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatDate(activeResident.start_date)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveResident}
                disabled={removeSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 shrink-0"
              >
                <UserMinus size={16} />
                {removeSubmitting ? 'Removing...' : 'Remove Resident'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-4">
                This house does not have a resident yet.
              </p>
              <button
                onClick={openAssignModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={16} />
                Assign Resident
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resident History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History size={20} className="text-gray-500" />
            Resident History
          </h2>
        </div>
        <div className="overflow-x-auto">
          {houseResidentHistory.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Resident Name
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Start Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    End Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...houseResidentHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.start_date || 0) -
                      new Date(a.start_date || 0)
                  )
                  .map((hr, idx) => (
                    <tr key={hr.id || idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {hr.resident?.full_name || '-'}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {formatDate(hr.start_date)}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {formatDate(hr.end_date)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            hr.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {hr.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No resident history yet.
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard size={20} className="text-gray-500" />
            Payment History
          </h2>
        </div>
        <div className="overflow-x-auto">
          {paymentList.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Month/Year
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Fee Type
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...paymentList]
                  .sort((a, b) => {
                    const dateA = `${a.year}-${String(a.month).padStart(2, '0')}`;
                    const dateB = `${b.year}-${String(b.month).padStart(2, '0')}`;
                    return dateB.localeCompare(dateA);
                  })
                  .map((p, idx) => {
                    const monthName = new Date(
                      p.year,
                      (p.month || 1) - 1
                    ).toLocaleDateString('en-US', { month: 'long' });
                    const isPaid =
                      p.status === 'paid';

                    return (
                      <tr key={p.id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {monthName} {p.year}
                        </td>
                        <td className="px-6 py-3 text-gray-600 capitalize">
                          {p.fee_type || '-'}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {formatCurrency(p.amount || 0)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isPaid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {formatDate(p.payment_date)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No payment history yet.
            </div>
          )}
        </div>
      </div>

      {/* Assign Resident Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Resident
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Select a resident to assign to this house
              </p>
            </div>

            <form onSubmit={handleAssign}>
              <div className="px-6 py-4 space-y-4">
                {assignError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {assignError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resident <span className="text-red-500">*</span>
                  </label>
                  {loadingResidents ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Loading resident data...
                    </div>
                  ) : (
                    <select
                      required
                      value={assignData.resident_id}
                      onChange={(e) =>
                        setAssignData({
                          ...assignData,
                          resident_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">-- Select Resident --</option>
                      {residentList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.full_name}{' '}
                          {r.resident_status
                            ? `(${r.resident_status})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={assignData.start_date}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting || loadingResidents}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
