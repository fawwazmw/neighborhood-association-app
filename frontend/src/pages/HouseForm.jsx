import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { houseApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HouseForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    house_number: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load existing data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await houseApi.getById(id);
        const data = response.data?.data || response.data;
        setFormData({
          house_number: data.house_number || '',
          address: data.address || '',
        });
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to load house data.'
        );
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
      await houseApi.update(id, formData);
      toast.success('House updated successfully.');
      navigate(`/houses/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save house data.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(`/houses/${id}`)}
      >
        <ArrowLeft className="size-4" />
        Back to House Detail
      </Button>

      {/* Form Card */}
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit House</CardTitle>
            <CardDescription>Update house information</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="house_number">
                  House Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="house_number"
                  name="house_number"
                  required
                  placeholder="e.g. A-01"
                  value={formData.house_number}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="e.g. 123 Maple Street"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/houses/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
