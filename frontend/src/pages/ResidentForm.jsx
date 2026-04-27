import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Save, ArrowLeft, Upload, X } from 'lucide-react';
import { residentApi } from '../lib/api';

export default function ResidentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: '',
    id_photo: null,
    resident_status: 'permanent',
    phone_number: '',
    marital_status: false,
  });

  const [existingPhoto, setExistingPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // Load existing data when editing
  useEffect(() => {
    if (!isEdit) return;

    const fetchData = async () => {
      setFetching(true);
      try {
        const response = await residentApi.getById(id);
        if (response.data.success) {
          const data = response.data.data;
          setFormData({
            full_name: data.full_name || '',
            id_photo: null,
            resident_status: data.resident_status || 'permanent',
            phone_number: data.phone_number || '',
            marital_status: Boolean(data.marital_status),
          });
          if (data.id_photo) {
            setExistingPhoto(data.id_photo);
          }
        }
      } catch (err) {
        setGeneralError(
          err.response?.data?.message || 'Failed to load resident data.'
        );
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, id_photo: file }));

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    if (errors.id_photo) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.id_photo;
        return next;
      });
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, id_photo: null }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload = {
        full_name: formData.full_name,
        resident_status: formData.resident_status,
        phone_number: formData.phone_number,
        marital_status: formData.marital_status ? 1 : 0,
      };

      // Only include photo if a new one was selected
      if (formData.id_photo) {
        payload.id_photo = formData.id_photo;
      }

      let response;
      if (isEdit) {
        response = await residentApi.update(id, payload);
      } else {
        response = await residentApi.create(payload);
      }

      if (response.data.success) {
        navigate('/residents');
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(
          err.response?.data?.message || 'An error occurred while saving data.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get first error message for a field
  const getError = (field) => {
    if (!errors[field]) return null;
    return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading resident data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/residents')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Resident' : 'Add Resident'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit
                ? 'Update existing resident data'
                : 'Add a new resident to the system'}
            </p>
          </div>
        </div>
      </div>

      {/* General Error */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{generalError}</p>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {/* Full Name */}
          <div className="p-5">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-shadow ${
                getError('full_name')
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {getError('full_name') && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError('full_name')}
              </p>
            )}
          </div>

          {/* ID Photo */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ID Photo
            </label>

            {/* Existing photo (edit mode) */}
            {isEdit && existingPhoto && !photoPreview && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Current photo:</p>
                <img
                  src={`/storage/${existingPhoto}`}
                  alt="Current ID"
                  className="w-48 h-auto rounded-lg border border-gray-200 object-cover"
                />
              </div>
            )}

            {/* New photo preview */}
            {photoPreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={photoPreview}
                  alt="ID Preview"
                  className="w-48 h-auto rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label
                htmlFor="id_photo"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload size={16} />
                {photoPreview ? 'Change Photo' : 'Choose Photo'}
              </label>
              <input
                type="file"
                id="id_photo"
                name="id_photo"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {formData.id_photo && (
                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                  {formData.id_photo.name}
                </span>
              )}
            </div>
            {getError('id_photo') && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError('id_photo')}
              </p>
            )}
          </div>

          {/* Resident Status */}
          <div className="p-5">
            <label
              htmlFor="resident_status"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Resident Status <span className="text-red-500">*</span>
            </label>
            <select
              id="resident_status"
              name="resident_status"
              value={formData.resident_status}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-shadow bg-white ${
                getError('resident_status')
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
            </select>
            {getError('resident_status') && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError('resident_status')}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="p-5">
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              placeholder="e.g. 08123456789"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-shadow ${
                getError('phone_number')
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {getError('phone_number') && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError('phone_number')}
              </p>
            )}
          </div>

          {/* Marital Status */}
          <div className="p-5">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="marital_status"
                name="marital_status"
                checked={formData.marital_status}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <label
                htmlFor="marital_status"
                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
              >
                Married
              </label>
            </div>
            {getError('marital_status') && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError('marital_status')}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/residents')}
            className="px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
