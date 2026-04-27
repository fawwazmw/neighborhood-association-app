<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ResidentController extends Controller
{
    /**
     * List all residents with pagination.
     * Supports search by full_name via ?search= query param.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Resident::with(['houseResidents' => function ($q) {
                $q->where('is_active', true)->with('house');
            }]);

            if ($request->has('search') && $request->search !== '') {
                $query->where('full_name', 'like', '%' . $request->search . '%');
            }

            $residents = $query->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $residents,
                'message' => 'Resident data retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve resident data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new resident.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'full_name' => 'required|string|max:255',
                'id_photo' => 'nullable|image|max:2048',
                'resident_status' => 'required|in:permanent,contract',
                'phone_number' => 'required|string|max:20',
                'marital_status' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();

            if ($request->hasFile('id_photo')) {
                $data['id_photo'] = $request->file('id_photo')->store('id-photos', 'public');
            }

            $resident = Resident::create($data);

            return response()->json([
                'success' => true,
                'data' => $resident,
                'message' => 'Resident created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to create resident: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single resident with houseResidents.house relationship.
     */
    public function show($id): JsonResponse
    {
        try {
            $resident = Resident::with('houseResidents.house')->find($id);

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Resident not found.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $resident,
                'message' => 'Resident details retrieved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve resident details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a resident.
     * Handles id_photo replacement (deletes old file if new one uploaded).
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $resident = Resident::find($id);

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Resident not found.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'full_name' => 'nullable|string|max:255',
                'id_photo' => 'nullable|image|max:2048',
                'resident_status' => 'nullable|in:permanent,contract',
                'phone_number' => 'nullable|string|max:20',
                'marital_status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'data' => $validator->errors(),
                    'message' => 'Validation failed.',
                ], 422);
            }

            $data = $validator->validated();

            if ($request->hasFile('id_photo')) {
                // Delete old photo if exists
                if ($resident->id_photo) {
                    Storage::disk('public')->delete($resident->id_photo);
                }
                $data['id_photo'] = $request->file('id_photo')->store('id-photos', 'public');
            }

            $resident->update($data);

            return response()->json([
                'success' => true,
                'data' => $resident->fresh(),
                'message' => 'Resident updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update resident: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a resident and their ID photo.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $resident = Resident::find($id);

            if (!$resident) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'Resident not found.',
                ], 404);
            }

            // Delete ID photo if exists
            if ($resident->id_photo) {
                Storage::disk('public')->delete($resident->id_photo);
            }

            $resident->delete();

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Resident deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to delete resident: ' . $e->getMessage(),
            ], 500);
        }
    }
}
