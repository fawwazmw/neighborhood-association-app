import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  UserPlus,
  UserMinus,
  History,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { houseApi, residentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    month: 'short',
    year: 'numeric',
  });
};

export default function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign resident dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [residentList, setResidentList] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [assignData, setAssignData] = useState({
    resident_id: '',
    start_date: '',
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Remove resident dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  // Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const HISTORY_PER_PAGE = 5;
  const PAYMENT_PER_PAGE = 10;

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

  const openAssignDialog = async () => {
    setAssignDialogOpen(true);
    setAssignData({ resident_id: '', start_date: '' });
    try {
      setLoadingResidents(true);
      const response = await residentApi.getAll({ per_page: 100 });
      const data = response.data?.data;
      setResidentList(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Failed to load resident data.');
    } finally {
      setLoadingResidents(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      setAssignSubmitting(true);
      await houseApi.assignResident(id, assignData);
      toast.success('Resident assigned successfully.');
      setAssignDialogOpen(false);
      fetchHouse();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign resident.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRemoveResident = async () => {
    try {
      setRemoveSubmitting(true);
      await houseApi.removeResident(id);
      toast.success('Resident removed successfully.');
      setRemoveDialogOpen(false);
      fetchHouse();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove resident.');
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
  const paymentList = houseResidentHistory.flatMap((hr) =>
    (hr.payments || []).map((p) => ({ ...p, _resident: hr.resident }))
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10 space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button variant="ghost" onClick={() => navigate('/houses')}>
          <ArrowLeft className="size-4" />
          Back to House List
        </Button>
      </div>
    );
  }

  if (!house) return null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/houses')}>
        <ArrowLeft className="size-4" />
        Back to House List
      </Button>

      {/* House Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  House {house.house_number}
                </CardTitle>
                {house.address && (
                  <CardDescription>{house.address}</CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isOccupied ? 'default' : 'secondary'}>
                {isOccupied ? 'Occupied' : 'Vacant'}
              </Badge>
              <Link to={`/houses/${id}/edit`}>
                <Button variant="outline">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Resident Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            Current Resident
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isOccupied && activeResident ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Resident Name
                  </p>
                  <p className="text-base font-semibold">
                    {activeResident.resident?.full_name ||
                      activeResident.full_name ||
                      '-'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone Number
                    </p>
                    <p className="text-sm">
                      {activeResident.resident?.phone_number ||
                        activeResident.phone_number ||
                        '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </p>
                    <Badge variant="outline" className="mt-0.5 capitalize">
                      {activeResident.resident?.resident_status ||
                        activeResident.resident_status ||
                        '-'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Move-in Date
                    </p>
                    <p className="text-sm">
                      {formatDate(activeResident.start_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remove Resident with Confirmation Dialog */}
              <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <DialogTrigger
                  render={
                    <Button variant="destructive" className="shrink-0">
                      <UserMinus className="size-4" />
                      Remove Resident
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Resident</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove{' '}
                      <span className="font-semibold">
                        {activeResident.resident?.full_name ||
                          activeResident.full_name}
                      </span>{' '}
                      from this house? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button variant="outline">Cancel</Button>
                      }
                    />
                    <Button
                      variant="destructive"
                      disabled={removeSubmitting}
                      onClick={handleRemoveResident}
                    >
                      {removeSubmitting && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {removeSubmitting ? 'Removing...' : 'Remove'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                This house does not have a resident yet.
              </p>

              {/* Assign Resident Dialog */}
              <Dialog
                open={assignDialogOpen}
                onOpenChange={(open) => {
                  if (open) {
                    openAssignDialog();
                  } else {
                    setAssignDialogOpen(false);
                  }
                }}
              >
                <DialogTrigger
                  render={
                    <Button>
                      <UserPlus className="size-4" />
                      Assign Resident
                    </Button>
                  }
                />

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assign Resident</DialogTitle>
                    <DialogDescription>
                      Select a resident to assign to this house.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAssign}>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <Label>
                          Resident <span className="text-destructive">*</span>
                        </Label>
                        {loadingResidents ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="size-4 animate-spin" />
                            Loading residents...
                          </div>
                        ) : (
                          <Select
                            value={assignData.resident_id}
                            onValueChange={(value) =>
                              setAssignData({ ...assignData, resident_id: value })
                            }
                            required
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a resident" />
                            </SelectTrigger>
                            <SelectContent>
                              {residentList.map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>
                                  {r.full_name}
                                  {r.resident_status
                                    ? ` (${r.resident_status})`
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="start_date">
                          Start Date{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="start_date"
                          type="date"
                          required
                          value={assignData.start_date}
                          onChange={(e) =>
                            setAssignData({
                              ...assignData,
                              start_date: e.target.value,
                            })
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
                      <Button
                        type="submit"
                        disabled={assignSubmitting || loadingResidents}
                      >
                        {assignSubmitting && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        {assignSubmitting ? 'Assigning...' : 'Assign'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resident History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            Resident History
          </CardTitle>
        </CardHeader>

        <CardContent>
          {houseResidentHistory.length > 0 ? (() => {
            const sorted = [...houseResidentHistory].sort(
              (a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0)
            );
            const totalPages = Math.max(1, Math.ceil(sorted.length / HISTORY_PER_PAGE));
            const safePage = Math.min(historyPage, totalPages);
            const paginated = sorted.slice((safePage - 1) * HISTORY_PER_PAGE, safePage * HISTORY_PER_PAGE);

            return (<>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((hr, idx) => (
                    <TableRow key={hr.id || idx}>
                      <TableCell className="font-medium">
                        {hr.resident?.full_name || '-'}
                      </TableCell>
                      <TableCell>{formatDate(hr.start_date)}</TableCell>
                      <TableCell>{formatDate(hr.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant={hr.is_active ? 'default' : 'secondary'}>
                          {hr.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages} ({sorted.length} records)
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(safePage - 1)} disabled={safePage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(safePage + 1)} disabled={safePage >= totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>);
          })() : (
            <p className="text-center py-6 text-sm text-muted-foreground">
              No resident history yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            Payment History
          </CardTitle>
        </CardHeader>

        <CardContent>
          {paymentList.length > 0 ? (() => {
            const sorted = [...paymentList].sort((a, b) => {
              const dateA = `${a.year}-${String(a.month).padStart(2, '0')}`;
              const dateB = `${b.year}-${String(b.month).padStart(2, '0')}`;
              return dateB.localeCompare(dateA);
            });
            const totalPages = Math.max(1, Math.ceil(sorted.length / PAYMENT_PER_PAGE));
            const safePage = Math.min(paymentPage, totalPages);
            const paginated = sorted.slice((safePage - 1) * PAYMENT_PER_PAGE, safePage * PAYMENT_PER_PAGE);

            return (<>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((p, idx) => {
                    const monthName = new Date(
                      p.year,
                      (p.month || 1) - 1
                    ).toLocaleDateString('en-US', { month: 'long' });
                    const isPaid = p.status === 'paid';

                    return (
                      <TableRow key={p.id || idx}>
                        <TableCell className="font-medium">
                          {monthName} {p.year}
                        </TableCell>
                        <TableCell className="capitalize">
                          {p.fee_type || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(p.amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPaid ? 'default' : 'destructive'}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(p.payment_date)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {safePage} of {totalPages} ({sorted.length} records)
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPaymentPage(safePage - 1)} disabled={safePage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPaymentPage(safePage + 1)} disabled={safePage >= totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>);
          })() : (
            <p className="text-center py-6 text-sm text-muted-foreground">
              No payment history yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
