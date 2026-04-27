<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * List expenses with filters and pagination.
     * Supports: month, year, category.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Expense::query();

            if ($request->filled('month')) {
                $query->whereMonth('date', $request->month);
            }

            if ($request->filled('year')) {
                $query->whereYear('date', $request->year);
            }

            if ($request->filled('category')) {
                $query->where('category', 'like', '%' . $request->category . '%');
            }

            $expenses = $query->orderBy('date', 'desc')->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $expenses,
                'message' => 'Expense data retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve expense data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new expense.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'category' => 'required|string|max:100',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'date' => 'required|date',
                'is_recurring' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();

            // Set default for is_recurring if not provided
            if (!isset($data['is_recurring'])) {
                $data['is_recurring'] = false;
            }

            $expense = Expense::create($data);

            return response()->json([
                'success' => true,
                'data' => $expense,
                'message' => 'Expense created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create expense: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single expense.
     */
    public function show($id): JsonResponse
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Expense not found.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $expense,
                'message' => 'Expense details retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve expense details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an expense.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Expense not found.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'category' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'amount' => 'nullable|numeric|min:0',
                'date' => 'nullable|date',
                'is_recurring' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $expense->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $expense->fresh(),
                'message' => 'Expense updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update expense: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an expense.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Expense not found.',
                ], 404);
            }

            $expense->delete();

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Expense deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to delete expense: ' . $e->getMessage(),
            ], 500);
        }
    }
}
