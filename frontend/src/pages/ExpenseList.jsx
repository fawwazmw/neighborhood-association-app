import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  ArrowDownCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { expenseApi } from '../lib/api';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const MONTH_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const emptyForm = {
  category: '',
  description: '',
  amount: '',
  date: '',
  is_recurring: false,
};

// ─── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ isOpen, onClose, onSubmit, initialData, submitting }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        category: initialData.category || '',
        description: initialData.description || '',
        amount: initialData.amount ? String(Number(initialData.amount)) : '',
        date: initialData.date || '',
        is_recurring: !!initialData.is_recurring,
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              placeholder="e.g. Security Salary"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (IDR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min="0"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_recurring"
              id="is_recurring"
              checked={form.is_recurring}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_recurring" className="text-sm text-gray-700">
              Recurring expense
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
            Delete Expense?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete the expense{' '}
            <span className="font-medium text-gray-700">"{item.category}"</span>?
            This action cannot be undone.
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
export default function ExpenseList() {
  // Data state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Filter state
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, year };
        if (month) params.month = month;
        if (category.trim()) params.category = category.trim();

        const res = await expenseApi.getAll(params);
        const result = res.data?.data || res.data;

        if (Array.isArray(result)) {
          setData(result);
          setPagination({ currentPage: 1, lastPage: 1, total: result.length });
        } else {
          setData(result.data || []);
          setPagination({
            currentPage: result.current_page || 1,
            lastPage: result.last_page || 1,
            total: result.total || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expense data. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [year, month, category]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // ── Total expenses ──────────────────────────────────────────────────────────
  const totalExpenses = data.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await expenseApi.update(editItem.id, formData);
      } else {
        await expenseApi.create(formData);
      }
      handleCloseModal();
      fetchData(editItem ? pagination.currentPage : 1);
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save data. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      await expenseApi.delete(deleteItem.id);
      handleCloseDelete();
      fetchData(pagination.currentPage);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Failed to delete data. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.lastPage) {
      fetchData(page);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage neighborhood association expenses
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Total Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-600">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Expenses (this page)
            </p>
            {loading ? (
              <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(totalExpenses)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Search category..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex items-end">
            <p className="text-xs text-gray-400">
              Showing {data.length} of {pagination.total} records
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchData(1)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <ArrowDownCircle
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />
            <p className="font-medium">No expense data yet</p>
            <p className="text-sm mt-1">
              Click &quot;Add Expense&quot; to add new data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600 w-12">
                    No
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600">
                    Category
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600">
                    Description
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-right">
                    Amount
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                    Recurring
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500">
                      {(pagination.currentPage - 1) * data.length > 0
                        ? (pagination.currentPage - 1) * 10 + index + 1
                        : index + 1}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium">
                      {item.category}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium text-right">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {item.is_recurring ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        )}

        {/* Pagination */}
        {!loading && !error && pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} records)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
                .filter((page) => {
                  const current = pagination.currentPage;
                  return (
                    page === 1 ||
                    page === pagination.lastPage ||
                    Math.abs(page - current) <= 1
                  );
                })
                .reduce((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push('...');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, idx) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-sm text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editItem}
        submitting={submitting}
      />

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
