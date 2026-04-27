import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { paymentApi, houseApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FEE_AMOUNTS = {
  security: 100000,
  cleaning: 15000,
};

const formatRupiah = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

export default function PaymentForm() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Tab state
  const [mode, setMode] = useState('single');

  // House options
  const [houses, setHouses] = useState([]);
  const [loadingHouses, setLoadingHouses] = useState(true);

  // Form state — shared
  const [houseResidentId, setHouseResidentId] = useState('');
  const [feeType, setFeeType] = useState('security');
  const [year, setYear] = useState(String(currentYear));
  const [amount, setAmount] = useState(FEE_AMOUNTS.security);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  // Single mode
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  // Bulk mode
  const [startMonth, setStartMonth] = useState('1');
  const [endMonth, setEndMonth] = useState('12');

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // ── Load houses ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchHouses = async () => {
      setLoadingHouses(true);
      try {
        const res = await houseApi.getAll();
        const allHouses = res.data?.data || [];

        const occupiedHouses = allHouses.filter((house) => {
          const residentList = house.house_residents || house.residents || [];
          if (Array.isArray(residentList)) {
            return residentList.some(
              (hr) => hr.is_active || hr.is_active === 1
            );
          }
          return false;
        });

        const options = occupiedHouses.map((house) => {
          const residentList = house.house_residents || house.residents || [];
          const activeHr = Array.isArray(residentList)
            ? residentList.find(
                (hr) => hr.is_active || hr.is_active === 1
              )
            : null;

          const residentName =
            activeHr?.resident?.full_name ||
            activeHr?.full_name ||
            house.active_resident?.full_name ||
            '-';

          return {
            id: String(activeHr?.id || house.id),
            houseNumber: house.house_number,
            residentName,
            label: `${house.house_number} — ${residentName}`,
          };
        });

        setHouses(options);
        if (options.length > 0) {
          setHouseResidentId(options[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch houses:', err);
        toast.error('Failed to load house data.');
      } finally {
        setLoadingHouses(false);
      }
    };

    fetchHouses();
  }, []);

  // ── Auto-fill amount when fee_type changes ────────────────────────────────
  useEffect(() => {
    setAmount(FEE_AMOUNTS[feeType] || 0);
  }, [feeType]);

  // ── Bulk info ─────────────────────────────────────────────────────────────
  const bulkCount =
    Number(endMonth) >= Number(startMonth)
      ? Number(endMonth) - Number(startMonth) + 1
      : 0;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'single') {
        await paymentApi.create({
          house_resident_id: houseResidentId,
          fee_type: feeType,
          month: Number(month),
          year: Number(year),
          amount,
          status: paymentStatus,
        });
      } else {
        await paymentApi.createBulk({
          house_resident_id: houseResidentId,
          fee_type: feeType,
          year: Number(year),
          start_month: Number(startMonth),
          end_month: Number(endMonth),
          amount,
          status: paymentStatus,
        });
      }
      toast.success(
        mode === 'single'
          ? 'Payment created successfully.'
          : `${bulkCount} payments created successfully.`
      );
      navigate('/payments');
    } catch (err) {
      console.error('Failed to create payment:', err);
      const message =
        err.response?.data?.message ||
        'Failed to save payment. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/payments')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Payment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new fee payment
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <Tabs value={mode} onValueChange={setMode}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Payment</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Payment</TabsTrigger>
            </TabsList>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-5">
              {/* House */}
              <div className="space-y-2">
                <Label>
                  House <span className="text-destructive">*</span>
                </Label>
                {loadingHouses ? (
                  <div className="h-10 bg-muted rounded-md animate-pulse" />
                ) : houses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No houses with active residents available.
                  </p>
                ) : (
                  <Select
                    value={houseResidentId}
                    onValueChange={setHouseResidentId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {houses.find((h) => h.id === houseResidentId)?.label || 'Select a house'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Fee Type */}
              <div className="space-y-2">
                <Label>
                  Fee Type <span className="text-destructive">*</span>
                </Label>
                <Select value={feeType} onValueChange={setFeeType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label>
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={2000}
                  max={2100}
                  required
                />
              </div>

              {/* Single: Month */}
              <TabsContent value="single" className="mt-0 space-y-5">
                <div className="space-y-2">
                  <Label>
                    Month <span className="text-destructive">*</span>
                  </Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {MONTH_NAMES[Number(month) - 1] || 'Select month'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((name, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Bulk: Start Month & End Month */}
              <TabsContent value="bulk" className="mt-0 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Start Month <span className="text-destructive">*</span>
                    </Label>
                    <Select value={startMonth} onValueChange={setStartMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {MONTH_NAMES[Number(startMonth) - 1] || 'Start month'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((name, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      End Month <span className="text-destructive">*</span>
                    </Label>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {MONTH_NAMES[Number(endMonth) - 1] || 'End month'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((name, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bulk info */}
                {startMonth && endMonth && (
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
                    This will create <strong>{bulkCount}</strong> payments (
                    {MONTH_NAMES[Number(startMonth) - 1]} —{' '}
                    {MONTH_NAMES[Number(endMonth) - 1]} {year}) with a total of{' '}
                    <strong>{formatRupiah(amount * bulkCount)}</strong>
                  </div>
                )}
              </TabsContent>

              {/* Amount */}
              <div className="space-y-2">
                <Label>
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={0}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formatRupiah(amount)}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/payments')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || houses.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
