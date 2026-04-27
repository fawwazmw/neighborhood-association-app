<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\HouseResident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /**
     * List payments with filters and pagination.
     * Supports: month, year, fee_type, status, house_id.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Payment::with(['houseResident.house', 'houseResident.resident']);

            if ($request->filled('month')) {
                $query->where('month', $request->month);
            }

            if ($request->filled('year')) {
                $query->where('year', $request->year);
            }

            if ($request->filled('fee_type')) {
                $query->where('fee_type', $request->fee_type);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('house_id')) {
                $query->whereHas('houseResident', function ($q) use ($request) {
                    $q->where('house_id', $request->house_id);
                });
            }

            $payments = $query->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $payments,
                'message' => 'Payment data retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve payment data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a single payment record.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'house_resident_id' => 'required|exists:house_residents,id',
                'fee_type' => 'required|in:security,cleaning',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2020',
                'amount' => 'required|numeric|min:0',
                'payment_date' => 'nullable|date',
                'status' => 'required|in:paid,unpaid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();

            // If status is paid and payment_date is null, set today
            if ($data['status'] === 'paid' && empty($data['payment_date'])) {
                $data['payment_date'] = Carbon::today();
            }

            $payment = Payment::create($data);
            $payment->load(['houseResident.house', 'houseResident.resident']);

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create multiple payment records for a range of months (bulk/annual).
     * Uses updateOrCreate to skip months that already have a record.
     */
    public function storeBulk(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'house_resident_id' => 'required|exists:house_residents,id',
                'fee_type' => 'required|in:security,cleaning',
                'year' => 'required|integer|min:2020',
                'start_month' => 'required|integer|min:1|max:12',
                'end_month' => 'required|integer|min:1|max:12|gte:start_month',
                'amount' => 'required|numeric|min:0',
                'status' => 'required|in:paid,unpaid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();
            $records = [];

            for ($month = $data['start_month']; $month <= $data['end_month']; $month++) {
                $paymentDate = null;
                if ($data['status'] === 'paid') {
                    $paymentDate = Carbon::today();
                }

                $record = Payment::updateOrCreate(
                    [
                        'house_resident_id' => $data['house_resident_id'],
                        'fee_type' => $data['fee_type'],
                        'month' => $month,
                        'year' => $data['year'],
                    ],
                    [
                        'amount' => $data['amount'],
                        'status' => $data['status'],
                        'payment_date' => $paymentDate,
                    ]
                );

                $records[] = $record;
            }

            return response()->json([
                'success' => true,
                'data' => $records,
                'message' => count($records) . ' payments created/updated successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create bulk payments: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single payment with relationships.
     */
    public function show($id): JsonResponse
    {
        try {
            $payment = Payment::with(['houseResident.house', 'houseResident.resident'])->find($id);

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Payment not found.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $payment,
                'message' => 'Payment details retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve payment details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a payment record.
     * If status changed to paid and payment_date is null, set to today.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $payment = Payment::find($id);

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Payment not found.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'house_resident_id' => 'nullable|exists:house_residents,id',
                'fee_type' => 'nullable|in:security,cleaning',
                'month' => 'nullable|integer|min:1|max:12',
                'year' => 'nullable|integer|min:2020',
                'amount' => 'nullable|numeric|min:0',
                'payment_date' => 'nullable|date',
                'status' => 'nullable|in:paid,unpaid',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();

            // If status changed to paid and payment_date is not provided, set to today
            $newStatus = $data['status'] ?? $payment->status;
            $newPaymentDate = $data['payment_date'] ?? $payment->payment_date;

            if ($newStatus === 'paid' && empty($newPaymentDate)) {
                $data['payment_date'] = Carbon::today();
            }

            $payment->update($data);

            return response()->json([
                'success' => true,
                'data' => $payment->fresh()->load(['houseResident.house', 'houseResident.resident']),
                'message' => 'Payment updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a payment record.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $payment = Payment::find($id);

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Payment not found.',
                ], 404);
            }

            $payment->delete();

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Payment deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to delete payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate monthly bills for all active residents.
     * Creates payment records for security (100000) and cleaning (15000).
     */
    public function generateBills(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2020',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $month = $request->month;
            $year = $request->year;
            $count = 0;

            // Get all active house_resident records
            $activeRecords = HouseResident::where('is_active', true)->get();

            $feeTypes = [
                'security' => 100000,
                'cleaning' => 15000,
            ];

            foreach ($activeRecords as $record) {
                foreach ($feeTypes as $type => $amount) {
                    // Only create if it doesn't already exist
                    $exists = Payment::where('house_resident_id', $record->id)
                        ->where('fee_type', $type)
                        ->where('month', $month)
                        ->where('year', $year)
                        ->exists();

                    if (!$exists) {
                        Payment::create([
                            'house_resident_id' => $record->id,
                            'fee_type' => $type,
                            'month' => $month,
                            'year' => $year,
                            'amount' => $amount,
                            'status' => 'unpaid',
                            'payment_date' => null,
                        ]);
                        $count++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'month' => $month,
                    'year' => $year,
                    'bills_created' => $count,
                    'active_residents' => $activeRecords->count(),
                ],
                'message' => $count . ' bills generated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to generate bills: ' . $e->getMessage(),
            ], 500);
        }
    }
}
