import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, Loader2 } from "lucide-react";
import { residentApi } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function ResidentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: "",
    id_photo: null,
    resident_status: "permanent",
    phone_number: "",
    marital_status: false,
  });

  const [existingPhoto, setExistingPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // ── Load existing data when editing ───────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;

    const fetchData = async () => {
      setFetching(true);
      try {
        const response = await residentApi.getById(id);
        if (response.data.success) {
          const data = response.data.data;
          setFormData({
            full_name: data.full_name || "",
            id_photo: null,
            resident_status: data.resident_status || "permanent",
            phone_number: data.phone_number || "",
            marital_status: Boolean(data.marital_status),
          });
          if (data.id_photo) {
            setExistingPhoto(data.id_photo);
          }
        }
      } catch (err) {
        setGeneralError(
          err.response?.data?.message || "Failed to load resident data."
        );
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        toast.success(
          isEdit
            ? "Resident updated successfully"
            : "Resident created successfully"
        );
        navigate("/residents");
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(
          err.response?.data?.message || "An error occurred while saving data."
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

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading resident data...
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/residents")}
        >
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Resident" : "Add Resident"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update existing resident data"
              : "Add a new resident to the system"}
          </p>
        </div>
      </div>

      {/* General Error */}
      {generalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{generalError}</p>
        </div>
      )}

      {/* Field Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="mb-2 text-sm font-medium text-destructive">
            Please fix the following errors:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
            {Object.entries(errors).map(([field, messages]) => (
              <li key={field}>
                {Array.isArray(messages) ? messages[0] : messages}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Resident Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                aria-invalid={!!getError("full_name")}
              />
              {getError("full_name") && (
                <p className="text-xs text-destructive">
                  {getError("full_name")}
                </p>
              )}
            </div>

            <Separator />

            {/* ID Photo */}
            <div className="space-y-2">
              <Label>ID Photo</Label>

              {/* Existing photo (edit mode) */}
              {isEdit && existingPhoto && !photoPreview && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Current photo:
                  </p>
                  <img
                    src={`/storage/${existingPhoto}`}
                    alt="Current ID"
                    className="w-48 rounded-lg border object-cover"
                  />
                </div>
              )}

              {/* New photo preview */}
              {photoPreview && (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="ID Preview"
                    className="w-48 rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="absolute -top-2 -right-2"
                    onClick={removePhoto}
                  >
                    <X />
                    <span className="sr-only">Remove photo</span>
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload />
                  {photoPreview ? "Change Photo" : "Choose Photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {formData.id_photo && (
                  <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {formData.id_photo.name}
                  </span>
                )}
              </div>
              {getError("id_photo") && (
                <p className="text-xs text-destructive">
                  {getError("id_photo")}
                </p>
              )}
            </div>

            <Separator />

            {/* Resident Status */}
            <div className="space-y-2">
              <Label htmlFor="resident_status">
                Resident Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.resident_status}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, resident_status: value }));
                  if (errors.resident_status) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.resident_status;
                      return next;
                    });
                  }
                }}
              >
                <SelectTrigger
                  id="resident_status"
                  className="w-full"
                  aria-invalid={!!getError("resident_status")}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              {getError("resident_status") && (
                <p className="text-xs text-destructive">
                  {getError("resident_status")}
                </p>
              )}
            </div>

            <Separator />

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                placeholder="e.g. 08123456789"
                aria-invalid={!!getError("phone_number")}
              />
              {getError("phone_number") && (
                <p className="text-xs text-destructive">
                  {getError("phone_number")}
                </p>
              )}
            </div>

            <Separator />

            {/* Marital Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="marital_status"
                  checked={formData.marital_status}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      marital_status: Boolean(checked),
                    }));
                    if (errors.marital_status) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.marital_status;
                        return next;
                      });
                    }
                  }}
                />
                <Label htmlFor="marital_status" className="cursor-pointer">
                  Married
                </Label>
              </div>
              {getError("marital_status") && (
                <p className="text-xs text-destructive">
                  {getError("marital_status")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/residents")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save />
                {isEdit ? "Update" : "Save"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
