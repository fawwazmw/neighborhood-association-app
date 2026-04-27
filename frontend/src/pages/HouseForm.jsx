import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { houseApi } from '../lib/api';

export default function HouseForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    house_number: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load existing data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await houseApi.getById(id);
        const data = response.data?.data || response.data;
        setFormData({
          house_number: data.house_number || '',
          address: data.address || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load house data.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await houseApi.update(id, formData);
      navigate(`/houses/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save house data.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(id ? `/houses/${id}` : '/houses')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {id ? 'Back to House Detail' : 'Back to House List'}
      </button>

      {/* Form Card */}
      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Edit House
                </h1>
                <p className="text-sm text-gray-500">
                  Update house information
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="house_number"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  House Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="house_number"
                  name="house_number"
                  required
                  value={formData.house_number}
                  onChange={handleChange}
                  placeholder="e.g. A-01"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Maple Street"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(id ? `/houses/${id}` : '/houses')}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
