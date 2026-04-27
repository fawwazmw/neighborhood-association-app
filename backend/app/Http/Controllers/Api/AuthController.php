<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Login and create session.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'data' => $validator->errors(),
                'message' => 'Validation failed.',
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'data' => Auth::user(),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Logout and invalidate session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
            'message' => 'User retrieved successfully.',
        ]);
    }
}
