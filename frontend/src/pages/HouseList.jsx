import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Loader2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

import { houseApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function HouseList() {
  const navigate = useNavigate();

  const [houseList, setHouseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 12;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ house_number: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const response = await houseApi.getAll(params);
      setHouseList(response.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load house data.');
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
      await houseApi.create(formData);
      toast.success('House added successfully.');
      setDialogOpen(false);
      setFormData({ house_number: '', address: '' });
      fetchHouses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add house.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setFormData({ house_number: '', address: '' });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Houses</h1>
          <p className="text-sm text-muted-foreground">
            Manage house data in the neighborhood
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger
            render={
              <Button size="lg">
                <Plus className="size-4" />
                Add House
              </Button>
            }
          />

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New House</DialogTitle>
              <DialogDescription>
                Enter the house details below to add a new house.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="house_number">
                    House Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="house_number"
                    required
                    placeholder="e.g. A-01"
                    value={formData.house_number}
                    onChange={(e) =>
                      setFormData({ ...formData, house_number: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. 123 Main Street"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  }
                />
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search house number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-20 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && houseList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No houses found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search
              ? 'No houses match your search. Try a different keyword.'
              : 'Click "Add House" to get started.'}
          </p>
        </div>
      )}

      {/* House Grid */}
      {!loading && houseList.length > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(houseList.length / PER_PAGE));
        const safePage = Math.min(currentPage, totalPages);
        const paginatedHouses = houseList.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

        return (<>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedHouses.map((house) => {
            const isOccupied = house.occupancy_status === 'Occupied';
            const activeResident = (house.house_residents || []).find(
              (hr) => hr.is_active === true || hr.is_active === 1
            );

            return (
              <Card
                key={house.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/houses/${house.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {house.house_number}
                      </CardTitle>
                      {house.address && (
                        <CardDescription className="line-clamp-1">
                          {house.address}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={isOccupied ? 'default' : 'secondary'}>
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {isOccupied && activeResident ? (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                      <UserCheck className="size-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {activeResident.resident?.full_name ||
                          activeResident.full_name ||
                          '-'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                      <UserX className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        No resident assigned
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{safePage}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>{' '}
              ({houseList.length} houses)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(safePage - 1)}
                disabled={safePage <= 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(safePage + 1)}
                disabled={safePage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </>);
      })()}
    </div>
  );
}
