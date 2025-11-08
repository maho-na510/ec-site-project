<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\V1\Admin\AuthController;
use App\Http\Controllers\API\V1\Admin\ProductController;
use App\Http\Controllers\API\V1\Admin\InventoryController;
use App\Http\Controllers\API\V1\Admin\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Admin API is running',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Admin API v1
Route::prefix('v1/admin')->group(function () {
    // Public routes (no authentication required)
    Route::post('/auth/login', [AuthController::class, 'login'])->name('admin.login');

    // Protected routes (authentication required)
    Route::middleware('auth:api')->group(function () {
        // Auth routes
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('admin.logout');
        Route::post('/auth/refresh', [AuthController::class, 'refresh'])->name('admin.refresh');
        Route::get('/auth/me', [AuthController::class, 'me'])->name('admin.me');

        // Product routes
        Route::get('/products', [ProductController::class, 'index'])->name('admin.products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('admin.products.store');
        Route::get('/products/low-stock', [ProductController::class, 'lowStock'])->name('admin.products.low-stock');
        Route::get('/products/{product}', [ProductController::class, 'show'])->name('admin.products.show');
        Route::put('/products/{product}', [ProductController::class, 'update'])->name('admin.products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
        Route::patch('/products/{product}/toggle-suspension', [ProductController::class, 'toggleSuspension'])
            ->name('admin.products.toggle-suspension');

        // Inventory routes
        Route::post('/inventory/{product}/adjust', [InventoryController::class, 'adjustStock'])
            ->name('admin.inventory.adjust');
        Route::post('/inventory/{product}/set', [InventoryController::class, 'setStock'])
            ->name('admin.inventory.set');
        Route::post('/inventory/bulk-adjust', [InventoryController::class, 'bulkAdjust'])
            ->name('admin.inventory.bulk-adjust');
        Route::get('/inventory/{product}/history', [InventoryController::class, 'history'])
            ->name('admin.inventory.history');
        Route::get('/inventory/logs', [InventoryController::class, 'logs'])
            ->name('admin.inventory.logs');
        Route::get('/inventory/statistics', [InventoryController::class, 'statistics'])
            ->name('admin.inventory.statistics');
        Route::get('/inventory/needs-restock', [InventoryController::class, 'needsRestock'])
            ->name('admin.inventory.needs-restock');

        // Report routes
        Route::post('/reports/inventory', [ReportController::class, 'generateInventoryReport'])
            ->name('admin.reports.inventory');
        Route::post('/reports/sales', [ReportController::class, 'generateSalesReport'])
            ->name('admin.reports.sales');
        Route::get('/reports', [ReportController::class, 'list'])
            ->name('admin.reports.list');
        Route::get('/reports/download', [ReportController::class, 'download'])
            ->name('admin.reports.download');
        Route::delete('/reports/cleanup', [ReportController::class, 'cleanup'])
            ->name('admin.reports.cleanup');
    });
});
