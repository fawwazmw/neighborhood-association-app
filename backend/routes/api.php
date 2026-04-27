<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes (public)
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // Residents
    Route::apiResource('residents', ResidentController::class);

    // Houses
    Route::apiResource('houses', HouseController::class)->except(['destroy']);
    Route::post('houses/{id}/assign-resident', [HouseController::class, 'assignResident']);
    Route::post('houses/{id}/remove-resident', [HouseController::class, 'removeResident']);
    Route::get('houses/{id}/history', [HouseController::class, 'history']);

    // Payments
    Route::apiResource('payments', PaymentController::class);
    Route::post('payments-bulk', [PaymentController::class, 'storeBulk']);
    Route::post('payments-generate', [PaymentController::class, 'generateBills']);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class);

    // Reports
    Route::get('reports/summary', [ReportController::class, 'summary']);
    Route::get('reports/detail', [ReportController::class, 'detail']);
});
