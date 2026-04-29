<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\HouseResident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class HouseController extends Controller
{
    /**
     * List all houses with active residents.
     * Appends occupancy_status accessor. Supports search by house_number.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = House::with(['houseResidents' => function ($q) {
                $q->where('is_active', true)->with('resident');
            }]);

            if ($request->has('search') && $request->search !== '') {
                $query->where('house_number', 'like', '%' . $request->search . '%');
            }

            $houses = $query->get()->each(function ($item) {
                $item->append('occupancy_status');
            });

            return response()->json([
                'success' => true,
                'data' => $houses,
                'message' => 'House data retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve house data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new house.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'house_number' => 'required|string|max:10|unique:houses',
                'address' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $house = House::create($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $house,
                'message' => 'House created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create house: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single house with ALL houseResident history, residents, and payments.
     */
    public function show($id): JsonResponse
    {
        try {
            $house = House::with(['houseResidents' => function ($q) {
                $q->with(['resident', 'payments'])->orderBy('start_date', 'desc');
            }])->find($id);

            if (!$house) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'House not found.',
                ], 404);
            }

            $house->append('occupancy_status');

            return response()->json([
                'success' => true,
                'data' => $house,
                'message' => 'House details retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve house details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a house.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $house = House::find($id);

            if (!$house) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'House not found.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'house_number' => 'nullable|string|max:10|unique:houses,house_number,' . $id,
                'address' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $house->update($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $house->fresh(),
                'message' => 'House updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update house: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Assign a resident to this house.
     * Deactivates any current active houseResident first.
     */
    public function assignResident(Request $request, $id): JsonResponse
    {
        try {
            $house = House::find($id);

            if (!$house) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'House not found.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'resident_id' => 'required|exists:residents,id',
                'start_date' => 'required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            // Deactivate current active houseResident for this house
            HouseResident::where('house_id', $id)
                ->where('is_active', true)
                ->update([
                    'is_active' => false,
                    'end_date' => Carbon::today(),
                ]);

            // Deactivate this resident's previous house assignment (if any)
            HouseResident::where('resident_id', $request->resident_id)
                ->where('is_active', true)
                ->update([
                    'is_active' => false,
                    'end_date' => Carbon::today(),
                ]);

            // Create new houseResident record
            $houseResident = HouseResident::create([
                'house_id' => $id,
                'resident_id' => $request->resident_id,
                'start_date' => $request->start_date,
                'is_active' => true,
            ]);

            $houseResident->load(['house', 'resident']);

            return response()->json([
                'success' => true,
                'data' => $houseResident,
                'message' => 'Resident assigned to house successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to assign resident to house: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove current resident from house.
     * Sets is_active=false and end_date=today.
     */
    public function removeResident($id): JsonResponse
    {
        try {
            $house = House::find($id);

            if (!$house) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'House not found.',
                ], 404);
            }

            $activeRecord = HouseResident::where('house_id', $id)
                ->where('is_active', true)
                ->first();

            if (!$activeRecord) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'No active resident in this house.',
                ], 404);
            }

            $activeRecord->update([
                'is_active' => false,
                'end_date' => Carbon::today(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $activeRecord->fresh()->load(['house', 'resident']),
                'message' => 'Resident removed from house successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to remove resident from house: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all houseResident records (history) for this house.
     */
    public function history($id): JsonResponse
    {
        try {
            $house = House::find($id);

            if (!$house) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'House not found.',
                ], 404);
            }

            $history = HouseResident::where('house_id', $id)
                ->with('resident')
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'House resident history retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve house resident history: ' . $e->getMessage(),
            ], 500);
        }
    }
}
