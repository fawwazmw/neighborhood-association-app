<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    /**
     * Month names.
     */
    private array $monthNames = [
        1 => 'January',
        2 => 'February',
        3 => 'March',
        4 => 'April',
        5 => 'May',
        6 => 'June',
        7 => 'July',
        8 => 'August',
        9 => 'September',
        10 => 'October',
        11 => 'November',
        12 => 'December',
    ];

    /**
     * Get yearly summary with monthly breakdown.
     * Income = sum of payments where status='paid'.
     * Expenses = sum of expenses for that month/year.
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'required|integer|min:2020',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $year = $request->year;

            // Get monthly income (from paid payments)
            $incomePerMonth = Payment::where('year', $year)
                ->where('status', 'paid')
                ->groupBy('month')
                ->select('month', DB::raw('SUM(amount) as total'))
                ->pluck('total', 'month')
                ->toArray();

            // Get monthly expenses
            $expensesPerMonth = Expense::whereYear('date', $year)
                ->select(DB::raw('MONTH(date) as month'), DB::raw('SUM(amount) as total'))
                ->groupBy(DB::raw('MONTH(date)'))
                ->pluck('total', 'month')
                ->toArray();

            // Build monthly summary for all 12 months
            $summary = [];
            $totalIncome = 0;
            $totalExpenses = 0;

            for ($month = 1; $month <= 12; $month++) {
                $income = (float) ($incomePerMonth[$month] ?? 0);
                $expense = (float) ($expensesPerMonth[$month] ?? 0);
                $balance = $income - $expense;

                $summary[] = [
                    'month' => $month,
                    'month_name' => $this->monthNames[$month],
                    'income' => $income,
                    'expenses' => $expense,
                    'balance' => $balance,
                ];

                $totalIncome += $income;
                $totalExpenses += $expense;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'year' => (int) $year,
                    'summary' => $summary,
                    'total_income' => $totalIncome,
                    'total_expenses' => $totalExpenses,
                    'final_balance' => $totalIncome - $totalExpenses,
                ],
                'message' => 'Yearly report retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve yearly report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get monthly detail with itemized income and expenses.
     */
    public function detail(Request $request): JsonResponse
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

            $month = (int) $request->month;
            $year = (int) $request->year;

            // Get detailed income (paid payments for this month/year)
            $paymentRecords = Payment::with(['houseResident.house', 'houseResident.resident'])
                ->where('month', $month)
                ->where('year', $year)
                ->get();

            $incomeDetails = $paymentRecords->map(function ($item) {
                return [
                    'house' => $item->houseResident->house->house_number ?? '-',
                    'resident' => $item->houseResident->resident->full_name ?? '-',
                    'fee_type' => $item->fee_type,
                    'amount' => (float) $item->amount,
                    'payment_date' => $item->payment_date?->format('Y-m-d'),
                    'status' => $item->status,
                ];
            });

            $totalIncome = (float) $paymentRecords
                ->where('status', 'paid')
                ->sum('amount');

            // Get detailed expenses for this month/year
            $expenseRecords = Expense::whereYear('date', $year)
                ->whereMonth('date', $month)
                ->orderBy('date', 'desc')
                ->get();

            $expenseDetails = $expenseRecords->map(function ($item) {
                return [
                    'category' => $item->category,
                    'description' => $item->description,
                    'amount' => (float) $item->amount,
                    'date' => $item->date->format('Y-m-d'),
                ];
            });

            $totalExpenses = (float) $expenseRecords->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'month' => $month,
                    'year' => $year,
                    'month_name' => $this->monthNames[$month],
                    'income' => [
                        'total' => $totalIncome,
                        'detail' => $incomeDetails,
                    ],
                    'expenses' => [
                        'total' => $totalExpenses,
                        'detail' => $expenseDetails,
                    ],
                    'balance' => $totalIncome - $totalExpenses,
                ],
                'message' => 'Monthly report retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve monthly report: ' . $e->getMessage(),
            ], 500);
        }
    }
}
