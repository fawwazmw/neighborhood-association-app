import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Eye,
  UserCheck,
  UserX,
  X,
  Loader2,
} from 'lucide-react';
import { houseApi } from '../lib/api';

export default function HouseList() {
  const [houseList, setHouseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ house_number: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const response = await houseApi.getAll(params);
      setHouseList(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load house data.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchHouses();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchHouses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      await houseApi.create(formData);
      setShowModal(false);
      setFormData({ house_number: '', address: '' });
      fetchHouses();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to add house.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ house_number: '', address: '' });
    setFormError(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Houses</h1>
            <p className="text-sm text-gray-500">
              Manage house data in the neighborhood
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add House
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search house number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && houseList.length === 0 && (
        <div className="text-center py-20">
          <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg font-medium">
            No house data yet
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {search
              ? 'No houses found matching your search.'
              : 'Click "Add House" to add data.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && houseList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houseList.map((house) => {
            const isOccupied = house.occupancy_status === 'Occupied';
            // Find active resident from house_residents relationship
            const activeResident = (house.house_residents || []).find(
              (hr) => hr.is_active === true || hr.is_active === 1
            );

            return (
              <div
                key={house.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building2 className="text-gray-600" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {house.house_number}
                        </h3>
                        {house.address && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {house.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isOccupied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>

                  {/* Resident info */}
                  <div className="mb-4 min-h-[48px]">
                    {isOccupied && activeResident ? (
                      <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg">
                        <UserCheck className="text-green-600 shrink-0" size={16} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {activeResident.resident?.full_name ||
                              activeResident.full_name ||
                              '-'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {activeResident.resident?.resident_status ||
                              activeResident.resident_status ||
                              '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <UserX className="text-gray-400 shrink-0" size={16} />
                        <p className="text-sm text-gray-400">
                          No resident assigned
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Link
                    to={`/houses/${house.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={16} />
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add New House
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Enter the house details to add
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="px-6 py-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    House Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.house_number}
                    onChange={(e) =>
                      setFormData({ ...formData, house_number: e.target.value })
                    }
                    placeholder="e.g. A-01"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="e.g. 123 Main Street"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
