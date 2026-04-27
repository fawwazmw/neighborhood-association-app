import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { residentApi } from '../lib/api';

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteConfirmModal({ isOpen, onClose, onConfirm, item, deleting }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-full mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Resident?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete resident{' '}
            <span className="font-medium text-gray-700">
              &quot;{item.full_name}&quot;
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {deleting && <Loader2 size={16} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ResidentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await residentApi.getAll({
        search: searchParams.get('search') || '',
        page: currentPage,
      });
      if (response.data.success) {
        const { data, current_page, last_page, total } = response.data.data;
        setResidents(data);
        setPagination({
          currentPage: current_page,
          lastPage: last_page,
          total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resident data.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  };

  const handleOpenDelete = (item) => {
    setDeleteItem(item);
    setDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteModalOpen(false);
    setDeleteItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const response = await residentApi.delete(deleteItem.id);
      if (response.data.success) {
        handleCloseDelete();
        fetchResidents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete resident.');
    } finally {
      setDeleting(false);
    }
  };

  const renderPaginationButtons = () => {
    const { currentPage, lastPage } = pagination;
    const pages = [];

    // Always show first page
    pages.push(1);

    // Show ellipsis or pages around current
    if (currentPage > 3) pages.push('...');

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(lastPage - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < lastPage - 2) pages.push('...');

    // Always show last page if more than 1
    if (lastPage > 1) pages.push(lastPage);

    return pages.map((page, idx) =>
      page === '...' ? (
        <span
          key={`ellipsis-${idx}`}
          className="px-3 py-2 text-sm text-gray-500"
        >
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      )
    );
  };

  // Helper to get the current house for a resident
  const getCurrentHouse = (item) => {
    const activeAssignment = (item.house_residents || []).find(
      (hr) => hr.is_active === true || hr.is_active === 1
    );
    if (activeAssignment) {
      return activeAssignment.house?.house_number || activeAssignment.house_number || '-';
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
            <p className="text-sm text-gray-500">
              Manage resident data ({pagination.total} total)
            </p>
          </div>
        </div>
        <Link
          to="/residents/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Resident
        </Link>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchResidents}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading data...</p>
            </div>
          </div>
        ) : residents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Users className="text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No resident data</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchParams.get('search')
                ? 'Try changing your search keywords.'
                : 'Start by adding a new resident.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">
                      No
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Phone Number
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Resident Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Marital Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Current House
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {residents.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {(pagination.currentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.phone_number || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.resident_status === 'permanent'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.resident_status === 'permanent'
                            ? 'Permanent'
                            : 'Contract'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.marital_status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            Married
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Single
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getCurrentHouse(item)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/residents/${item.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  Showing page{' '}
                  <span className="font-medium text-gray-700">
                    {pagination.currentPage}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-700">
                    {pagination.lastPage}
                  </span>{' '}
                  ({pagination.total} records)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handlePageChange(pagination.currentPage - 1)
                    }
                    disabled={pagination.currentPage <= 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {renderPaginationButtons()}
                  <button
                    onClick={() =>
                      handlePageChange(pagination.currentPage + 1)
                    }
                    disabled={
                      pagination.currentPage >= pagination.lastPage
                    }
                    className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        item={deleteItem}
        deleting={deleting}
      />
    </div>
  );
}
